import React, { useState, useEffect, useContext } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, orderBy, limit, writeBatch } from 'firebase/firestore';
import { AuthContext } from '../App';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Loader2, CheckCircle, XCircle, Clock, Calendar, GraduationCap, ClipboardList, Send, RefreshCw, CreditCard, FileText, Download } from 'lucide-react';
import { toast } from 'sonner';
import { logAudit } from '../lib/services';
import { formatHkDate, getHkDateString } from '../lib/utils';
import { isWeekendOrHoliday } from '../lib/holidays';

export function InstructorDashboard() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  
  const [hourForm, setHourForm] = useState({
    date: getHkDateString(),
    course: ''
  });
  const [submittingHours, setSubmittingHours] = useState(false);
  const [mtmYear, setMtmYear] = useState(new Date().getFullYear().toString());
  const [stats, setStats] = useState({ upcomingSessions: 0, activeStudents: 0, averageRating: 0 });

  useEffect(() => {
    if (user?.uid) {
      fetchTutorData();
    }
  }, [user]);

  const fetchTutorData = async () => {
    setLoading(true);
    try {
      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', user?.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }

      // Step 1: Find sessions assigned to this tutor
      const sessionsSnap = await getDocs(query(collection(db, 'course_sessions'), where('tutorId', '==', user?.uid)));
      let sessionDocs = sessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Step 2: Also find courses assigned to this tutor directly (in case some sessions inherit from course)
      const coursesSnap = await getDocs(query(collection(db, 'courses'), where('tutorId', '==', user?.uid)));
      let templateDocs = coursesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      const courseIdsFromCourses = templateDocs.map(c => c.id);

      // Fetch sessions for those courses if not already included
      if (courseIdsFromCourses.length > 0) {
        for (let i = 0; i < courseIdsFromCourses.length; i += 10) {
          const chunk = courseIdsFromCourses.slice(i, i + 10);
          const courseSessionsSnap = await getDocs(query(collection(db, 'course_sessions'), where('courseId', 'in', chunk)));
          const additionalSessions = courseSessionsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
          additionalSessions.forEach(as => {
            if (!sessionDocs.find(s => s.id === as.id)) {
              sessionDocs.push(as);
            }
          });
        }
      }

      const sessionIds = sessionDocs.map(s => s.id);
      let tutorLessons: any[] = [];
      let feedbacksDocs: any[] = [];
      let enrolledStudents: any[] = [];

      if (sessionIds.length > 0) {
        // Fetch lessons for these sessions
        const chunkedLessons: any[] = [];
        for (let i = 0; i < sessionIds.length; i += 10) {
          const chunk = sessionIds.slice(i, i + 10);
          const lessonsSnap = await getDocs(query(collection(db, 'lessons'), where('sessionId', 'in', chunk)));
          chunkedLessons.push(...lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          const regSnap = await getDocs(query(collection(db, 'registrations'), where('sessionId', 'in', chunk), where('status', '==', 'verified')));
          enrolledStudents.push(...regSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
        
        // Find lessons directly assigned to tutor just in case
        const directLessonsSnap = await getDocs(query(collection(db, 'lessons'), where('tutorId', '==', user?.uid)));
        directLessonsSnap.docs.forEach(d => {
           if (!chunkedLessons.find(l => l.id === d.id)) {
              chunkedLessons.push({ id: d.id, ...d.data() });
           }
        });

        tutorLessons = chunkedLessons.sort((a, b) => {
           const dateA = a.lessonDate || '';
           const dateB = b.lessonDate || '';
           return dateB.localeCompare(dateA); // desc
        });
        
        setLessons(tutorLessons);
        setSessions(sessionDocs);
        
        // Fetch courses for the sessions if we need more
        const courseIdsToFetch = Array.from(new Set(sessionDocs.map(s => (s as any).courseId).filter(id => !templateDocs.find(t => t.id === id))));
        if (courseIdsToFetch.length > 0) {
          for (let i = 0; i < courseIdsToFetch.length; i += 10) {
            const chunk = courseIdsToFetch.slice(i, i + 10);
            const templateSnap = await getDocs(query(collection(db, 'courses'), where('__name__', 'in', chunk)));
            templateDocs.push(...templateSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        }
        setCourses(templateDocs);

        // Fetch feedbacks
        const finalCourseIds = templateDocs.map(t => t.id);
        if (finalCourseIds.length > 0) {
          for (let i = 0; i < finalCourseIds.length; i += 10) {
             const chunk = finalCourseIds.slice(i, i + 10);
             const feedbackSnap = await getDocs(query(collection(db, 'feedbacks'), where('courseId', 'in', chunk)));
             feedbacksDocs.push(...feedbackSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        }
      } else {
        // Fallback if no sessions
        setLessons([]);
        setSessions([]);
        setCourses(templateDocs);
      }

      const today = getHkDateString();
      const upcomingSessionsCount = tutorLessons.filter((l: any) => l.lessonDate >= today).length;
      const uniqueStudents = new Set(enrolledStudents.map(s => s.studentId).filter(Boolean)).size;
      const avgRating = feedbacksDocs.length > 0 ? feedbacksDocs.reduce((acc, curr) => acc + (parseFloat(curr.rating || curr.overallCourseScore) || 0), 0) / feedbacksDocs.length : 0;
      
      setStats({
          upcomingSessions: upcomingSessionsCount,
          activeStudents: uniqueStudents,
          averageRating: avgRating
      });

      // Get work hours history
      const hoursSnap = await getDocs(query(collection(db, 'teaching_hours'), where('tutorId', '==', user?.uid), orderBy('createdAt', 'desc'), limit(50)));
      setHours(hoursSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
      // Get shifts
      const shiftsSnap = await getDocs(query(collection(db, 'tutor_shifts'), where('tutorId', '==', user?.uid), orderBy('date', 'desc'), limit(20)));
      setShifts(shiftsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectLesson = async (lesson: any) => {
    setSelectedLesson(lesson);
    try {
      // Get verified registrations for the SESSION of this lesson
      const regsSnap = await getDocs(query(collection(db, 'registrations'), where('sessionId', '==', lesson.sessionId), where('status', '==', 'verified')));
      const enrolledStudents = regsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRegistrations(enrolledStudents);
      
      // Get attendance for THIS LESSON
      const attendanceSnap = await getDocs(query(collection(db, 'attendance'), where('lessonId', '==', lesson.id)));
      const existingAttendance: Record<string, string> = {};
      attendanceSnap.docs.forEach(d => {
        existingAttendance[d.data().studentId] = d.data().status;
      });
      
      const mergedData: Record<string, string> = {};
      enrolledStudents.forEach((s: any) => {
        // use studentId as key for attendance
        mergedData[s.studentId] = existingAttendance[s.studentId] || 'present';
      });
      setAttendanceData(mergedData);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedLesson) return;
    setSubmittingAttendance(true);
    try {
      const batch = writeBatch(db);
      for (const studentId of Object.keys(attendanceData)) {
        const attendanceId = `${selectedLesson.id}_${studentId}`;
        const attRef = doc(db, 'attendance', attendanceId);
        batch.set(attRef, {
          lessonId: selectedLesson.id,
          sessionId: selectedLesson.sessionId,
          studentId: studentId,
          status: attendanceData[studentId],
          recordedAt: serverTimestamp(),
          recordedBy: user?.uid
        });
      }
      await batch.commit();
      
      await logAudit(user?.uid || 'instructor', user?.email || '', 'INSTRUCTOR_MARK_ATTENDANCE', 'attendance', selectedLesson.id, { students: Object.keys(attendanceData).length });
      toast.success(t('instructor.save_attendance'));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const generateMTMReport = async () => {
    if (!user?.uid) return;
    try {
      const tutorLessons = lessons.filter(l => {
          const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
          const course = courses.find(c => c.id === session?.courseId);
          const isMicrosoft = course?.category === 'Microsoft' || course?.category?.toLowerCase() === 'microsoft';
          const tid = l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id;
          const inYear = (l.lessonDate || l.lesson_date || '').startsWith(mtmYear);
          return tid === user.uid && inYear && isMicrosoft;
      }).sort((a,b) => (a.lessonDate || a.lesson_date || '').localeCompare(b.lessonDate || b.lesson_date || ''));

      const calculateHours = (start: string, end: string) => {
          if (!start || !end) return 0;
          const [sh, sm] = start.split(':').map(Number);
          const [eh, em] = end.split(':').map(Number);
          const diff = ((eh * 60 + em) - (sh * 60 + sm)) / 60;
          return diff > 0 ? diff : 0;
      };

      let yearlyRecords = tutorLessons.map(l => {
          const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
          const course = courses.find(c => c.id === session?.courseId);
          const startTime = l.startTime || session?.startTime;
          const endTime = l.endTime || session?.endTime;
          const hrs = calculateHours(startTime, endTime);
          return {
              date: l.lessonDate || l.lesson_date,
              notes: (course?.title || session?.sessionName || 'Course') + ' (' + (startTime || 'TBC') + ' - ' + (endTime || 'TBC') + ')',
              hours: hrs
          };
      });

      const hoursSnap = await getDocs(query(collection(db, 'teaching_hours'), where('tutorId', '==', user.uid)));
      const allHours = hoursSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      const manualMsHours = allHours.filter(h => {
          if (!h.isManual) return false;
          if (!h.date || !h.date.startsWith(mtmYear)) return false;
          
          let isMicrosoft = false;
          if (h.course) {
              const courseObj = courses.find(c => c.title === h.course || c.certName === h.course);
              if (courseObj && (courseObj.category === 'Microsoft' || courseObj.category?.toLowerCase() === 'microsoft')) isMicrosoft = true;
              if (h.course.toLowerCase().includes('microsoft') || h.course.toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-/)) isMicrosoft = true;
          }
          
          return isMicrosoft;
      }).map(h => ({
          date: h.date,
          notes: h.notes || (h.course),
          hours: h.hours
      }));

      yearlyRecords = [...yearlyRecords, ...manualMsHours].sort((a,b) => (a.date || '').localeCompare(b.date || ''));


      const totalHours = yearlyRecords.reduce((acc, curr) => acc + (curr.hours || 0), 0);

      const doc = new jsPDF();
      
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.text(`Instructor Teaching Hours (MTM Report)`, 105, 20, { align: 'center' });
      
      doc.setFontSize(12);
      doc.text(`Instructor: ${user.displayName || user.email || 'Instructor'}`, 20, 35);
      doc.text(`Report Year: ${mtmYear}`, 20, 42);
      doc.text(`Total Teaching Hours: ${totalHours} hrs`, 20, 49);

      doc.setLineWidth(0.5);
      doc.line(20, 53, 190, 53);

      doc.setFontSize(10);
      doc.text("Date", 20, 60);
      doc.text("Description / Notes", 60, 60);
      doc.text("Hours", 170, 60);
      
      doc.setLineWidth(0.2);
      doc.line(20, 63, 190, 63);

      doc.setFont("helvetica", "normal");
      let y = 70;
      
      yearlyRecords.forEach(h => {
         if (y > 270) {
            doc.addPage();
            y = 20;
         }
         doc.text(h.date || 'N/A', 20, y);
         const splitNotes = doc.splitTextToSize(h.notes?.replace(/\n/g, ' ') || 'No description provided', 100);
         doc.text(splitNotes, 60, y);
         doc.text(String(h.hours || 0), 170, y);
         
         y += (splitNotes.length * 5) + 3;
      });

      doc.save(`MTM_Report_${(user.displayName || 'Instructor').replace(/\s+/g,'_')}_${mtmYear}.pdf`);
      toast.success("MTM Report generated successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hourForm.course) {
      return toast.error("Please enter Course Name");
    }
    
    setSubmittingHours(true);
    try {
      await addDoc(collection(db, 'teaching_hours'), {
        tutorId: user?.uid,
        tutorName: user?.displayName || user?.email,
        date: hourForm.date,
        course: hourForm.course,
        hours: 0,
        notes: hourForm.course,
        status: 'pending',
        createdAt: serverTimestamp()
      });
      
      toast.success("Record submitted successfully");
      setHourForm({ ...hourForm, course: '' });
      fetchTutorData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingHours(false);
    }
  };

  const approvedHours = hours.filter(h => h.status === 'approved').reduce((acc, curr) => acc + (curr.hours || 0), 0);
  const hourlyRate = userProfile?.tutorProfile?.hourlyRate || 0;
  const estimatedPayout = approvedHours * hourlyRate;

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">{t('tutor.portal_title')}</h1>
            <p className="text-sm text-slate-500 mt-1">Manage your sessions, attendance and working hours as an Instructor</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={fetchTutorData} className="gap-2 text-slate-600 bg-white shadow-sm border-slate-200">
              <RefreshCw className="w-3.5 h-4 text-blue-600" />
            </Button>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-white px-4 py-2 rounded-full shadow-sm border border-slate-100">
              <GraduationCap className="w-4 h-4 text-blue-600" /> {user?.displayName || user?.email?.split('@')[0]}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="border-none shadow-xl shadow-blue-900/5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-100/80">Upcoming Sessions</p>
                  <p className="text-4xl font-black tracking-tight">{stats.upcomingSessions}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl"><Calendar className="w-5 h-5 text-blue-50" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-emerald-900/5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-100/80">Active Students</p>
                  <p className="text-4xl font-black tracking-tight">{stats.activeStudents}</p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl"><GraduationCap className="w-5 h-5 text-emerald-50" /></div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-xl shadow-amber-900/5 bg-gradient-to-br from-amber-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-100/80">Avg. Rating</p>
                  <p className="text-4xl font-black tracking-tight">{stats.averageRating.toFixed(1)} <span className="text-lg opacity-70">/ 5.0</span></p>
                </div>
                <div className="p-3 bg-white/10 rounded-xl"><CheckCircle className="w-5 h-5 text-amber-50" /></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-blue-800">
                  <Calendar className="w-5 h-5 text-blue-600" /> My Classes
                </CardTitle>
                <CardDescription>Select a class to manage attendance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {lessons.length > 0 ? (
                  lessons.map(l => {
                    const session = sessions.find(s => s.id === l.sessionId);
                    const course = courses.find(c => c.id === session?.courseId);
                    const isSelected = selectedLesson?.id === l.id;
                    return (
                      <div 
                        key={l.id} 
                        onClick={() => handleSelectLesson(l)}
                        className={`p-4 rounded-xl border transition-all cursor-pointer ${isSelected ? 'bg-blue-50 border-blue-200 shadow-md ring-1 ring-blue-100' : 'bg-white border-slate-100 hover:border-blue-200 hover:bg-slate-50'}`}
                      >
                        <p className="font-bold text-slate-800 leading-tight">{l.lessonTitle}</p>
                        <p className="text-[10px] text-slate-500 mt-1 uppercase font-bold tracking-wider">{course?.title || 'Unknown Course'}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                          <span className="flex items-center gap-1 text-[10px]"><Clock className="w-3 h-3 text-blue-400" /> {l.startTime} - {l.endTime}</span>
                          <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-black text-[8px] tracking-tight">{session?.deliveryMode || 'N/A'}</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400 mt-1">{l.lessonDate}</p>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-12 text-slate-400 italic text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No assigned classes found.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg text-indigo-800">
                  <Clock className="w-5 h-5 text-indigo-600" /> Log Part-time Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmitHours} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('tutor.date')}</label>
                    <Input type="date" value={hourForm.date} onChange={e => {
                      const val = e.target.value;
                      const v = isWeekendOrHoliday(val);
                      if (v.isInvalid) return toast.error(v.reason);
                      setHourForm({...hourForm, date: val});
                    }} className="h-10" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Course Name</label>
                    <Input placeholder="e.g. MS-900" value={hourForm.course} onChange={e => setHourForm({...hourForm, course: e.target.value})} className="h-10" />
                  </div>
                  <Button type="submit" disabled={submittingHours} className="w-full bg-indigo-600 hover:bg-indigo-700 gap-2 font-black uppercase tracking-[0.1em] text-[10px] h-11 shadow-lg shadow-indigo-100">
                    {submittingHours ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    Submit Log
                  </Button>
                </form>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 text-white overflow-hidden border-0 shadow-2xl shadow-slate-900/40">
               <CardHeader className="pb-2">
                 <CardTitle className="text-[10px] text-slate-500 font-black uppercase tracking-widest flex items-center gap-2">
                   <Clock className="w-3 h-3" /> Upcoming Shifts
                 </CardTitle>
               </CardHeader>
               <CardContent className="space-y-3">
                 {shifts.length > 0 ? (
                   shifts.slice(0, 5).map(shift => (
                     <div key={shift.id} className="p-3 bg-white/5 rounded-xl border border-white/10 flex justify-between items-center hover:bg-white/10 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-white">{shift.date}</p>
                          <p className="text-[10px] text-slate-400">{shift.startTime} - {shift.endTime}</p>
                        </div>
                        <span className="text-[9px] font-black uppercase py-0.5 px-2 bg-indigo-500/20 text-indigo-300 rounded ring-1 ring-indigo-500/30">Regular</span>
                     </div>
                   ))
                 ) : (
                   <p className="text-xs text-slate-500 italic text-center py-8">No assigned shifts.</p>
                 )}
               </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-indigo-600 via-blue-600 to-indigo-700 text-white border-0 shadow-xl overflow-hidden relative group">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                 <CreditCard className="w-24 h-24 rotate-12" />
               </div>
               <CardHeader className="pb-0">
                 <CardTitle className="text-[10px] font-black uppercase tracking-[0.3em] text-white/50">Instructor Payout (MTD)</CardTitle>
               </CardHeader>
               <CardContent className="pt-2">
                 <div className="flex items-baseline gap-1">
                   <span className="text-3xl font-black tracking-tighter">HK${estimatedPayout.toLocaleString()}</span>
                   <span className="text-[10px] text-white/50 uppercase font-black">Net Est.</span>
                 </div>
                 <div className="mt-4 flex items-center justify-between text-[10px] font-black uppercase tracking-wider">
                    <div className="bg-white/10 px-2 py-1 rounded-md border border-white/10">Appr: {approvedHours}Hrs</div>
                    <div className="bg-white/10 px-2 py-1 rounded-md border border-white/10">Rate: HK${hourlyRate}/H</div>
                 </div>
               </CardContent>
            </Card>

            <Card className="border border-green-200 shadow-md">
               <CardHeader className="pb-2 bg-green-50/50">
                 <CardTitle className="text-[10px] text-emerald-800 font-black uppercase tracking-widest flex items-center gap-2">
                   <FileText className="w-3 h-3" /> Annual MTM Report
                 </CardTitle>
               </CardHeader>
               <CardContent className="pt-4 space-y-3">
                  <p className="text-xs text-slate-500 font-medium">Export your Microsoft MTM annual teaching hours report.</p>
                  <div className="flex items-center gap-2">
                    <select 
                      className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white flex-1" 
                      value={mtmYear} 
                      onChange={e => setMtmYear(e.target.value)}
                    >
                      {(() => {
                         const y = new Date().getFullYear();
                         return [y, y-1, y-2].map(yr => (
                           <option key={yr} value={yr.toString()}>{yr}</option>
                         ));
                      })()}
                    </select>
                    <Button onClick={generateMTMReport} className="h-9 px-3 bg-emerald-600 hover:bg-emerald-700 text-[10px] font-black uppercase tracking-wider gap-2">
                       <Download className="w-3.5 h-3.5" /> PDF
                    </Button>
                  </div>
               </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {selectedLesson ? (
              <Card className="border-blue-100 shadow-xl shadow-blue-900/5 ring-1 ring-blue-50">
                <CardHeader className="border-b border-blue-50 pb-4 bg-slate-50/50">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">Class Active</span>
                        <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Class Attendance Log</CardDescription>
                      </div>
                      <CardTitle className="text-xl font-black text-slate-800 tracking-tight">
                        {selectedLesson.lessonTitle}
                      </CardTitle>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {courses.find(c => c.id === sessions.find(s => s.id === selectedLesson.sessionId)?.courseId)?.title} • {selectedLesson.lessonDate}
                      </p>
                    </div>
                    <Button 
                      onClick={handleSaveAttendance} 
                      disabled={submittingAttendance}
                      className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-200 h-10 w-full sm:w-auto font-black uppercase tracking-wider text-xs"
                    >
                      {submittingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
                      Save Attendance
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-slate-50 border-b border-slate-100">
                        <TableHead className="pl-6 h-12 uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">{t('tutor.student_name')}</TableHead>
                        <TableHead className="text-center h-12 uppercase text-[10px] font-black tracking-[0.2em] text-slate-400">Mark Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {registrations.map(r => (
                        <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors border-b border-slate-50">
                          <TableCell className="pl-6 py-4">
                            <p className="font-bold text-slate-800">{r.studentName}</p>
                            <p className="text-xs text-slate-400 font-mono">{r.studentEmail}</p>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex justify-center gap-1.5 sm:gap-2">
                              {['present', 'absent', 'late', 'excused'].map(status => (
                                <button
                                  key={status}
                                  onClick={() => setAttendanceData(prev => ({ ...prev, [r.studentId]: status }))}
                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider border-2 ${
                                    attendanceData[r.studentId] === status 
                                      ? (status === 'present' ? 'bg-green-600 border-green-600 text-white shadow-md' : 
                                         status === 'absent' ? 'bg-red-600 border-red-600 text-white shadow-md' :
                                         status === 'late' ? 'bg-amber-500 border-amber-500 text-white shadow-md' : 'bg-blue-600 border-blue-600 text-white shadow-md')
                                      : 'bg-white border-slate-100 text-slate-300 hover:border-slate-200'
                                  }`}
                                >
                                  {status === 'excused' ? 'EXC' : status}
                                </button>
                              ))}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {registrations.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={2} className="text-center py-24 text-slate-300 flex flex-col items-center">
                            <ClipboardList className="w-12 h-12 opacity-10 mb-4" />
                            <p className="italic font-bold tracking-tight">No verified registrations found for this intake.</p>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ) : (
              <div className="h-96 flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2rem] bg-white text-slate-300 gap-4 transition-all hover:bg-slate-50/50">
                <div className="w-20 h-20 rounded-full bg-slate-50 flex items-center justify-center shadow-inner">
                   <ClipboardList className="w-10 h-10 text-slate-200" />
                </div>
                <div className="text-center">
                  <p className="font-black text-slate-400 uppercase tracking-[0.2em] text-xs">Ready for Attendance</p>
                  <p className="text-sm font-medium mt-1">Select a scheduled class from the sidebar to begin.</p>
                </div>
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                   <Clock className="w-5 h-5 text-indigo-600" /> {t('tutor.hours_history')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-10 text-[10px] uppercase font-bold text-slate-500">{t('tutor.date')}</TableHead>
                        <TableHead className="h-10 text-[10px] uppercase font-bold text-slate-500">{t('tutor.hours')}</TableHead>
                        <TableHead className="h-10 text-[10px] uppercase font-bold text-slate-500">{t('tutor.description')}</TableHead>
                        <TableHead className="h-10 text-[10px] uppercase font-bold text-slate-500">{t('tutor.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hours.map(h => (
                        <TableRow key={h.id}>
                          <TableCell className="text-xs font-mono py-4">{h.date}</TableCell>
                          <TableCell className="font-bold text-slate-700">{h.hours}h</TableCell>
                          <TableCell className="text-xs text-slate-500 max-w-[200px] truncate">{h.notes}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                              h.status === 'approved' ? 'bg-green-100 text-green-700' :
                              h.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                              {h.status}
                            </span>
                          </TableCell>
                        </TableRow>
                      ))}
                      {hours.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center py-10 text-slate-400 italic text-sm">
                            No hours submitted yet.
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
