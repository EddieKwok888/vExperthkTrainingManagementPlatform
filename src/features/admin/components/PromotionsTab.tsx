import React, { useState } from 'react';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Sparkles, Plus, Users, Search, HelpCircle, X, Calendar, DollarSign, Mail, Phone, CalendarCheck } from 'lucide-react';
import { format } from 'date-fns';

export const PROMO_CATEGORIES = [
  { value: 'seminar', label: 'Seminar Exclusive' },
  { value: 'event', label: 'Workshop / Event Special' },
  { value: 'welcome', label: 'Welcome Offer' },
  { value: 'loyalty', label: 'Alumni / Referral' },
  { value: 'kol', label: 'KOL Partner' },
  { value: 'corporate', label: 'Corporate / School Co-brand' }
];

export const PROMO_CATEGORY_MAP: Record<string, { label: string, classes: string }> = {
  seminar: { label: 'Seminar Exclusive', classes: 'bg-purple-100 text-purple-700 border-purple-200' },
  event: { label: 'Workshop/Event', classes: 'bg-amber-100 text-amber-700 border-amber-200' },
  welcome: { label: 'Welcome Offer', classes: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  loyalty: { label: 'Alumni Referral', classes: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
  kol: { label: 'KOL Partner', classes: 'bg-rose-100 text-rose-700 border-rose-200' },
  corporate: { label: 'Co-brand Promo', classes: 'bg-cyan-100 text-cyan-700 border-cyan-200' }
};

export function matchRegistrationToPromo(r: any, p: any): boolean {
  if (!r || !p) return false;
  
  // Rule 1: Match by promoId explicitly if set
  if (r.promoId && p.id && r.promoId === p.id) {
    return true;
  }
  
  // Rule 2: Match by promoCode (case-insensitive string comparison) vs p.code (for code-based promos)
  const rCode = typeof r.promoCode === 'string' ? r.promoCode.trim().toUpperCase() : '';
  const pCode = typeof p.code === 'string' ? p.code.trim().toUpperCase() : '';
  
  if (pCode !== '' && rCode !== '' && rCode === pCode) {
    return true;
  }
  
  // Rule 3: Match when r.promoCode matches the promo title (p.name) - very common for bundles
  const pName = typeof p.name === 'string' ? p.name.trim().toUpperCase() : '';
  if (pName !== '' && rCode !== '' && rCode === pName) {
    return true;
  }
  
  // Rule 4: Loose fallback if registration's promoCode is actually the promotion's ID
  const pIdUpper = typeof p.id === 'string' ? p.id.trim().toUpperCase() : '';
  if (pIdUpper !== '' && rCode !== '' && rCode === pIdUpper) {
    return true;
  }
  
  return false;
}

interface PromotionsTabProps {
  promotions: any[];
  promoCategoryFilter: string;
  setPromoCategoryFilter: (val: string) => void;
  regs: any[];
  setSelectedPromo: (promo: any) => void;
  setPromoForm: (form: any) => void;
  setIsPromoModalOpen: (val: boolean) => void;
  setPromoToDelete: (promo: any) => void;
  setIsDeletePromoModalOpen: (val: boolean) => void;
  courses?: any[];
  sessions?: any[];
}

export function PromotionsTab({
  promotions,
  promoCategoryFilter,
  setPromoCategoryFilter,
  regs,
  setSelectedPromo,
  setPromoForm,
  setIsPromoModalOpen,
  setPromoToDelete,
  setIsDeletePromoModalOpen,
  courses = [],
  sessions = [],
}: PromotionsTabProps) {
  const [viewingPromoUsers, setViewingPromoUsers] = useState<any | null>(null);
  const [showInactive, setShowInactive] = useState<boolean>(false);

  const formatRegDate = (createdAt: any) => {
    if (!createdAt) return 'N/A';
    if (typeof createdAt.toDate === 'function') {
      return format(createdAt.toDate(), 'yyyy-MM-dd HH:mm');
    }
    try {
      return format(new Date(createdAt), 'yyyy-MM-dd HH:mm');
    } catch (e) {
      return 'N/A';
    }
  };

  const isPromoExpired = (p: any) => {
    if (!p.endDate) return false;
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      const endOnly = p.endDate.split('T')[0];
      return endOnly < todayStr;
    } catch (e) {
      return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-500"/> Promotions & Discounts</h3>
          <p className="text-xs text-slate-500 mt-1">Manage, categorize and track promotional performance by marketing channel.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold whitespace-nowrap">Channel Filter:</span>
            <select 
              className="flex h-9 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              value={promoCategoryFilter} 
              onChange={e => setPromoCategoryFilter(e.target.value)}
            >
              <option value="all">All Channels / Categories</option>
              {PROMO_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          <Button 
            variant={showInactive ? "default" : "outline"}
            onClick={() => setShowInactive(!showInactive)}
            className={`text-xs font-bold h-9 shadow-sm px-3 border transition-colors ${showInactive ? 'bg-slate-700 hover:bg-slate-800 text-white border-transparent' : 'text-slate-650 hover:bg-slate-50 border-slate-205 bg-white'}`}
          >
            {showInactive ? "Hide Inactive Promos" : "Show Inactive Promos"}
          </Button>
          <Button onClick={() => {
            setSelectedPromo(null);
            setPromoForm({ name: '', code: '', type: 'code', category: 'seminar', discountType: 'fixed', discountValue: 0, status: 'active', applicableCourseIds: [], bundleCourse1: '', bundleCourse2: '', startDate: '', endDate: '', adminPassword: '' });
            setIsPromoModalOpen(true);
          }} className="bg-indigo-600 hover:bg-indigo-700 text-white shadow font-semibold text-xs h-9 gap-1 animate-none">
            <Plus className="w-4 h-4" /> Add Promotion
          </Button>
        </div>
      </div>
      
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Promo Channel</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Type</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Promo Code / Conditions</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Value</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Validity Period</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Usage & ROI</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans">Status</TableHead>
                <TableHead className="text-xs font-bold text-slate-500 font-sans text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promotions
                .filter(p => {
                  const matchesCategory = promoCategoryFilter === 'all' || p.category === promoCategoryFilter;
                  const expired = isPromoExpired(p);
                  const isInactive = p.status === 'inactive' || expired;
                  if (!showInactive && isInactive) {
                    return false;
                  }
                  return matchesCategory;
                })
                .map((p) => {
                  const verifiedRegs = regs.filter((r: any) => matchRegistrationToPromo(r, p) && r.status === 'verified');
                  const pendingRegs = regs.filter((r: any) => matchRegistrationToPromo(r, p) && r.status !== 'verified' && r.status !== 'rejected');
                  
                  const displayUsage = verifiedRegs.length;
                  const totalRevenue = verifiedRegs.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
                  const catInfo = PROMO_CATEGORY_MAP[p.category || 'seminar'] || { label: 'Seminar Exclusive', classes: 'bg-purple-100 text-purple-700 border-purple-200' };
                  const expired = isPromoExpired(p);
                  const isInactiveStatus = p.status === 'inactive' || expired;

                  return (
                    <TableRow key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-bold text-slate-800">{p.name}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${catInfo.classes}`}>
                          {catInfo.label}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-600 text-xs font-semibold">
                        {p.type === 'bundle' ? 'Bundle' : 'Code'}
                      </TableCell>
                      <TableCell>
                        {p.type === 'code' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-50 text-slate-700 border border-slate-200">{p.code}</span>
                        ) : p.type === 'bundle' ? (
                            <span className="text-xs text-slate-505 italic">Buy 2 courses together</span>
                        ) : '-'}
                      </TableCell>
                      <TableCell>
                         <span className="font-extrabold text-red-600 text-xs">-HKD ${p.discountValue}</span>
                      </TableCell>
                      <TableCell className="text-[11px] text-slate-600 leading-normal">
                         <div>Start: {p.startDate ? format(new Date(p.startDate), 'yyyy-MM-dd') : 'Any time'}</div>
                         <div>End: {p.endDate ? format(new Date(p.endDate), 'yyyy-MM-dd') : 'No expiry'}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-xs font-extrabold text-indigo-600">HKD ${totalRevenue.toLocaleString()}</div>
                          <div className="text-[10px] font-bold tracking-tight flex flex-col gap-0.5">
                            <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-150 w-fit">{displayUsage} Confirmed</span>
                            {pendingRegs.length > 0 && (
                              <span className="bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded border border-amber-200 w-fit normal-case">{pendingRegs.length} Pending</span>
                            )}
                          </div>
                          <div>
                            <Button
                              variant="link"
                              className="p-0 h-auto text-[10px] text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1 mt-1 justify-start shadow-none"
                              onClick={() => setViewingPromoUsers(p)}
                            >
                              <Users className="w-3.5 h-3.5" /> View Applicants
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                         <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${!isInactiveStatus ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                           {!isInactiveStatus ? 'Active' : 'Inactive'}
                         </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {!isInactiveStatus ? (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 text-indigo-600 hover:text-indigo-900 font-bold text-xs"
                                onClick={() => {
                                   let b1 = '';
                                   let b2 = '';
                                   if (p.type === 'bundle' && p.conditions?.requiredCourseIds) {
                                       b1 = p.conditions.requiredCourseIds[0] || '';
                                       b2 = p.conditions.requiredCourseIds[1] || '';
                                    }
                                   setSelectedPromo(p);
                                   setPromoForm({ 
                                     ...p, 
                                     category: p.category || 'seminar',
                                     startDate: p.startDate ? p.startDate.split('T')[0] : '',
                                     endDate: p.endDate ? p.endDate.split('T')[0] : '',
                                     bundleCourse1: b1, 
                                     bundleCourse2: b2, 
                                     adminPassword: '' 
                                    });
                                   setIsPromoModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-red-600 hover:text-red-900 hover:bg-red-50 font-bold text-xs"
                                onClick={() => {
                                  setPromoToDelete(p);
                                  setIsDeletePromoModalOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic pr-2">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              {promotions.filter(p => {
                const matchesCategory = promoCategoryFilter === 'all' || p.category === promoCategoryFilter;
                const expired = isPromoExpired(p);
                const isInactive = p.status === 'inactive' || expired;
                if (!showInactive && isInactive) {
                  return false;
                }
                return matchesCategory;
              }).length === 0 && (
                <TableRow><TableCell colSpan={9} className="text-center h-24 text-slate-500 text-xs italic">No matching promotions found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Applied Promo Code Applicants List Modal */}
      {viewingPromoUsers && (() => {
        const matchingRegs = regs.filter((r: any) => matchRegistrationToPromo(r, viewingPromoUsers));

        return (
          <Dialog open={viewingPromoUsers !== null} onOpenChange={() => setViewingPromoUsers(null)}>
            <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[85vh] overflow-y-auto overflow-x-hidden">
              <DialogHeader className="pb-4 border-b border-slate-100">
                <DialogTitle className="text-lg font-bold flex items-center gap-2 text-indigo-600">
                  <Users className="w-5 h-5 text-indigo-500" />
                  Applied Promo Applicants: {viewingPromoUsers.name}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 mt-1 font-sans">
                  List of all students who used this promo code ({viewingPromoUsers.code || 'Bundle Offer'}) during checkout.
                </DialogDescription>
              </DialogHeader>

              <div className="py-4">
                {matchingRegs.length === 0 ? (
                  <div className="text-center py-12 text-slate-500">
                    <HelpCircle className="w-12 h-12 mx-auto text-slate-300 stroke-1 mb-2" />
                    <p className="text-sm font-medium">No students have used this code yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {matchingRegs.map((r: any) => {
                      const course = courses.find((c: any) => c.id === r.courseId);
                      const s = sessions.find((se: any) => se.id === r.sessionId);

                      let statusClasses = 'bg-yellow-50 text-yellow-700 border-yellow-200';
                      let displayStatus = 'Unpaid';
                      if (r.status === 'verified') {
                        statusClasses = 'bg-green-50 text-green-700 border-green-200';
                        displayStatus = 'Confirmed';
                      } else if (r.status === 'pending_verification') {
                        statusClasses = 'bg-blue-50 text-blue-700 border-blue-200';
                        displayStatus = 'Pending';
                      } else if (r.status === 'rejected') {
                        statusClasses = 'bg-red-50 text-red-700 border-red-200';
                        displayStatus = 'Rejected';
                      }

                      return (
                        <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-5 shadow-sm hover:border-slate-200 hover:shadow-md transition-all">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
                            {/* Col 1: Student info */}
                            <div className="md:col-span-4 space-y-2.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm leading-tight">{r.studentName}</span>
                                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold border ${statusClasses}`}>
                                  {displayStatus}
                                </span>
                              </div>
                              
                              <div className="space-y-1 text-slate-600 text-xs">
                                <div className="flex items-center gap-1.5 break-all">
                                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span>{r.studentEmail}</span>
                                </div>
                                {r.studentPhone && (
                                  <div className="flex items-center gap-1.5">
                                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                    <span>{r.studentPhone}</span>
                                  </div>
                                )}
                              </div>

                              {(r.company || r.jobTitle) && (
                                <div className="text-[11px] text-slate-650 bg-slate-50 border border-slate-150 px-2 rounded-md mt-1 w-fit leading-relaxed py-0.5">
                                  {r.company && <span>🏢 {r.company}</span>}
                                  {r.company && r.jobTitle && <span className="mx-1">•</span>}
                                  {r.jobTitle && <span>💼 {r.jobTitle}</span>}
                                </div>
                              )}
                            </div>

                            {/* Col 2: Selected Course */}
                            <div className="md:col-span-4 space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1">Selected Course & Intake</span>
                              {r.isBundleParent ? (
                                <div className="space-y-2 border border-indigo-100 bg-indigo-50/10 p-2.5 rounded-lg text-left">
                                  <div className="text-[9px] uppercase font-bold tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-150 px-2 py-0.5 rounded w-fit leading-none mb-1">
                                    📦 2-Course Bundle (Main)
                                  </div>
                                  <div className="space-y-1 pl-1">
                                    <div className="text-xs font-bold text-slate-700">
                                      <span className="text-indigo-605 font-extrabold mr-1">Course 1:</span>
                                      {course?.title || 'Unknown Course'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 pl-4 leading-tight">
                                      Session: <span className="font-semibold text-slate-700">{s?.sessionName || 'Unknown Session'}</span>
                                    </div>
                                  </div>
                                  
                                  {(() => {
                                    const peerC = courses.find((c: any) => c.id === r.peerCourseId);
                                    const peerS = sessions.find((se: any) => se.id === r.peerSessionId);
                                    return (
                                      <div className="space-y-1 pl-1 border-t border-dashed border-indigo-100 mt-2 pt-2">
                                        <div className="text-xs font-bold text-slate-700">
                                          <span className="text-indigo-605 font-extrabold mr-1">Course 2:</span>
                                          {peerC?.title || 'Unknown Course'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 pl-4 leading-tight">
                                          Session: <span className="font-semibold text-slate-700">{peerS?.sessionName || 'Unknown Session'}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              ) : r.isBundleChild ? (
                                <div className="space-y-2 border border-slate-100 bg-slate-50 p-2.5 rounded-lg opacity-85 text-left">
                                  <div className="text-[9px] uppercase font-bold tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-fit leading-none mb-1">
                                    📦 2-Course Bundle (Secondary)
                                  </div>
                                  {(() => {
                                    const parentC = courses.find((c: any) => c.id === r.parentCourseId);
                                    const parentS = sessions.find((se: any) => se.id === r.parentSessionId);
                                    return (
                                      <div className="space-y-1 pl-1">
                                        <div className="text-xs font-medium text-slate-604">
                                          <span className="font-bold text-slate-500 mr-1">Course 1:</span>
                                          {parentC?.title || 'Unknown Course'}
                                        </div>
                                        <div className="text-[11px] text-slate-500 pl-4 leading-tight">
                                          Session: <span className="font-semibold text-slate-600">{parentS?.sessionName || 'Unknown Session'}</span>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                  <div className="space-y-1 pl-1 border-t border-dashed border-slate-200 mt-2 pt-2">
                                    <div className="text-xs font-bold text-slate-700">
                                      <span className="text-indigo-600 font-extrabold mr-1">Course 2:</span>
                                      {course?.title || 'Unknown Course'}
                                    </div>
                                    <div className="text-[11px] text-slate-500 pl-4 leading-tight">
                                      Session: <span className="font-semibold text-slate-700">{s?.sessionName || 'Unknown Session'}</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-left">
                                  <div className="font-bold text-slate-805 text-xs leading-relaxed">{course?.title || 'Unknown Course'}</div>
                                  <div className="text-[10px] font-bold text-indigo-705 bg-indigo-50 border border-indigo-100/70 px-2 py-0.5 rounded w-fit leading-none mt-1.5">
                                    {s?.sessionName || 'Unknown Session'}
                                  </div>
                                </div>
                              )}
                              
                              {r.pax && r.pax > 1 && (
                                <div className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded w-fit leading-none mt-1">
                                  🎫 {r.pax} Seats
                                </div>
                              )}
                            </div>

                            {/* Col 3: Payment/Timeline */}
                            <div className="md:col-span-4 space-y-2 md:text-right flex flex-col md:items-end">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block pb-1">Timeline & Amount</span>
                              <div className="space-y-1 flex flex-col items-start md:items-end">
                                <span className="text-xs text-slate-600 font-medium inline-block">{formatRegDate(r.createdAt)}</span>
                                <span className="text-sm font-black text-slate-900 leading-tight">HKD ${r.amount || 0}</span>
                              </div>
                              <div className="w-full space-y-1 text-xs text-left md:text-right pt-2 border-t border-slate-50 md:border-t-0">
                                {r.invoiceNumber && (
                                  <div className="font-mono text-slate-750">
                                    <span className="text-slate-400 font-bold mr-0.5">Invoice:</span> {r.invoiceNumber}
                                  </div>
                                )}
                                {r.paymentMethod && (
                                  <div className="text-slate-600 flex items-center justify-start md:justify-end gap-1 text-[11px] font-semibold">
                                    <span className="text-slate-400 font-bold">Method:</span> 
                                    <span className="uppercase text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded text-[10px] leading-none font-bold">{r.paymentMethod}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Remarks if present */}
                          {r.remarks && (
                            <div className="text-[11px] text-slate-500 italic bg-yellow-50/40 border border-yellow-100 p-2 rounded mt-2.5 leading-normal max-w-full break-words text-left">
                              <span className="font-bold text-yellow-700 not-italic block text-[9px] uppercase tracking-wider mb-0.5">Student Remarks:</span>
                              "{r.remarks}"
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}

