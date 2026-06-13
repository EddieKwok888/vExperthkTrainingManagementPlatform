import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, getDocs, where, doc, getDoc } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Loader2, Download, GraduationCap, FileText, Calendar, BookOpen, CheckCircle, Circle, PlayCircle, LayoutDashboard, Award, MapPin, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { WarningTextFormatter } from '../../components/ui/WarningTextFormatter';
import { formatHkDate, getHkDateString } from '../../lib/utils';
import { jsPDF } from 'jspdf';
import { ProfileSettingsTab } from '../../components/profile/ProfileSettingsTab';
import { User as UserIcon } from 'lucide-react';

const generateCertificatePDF = async (cert: any) => {
  const pdf = new jsPDF({ orientation: 'landscape' });
  pdf.setFillColor(240, 248, 255);
  pdf.rect(0, 0, 297, 210, 'F');
  pdf.setDrawColor(37, 99, 235);
  pdf.setLineWidth(2);
  pdf.rect(10, 10, 277, 190, 'S');

  try {
    const docRef = doc(db, 'settings', 'school_info');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists() && docSnap.data().logo_url) {
      const logoUrl = docSnap.data().logo_url;
      if (logoUrl.startsWith('data:image')) {
        pdf.addImage(logoUrl, 'PNG', 133, 15, 30, 30); // Center logo at the top
      }
    }
  } catch (e) {
    console.error('Could not load logo for certificate', e);
  }

  pdf.setTextColor(30, 58, 138);
  pdf.setFontSize(40);
  pdf.text("Certificate of Completion", 148, 60, { align: 'center' });
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(16);
  pdf.text("This is to certify that", 148, 85, { align: 'center' });
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(30);
  pdf.text(cert.studentName || "Student Name", 148, 110, { align: 'center' });
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(16);
  pdf.text("has successfully completed the course", 148, 135, { align: 'center' });
  pdf.setTextColor(37, 99, 235);
  pdf.setFontSize(24);
  pdf.text(cert.course_title || cert.courseTitle || "Course Title", 148, 155, { align: 'center' });
  pdf.setTextColor(100, 116, 139);
  pdf.setFontSize(12);
  
  let issueDateStr = "N/A";
  if (cert.issuedAt || cert.issued_at) {
    const dVal = cert.issuedAt || cert.issued_at;
    const d = new Date(dVal.seconds ? dVal.seconds * 1000 : dVal);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      issueDateStr = `${day}/${month}/${d.getFullYear()}`;
    }
  } else {
    const d = new Date();
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    issueDateStr = `${day}/${month}/${d.getFullYear()}`;
  }
  pdf.text(`Issue Date: ${issueDateStr}`, 148, 175, { align: 'center' });
  
  pdf.setFillColor(234, 179, 8);
  pdf.circle(148, 195, 12, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text("OFFICIAL", 148, 196, { align: 'center' });
  pdf.save(`Certificate-${cert.course_title || cert.courseTitle || 'Course'}.pdf`);
};

export function StudentDashboard() {
  const { user, role } = useContext(AuthContext);
  const navigate = useNavigate();
  const [regs, setRegs] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [recommended, setRecommended] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [enrolledSessions, setEnrolledSessions] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [attendanceLogs, setAttendanceLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (role === 'student' && user) {
      const fetchData = async () => {
        try {
          const rqEmail = query(collection(db, 'registrations'), where('studentEmail', '==', user.email));
          const rqId = query(collection(db, 'registrations'), where('studentId', '==', user.uid));
          
          const [rSnapEmail, rSnapId] = await Promise.all([getDocs(rqEmail), getDocs(rqId)]);
          
          const regsMap = new Map();
          rSnapEmail.docs.forEach(d => regsMap.set(d.id, { id: d.id, ...(d.data() as any) }));
          rSnapId.docs.forEach(d => regsMap.set(d.id, { id: d.id, ...(d.data() as any) }));
          
          const regsData = Array.from(regsMap.values());
          setRegs(regsData);
          
          try {
             const fq = query(collection(db, 'feedbacks'), where('studentEmail', '==', user.email));
             const fSnap = await getDocs(fq);
             setFeedbacks(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          } catch (e) {
             // Ignore
          }
          
          const courseIds = Array.from(new Set(regsData.map((r: any) => r.courseId).filter(Boolean)));
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
            const sessionDocs: any[] = [];
            for (let i = 0; i < sessionIds.length; i += 10) {
              const chunk = sessionIds.slice(i, i + 10);
              const lSnap = await getDocs(query(collection(db, 'lessons'), where('sessionId', 'in', chunk)));
              lessonDocs.push(...lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
              
              const sSnap = await getDocs(query(collection(db, 'course_sessions'), where('__name__', 'in', chunk)));
              sessionDocs.push(...sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            }
            setLessons(lessonDocs.sort((a, b) => (a.lessonDate || '').localeCompare(b.lessonDate || '')));
            setEnrolledSessions(sessionDocs);
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

             try {
                // Fetch attendance for all sessions the student is enrolled in
                const attDocs: any[] = [];
                const sessionIdsList = Array.from(new Set(regsData.map((r: any) => r.sessionId).filter(Boolean)));
                for (let i = 0; i < sessionIdsList.length; i += 10) {
                  const chunk = sessionIdsList.slice(i, i + 10);
                  const attSnap = await getDocs(query(collection(db, 'attendance'), where('sessionId', 'in', chunk)));
                  attDocs.push(...attSnap.docs.map(d => ({ id: d.id, ...d.data() })));
                }
                
                const myRegistrationIds = new Set(regsData.map((r: any) => r.id));
                const myAtt = attDocs.filter(a => 
                  a.studentId === user.uid || 
                  myRegistrationIds.has(a.registrationId) || 
                  myRegistrationIds.has(a.studentId)
                );
                console.log("DEBUG: fetched attendance logs for student:", myAtt, "regsData:", regsData);
                setAttendanceLogs(myAtt);
             } catch (e) {
                console.error("Failed to load attendance", e);
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

  const validRegs = regs.filter(r => !!r.courseId && !!r.sessionId);
  const verifiedSessionIds = new Set(validRegs.filter(r => r.status?.toLowerCase() === 'verified').map(r => r.sessionId));
  const todayStr = getHkDateString();
  const scheduleLessons = lessons.filter(l => verifiedSessionIds.has(l.sessionId)).sort((a, b) => {
    const aPast = a.lessonDate < todayStr;
    const bPast = b.lessonDate < todayStr;
    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;
    if (aPast && bPast) return (b.lessonDate || '').localeCompare(a.lessonDate || '');
    return (a.lessonDate || '').localeCompare(b.lessonDate || '');
  });
  const scheduleSessions = enrolledSessions.filter(s => verifiedSessionIds.has(s.id)).sort((a, b) => {
    const aPast = (a.endDate || a.startDate) < todayStr;
    const bPast = (b.endDate || b.startDate) < todayStr;
    if (aPast && !bPast) return 1;
    if (!aPast && bPast) return -1;
    if (aPast && bPast) return (b.startDate || '').localeCompare(a.startDate || '');
    return (a.startDate || '').localeCompare(b.startDate || '');
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-blue-600 text-white p-6 rounded-xl shadow-sm mb-8">
        <div>
           <h1 className="text-3xl font-bold">Student Dashboard</h1>
           <p className="opacity-80">Welcome back, {regs.length > 0 ? regs[0].studentName : (user?.displayName || user?.email)}!</p>
        </div>
        <GraduationCap className="w-12 h-12 opacity-50" />
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1.5 w-fit shadow-inner mb-6">
          <TabsTrigger 
            value="overview"
            className="data-active:!bg-indigo-600 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-indigo-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
          >
            <LayoutDashboard className="w-4 h-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger 
            value="progress"
            className="data-active:!bg-emerald-600 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            Course Progress
          </TabsTrigger>
          <TabsTrigger 
            value="certificates"
            className="data-active:!bg-amber-500 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-amber-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
          >
            <Award className="w-4 h-4" />
            Certificates
          </TabsTrigger>
          <TabsTrigger 
            value="profile"
            className="data-active:!bg-blue-600 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-blue-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
          >
            <UserIcon className="w-4 h-4" />
            Profile Settings
          </TabsTrigger>
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
             <Card className="border-blue-100 bg-gradient-to-br from-blue-50 to-white shadow-sm cursor-pointer" onClick={() => navigate('/')}>
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
                       {c.hasOpenSession && c.earliestDate !== '9999-12-31' ? (
                         <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max flex items-center gap-1">
                           <Calendar className="w-3 h-3" /> Upcoming: {c.earliestDate}
                         </span>
                       ) : (
                         <span className="bg-blue-100 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase w-max">
                           {i === 0 ? 'Top Match' : i === 1 ? 'Skill Builder' : 'Trending'}
                         </span>
                       )}
                    </div>
                    <CardTitle className="text-md line-clamp-2" title={`${c.courseCode ? c.courseCode + ' ' : ''}${c.title} - ${c.earliestDate !== '9999-12-31' ? c.earliestDate : 'TBD'}`}>
                       {c.courseCode ? `${c.courseCode} ` : ''}{c.title} - {c.earliestDate !== '9999-12-31' ? c.earliestDate : 'TBD'}
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
              {[...validRegs].sort((a, b) => {
                 const sessionA = enrolledSessions.find(s => s.id === a.sessionId) || {} as any;
                 const sessionB = enrolledSessions.find(s => s.id === b.sessionId) || {} as any;
                 const todayStr = getHkDateString();
                 const aPast = (sessionA.endDate || sessionA.startDate || '') < todayStr;
                 const bPast = (sessionB.endDate || sessionB.startDate || '') < todayStr;
                 if (aPast && !bPast) return 1;
                 if (!aPast && bPast) return -1;
                 if (aPast && bPast) return (sessionB.startDate || '').localeCompare(sessionA.startDate || '');
                 return (sessionA.startDate || '').localeCompare(sessionB.startDate || '');
              }).map(r => {
                const course = courses.find(c => c.id === r.courseId);
                const session = enrolledSessions.find(s => s.id === r.sessionId);
                let sessionLessons = lessons.filter(l => l.sessionId === r.sessionId);
                
                if (session) {
                    // We no longer filter by course date range to allow makeup/rescheduled lessons
                    
                    // Deduplicate existing lessons by date to prevent duplicate Day 1s
                    const uniqueLessonsMap = new Map();
                    sessionLessons.forEach(l => {
                      if (l.lessonDate && !uniqueLessonsMap.has(l.lessonDate)) {
                        uniqueLessonsMap.set(l.lessonDate, l);
                      }
                    });
                    sessionLessons = Array.from(uniqueLessonsMap.values()).sort((a: any, b: any) => (a.lessonDate || "").localeCompare(b.lessonDate || ""));
                }
                
                // Calculate progress
                // Calculate progress based on course duration (days)
                const totalCourseDays = parseFloat(course?.day || '1');
                let attendedDays = 0;
                let nextLesson = null;
                const today = getHkDateString();
                
                sessionLessons.forEach(l => {
                    const attsForLesson = attendanceLogs.filter(a => a.lessonId === l.id);
                    const amMark = attsForLesson.some(a => a.status === 'present_am' || a.present_am === true);
                    const pmMark = attsForLesson.some(a => a.status === 'present_pm' || a.present_pm === true);
                    const fullMark = attsForLesson.some(a => a.status === 'present' || a.present === true || (a.present_am === true && a.present_pm === true));

                    console.log(`DEBUG: Lesson ${l.id} - atts:`, attsForLesson, `am: ${amMark}, pm: ${pmMark}, full: ${fullMark}`);

                    if (fullMark) {
                        attendedDays += 1.0;
                    } else if (amMark || pmMark) {
                        attendedDays += 0.5;
                    }

                    if (!nextLesson && l.lessonDate && l.lessonDate >= today) {
                        nextLesson = l;
                    }
                });

                const progressPercent = totalCourseDays <= 0 ? 0 : Math.min(100, Math.round((attendedDays / totalCourseDays) * 100));
                const isExpired = !!session && (session.endDate || session.startDate || '') < today;
                const hasSubmittedFeedback = feedbacks.some(f => f.sessionId === r.sessionId);
                const shouldGrayOut = isExpired && hasSubmittedFeedback;

                return (
                 <Card key={r.id} className={`flex flex-col border-slate-200 shadow-sm overflow-hidden ${shouldGrayOut ? 'opacity-60 grayscale bg-slate-50' : ''}`}>
                    <div className="bg-white p-5 border-b border-slate-100">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> My Class Schedule</h4>
                        
                        <h3 className="text-lg font-bold text-slate-800 mb-4">
                            {course?.courseCode && <span className="font-mono text-sm text-slate-500 mr-2">{course.courseCode}</span>}
                            {course?.title || 'Unknown Course'}
                        </h3>
                        
                        {session ? (
                            <div className="flex flex-col gap-1.5 text-sm py-2">
                                <div className="font-medium text-slate-700">
                                    <span className="text-blue-600 font-bold mr-2">{session.startDate} to {session.endDate}</span>
                                </div>
                                {(session.deliveryMode === 'online' || (session.room || '').toLowerCase().includes('online') || (session.classroom || '').toLowerCase().includes('online')) ? (
                                    <div className="font-medium text-slate-600 flex flex-wrap items-center gap-1.5 mt-0.5">
                                        <MapPin className="w-4 h-4 text-indigo-600" />
                                        <span>Mode: <span className="font-bold text-slate-800">Online</span></span>
                                        {session.meetingLink && (
                                            <a href={session.meetingLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 ml-2 flex items-center gap-0.5 hover:underline bg-blue-50 px-2 py-0.5 rounded">
                                                Join Room <ExternalLink className="w-2.5 h-2.5" />
                                            </a>
                                        )}
                                    </div>
                                ) : (session.room || session.classroom) && (
                                    <div className="font-medium text-slate-600 flex items-center gap-1.5 mt-0.5">
                                        <MapPin className="w-4 h-4 text-indigo-600" />
                                        <span>Classroom: <span className="font-bold text-slate-800">{(session.room || session.classroom).replace(/\s*\(Persons:.*?\)/gi, '')}</span></span>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="text-sm text-slate-400 italic">Schedule not available</div>
                        )}
                    </div>
                    
                    <div className="bg-slate-50 p-5">
                        <div className="flex justify-between items-start gap-4">
                            <div>
                                 <div className="flex flex-col gap-2">
                                     {course?.description && <p className="text-sm text-slate-600 line-clamp-2"><WarningTextFormatter text={course.description} /></p>}
                                     <div className="flex flex-wrap items-center gap-2 text-xs">
                                         {course?.category && <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded uppercase font-bold">{course.category}</span>}
                                         {course?.level && <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded uppercase font-bold">{course.level}</span>}
                                         {course?.day && <span className="text-slate-500 font-medium">Duration: {course.day} days</span>}
                                         {course?.format && <span className="text-slate-500 font-medium whitespace-nowrap">Format: {course.format}</span>}
                                         <span className="text-slate-500 font-medium ml-1">Payment: <span className={r.status?.toLowerCase() === 'verified' ? 'text-green-600 font-bold' : 'text-amber-600 font-bold'}>{r.status?.toUpperCase()}</span></span>
                                     </div>
                                     <div className="mt-2 flex flex-wrap gap-2">
                                         {course?.outlineData && (
                                             <a href={course.outlineData} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-bold uppercase tracking-wider transition-colors w-fit">
                                                 <Download className="w-3.5 h-3.5" /> {course?.category === 'Microsoft' ? 'Microsoft Document Link' : course?.category === 'AWS' ? 'AWS Document Link' : course?.outlineName || 'Document Link'}
                                             </a>
                                         )}
                                         <Link to={`/payment-status/${r.id}`}>
                                            <Button variant="outline" size="sm" className="bg-white text-slate-700 hover:bg-slate-50 text-xs h-7 px-3 border-slate-200 shadow-sm font-medium">
                                                <FileText className="w-3.5 h-3.5 mr-1.5" /> Electronic Receipt
                                            </Button>
                                         </Link>
                                     </div>
                                 </div>
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
                   
                   {progressPercent >= 100 && r.status?.toLowerCase() === 'verified' && (
                        <CardContent className="p-0 border-t border-slate-100 bg-slate-50/50">
                            <div className="p-5">
                                {(() => {
                                    const cert = certificates.find(c => c.registrationId === r.id);
                                    
                                    if (!hasSubmittedFeedback && !cert) {
                                        return (
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                                                        <FileText className="w-5 h-5 text-red-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-red-700 font-bold">Congratulations on completing the course!</p>
                                                        <p className="text-red-600 text-sm font-medium mt-0.5">Please submit the course feedback to unlock your certificate.</p>
                                                    </div>
                                                </div>
                                                <Link to={`/feedback/${r.courseId}?session=${r.sessionId}`}>
                                                    <Button variant="secondary" className="w-full sm:w-auto bg-red-600 text-white hover:bg-red-700 font-bold shadow-sm uppercase tracking-wider">
                                                        Submit Feedback
                                                    </Button>
                                                </Link>
                                            </div>
                                        );
                                    }

                                    if (shouldGrayOut) {
                                        return (
                                            <div className="text-center text-sm font-semibold text-slate-500 py-2">
                                                Course Completed. Certificates can be found in the Certificates tab.
                                            </div>
                                        );
                                    }

                                    if (cert) {
                                        return (
                                            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-emerald-50 p-4 rounded-xl border border-emerald-100 shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                                        <GraduationCap className="w-5 h-5 text-emerald-600" />
                                                    </div>
                                                    <div>
                                                        <p className="text-emerald-800 font-bold">Course feedback submitted!</p>
                                                        <p className="text-emerald-700 text-sm font-medium mt-0.5">Thank you for your feedback. You can now download your course certificate.</p>
                                                    </div>
                                                </div>
                                                <Button 
                                                    variant="default" 
                                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold uppercase tracking-wider shadow-sm"
                                                    onClick={() => generateCertificatePDF(cert)}
                                                >
                                                    <Download className="w-4 h-4 mr-2" /> Download Certificate
                                                </Button>
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-blue-50 p-4 rounded-xl border border-blue-100 text-blue-800 font-semibold shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                                                <p>Feedback submitted! Your certificate is being prepared, please check back soon.</p>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
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
        <TabsContent value="profile" className="space-y-6 pt-4">
           <ProfileSettingsTab user={user} userData={user} role={role} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
