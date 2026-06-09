import React, { useState } from 'react';
// Trigger Dev Server Reload
import { Search, Plus, Trash2, ArrowUpDown, ChevronDown, ChevronUp } from 'lucide-react';
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
  readOnly?: boolean;
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
  readOnly = false,
}) => {
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: string) => {
    if (sortField === field) {
      if (sortDirection === 'asc') setSortDirection('desc');
      else { setSortField(null); setSortDirection('asc'); }
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-20 group-hover:opacity-100 transition-opacity" />;
    return sortDirection === 'asc' 
      ? <ChevronUp className="w-3 h-3 ml-1 text-blue-600" /> 
      : <ChevronDown className="w-3 h-3 ml-1 text-blue-600" />;
  };

  const sortedCourses = [...courses]
    .filter(c => 
      c.title?.toLowerCase().includes(courseSearchTerm.toLowerCase()) || 
      c.courseCode?.toLowerCase().includes(courseSearchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortField) return 0;
      const aVal = (a[sortField] || '').toString().toLowerCase();
      const bVal = (b[sortField] || '').toString().toLowerCase();
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

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
          {!readOnly ? (
            <Button onClick={() => setCourseCreationModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95 whitespace-nowrap">
              <Plus className="w-4 h-4 mr-2" /> 
              Add New Template
            </Button>
          ) : (
            <Button disabled className="bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs uppercase tracking-widest cursor-not-allowed whitespace-nowrap h-10 px-4">
              🔒 Read-Only
            </Button>
          )}
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
                  <TableHead className="cursor-pointer group select-none hover:bg-slate-50 transition-colors" onClick={() => handleSort('courseCode')}>
                    <div className="flex items-center">Code {renderSortIcon('courseCode')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer group select-none hover:bg-slate-50 transition-colors" onClick={() => handleSort('title')}>
                    <div className="flex items-center">Title {renderSortIcon('title')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer group select-none hover:bg-slate-50 transition-colors" onClick={() => handleSort('category')}>
                    <div className="flex items-center">Category {renderSortIcon('category')}</div>
                  </TableHead>
                  <TableHead className="cursor-pointer group select-none hover:bg-slate-50 transition-colors" onClick={() => handleSort('level')}>
                    <div className="flex items-center">Level {renderSortIcon('level')}</div>
                  </TableHead>
                  <TableHead>Day</TableHead>
                  <TableHead className="whitespace-nowrap">EB Price</TableHead>
                  <TableHead className="whitespace-nowrap">Base Price</TableHead>
                  <TableHead>Courses</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedCourses.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-mono text-xs">{c.courseCode || '-'}</TableCell>
                    <TableCell className="font-medium text-slate-800 whitespace-pre-wrap max-w-[250px] leading-snug">{c.title}</TableCell>
                    <TableCell className="text-xs">{c.category || '-'}</TableCell>
                    <TableCell className="text-xs">{c.level || '-'}</TableCell>
                    <TableCell className="text-xs">{c.day || '-'}</TableCell>
                    <TableCell className="text-xs font-semibold">{c.earlyBirdPrice ? `$${c.earlyBirdPrice}` : '-'}</TableCell>
                    <TableCell className="text-xs font-semibold">${c.standardPrice || '-'}</TableCell>
                    <TableCell className="text-xs">
                      {sessions.filter(s => s.courseId === c.id && s.sessionStatus !== 'completed' && s.sessionStatus !== 'cancelled').length} Active
                    </TableCell>
                    <TableCell className="text-right">
                      {readOnly ? (
                        <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-1 rounded">Locked</span>
                      ) : (
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
                      )}
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
