import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, Download, GraduationCap, FileText, Calendar, BookOpen, CheckCircle, Circle, PlayCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { formatHkDate, getHkDateString } from '../../lib/utils';
import { jsPDF } from 'jspdf';

const generateCertificatePDF = (cert: any) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  doc.setFillColor(240, 248, 255);
  doc.rect(0, 0, 297, 210, 'F');
  doc.setDrawColor(37, 99, 235);
  doc.setLineWidth(2);
  doc.rect(10, 10, 277, 190, 'S');
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(40);
  doc.text("Certificate of Completion", 148, 50, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(16);
  doc.text("This is to certify that", 148, 80, { align: 'center' });
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(30);
  doc.text(cert.studentName || "Student Name", 148, 105, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(16);
  doc.text("has successfully completed the course", 148, 130, { align: 'center' });
  doc.setTextColor(37, 99, 235);
  doc.setFontSize(24);
  doc.text(cert.course_title || cert.courseTitle || "Course Title", 148, 150, { align: 'center' });
  doc.setTextColor(100, 116, 139);
  doc.setFontSize(12);
  doc.text(`Issue Date: ${cert.issuedAt ? new Date(cert.issuedAt?.seconds ? cert.issuedAt.seconds * 1000 : cert.issuedAt).toLocaleDateString() : 'N/A'}`, 148, 175, { align: 'center' });
  doc.text(`Certificate ID: ${cert.id || 'N/A'}`, 148, 182, { align: 'center' });
  doc.setFillColor(234, 179, 8);
  doc.circle(148, 195, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("OFFICIAL", 148, 196, { align: 'center' });
  doc.save(`Certificate-${cert.course_title || cert.courseTitle || 'Course'}.pdf`);
};

export function StudentDashboard() {
  const { user, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [regs, setRegs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (role === 'student' && user) {
      const fetchData = async () => {
        try {
          const rq = query(collection(db, 'registrations'), where('studentEmail', '==', user.email));
          const rSnap = await getDocs(rq);
          const regsData = rSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          setRegs(regsData);
          
          try {
             const fq = query(collection(db, 'feedbacks'), where('studentEmail', '==', user.email));
             const fSnap = await getDocs(fq);
             setFeedbacks(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch (e) {
             // Ignore
          }
          
          const courseIds = Array.from(new Set(regsData.map((r: any) => r.courseId)));
          const sessionIds = Array.from(new Set(regsData.map((r: any) => r.sessionId).filter(Boolean)));

          if (courseIds.length > 0) {
            const courseDocs: any[] = [];
            for (let i = 0; i < courseIds.length; i += 10) {
              const chunk = courseIds.slice(i, i + 10);
              const cSnap = await getDocs(query(collection(db, 'courses'), where('__name__', 'in', chunk)));
              courseDocs.push(...cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setCourses(courseDocs);
          }

          if (sessionIds.length > 0) {
            const lessonDocs: any[] = [];
            for (let i = 0; i < sessionIds.length; i += 10) {
              const chunk = sessionIds.slice(i, i + 10);
              const lSnap = await getDocs(query(collection(db, 'lessons'), where('sessionId', 'in', chunk)));
              lessonDocs.push(...lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setLessons(lessonDocs.sort((a, b) => (a.lessonDate || '').localeCompare(b.lessonDate || '')));
          }

          const sessionsSnap = await getDocs(query(collection(db, 'course_sessions'), where('sessionStatus', '==', 'open')));
          const openCourseEarliestDate = new Map<string, string>();
          sessionsSnap.docs.forEach(d => {
             const data = d.data();
             const courseId = data.courseId;
             const startDate = data.startDate || '9999-12-31';
             if (!openCourseEarliestDate.has(courseId) || startDate < openCourseEarliestDate.get(courseId)!) {
                 openCourseEarliestDate.set(courseId, startDate);
             }
          });
          const allCSnap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'active')));
          const allC = allCSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          
          let availableToTake = allC.filter(c => !courseIds.includes(c.id)).map(c => ({
             ...c,
             hasOpenSession: openCourseEarliestDate.has(c.id),
             earliestDate: openCourseEarliestDate.get(c.id) || '9999-12-31'
          })).filter(c => c.hasOpenSession);

          availableToTake.sort((a, b) => a.earliestDate.localeCompare(b.earliestDate));
          
          setRecommended(availableToTake.slice(0, 3));

          if (regsData.length > 0 && courseIds.length > 0) {
             try {
                const cq = query(collection(db, 'certificates'), where('studentEmail', '==', user.email));
                const certSnap = await getDocs(cq);
                setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));
             } catch (e) {}
          }
        } catch (e) {
          console.error(e);
          toast.error("Failed to load your courses");
        } finally {
          setLoading(false);
        }
      };
      fetchData();
    }
  }, [role, user]);

  if (role !== 'student') return <div className="text-center py-20">Access Denied</div>;

  const validRegs = regs.filter(r => !!r.courseId && !!r.sessionId);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-600 text-white p-6 rounded-xl shadow-sm mb-8">
        <div>
           <h1 className="text-3xl font-bold">Student Dashboard</h1>
           <p className="opacity-80">Welcome back, {user?.displayName || user?.email}!</p>
        </div>
        <GraduationCap className="w-12 h-12 opacity-50" />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Course Progress</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card className="bg-gradient-to-br from-indigo-50 to-white">
                <CardHeader>
                   <CardTitle className="text-indigo-800">Enrolled Courses</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-4xl font-bold text-indigo-600">{validRegs.length}</div>
                </CardContent>
             </Card>
             <Card className="bg-gradient-to-br from-emerald-50 to-white">
                <CardHeader>
                   <CardTitle className="text-emerald-800">Certificates Earned</CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="text-4xl font-bold text-emerald-600">{certificates.length}</div>
                </CardContent>
             </Card>
             <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm cursor-pointer" onClick={() => setActiveTab('progress')}>
                <CardHeader className="py-4">
                   <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                         <PlayCircle className="w-6 h-6" />
                      </div>
                      <CardTitle className="text-sm font-semibold text-blue-800">Continue Learning</CardTitle>
                   </div>
                </CardHeader>
                <CardContent>
                    <p className="text-xs text-blue-700">Track your module progress and see upcoming lessons.</p>
                </CardContent>
             </Card>
          </div>

          <h3 className="text-lg font-bold mb-4 mt-8">Recommended Courses</h3>
          {recommended.length === 0 ? (
            <p className="text-slate-500 py-4">We don't have new recommendations at this time.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {recommended.map((c, i) => (
                <Card key={c.id} className="flex flex-col hover:border-blue-300 transition-colors cursor-pointer" onClick={() => navigate(`/course/${c.id}?from=/student/registrations`)}>
                  <CardHeader className="pb-3">
                    <div className="flex bg-transparent mb-2">
                       {c.hasOpenSession ? (
                         <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max flex items-center gap-1">
                           <Calendar className="w-3 h-3" /> Scheduled
                         </span>
                       ) : (
                         <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max">
                           {i === 0 ? 'Top Match' : i === 1 ? 'Skill Builder' : 'Trending'}
                         </span>
                       )}
                    </div>
                    <CardTitle className="text-md line-clamp-2">
                       {c.courseCode && <span className="font-mono text-sm text-slate-500 mr-2">{c.courseCode}</span>}
                       {c.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1">
                    <p className="text-sm text-slate-500 line-clamp-3">{c.description}</p>
                    {c.outlineName && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-2 py-1 rounded w-fit">
                           📄 Course Outline Available
                        </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button variant="outline" className="w-full">View Course</Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6 pt-4">
          {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin w-6 h-6 text-slate-400" /></div> : validRegs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-800">No courses yet</h3>
              <p className="text-slate-500 mb-4">You haven't registered for any courses yet.</p>
              <Link to="/"><Button>Browse Courses</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {validRegs.map(r => {
                const course = courses.find(c => c.id === r.courseId);
                const sessionLessons = lessons.filter(l => l.sessionId === r.sessionId);
                
                // Calculate progress
                const totalLessons = sessionLessons.length;
                let completedLessons = 0;
                let nextLesson = null;
                const today = getHkDateString();
                
                const attendanceRecords = r.attendanceRecords || {};

                sessionLessons.forEach(l => {
                    // Consider lesson completed if attendance is marked (am or pm or eve) or if it's strictly in the past
                    const rec = l.lessonDate && attendanceRecords[l.lessonDate];
                    const attended = rec && (rec.am || rec.pm || rec.eve);
                    const isPast = l.lessonDate && l.lessonDate < today;
                    if (attended || isPast) {
                        completedLessons++;
                    } else if (!nextLesson && l.lessonDate && l.lessonDate >= today) {
                        nextLesson = l;
                    }
                });

                const progressPercent = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

                return (
                 <Card key={r.id} className="flex flex-col border-slate-200 shadow-sm overflow-hidden">
                   <div className="bg-slate-50 border-b border-slate-100 p-5">
                       <div className="flex justify-between items-start gap-4">
                           <div>
                                <h3 className="text-lg font-bold text-slate-800">
                                    {course?.courseCode && <span className="font-mono text-sm text-slate-500 mr-2">{course.courseCode}</span>}
                                    {course?.title || 'Unknown Course'}
                                 </h3>
                                <p className="text-sm text-slate-500 mt-1">Session: {r.sessionId?.slice(-6)} • Payment: <span className={`font-medium ${r.status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>{r.status?.toUpperCase()}</span></p>
                           </div>
                           <div className="text-right shrink-0">
                               <div className="text-2xl font-black text-blue-600">{progressPercent}%</div>
                               <div className="text-xs text-slate-500 font-medium">Completed</div>
                           </div>
                       </div>
                       <div className="h-2 w-full bg-slate-200 rounded-full mt-4 overflow-hidden">
                           <div className="h-full bg-blue-600 transition-all duration-500 ease-in-out" style={{ width: `${progressPercent}%` }} />
                       </div>
                   </div>
                   
                   <CardContent className="p-0">
                       <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                           {/* Modules Tracking */}
                           <div className="p-5">
                               <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                                   <BookOpen className="w-4 h-4 text-indigo-500" />
                                   Modules & Lessons
                               </h4>
                               {totalLessons === 0 ? (
                                   <p className="text-xs text-slate-400">No lessons scheduled yet.</p>
                               ) : (
                                   <div className="space-y-4">
                                       {sessionLessons.map((l, i) => {
                                            const rec = l.lessonDate && attendanceRecords[l.lessonDate];
                                            const attended = rec && (rec.am || rec.pm || rec.eve);
                                            const isPast = l.lessonDate && l.lessonDate < today;
                                            const isCompleted = attended || isPast;
                                            const isNext = nextLesson && nextLesson.id === l.id;

                                            return (
                                                <div key={l.id} className="flex gap-3">
                                                    <div className="flex flex-col items-center">
                                                        {isCompleted ? (
                                                            <CheckCircle className="w-5 h-5 text-green-500 z-10 bg-white" />
                                                        ) : isNext ? (
                                                            <div className="w-5 h-5 rounded-full border-2 border-blue-500 flex items-center justify-center z-10 bg-white">
                                                                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                                            </div>
                                                        ) : (
                                                            <Circle className="w-5 h-5 text-slate-200 z-10 bg-white" />
                                                        )}
                                                        {i < sessionLessons.length - 1 && <div className="w-0.5 h-full bg-slate-100 -mt-2 -mb-2" />}
                                                    </div>
                                                    <div className={`pb-2 ${isCompleted ? 'opacity-70' : isNext ? '' : 'opacity-50'}`}>
                                                        <div className={`text-sm font-bold ${isNext ? 'text-blue-700' : 'text-slate-700'}`}>{l.lessonTitle || `Lesson ${l.lessonNumber || i+1}`}</div>
                                                        <div className="text-xs text-slate-500 mt-0.5">{l.lessonDate} • {l.startTime} - {l.endTime}</div>
                                                    </div>
                                                </div>
                                            )
                                       })}
                                   </div>
                               )}
                           </div>
                           
                           {/* Next Steps / Actions */}
                           <div className="p-5 flex flex-col justify-between bg-slate-50/50">
                               <div>
                                    <h4 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">Current Status</h4>
                                    
                                    {nextLesson ? (
                                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
                                            <div className="text-xs font-bold text-blue-600 mb-1">UPCOMING CLASS</div>
                                            <div className="font-bold text-slate-800">{nextLesson.lessonTitle || `Lesson ${nextLesson.lessonNumber}`}</div>
                                            <div className="text-sm text-slate-600 mt-1">{nextLesson.lessonDate} at {nextLesson.startTime}</div>
                                            {nextLesson.meetingLink && (
                                                <a href={nextLesson.meetingLink} target="_blank" rel="noreferrer" className="inline-block mt-2 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-md hover:bg-blue-700">Join Online</a>
                                            )}
                                        </div>
                                    ) : progressPercent >= 100 ? (
                                        <div className="bg-green-50 border border-green-100 rounded-lg p-4 mb-4">
                                            <div className="text-xs font-bold text-green-600 mb-1">COURSE COMPLETED</div>
                                            <div className="text-sm text-slate-600 mt-1">You have completed all scheduled lessons for this course.</div>
                                        </div>
                                    ) : (
                                        <p className="text-xs text-slate-500">Waiting for schedule...</p>
                                    )}
                               </div>

                               <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-slate-200">
                                    {progressPercent >= 100 && r.status === 'verified' && (
                                        // Feedback & Cert logic
                                        (() => {
                                            const hasSubmittedFeedback = feedbacks.some(f => f.sessionId === r.sessionId);
                                            const cert = certificates.find(c => c.registrationId === r.id);
                                            
                                            if (!hasSubmittedFeedback && !cert) {
                                                return (
                                                    <Link to={`/feedback/${r.courseId}?session=${r.sessionId}`} className="w-full">
                                                    <Button variant="secondary" className="w-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 font-bold uppercase tracking-wider text-[10px]">
                                                        <FileText className="w-3.5 h-3.5 mr-1.5" /> Submit Feedback to unlock certificate
                                                    </Button>
                                                    </Link>
                                                );
                                            }

                                            if (cert) {
                                                return (
                                                    <Button 
                                                    variant="default" 
                                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider text-[10px]"
                                                    onClick={() => generateCertificatePDF(cert)}
                                                    >
                                                    <Download className="w-3.5 h-3.5 mr-1.5" /> Download Certificate
                                                    </Button>
                                                );
                                            }
                                            return null;
                                        })()
                                    )}
                                    <Link to={`/payment-status/${r.id}`} className="w-full">
                                        <Button variant="outline" className="w-full bg-white text-slate-600 text-xs">View Registration details</Button>
                                    </Link>
                               </div>
                           </div>
                       </div>
                   </CardContent>
                 </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="schedule" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>My Class Schedule</CardTitle>
              <CardDescription>View your upcoming and past lesson dates</CardDescription>
            </CardHeader>
            <CardContent>
               {lessons.length === 0 ? (
                 <p className="text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">No scheduled classes found.</p>
               ) : (
                 <div className="space-y-3">
                   {lessons.map((l: any) => {
                      const courseName = courses.find(c => c.id === regs.find(r => r.sessionId === l.sessionId)?.courseId)?.title || "Course Session";
                      const isPast = l.lessonDate && l.lessonDate < getHkDateString();
                      return (
                        <div key={l.id} className={`flex items-start md:items-center justify-between p-4 border rounded-xl gap-4 ${isPast ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white border-blue-100 shadow-sm'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-full flex flex-col items-center justify-center shrink-0 ${isPast ? 'bg-slate-200 text-slate-500' : 'bg-blue-100 text-blue-600'}`}>
                               <Calendar className="w-5 h-5 mb-0.5" />
                               <span className="text-[9px] font-black">{l.lessonDate?.slice(5)}</span>
                            </div>
                            <div>
                               <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{l.lessonDate} • {l.startTime} - {l.endTime}</div>
                               <h4 className={`font-bold ${isPast ? 'text-slate-600' : 'text-slate-800'}`}>{courseName}</h4>
                               <p className="text-sm font-medium mt-0.5">{l.lessonTitle || `Lesson ${l.lessonNumber}`}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-xs text-slate-500">Classroom: <span className="font-semibold text-slate-700">{l.classroom || 'TBA'}</span></div>
                            {l.meetingLink && (
                               <a href={l.meetingLink} target="_blank" rel="noreferrer" className="text-xs text-blue-600 font-bold hover:underline mt-1 inline-block">Online Link</a>
                            )}
                          </div>
                        </div>
                      );
                   })}
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certificates" className="pt-4">
           <Card>
            <CardHeader>
              <CardTitle>My Certificates</CardTitle>
              <CardDescription>View and download your earned certificates</CardDescription>
            </CardHeader>
            <CardContent>
               {certificates.length === 0 ? (
                 <p className="text-slate-500 py-4 text-center border border-dashed border-slate-200 rounded-xl bg-slate-50">You have not earned any certificates yet. Complete a course and submit feedback to unlock.</p>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   {certificates.map(c => (
                     <div key={c.id} className="p-5 border border-slate-200 rounded-xl flex items-start gap-4">
                       <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
                         <GraduationCap className="w-6 h-6" />
                       </div>
                       <div>
                         <h4 className="font-bold text-slate-800">{c.course_title || "Course Certificate"}</h4>
                                                   <p className="text-xs text-slate-500 mt-1">Issued: {formatHkDate(c.issuedAt)}</p>
                         <p className="text-xs font-mono text-slate-400 mt-1">ID: {c.id}</p>
                         <a onClick={() => generateCertificatePDF(c)} className="inline-block mt-3 cursor-pointer">
                           <Button size="sm" className="gap-2 bg-slate-800 hover:bg-slate-900 text-white"><Download className="w-3 h-3"/> Download PDF</Button>
                         </a>
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
