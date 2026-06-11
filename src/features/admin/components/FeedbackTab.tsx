import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { ChevronLeft, Download, Star, ChevronDown, BarChart3, Users, Calendar, ArrowRight } from 'lucide-react';
import { getHkDateString } from '../../../lib/utils';

interface FeedbackTabProps {
  feedbacks: any[];
  courses: any[];
  sessions: any[];
  selectedFeedbackCourse: any | null;
  setSelectedFeedbackCourse: (course: any | null) => void;
  handleExportCSV: (data: any[], filename: string) => void;
  onOpenTemplate: () => void;
}

export function FeedbackTab({
  feedbacks,
  courses,
  sessions,
  selectedFeedbackCourse,
  setSelectedFeedbackCourse,
  handleExportCSV,
  onOpenTemplate
}: FeedbackTabProps) {
  
  const feedbacksBySession = useMemo(() => {
    const groups: Record<string, any> = {};
    
    // Create base groups for confirmed/completed sessions
    sessions.forEach(s => {
       if (s.sessionStatus === 'confirmed' || s.sessionStatus === 'completed' || s.sessionStatus === 'full') {
          const c = courses.find(course => course.id === (s.courseId || s.course_id));
          groups[s.id] = {
             id: s.id,
             isSession: true,
             courseName: c?.title || s.courseName || 'Unknown Course',
             sessionName: `${c?.title || s.courseName || 'Course'} (${s.startDate} to ${s.endDate})`,
             startDate: s.startDate,
             status: s.sessionStatus,
             feedbacks: [],
             metrics: { avgCourse: 0, avgTutor: 0, total: 0 }
          };
       }
    });

    // Group feedbacks
    feedbacks.forEach(f => {
       const groupId = f.sessionId || f.courseId;
       
       if (!groups[groupId]) {
          const course = courses.find(c => c.id === f.courseId);
          groups[groupId] = {
            id: groupId,
            isSession: !!f.sessionId,
            courseName: course?.title || f.courseName || 'Unknown Course',
            sessionName: course?.title || f.courseName || 'Unknown Course',
            startDate: f.date || '',
            feedbacks: [],
            metrics: { avgCourse: 0, avgTutor: 0, total: 0 }
          };
       }
       groups[groupId].feedbacks.push(f);
    });
    
    // Calculate metrics
    Object.values(groups).forEach((g: any) => {
      g.metrics.total = g.feedbacks.length;
      if (g.metrics.total > 0) {
        const totalCourse = g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.overallCourseScore) || parseFloat(curr.rating) || 0), 0);
        const totalTutor = g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.overallTutorScore) || parseFloat(curr.overallCourseScore) || 0), 0);
        g.metrics.avgCourse = (totalCourse / g.metrics.total).toFixed(1);
        g.metrics.avgTutor = (totalTutor / g.metrics.total).toFixed(1);
        
        // Calculate sub-metrics
        g.metrics.content = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.contentScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.level = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.levelScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.materials = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.materialsScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.facilities = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.facilitiesScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.practice = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.practiceScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.jobApplicability = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.jobApplicabilityScore) || 0), 0) / g.metrics.total).toFixed(1);
        
        g.metrics.tutorKnowledge = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.tutorKnowledgeScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.tutorPresentation = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.tutorPresentationScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.tutorOrganization = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.tutorOrganizationScore) || 0), 0) / g.metrics.total).toFixed(1);
        g.metrics.tutorAttention = (g.feedbacks.reduce((acc: number, curr: any) => acc + (parseFloat(curr.tutorAttentionScore) || 0), 0) / g.metrics.total).toFixed(1);
      }
    });
    
    // Only return groups that have feedbacks
    return Object.values(groups)
      .filter((g: any) => g.metrics.total > 0)
      .sort((a: any, b: any) => b.startDate?.localeCompare(a.startDate || '') || 0);
  }, [feedbacks, courses, sessions]);

  const ScoreBar = ({ label, score }: { label: string, score: number }) => (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1 font-medium text-slate-700">
        <span>{label}</span>
        <span className="font-bold">{score > 0 ? `${score} / 5` : 'N/A'}</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${score >= 4 ? 'bg-emerald-500' : score >= 3 ? 'bg-amber-400' : 'bg-red-400'}`} 
          style={{ width: `${(score / 5) * 100}%` }}
        ></div>
      </div>
    </div>
  );

  const getSentimentTags = (text: string) => {
    if (!text) return [];
    const tags: {label: string, className: string}[] = [];
    const lowerText = text.toLowerCase();
    
    if (/(好|good|great|excellent|實用|滿意|清晰|專業|可以|豐富|讚|nice)/.test(lowerText)) {
      tags.push({ label: 'Positive', className: 'bg-green-100 text-green-700 border-green-200' });
    }
    if (/(差|bad|poor|悶|慢|快|不清楚|改善|投訴|太少|難|不夠)/.test(lowerText)) {
      tags.push({ label: 'Needs Attention', className: 'bg-red-100 text-red-700 border-red-200' });
    }
    if (/(建議|希望|可以加|需要|would be better|suggest|idea)/.test(lowerText)) {
      tags.push({ label: 'Suggestion', className: 'bg-blue-100 text-blue-700 border-blue-200' });
    }
    return tags;
  };

  return (
    <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
        <div className="flex items-center gap-4">
          {selectedFeedbackCourse && (
            <Button variant="outline" size="sm" onClick={() => setSelectedFeedbackCourse(null)} className="h-8 w-8 p-0 rounded-full border-slate-200 hover:bg-slate-50">
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </Button>
          )}
          <div>
             <CardTitle className="text-xl font-black text-slate-800 tracking-tight">
               {selectedFeedbackCourse ? 'Feedback Analytics' : 'Course Feedback Overview'}
             </CardTitle>
             {selectedFeedbackCourse && (
                <CardDescription className="text-xs font-semibold text-indigo-600 mt-0.5">{selectedFeedbackCourse.sessionName}</CardDescription>
             )}
          </div>
        </div>
        {!selectedFeedbackCourse ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onOpenTemplate} className="gap-2 h-9 text-[10px] uppercase font-bold tracking-wider rounded-lg border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800">
              <Star className="w-3.5 h-3.5" /> Feedback Template
            </Button>
            <Button variant="outline" size="sm" onClick={() => {
            const formattedData = feedbacks.map((f: any) => {
              const course = courses.find((c:any) => c.id === f.courseId);
              return {
                "Course Name": course?.title || f.courseName || 'Unknown Course',
                "Student Name": f.studentName || 'Anonymous',
                "Student Email": f.studentEmail || 'N/A',
                "Company": f.companyName || 'N/A',
                "Date Submitted": f.date || 'N/A',
                "Overall Course Score (1-5)": f.overallCourseScore || f.rating || 'N/A',
                "Course Content (1-5)": f.contentScore || 'N/A',
                "Course Level (1-5)": f.levelScore || 'N/A',
                "Materials Useful (1-5)": f.materialsScore || 'N/A',
                "Facilities (1-5)": f.facilitiesScore || 'N/A',
                "Practice (1-5)": f.practiceScore || 'N/A',
                "Job Applicability (1-5)": f.jobApplicabilityScore || 'N/A',
                "Overall Instructor Score (1-5)": f.overallTutorScore || 'N/A',
                "Instructor Subject Knowledge (1-5)": f.tutorKnowledgeScore || 'N/A',
                "Instructor Organization (1-5)": f.tutorOrganizationScore || 'N/A',
                "Instructor Presentation (1-5)": f.tutorPresentationScore || 'N/A',
                "Instructor Individual Attention (1-5)": f.tutorAttentionScore || 'N/A',
                "Most Useful Topics": f.usefulTopics || 'N/A',
                "Least Useful Topics": f.leastUsefulTopics || 'N/A',
                "Met Objective?": f.meetObjective || 'N/A',
                "General Remarks": f.comment || 'N/A',
                "Instructor Feedback": f.trainerFeedback || 'N/A'
              };
            });
            handleExportCSV(formattedData, 'all-feedback-report');
          }} className="gap-2 h-9 text-[10px] uppercase font-bold tracking-wider rounded-lg"><Download className="w-3.5 h-3.5" /> Export All</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" onClick={() => {
            const formattedData = selectedFeedbackCourse.feedbacks.map((f: any) => ({
                "Course Name": selectedFeedbackCourse.courseName || f.courseName || 'N/A',
                "Student Name": f.studentName || 'Anonymous',
                "Student Email": f.studentEmail || 'N/A',
                "Company": f.companyName || 'N/A',
                "Date Submitted": f.date || 'N/A',
                "Overall Course Score (1-5)": f.overallCourseScore || f.rating || 'N/A',
                "Course Content (1-5)": f.contentScore || 'N/A',
                "Course Level (1-5)": f.levelScore || 'N/A',
                "Materials Useful (1-5)": f.materialsScore || 'N/A',
                "Facilities (1-5)": f.facilitiesScore || 'N/A',
                "Practice (1-5)": f.practiceScore || 'N/A',
                "Job Applicability (1-5)": f.jobApplicabilityScore || 'N/A',
                "Overall Instructor Score (1-5)": f.overallTutorScore || 'N/A',
                "Instructor Subject Knowledge (1-5)": f.tutorKnowledgeScore || 'N/A',
                "Instructor Organization (1-5)": f.tutorOrganizationScore || 'N/A',
                "Instructor Presentation (1-5)": f.tutorPresentationScore || 'N/A',
                "Instructor Individual Attention (1-5)": f.tutorAttentionScore || 'N/A',
                "Most Useful Topics": f.usefulTopics || 'N/A',
                "Least Useful Topics": f.leastUsefulTopics || 'N/A',
                "Met Objective?": f.meetObjective || 'N/A',
                "General Remarks": f.comment || 'N/A',
                "Instructor Feedback": f.trainerFeedback || 'N/A'
            }));
            handleExportCSV(formattedData, `feedback-${selectedFeedbackCourse.sessionName || 'report'}`);
          }} className="gap-2 h-9 text-[10px] uppercase font-bold tracking-wider rounded-lg"><Download className="w-3.5 h-3.5" /> Export Selected CSV</Button>
        )}
      </CardHeader>
      
      <CardContent className="pt-6">
        {!selectedFeedbackCourse ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedbacksBySession.map((group: any) => (
              <div 
                key={group.id} 
                onClick={() => group.metrics.total > 0 && setSelectedFeedbackCourse(group)}
                className={`relative bg-white border border-slate-200 rounded-xl p-5 shadow-sm transition-all duration-200 ${group.metrics.total > 0 ? 'cursor-pointer hover:shadow-md hover:border-indigo-300 hover:-translate-y-1' : 'opacity-70 cursor-not-allowed'}`}
              >
                {group.status && (
                  <span className="absolute top-4 right-4 text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {group.status}
                  </span>
                )}
                <div className="mb-4 pr-16">
                  <h3 className="font-bold text-slate-800 text-sm leading-tight line-clamp-2">{group.courseName}</h3>
                  {group.isSession && group.startDate && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5 font-medium"><Calendar className="w-3 h-3" /> {group.startDate}</p>
                  )}
                </div>
                
                <div className="flex items-center gap-4 mt-6 pt-4 border-t border-slate-100">
                  <div className="flex-1">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Responses</p>
                    <p className="font-black text-slate-800 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-400" /> {group.metrics.total}</p>
                  </div>
                  <div className="flex-1 border-l border-slate-100 pl-4">
                    <p className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">Avg Score</p>
                    <p className="font-black text-amber-600 flex items-center gap-1.5"><Star className="w-4 h-4 fill-current" /> {group.metrics.avgCourse || 'N/A'}</p>
                  </div>
                </div>
              </div>
            ))}
            
            {feedbacksBySession.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 font-medium">No confirmed courses or feedbacks available.</div>
            )}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><Star className="w-12 h-12 text-amber-500 fill-current" /></div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1 relative z-10">Course Rating</p>
                  <div className="flex items-end gap-1 relative z-10">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{selectedFeedbackCourse.metrics.avgCourse}</span>
                    <span className="text-slate-500 font-bold mb-1">/ 5</span>
                  </div>
               </div>
               <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-3 opacity-20"><Star className="w-12 h-12 text-emerald-500 fill-current" /></div>
                  <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1 relative z-10">Instructor Rating</p>
                  <div className="flex items-end gap-1 relative z-10">
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{selectedFeedbackCourse.metrics.avgTutor}</span>
                    <span className="text-slate-500 font-bold mb-1">/ 5</span>
                  </div>
               </div>
               <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 md:col-span-2 relative overflow-hidden flex items-center justify-between">
                  <div className="absolute top-0 right-0 p-3 opacity-10"><Users className="w-16 h-16 text-indigo-500" /></div>
                  <div className="relative z-10">
                    <p className="text-xs uppercase tracking-wider font-bold text-slate-500 mb-1">Total Responses</p>
                    <span className="text-4xl font-black text-slate-800 tracking-tighter">{selectedFeedbackCourse.metrics.total}</span>
                    <span className="text-slate-500 ml-2 font-medium">Students completed form</span>
                  </div>
               </div>
            </div>

            {/* Radar / Detailed Bar Charts */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
               <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" /> Part A: Course Metrics</h3>
                  <ScoreBar label="Course Content" score={parseFloat(selectedFeedbackCourse.metrics.content)} />
                  <ScoreBar label="Course Level" score={parseFloat(selectedFeedbackCourse.metrics.level)} />
                  <ScoreBar label="Materials Usefulness" score={parseFloat(selectedFeedbackCourse.metrics.materials)} />
                  <ScoreBar label="Facilities & Environment" score={parseFloat(selectedFeedbackCourse.metrics.facilities)} />
                  <ScoreBar label="Practice / Exercise" score={parseFloat(selectedFeedbackCourse.metrics.practice)} />
                  <ScoreBar label="Job Applicability" score={parseFloat(selectedFeedbackCourse.metrics.jobApplicability)} />
               </div>
               <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                  <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-6 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-500" /> Part B: Instructor Metrics</h3>
                  <ScoreBar label="Subject Knowledge" score={parseFloat(selectedFeedbackCourse.metrics.tutorKnowledge)} />
                  <ScoreBar label="Organization & Logic" score={parseFloat(selectedFeedbackCourse.metrics.tutorOrganization)} />
                  <ScoreBar label="Presentation Skills" score={parseFloat(selectedFeedbackCourse.metrics.tutorPresentation)} />
                  <ScoreBar label="Individual Attention" score={parseFloat(selectedFeedbackCourse.metrics.tutorAttention)} />
               </div>
            </div>

            {/* Qualitative Feedback */}
            <div>
              <h3 className="font-black text-slate-800 text-sm uppercase tracking-wider mb-4 px-1">Individual Qualitative Remarks</h3>
              <div className="space-y-4">
                {selectedFeedbackCourse.feedbacks.map((f: any, i: number) => {
                   const hasText = f.usefulTopics || f.leastUsefulTopics || f.meetObjective || f.comment;
                   const combinedTextForTagging = `${f.usefulTopics || ''} ${f.leastUsefulTopics || ''} ${f.meetObjective || ''} ${f.comment || ''}`;
                   const tags = getSentimentTags(combinedTextForTagging);
                   
                   return (
                     <div key={f.id} className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                        <div className="flex justify-between items-start mb-4">
                           <div>
                             <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">{i + 1}. {f.studentName || 'Anonymous'}</h4>
                             <div className="flex items-center gap-2 mt-1">
                               <p className="text-xs text-slate-500">{f.companyName || 'No Company'} • {f.date || 'N/A'}</p>
                               {tags.map((tag, idx) => (
                                 <span key={idx} className={`text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border shadow-sm ${tag.className}`}>
                                   {tag.label}
                                 </span>
                               ))}
                             </div>
                           </div>
                           <div className="flex gap-2">
                             <span className="bg-white text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-md border border-slate-200 shadow-sm">
                               Course: <span className="text-amber-600">{f.overallCourseScore}</span><Star className="w-3 h-3 text-amber-500 inline -mt-0.5 ml-0.5 fill-current" />
                             </span>
                             <span className="bg-white text-[10px] font-bold uppercase tracking-wider px-2 py-1.5 rounded-md border border-slate-200 shadow-sm">
                               Instructor: <span className="text-emerald-600">{f.overallTutorScore}</span><Star className="w-3 h-3 text-emerald-500 inline -mt-0.5 ml-0.5 fill-current" />
                             </span>
                           </div>
                        </div>

                        {hasText ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-200/60">
                             {f.usefulTopics && (
                               <div>
                                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Most Useful</p>
                                 <p className="text-sm font-medium text-slate-700 leading-relaxed">"{f.usefulTopics}"</p>
                               </div>
                             )}
                             {f.leastUsefulTopics && (
                               <div>
                                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Least Useful</p>
                                 <p className="text-sm font-medium text-slate-700 leading-relaxed">"{f.leastUsefulTopics}"</p>
                               </div>
                             )}
                             {f.meetObjective && (
                               <div>
                                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">Met Objective?</p>
                                 <p className="text-sm font-medium text-slate-700 leading-relaxed">"{f.meetObjective}"</p>
                               </div>
                             )}
                             {f.comment && (
                               <div>
                                 <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider mb-1">General Remarks</p>
                                 <p className="text-sm font-medium text-slate-700 leading-relaxed">"{f.comment}"</p>
                               </div>
                             )}
                          </div>
                        ) : (
                          <p className="text-slate-400 italic text-xs mt-2">No written remarks submitted.</p>
                        )}
                     </div>
                   );
                })}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
