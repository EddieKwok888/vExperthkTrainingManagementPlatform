import React, { useState, useEffect, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, query, getDocs, where } from 'firebase/firestore';
import { AuthContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Loader2, Download, CheckCircle, GraduationCap, FileText, Calendar, BookOpen } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { formatHkDate, getHkDateString } from '../lib/utils';
import { jsPDF } from 'jspdf';

const generateCertificatePDF = (cert: any) => {
  const doc = new jsPDF({ orientation: 'landscape' });
  
  // Simple design
  doc.setFillColor(240, 248, 255);
  doc.rect(0, 0, 297, 210, 'F');
  
  // Border
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
  
  // Ribbon/Seal
  doc.setFillColor(234, 179, 8); // amber-500
  doc.circle(148, 195, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("OFFICIAL", 148, 196, { align: 'center' });

  doc.save(`Certificate-${cert.course_title || cert.courseTitle || 'Course'}.pdf`);
};

export function MyCourses() {
  const { user, role } = useContext(AuthContext);
  const [regs, setRegs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

          // Fetch course template details for titles
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
            // Sort lessons chronologically
            setLessons(lessonDocs.sort((a, b) => (a.lessonDate || '').localeCompare(b.lessonDate || '')));
          }

          // Fetch all active courses for recommendations
          const allCSnap = await getDocs(query(collection(db, 'courses'), where('status', '==', 'active')));
          const allC = allCSnap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
          // Simple recommendation: courses not yet taken
          const availableToTake = allC.filter(c => !courseIds.includes(c.id)).slice(0, 3);
          setRecommended(availableToTake);

          if (regsData.length > 0) {
            // Firestore 'in' queries are limited to 10
            if (courseIds.length > 0) {
               try {
                  const mq = query(collection(db, 'materials'), where('courseId', 'in', courseIds.slice(0, 10)));
                  const mSnap = await getDocs(mq);
                  setMaterials(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
               } catch (e) {
                  // Ignore
               }
               
               try {
                  const cq = query(collection(db, 'certificates'), where('studentEmail', '==', user.email));
                  const certSnap = await getDocs(cq);
                  setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));
               } catch (e) {
                  // Ignore
               }
            }
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-600 text-white p-6 rounded-xl shadow-sm mb-8">
        <div>
           <h1 className="text-3xl font-bold">Student Portal</h1>
           <p className="opacity-80">Welcome back, {user?.displayName || user?.email}!</p>
        </div>
        <GraduationCap className="w-12 h-12 opacity-50" />
      </div>
      
      <Tabs defaultValue="courses">
        <TabsList>
          <TabsTrigger value="courses">My Courses</TabsTrigger>
          <TabsTrigger value="schedule">Class Schedule</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="recommendations" className="text-blue-600">AI Advisory</TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="pt-4">
           <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm mb-6">
              <CardContent className="pt-6">
                 <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                    <div className="bg-blue-100 p-4 rounded-full text-blue-600">
                       <GraduationCap className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-lg font-bold text-slate-800">Your AI Learning Path Advisor</h3>
                       <p className="text-sm text-slate-600 mt-1">Based on your learning history and current market trends, we've identified key skills for your career progression.</p>
                       <p className="text-xs font-semibold text-blue-600 mt-3 cursor-pointer" onClick={() => window.dispatchEvent(new CustomEvent('open-chatbot', { detail: { initialMessage: "What course should I take next to advance my career?" } }))}>
                          💬 Chat with AI Advisor for personalized guidance →
                       </p>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <h3 className="text-lg font-bold mb-4 mt-8">Recommended For You</h3>
           {recommended.length === 0 ? (
             <p className="text-slate-500 py-4">We don't have new recommendations at this time.</p>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               {recommended.map((c, i) => (
                 <Card key={c.id} className="flex flex-col hover:border-blue-300 transition-colors cursor-pointer" onClick={() => window.location.href = `/course/${c.id}`}>
                   <CardHeader className="pb-3">
                     <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max mb-2">
                       {i === 0 ? 'Top Match' : i === 1 ? 'Skill Builder' : 'Trending'}
                     </span>
                     <CardTitle className="text-md line-clamp-2">{c.title}</CardTitle>
                   </CardHeader>
                   <CardContent className="flex-1">
                     <p className="text-sm text-slate-500 line-clamp-3">{c.description}</p>
                   </CardContent>
                   <CardFooter>
                     <Button variant="outline" className="w-full">View Course</Button>
                   </CardFooter>
                 </Card>
               ))}
             </div>
           )}
        </TabsContent>

        <TabsContent value="courses" className="space-y-6 pt-4">
          {loading ? <div className="flex justify-center p-10"><Loader2 className="animate-spin w-6 h-6 text-slate-400" /></div> : regs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-slate-800">No courses yet</h3>
              <p className="text-slate-500 mb-4">You haven't registered for any courses yet.</p>
              <Link to="/"><Button>Browse Courses</Button></Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {regs.map(r => {
                const course = courses.find(c => c.id === r.courseId);
                return (
                 <Card key={r.id} className="flex flex-col">
                   <CardHeader>
                     <CardTitle className="text-lg line-clamp-2">{course?.title || 'Unknown Course'}</CardTitle>
                     <CardDescription>Intake: {r.sessionId?.slice(-6)}</CardDescription>
                   </CardHeader>
                   <CardContent className="flex-1">
                     <div className="space-y-2 text-sm">
                       <div className="flex justify-between">
                         <span className="text-slate-500">Payment:</span>
                         <span className={`font-medium ${r.status === 'verified' ? 'text-green-600' : 'text-amber-600'}`}>{r.status?.toUpperCase()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-slate-500">Amount:</span>
                         <span className="font-semibold">${r.amount}</span>
                       </div>
                     </div>
                   </CardContent>
                   <CardFooter className="flex flex-col gap-2 relative z-0">
                     <Link to={`/payment-status/${r.id}`} className="w-full">
                       <Button variant="outline" className="w-full bg-slate-50 hover:bg-slate-100 border-slate-200">View Status</Button>
                     </Link>
                     {(() => {
                        if (r.status !== 'verified') return null;

                        const hasSubmittedFeedback = feedbacks.some(f => f.sessionId === r.sessionId);
                        const cert = certificates.find(c => c.registrationId === r.id);
                        
                        if (!hasSubmittedFeedback && !cert) {
                          const isFullyAttended = r.amConfirmed && r.pmConfirmed;
                          
                          if (!isFullyAttended) {
                            return (
                              <Button disabled variant="outline" className="w-full bg-slate-100 text-slate-400 border-slate-200 font-bold uppercase tracking-wider text-[10px] cursor-not-allowed">
                                <FileText className="w-3.5 h-3.5 mr-1.5" /> Pending Completion
                              </Button>
                            );
                          }
                          
                          return (
                            <Link to={`/feedback/${r.courseId}?session=${r.sessionId}`} className="w-full">
                              <Button variant="secondary" className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold uppercase tracking-wider text-[10px]">
                                <FileText className="w-3.5 h-3.5 mr-1.5" /> Submit Feedback
                              </Button>
                            </Link>
                          );
                        }

                        if (cert) {
                          return (
                            <Button 
                              variant="default" 
                              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold uppercase tracking-wider text-[10px]"
                              onClick={() => {
                                const tabMatch = document.querySelector('[value="certificates"]') as HTMLButtonElement;
                                if (tabMatch) tabMatch.click();
                                toast.success("Check the Certificates tab to download your copy!");
                              }}
                            >
                              <Download className="w-3.5 h-3.5 mr-1.5" /> Download Certificate
                            </Button>
                          );
                        }
                        return null;
                     })()}
                   </CardFooter>
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

        <TabsContent value="materials" className="pt-4">
          <Card>
            <CardHeader>
              <CardTitle>Course Materials</CardTitle>
              <CardDescription>Download slides and resources for your courses</CardDescription>
            </CardHeader>
            <CardContent>
               {materials.length === 0 ? (
                 <p className="text-slate-500 py-4 text-center">No materials available for your courses at the moment.</p>
               ) : (
                 <div className="space-y-4">
                   {materials.map(m => (
                     <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-lg">
                       <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                           <FileText className="w-5 h-5" />
                         </div>
                         <div>
                           <h4 className="font-medium text-slate-800">{m.title}</h4>
                           <p className="text-xs text-slate-500">For Course: {m.courseId}</p>
                         </div>
                       </div>
                       <a href={m.file_url} target="_blank" rel="noreferrer">
                         <Button variant="outline" size="sm" className="gap-2"><Download className="w-4 h-4"/> Download</Button>
                       </a>
                     </div>
                   ))}
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
                 <p className="text-slate-500 py-4 text-center">You have not earned any certificates yet.</p>
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
