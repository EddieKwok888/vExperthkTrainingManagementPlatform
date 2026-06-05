import React from 'react';
import { Search, Plus, Download } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { toast } from 'sonner';

interface TutorsTabProps {
  instructorSearchTerm: string;
  setInstructorSearchTerm: (val: string) => void;
  ptMonth: string;
  setPtMonth: (val: string) => void;
  setIsManualHoursModalOpen: (val: boolean) => void;
  hours: any[];
  tutors: any[];
  generatePTReport: (tutorId: string, tutorName: string, month: string) => void;
  handleUpdateHoursStatus: (id: string, status: string) => void;
}

export const TutorsTab: React.FC<TutorsTabProps> = ({
  instructorSearchTerm,
  setInstructorSearchTerm,
  ptMonth,
  setPtMonth,
  setIsManualHoursModalOpen,
  hours,
  tutors,
  generatePTReport,
  handleUpdateHoursStatus,
}) => {
  return (
    <div className="space-y-6">
      <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
        <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4 border-b border-slate-50">
          <div>
            <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Part-time Instructor</CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500">Track records and verify completed courses</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input 
                placeholder="Search instructor..." 
                className="pl-9 h-9 text-xs w-48 focus:ring-indigo-500" 
                value={instructorSearchTerm}
                onChange={(e) => setInstructorSearchTerm(e.target.value)}
              />
            </div>
            <Input type="month" value={ptMonth} onChange={e => setPtMonth(e.target.value)} className="h-9 text-xs w-36" />
            <Button onClick={() => setIsManualHoursModalOpen(true)} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
              <Plus className="w-3.5 h-3.5" /> Add Course
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
                const uniqueTutors = Array.from(new Set(hours.filter(h => {
                     if (!h.date || !h.date.startsWith(ptMonth)) return false;
                     const t = tutors.find(t=>t.id===h.tutorId);
                     if (t?.role !== 'tutor_pt') return false;
                     if (instructorSearchTerm && !t?.name?.toLowerCase().includes(instructorSearchTerm.toLowerCase())) return false;
                     return true;
                }).map(h => h.tutorId)));
                if (uniqueTutors.length === 0) return toast.error('No records found to generate report');
                uniqueTutors.forEach(tid => {
                   const t = tutors.find(t=>t.id===tid);
                   if (t) generatePTReport(tid, t.name || t.email || 'Unknown', ptMonth);
                });
                toast.success('Generated ' + uniqueTutors.length + ' reports');
            }} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50">
              <Download className="w-3.5 h-3.5" /> Download PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/50 border-b border-slate-100">
              <TableRow className="hover:bg-transparent">
                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Instructor</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Course Name</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Date</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans">Status</TableHead>
                <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest font-sans text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hours.filter(h => {
                 if (ptMonth && (!h.date || !h.date.startsWith(ptMonth))) return false;
                 const tutor = tutors.find(t => t.id === h.tutorId);
                 if (tutor?.role !== 'tutor_pt') return false;
                 if (!instructorSearchTerm) return true;
                 return tutor?.name?.toLowerCase().includes(instructorSearchTerm.toLowerCase());
              }).map(h => {
                const tutor = tutors.find(t => t.id === h.tutorId);
                return (
                  <TableRow key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-6 py-4">
                      <div className="font-bold text-slate-800">{tutor?.name || 'Unknown Instructor'}</div>
                      <div className="text-[10px] font-mono text-slate-400 mt-0.5">{h.tutorId?.slice(0,8)}...</div>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-[11px] border border-indigo-100 uppercase tracking-wider shadow-sm font-sans">
                        {h.course || h.details || h.notes || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                      <span className="text-[11px] font-medium text-slate-600 tracking-tight">{h.date || 'N/A'}</span>
                    </TableCell>
                    <TableCell className="px-6 py-4">
                       <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider border font-sans ${
                         h.status === 'approved' ? 'bg-green-100 text-green-700 border-green-200 shadow-sm' : 
                         h.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-sm' : 
                         'bg-amber-100 text-amber-700 border-amber-200 shadow-sm'}`}>
                         {h.status?.replace('_', ' ')}
                       </span>
                    </TableCell>
                    <TableCell className="px-6 py-4 text-right">
                       <div className="flex justify-end gap-2">
                         {h.status === 'pending_approval' && (
                            <Button size="sm" onClick={() => handleUpdateHoursStatus(h.id, 'approved')} className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-transform active:scale-95 font-sans">Approve</Button>
                         )}
                         {h.status === 'approved' && (
                            <Button size="sm" variant="outline" onClick={() => handleUpdateHoursStatus(h.id, 'paid')} className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 shadow-sm transition-transform active:scale-95 font-sans">Mark Paid</Button>
                         )}
                         {h.status === 'paid' && (
                            <span className="h-8 flex items-center px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 italic font-sans">Settled</span>
                         )}
                       </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {hours.filter(h => {
                 if (ptMonth && (!h.date || !h.date.startsWith(ptMonth))) return false;
                 const tutor = tutors.find(t => t.id === h.tutorId);
                 if (tutor?.role !== 'tutor_pt') return false;
                 if (!instructorSearchTerm) return true;
                 return tutor?.name?.toLowerCase().includes(instructorSearchTerm.toLowerCase());
              }).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 text-xs italic tracking-wider font-sans">No part-time instructor records found matching your criteria.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
