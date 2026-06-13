import React, { useState, useEffect, useContext } from 'react';
import { db } from '../../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, setDoc, addDoc, serverTimestamp, orderBy, limit, writeBatch, onSnapshot } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { jsPDF } from 'jspdf';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { 
  Loader2, CheckCircle, XCircle, Clock, Calendar, GraduationCap, 
  ClipboardList, Send, RefreshCw, CreditCard, FileText, Download, 
  Search, Star, Check, Sparkles, BookOpen, MessageSquare, 
  Award, TrendingUp, Filter, AlertCircle, LayoutDashboard, CheckSquare, ShieldAlert,
  MapPin, ExternalLink, User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { ProfileSettingsTab } from '../../components/profile/ProfileSettingsTab';
import { logAudit } from '../../lib/services';
import { formatHkDate, getHkDateString, getHkTime, parseHkDate } from '../../lib/utils';
import { isWeekendOrHoliday } from '../../lib/holidays';
import { StaticQRModal } from './StaticQRModal';

export function InstructorDashboard() {
  const { user } = useContext(AuthContext);
  const { t } = useTranslation();
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'hours' | 'reports' | 'profile'>('overview');
  
  // Real-time attendance listener state
  const [dbAttendance, setDbAttendance] = useState<Record<string, string>>({});
  
  // DB states
  const [sessions, setSessions] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [allSessionRegistrations, setAllSessionRegistrations] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [shifts, setShifts] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Attendance states
  const [lessons, setLessons] = useState<any[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<'AM' | 'PM'>('AM');
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  const [lessonSearch, setLessonSearch] = useState('');
  const [studentSearch, setStudentSearch] = useState('');
  const [staticQrToken, setStaticQrToken] = useState<string | null>(null);

  // Whenever selectedSessionId changes, find its lessons and load its data
  useEffect(() => {
    if (!selectedSessionId) return;
    
    // Find lessons for this session
    const sessionLessons = lessons.filter(l => l.sessionId === selectedSessionId || l.session_id === selectedSessionId);
    if (sessionLessons.length > 0) {
      // If we don't have a selectedLesson from this session currently, select the first one
      const isCurrentLessonInSession = selectedLesson && (selectedLesson.sessionId === selectedSessionId || selectedLesson.session_id === selectedSessionId);
      if (!isCurrentLessonInSession) {
        const today = getHkDateString();
        const nowHour = getHkTime().getHours();
        const defaultPeriod = nowHour < 13 ? 'AM' : 'PM';
        
        // Find if any lesson is today
        const todayLesson = sessionLessons.find(l => l.lessonDate === today);
        if (todayLesson) {
          handleSelectLesson(todayLesson);
          setSelectedPeriod(defaultPeriod);
        } else {
          handleSelectLesson(sessionLessons[0]);
          setSelectedPeriod('AM');
        }
      }
    } else {
      // No lessons for this session yet, load verified registrations directly
      setSelectedLesson(null);
      const loadRegistrationsOnly = async () => {
        try {
          const regsSnap = await getDocs(query(collection(db, 'registrations'), where('sessionId', '==', selectedSessionId), where('status', '==', 'verified')));
          setRegistrations(regsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          setSelectedPeriod('AM');
          if (!selectedLesson) {
            setAttendanceData({});
            return;
          }
        } catch (err: any) {
          console.error(err);
        }
      };
      loadRegistrationsOnly();
    }
  }, [selectedSessionId, lessons]);
  
  // Work hour states
  const [hourForm, setHourForm] = useState({
    date: getHkDateString(),
    course: '',
    hours: '2',
    notes: ''
  });
  const [submittingHours, setSubmittingHours] = useState(false);
  const [hoursFilter, setHoursFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  
  const [mtmYear, setMtmYear] = useState(getHkTime().getFullYear().toString());
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

      // Step 3: Find lessons directly assigned to tutor just in case
      const directLessonsSnap = await getDocs(query(collection(db, 'lessons'), where('tutorId', '==', user?.uid)));
      const directLessonsData: any[] = directLessonsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Extract unique session IDs from direct lessons
      const directSessionIds = Array.from(new Set(
        directLessonsData
          .map(l => (l.sessionId || l.session_id))
          .filter(Boolean)
      ));

      // Fetch sessions for these direct lessons if not already included
      const missingSessionIds = directSessionIds.filter(id => !sessionDocs.find(s => s.id === id));
      if (missingSessionIds.length > 0) {
        for (let i = 0; i < missingSessionIds.length; i += 10) {
          const chunk = missingSessionIds.slice(i, i + 10);
          const extraSessionsSnap = await getDocs(query(collection(db, 'course_sessions'), where('__name__', 'in', chunk)));
          extraSessionsSnap.docs.forEach(d => {
            const sd = { id: d.id, ...d.data() };
            if (!sessionDocs.find(s => s.id === sd.id)) {
              sessionDocs.push(sd);
            }
          });
        }
      }

      const sessionIds = sessionDocs.map(s => s.id);
      let tutorLessons: any[] = [];
      let feedbacksDocs: any[] = [];
      let enrolledStudents: any[] = [];

      if (sessionIds.length > 0 || directLessonsData.length > 0) {
        const chunkedLessons: any[] = [];
        
        // Fetch lessons and registrations for these sessions
        if (sessionIds.length > 0) {
          for (let i = 0; i < sessionIds.length; i += 10) {
            const chunk = sessionIds.slice(i, i + 10);
            const lessonsSnap = await getDocs(query(collection(db, 'lessons'), where('sessionId', 'in', chunk)));
            chunkedLessons.push(...lessonsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            
            const regSnap = await getDocs(query(collection(db, 'registrations'), where('sessionId', 'in', chunk)));
            enrolledStudents.push(...regSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          }
        }
        
        // Always include direct lessons
        directLessonsData.forEach(d => {
           if (!chunkedLessons.find(l => l.id === d.id)) {
              chunkedLessons.push(d);
           }
        });

        tutorLessons = chunkedLessons.sort((a, b) => {
           const dateA = a.lessonDate || '';
           const dateB = b.lessonDate || '';
           return dateB.localeCompare(dateA); // desc
        });
        
        setLessons(tutorLessons);
        setSessions(sessionDocs);
        setAllSessionRegistrations(enrolledStudents);
        const confirmedSecs = sessionDocs.filter((s: any) => {
          const statusLower = (s?.sessionStatus || '').toLowerCase();
          return statusLower === 'full' || statusLower === 'confirmed';
        });
        if (confirmedSecs.length > 0) {
          setSelectedSessionId(confirmedSecs[0].id);
        }
        
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
        // Fallback if no sessions and no direct lessons
        setLessons([]);
        setSessions([]);
        setCourses(templateDocs);
        setAllSessionRegistrations([]);
      }

      const today = getHkDateString();
      const upcomingSessionsCount = tutorLessons.filter((l: any) => l.lessonDate >= today).length;
      const uniqueStudents = new Set(enrolledStudents.filter((s: any) => s.status === 'verified').map(s => s.studentId).filter(Boolean)).size;
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
    setStudentSearch('');
    try {
      // Get verified registrations for the SESSION of this lesson
      const regsSnap = await getDocs(query(collection(db, 'registrations'), where('sessionId', '==', lesson.sessionId), where('status', '==', 'verified')));
      const enrolledStudents = regsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
      setRegistrations(enrolledStudents);
      // Initial attendance data is fetched via onSnapshot in useEffect below
      // We still clear the local attendance data on lesson change
      setAttendanceData({});
      setDbAttendance({});
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Real-time attendance sync
  useEffect(() => {
    if (!selectedLesson) return;
    const q = query(collection(db, 'attendance'), where('lessonId', '==', selectedLesson.id));
    const unsubscribe = onSnapshot(q, (snap) => {
      const existingAttendance: Record<string, string> = {};
      snap.docs.forEach(d => {
        const data = d.data();
        let derivedStatus = data.status || '';
        if (!derivedStatus) {
            if (data.present_am && data.present_pm) derivedStatus = 'present';
            else if (data.present_am) derivedStatus = 'present_am';
            else if (data.present_pm) derivedStatus = 'present_pm';
            else if (data.present === true) derivedStatus = 'present';
        }

        const updateStatus = (k: string) => {
            if (!k) return;
            const current = existingAttendance[k];
            if (!current || current === 'absent' || current === '') {
                existingAttendance[k] = derivedStatus;
            } else if (derivedStatus === 'present' || derivedStatus === 'present_am' || derivedStatus === 'present_pm') {
                if (current !== 'present') {
                    existingAttendance[k] = derivedStatus;
                }
            }
        };

        if (data.studentId) updateStatus(data.studentId);
        if (data.registrationId) updateStatus(data.registrationId);
        if (data.studentEmail) updateStatus(data.studentEmail);
      });
      
      setDbAttendance(existingAttendance);
      
      setAttendanceData(prev => {
         const mergedData: Record<string, string> = { ...prev };
         // Use the current registrations array instead of filteredRegistrations to avoid missing data
         registrations.forEach((s: any) => {
           const key = s.id;
           const statByKey = existingAttendance[key];
           const statByStudent = s.studentId ? existingAttendance[s.studentId] : null;
           const statByEmail = s.studentEmail ? existingAttendance[s.studentEmail] : null;

           let newStat = '';
           if (statByStudent && statByStudent !== 'absent') {
               newStat = statByStudent;
           } else if (statByEmail && statByEmail !== 'absent') {
               newStat = statByEmail;
           } else if (statByKey && statByKey !== 'absent') {
               newStat = statByKey;
           } else {
               newStat = statByKey || statByEmail || statByStudent || '';
           }

           if (mergedData[key] !== newStat) {
              mergedData[key] = newStat;
           }
         });
         return mergedData;
      });
    }, (error) => {
      console.error("DEBUG: Firebase onSnapshot error in InstructorDashboard:", error);
    });
    return () => unsubscribe();
  }, [selectedLesson, registrations]);

  const handleCreateQuickLesson = async () => {
    if (!selectedSessionId) return;
    const session = sessions.find(s => s.id === selectedSessionId);
    if (!session) return;
    
    try {
      const newLesson = {
        sessionId: selectedSessionId,
        session_id: selectedSessionId,
        tutorId: user?.uid,
        lessonDate: getHkDateString(),
        lessonTitle: `Class ${getHkDateString()}`,
        startTime: session.startTime || '09:00',
        endTime: session.endTime || '18:00',
        createdAt: serverTimestamp()
      };
      
      const docRef = await addDoc(collection(db, 'lessons'), newLesson);
      const addedLesson = { id: docRef.id, ...newLesson };
      
      setLessons(prev => [...prev, addedLesson]);
      handleSelectLesson(addedLesson);
      toast.success("Created today's class successfully! You can now take attendance.");
    } catch (e: any) {
      toast.error("Failed to create class: " + e.message);
    }
  };

  const handleSaveAttendance = async () => {
    if (!selectedLesson) return;
    setSubmittingAttendance(true);
    try {
      const batch = writeBatch(db);
      const attSnap = await getDocs(query(collection(db, 'attendance'), where('lessonId', '==', selectedLesson.id)));
      
      for (const regId of Object.keys(attendanceData)) {
        const studentRecord = registrations.find(r => r.id === regId);
        const studentId = studentRecord?.studentId || regId;
        const studentEmail = studentRecord?.studentEmail || '';
        const attendanceId1 = `${selectedLesson.id}_${regId}`;
        const attendanceId2 = `${selectedLesson.id}_${studentId}`;
        
        const statusVal = attendanceData[regId] || '';
        
        const payload = {
          lessonId: selectedLesson.id,
          sessionId: selectedLesson.sessionId,
          status: statusVal,
          present_am: statusVal === 'present_am' || statusVal === 'present',
          present_pm: statusVal === 'present_pm' || statusVal === 'present',
          present: statusVal === 'present',
          absent: statusVal === 'absent',
          timestamp: serverTimestamp(),
          recordedAt: serverTimestamp(),
          recordedBy: user?.uid
        };

        const existingDocs = attSnap.docs.filter(d => {
            const data = d.data();
            return data.registrationId === regId || 
                   (studentId && data.studentId === studentId) || 
                   (studentEmail && data.studentEmail === studentEmail);
        });

        batch.set(doc(db, 'attendance', attendanceId1), { ...payload, registrationId: regId, studentId: studentRecord?.studentId || regId }, { merge: true });
        if (attendanceId1 !== attendanceId2) {
            batch.set(doc(db, 'attendance', attendanceId2), { ...payload, registrationId: regId, studentId: studentId }, { merge: true });
        }
        
        for (const edoc of existingDocs) {
            if (edoc.id !== attendanceId1 && edoc.id !== attendanceId2) {
                batch.set(doc(db, 'attendance', edoc.id), { ...payload, registrationId: regId, studentId: studentRecord?.studentId || regId }, { merge: true });
            }
        }
      }
      await batch.commit();
      
      await logAudit(user?.uid || 'instructor', user?.email || '', 'INSTRUCTOR_MARK_ATTENDANCE', 'attendance', selectedLesson.id, { students: Object.keys(attendanceData).length });
      toast.success(t('instructor.save_attendance'));
      
      // Update completion stats in lesson visually
      setSelectedLesson((prev: any) => ({ ...prev, attendanceCompleted: true }));
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingAttendance(false);
    }
  };


  const generateMTMReport = () => {
    if (!user?.uid) return;
    try {
      const tutorId = user.uid;
      const year = mtmYear;
      
      const tutorSessions = sessions
        .filter((s) => {
          const course = courses.find((c) => c.id === s.courseId);
          let isMicrosoft = false;
          if (
            (course?.category || "").toLowerCase().includes("microsoft") ||
            (course?.title || "").toLowerCase().includes("microsoft") ||
            (course?.certName || "").toLowerCase().includes("microsoft") ||
            !!(course?.title || "").toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-|ab-/) ||
            !!(course?.courseCode || "").toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-|ab-/)
          ) {
            isMicrosoft = true;
          }
          if (!isMicrosoft)
            isMicrosoft =
              (s.sessionName || "").toLowerCase().includes("microsoft") ||
              !!(course?.courseCode || s.courseCode || "").toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-|ab-/);
          
          const tid = s.tutorId || s.tutor_id;
          const inYear = (s.startDate || "").trim().startsWith(year);
          const isConfirmed = s.sessionStatus === "confirmed" || s.sessionStatus === "full" || s.sessionStatus === "completed";
          
          return tid === tutorId && inYear && isMicrosoft && isConfirmed;
        })
        .sort((a, b) => (a.startDate || "").localeCompare(b.startDate || ""));

      const calculateHours = (start: string, end: string) => {
        if (!start || !end) return 0;
        const [sh, sm] = start.split(":").map(Number);
        const [eh, em] = end.split(":").map(Number);
        const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
        return diff > 0 ? diff : 0;
      };

      let yearlyRecords = tutorSessions.map((s) => {
        const course = courses.find((c) => c.id === s.courseId);
        const startTime = s.startTime || "09:00";
        const endTime = s.endTime || "17:00";
        const dailyHrs = calculateHours(startTime, endTime);
        const days = Number(course?.day) || 1;
        const totalHrs = dailyHrs * days;

        return {
          date: s.startDate || "N/A",
          notes:
            (course?.title || s.sessionName || "Course") +
            " (" +
            startTime +
            " - " +
            endTime +
            `, ${days} Days)`,
          hours: totalHrs,
        };
      });

      const manualMsHours = hours
        .filter((h) => {
          if (h.tutorId !== tutorId || !h.isManual) return false;
          if (!h.date || !h.date.startsWith(year)) return false;

          let isMicrosoft = false;
          if (h.course) {
            const courseObj = courses.find(
              (c) => c.title === h.course || c.certName === h.course,
            );
            
            if (
              (courseObj?.category || "").toLowerCase().includes("microsoft") ||
              (courseObj?.title || "").toLowerCase().includes("microsoft") ||
              (courseObj?.certName || "").toLowerCase().includes("microsoft") ||
              !!(courseObj?.title || "").toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-|ab-/) ||
              !!(courseObj?.courseCode || "").toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-|ab-/)
            ) {
              isMicrosoft = true;
            }
            
            if (
              h.course.toLowerCase().includes("microsoft") ||
              !!h.course.toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-|ab-/)
            ) {
              isMicrosoft = true;
            }
          }

          return isMicrosoft;
        })
        .map((h) => ({
          date: h.date || "N/A",
          notes: h.course + " (Manual)",
          hours: Number(h.hours) || 0,
        }));

      if (tutorSessions.length === 0 && manualMsHours.length === 0) {
        toast.error(`No MS courses for year ${year}. Found 0 matching courses for your ID.`);
      }

      const combinedRecords = [...yearlyRecords, ...manualMsHours]
        .filter((r) => r.hours > 0)
        .sort((a, b) => (a.date || "").localeCompare(b.date || ""));

      const totalHours = combinedRecords.reduce(
        (acc, curr) => acc + (curr.hours || 0),
        0,
      );

      const pdfDoc = new jsPDF();
      
      pdfDoc.setFont("helvetica", "bold");
      pdfDoc.setFontSize(18);
      pdfDoc.text(`Instructor Teaching Hours (MTM Report)`, 105, 20, { align: 'center' });
      
      pdfDoc.setFontSize(12);
      pdfDoc.text(`Instructor: ${user.displayName || user.email || 'Instructor'}`, 20, 35);
      pdfDoc.text(`Report Year: ${mtmYear}`, 20, 42);
      pdfDoc.text(`Total Teaching Hours: ${totalHours} hrs`, 20, 49);

      pdfDoc.setLineWidth(0.5);
      pdfDoc.line(20, 53, 190, 53);

      pdfDoc.setFontSize(10);
      pdfDoc.text("Date", 20, 60);
      pdfDoc.text("Description / Notes", 60, 60);
      pdfDoc.text("Hours", 170, 60);
      
      pdfDoc.setLineWidth(0.2);
      pdfDoc.line(20, 63, 190, 63);

      pdfDoc.setFont("helvetica", "normal");
      let y = 70;
      
      combinedRecords.forEach(h => {
         if (y > 270) {
            pdfDoc.addPage();
            y = 20;
         }
         pdfDoc.text(h.date || 'N/A', 20, y);
         const splitNotes = pdfDoc.splitTextToSize(h.notes?.replace(/\n/g, ' ') || 'No description provided', 100);
         pdfDoc.text(splitNotes, 60, y);
         pdfDoc.text(String(h.hours || 0), 170, y);
         
         y += (splitNotes.length * 5) + 3;
      });

      pdfDoc.save(`MTM_Report_${(user.displayName || 'Instructor').replace(/\s+/g,'_')}_${mtmYear}.pdf`);
      toast.success("MTM Report generated successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleSubmitHours = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hourForm.course) {
      return toast.error("Please select or enter a course name");
    }
    
    setSubmittingHours(true);
    try {
      await addDoc(collection(db, 'teaching_hours'), {
        tutorId: user?.uid,
        tutorName: user?.displayName || user?.email,
        date: hourForm.date,
        course: hourForm.course,
        hours: Number(hourForm.hours) || 0,
        notes: hourForm.notes || hourForm.course,
        status: 'pending',
        isManual: true,
        createdAt: serverTimestamp()
      });
      
      toast.success("Work record submitted successfully for approval");
      setHourForm({
        date: getHkDateString(),
        course: '',
        hours: '2',
        notes: ''
      });
      fetchTutorData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingHours(false);
    }
  };

  // Compute stats metrics dynamically
  const approvedHours = hours.filter(h => h.status === 'approved').reduce((acc, curr) => acc + (parseFloat(curr.hours) || 0), 0);
  const hourlyRate = userProfile?.tutorProfile?.hourlyRate || userProfile?.hourlyRate || 0;
  const estimatedPayout = approvedHours * hourlyRate;
  
  // Filtering hours list
  const filteredHours = hours.filter(h => {
    if (hoursFilter === 'all') return true;
    return h.status === hoursFilter;
  });

  // Filtering lessons list
  const filteredLessons = lessons.filter(l => {
    if (!lessonSearch) return true;
    const term = lessonSearch.toLowerCase();
    const course = courses.find(c => c.id === sessions.find(s => s.id === l.sessionId || s.id === l.session_id)?.courseId);
    return (
      (l.lessonTitle || '').toLowerCase().includes(term) ||
      (course?.title || '').toLowerCase().includes(term) ||
      (l.lessonDate || '').includes(term)
    );
  });

  // Filtering student registration list
  const filteredRegistrations = registrations.filter(r => {
    if (!studentSearch) return true;
    const term = studentSearch.toLowerCase();
    return (
      (r.studentName || '').toLowerCase().includes(term) ||
      (r.studentEmail || '').toLowerCase().includes(term)
    );
  });

  // Filter ONLY confirmed/full courses, and put closest upcoming dates first
  const visibleSessions = sessions
    .filter(s => {
      const statusLower = (s?.sessionStatus || '').toLowerCase();
      return statusLower === 'confirmed' || statusLower === 'full';
    })
    .sort((a, b) => {
      const aDate = a.startDate || '9999-12-31';
      const bDate = b.startDate || '9999-12-31';
      return parseHkDate(aDate).getTime() - parseHkDate(bDate).getTime();
    });

  // Filtering upcoming lectures for the instructor dashboard list (today or future + session open/full/confirmed)
  const todayStr = getHkDateString();
  const upcomingLectures = lessons.filter(l => {
    const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
    const statusLower = (session?.sessionStatus || '').toLowerCase();
    const isSessionActive = !session || (
      statusLower === 'open' || 
      statusLower === 'full' || 
      statusLower === 'confirmed'
    );
    const isUpcoming = l.lessonDate >= todayStr;
    return isSessionActive && isUpcoming;
  }).sort((a, b) => (a.lessonDate || '').localeCompare(b.lessonDate || ''));

  // Quick class click helper
  const handleQuickMarkClass = (lesson: any) => {
    handleSelectLesson(lesson);
    setActiveTab('attendance');
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[70vh]">
        <div className="space-y-4 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600 mx-auto" />
          <p className="text-sm font-semibold tracking-wide text-slate-500 animate-pulse">Syncing working data and rosters...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50/50 min-h-screen overflow-y-auto p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Banner with Greeting and Context */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-blue-600 text-white p-6 rounded-xl shadow-sm mb-8">
          <div>
             <h1 className="text-3xl font-bold flex items-center gap-3">
               Instructor Dashboard
               <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold tracking-wide bg-blue-500 text-white ring-1 ring-white/20">
                 {userProfile?.role === 'tutor' ? 'Full-Time' : 'Part-Time'}
               </span>
             </h1>
             <p className="opacity-80 mt-1">Welcome back, {user?.displayName || user?.email?.split('@')[0]}!</p>
          </div>
          <div className="flex items-center gap-4">
            <GraduationCap className="w-12 h-12 opacity-50 hidden sm:block" />
          </div>
        </div>

        {/* Bento Statistics Showcase */}
        {/* Bento Statistics Showcase */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-indigo-50 to-white">
            <CardHeader>
               <CardTitle className="text-indigo-800 text-sm font-black uppercase tracking-wider">Confirmed Course</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-4xl font-bold text-indigo-600 flex items-center justify-between">
                 {visibleSessions.length}
                 <Calendar className="w-8 h-8 text-indigo-200" />
               </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-50 to-white">
            <CardHeader>
               <CardTitle className="text-amber-800 text-sm font-black uppercase tracking-wider">Student Rating</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="text-4xl font-bold text-amber-600 flex items-center justify-between">
                 {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : 'N/A'}
                 <Award className="w-8 h-8 text-amber-200" />
               </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)}>
          <TabsList className="bg-slate-100 p-1.5 rounded-xl flex flex-wrap gap-1.5 w-fit shadow-inner mb-6">
            <TabsTrigger 
              value="overview" 
              className="data-active:!bg-indigo-600 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-indigo-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
            >
              <LayoutDashboard className="w-4 h-4" />
              Dashboard Overview
            </TabsTrigger>
            <TabsTrigger 
              value="attendance" 
              className="data-active:!bg-emerald-600 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-emerald-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
            >
              <ClipboardList className="w-4 h-4" />
              Attendance Management
            </TabsTrigger>
            <TabsTrigger 
              value="hours" 
              className="data-active:!bg-amber-500 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-amber-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Hours Audit & Payments
            </TabsTrigger>
            <TabsTrigger 
              value="profile"
              className="data-active:!bg-blue-600 data-active:!text-white data-active:shadow-md hover:bg-white hover:text-blue-600 px-4 py-2 text-[11px] font-black uppercase tracking-widest text-slate-500 rounded-lg transition-all flex items-center gap-2"
            >
              <UserIcon className="w-4 h-4" />
              Profile Settings
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tab content renders */}
        <div className="space-y-6">

          {/* 1. OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              
              {/* Assigned Intakes & Student Roster */}
                <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div className="flex justify-between items-center bg-transparent">
                      <div>
                        <CardTitle className="text-base font-bold text-slate-800">My Assigned Intakes</CardTitle>
                        <CardDescription className="text-xs text-slate-400 font-medium">
                          Overview of all course runs assigned to you and their currently registered students directory.
                        </CardDescription>
                      </div>
                      <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">{visibleSessions.length} Intakes</span>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    {visibleSessions.length > 0 ? (
                      visibleSessions.map((s) => {
                        const course = courses.find(c => c.id === s.courseId);
                        const sessionRegistrations = allSessionRegistrations.filter(r => r.sessionId === s.id);
                        
                        return (
                          <div key={s.id} className="p-4 rounded-xl border border-slate-100 bg-white hover:border-indigo-100 hover:shadow-sm transition-all space-y-4">
                            
                            {/* Session Info Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-slate-800 text-sm">{s.sessionName || course?.courseCode}</h4>
                                  <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                                    s.sessionStatus === 'open' ? 'bg-green-100 text-green-700' : 
                                    (s.sessionStatus === 'full' || s.sessionStatus === 'confirmed') ? 'bg-amber-100 text-amber-700 font-extrabold' :
                                    s.sessionStatus === 'completed' ? 'bg-slate-800 text-white' :
                                    'bg-slate-100 text-slate-600'
                                  }`}>
                                    {(s.sessionStatus === 'full' || s.sessionStatus === 'confirmed') ? 'Confirmed' : s.sessionStatus}
                                  </span>
                                  {s.deliveryMode && (
                                    <span className="bg-indigo-50 text-indigo-600 text-[8px] font-extrabold uppercase px-1.5 py-0.5 rounded tracking-wide">
                                      {s.deliveryMode === 'onsite' ? 'ClassRoom' : s.deliveryMode === 'online' ? 'Online' : s.deliveryMode === 'hybrid' ? 'Hybrid' : s.deliveryMode}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 font-bold mt-1">
                                  {course?.title || 'Course Template'}
                                </p>
                              </div>
                              
                              <div className="text-left sm:text-right text-xs">
                                <p className="text-slate-400 font-medium">
                                  {s.startDate || 'N/A'} ~ {s.endDate || 'N/A'}
                                </p>
                                {(s.room || s.classroom) && (
                                  <p className="text-[10px] font-bold text-indigo-600 mt-0.5 flex items-center justify-start sm:justify-end gap-1">
                                    <MapPin className="w-3 h-3" /> Room: {(s.room || s.classroom).replace(/\s*\(Persons:.*?\)/gi, '')}
                                  </p>
                                )}
                                {s.meetingLink && (
                                  <a href={s.meetingLink} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-blue-600 mt-0.5 flex items-center justify-start sm:justify-end gap-0.5 hover:underline">
                                    {(() => {
                                      const link = s.meetingLink.toLowerCase();
                                      if (link.includes('zoom.us') || link.includes('zoom.com')) return 'Join Zoom';
                                      if (link.includes('teams.microsoft.com') || link.includes('teams.live.com')) return 'Join MS Teams';
                                      return 'Join Room';
                                    })()} <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                )}
                              </div>
                            </div>
                            
                            {/* Students List */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                <span>Enrolled Students Roster ({sessionRegistrations.length})</span>
                                <span>Cap: {s.quota}</span>
                              </div>
                              
                              {sessionRegistrations.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5">
                                  {sessionRegistrations.map((reg) => (
                                    <div key={reg.id} className="p-3 bg-slate-50/50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                                      <div className="flex items-center gap-2.5 min-w-0">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100/60 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
                                          {reg.studentName ? reg.studentName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
                                        </div>
                                        <div className="min-w-0">
                                          <p className="font-extrabold text-xs text-slate-800 truncate">{reg.studentName}</p>
                                          <p className="text-[10px] text-slate-404 font-mono truncate">{reg.studentEmail}</p>
                                          {reg.studentPhone && (
                                            <p className="text-[9px] text-slate-400 font-medium truncate mt-0.5">{reg.studentPhone}</p>
                                          )}
                                        </div>
                                      </div>
                                      
                                      <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-wider shrink-0 ${
                                        reg.status === 'verified' 
                                          ? 'bg-green-100/75 text-green-700' 
                                          : reg.status === 'pending' || reg.status === 'pending_verification'
                                          ? 'bg-amber-100/75 text-amber-700' 
                                          : 'bg-rose-100/75 text-rose-700'
                                      }`}>
                                        {reg.status}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="text-center py-4 bg-slate-50/30 rounded-xl border border-dashed border-slate-100 text-xs text-slate-400 italic">
                                  No registered students found for this intake.
                                </div>
                              )}
                            </div>
                            
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-10 text-slate-400 italic bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                        <GraduationCap className="w-8 h-8 mx-auto mb-1.5 opacity-40 text-slate-300" />
                        <p className="text-xs font-semibold tracking-wide">No assigned intakes found.</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

            </div>
          )}

          {/* 2. ATTENDANCE TAB */}
          {activeTab === 'attendance' && (() => {
            const confirmedSessions = sessions.filter(s => {
              const statusLower = (s?.sessionStatus || '').toLowerCase();
              return statusLower === 'full' || statusLower === 'confirmed';
            });

            const searchedConfirmedSessions = confirmedSessions.filter(s => {
              if (!lessonSearch) return true;
              const term = lessonSearch.toLowerCase();
              const course = courses.find(c => c.id === s.courseId);
              return (
                (s.sessionName || '').toLowerCase().includes(term) ||
                (course?.title || '').toLowerCase().includes(term) ||
                (course?.courseCode || '').toLowerCase().includes(term)
              );
            });

            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Confirmed Course Runs left column */}
                <div className="lg:col-span-1 space-y-4">
                  <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                    <div className="p-4 border-b border-slate-100 space-y-3 bg-slate-50/50">
                      <CardTitle className="text-sm font-extrabold text-slate-800">Confirmed Course Runs</CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="Search course run or code..."
                          value={lessonSearch}
                          onChange={e => setLessonSearch(e.target.value)}
                          className="pl-9 h-10 bg-white border-slate-200 rounded-xl"
                        />
                      </div>
                    </div>
                    <CardContent className="p-3 space-y-2 overflow-y-auto max-h-[500px]">
                      {searchedConfirmedSessions.length > 0 ? (
                        searchedConfirmedSessions.map(s => {
                          const course = courses.find(c => c.id === s.courseId);
                          const isSelected = selectedSessionId === s.id;
                          const sessionRegistrations = allSessionRegistrations.filter(r => r.sessionId === s.id && r.status === 'verified');
                          
                          return (
                            <div
                              key={s.id}
                              onClick={() => setSelectedSessionId(s.id)}
                              className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                                isSelected 
                                  ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100 ring-2 ring-indigo-500/20' 
                                  : 'bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/80'
                              }`}
                            >
                              <p className={`font-bold text-xs line-clamp-2 ${isSelected ? 'text-white' : 'text-slate-800'}`}>
                                {s.sessionName || course?.title || 'Unknown Course Run'}
                              </p>
                              <p className={`text-[9px] font-black uppercase mt-1 ${isSelected ? 'text-indigo-200' : 'text-slate-450 tracking-wider'}`}>
                                {course?.courseCode || 'No Code'} • {sessionRegistrations.length} students
                              </p>
                              <div className="flex items-center justify-between mt-2">
                                <span className={`text-[9px] font-mono ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                                  {s.startDate} {s.endDate ? `to ${s.endDate}` : ''}
                                </span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-extrabold uppercase tracking-widest ${
                                  isSelected 
                                    ? 'bg-white/20 text-white' 
                                    : 'bg-amber-100 text-amber-700 font-extrabold'
                                }`}>
                                  Confirmed
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-slate-400 italic text-xs">
                          No confirmed course runs found.
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Roster & Attendance checklist details */}
                <div className="lg:col-span-2">
                  {selectedSessionId ? (
                    (() => {
                      const session = sessions.find(s => s.id === selectedSessionId);
                      const course = courses.find(c => c.id === session?.courseId);
                      const sessionLessons = lessons.filter(l => l.sessionId === selectedSessionId || l.session_id === selectedSessionId)
                        .filter((l: any) => {
                          // Filter out any accidentally created lessons that fall outside the course date range
                          if (!session?.startDate || !session?.endDate || !l.lessonDate) return true;
                          return l.lessonDate >= session.startDate && l.lessonDate <= session.endDate;
                        })
                        .sort((a: any, b: any) => (a.lessonDate || "").localeCompare(b.lessonDate || ""));

                      // Deduplicate existing lessons by date to prevent duplicate Day 1s
                      const uniqueLessons: any[] = [];
                      const seenDates = new Set();
                      for (const l of sessionLessons) {
                        if (!seenDates.has(l.lessonDate)) {
                          seenDates.add(l.lessonDate);
                          uniqueLessons.push(l);
                        }
                      }
                      
                      // Map to AM and PM choices
                      const amPmOptions = uniqueLessons.flatMap((l, lIdx) => [
                        { ...l, period: 'AM', label: `Lecture ${lIdx + 1}: ${l.lessonDate} (AM) - Day ${lIdx + 1}` },
                        { ...l, period: 'PM', label: `Lecture ${lIdx + 1}: ${l.lessonDate} (PM) - Day ${lIdx + 1}` }
                      ]);
                      
                      return (
                        <Card className="border-indigo-100 shadow-xl shadow-indigo-900/5 rounded-2xl ring-1 ring-indigo-50/50 relative">
                          
                          {/* Selected session header */}
                          <div className="p-6 border-b border-indigo-100 bg-gradient-to-r from-slate-50 to-indigo-50/30">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-transparent">
                              <div className="space-y-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-md">
                                    Course Intake Run
                                  </span>
                                  <span className="text-[10px] font-bold text-slate-450 tracking-wider uppercase">
                                    {session?.sessionName || course?.courseCode}
                                  </span>
                                </div>
                                
                                <CardTitle className="text-lg font-extrabold text-slate-800 tracking-tight">
                                  {course?.title || 'Course Details'}
                                </CardTitle>
                                
                                <p className="text-xs text-slate-500 font-medium">
                                  Instructor: {userProfile?.name || 'Instructor'} • Mode: <span className="font-bold text-indigo-600">{session?.deliveryMode === 'onsite' ? 'ClassRoom' : session?.deliveryMode === 'online' ? 'Online' : session?.deliveryMode === 'hybrid' ? 'Hybrid' : (session?.deliveryMode || 'Normal')}</span> {session?.room ? `• Room: ${session.room.replace(/\s*\(Persons:.*?\)/gi, '')}` : ''}
                                </p>
                              </div>

                              {selectedLesson && (
                                <div className="flex flex-wrap items-center gap-2">
                                  <Button
                                    onClick={() => window.open(`/qr-display/${selectedLesson.id}_${selectedPeriod}`, 'QRPopup', 'width=800,height=800')}
                                    variant="outline"
                                    className="w-full sm:w-auto font-bold text-xs uppercase tracking-wider h-11 px-5 border-indigo-200 text-indigo-700 hover:bg-indigo-50 transition-all rounded-xl gap-2"
                                  >
                                    <Sparkles className="w-4 h-4" /> Start Dynamic QR
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      const dateStr = (selectedLesson.lessonDate || '').replace(/-/g, '');
                                      const staticToken = `STAT-${selectedLesson.id}_${selectedPeriod}-${dateStr}`;
                                      setStaticQrToken(staticToken);
                                    }}
                                    variant="outline"
                                    className="w-full sm:w-auto font-bold text-xs uppercase tracking-wider h-11 px-5 border-slate-200 text-slate-700 hover:bg-slate-50 transition-all rounded-xl gap-2"
                                  >
                                    <ExternalLink className="w-4 h-4" /> Static Link
                                  </Button>
                                  <Button
                                    onClick={handleSaveAttendance}
                                    disabled={submittingAttendance}
                                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider h-11 px-5 shadow-lg shadow-emerald-100 transition-all rounded-xl gap-2"
                                  >
                                    {submittingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4.5 h-4.5" />}
                                    <span>Save Changes</span>
                                  </Button>
                                </div>
                              )}
                            </div>

                            {amPmOptions.length > 0 ? (
                              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-4 bg-white/70 backdrop-blur-sm p-3 rounded-xl border border-indigo-100/50">
                                <span className="text-[10px] font-black uppercase text-indigo-700 tracking-widest flex items-center gap-1">
                                  <Clock className="w-3.5 h-3.5" /> Select Class/Lecture Date:
                                </span>
                                <select
                                  value={`${selectedLesson?.id}_${selectedPeriod}`}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    const [lId, p] = val.split('_');
                                    const chosen = uniqueLessons.find(l => l.id === lId);
                                    if (chosen) {
                                      handleSelectLesson(chosen);
                                      setSelectedPeriod(p as 'AM' | 'PM');
                                    }
                                  }}
                                  className="h-8 text-xs font-bold rounded-lg border border-slate-200 bg-white px-2.5 focus:ring-2 focus:ring-indigo-500/20 text-slate-700 outline-none cursor-pointer text-ellipsis max-w-full"
                                >
                                  {amPmOptions.map((opt) => (
                                    <option key={`${opt.id}_${opt.period}`} value={`${opt.id}_${opt.period}`}>
                                      {opt.label}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            ) : (
                              <div className="mt-4 bg-amber-50/80 border border-amber-200 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                                <div className="space-y-1">
                                  <span className="text-amber-800 text-xs font-bold block">No classes scheduled for this intake yet.</span>
                                  <span className="text-amber-600 text-[10px] font-medium block">You must add a class to take student attendance.</span>
                                </div>
                                <Button onClick={handleCreateQuickLesson} className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm font-bold text-xs h-9">
                                  + Add Today's Class
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* Progress checklist & Bulk controls */}
                          {selectedLesson && (
                            <div className="p-4 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                              
                              {/* Search student filter */}
                              <div className="relative w-full md:w-64">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <Input
                                  type="text"
                                  placeholder="Filter student profile..."
                                  value={studentSearch}
                                  onChange={e => setStudentSearch(e.target.value)}
                                  className="pl-9 h-9 border-slate-200 bg-white rounded-xl text-xs"
                                />
                              </div>



                            </div>
                          )}

                          {/* Floating Persistent Toolbar for Quick Actions */}
                          {selectedLesson && (
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 md:gap-5 bg-white/95 backdrop-blur-md shadow-[0_8px_30px_rgb(0,0,0,0.12)] border border-slate-200/80 rounded-full px-4 md:px-6 py-3 ring-1 ring-slate-900/5 animate-in slide-in-from-bottom-8 fade-in flex-wrap justify-center w-[95%] md:w-max">
                              <div className="flex items-center gap-2 pr-5 border-r border-slate-200/80">
                                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center border border-indigo-100">
                                  <Sparkles className="w-4 h-4 text-indigo-600" />
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 leading-tight">Class Course</span>
                                  <span className="text-xs font-bold text-slate-800 tracking-tight leading-tight">Attendance</span>
                                </div>
                              </div>
                              
                              <div className="pl-1 md:pl-2 flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  onClick={async () => {
                                    if (!window.confirm('確定要清除所有紀錄嗎？此動作將刪除該課堂的所有點名紀錄。')) return;
                                    setSubmittingAttendance(true);
                                    try {
                                      const batch = writeBatch(db);
                                      const attDocs = await getDocs(query(collection(db, 'attendance'), where('lessonId', '==', selectedLesson.id)));
                                      attDocs.docs.forEach((docSnap) => {
                                        batch.delete(docSnap.ref);
                                      });
                                      await batch.commit();
                                      setAttendanceData({});
                                      toast.success("Attendance records cleared successfully!");
                                    } catch (err: any) {
                                      toast.error("Failed to clear records: " + err.message);
                                    } finally {
                                      setSubmittingAttendance(false);
                                    }
                                  }}
                                  className="border-slate-200 text-slate-600 hover:bg-slate-50 rounded-full font-bold text-[10px] md:text-xs uppercase tracking-wider h-8 md:h-10 px-4 shadow-sm transition-all"
                                >
                                  Clear Records
                                </Button>
                                <Button
                                  onClick={handleSaveAttendance}
                                  disabled={submittingAttendance}
                                  className="bg-slate-900 hover:bg-slate-800 text-white rounded-full font-bold text-[10px] md:text-xs uppercase tracking-wider h-8 md:h-10 px-4 md:px-6 shadow-lg transition-all gap-2"
                                >
                                  {submittingAttendance ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4.5 h-4.5" />}
                                  <span className="hidden sm:inline">Save Changes</span>
                                  <span className="sm:hidden">Save</span>
                                </Button>
                              </div>
                            </div>
                          )}

                          {/* Student records list */}
                          <div className="p-0 overflow-x-auto min-h-[300px] mb-20 relative">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-slate-50/60 hover:bg-slate-50/60 border-b border-slate-100">
                                  <TableHead className="pl-6 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400">STUDENT INFORMATION</TableHead>
                                  <TableHead className="text-center h-11 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {selectedLesson ? "ATTENDANCE LOG STATUS" : "REGISTRATION DETAILS"}
                                  </TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {filteredRegistrations.map(r => {
                                  const currentStatus = attendanceData[r.id] ?? '';
                                  return (
                                    <TableRow key={r.id} className="hover:bg-slate-50/40 transition-colors border-b border-slate-50">
                                      <TableCell className="pl-6 py-4.5">
                                        <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-extrabold flex items-center justify-center text-xs shadow-sm">
                                            {r.studentName ? r.studentName.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase() : '?'}
                                          </div>
                                          <div>
                                            <p className="font-extrabold text-sm text-slate-800 tracking-tight">{r.studentName}</p>
                                            <p className="text-xs text-slate-400 font-medium font-mono">{r.studentEmail}</p>
                                          </div>
                                        </div>
                                      </TableCell>
                                      <TableCell className="text-center">
                                        {selectedLesson ? (
                                          <div className="flex justify-center gap-1 sm:gap-1.5">
                                            {[
                                              { id: 'present_am', label: 'AM Present', color: 'bg-emerald-600 border-emerald-600' },
                                              { id: 'present_pm', label: 'PM Present', color: 'bg-indigo-600 border-indigo-600' },
                                              { id: 'absent', label: 'Absent', color: 'bg-red-600 border-red-600' }
                                            ].map(item => {
                                              const isMarked = currentStatus === item.id || ((item.id === 'present_am' || item.id === 'present_pm') && currentStatus === 'present');
                                              return (
                                                <button
                                                  key={item.id}
                                                  onClick={() => setAttendanceData(prev => {
                                                    const cur = prev[r.id] || '';
                                                    let nextStatus = item.id;
                                                    if (item.id === 'absent') {
                                                      nextStatus = cur === 'absent' ? '' : 'absent';
                                                    } else if (item.id === 'present_am') {
                                                      if (cur === 'present_am') nextStatus = '';
                                                      else if (cur === 'present_pm') nextStatus = 'present';
                                                      else if (cur === 'present') nextStatus = 'present_pm';
                                                    } else if (item.id === 'present_pm') {
                                                      if (cur === 'present_pm') nextStatus = '';
                                                      else if (cur === 'present_am') nextStatus = 'present';
                                                      else if (cur === 'present') nextStatus = 'present_am';
                                                    }
                                                    return { ...prev, [r.id]: nextStatus };
                                                  })}
                                                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${
                                                    isMarked 
                                                      ? `${item.color} text-white shadow-sm font-black animate-scaleIn` 
                                                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-400 hover:text-slate-700'
                                                  }`}
                                                >
                                                  {item.label}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        ) : (
                                          <span className="text-xs px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 font-bold uppercase tracking-wider">
                                            {r.status || 'Verified Student'}
                                          </span>
                                        )}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                                
                                {filteredRegistrations.length === 0 && (
                                  <TableRow>
                                    <TableCell colSpan={2} className="text-center py-20 text-slate-350">
                                      <div className="space-y-2">
                                        <ClipboardList className="w-12 h-12 opacity-20 mx-auto animate-bounce" />
                                        <p className="italic font-bold text-sm text-slate-400">No verified student registrations matched.</p>
                                        <p className="text-xs text-slate-400">This course run might not have registered students yet.</p>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                )}
                              </TableBody>
                            </Table>
                          </div>

                        </Card>
                      );
                    })()
                  ) : (
                    <div className="h-96 flex flex-col items-center justify-center border border-dashed border-slate-250 bg-white rounded-2xl text-slate-400 gap-4 p-8 transition-colors hover:bg-slate-50/50">
                      <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center shadow-inner border border-slate-100">
                        <ClipboardList className="w-8 h-8 text-slate-300" />
                      </div>
                      <div className="text-center">
                        <p className="font-extrabold text-slate-700 uppercase tracking-widest text-xs animate-pulse">Awaiting Course Selection</p>
                        <p className="text-xs text-slate-450 mt-1 max-w-sm leading-relaxed">
                          Select a confirmed course run from the left panel to display student registration records.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

          {/* 3. COURSE COMPLETED HISTORY TAB */}
          {activeTab === 'hours' && (() => {
            const completedSessions = sessions
              .filter(s => (s?.sessionStatus || '').toLowerCase() === 'completed')
              .filter(s => {
                const totalRegs = allSessionRegistrations.filter(r => r.sessionId === s.id && r.status === 'verified').length;
                return totalRegs > 0;
              });
            
            return (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <Card className="border-slate-100 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />
                        <span>Course History</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-medium">Live list of course runs completed and logged by academic registry.</CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-slate-50/50 hover:bg-slate-50/50 border-b border-slate-100">
                            <TableHead className="pl-6 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400">Course Run / Intake Name</TableHead>
                            <TableHead className="h-11 text-[10px] font-black uppercase tracking-widest text-slate-400">Associated Course Template</TableHead>
                            <TableHead className="h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Schedule Period</TableHead>
                            <TableHead className="h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Enrolled Students</TableHead>
                            <TableHead className="h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Delivery Mode</TableHead>
                            <TableHead className="pr-6 h-11 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {completedSessions.map(s => {
                            const course = courses.find(c => c.id === s.courseId);
                            const totalRegs = allSessionRegistrations.filter(r => r.sessionId === s.id && r.status === 'verified').length;
                            return (
                              <TableRow key={s.id} className="hover:bg-slate-50/30 transition-colors border-b border-slate-55">
                                <TableCell className="pl-6 py-4.5 font-bold text-sm text-slate-800 whitespace-normal break-words max-w-[200px]">
                                  {s.sessionName || 'Untitled Run'}
                                </TableCell>
                                <TableCell className="font-semibold text-slate-700 text-xs whitespace-normal break-words max-w-[250px]">
                                  {course?.title || 'Course Template'}
                                </TableCell>
                                <TableCell className="text-center text-xs font-semibold font-mono text-indigo-700">
                                  {s.startDate || 'N/A'} {s.endDate ? `to ${s.endDate}` : ''}
                                </TableCell>
                                <TableCell className="text-center font-extrabold text-sm text-slate-800">
                                  {totalRegs} student{totalRegs !== 1 ? 's' : ''}
                                </TableCell>
                                <TableCell className="text-center text-xs font-semibold text-slate-650">
                                  {s.deliveryMode === 'onsite' ? 'ClassRoom' : s.deliveryMode === 'online' ? 'Online' : s.deliveryMode === 'hybrid' ? 'Hybrid' : (s.deliveryMode || 'Normal')}
                                </TableCell>
                                <TableCell className="pr-6 text-right">
                                  <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-800 text-white shadow-sm ring-1 ring-slate-900/10">
                                    Completed
                                  </span>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                          
                          {completedSessions.length === 0 && (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-20 text-slate-300">
                                <GraduationCap className="w-12 h-12 mx-auto opacity-20 mb-2" />
                                <p className="italic font-bold text-xs text-slate-450">No completed course history found.</p>
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Microsoft Certification Annual Audit report */}
              <div className="space-y-6">
                <Card className="border-emerald-100 shadow-xl shadow-emerald-950/5 rounded-2xl overflow-hidden ring-1 ring-emerald-500/10">
                  <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50/10 border-b border-emerald-100 flex flex-col gap-4 bg-transparent">
                    <div className="space-y-1">
                      <CardTitle className="text-base font-extrabold text-emerald-850 flex items-center gap-2">
                        <Award className="w-5 h-5 text-emerald-600" />
                        <span>Annual Microsoft MTM Teaching Report</span>
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500 font-medium leading-relaxed">Export audit sheets containing certified teaching classes for annual submission.</CardDescription>
                    </div>
                    
                    <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-2 w-full">
                      <select 
                        className="h-10 px-3 border border-slate-200 rounded-xl text-sm outline-none bg-white font-semibold text-slate-700 shadow-sm w-full xl:w-auto" 
                        value={mtmYear} 
                        onChange={e => setMtmYear(e.target.value)}
                      >
                        {(() => {
                          const currentYr = getHkTime().getFullYear();
                           return [currentYr, currentYr-1].map(yr => (
                             <option key={yr} value={yr.toString()}>{yr} Year</option>
                           ));
                        })()}
                      </select>
                      
                      <Button 
                        onClick={generateMTMReport} 
                        className="h-10 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase tracking-wider text-[10px] rounded-xl shadow-lg shadow-emerald-100 gap-2 w-full xl:w-auto"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download PDF</span>
                      </Button>
                    </div>
                  </div>

                  <CardContent className="p-5 space-y-4">
                    <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                      <p className="text-xs font-bold text-slate-700 uppercase tracking-wide">Report Scope Guidelines & Rules:</p>
                      <ul className="text-xs text-slate-500 list-disc list-inside space-y-1.5 leading-relaxed font-medium">
                        <li>Automatically compiles historical lectures under Microsoft certification templates (Azure, AZ, MS, AI, PL, SC codes).</li>
                        <li>Syncs directly with physical schedules recorded in class timetables.</li>
                        <li>Retrieves approved and submitted custom manually validated hours matching Microsoft courses.</li>
                        <li>Produces legal jsPDF audit logs containing timestamps, description, and tutor name signing line.</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>

            </div>
            );
          })()}

          {activeTab === 'profile' && (
            <div className="space-y-6">
              <ProfileSettingsTab user={user} userData={userProfile} role={userProfile?.role} />
            </div>
          )}

        </div>

      </div>
      <StaticQRModal token={staticQrToken} onClose={() => setStaticQrToken(null)} />
    </div>
  );
}
