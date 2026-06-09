import React, { useState, useMemo } from 'react';
import { Search, Download, TrendingUp, Clock, BarChart3, ExternalLink, FileText, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';

interface FinanceTabProps {
  regSearchTerm: string;
  setRegSearchTerm: (val: string) => void;
  regs: any[];
  handleExportCSV: (data: any[], filename: string) => void;
  formatHkDate: (date: any, includeTime?: boolean) => string;
  setPreviewImage: (url: string | null) => void;
  handleGenerateInvoice: (r: any) => void;
  handleUpdateRegStatus: (id: string, status: string) => void;
  editingReg: any;
  setEditingReg: (reg: any | null) => void;
  isEditRegOpen: boolean;
  setIsEditRegOpen: (val: boolean) => void;
  handleUpdateRegistration: (e: React.FormEvent) => void;
  confirmDelete: (id: string, type: string, name: string) => void;
  readOnly?: boolean;
}

export const FinanceTab = React.memo(function FinanceTab({
  regSearchTerm,
  setRegSearchTerm,
  regs,
  handleExportCSV,
  formatHkDate,
  setPreviewImage,
  handleGenerateInvoice,
  handleUpdateRegStatus,
  editingReg,
  setEditingReg,
  isEditRegOpen,
  setIsEditRegOpen,
  handleUpdateRegistration,
  confirmDelete,
  readOnly = false,
}: FinanceTabProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Reset back to page 1 during searching
  React.useEffect(() => {
    setCurrentPage(1);
  }, [regSearchTerm]);

  const filteredRegs = useMemo(() => {
    const searchLower = regSearchTerm.toLowerCase();
    return regs.filter(r => {
      return (
        (r.invoiceNumber || '').toLowerCase().includes(searchLower) ||
        (r.studentName || '').toLowerCase().includes(searchLower) ||
        (r.studentEmail || '').toLowerCase().includes(searchLower) ||
        (r.studentPhone || '').toLowerCase().includes(searchLower)
      );
    });
  }, [regs, regSearchTerm]);

  const paginatedRegs = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredRegs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredRegs, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredRegs.length / itemsPerPage) || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Financial Reports & Payments</h2>
          <p className="text-sm text-slate-500">Track revenue and verify student payments</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search Invoice #, Email, Phone..."
              className="pl-10 w-full sm:w-[350px] h-10 border-slate-200 focus:ring-blue-500 text-xs"
              value={regSearchTerm}
              onChange={(e) => setRegSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" onClick={() => handleExportCSV(filteredRegs.map((r:any) => ({ Invoice: r.invoiceNumber, Student: r.studentName, Amount: r.amount, Method: r.paymentMethod, Status: r.status, Date: formatHkDate(r.createdAt, true) })), 'financial_report')} className="gap-2 h-10 border-slate-200 font-bold text-[10px] uppercase tracking-widest font-sans">
            <Download className="w-4 h-4" /> Export Report
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50/50 via-white to-white border-indigo-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 font-sans">Total Verified Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
              ${regs.filter((r:any) => r.status === 'verified').reduce((sum: number, r:any) => sum + (r.amount || 0), 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-[10px] font-medium font-sans">Verified payments</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600 font-sans">Pending Verification</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
              ${regs.filter((r:any) => r.status === 'pending' || r.status === 'pending_verification').reduce((sum: number, r:any) => sum + (r.amount || 0), 0).toLocaleString()}
            </div>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <Clock className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-medium font-sans">Awaiting approval</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50/50 via-white to-white border-slate-100 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500 font-sans">Total Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
              {regs.length}
            </div>
            <div className="flex items-center gap-1 mt-1 text-slate-400">
              <BarChart3 className="w-3 h-3 text-slate-400" />
              <span className="text-[10px] font-medium tracking-wide font-sans">All historical records</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/30 border-b border-slate-100 pb-4">
          <CardTitle className="text-sm font-bold text-slate-800 font-sans">Payment Transactions</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Invoice No.</TableHead>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Student Info</TableHead>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Method</TableHead>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Amount</TableHead>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Proof</TableHead>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Date</TableHead>
                  <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Status</TableHead>
                  <TableHead className="py-4 px-6 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500 font-sans">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedRegs.map((r: any) => (
                   <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                     <TableCell className="px-6 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                        {r.invoiceNumber || r.id?.slice(0,8)}
                     </TableCell>
                     <TableCell className="px-6">
                       <div className="font-bold text-slate-800 font-sans">{r.studentName}</div>
                       <div className="text-[10px] text-slate-500 font-medium font-sans">{r.studentEmail}</div>
                       <div className="text-[10px] text-slate-400 italic mt-0.5 font-sans">{r.studentPhone}</div>
                     </TableCell>
                     <TableCell className="px-6">
                       {r.paymentMethod ? (
                          <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200 uppercase tracking-wide font-sans">{r.paymentMethod}</span>
                       ) : <span className="text-slate-300 font-sans">-</span>}
                     </TableCell>
                     <TableCell className="px-6 font-extrabold text-slate-900 tracking-tighter">${r.amount}</TableCell>
                     <TableCell className="px-6">
                       {r.paymentProof ? (
                         <Button variant="ghost" size="sm" className="h-8 text-blue-600 gap-1 px-2 border border-blue-100 bg-blue-50/50 hover:bg-blue-50 font-sans" onClick={() => setPreviewImage(r.paymentProof)}>
                           <ExternalLink className="w-3 h-3" /> View
                         </Button>
                       ) : <span className="text-[10px] text-slate-300 italic font-sans">No proof</span>}
                     </TableCell>
                     <TableCell className="px-6 text-[10px] font-bold text-slate-500 uppercase">{formatHkDate(r.createdAt)}</TableCell>
                     <TableCell className="px-6">
                        <div className="flex flex-col gap-1">
                           <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border w-max block text-center font-sans ${
                             r.status === 'verified' 
                               ? 'bg-green-50 text-green-700 border-green-100' 
                               : r.status === 'pending' || r.status === 'pending_verification'
                                 ? 'bg-blue-50 text-blue-700 border-blue-100' 
                                 : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                           }`}>
                             {r.status === 'pending_verification' ? (
                               <span className="flex flex-col leading-none py-0.5">
                                 <span>Pending</span>
                                 <span>Verification</span>
                               </span>
                             ) : r.status?.replace('_', ' ')}
                           </span>
                           {r.updatedBy && (
                             <div className="text-[9px] text-slate-400 font-medium leading-tight break-words max-w-[120px] font-sans">
                               By: {r.updatedBy.split('@')[0]}
                               <br/>
                               {formatHkDate(r.updatedAt, true)}
                             </div>
                           )}
                        </div>
                     </TableCell>
                     <TableCell className="px-6 text-right">
                        <div className="flex justify-end items-center gap-2">
                           {r.status === 'verified' && (
                             <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => handleGenerateInvoice(r)} title="Download Receipt">
                               <FileText className="w-4 h-4" />
                             </Button>
                           )}
                           {readOnly ? (
                             <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-1 rounded select-none font-sans">Locked</span>
                           ) : (
                             <>
                               {(r.status === 'pending_verification' || r.status === 'pending') && (
                                 <Button size="sm" variant="outline" onClick={() => handleUpdateRegStatus(r.id, 'verified')} className="h-8 border-green-200 text-green-600 hover:bg-green-50 text-[10px] font-bold uppercase tracking-widest px-4 font-sans">
                                   Verify
                                 </Button>
                               )}
                               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => { setEditingReg(r); setIsEditRegOpen(true); }} title="Edit Record">
                                 <Edit2 className="w-4 h-4" />
                               </Button>
                               <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => confirmDelete(r.id, 'registration', `${r.studentName || 'Student'} - ${r.invoiceNumber || 'No Invoice'}`)} title="Delete Record">
                                 <Trash2 className="w-4 h-4" />
                               </Button>
                             </>
                           )}
                        </div>
                     </TableCell>
                   </TableRow>
                  ))}
                {filteredRegs.length === 0 && (
                  <TableRow>
                     <TableCell colSpan={8} className="text-center py-16">
                      <div className="flex flex-col items-center gap-2 text-slate-300">
                         <BarChart3 className="w-12 h-12" />
                         <span className="text-sm font-medium font-sans">No financial transactions found</span>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {filteredRegs.length > 0 && (
            <div className="flex items-center justify-between p-4 border-t border-slate-100 bg-slate-50/50">
              <div className="text-xs text-slate-500 font-medium font-sans">
                Showing {Math.min(filteredRegs.length, (currentPage - 1) * itemsPerPage + 1)} to {Math.min(filteredRegs.length, currentPage * itemsPerPage)} of {filteredRegs.length} entries
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-500 mr-2 font-medium font-sans">Page {currentPage} of {totalPages}</span>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isEditRegOpen} onOpenChange={setIsEditRegOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="font-sans">Edit Payment Record</DialogTitle>
            <DialogDescription className="font-sans">Manually correct registration details</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateRegistration} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans">Student Name</Label>
                <Input value={editingReg?.studentName || ''} onChange={e => setEditingReg({...editingReg, studentName: e.target.value})} required className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Phone</Label>
                <Input value={editingReg?.studentPhone || ''} onChange={e => setEditingReg({...editingReg, studentPhone: e.target.value})} className="text-xs" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-sans">Email</Label>
              <Input value={editingReg?.studentEmail || ''} onChange={e => setEditingReg({...editingReg, studentEmail: e.target.value})} type="email" className="text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-sans">Amount ($)</Label>
                <Input value={editingReg?.amount || 0} onChange={e => setEditingReg({...editingReg, amount: Number(e.target.value)})} type="number" className="text-xs" />
              </div>
              <div className="space-y-2">
                <Label className="font-sans">Status</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-xs ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 font-sans"
                  value={editingReg?.status || ''} 
                  onChange={e => setEditingReg({...editingReg, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="pending_verification">Pending Verification</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditRegOpen(false)} className="text-xs font-sans">Cancel</Button>
              <Button type="submit" className="text-xs font-sans">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
});
