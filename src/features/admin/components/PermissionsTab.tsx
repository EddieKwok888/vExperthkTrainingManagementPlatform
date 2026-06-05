import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ShieldCheck, Plus, XCircle, CheckCircle, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface PermissionsTabProps {
  customRolePermissions: any[];
  setCustomRolePermissions: React.Dispatch<React.SetStateAction<any[]>>;
  selectedAccessRole: string;
  setSelectedAccessRole: (roleId: string) => void;
  simulatedRole: string;
  setSimulatedRole: (roleId: string) => void;
  activeAccessSection: 'matrix' | 'details' | 'sim' | 'docs';
  setActiveAccessSection: (sec: 'matrix' | 'details' | 'sim' | 'docs') => void;
}

export function PermissionsTab({
  customRolePermissions,
  setCustomRolePermissions,
  selectedAccessRole,
  setSelectedAccessRole,
  simulatedRole,
  setSimulatedRole,
  activeAccessSection,
  setActiveAccessSection
}: PermissionsTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2 text-slate-800">
            <ShieldCheck className="w-6 h-6 text-indigo-600" /> Granular Roles & Permissions Control Panel
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Fine-tune Role-Based Access Control (RBAC). Tap cells in the comparison matrix below to cycle access values, configure custom roles, or test visual locks in the live simulator.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => {
              const newId = `custom_${Date.now()}`;
              const cloneFrom = customRolePermissions.find(r => r.roleId === selectedAccessRole) || customRolePermissions[0];
              const newRoleObj = {
                roleId: newId,
                name: `Custom Role ${customRolePermissions.length + 1}`,
                desc: 'Custom-tailored role for specialized staff or outsourced partner administration.',
                maxAuthAmount: cloneFrom.maxAuthAmount,
                restrictions: 'No restrictions specified. Modify dynamically in configuration inputs below.',
                permissions: { ...cloneFrom.permissions }
              };
              setCustomRolePermissions([...customRolePermissions, newRoleObj]);
              setSelectedAccessRole(newId);
              setActiveAccessSection('details');
              toast.success('Successfully created new custom role based on selection!');
            }}
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow font-semibold text-xs h-9 gap-1"
          >
            <Plus className="w-4 h-4" /> Create Custom Role
          </Button>
        </div>
      </div>

      {/* Sub tabs pills */}
      <div className="flex border-b border-slate-200 gap-1 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveAccessSection('matrix')}
          className={`px-4 py-2 text-xs font-bold leading-5 transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
            activeAccessSection === 'matrix'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          儲存格權限 Matrix Grid (Permission Matrix)
        </button>
        <button
          onClick={() => setActiveAccessSection('details')}
          className={`px-4 py-2 text-xs font-bold leading-5 transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
            activeAccessSection === 'details'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          角色明細與限制 (Role Configurator)
        </button>
        <button
          onClick={() => setActiveAccessSection('sim')}
          className={`px-4 py-2 text-xs font-bold leading-5 transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
            activeAccessSection === 'sim'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          模擬視角 Sandbox (Simulator)
        </button>
        <button
          onClick={() => setActiveAccessSection('docs')}
          className={`px-4 py-2 text-xs font-bold leading-5 transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
            activeAccessSection === 'docs'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
          }`}
        >
          SoD 職責分離指引 (Guidelines)
        </button>
      </div>

      {activeAccessSection === 'matrix' && (
        <Card className="border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
            <div>
              <h4 className="text-sm font-semibold text-slate-800">
                💡 Interactive Access Matrix: Click any permission badge cell to cycle through [Full Access → Read Only → Blocked]
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5 animate-pulse">
                Current access rights for each operational workspace are listed below. Click directly to alter permissions and explore the results in the Viewport Simulator.
              </p>
            </div>
          </div>
          <CardContent className="p-0 overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="text-xs font-extrabold uppercase text-slate-600 font-sans min-w-[200px]">System Modules & Panels</TableHead>
                  {customRolePermissions.map(role => (
                    <TableHead key={role.roleId} className="text-xs font-extrabold uppercase text-slate-600 font-sans text-center min-w-[140px]">
                      {role.name}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { key: 'overview', name: '📊 Analytics & Dashboard (Overview)', desc: 'Analyze total revenue registers, multi-channel ROI conversions, and historical indicators.' },
                  { key: 'courses', name: '📝 Curriculum Standards (Syllabus)', desc: 'Publish official curriculum guidelines, list required prerequisite skills, and assign standards.' },
                  { key: 'sessions', name: '📅 Classroom & Intakes (Sessions)', desc: 'Open active intakes, view virtual lesson rooms, establish regional sub-centers, and assign materials.' },
                  { key: 'finance', name: '💰 Finance & Payroll Ledger', desc: 'Settle tuition streams, issue authorized invoice receipts, verify refund policies, and balance salaries.' },
                  { key: 'certificates', name: '🎓 Certificates Ledger', desc: 'Generate tamper-proof hash serials, download printable certificates, and adjust award rules.' },
                  { key: 'scheduling', name: '🏫 Scheduling & Reservations', desc: 'Drag-and-drop live rooms, schedule exam sessions, schedule teachers, and analyze scheduling clashes.' },
                  { key: 'tutors', name: '⏳ Tutor Timecard Reconciliation', desc: 'Verify billable hourly logs from instructors, conduct claims auditing, and release payroll approvals.' },
                  { key: 'feedback', name: '💬 Student Course Evaluations (Feedback)', desc: 'Inspect student course logs, feedback ratings, and record follow-up CS complaint tickets.' },
                  { key: 'logs', name: '🛡️ Operator System Logs (Audit Trails)', desc: 'Monitor every single click, record changes to invoices, IP tags, timestamps, and active operators.' },
                  { key: 'promotions', name: '✨ Promos & Coupons (Promotions)', desc: 'Configure referral programs, discount campaigns, KOL partner codes, and countdown specials.' },
                  { key: 'settings', name: '⚙️ Global School Settings', desc: 'Configure invoice templates, replace school logos, set system variables, and rotate master passwords.' }
                ].map(mod => (
                  <TableRow key={mod.key} className="hover:bg-slate-50/20 transition-all border-b border-slate-100">
                    <TableCell className="py-3">
                      <div className="font-bold text-slate-800 text-xs">{mod.name}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5 leading-normal max-w-[200px]">{mod.desc}</div>
                    </TableCell>
                    {customRolePermissions.map(role => {
                      const val = role.permissions[mod.key] || 'none';

                      const handleRotate = () => {
                        const nextVal = val === 'full' ? 'view' : val === 'view' ? 'none' : 'full';
                        const updated = customRolePermissions.map(r => {
                          if (r.roleId === role.roleId) {
                            return {
                              ...r,
                              permissions: {
                                ...r.permissions,
                                [mod.key]: nextVal
                              }
                            };
                          }
                          return r;
                        });
                        setCustomRolePermissions(updated);
                        toast.success(`Updated "${role.name}" permission for "${mod.name.slice(2)}" to ${nextVal === 'full' ? 'Full Access' : nextVal === 'view' ? 'Read Only' : 'Blocked'}`);
                      };

                      let badgeClasses = 'bg-red-50 text-red-700 border-red-100';
                      let badgeLabel = 'Blocked';
                      let badgeIcon = <XCircle className="w-3 h-3 mr-1" />;

                      if (val === 'full') {
                        badgeClasses = 'bg-green-50 text-green-700 border-green-100';
                        badgeLabel = 'Full Access';
                        badgeIcon = <CheckCircle className="w-3 h-3 mr-1" />;
                      } else if (val === 'view') {
                        badgeClasses = 'bg-amber-50 text-amber-700 border-amber-100';
                        badgeLabel = 'Read Only';
                        badgeIcon = <Search className="w-3 h-3 mr-1" />;
                      }

                      return (
                        <TableCell key={role.roleId} className="text-center py-3">
                          <button
                            onClick={handleRotate}
                            className={`inline-flex items-center justify-center px-2.5 py-1 rounded text-[10px] font-bold border cursor-pointer active:scale-95 transition-all min-w-[120px] ${badgeClasses}`}
                          >
                            {badgeIcon}
                            {badgeLabel}
                          </button>
                        </TableCell>
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {activeAccessSection === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left list of roles */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400 px-2 font-sans">Active Roles List</h4>
            <div className="space-y-1">
              {customRolePermissions.map(role => (
                <button
                  key={role.roleId}
                  onClick={() => setSelectedAccessRole(role.roleId)}
                  className={`w-full text-left p-3 rounded-lg border transition-all flex flex-col gap-1 ${
                    selectedAccessRole === role.roleId ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-center w-full font-sans">
                    <span className="font-bold text-xs text-slate-800">{role.name}</span>
                    {role.roleId.startsWith('custom') && (
                      <span className="text-[8px] bg-indigo-100 text-indigo-700 px-1 rounded-full font-extrabold uppercase animate-pulse">Custom</span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 line-clamp-1 font-sans">{role.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Right editor details */}
          <div className="lg:col-span-2">
            {(() => {
              const role = customRolePermissions.find(r => r.roleId === selectedAccessRole);
              if (!role) return <div className="text-slate-500 italic text-center py-10 font-sans">Select a role to configure</div>;

              return (
                <Card className="border border-slate-100 shadow-sm">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-md font-bold text-slate-800 flex items-center gap-2 font-sans">
                          {role.name} <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-mono font-bold lowercase">{role.roleId}</span>
                        </CardTitle>
                        <CardDescription className="text-xs pt-1 font-sans">
                          Configure structural descriptions, individual authority ceilings, security safeguards, and granular section permissions.
                        </CardDescription>
                      </div>
                      {role.roleId.startsWith('custom') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50 font-bold text-xs font-sans"
                          onClick={() => {
                            setCustomRolePermissions(customRolePermissions.filter(r => r.roleId !== role.roleId));
                            setSelectedAccessRole('ops_manager');
                            toast.success('Custom role removed successfully');
                          }}
                        >
                          🗑️ Deconstruct Custom Role
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 py-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-sans">Role Name</label>
                      <Input
                        value={role.name}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomRolePermissions(customRolePermissions.map(r => (r.roleId === role.roleId ? { ...r, name: val } : r)));
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-sans">Role Description</label>
                      <Input
                        value={role.desc}
                        onChange={e => {
                          const val = e.target.value;
                          setCustomRolePermissions(customRolePermissions.map(r => (r.roleId === role.roleId ? { ...r, desc: val } : r)));
                        }}
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-sans">Financial Signing Authority Limit</label>
                        <Input
                          value={role.maxAuthAmount}
                          onChange={e => {
                            const val = e.target.value;
                            setCustomRolePermissions(customRolePermissions.map(r => (r.roleId === role.roleId ? { ...r, maxAuthAmount: val } : r)));
                          }}
                          placeholder="e.g. HKD 10,000"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wide text-slate-500 font-sans">Security Limitations & Safe Rules</label>
                        <Input
                          value={role.restrictions}
                          onChange={e => {
                            const val = e.target.value;
                            setCustomRolePermissions(customRolePermissions.map(r => (r.roleId === role.roleId ? { ...r, restrictions: val } : r)));
                          }}
                          placeholder="e.g. Restricted from core school parameters modifications"
                        />
                      </div>
                    </div>

                    <div className="border-t pt-4 border-slate-100">
                      <h5 className="text-xs font-extrabold uppercase tracking-wide text-slate-500 mb-2 font-sans">Granular Permission Toggles per Panel:</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { key: 'overview', name: '📊 Overview Analytics' },
                          { key: 'courses', name: '📝 Curriculum Guidelines' },
                          { key: 'sessions', name: '📅 Academic Intakes' },
                          { key: 'finance', name: '💰 Tuition & Finance' },
                          { key: 'certificates', name: '🎓 Certificate Issuance' },
                          { key: 'scheduling', name: '🏫 Timecard Scheduling' },
                          { key: 'tutors', name: '⏳ Instructor Auditing' },
                          { key: 'feedback', name: '💬 Satisfactory Evaluations' },
                          { key: 'logs', name: '🛡️ Operations Audit Logs' },
                          { key: 'promotions', name: '✨ Promotions & Codes' },
                          { key: 'settings', name: '⚙️ Global Settings' }
                        ].map(mod => {
                          const val = role.permissions[mod.key] || 'none';
                          return (
                            <div key={mod.key} className="flex justify-between items-center p-2 rounded border border-slate-100 hover:border-indigo-100 transition-all bg-slate-50/30">
                              <span className="text-xs font-semibold text-slate-705 font-sans">{mod.name}</span>
                              <select
                                className="h-8 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
                                value={val}
                                        onChange={e => {
                                          const upVal = e.target.value;
                                          setCustomRolePermissions(customRolePermissions.map(r => r.roleId === role.roleId ? {
                                            ...r,
                                            permissions: {
                                              ...r.permissions,
                                              [mod.key]: upVal
                                            }
                                          } : r));
                                          toast.success(`Updated ${mod.name} permission to ${upVal}`);
                                        }}
                              >
                                <option value="full">🟢 Full Control</option>
                                <option value="view">🟡 Read Only</option>
                                <option value="none">🛑 Blocked Access</option>
                              </select>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-6 font-sans"
                        onClick={() => {
                          toast.success('Successfully saved granular permission adjustments!');
                        }}
                      >
                        Save Role Parameters
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </div>
      )}

      {activeAccessSection === 'sim' && (
        <div className="space-y-4">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-800 font-sans">💻 Live Viewport Simulator & Testing Unit</h4>
              <p className="text-xs text-slate-500 mt-1 font-sans">
                Select a role below to load the live preview. Observe exactly what panels are rendered, which actions are read-only, and where access blocks are enforced.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-600 font-bold font-sans">Simulate Logged-in Role:</span>
              <select
                className="h-9 rounded border border-slate-200 bg-white px-3 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans cursor-pointer"
                value={simulatedRole}
                onChange={e => setSimulatedRole(e.target.value)}
              >
                {customRolePermissions.map(r => (
                  <option key={r.roleId} value={r.roleId}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {(() => {
            const roleSetting = customRolePermissions.find(r => r.roleId === simulatedRole) || customRolePermissions[0];
            const perms = roleSetting.permissions;

            return (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 text-slate-100 p-4 sm:p-6 rounded-xl shadow-lg font-sans relative overflow-hidden border border-slate-800 min-h-[500px]">
                {/* Fake Left Sidebar */}
                <div className="col-span-1 border-r border-slate-800 pr-4 space-y-4 text-xs font-sans">
                  <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
                    <span className="bg-indigo-600 p-1.5 rounded text-white font-extrabold uppercase">VEX</span>
                    <div>
                      <div className="font-extrabold text-slate-200 tracking-wider">VExpert Academy</div>
                      <div className="text-[10px] text-slate-500 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping"></span>
                        Simulated Space
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="text-[9px] uppercase tracking-wider text-slate-600 font-semibold mb-1">Simulated Main Menu</div>
                    {[
                      { key: 'overview', label: '📊 Dashboard Overview' },
                      { key: 'courses', label: '📝 Curriculum Standard' },
                      { key: 'sessions', label: '📅 Academic Intakes' },
                      { key: 'finance', label: '💰 Tuition Finance' },
                      { key: 'certificates', label: '🎓 Certificates Registry' },
                      { key: 'scheduling', label: '🏫 Classroom Scheduling' },
                      { key: 'tutors', label: '⏳ Instructor Auditing' },
                      { key: 'feedback', label: '💬 Satisfactory Feedback' },
                      { key: 'logs', label: '🛡️ Audit Logging' },
                      { key: 'promotions', label: '✨ Promotions & Codes' },
                      { key: 'settings', label: '⚙️ Global Settings' }
                    ].map(item => {
                      const v = perms[item.key] || 'none';
                      let badge = null;
                      let labelStyle = 'text-slate-400 hover:bg-slate-800/50';
                      if (v === 'none') {
                        badge = (
                          <span className="bg-red-955 text-red-400 text-[8px] px-1.5 rounded border border-red-900 font-bold ml-auto shrink-0 flex items-center gap-0.5">
                            🚫 Hidden
                          </span>
                        );
                        labelStyle = 'text-slate-600 line-through opacity-40 select-none cursor-not-allowed';
                      } else if (v === 'view') {
                        badge = (
                          <span className="bg-amber-955 text-amber-400 text-[8px] px-1.5 rounded border border-amber-900 font-bold ml-auto shrink-0 flex items-center gap-0.5">
                            👁️ Read
                          </span>
                        );
                        labelStyle = 'text-amber-100 hover:bg-slate-800/40';
                      } else {
                        badge = (
                          <span className="bg-green-955 text-green-400 text-[8px] px-1.5 rounded border border-green-900 font-bold ml-auto shrink-0 flex items-center gap-0.5">
                            🟢 Full
                          </span>
                        );
                        labelStyle = 'text-green-100 hover:bg-slate-800/40 font-bold';
                      }

                      return (
                        <div key={item.key} className={`flex items-center gap-2 p-2 rounded transition-colors ${labelStyle}`}>
                          <span className="truncate">{item.label}</span>
                          {badge}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Fake Content Workspace */}
                <div className="col-span-3 space-y-4 font-sans">
                  <div className="flex justify-between items-center bg-slate-800/50 p-3 rounded border border-slate-800">
                    <div>
                      <div className="text-[11px] text-slate-400">Active Simulated Identity</div>
                      <div className="text-xs font-extrabold text-slate-100 flex items-center gap-2 mt-0.5">
                        simulated.user@vexperthk.com
                        <span className="bg-indigo-950 text-indigo-300 font-extrabold text-[9px] px-2 py-0.5 rounded border border-indigo-900">
                          {roleSetting.name}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-bold">Signing Limit:</span>
                      <div className="text-xs font-bold text-red-400">{roleSetting.maxAuthAmount}</div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg min-h-[300px] flex flex-col justify-between relative overflow-hidden">
                    {/* Content Workspace Screen Details */}
                    <div className="space-y-4">
                      <h5 className="font-extrabold text-sm text-indigo-400 flex items-center gap-2 border-b border-slate-800 pb-2">
                        💻 Mock Action Sandbox: Course Fees & Ledger Adjustments
                      </h5>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">Standard Course Enrollment Fee</label>
                          <div className="bg-slate-900 px-3 py-2 rounded text-xs text-slate-200 border border-slate-800 flex justify-between items-center">
                            <span>HKD 4,200</span>
                            {perms.finance !== 'full' ? (
                              <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                                🔒 Read-Only
                              </span>
                            ) : (
                              <span className="text-[9px] bg-green-950 text-green-400 border border-green-900 px-1.5 py-0.2 rounded font-mono font-bold">
                                ✏️ Read & Write
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-slate-400 block font-bold">Early-Bird Promotional Price</label>
                          <div className="bg-slate-900 px-3 py-2 rounded text-xs text-slate-200 border border-slate-800 flex justify-between items-center">
                            <span>HKD 3,500</span>
                            {perms.finance !== 'full' ? (
                              <span className="text-[9px] bg-amber-950 text-amber-400 border border-amber-900 px-1.5 py-0.2 rounded font-mono font-bold flex items-center gap-0.5">
                                🔒 Read-Only
                              </span>
                            ) : (
                              <span className="text-[9px] bg-green-950 text-green-400 border border-green-900 px-1.5 py-0.2 rounded font-mono font-bold">
                                ✏️ Read & Write
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="space-y-2 mt-4 p-3 bg-slate-900/60 rounded border border-slate-800/80">
                        <div className="text-[10px] text-indigo-300 font-extrabold uppercase">Advanced Supervision Actions:</div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            disabled={perms.finance !== 'full'}
                            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-all ${
                              perms.finance === 'full'
                                ? 'bg-green-600 hover:bg-green-700 text-white cursor-pointer active:scale-95'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => toast.success('Mock refund approved!')}
                          >
                            💡 Authorize Tuition Refund Receipt & Close Item
                          </button>
                          <button
                            disabled={perms.settings !== 'full'}
                            className={`px-3 py-1.5 rounded font-bold text-xs flex items-center gap-1.5 transition-all ${
                              perms.settings === 'full'
                                ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer active:scale-95'
                                : 'bg-slate-800 text-slate-500 border border-slate-700 opacity-50 cursor-not-allowed'
                            }`}
                            onClick={() => toast.success('Mock credential rotated!')}
                          >
                            🔑 Rotate School Master Encryption Keys
                          </button>
                        </div>
                        <div className="text-[9px] text-slate-500 leading-normal pt-1">
                          *Note: Highlighted actions are fully enabled under the simulated role state; disabled buttons are constrained by active access matrices.
                        </div>
                      </div>
                    </div>

                    {/* Simulated Watermark overlays if certain core perms blocks are None */}
                    {perms.finance === 'none' && (
                      <div className="absolute inset-0 bg-slate-950/95 flex flex-col justify-center items-center text-center p-4 backdrop-blur-xs">
                        <AlertTriangle className="w-8 h-8 text-rose-500 animate-pulse mb-2" />
                        <div className="font-extrabold text-xs text-rose-400 tracking-wider font-sans">🔒 Financial Ledger Restricted</div>
                        <p className="text-[10px] text-slate-500 mt-1 max-w-[300px] font-sans">
                          &quot;{roleSetting.name}&quot; is flagged as Blocked under the Finance Module. All invoices, transactional logs, credit cards collections, and tutor wage variables are strictly obscured.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {activeAccessSection === 'docs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 leading-relaxed">
          <div className="bg-white p-5 rounded-lg border border-slate-200 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm text-slate-800 border-b border-slate-100 pb-2 flex items-center gap-2 font-sans">
              📂 Staff Separation of Duties (SoD) & Audit Guidelines
            </h4>
            <div className="space-y-3 text-xs text-slate-600 font-sans">
              <p>
                <strong>1. Purpose of Access Control</strong>
                <br />
                Educational and training institutions handle high-value materials (tamper-proof certificates, private tuition information, and payroll files).
                Relying on a shared parent administrative account poses severe security and operational risks.
              </p>
              <p>
                <strong>2. Separation of Duties (SoD) Principles:</strong>
                <br />
                <span className="text-indigo-600 font-extrabold">🚫 Billing vs. Refund Authorization:</span> Allow Front Desk staff to receive student
                tuition payments, but restrict them from issuing custom refunds or deleting past payments. Refund claims must travel through the Finance Specialist
                or Super Admin.
              </p>
              <p>
                <span className="text-indigo-600 font-extrabold">🚫 Scheduling vs. Payroll Audit:</span> Clerical employees scheduling classroom lessons must not
                be the same administrators verifying tutor hourly billing cycles, preventing collusion and billing spikes.
              </p>
            </div>
          </div>

          <div className="bg-indigo-50/50 p-5 rounded-lg border border-indigo-100 space-y-4 shadow-sm">
            <h4 className="font-bold text-sm text-indigo-905 border-b border-indigo-100 pb-2 flex items-center gap-2 font-sans">
              🛡️ School Privacy & System Audit Safeguards
            </h4>
            <div className="space-y-3 text-xs text-indigo-950/80 font-sans">
              <p>
                <strong>✓ High-Value Security Prompts:</strong>
                <br />
                Actions targeting core ledgers, student certificates registration deletions, and master password modifications prompt secondary verification to
                maintain bulletproof tracking.
              </p>
              <p>
                <strong>✓ Contract Staff Data Isolation:</strong>
                <br />
                While Senior Full-Time Instructors enjoy access to global curriculum plans and historical templates, Part-Time Tutors are isolated, only viewing
                scheduled classes assigned directly to them.
              </p>
              <p>
                <strong>✓ KOL Promotion Code Security:</strong>
                <br />
                Campaign and referral codes are aggregated separately to evaluate marketing performance. Keep this tab isolated to promotional leads using
                matrices, preventing accidental configuration errors.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
