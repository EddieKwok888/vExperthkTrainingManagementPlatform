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
            <CardTitle className="text-xl font-black text-slate-800 tracking-tight">
              Part-time Instructor <span className="text-red-500 font-bold text-sm ml-2">Feature is under development, not enabled</span>
            </CardTitle>
            <CardDescription className="text-xs font-medium text-slate-500">Track records and verify completed courses</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button disabled className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-500 shadow-none cursor-not-allowed">
              <Plus className="w-3.5 h-3.5" /> Add Course
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-16 flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-red-200 mb-6">
            <svg className="w-24 h-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2 font-sans">Under Development</h3>
          <p className="text-slate-500 font-medium font-sans">Feature is currently under development and not available for use</p>
        </CardContent>
      </Card>
    </div>
  );
};
