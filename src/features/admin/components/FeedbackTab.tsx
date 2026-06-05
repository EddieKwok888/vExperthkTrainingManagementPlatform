import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ChevronLeft, Download, Star, ChevronDown } from 'lucide-react';

interface FeedbackTabProps {
  feedbacks: any[];
  courses: any[];
  selectedFeedbackCourse: any | null;
  setSelectedFeedbackCourse: (course: any | null) => void;
  handleExportCSV: (data: any[], filename: string) => void;
}

export function FeedbackTab({
  feedbacks,
  courses,
  selectedFeedbackCourse,
  setSelectedFeedbackCourse,
  handleExportCSV,
}: FeedbackTabProps) {
  const feedbacksByCourse = useMemo(() => {
    const groups: Record<string, any> = {};
    feedbacks.forEach(f => {
       if (!groups[f.courseId]) {
         const course = courses.find(c => c.id === f.courseId);
         groups[f.courseId] = {
           courseId: f.courseId,
           courseName: course?.title || f.courseName || 'Unknown Course',
           feedbacks: [],
           avgRating: 0
         };
       }
       groups[f.courseId].feedbacks.push(f);
    });
    
    Object.values(groups).forEach((g: any) => {
      const totalRating = g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.rating || curr.overallCourseScore) || 0), 0);
      g.avgRating = g.feedbacks.length > 0 ? (totalRating / g.feedbacks.length).toFixed(1) : 0;
    });
    
    return Object.values(groups);
  }, [feedbacks, courses]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-4">
          {selectedFeedbackCourse && (
            <Button variant="ghost" size="sm" onClick={() => setSelectedFeedbackCourse(null)} className="h-8 w-8 p-0">
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <CardTitle className="text-xl font-bold">{selectedFeedbackCourse ? selectedFeedbackCourse.courseName : 'Course Feedback Overview'}</CardTitle>
        </div>
        {!selectedFeedbackCourse && (
          <Button variant="outline" size="sm" onClick={() => handleExportCSV(feedbacks, 'feedback')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export All</Button>
        )}
      </CardHeader>
      <CardContent>
        {!selectedFeedbackCourse ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Course Name</TableHead>
                <TableHead className="w-32">Average Rating</TableHead>
                <TableHead className="w-32">Total Feedbacks</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {feedbacksByCourse.map((c: any) => (
                <TableRow key={c.courseId} className="cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setSelectedFeedbackCourse(c)}>
                  <TableCell className="font-semibold text-slate-800">{c.courseName}</TableCell>
                  <TableCell>
                    <span className="bg-amber-100 text-amber-700 px-2.5 py-1 rounded-md text-xs font-bold inline-flex items-center gap-1.5 border border-amber-200">
                      <Star className="w-3 h-3 fill-current" /> {c.avgRating} / 5
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded text-xs">{c.feedbacks.length} <span className="hidden sm:inline">responses</span></span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 font-semibold text-indigo-600 hover:text-indigo-900">View details</Button>
                  </TableCell>
                </TableRow>
              ))}
              {feedbacksByCourse.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No feedbacks submitted yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-4 mb-6">
               <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex-1">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Average Course Rating</p>
                  <div className="flex items-end gap-2">
                    <span className="text-3xl font-black text-slate-800">{selectedFeedbackCourse.avgRating}</span>
                    <span className="text-slate-500 mb-1 font-medium">/ 5</span>
                    <Star className="w-6 h-6 text-amber-500 fill-current mb-0.5 ml-1" />
                  </div>
               </div>
               <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 flex-1">
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Total Responses</p>
                  <p className="text-3xl font-black text-slate-800">{selectedFeedbackCourse.feedbacks.length}</p>
               </div>
            </div>
            {selectedFeedbackCourse.feedbacks.map((f: any, index: number) => (
              <details key={f.id} className="bg-white border border-slate-200 rounded-xl shadow-sm group">
                <summary className="p-5 flex justify-between items-center cursor-pointer list-none font-bold text-slate-800 text-lg outline-none custom-marker-hide">
                   <div className="flex items-center gap-3 flex-1">
                      <span>{index + 1}. {f.studentName || 'Anonymous Student'}</span>
                   </div>
                   <div className="flex items-center gap-4">
                     <div className="bg-amber-50 text-amber-700 px-3 py-1 rounded text-sm font-bold flex items-center gap-1.5 border border-amber-100">
                       Overall: {f.overallCourseScore || f.rating || 'N/A'} <Star className="w-3.5 h-3.5 fill-current" />
                     </div>
                     <span className="text-slate-400 group-open:rotate-180 transition-transform duration-200">
                       <ChevronDown className="w-5 h-5" />
                     </span>
                   </div>
                </summary>
                <div className="p-5 pt-0 border-t border-slate-100 mt-2 space-y-4">
                   <div className="pt-2">
                      {f.studentEmail && <p className="text-sm text-slate-500">{f.studentEmail}</p>}
                      <p className="text-xs text-slate-400 mt-2 font-mono">Date: {f.date || 'N/A'}</p>
                      {f.companyName && <p className="text-xs text-slate-500 mt-1">Company: {f.companyName}</p>}
                   </div>
                   <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Content</p>
                        <p className="font-semibold text-slate-700">{f.contentScore} / 5</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Level</p>
                        <p className="font-semibold text-slate-700">{f.levelScore} / 5</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Materials</p>
                        <p className="font-semibold text-slate-700">{f.materialsScore} / 5</p>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase font-bold text-slate-500 mb-1">Tutor</p>
                        <p className="font-semibold text-slate-700">{f.overallTutorScore} / 5</p>
                      </div>
                   </div>
                   {(f.usefulTopics || f.leastUsefulTopics || f.comment) && (
                     <div className="space-y-3 pt-2">
                        {f.usefulTopics && (
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">Most useful topics:</p>
                            <p className="text-sm text-slate-600 italic bg-white p-2.5 rounded border border-slate-100">"{f.usefulTopics}"</p>
                          </div>
                        )}
                        {f.leastUsefulTopics && (
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">Least useful topics:</p>
                            <p className="text-sm text-slate-600 italic bg-white p-2.5 rounded border border-slate-100">"{f.leastUsefulTopics}"</p>
                          </div>
                        )}
                        {f.comment && (
                          <div>
                            <p className="text-xs font-bold text-slate-700 mb-1">General Comments:</p>
                            <p className="text-sm text-slate-600 italic bg-white p-2.5 rounded border border-slate-100">"{f.comment}"</p>
                          </div>
                        )}
                     </div>
                   )}
                </div>
              </details>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
