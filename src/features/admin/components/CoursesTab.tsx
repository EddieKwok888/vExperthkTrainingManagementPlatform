import React from 'react';
import { Search, Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';

interface CoursesTabProps {
  courseSearchTerm: string;
  setCourseSearchTerm: (val: string) => void;
  setCourseCreationModalOpen: (val: boolean) => void;
  courses: any[];
  sessions: any[];
  setSelectedTemplateForIntake: (course: any) => void;
  newSession: any;
  setNewSession: (session: any) => void;
  setActiveTab: (tab: string) => void;
  setSelectedCourse: (course: any) => void;
  setCourseModalOpen: (val: boolean) => void;
  confirmDelete: (id: string, type: string, name: string) => void;
}

export const CoursesTab: React.FC<CoursesTabProps> = ({
  courseSearchTerm,
  setCourseSearchTerm,
  setCourseCreationModalOpen,
  courses,
  sessions,
  setSelectedTemplateForIntake,
  newSession,
  setNewSession,
  setActiveTab,
  setSelectedCourse,
  setCourseModalOpen,
  confirmDelete,
}) => {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Course Templates</h2>
          <p className="text-xs text-slate-500">Manage master definitions for your curriculum</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Search Code or Title..." 
              className="pl-9 h-10 border-slate-200 focus:ring-blue-600/20 text-xs"
              value={courseSearchTerm}
              onChange={(e) => setCourseSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={() => setCourseCreationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
            <Plus className="w-4 h-4 mr-2" /> 
            Add New Template
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Course Templates</CardTitle>
          <CardDescription>Existing master course definitions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead>EB Price</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses
                  .filter(c => 
                    c.title?.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
                    c.courseCode?.toLowerCase().includes(courseSearchTerm.toLowerCase())
                  )
                  .map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.courseCode || '-'}</TableCell>
                    <TableCell className="font-medium text-slate-800 whitespace-pre-wrap max-w-[250px] leading-snug">{c.title}</TableCell>
                    <TableCell className="text-xs">{c.category || '-'}</TableCell>
                    <TableCell className="text-xs">{c.level || '-'}</TableCell>
                    <TableCell className="text-xs">{c.day || '-'}</TableCell>
                    <TableCell className="text-xs font-semibold">{c.earlyBirdPrice ? `$${c.earlyBirdPrice}` : '-'}</TableCell>
                    <TableCell className="text-xs font-semibold">${c.standardPrice || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {sessions.filter(s => s.courseId === c.id).length} Active
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-8 gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedTemplateForIntake(c);
                            setNewSession({
                              ...newSession,
                              courseId: c.id,
                              earlyBirdPrice: c.earlyBirdPrice || 0,
                              standardPrice: c.standardPrice || 0
                            });
                            setActiveTab('sessions');
                          }}
                        >
                          <Plus className="w-3.5 h-3.5" /> Create Intake
                        </Button>

                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50"
                          onClick={() => {
                            setSelectedCourse(c);
                            setCourseModalOpen(true);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          onClick={() => confirmDelete(c.id, 'course', c.title || c.courseCode || 'Unknown Course')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
