import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslation } from 'react-i18next';
import { db, auth } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, serverTimestamp, orderBy, writeBatch, where, addDoc, limit, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AuthContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { MonitorPlay, Loader2, Plus, Database, ExternalLink, LayoutDashboard, BookOpen, Calendar as CalendarIcon, Users, CreditCard, Clock, MessageSquare, CheckCircle, XCircle, Download, FileText, Upload, GraduationCap, BarChart2, BarChart3, TrendingUp, ShieldAlert, Building2, MapPin, CalendarRange, Share2, ArrowLeftRight, ClipboardList, Search, UserPlus, Mail, Phone, Award, ShieldCheck, Briefcase, KeyRound, Copy, Edit2, Trash2, ChevronLeft, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { logAudit, updateRecord, createRecord } from '../lib/services';
import { isWeekendOrHoliday } from '../lib/holidays';
import { formatHkDate } from '../lib/utils';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../components/ui/command';
import { cn } from '../lib/utils';
import { User, TutorCertification, TutorExpertise, UserRole, UserStatus, SkillLevel, CourseLevel, CertificationStatus } from '../types';

const locales = {
  'en-US': enUS,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})


const EXPERTISE_AREAS = [
  'Microsoft 365', 'Microsoft Copilot', 'Copilot Studio', 'Azure', 'AWS', 'Google Cloud',
  'Cybersecurity', 'AI Tools', 'Data Analytics', 'Programming', 'Business Applications', 'Project Management'
];

const COMMON_CERTS = [
  'AZ-900: Azure Fundamentals', 'PL-300: Data Analyst', 'AI-900: AI Fundamentals',
  'PMP: Project Management', 'AWS Solutions Architect', 'CompTIA Security+'
];

import { signInWithEmailAndPassword } from 'firebase/auth';

export function AdminDashboard() {
  const { role, user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);
  const [editingReg, setEditingReg] = useState<any>(null);
  const [isEditRegOpen, setIsEditRegOpen] = useState(false);
  const [regSearchTerm, setRegSearchTerm] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [certs, setCerts] = useState<TutorCertification[]>([]);
  const [expertise, setExpertise] = useState<TutorExpertise[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [tutorShifts, setTutorShifts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const [isManualHoursModalOpen, setIsManualHoursModalOpen] = useState(false);
  const [manualHoursForm, setManualHoursForm] = useState({
    tutorId: '',
    date: new Date().toISOString().split('T')[0],
    course: ''
  });
  const [isSubmittingManualHours, setIsSubmittingManualHours] = useState(false);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [isCoursePopoverOpen, setIsCoursePopoverOpen] = useState(false);
  const [isTutorPopoverOpen, setIsTutorPopoverOpen] = useState(false);
  const [sessionCreationModalOpen, setSessionCreationModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseCreationModalOpen, setCourseCreationModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedTemplateForIntake, setSelectedTemplateForIntake] = useState<any>(null);
  const [viewingLessonsForSession, setViewingLessonsForSession] = useState<any>(null);
  const [sessionEnrollees, setSessionEnrollees] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSessionAttendanceModalOpen, setIsSessionAttendanceModalOpen] = useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] = useState<any>(null);
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] = useState<any>(null);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);
  
  // User Management Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserViewModalOpen, setIsUserViewModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<Partial<User>>({
    role: 'student',
    status: 'active',
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [courseSearchTerm, setCourseSearchTerm] = useState('');
  const [instructorSearchTerm, setInstructorSearchTerm] = useState('');
  const [certSearchTerm, setCertSearchTerm] = useState('');
  const [certDateTerm, setCertDateTerm] = useState('');
  const [courseRunSearchTerm, setCourseRunSearchTerm] = useState('');
  const [courseRunsActiveTab, setCourseRunsActiveTab] = useState<'runs' | 'attendance'>('runs');
  const [scheduleTab, setScheduleTab] = useState<'trainer-daily' | 'trainer-monthly' | 'room-daily' | 'room-monthly' | 'tech-daily'>('trainer-daily');
  const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split('T')[0]);
  const [scheduleInstructorFilter, setScheduleInstructorFilter] = useState('');
  const [scheduleRoomFilter, setScheduleRoomFilter] = useState('');
  const [scheduleMonth, setScheduleMonth] = useState(new Date().toISOString().slice(0, 7));
  const [mtmYear, setMtmYear] = useState(new Date().getFullYear().toString());
  const [ptMonth, setPtMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedSessionCert, setSelectedSessionCert] = useState<any>(null);
  const [sessionStudentsData, setSessionStudentsData] = useState<any[]>([]);
  const [isCertLoading, setIsCertLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState<{ key: keyof User; direction: 'asc' | 'desc' }>({ key: 'name', direction: 'asc' });
  const [newBranch, setNewBranch] = useState({ name: '', address: '', contact_phone: '' });
  const [schedulingBranch, setSchedulingBranch] = useState<string>('');
  const [batchScheduling, setBatchScheduling] = useState({
     branchId: '',
     tutorIds: [] as string[],
     startDate: '',
     endDate: '',
     startTime: '09:00',
     endTime: '18:00'
  });
  const [schoolInfo, setSchoolInfo] = useState({
    name: 'Training Academy',
    logo_url: '',
    address: '123 Tech Avenue, Kowloon, Hong Kong',
    phone: '+852 2345 6789',
    email: 'sales@example.com',
    invoice_prefix: 'INV',
    terms_conditions: '1. Fees are non-refundable.\n2. Please present this receipt for course entry.',
    rooms: ''
  });

  // Promotions State
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isDeletePromoModalOpen, setIsDeletePromoModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<any>(null);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [promoForm, setPromoForm] = useState<any>({
    name: '',
    code: '',
    type: 'code',
    discountType: 'fixed',
    discountValue: 0,
    status: 'active',
    applicableCourseIds: [],
    bundleCourse1: '',
    bundleCourse2: '',
    startDate: '',
    endDate: '',
    adminPassword: ''
  });

  // New Course Form
  const [newCourse, setNewCourse] = useState({ 
    courseCode: 'AZ-900T00',
    title: 'Introduction to Microsoft Azure', 
    certName: 'Fundamental',
    category: 'Microsoft',
    level: 'Beginner',
    day: '1',
    description: 'MODULE 1: Describe cloud concepts\nMODULE 2: Describe Azure architecture and services\nMODULE 3: Describe Azure management and governance', 
    outlineName: '',
    earlyBirdPrice: 2000, 
    standardPrice: 4000,
    tutorId: '',
    requiredExpertise: [] as string[],
    requiredCertifications: [] as string[]
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const fetchCollection = async (collectionName: string, queryConstraint?: any) => {
        try {
          const q = queryConstraint ? query(collection(db, collectionName), ...queryConstraint) : collection(db, collectionName);
          return await getDocs(q);
        } catch (e: any) {
          console.error(`Failed to fetch ${collectionName}:`, e);
          if (e.message.includes('permission')) {
             toast.error(`Permission Denied: ${collectionName}`);
          }
          throw e;
        }
      };

      const [cSnap, rSnap, sSnap, lSnap, tSnap, fSnap, hSnap, certSnap, auditSnap, schoolSnap, bSnap, tsSnap, uSnap, tCertSnap, tExpSnap, kbSnap, ticketSnap, promoSnap] = await Promise.all([
        fetchCollection('courses', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('registrations', [orderBy('createdAt', 'desc'), limit(200)]),
        fetchCollection('course_sessions', [orderBy('createdAt', 'desc'), limit(200)]), 
        fetchCollection('lessons', [orderBy('lessonDate', 'asc'), limit(500)]),
        fetchCollection('users', [where('role', 'in', ['tutor', 'tutor_pt']), limit(100)]),
        fetchCollection('feedbacks', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('teaching_hours', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('certificates', [limit(100)]),
        fetchCollection('audit_logs', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('settings', [limit(1)]),
        fetchCollection('branches', [orderBy('name', 'asc')]),
        fetchCollection('tutor_shifts', [limit(500)]),
        fetchCollection('users', [limit(500)]),
        fetchCollection('tutor_certifications', [limit(500)]),
        fetchCollection('tutor_expertise', [limit(500)]),
        fetchCollection('knowledge_base', [limit(500)]),
        fetchCollection('support_tickets', [limit(500)]),
        fetchCollection('promotions', [orderBy('createdAt', 'desc'), limit(200)])
      ]);
      
      setCourses(cSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setRegs(rSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setSessions(sSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLessons(lSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTutors(tSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setFeedbacks(fSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setHours(hSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAllUsers(uSnap.docs.map(d => ({ id: d.id, ...d.data() } as User)));
      setCerts(tCertSnap.docs.map(d => ({ id: d.id, ...d.data() } as TutorCertification)));
      setExpertise(tExpSnap.docs.map(d => ({ id: d.id, ...d.data() } as TutorExpertise)));
      setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAuditLogs(auditSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTutorShifts(tsSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setPromotions(promoSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      const sData = schoolSnap.docs.find(d => d.id === 'school_info')?.data();
      if (sData) setSchoolInfo(sData as any);
    } catch (e: any) {
      console.error('Admin Fetch Error:', e);
      toast.error("Failed to load admin data: " + (e.message || "Unknown error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'admin') fetchData();
  }, [role]);

  // New Session Form State
  const [newSession, setNewSession] = useState({
    courseId: '',
    tutorId: '',
    startDate: '',
    endDate: '',
    quota: 20,
    classroom: '',
    meetingLink: '',
    deliveryMode: 'onsite',
    earlyBirdPrice: 0,
    standardPrice: 0,
    registrationOpen: true
  });

  const [lessonGen, setLessonGen] = useState({
    startDate: '',
    startTime: '19:00',
    endTime: '21:00',
    dayOfWeek: '1', // Monday
    count: 1
  });

  const handleCreateSession = async () => {
    if (!newSession.courseId) return toast.error("Missing required fields");

    if (newSession.tutorId && newSession.startDate && newSession.endDate) {
      const hasOverlap = sessions.some((s: any) => 
        s.tutorId === newSession.tutorId && 
        s.startDate && s.endDate &&
        s.startDate <= newSession.endDate && 
        s.endDate >= newSession.startDate &&
        s.sessionStatus !== 'cancelled'
      );

      if (hasOverlap) {
        toast.error(<span className="font-bold text-red-600">This instructor is already assigned to an overlapping course intake! Please choose another instructor or different dates.</span>);
        return;
      }
    }

    try {
      const template = courses.find(c => c.id === newSession.courseId);
      const sessionData = {
        ...newSession,
        sessionName: `${template?.title || 'Course'} - ${newSession.startDate || 'Intake'}`,
        enrolledCount: 0,
        sessionStatus: 'open',
        earlyBirdPrice: newSession.earlyBirdPrice || template?.earlyBirdPrice || 0,
        standardPrice: newSession.standardPrice || template?.standardPrice || 0,
        price: newSession.standardPrice || template?.standardPrice || 0, // Fallback
        createdAt: serverTimestamp()
      };
      const sessionRef = doc(collection(db, 'course_sessions'));
      await setDoc(sessionRef, sessionData);
      await logAudit(user?.uid || 'admin', user?.email || 'admin', 'CREATE_SESSION', 'course_sessions', sessionRef.id, sessionData);
      toast.success("Session created!");
      setSessionCreationModalOpen(false);
      setSelectedTemplateForIntake(null);
      setNewSession({
        courseId: '',
        tutorId: '',
        startDate: '',
        endDate: '',
        quota: 20,
        classroom: '',
        meetingLink: '',
        deliveryMode: 'onsite',
        earlyBirdPrice: 0,
        standardPrice: 0,
        registrationOpen: true
      });
      fetchData();
    } catch(e: any) { toast.error(e.message); }
  };

  const handleGenerateLessonsAuto = async (sessionId: string) => {
    if (!lessonGen.startDate || !lessonGen.startTime || !lessonGen.endTime) return toast.error("Missing schedule info");
    try {
      const batch = writeBatch(db);
      let current = new Date(lessonGen.startDate);
      const targetDay = parseInt(lessonGen.dayOfWeek);
      
      // Adjust to first instance of targetDay
      while(current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
      }

      for (let i = 1; i <= lessonGen.count; i++) {
        const lessonRef = doc(collection(db, 'lessons'));
        const lessonDate = current.toISOString().split('T')[0];
        const session = sessions.find(s => s.id === sessionId);
        
        batch.set(lessonRef, {
          sessionId,
          lessonTitle: `Lesson ${i}`,
          lessonNumber: i,
          lessonDate: lessonDate,
          startTime: lessonGen.startTime,
          endTime: lessonGen.endTime,
          tutorId: session?.tutorId || '',
          classroom: session?.classroom || '',
          meetingLink: session?.meetingLink || '',
          lessonStatus: 'scheduled',
          createdAt: serverTimestamp()
        });
        
        // Move to next week
        current.setDate(current.getDate() + 7);
      }
      
      await batch.commit();
      toast.success(`${lessonGen.count} lessons generated!`);
      fetchData();
    } catch(e: any) { toast.error(e.message); }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    if ((selectedSession.sessionStatus === 'full' || selectedSession.sessionStatus === 'completed') && selectedSession.deliveryMode !== 'online' && !selectedSession.room) {
      toast.error(<span className="font-bold text-red-600">Please choose a room for {selectedSession.sessionStatus} courses.</span>);
      return;
    }

    if (selectedSession.deliveryMode !== 'online' && selectedSession.room && selectedSession.startDate && selectedSession.endDate) {
      const roomOverlap = sessions.some((s: any) => 
        s.id !== selectedSession.id &&
        s.room === selectedSession.room && 
        s.startDate && s.endDate &&
        s.startDate <= selectedSession.endDate && 
        s.endDate >= selectedSession.startDate &&
        s.sessionStatus !== 'cancelled'
      );

      if (roomOverlap) {
        toast.error(<span className="font-bold text-red-600">The selected room is already booked for overlapping dates! Please choose another room or different dates.</span>);
        return;
      }
    }

    if (selectedSession.tutorId && selectedSession.startDate && selectedSession.endDate) {
      const hasOverlap = sessions.some((s: any) => 
        s.id !== selectedSession.id &&
        s.tutorId === selectedSession.tutorId && 
        s.startDate && s.endDate &&
        s.startDate <= selectedSession.endDate && 
        s.endDate >= selectedSession.startDate &&
        s.sessionStatus !== 'cancelled'
      );

      if (hasOverlap) {
        toast.error(<span className="font-bold text-red-600">This instructor is already assigned to an overlapping course intake! Please choose another instructor or different dates.</span>);
        return;
      }
    }

    setLoading(true);
    try {
      const { id, createdAt, ...updates } = selectedSession;
      await updateDoc(doc(db, 'course_sessions', id), {
        ...updates,
        sessionStatus: updates.sessionStatus || 'open',
        updatedAt: serverTimestamp()
      });
      toast.success("Session updated successfully");
      setSessionModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const { id, createdAt, ...updates } = selectedCourse;
      await updateDoc(doc(db, 'courses', id), {
        ...updates,
        description: updates.description || '',
        status: updates.status || 'active',
        updatedAt: serverTimestamp()
      });
      toast.success("Course template updated successfully");
      setCourseModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'course' | 'session' | 'registration' | 'lesson', name: string} | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      if (itemToDelete.type === 'course') {
        await deleteDoc(doc(db, 'courses', itemToDelete.id));
        await logAudit(user?.uid || 'system', user?.email || 'system', 'DELETE_COURSE_TEMPLATE', 'courses', itemToDelete.id, {});
        toast.success("Course template deleted successfully");
      } else if (itemToDelete.type === 'session') {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'course_sessions', itemToDelete.id));
        lessons.filter(l => l.sessionId === itemToDelete.id).forEach(l => {
          batch.delete(doc(db, 'lessons', l.id));
        });
        await batch.commit();
        await logAudit(user?.uid || 'system', user?.email || 'system', 'DELETE_SESSION', 'course_sessions', itemToDelete.id, {});
        toast.success("Course session deleted");
      } else if (itemToDelete.type === 'registration') {
        await deleteDoc(doc(db, 'registrations', itemToDelete.id));
        await logAudit(user?.uid || 'system', user?.email || 'system', 'DELETE_REGISTRATION', 'registrations', itemToDelete.id, {});
        toast.success('Record deleted successfully');
      } else if (itemToDelete.type === 'lesson') {
        await deleteDoc(doc(db, 'lessons', itemToDelete.id));
        toast.success("Lesson deleted successfully");
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (id: string, type: 'course' | 'session' | 'registration' | 'lesson', name: string) => {
    setItemToDelete({ id, type, name });
    setDeleteConfirmOpen(true);
  };

  const handleDuplicateSession = async (oldSession: any) => {
    try {
      const { id, createdAt, enrolledCount, ...clonedData } = oldSession;
      const sessionRef = doc(collection(db, 'course_sessions'));
      const newSessionData = {
        ...clonedData,
        sessionName: `${clonedData.sessionName} (Copy)`,
        enrolledCount: 0,
        sessionStatus: 'open',
        createdAt: serverTimestamp()
      };
      await setDoc(sessionRef, newSessionData);
      
      // Also duplicate lesson structure if any
      const relatedLessons = lessons.filter(l => l.sessionId === id);
      if (relatedLessons.length > 0) {
        const batch = writeBatch(db);
        relatedLessons.forEach(l => {
          const { id: oldLid, sessionId, createdAt, ...lData } = l;
          const newLRef = doc(collection(db, 'lessons'));
          batch.set(newLRef, { 
            ...lData, 
            sessionId: sessionRef.id,
            createdAt: serverTimestamp()
          });
        });
        await batch.commit();
      }
      
      toast.success("Session duplicated successfully!");
      fetchData();
    } catch(e: any) { toast.error(e.message); }
  };

  const handleUpdateLesson = async (lessonId: string, updates: any) => {
    try {
      await updateDoc(doc(db, 'lessons', lessonId), updates);
      fetchData();
      toast.success("Lesson updated");
    } catch(e: any) { toast.error(e.message); }
  };

  const handleCreateCourse = async () => {
    try {
      const newRef = doc(collection(db, 'courses'));
      const courseData = {
        ...newCourse,
        earlyBirdPrice: Number(newCourse.earlyBirdPrice),
        standardPrice: Number(newCourse.standardPrice),
        price: Number(newCourse.standardPrice), // Compatibility fallback
        status: 'active',
        createdAt: serverTimestamp()
      };
      await setDoc(newRef, courseData);
      await logAudit(user?.uid || 'system', user?.email || 'system', 'CREATE_COURSE', 'courses', newRef.id, { title: newCourse.title, courseCode: newCourse.courseCode });
      toast.success("Course created!");
      setCourseCreationModalOpen(false);
      setNewCourse({ 
        courseCode: '',
        title: '', 
        certName: '',
        category: '',
        level: '',
        day: '',
        description: '', 
        outlineName: '',
        earlyBirdPrice: 0, 
        standardPrice: 0,
        tutorId: '',
        requiredExpertise: [],
        requiredCertifications: []
      });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateRegStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'registrations', id), { 
        status, 
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'system'
      });
      await logAudit(user?.uid || 'system', user?.email || 'system', 'UPDATE_REGISTRATION_STATUS', 'registrations', id, { status });
      toast.success(`Registration ${status}!`);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    // Deprecated, use confirmDelete directly
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingReg;
      await updateDoc(doc(db, 'registrations', id), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || 'system'
      });
      setIsEditRegOpen(false);
      toast.success('Registration updated');
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), { role: newRole });
      await logAudit(user?.uid || 'system', user?.email || 'system', 'UPDATE_USER_ROLE', 'users', userId, { role: newRole });
      toast.success("User role updated successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateHoursStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, 'teaching_hours', id), { status });
      await logAudit(user?.uid || 'system', user?.email || 'system', 'UPDATE_HOURS_STATUS', 'teaching_hours', id, { status });
      toast.success("Hours status updated!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleManualHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHoursForm.tutorId) return toast.error("Please select an instructor");
    
    setIsSubmittingManualHours(true);
    try {
      const selectedTutor = tutors.find(t => t.id === manualHoursForm.tutorId);

      await addDoc(collection(db, 'teaching_hours'), {
        tutorId: manualHoursForm.tutorId,
        tutorName: selectedTutor?.name || selectedTutor?.email || 'Unknown',
        date: manualHoursForm.date,
        course: manualHoursForm.course,
        hours: 0,
        notes: manualHoursForm.course || '',
        status: 'pending',
        isManual: true,
        createdAt: serverTimestamp()
      });
      
      await logAudit(user?.uid || 'system', user?.email || 'system', 'ADD_MANUAL_TEACHING_HOURS', 'teaching_hours', '', { tutorId: manualHoursForm.tutorId, hours: 0 });
      
      toast.success("Teaching record added manually");
      setManualHoursForm({
        tutorId: '',
        date: new Date().toISOString().split('T')[0],
        course: ''
      });
      setIsManualHoursModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingManualHours(false);
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) || 
                          (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  }).sort((a, b) => {
    const aValue = a[sortConfig.key] || '';
    const bValue = b[sortConfig.key] || '';
    if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.name) return;
    setLoading(true);
    try {
      const userId = `user_${Date.now()}`;
      const newUser: User = {
        id: userId,
        email: userForm.email!,
        name: userForm.name!,
        role: userForm.role as UserRole || 'student',
        status: userForm.status as UserStatus || 'active',
        phone: userForm.phone || '',
        createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', userId), newUser);
      await logAudit(user?.uid || 'admin', user?.email || 'admin', 'CREATE_USER', 'users', userId, newUser);
      
      toast.success("User created successfully");
      setIsUserModalOpen(false);
      setUserForm({ role: 'student', status: 'active' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setLoading(true);
    try {
      const updates = {
        name: userForm.name,
        phone: userForm.phone,
        status: userForm.status,
        remarks: userForm.remarks,
        role: userForm.role,
      };
      
      await updateDoc(doc(db, 'users', selectedUser.id), updates);
      await logAudit(user?.uid || 'admin', user?.email || 'admin', 'EDIT_USER', 'users', selectedUser.id, updates);
      
      toast.success("User updated successfully");
      setIsUserModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      await logAudit(user?.uid || 'admin', user?.email || 'admin', 'PASSWORD_RESET_REQUESTED', 'auth', email, {});
      toast.success(`Password reset email sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSort = (key: keyof User) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleOpenAttendanceModal = async (lesson: any) => {
    setSelectedLessonForAttendance(lesson);
    setIsAttendanceModalOpen(true);
    
    try {
      const attendanceSnap = await getDocs(query(collection(db, 'attendance'), where('lessonId', '==', lesson.id)));
      const existingAttendance: Record<string, string> = {};
      attendanceSnap.docs.forEach(d => {
        existingAttendance[d.data().studentId] = d.data().status;
      });
      const enrolled = regs.filter(r => r.sessionId === lesson.sessionId && r.status === 'verified');
      
      const mergedData: Record<string, string> = {};
      enrolled.forEach((s: any) => {
        mergedData[s.studentId] = existingAttendance[s.studentId] || 'present';
      });
      setAttendanceData(mergedData);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveAttendanceAdmin = async () => {
    if (!selectedLessonForAttendance) return;
    setSubmittingAttendance(true);
    try {
      const batch = writeBatch(db);
      for (const studentId of Object.keys(attendanceData)) {
        const attendanceId = `${selectedLessonForAttendance.id}_${studentId}`;
        const attRef = doc(db, 'attendance', attendanceId);
        batch.set(attRef, {
          lessonId: selectedLessonForAttendance.id,
          sessionId: selectedLessonForAttendance.sessionId,
          studentId: studentId,
          status: attendanceData[studentId],
          recordedAt: serverTimestamp(),
          recordedBy: user?.uid || 'admin'
        });
      }
      await batch.commit();
      
      await logAudit(user?.uid || 'admin', user?.email || '', 'ADMIN_MARK_ATTENDANCE', 'attendance', selectedLessonForAttendance.id, { students: Object.keys(attendanceData).length });
      
      toast.success("Attendance saved successfully");
      setIsAttendanceModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleExportAttendanceSheet = (session: any, course: any, enrolledStudents: any[]) => {
    const doc = new jsPDF();
    const date = formatHkDate(new Date());
    
    // Header
    if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith('data:image')) {
      try {
        doc.addImage(schoolInfo.logo_url, 'PNG', 20, 10, 15, 15);
      } catch (e) {
        // Fallback
      }
    }
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text('CLASS ATTENDANCE SHEET', 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, 190, 25, { align: 'right' });
    
    // Course Info Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(20, 35, 170, 30, 'F');
    doc.rect(20, 35, 170, 30);
    
    const sessionLessons = lessons.filter(l => l.sessionId === session.id);
    const displayStartTime = sessionLessons.length > 0 && sessionLessons[0].startTime ? sessionLessons[0].startTime : (session.startTime || 'N/A');
    const displayEndTime = sessionLessons.length > 0 && sessionLessons[0].endTime ? sessionLessons[0].endTime : (session.endTime || 'N/A');
    const timeDisplay = `${displayStartTime} - ${displayEndTime}`;
    
    const instructor = tutors.find(t => t.id === session.tutorId) || tutors.find(t => t.id === course?.tutorId);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Course: ${course?.title || 'Unknown'}`, 25, 45);
    doc.text(`Session Date: ${session.startDate}`, 25, 52);
    
    doc.text(`Instructor: ${instructor?.name || 'N/A'}`, 120, 45);
    doc.text(`Room/Mode: ${session.deliveryMode || session.classroom || 'N/A'}`, 120, 52);
    
    // Table Header
    const tableTop = 75;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, tableTop, 170, 10, 'F');
    doc.rect(20, tableTop, 170, 10);
    doc.line(85, tableTop, 85, tableTop + 10);
    doc.line(135, tableTop, 135, tableTop + 10);
    
    doc.setFontSize(10);
    doc.text('Student Name', 25, tableTop + 6.5);
    doc.text('Signature (Morning)', 90, tableTop + 6.5);
    doc.text('Signature (Afternoon)', 140, tableTop + 6.5);
    
    // Table Rows
    let currentY = tableTop + 10;
    enrolledStudents.forEach((student) => {
      const rowHeight = 16;
      if (currentY + rowHeight > 280) {
        doc.addPage();
        currentY = 20;
        // Redraw Header
        doc.setFillColor(241, 245, 249);
        doc.rect(20, currentY, 170, 10, 'F');
        doc.rect(20, currentY, 170, 10);
        doc.line(85, currentY, 85, currentY + 10);
        doc.line(135, currentY, 135, currentY + 10);
        doc.setFontSize(10);
        doc.text('Student Name', 25, currentY + 6.5);
        doc.text('Signature (Morning)', 90, currentY + 6.5);
        doc.text('Signature (Afternoon)', 140, currentY + 6.5);
        currentY += 10;
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(20, currentY, 170, rowHeight);
      doc.line(85, currentY, 85, currentY + rowHeight);
      doc.line(135, currentY, 135, currentY + rowHeight);
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      const name = student.studentName.length > 28 ? student.studentName.substring(0, 28) + '...' : student.studentName;
      doc.text(name, 25, currentY + 10);
      
      currentY += rowHeight;
    });
    
    doc.save(`Attendance_${course?.title || 'Course'}_${session.startDate}.pdf`);
  };

  const handleRescheduleSession = async (sessionId: string, newDate: string, newStart: string) => {
     try {
        await updateDoc(doc(db, 'course_sessions', sessionId), {
           startDate: newDate,
           startTime: newStart
        });
        toast.success("Session rescheduled");
        fetchData();
        setSessionModalOpen(false);
     } catch(e: any) { toast.error(e.message); }
  };

  const generatePTReport = (tutorId: string, tutorName: string, month: string) => {
    const doc = new jsPDF();
    const monthlyRecords = hours.filter(h => h.tutorId === tutorId && h.date && h.date.startsWith(month)).sort((a,b) => (a.date || '').localeCompare(b.date || ''));
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Part-time Instructor Monthly Report', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text('Instructor: ' + tutorName, 20, 35);
    doc.text('Report Month: ' + month, 20, 42);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);
    doc.setFontSize(10);
    doc.text('Date', 20, 55);
    doc.text('Course Name', 60, 55);
    doc.text('Status', 150, 55);
    doc.setLineWidth(0.2);
    doc.line(20, 58, 190, 58);
    doc.setFont('helvetica', 'normal');
    let y = 65;
    monthlyRecords.forEach(h => {
       if (y > 250) { doc.addPage(); y = 20; }
       doc.text(h.date || 'N/A', 20, y);
       const courseText = h.course || h.details || h.notes || 'Course';
       const splitNotes = doc.splitTextToSize(courseText.replace(/\n/g, ' '), 80);
       doc.text(splitNotes, 60, y);
       doc.text(h.status === 'completed' ? 'Completed' : 'Open', 150, y);
       y += (splitNotes.length * 5) + 3;
    });
    if (y > 230) { doc.addPage(); y = 20; }
    y += 20;
    doc.setLineWidth(0.2);
    doc.line(20, y, 70, y);
    doc.text('Instructor Signature', 20, y + 5);
    doc.text('Date:', 20, y + 12);
    doc.save('PT_Instructor_Report_' + tutorName.replace(/\s+/g,'_') + '_' + month + '.pdf');
  };

  const generateMTMReport = (tutorId: string, tutorName: string, year: string) => {
    const doc = new jsPDF();
    
    // Find all lessons for this tutor in the given year where course category is Microsoft
    const tutorLessons = lessons.filter(l => {
        const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
        const course = courses.find(c => c.id === session?.courseId);
        const isMicrosoft = course?.category === 'Microsoft' || course?.category?.toLowerCase() === 'microsoft';
        const tid = l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id;
        const inYear = (l.lessonDate || l.lesson_date || '').startsWith(year);
        return tid === tutorId && inYear && isMicrosoft;
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

    const manualMsHours = hours.filter(h => {
        if (h.tutorId !== tutorId || !h.isManual) return false;
        if (!h.date || !h.date.startsWith(year)) return false;
        
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

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Instructor Teaching Hours (MTM Report)`, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Instructor: ${tutorName}`, 20, 35);
    doc.text(`Report Year: ${year}`, 20, 42);
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

    doc.save(`MTM_Report_${tutorName.replace(/\s+/g,'_')}_${year}.pdf`);
  };

  const generateBulkCertificatesPDF = (certsList: any[], courseTitle: string) => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    certsList.forEach((cert, index) => {
      if (index > 0) doc.addPage();
      
      // Simple design
      doc.setFillColor(240, 248, 255);
      doc.rect(0, 0, 297, 210, 'F');
      
      // Border
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190, 'S');

      if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith('data:image')) {
        try {
          doc.addImage(schoolInfo.logo_url, 'PNG', 133, 15, 30, 30);
        } catch (e) {
          // Fallback
        }
      }

      doc.setTextColor(30, 58, 138);
      doc.setFontSize(40);
      doc.text("Certificate of Completion", 148, 65, { align: 'center' });
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(16);
      doc.text("This is to certify that", 148, 90, { align: 'center' });
      
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(30);
      doc.text(cert.studentName || "Student Name", 148, 110, { align: 'center' });
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(16);
      doc.text("has successfully completed the course", 148, 130, { align: 'center' });
      
      doc.setTextColor(37, 99, 235);
      doc.setFontSize(24);
      doc.text(cert.courseTitle || cert.course_title || courseTitle || "Course Title", 148, 150, { align: 'center' });
      
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(12);
      doc.text(`Issue Date: ${formatHkDate(cert.issuedAt || cert.issued_at || new Date())}`, 148, 180, { align: 'center' });
      doc.text(`Certificate ID: ${cert.id}`, 148, 190, { align: 'center' });
    });
    
    doc.save(`${courseTitle.replace(/\s+/g, '_')}_Certificates.pdf`);
  };

  const handleManageCertificates = async (session: any) => {
    setSelectedSessionCert(session);
    setIsCertModalOpen(true);
    setIsCertLoading(true);
    try {
      const enrolledStudents = regs.filter(r => r.sessionId === session.id && r.status === 'verified');
      const sessionLessons = lessons.filter(l => l.sessionId === session.id && l.lessonStatus === 'completed');
      
      if (sessionLessons.length === 0) {
        setSessionStudentsData(enrolledStudents.map(s => ({ 
          ...s, 
          attendanceRate: 0, 
          lessonsAttended: 0, 
          totalLessons: 0,
          alreadyIssued: false
        })));
        return;
      }

      const attendancePromises = enrolledStudents.map(async (student) => {
        const attSnap = await getDocs(query(
          collection(db, 'attendance'), 
          where('sessionId', '==', session.id), 
          where('studentId', '==', student.studentId)
        ));
        const attendedCount = attSnap.docs.filter(d => d.data().status === 'present').length;
        const totalPossible = sessionLessons.length;
        const rate = totalPossible > 0 ? (attendedCount / totalPossible) * 100 : 0;
        
        const certSnap = await getDocs(query(
          collection(db, 'certificates'),
          where('registrationId', '==', student.id)
        ));
        
        return {
          ...student,
          attendanceRate: rate,
          lessonsAttended: attendedCount,
          totalLessons: totalPossible,
          alreadyIssued: !certSnap.empty
        };
      });

      const results = await Promise.all(attendancePromises);
      setSessionStudentsData(results);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCertLoading(false);
    }
  };

  const handleToggleAttendanceConfirm = async (regId: string, type: 'am' | 'pm' | 'eve', currentValue: boolean) => {
    try {
      const fieldName = `${type}Confirmed`;
      await updateDoc(doc(db, 'registrations', regId), { [fieldName]: !currentValue });
      toast.success(`${type.toUpperCase()} Attendance ${!currentValue ? 'Confirmed' : 'Removed'}`);
      
      setRegs(prev => prev.map(r => r.id === regId ? { ...r, [fieldName]: !currentValue } : r));
      setSessionStudentsData(prev => prev.map(s => s.id === regId ? { ...s, [fieldName]: !currentValue } : s));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleIssueCertificateDirectly = async (studentData: any) => {
    try {
      const course = courses.find(c => c.id === studentData.courseId);
      const certRef = doc(collection(db, 'certificates'));
      const certId = certRef.id;
      const certData = {
        studentId: studentData.studentId || 'N/A',
        studentName: studentData.studentName,
        studentEmail: studentData.studentEmail,
        courseId: studentData.courseId,
        courseTitle: course?.title || 'Unknown Course',
        registrationId: studentData.id,
        issuedAt: serverTimestamp()
      };
      
      await setDoc(certRef, certData);
      await logAudit(user?.uid || 'admin', user?.email || 'admin', 'ISSUE_CERTIFICATE', 'certificates', certId, { studentName: studentData.studentName });
      
      toast.success(`Certificate issued to ${studentData.studentName}`);
      setSessionStudentsData(prev => prev.map(s => s.id === studentData.id ? { ...s, alreadyIssued: true } : s));
      
      const certSnap = await getDocs(collection(db, 'certificates'));
      setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleGenerateInvoice = (reg: any) => {
    const doc = new jsPDF();
    
    // Header
    if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith('data:image')) {
      try {
        doc.addImage(schoolInfo.logo_url, 'PNG', 20, 10, 25, 25);
        doc.setFontSize(22);
        doc.text(schoolInfo.name || "School Name", 50, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(schoolInfo.address || "Address", 50, 30);
        doc.text(schoolInfo.phone || "Phone", 50, 35);
      } catch (e) {
        // Fallback if image format fails
        doc.setFontSize(22);
        doc.text(schoolInfo.name || "School Name", 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(schoolInfo.address || "Address", 20, 28);
        doc.text(schoolInfo.phone || "Phone", 20, 33);
      }
    } else {
      doc.setFontSize(22);
      doc.text(schoolInfo.name || "School Name", 20, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(schoolInfo.address || "Address", 20, 28);
      doc.text(schoolInfo.phone || "Phone", 20, 33);
    }
    
    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);
    
    // Receipt Info
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("OFFICIAL RECEIPT", 105, 55, { align: 'center' });
    
    doc.setFontSize(12);
    doc.text(`Receipt No: ${reg.invoice_number || 'N/A'}`, 20, 70);
    doc.text(`Date: ${formatHkDate(reg.createdAt)}`, 140, 70);
    
    // Student Info
    doc.setFontSize(11);
    doc.text("Billed To:", 20, 85);
    doc.setFontSize(12);
    doc.text(reg.studentName, 20, 92);
    doc.setFontSize(10);
    doc.text(reg.studentEmail, 20, 97);
    
    // Itemized Table
    doc.setDrawColor(200);
    doc.rect(20, 110, 170, 60);
    doc.line(20, 120, 190, 120);
    
    doc.setFontSize(10);
    doc.text("Description", 25, 117);
    doc.text("Amount", 160, 117);
    
    const relatedCourse = courses.find(c => c.id === reg.courseId);
    doc.text(relatedCourse?.title || "Course Payment", 25, 130);
    doc.text(`$${reg.amount || 0}`, 160, 130);
    
    // Total
    doc.line(140, 170, 190, 170);
    doc.setFontSize(12);
    doc.text("Total Paid:", 140, 180);
    doc.text(`$${reg.amount || 0}`, 170, 180);
    
    // Payment Method
    doc.setFontSize(10);
    doc.text(`Payment Method: ${reg.paymentMethod || 'N/A'}`, 20, 180);
    doc.text(`Status: ${reg.status?.toUpperCase() || 'N/A'}`, 20, 185);
    
    // Terms & Conditions
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Terms & Conditions:", 20, 210);
    const terms = schoolInfo.terms_conditions || "";
    const splitTerms = doc.splitTextToSize(terms, 170);
    doc.text(splitTerms, 20, 215);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Thank you for your business!", 105, 270, { align: 'center' });
    
    doc.save(`${reg.invoiceNumber || 'receipt'}_${reg.studentName}.pdf`);
  };

  const handleCreateBranch = async () => {
    if (!newBranch.name) return toast.error("Branch name is required");
    try {
      await addDoc(collection(db, 'branches'), {
        ...newBranch,
        createdAt: serverTimestamp()
      });
      toast.success("Branch created");
      setNewBranch({ name: '', address: '', contact_phone: '' });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBatchUpdateShifts = async (branchId: string, tutorIds: string[], startDate: string, endDate: string, startTime: string, endTime: string) => {
     if (!branchId || tutorIds.length === 0 || !startDate || !endDate) return toast.error("Missing required fields");
     try {
       const batch = writeBatch(db);
       const start = new Date(startDate);
       const end = new Date(endDate);
       
       for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
         const dateStr = d.toISOString().split('T')[0];
         tutorIds.forEach(tutorId => {
           const shiftRef = doc(collection(db, 'tutor_shifts'));
           batch.set(shiftRef, {
             tutorId,
             branchId,
             date: dateStr,
             startTime,
             endTime,
             type: 'regular',
             status: 'scheduled',
             updatedAt: serverTimestamp()
           });
         });
       }
       await batch.commit();
       toast.success("Batch shifts scheduled");
       fetchData();
     } catch (e: any) {
       toast.error(e.message);
     }
  };

  const handleSaveSchoolInfo = async () => {
    try {
      await setDoc(doc(db, 'settings', 'school_info'), {
        ...schoolInfo,
        updatedAt: serverTimestamp()
      });
      toast.success("School settings saved successfully!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleIssueCertificate = async (reg: any) => {
    try {
      // First update the registration to 'completed'
      await updateDoc(doc(db, 'registrations', reg.id), { status: 'verified', updatedAt: serverTimestamp() });
      
      const relatedCourse = courses.find(c => c.id === reg.courseId);
      
      // Create the certificate record
      const certRef = doc(collection(db, 'certificates'));
      await setDoc(certRef, {
        studentId: reg.studentId || '',
        studentEmail: reg.studentEmail,
        studentName: reg.studentName,
        courseId: reg.courseId,
        courseTitle: relatedCourse ? relatedCourse.title : reg.courseId,
        registrationId: reg.id,
        issuedAt: serverTimestamp()
      });
      
      toast.success("Certificate issued successfully!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data.length) return toast.info("No data to export");
    const headers = Object.keys(data[0]).filter(k => k !== 'createdAt' && k !== 'updatedAt');
    const csvContent = [
      headers.join(','),
      ...data.map(row => headers.map(h => `"${(row[h] || '').toString().replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const hkDate = formatHkDate(new Date()).replace(/\//g, '-');
    link.download = `${filename}_${hkDate}.csv`;
    link.click();
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);
      
      const t1Ref = doc(collection(db, 'users'));
      batch.set(t1Ref, { name: 'Alice Smith', email: 'alice.tutor@example.com', role: 'tutor', createdAt: serverTimestamp() });
      
      const c1Ref = doc(collection(db, 'courses'));
      batch.set(c1Ref, {
        courseCode: 'AZ-900T00',
        title: 'Introduction to Microsoft Azure',
        certName: 'Fundamental',
        category: 'Microsoft',
        level: 'Beginner',
        day: '1',
        description: 'MODULE 1: Describe cloud concepts\nMODULE 2: Describe Azure architecture and services\nMODULE 3: Describe Azure management and governance',
        earlyBirdPrice: 2000,
        standardPrice: 4000,
        price: 4000,
        certificateAvailable: true,
        tutorId: t1Ref.id,
        status: 'active',
        createdAt: serverTimestamp()
      });
      
      const cs1Ref = doc(collection(db, 'course_sessions'));
      batch.set(cs1Ref, {
        courseId: c1Ref.id,
        tutorId: t1Ref.id,
        sessionName: 'June Intake',
        startDate: '2026-06-01',
        endDate: '2026-06-30',
        startTime: '18:00',
        endTime: '20:00',
        location: 'Online via Zoom',
        deliveryMode: 'online',
        quota: 30,
        sessionStatus: 'open',
        createdAt: serverTimestamp()
      });

      const kb1Ref = doc(collection(db, 'knowledge_base'));
      batch.set(kb1Ref, {
        topic: 'Refund Policy',
        category: 'General',
        content: 'Our refund policy allows full refunds up to 7 days before the course starts.',
        status: 'published'
      });

      await batch.commit();
      toast.success("Sample data seeded successfully!");
      fetchData();
    } catch(e: any) {
      toast.error("Seeding failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSavePromo = async () => {
    if (!user?.email) return;

    if (!promoForm.adminPassword) {
      toast.error("Please enter your admin password to confirm");
      return;
    }

    try {
      // Re-authenticate admin to confirm promotion creation/edit
      await signInWithEmailAndPassword(auth, user.email, promoForm.adminPassword);
    } catch (e: any) {
      toast.error("Invalid password. Promotion not saved.");
      return;
    }

    try {
      let conditions: any = {};
      if (promoForm.type === 'bundle') {
          if (!promoForm.bundleCourse1 || !promoForm.bundleCourse2) {
             toast.error("Please select two courses for the bundle.");
             return;
          }
          conditions.requiredCourseIds = [promoForm.bundleCourse1, promoForm.bundleCourse2];
      }

      const payload = {
        name: promoForm.name,
        code: promoForm.type === 'code' ? promoForm.code.toUpperCase() : null,
        type: promoForm.type,
        discountType: 'fixed',
        discountValue: Number(promoForm.discountValue),
        status: promoForm.status,
        applicableCourseIds: promoForm.applicableCourseIds,
        startDate: promoForm.startDate ? `${promoForm.startDate}T00:00:00` : null,
        endDate: promoForm.endDate ? `${promoForm.endDate}T23:59:59` : null,
        conditions,
        updatedAt: serverTimestamp()
      };

      if (selectedPromo) {
        await updateDoc(doc(db, 'promotions', selectedPromo.id), {
           ...payload,
           updatedByAdminId: user.uid,
           updatedByAdminEmail: user.email
        });
        toast.success("Promotion updated");
      } else {
        await addDoc(collection(db, 'promotions'), { 
           ...payload, 
           createdAt: serverTimestamp(), 
           usageCount: 0,
           createdByAdminId: user.uid,
           createdByAdminEmail: user.email 
        });
        toast.success("Promotion created");
      }
      setIsPromoModalOpen(false);
      fetchData();
    } catch(e: any) {
      toast.error("Failed to save promotion: " + e.message);
    }
  };

  if (role !== 'admin') return <div className="text-center py-20">Access Denied</div>;

  const NavigationMenu = () => (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">Menu</div>
      {[
        { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
        { id: 'courses', label: 'Templates', icon: BookOpen },
        { id: 'sessions', label: 'Courses', icon: CalendarIcon },
        { id: 'finance', label: t('nav.finance'), icon: BarChart2 },
        { id: 'certificates', label: t('nav.certificates'), icon: Database },
        { id: 'scheduling', label: t('nav.scheduling'), icon: CalendarRange },
        { id: 'tutors', label: t('nav.tutors'), icon: Clock },
        { id: 'feedback', label: t('nav.feedback'), icon: MessageSquare },
        { id: 'logs', label: t('nav.logs'), icon: ShieldAlert },
        { id: 'users', label: t('nav.users'), icon: Users },
        { id: 'promotions', label: 'Promotions', icon: Sparkles },
        { id: 'settings', label: t('nav.settings'), icon: Upload }
      ].map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}
        >
          <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400'}`} />
          {tab.label}
        </button>
      ))}
      <hr className="my-2 border-slate-100" />
      <Link
        to="/instructor"
        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-indigo-600 hover:bg-indigo-50 transition-colors border border-indigo-100"
      >
        <GraduationCap className="w-4 h-4" />
        {t('tutor.portal_title')}
      </Link>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 relative px-4 md:px-8 py-8 font-sans bg-slate-50/30 min-h-screen">
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setPreviewImage(null)}>
          <img src={previewImage} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl" />
        </div>
      )}
      
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">{t('admin.dashboard_title')}</h1>
        <Button variant="outline" size="sm" onClick={handleSeedData} disabled={seeding} className="gap-2 text-slate-600 w-full sm:w-auto">
          {seeding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />} Seed Sample Data
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside className="hidden md:block w-full">
           <NavigationMenu />
        </aside>
        
        {/* Mobile Nav */}
        <div className="md:hidden overflow-x-auto pb-2">
           <div className="flex gap-2 min-w-max">
             {['overview', 'courses', 'sessions', 'scheduling', 'finance', 'certificates', 'tutors', 'feedback', 'logs', 'users', 'settings'].map(tab => (
               <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 rounded-full text-sm font-medium capitalize whitespace-nowrap ${activeTab === tab ? 'bg-blue-600 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
               >
                 {t(`nav.${tab}`)}
               </button>
             ))}
           </div>
        </div>

        <main className="flex-1 space-y-6">
          {activeTab === 'overview' && (() => {
            // Analytics computations
            const verifiedRegs = regs.filter(r => r.status === 'verified');
            const totalRev = verifiedRegs.reduce((acc, r) => acc + (r.amount || 0), 0);
            
            // Revenue by Course mapping
            const revMap: Record<string, number> = {};
            verifiedRegs.forEach(r => {
               const cRef = courses.find(c => c.id === r.courseId)?.title || r.courseId?.slice(0, 8);
               revMap[cRef] = (revMap[cRef] || 0) + (r.amount || 0);
            });
            const courseRevData = Object.keys(revMap).map(k => ({ name: k, revenue: revMap[k] }));

            // Student Retention (users with > 1 course)
            const studentCounts = verifiedRegs.reduce((acc, r) => {
               acc[r.studentEmail] = (acc[r.studentEmail] || 0) + 1;
               return acc;
            }, {} as Record<string, number>);
            const repeatStudents = Object.values(studentCounts).filter((c: any) => c > 1).length;
            const totalUniqueStudents = Object.keys(studentCounts).length;
            const retentionRate = totalUniqueStudents ? ((repeatStudents / totalUniqueStudents) * 100).toFixed(1) : '0';

            return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-blue-100 shadow-sm bg-gradient-to-br from-blue-50 to-white">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-blue-800 font-bold uppercase tracking-wide">Total Revenue</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-blue-600">${totalRev.toFixed(0)}</p>
                    <p className="text-xs text-blue-500 font-medium mt-1">Verified payments only</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Student Retention</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-800">{retentionRate}%</p>
                    <p className="text-xs text-slate-500 mt-1">Repeat students</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200">
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Certificates Issued</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-slate-800">{certificates.length}</p>
                    <p className="text-xs text-slate-500 mt-1">Course completion</p>
                  </CardContent>
                </Card>
                <Card className="shadow-sm border-slate-200 cursor-pointer hover:border-red-300 transition-colors" onClick={() => setActiveTab('finance')}>
                  <CardHeader className="pb-2"><CardTitle className="text-sm text-slate-500 font-medium uppercase tracking-wide">Action Required</CardTitle></CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-red-500">{regs.filter(r => r.status === 'pending_verification').length}</p>
                    <p className="text-xs text-red-400 mt-1">Pending payments</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><BarChart2 className="w-5 h-5 text-blue-600"/> Revenue by Course</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[300px] w-full relative min-w-0 min-h-[300px]">
                       {courseRevData.length > 0 ? (
                         <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                           <BarChart data={courseRevData}>
                             <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                             <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                             <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val}`} />
                             <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                             <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                           </BarChart>
                         </ResponsiveContainer>
                       ) : (
                         <div className="h-full flex items-center justify-center text-slate-400">No revenue data available</div>
                       )}
                    </CardContent>
                 </Card>
                 <Card>
                    <CardHeader>
                       <CardTitle className="flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600"/> Quick Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                             <p className="text-sm font-medium text-slate-800">Total Unique Students</p>
                             <p className="text-xs text-slate-500">Registered and verified</p>
                          </div>
                          <span className="text-2xl font-bold text-slate-800">{totalUniqueStudents}</span>
                       </div>
                       <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                             <p className="text-sm font-medium text-slate-800">Total active courses</p>
                             <p className="text-xs text-slate-500">Live in system</p>
                          </div>
                          <span className="text-2xl font-bold text-slate-800">{courses.length}</span>
                       </div>
                       <div className="flex justify-between items-center p-3 sm:p-4 bg-slate-50 rounded-lg border border-slate-100">
                          <div>
                              <p className="text-sm font-medium text-slate-800">Total active instructors</p>
                             <p className="text-xs text-slate-500">Taking courses</p>
                          </div>
                          <span className="text-2xl font-bold text-slate-800">{tutors.length}</span>
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          )
          })()}



          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-xl font-bold text-slate-800 tracking-tight">Financial Reports & Payments</h2>
                  <p className="text-sm text-slate-500">Track revenue and verify student payments</p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search Invoice #, Email, Phone..."
                      className="pl-10 w-full sm:w-[350px] h-10 border-slate-200 focus:ring-blue-500"
                      value={regSearchTerm}
                      onChange={(e) => setRegSearchTerm(e.target.value)}
                    />
                  </div>
                  <Button variant="outline" onClick={() => handleExportCSV(regs.map((r:any) => ({ Invoice: r.invoiceNumber, Student: r.studentName, Amount: r.amount, Method: r.paymentMethod, Status: r.status, Date: formatHkDate(r.createdAt, true) })), 'financial_report')} className="gap-2 h-10 border-slate-200 font-bold text-[10px] uppercase tracking-widest">
                    <Download className="w-4 h-4" /> Export Report
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-indigo-50/50 via-white to-white border-indigo-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Total Verified Revenue</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                      ${regs.filter((r:any) => r.status === 'verified').reduce((sum: number, r:any) => sum + (r.amount || 0), 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <TrendingUp className="w-3 h-3 text-green-500" />
                      <span className="text-[10px] font-medium">Verified payments</span>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-gradient-to-br from-amber-50/50 via-white to-white border-amber-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Pending Verification</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                      ${regs.filter((r:any) => r.status === 'pending' || r.status === 'pending_verification').reduce((sum: number, r:any) => sum + (r.amount || 0), 0).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <Clock className="w-3 h-3 text-amber-500" />
                      <span className="text-[10px] font-medium">Awaiting approval</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-slate-50/50 via-white to-white border-slate-100 shadow-sm">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Total Transactions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-extrabold text-slate-900 tracking-tighter">
                      {regs.length}
                    </div>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <BarChart3 className="w-3 h-3 text-slate-400" />
                      <span className="text-[10px] font-medium tracking-wide">All historical records</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-slate-200 shadow-sm overflow-hidden">
                <CardHeader className="bg-slate-50/30 border-b border-slate-100 pb-4">
                  <CardTitle className="text-sm font-bold text-slate-800">Payment Transactions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Invoice No.</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Info</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Method</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Amount</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Proof</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Date</TableHead>
                          <TableHead className="py-4 px-6 text-[10px] font-bold uppercase tracking-wider text-slate-500">Status</TableHead>
                          <TableHead className="py-4 px-6 text-right text-[10px] font-bold uppercase tracking-wider text-slate-500">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regs
                          .filter(r => {
                            const searchLower = regSearchTerm.toLowerCase();
                            return (
                              (r.invoiceNumber || '').toLowerCase().includes(searchLower) ||
                              (r.studentName || '').toLowerCase().includes(searchLower) ||
                              (r.studentEmail || '').toLowerCase().includes(searchLower) ||
                              (r.studentPhone || '').toLowerCase().includes(searchLower)
                            );
                          })
                          .map((r: any) => (
                           <TableRow key={r.id} className="hover:bg-slate-50/50 transition-colors">
                             <TableCell className="px-6 font-mono text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                {r.invoiceNumber || r.id?.slice(0,8)}
                             </TableCell>
                             <TableCell className="px-6">
                               <div className="font-bold text-slate-800">{r.studentName}</div>
                               <div className="text-[10px] text-slate-500 font-medium">{r.studentEmail}</div>
                               <div className="text-[10px] text-slate-400 italic mt-0.5">{r.studentPhone}</div>
                             </TableCell>
                             <TableCell className="px-6">
                               {r.paymentMethod ? (
                                  <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-slate-600 border border-slate-200 uppercase tracking-wide">{r.paymentMethod}</span>
                               ) : <span className="text-slate-300">-</span>}
                             </TableCell>
                             <TableCell className="px-6 font-extrabold text-slate-900 tracking-tighter">${r.amount}</TableCell>
                             <TableCell className="px-6">
                               {r.paymentProof ? (
                                 <Button variant="ghost" size="sm" className="h-8 text-blue-600 gap-1 px-2 border border-blue-100 bg-blue-50/50 hover:bg-blue-50" onClick={() => setPreviewImage(r.paymentProof)}>
                                   <ExternalLink className="w-3 h-3" /> View
                                 </Button>
                               ) : <span className="text-[10px] text-slate-300 italic">No proof</span>}
                             </TableCell>
                             <TableCell className="px-6 text-[10px] font-bold text-slate-500 uppercase">{formatHkDate(r.createdAt)}</TableCell>
                             <TableCell className="px-6">
                                <div className="flex flex-col gap-1">
                                  <span className={`text-[10px] px-2 py-1 rounded-md font-bold uppercase tracking-wider border w-max block text-center ${
                                    r.status === 'verified' 
                                      ? 'bg-green-50 text-green-700 border-green-100' 
                                      : r.status === 'pending' || r.status === 'pending_verification'
                                        ? 'bg-blue-50 text-blue-700 border-blue-100 animate-pulse' 
                                        : 'bg-yellow-50 text-yellow-700 border-yellow-100'
                                  }`}>
                                    {r.status === 'pending_verification' ? (
                                      <span className="flex flex-col leading-none py-0.5">
                                        <span>Pending</span>
                                        <span>Verification</span>
                                      </span>
                                    ) : r.status?.replace('_', ' ')}
                                  </span>
                                  {r.updatedBy && (
                                    <div className="text-[9px] text-slate-400 font-medium leading-tight break-words max-w-[120px]">
                                      By: {r.updatedBy.split('@')[0]}
                                      <br/>
                                      {formatHkDate(r.updatedAt, true)}
                                    </div>
                                  )}
                                </div>
                             </TableCell>
                             <TableCell className="px-6 text-right">
                                <div className="flex justify-end items-center gap-2">
                                  {r.status === 'verified' && (
                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" onClick={() => handleGenerateInvoice(r)} title="Download Receipt">
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  )}
                                  {(r.status === 'pending_verification' || r.status === 'pending') && (
                                    <Button size="sm" variant="outline" onClick={() => handleUpdateRegStatus(r.id, 'verified')} className="h-8 border-green-200 text-green-600 hover:bg-green-50 text-[10px] font-bold uppercase tracking-widest px-4">
                                      Verify
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" onClick={() => { setEditingReg(r); setIsEditRegOpen(true); }} title="Edit Record">
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50" onClick={() => confirmDelete(r.id, 'registration', `${r.studentName || 'Student'} - ${r.invoiceNumber || 'No Invoice'}`)} title="Delete Record">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                             </TableCell>
                           </TableRow>
                        ))}
                        {regs.length === 0 && (
                          <TableRow><TableCell colSpan={7} className="text-center py-16">
                            <div className="flex flex-col items-center gap-2 text-slate-300">
                               <BarChart3 className="w-12 h-12" />
                               <span className="text-sm font-medium">No financial transactions found</span>
                            </div>
                          </TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>

              <Dialog open={isEditRegOpen} onOpenChange={setIsEditRegOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Edit Payment Record</DialogTitle>
                    <DialogDescription>Manually correct registration details</DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleUpdateRegistration} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Student Name</Label>
                        <Input value={editingReg?.studentName || ''} onChange={e => setEditingReg({...editingReg, studentName: e.target.value})} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone</Label>
                        <Input value={editingReg?.studentPhone || ''} onChange={e => setEditingReg({...editingReg, studentPhone: e.target.value})} />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input value={editingReg?.studentEmail || ''} onChange={e => setEditingReg({...editingReg, studentEmail: e.target.value})} type="email" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Amount ($)</Label>
                        <Input value={editingReg?.amount || 0} onChange={e => setEditingReg({...editingReg, amount: Number(e.target.value)})} type="number" />
                      </div>
                      <div className="space-y-2">
                        <Label>Status</Label>
                        <select 
                          className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          value={editingReg?.status || ''} 
                          onChange={e => setEditingReg({...editingReg, status: e.target.value})}
                        >
                          <option value="pending">Pending</option>
                          <option value="pending_verification">Pending Verification</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsEditRegOpen(false)}>Cancel</Button>
                      <Button type="submit">Save Changes</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {activeTab === 'certificates' && (
            <div className="space-y-6">
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-50 gap-4">
                    <div>
                      <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Certificates History</CardTitle>
                      <CardDescription className="text-xs font-medium text-slate-500">Record of all issued digital certificates</CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input 
                          placeholder="Search course name..." 
                          className="pl-9 h-8 text-xs focus:ring-blue-500 border-slate-200"
                          value={certSearchTerm}
                          onChange={(e) => setCertSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="relative w-full sm:w-40 flex items-center bg-white border border-slate-200 rounded-md overflow-hidden">
                        <CalendarIcon className="w-4 h-4 ml-3 text-slate-400 shrink-0" />
                        <select 
                          className="h-8 text-xs bg-transparent focus:ring-0 focus:outline-none flex-1 px-2 cursor-pointer min-w-0"
                          value={certDateTerm}
                          onChange={(e) => setCertDateTerm(e.target.value)}
                        >
                          <option value="">All months</option>
                          {Array.from(new Set(certificates.map((c: any) => {
                            const dateObj = (c.issuedAt?.toDate ? c.issuedAt.toDate() : new Date(c.issuedAt || c.issued_at));
                            return isNaN(dateObj.getTime()) ? '' : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                          }).filter(Boolean))).sort().reverse().map(monthStr => {
                            const [year, month] = (monthStr as string).split('-');
                            const label = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('en-US', { month: 'long', year: 'numeric' });
                            return <option key={monthStr as string} value={label}>{label}</option>
                          })}
                        </select>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => handleExportCSV(certificates, 'certificates')} className="gap-2 h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200"><Download className="w-3.5 h-3.5" /> Export</Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course</TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Issued At</TableHead>
                            <TableHead className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(
                            certificates.reduce((acc, cert) => {
                              const reg = regs.find(r => r.id === cert.registrationId);
                              const session = sessions.find(s => s.id === reg?.sessionId);
                              const sessionLabel = session ? `${session.sessionName} (${session.startDate} to ${session.endDate})` : 'Unknown Session';
                              
                              const key = `${cert.courseId || "Unknown Course"}_${session?.id || "unknown"}`;
                              if (!acc[key]) acc[key] = { 
                                courseTitle: cert.courseTitle || cert.course_title, 
                                sessionLabel: sessionLabel,
                                certs: [] 
                              };
                              acc[key].certs.push(cert);
                              return acc;
                            }, {} as Record<string, { courseTitle: string, sessionLabel: string, certs: any[] }>)
                          ).filter(([key, data]: [string, any]) => {
                            let match = true;
                            if (certSearchTerm) {
                                match = match && !!data.courseTitle?.toLowerCase().includes(certSearchTerm.toLowerCase());
                            }
                            if (certDateTerm) {
                                const issuedAt = data.certs.length > 0 ? (data.certs[0].issuedAt || data.certs[0].issued_at) : null;
                                const dateObj = issuedAt?.toDate ? issuedAt.toDate() : new Date(issuedAt);
                                const certMonthStr = (issuedAt && !isNaN(dateObj.getTime())) ? dateObj.toLocaleString('en-US', { month: 'long', year: 'numeric' }) : '';
                                match = match && certMonthStr === certDateTerm;
                            }
                            return match;
                          }).sort(([, dataA]: [string, any], [, dataB]: [string, any]) => {
                            const dateA = dataA.certs.length > 0 ? (dataA.certs[0].issuedAt?.toDate ? dataA.certs[0].issuedAt.toDate() : new Date(dataA.certs[0].issuedAt || dataA.certs[0].issued_at)) : new Date(0);
                            const dateB = dataB.certs.length > 0 ? (dataB.certs[0].issuedAt?.toDate ? dataB.certs[0].issuedAt.toDate() : new Date(dataB.certs[0].issuedAt || dataB.certs[0].issued_at)) : new Date(0);
                            return dateB.getTime() - dateA.getTime();
                          }).map(([key, data]: [string, any]) => (
                            <TableRow key={key} className="border-slate-50 hover:bg-slate-50/50 transition-colors">
                              <TableCell className="px-6 py-4">
                                <div className="font-bold text-slate-800">{data.courseTitle || "Unknown Course"}</div>
                                <div className="text-xs font-medium text-slate-500 mt-0.5">{data.sessionLabel}</div>
                              </TableCell>
                              <TableCell className="px-6 py-4">
                                <div className="text-xs font-bold text-slate-700">
                                  {data.certs.length > 0 ? formatHkDate(data.certs[0].issuedAt || data.certs[0].issued_at) : 'N/A'}
                                </div>
                                <div className="text-[10px] text-slate-400 mt-0.5">
                                  {data.certs.length} certificates
                                </div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                 <Button size="sm" variant="outline" onClick={() => generateBulkCertificatesPDF(data.certs, `${data.courseTitle} - ${data.sessionLabel}`)} className="gap-2 h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 border-blue-100 hover:bg-blue-50/50"><Download className="w-3 h-3"/> Download {data.certs.length} PDFs</Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          {certificates.length === 0 && (
                            <TableRow><TableCell colSpan={3} className="text-center py-12 text-slate-400 text-xs italic tracking-wider">No certificates found in system records.</TableCell></TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
            </div>
          )}

          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              {/* Top Navigation for Calendars */}
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-max mb-6">
                <Button variant={scheduleTab === 'trainer-daily' ? 'default' : 'ghost'} size="sm" onClick={() => setScheduleTab('trainer-daily')} className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider">
                  Instructor (Daily)
                </Button>
                <Button variant={scheduleTab === 'trainer-monthly' ? 'default' : 'ghost'} size="sm" onClick={() => setScheduleTab('trainer-monthly')} className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider">
                  Instructor (Monthly)
                </Button>
                <Button variant={scheduleTab === 'room-daily' ? 'default' : 'ghost'} size="sm" onClick={() => setScheduleTab('room-daily')} className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider">
                  Room (Daily)
                </Button>
                <Button variant={scheduleTab === 'room-monthly' ? 'default' : 'ghost'} size="sm" onClick={() => setScheduleTab('room-monthly')} className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider">
                  Room (Monthly)
                </Button>
                <Button variant={scheduleTab === 'tech-daily' ? 'default' : 'ghost'} size="sm" onClick={() => setScheduleTab('tech-daily')} className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"><div className="bg-blue-600 text-white p-1 rounded mr-1.5 flex items-center justify-center"><Building2 className="w-3 h-3"/></div> Tech Setup (Daily)</Button>
              </div>

              {/* TECH SETUP DAILY */}
              {scheduleTab === 'tech-daily' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm relative overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
                  <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
                    <div>
                      <CardTitle className="flex items-center gap-2"><div className="bg-blue-600 text-white p-1.5 rounded-md flex items-center justify-center"><Building2 className="w-4 h-4"/></div> Tech Setup Overview</CardTitle>
                      <CardDescription>Detailed daily breakdown of room usage and configuration requirements</CardDescription>
                    </div>
                    <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
                      <Button variant="ghost" size="sm" onClick={() => {
                          const today = new Date();
                          setScheduleDate(today.toISOString().split('T')[0]);
                      }} className="h-8 px-3 text-xs font-bold text-slate-600">Today</Button>
                      <Button variant="ghost" size="sm" onClick={() => {
                          const tomorrow = new Date();
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          setScheduleDate(tomorrow.toISOString().split('T')[0]);
                      }} className="h-8 px-3 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100">Tomorrow</Button>
                      <div className="w-[1px] bg-slate-200 mx-2 my-1"></div>
                      <Input type="date" className="w-auto h-8 text-xs border-transparent bg-transparent focus-visible:ring-0 shadow-none" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-6">
                      {(() => {
                        let configRooms = schoolInfo?.rooms ? schoolInfo.rooms.split(',').map(r => r.trim()).filter(Boolean) : [];
                        const usedRooms = lessons.map(l => {
                          const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                          return l.classroom || session?.room || session?.classroom;
                        }).filter(Boolean);
                        let availableRooms = Array.from(new Set([...configRooms, ...usedRooms, 'unassigned'])) as string[];
                        
                        const activeLessonsToday = lessons.filter(l => (l.lessonDate || l.lesson_date || '') === scheduleDate);
                        
                        const activeSessionsToday = sessions.filter(s => {
                            if (s.sessionStatus === 'cancelled') return false;
                            const isDailyLesson = activeLessonsToday.some(l => l.sessionId === s.id);
                            if (isDailyLesson) return true;
                            if (!s.startDate || !s.endDate) return false;
                            if (s.deliveryMode === 'self_paced' || s.deliveryMode === 'video') return false;
                            return (s.startDate <= scheduleDate && s.endDate >= scheduleDate);
                        });
                        
                        const allSessionsToDisplay: any[] = [];
                        const processedSessionIds = new Set();
                        
                        activeLessonsToday.forEach(l => {
                            const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                            if (!session) return;
                            if (session.sessionStatus === 'cancelled') return;
                            
                            allSessionsToDisplay.push({
                                id: l.id,
                                sessionId: session.id,
                                room: l.classroom || session.room || session.classroom || 'unassigned',
                                startTime: l.startTime || session.startTime,
                                endTime: l.endTime || session.endTime,
                                courseId: session.courseId,
                                sessionName: session.sessionName,
                                tutorId: l.tutorId || l.tutor_id || session.tutorId || session.tutor_id,
                                remarks: session.remarks || session.notes || '',
                                isLesson: true,
                                lessonTitle: l.lessonTitle
                            });
                            processedSessionIds.add(session.id);
                        });
                        
                        activeSessionsToday.forEach(s => {
                            if (processedSessionIds.has(s.id)) return;
                            allSessionsToDisplay.push({
                                id: s.id,
                                sessionId: s.id,
                                room: s.room || s.classroom || s.deliveryMode || 'unassigned',
                                startTime: s.startTime,
                                endTime: s.endTime,
                                courseId: s.courseId,
                                sessionName: s.sessionName,
                                tutorId: s.tutorId || s.tutor_id,
                                remarks: s.remarks || s.notes || '',
                                isLesson: false,
                                lessonTitle: ''
                            });
                        });
                        
                        const roomGroups: Record<string, any[]> = {};
                        allSessionsToDisplay.forEach(item => {
                            const r = item.room || 'unassigned';
                            if (!roomGroups[r]) roomGroups[r] = [];
                            roomGroups[r].push(item);
                        });
                        
                        const roomKeys = Object.keys(roomGroups).sort();
                        
                        if (roomKeys.length === 0) {
                             return <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 flex flex-col items-center"><Building2 className="w-10 h-10 mb-3 text-slate-300" /><p className="font-medium text-sm">No setups required for {scheduleDate}.</p></div>;
                        }
                        
                        return roomKeys.map(rName => {
                             const roomItems = roomGroups[rName].sort((a,b) => (a.startTime || '').localeCompare(b.startTime || ''));
                             return (
                                 <div key={rName} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                                    <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-300" />
                                            <h3 className="font-black text-white text-sm uppercase tracking-wider">{rName === 'unassigned' ? 'Unassigned Room' : rName}</h3>
                                        </div>
                                        <div className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold tracking-wider text-white uppercase">{roomItems.length} Sessions</div>
                                    </div>
                                    <div className="divide-y divide-slate-100 p-2 space-y-2">
                                        {roomItems.map(item => {
                                            const course = courses.find(c => c.id === item.courseId);
                                            const tutor = tutors.find(t => t.id === item.tutorId);
                                            const studentCount = regs.filter(reg => reg.sessionId === item.sessionId && reg.status === 'verified').length;
                                            
                                            // Determine config color context
                                            const isMicrosoft = course?.category === 'Microsoft' || course?.category?.toLowerCase() === 'microsoft' || (course?.title || '').toLowerCase().includes('microsoft');
                                            const configBadge = isMicrosoft ? "bg-blue-100 text-blue-700 border-blue-200" : "bg-slate-100 text-slate-700 border-slate-200";
                                            
                                            return (
                                                 <div key={item.id} className="p-4 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row gap-4 justify-between">
                                                     <div className="space-y-4 flex-1">
                                                         <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                                            <div className="border-l-4 border-blue-600 pl-3">
                                                                <div className="font-black text-slate-800 text-base leading-tight">
                                                                    {course?.title || item.sessionName}
                                                                </div>
                                                                {item.lessonTitle && <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> {item.lessonTitle}</div>}
                                                            </div>
                                                            <div className="flex items-center gap-2 self-start">
                                                                <div className="text-sm font-black bg-white border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap flex items-center gap-2">
                                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                                    {item.startTime} - {item.endTime}
                                                                </div>
                                                            </div>
                                                         </div>
                                                         
                                                         <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4 border-l border-slate-200 ml-0.5">
                                                             <div>
                                                                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400"/> Instructor</div>
                                                                 <div className="text-sm font-black text-slate-700 flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">{tutor?.name?.charAt(0) || '?'}</div>
                                                                    {tutor?.name || tutor?.email || 'Unassigned'}
                                                                 </div>
                                                             </div>
                                                             <div>
                                                                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><MonitorPlay className="w-3 h-3 text-slate-400"/> Requirements</div>
                                                                 <div className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded border shadow-sm ${configBadge}`}>
                                                                     {course?.category || 'Standard Config'}
                                                                 </div>
                                                             </div>
                                                             <div>
                                                                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5"><Users className="w-3 h-3 text-slate-400"/> Pax Status</div>
                                                                 <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                                                     <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded shadow-sm">{studentCount} Enrolled</div>
                                                                 </div>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                            );
                                        })}
                                    </div>
                                 </div>
                             );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TRAINER DAILY */}
              {scheduleTab === 'trainer-daily' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                    <div>
                      <CardTitle>Instructor Daily Schedule</CardTitle>
                      <CardDescription>View all trainers for a specific day</CardDescription>
                    </div>
                    <Input type="date" className="w-auto h-9 text-xs" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {tutors.map(tutor => {
                        const tutorLessons = lessons.filter(l => {
                          const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                          const tid = l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id;
                          const date = l.lessonDate || l.lesson_date || '';
                          return tid === tutor.id && date === scheduleDate;
                        });
                        
                        const tutorSessions = sessions.filter(s => {
                          if (s.sessionStatus === 'cancelled') return false;
                          const tid = s.tutorId || s.tutor_id;
                          if (tid !== tutor.id) return false;
                          if (!s.startDate || !s.endDate) return false;
                          return s.startDate <= scheduleDate && s.endDate >= scheduleDate;
                        });
                        
                        if (tutorLessons.length === 0 && tutorSessions.length === 0) return null;
                        
                        return (
                          <div key={tutor.id} className="p-4 border border-slate-100 rounded-lg shadow-sm">
                            <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                              <Users className="w-5 h-5 text-indigo-500" /> {tutor.name}
                            </h3>
                            
                            {tutorLessons.length > 0 && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                                {tutorLessons.map(l => {
                                  const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                                  const course = courses.find(c => c.id === session?.courseId);
                                  const displayStartTime = l.startTime ? l.startTime : session?.startTime;
                                  const displayEndTime = l.endTime ? l.endTime : session?.endTime;
                                  const timeDisplay = displayStartTime && displayEndTime ? `${displayStartTime} - ${displayEndTime}` : 'Time TBC';
                                  return (
                                    <div key={l.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-sm">
                                      <div className="font-bold text-indigo-900">{course?.title || session?.sessionName}</div>
                                      <div className="text-xs text-indigo-700 mt-1">{timeDisplay}</div>
                                      <div className="text-xs text-indigo-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.classroom || session?.room || session?.classroom || session?.deliveryMode || 'Room TBC'}</div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            
                            {tutorSessions.length > 0 && (
                              <div>
                                <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Active Assigned Intakes Spanning This Date</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                  {tutorSessions.sort((a,b) => (a.startDate || '').localeCompare(b.startDate || '')).map(s => {
                                    const course = courses.find(c => c.id === s.courseId);
                                    return (
                                      <div key={s.id} className="p-3 border border-slate-200 bg-slate-50/50 rounded flex flex-col justify-center">
                                        <div className="font-bold text-slate-700 text-xs mb-1">{course?.title || s.sessionName}</div>
                                        <div className="text-[10px] text-slate-500 font-medium">Duration: {s.startDate} to {s.endDate}</div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {tutors.filter(tutor => {
                         const tidHasLessons = lessons.some(l => {
                            const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                            const tid = l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id;
                            const date = l.lessonDate || l.lesson_date || '';
                            return tid === tutor.id && date === scheduleDate;
                         });
                         const tidHasSessions = sessions.some(s => {
                            if (s.sessionStatus === 'cancelled') return false;
                            const tid = s.tutorId || s.tutor_id;
                            if (tid !== tutor.id) return false;
                            return s.startDate && s.endDate && s.startDate <= scheduleDate && s.endDate >= scheduleDate;
                         });
                         return tidHasLessons || tidHasSessions;
                      }).length === 0 && (
                        <div className="py-12 text-center text-slate-400 text-sm italic tracking-wide">No classes or assigned intakes scheduled for {scheduleDate}.</div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* TRAINER MONTHLY */}
              {scheduleTab === 'trainer-monthly' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                    <div>
                      <CardTitle>Instructor Monthly Overview</CardTitle>
                      <CardDescription>View a specific trainer's month at a glance</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white" value={scheduleInstructorFilter} onChange={e => setScheduleInstructorFilter(e.target.value)}>
                        <option value="">All Instructors</option>
                        {tutors.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                      <Input type="month" className="w-auto h-9 text-xs" value={scheduleMonth} onChange={e => setScheduleMonth(e.target.value)} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {(() => {
                      const overlappingSessions = sessions.filter(s => {
                        if (s.sessionStatus === 'cancelled') return false;
                        const tid = s.tutorId || s.tutor_id;
                        if (scheduleInstructorFilter && tid !== scheduleInstructorFilter) return false;
                        if (!s.startDate || !s.endDate) return false;
                        return s.startDate.startsWith(scheduleMonth) || s.endDate.startsWith(scheduleMonth) || (s.startDate < scheduleMonth && s.endDate > scheduleMonth);
                      });

                      return (
                        <div className="mt-6">
                            {(() => {
                                const groupedByInstructor: Record<string, any[]> = {};
                                overlappingSessions.forEach(s => {
                                    const tid = s.tutorId || s.tutor_id || 'unassigned';
                                    if (!groupedByInstructor[tid]) groupedByInstructor[tid] = [];
                                    groupedByInstructor[tid].push(s);
                                });

                                const instructorKeys = Object.keys(groupedByInstructor).sort((a, b) => {
                                    if (a === 'unassigned') return 1;
                                    if (b === 'unassigned') return -1;
                                    const tA = tutors.find(t => t.id === a)?.name || '';
                                    const tB = tutors.find(t => t.id === b)?.name || '';
                                    return tA.localeCompare(tB);
                                });

                                if (instructorKeys.length === 0) {
                                  return <div className="py-8 text-center text-slate-400 text-sm italic">No active intakes for this month.</div>;
                                }

                                return instructorKeys.map(tid => {
                                    const instructorName = tid === 'unassigned' ? 'Unassigned Instructor' : (tutors.find(t => t.id === tid)?.name || 'Unknown');
                                    const sessionsForTid = groupedByInstructor[tid].sort((a,b) => (a.startDate || '').localeCompare(b.startDate || ''));

                                    return (
                                        <div key={tid} className="mb-8">
                                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                <Users className="w-4 h-4 text-indigo-500" /> {instructorName} - Active Intakes
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {sessionsForTid.map(s => {
                                                    const course = courses.find(c => c.id === s.courseId);
                                                    return (
                                                      <div key={s.id} className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-lg flex flex-col justify-center">
                                                          <div className="font-bold text-indigo-900 text-sm mb-1">{course?.title || s.sessionName}</div>
                                                          <div className="text-[11px] text-indigo-600 font-medium mb-1">Duration: {s.startDate} to {s.endDate}</div>
                                                      </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}

                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}

              {/* ROOM DAILY */}
              {scheduleTab === 'room-daily' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                    <div>
                      <CardTitle>Room Daily Schedule</CardTitle>
                      <CardDescription>View all training spaces for a specific day</CardDescription>
                    </div>
                    <Input type="date" className="w-auto h-9 text-xs" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} />
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      {(() => {
                        let configRooms = schoolInfo?.rooms ? schoolInfo.rooms.split(',').map(r => r.trim()).filter(Boolean) : [];
                        const usedRooms = lessons.map(l => {
                          const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                          return l.classroom || session?.room || session?.classroom;
                        }).filter(Boolean);
                        let availableRooms = Array.from(new Set([...configRooms, ...usedRooms])) as string[];
                        
                        if (availableRooms.length === 0) availableRooms = ['Training Room 1', 'Training Room 2', 'Training Room 3', 'Training Room 4'];
                        
                        return availableRooms.map(roomName => {
                          const roomLessons = lessons.filter(l => {
                            const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                            const r = l.classroom || session?.room || session?.classroom;
                            const date = l.lessonDate || l.lesson_date || '';
                            return r === roomName && date === scheduleDate;
                          });
                          
                          const roomSessions = sessions.filter(s => {
                            if (s.sessionStatus === 'cancelled') return false;
                            const r = s.room || s.classroom || s.deliveryMode;
                            if (r !== roomName) return false;
                            if (!s.startDate || !s.endDate) return false;
                            return s.startDate <= scheduleDate && s.endDate >= scheduleDate;
                          });

                          return (
                            <div key={roomName} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                              <h3 className="font-black text-slate-800 mb-4 inline-flex px-3 py-1 bg-white border border-slate-200 rounded-md shadow-sm items-center gap-2">
                                <Building2 className="w-4 h-4 text-emerald-600" /> {roomName}
                              </h3>
                              <div className="space-y-4 text-sm">
                                {roomLessons.length === 0 && roomSessions.length === 0 && (
                                  <div className="p-4 text-center text-slate-400 text-xs italic uppercase tracking-wider">Available (No Bookings)</div>
                                )}
                                
                                {roomLessons.length > 0 && (
                                  <div className="space-y-2">
                                    {roomLessons.map(l => {
                                      const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                                      const course = courses.find(c => c.id === session?.courseId);
                                      const displayStartTime = l.startTime ? l.startTime : session?.startTime;
                                      const displayEndTime = l.endTime ? l.endTime : session?.endTime;
                                      const timeDisplay = displayStartTime && displayEndTime ? `${displayStartTime} - ${displayEndTime}` : 'Time TBC';
                                      const tid = l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id;
                                      const tutor = tutors.find(t => t.id === tid);
                                      return (
                                        <div key={l.id} className="p-3 bg-white border-l-4 border-emerald-500 rounded shadow-sm">
                                          <div className="font-bold text-slate-800">{timeDisplay}</div>
                                          <div className="text-emerald-700 font-medium">{course?.title || session?.sessionName}</div>
                                          <div className="text-xs text-slate-500 mt-1">Instructor: <span className="font-semibold text-slate-700">{tutor?.name || 'Unassigned'}</span></div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {roomSessions.length > 0 && (
                                  <div>
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Active Course Intakes Spanning This Date</h4>
                                    <div className="space-y-2">
                                      {roomSessions.sort((a,b) => (a.startDate || '').localeCompare(b.startDate || '')).map(s => {
                                        const course = courses.find(c => c.id === s.courseId);
                                        const tutor = tutors.find(t => t.id === (s.tutorId || s.tutor_id));
                                        return (
                                          <div key={s.id} className="p-2 border border-slate-200 bg-white shadow-sm rounded flex flex-col justify-center">
                                            <div className="font-bold text-slate-700 text-xs mb-1">{course?.title || s.sessionName}</div>
                                            <div className="text-[10px] text-slate-500 font-medium mb-1">Duration: {s.startDate} to {s.endDate}</div>
                                            <div className="text-[10px] text-slate-500">Instructor: <span className="font-semibold text-slate-700">{tutor?.name || 'Unassigned'}</span></div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* ROOM MONTHLY */}
              {scheduleTab === 'room-monthly' && (
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
                    <div>
                      <CardTitle>Room Monthly Overview</CardTitle>
                      <CardDescription>View a specific training space's month at a glance</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <select className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white" value={scheduleRoomFilter} onChange={e => setScheduleRoomFilter(e.target.value)}>
                        <option value="">All Rooms</option>
                        {(() => {
                          let configRooms = schoolInfo?.rooms ? schoolInfo.rooms.split(',').map(r => r.trim()).filter(Boolean) : [];
                          const usedRooms = lessons.map(l => {
                            const session = sessions.find(s => s.id === l.sessionId || s.id === l.session_id);
                            return l.classroom || session?.room || session?.classroom;
                          }).filter(Boolean);
                          let availableRooms = Array.from(new Set([...configRooms, ...usedRooms])) as string[];
                          if (availableRooms.length === 0) availableRooms = ['Training Room 1', 'Training Room 2', 'Training Room 3', 'Training Room 4'];
                          return availableRooms.map(r => <option key={r} value={r}>{r}</option>);
                        })()}
                      </select>
                      <Input type="month" className="w-auto h-9 text-xs" value={scheduleMonth} onChange={e => setScheduleMonth(e.target.value)} />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {(() => {
                      const overlappingSessions = sessions.filter(s => {
                        if (s.sessionStatus === 'cancelled') return false;
                        const r = s.room || s.classroom || s.deliveryMode;
                        if (scheduleRoomFilter && r !== scheduleRoomFilter) return false;
                        if (!s.startDate || !s.endDate) return false;
                        return s.startDate.startsWith(scheduleMonth) || s.endDate.startsWith(scheduleMonth) || (s.startDate < scheduleMonth && s.endDate > scheduleMonth);
                      });

                      return (
                        <div className="mt-6">
                            {(() => {
                                const groupedByRoom: Record<string, any[]> = {};
                                overlappingSessions.forEach(s => {
                                    const room = s.room || s.classroom || s.deliveryMode || 'unassigned';
                                    if (!groupedByRoom[room]) groupedByRoom[room] = [];
                                    groupedByRoom[room].push(s);
                                });

                                const roomKeys = Object.keys(groupedByRoom).sort((a, b) => {
                                    if (a === 'unassigned') return 1;
                                    if (b === 'unassigned') return -1;
                                    return a.localeCompare(b);
                                });

                                if (roomKeys.length === 0) {
                                  return <div className="py-8 text-center text-slate-400 text-sm italic">No active intakes for this room this month.</div>;
                                }

                                return roomKeys.map(roomName => {
                                    const sessionsForRoom = groupedByRoom[roomName].sort((a,b) => (a.startDate || '').localeCompare(b.startDate || ''));

                                    return (
                                        <div key={roomName} className="mb-8">
                                            <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-emerald-500" /> {roomName === 'unassigned' ? 'Unassigned Room' : roomName} - Active Intakes
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {sessionsForRoom.map(s => {
                                                    const course = courses.find(c => c.id === s.courseId);
                                                    const tutor = tutors.find(t => t.id === (s.tutorId || s.tutor_id));
                                                    return (
                                                      <div key={s.id} className="p-3 border border-emerald-100 bg-emerald-50/30 rounded-lg flex flex-col justify-center">
                                                          <div className="font-bold text-emerald-900 text-sm mb-1">{course?.title || s.sessionName}</div>
                                                          <div className="text-[11px] text-emerald-600 font-medium mb-1">Duration: {s.startDate} to {s.endDate}</div>
                                                          <div className="text-[10px] text-slate-500 mb-1">Instructor: <span className="font-semibold text-slate-700">{tutor?.name || 'Unassigned'}</span></div>
                                                      </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}

                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'courses' && (
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
          )}

          {activeTab === 'tutors' && (
            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                <CardHeader className="flex flex-col md:flex-row md:items-center justify-between pb-4 gap-4 border-b border-slate-50">
                  <div>
                    <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Part-time Instructor</CardTitle>
                    <CardDescription className="text-xs font-medium text-slate-500">Track records and verify completed courses</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <Input 
                        placeholder="Search instructor..." 
                        className="pl-9 h-9 text-xs w-48 focus:ring-indigo-500" 
                        value={instructorSearchTerm}
                        onChange={(e) => setInstructorSearchTerm(e.target.value)}
                      />
                    </div>
                    <Input type="month" value={ptMonth} onChange={e => setPtMonth(e.target.value)} className="h-9 text-xs w-36" />
                    <Button onClick={() => setIsManualHoursModalOpen(true)} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
                      <Plus className="w-3.5 h-3.5" /> Add Course
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => {
                        const uniqueTutors = Array.from(new Set(hours.filter(h => {
                             if (!h.date || !h.date.startsWith(ptMonth)) return false;
                             const t = tutors.find(t=>t.id===h.tutorId);
                             if (t?.role !== 'tutor_pt') return false;
                             if (instructorSearchTerm && !t?.name?.toLowerCase().includes(instructorSearchTerm.toLowerCase())) return false;
                             return true;
                        }).map(h => h.tutorId)));
                        if (uniqueTutors.length === 0) return toast.error('No records found to generate report');
                        uniqueTutors.forEach(tid => {
                           const t = tutors.find(t=>t.id===tid);
                           if (t) generatePTReport(tid, t.name || t.email || 'Unknown', ptMonth);
                        });
                        toast.success('Generated ' + uniqueTutors.length + ' reports');
                    }} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider border-slate-200 hover:bg-slate-50">
                      <Download className="w-3.5 h-3.5" /> Download PDF
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50 border-b border-slate-100">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Instructor</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course Name</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Date</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hours.filter(h => {
                         if (ptMonth && (!h.date || !h.date.startsWith(ptMonth))) return false;
                         const tutor = tutors.find(t => t.id === h.tutorId);
                         if (tutor?.role !== 'tutor_pt') return false;
                         if (!instructorSearchTerm) return true;
                         return tutor?.name?.toLowerCase().includes(instructorSearchTerm.toLowerCase());
                      }).map(h => {
                        const tutor = tutors.find(t => t.id === h.tutorId);
                        return (
                          <TableRow key={h.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="px-6 py-4">
                              <div className="font-bold text-slate-800">{tutor?.name || 'Unknown Instructor'}</div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{h.tutorId?.slice(0,8)}...</div>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md text-[11px] border border-indigo-100 uppercase tracking-wider shadow-sm">
                                {h.course || h.details || h.notes || 'N/A'}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="text-[11px] font-medium text-slate-600 tracking-tight">{h.date || 'N/A'}</span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                               <span className={`px-2.5 py-1 rounded text-[9px] font-black uppercase tracking-wider ${
                                 h.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-200 shadow-sm' : 
                                 h.status === 'paid' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm' : 
                                 'bg-amber-100 text-amber-700 border border-amber-200 shadow-sm'}`}>
                                 {h.status?.replace('_', ' ')}
                               </span>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                               <div className="flex justify-end gap-2">
                                 {h.status === 'pending_approval' && (
                                    <Button size="sm" onClick={() => handleUpdateHoursStatus(h.id, 'approved')} className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-slate-800 text-white shadow-md transition-transform active:scale-95">Approve</Button>
                                 )}
                                 {h.status === 'approved' && (
                                    <Button size="sm" variant="outline" onClick={() => handleUpdateHoursStatus(h.id, 'paid')} className="h-8 px-4 text-[10px] font-bold uppercase tracking-wider border-emerald-200 text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 shadow-sm transition-transform active:scale-95">Mark Paid</Button>
                                 )}
                                 {h.status === 'paid' && (
                                    <span className="h-8 flex items-center px-4 text-[10px] font-bold uppercase tracking-wider text-slate-400 italic">Settled</span>
                                 )}
                               </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {hours.filter(h => {
                         if (ptMonth && (!h.date || !h.date.startsWith(ptMonth))) return false;
                         const tutor = tutors.find(t => t.id === h.tutorId);
                         if (tutor?.role !== 'tutor_pt') return false;
                         if (!instructorSearchTerm) return true;
                         return tutor?.name?.toLowerCase().includes(instructorSearchTerm.toLowerCase());
                      }).length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-12 text-slate-400 text-xs italic tracking-wider">No part-time instructor records found matching your criteria.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'feedback' && (
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <CardTitle>Student Feedback</CardTitle>
                 <Button variant="outline" size="sm" onClick={() => handleExportCSV(feedbacks, 'feedback')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
               </CardHeader>
               <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Rating</TableHead>
                        <TableHead>Comments</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {feedbacks.map(f => (
                        <TableRow key={f.id}>
                          <TableCell className="font-medium">{f.studentName}</TableCell>
                          <TableCell><span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-xs font-bold">{f.rating} / 5</span></TableCell>
                          <TableCell className="text-xs text-slate-600 italic whitespace-normal max-w-sm">"{f.comment}"</TableCell>
                        </TableRow>
                      ))}
                      {feedbacks.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">No feedback submitted yet.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
               </CardContent>
             </Card>
          )}

          {activeTab === 'sessions' && (
            <div className="space-y-6">
              <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-max mb-6">
                <Button 
                  variant={courseRunsActiveTab === 'runs' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setCourseRunsActiveTab('runs')}
                  className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
                >
                  Course Runs
                </Button>
                <Button 
                  variant={courseRunsActiveTab === 'attendance' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setCourseRunsActiveTab('attendance')}
                  className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
                >
                  Sessions & Attendance
                </Button>
              </div>

              {courseRunsActiveTab === 'runs' ? (
                <>
                  {!viewingLessonsForSession ? (
                    <>
                      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                        <div>
                          <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Active Courses & Intakes</h2>
                          <p className="text-xs text-slate-500">Manage your course runs and schedules</p>
                        </div>
                        <Button 
                          onClick={() => setSessionCreationModalOpen(true)} 
                          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                        >
                          <Plus className="w-4 h-4 mr-2" /> 
                          New Course Instance
                        </Button>
                      </div>

                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Active Courses & Intakes</CardTitle>
                        <CardDescription>Manage your course runs and schedules</CardDescription>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <Input 
                            placeholder="Search code, course, instructor, status..." 
                            className="pl-9 h-8 text-xs focus:ring-blue-500 border-slate-200"
                            value={courseRunSearchTerm}
                            onChange={(e) => setCourseRunSearchTerm(e.target.value)}
                          />
                        </div>
                        <Button variant="outline" size="sm" onClick={() => handleExportCSV(sessions, 'sessions')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Code Name</TableHead>
                              <TableHead>Course</TableHead>
                              <TableHead>Instructor</TableHead>
                              <TableHead>Delivery & Room</TableHead>
                              <TableHead>Enrolled</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sessions.filter(s => {
                                if (s.sessionStatus === 'cancelled') return false;
                                const hasCertificates = certificates.some((cert: any) => {
                                    const reg = regs.find((r: any) => r.id === cert.registrationId);
                                    return reg?.sessionId === s.id;
                                });
                                if (hasCertificates) return false;
                                
                                if (courseRunSearchTerm) {
                                    const course = courses.find((c: any) => c.id === s.courseId);
                                    const instructor = tutors.find((t: any) => t.id === s.tutorId);
                                    const term = courseRunSearchTerm.toLowerCase();
                                    const matchCourseCode = course?.courseCode?.toLowerCase().includes(term);
                                    const matchSessionName = s.sessionName?.toLowerCase().includes(term);
                                    const matchCourseTitle = course?.title?.toLowerCase().includes(term);
                                    const matchInstructor = instructor?.name?.toLowerCase().includes(term);
                                    const matchStatus = s.sessionStatus?.toLowerCase().includes(term);
                                    return matchCourseCode || matchSessionName || matchCourseTitle || matchInstructor || matchStatus;
                                }
                                return true;
                            }).map(s => {
                              const course = courses.find(c => c.id === s.courseId);
                              const instructor = tutors.find(t => t.id === s.tutorId);
                              return (
                                <TableRow key={s.id} className="hover:bg-slate-50/50">
                                  <TableCell>
                                    <div className="font-semibold text-slate-800 whitespace-pre-wrap leading-snug">{course?.courseCode || s.sessionName}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                                      {s.startDate || 'No date'} - {s.endDate || 'No date'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs whitespace-pre-wrap max-w-[200px] leading-tight">{course?.title || 'Unknown'}</TableCell>
                                  <TableCell className="text-xs font-medium">{instructor?.name || 'Unassigned'}</TableCell>
                                  <TableCell>
                                    <div className="flex flex-col gap-1 items-start">
                                      <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-black text-[10px] tracking-tight text-slate-600">
                                        {s.deliveryMode || 'N/A'}
                                      </span>
                                      {s.room && (
                                        <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                                          <MapPin className="w-3 h-3" /> {s.room}
                                        </span>
                                      )}
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold">{regs.filter(r => r.sessionId === s.id && r.status === 'verified').length}</span>
                                      <span className="text-slate-300">/</span>
                                      <span className="text-slate-500">{s.quota}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${s.sessionStatus === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {s.sessionStatus}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" title="Edit" onClick={() => { setSelectedSession(s); setSessionModalOpen(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-300 hover:text-red-600" title="Delete" onClick={() => confirmDelete(s.id, 'session', s.sessionName || 'Unknown Session')}>
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" onClick={() => setViewingLessonsForSession(null)} className="h-8 text-slate-600">
                        <ChevronLeft className="w-4 h-4 mr-1" /> Back
                      </Button>
                      <div>
                        <h2 className="text-xl font-bold text-slate-800">{viewingLessonsForSession.sessionName}</h2>
                        <p className="text-xs text-slate-500">Manage lesson curriculum and scheduling for this run</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Card className="lg:col-span-1 border-indigo-100 bg-indigo-50/10 shadow-sm self-start">
                      <CardHeader><CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2"><Sparkles className="w-4 h-4" /> AI Batch Scheduler</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">First Lesson Date</label>
                          <Input type="date" value={lessonGen.startDate} onChange={e => {
                            const val = e.target.value;
                            const v = isWeekendOrHoliday(val);
                            if (v.isInvalid) return toast.error(v.reason);
                            setLessonGen({...lessonGen, startDate: val});
                          }} className="h-10" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 uppercase">Start Time</label>
                            <Input type="time" value={lessonGen.startTime} onChange={e => setLessonGen({...lessonGen, startTime: e.target.value})} className="h-10" />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs font-semibold text-slate-600 uppercase">End Time</label>
                            <Input type="time" value={lessonGen.endTime} onChange={e => setLessonGen({...lessonGen, endTime: e.target.value})} className="h-10" />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">Class Day</label>
                          <select 
                            className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={lessonGen.dayOfWeek}
                            onChange={e => setLessonGen({...lessonGen, dayOfWeek: e.target.value})}
                          >
                            <option value="1">Every Monday</option>
                            <option value="2">Every Tuesday</option>
                            <option value="3">Every Wednesday</option>
                            <option value="4">Every Thursday</option>
                            <option value="5">Every Friday</option>
                            <option value="6">Every Saturday</option>
                            <option value="0">Every Sunday</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-600 uppercase">Number of Lessons</label>
                          <Input type="number" value={isNaN(lessonGen.count) || lessonGen.count === 0 ? '' : lessonGen.count} onChange={e => setLessonGen({...lessonGen, count: parseInt(e.target.value) || 0})} className="h-10" />
                        </div>
                        <div className="pt-2">
                        <Button 
                          onClick={() => handleGenerateLessonsAuto(viewingLessonsForSession.id)} 
                          className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                        >
                          Generate Timetable
                        </Button>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 shadow-sm">
                      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b mb-4">
                        <CardTitle className="text-lg">Class Schedule</CardTitle>
                        <Button variant="ghost" size="sm" className="h-8 text-blue-600 hover:bg-blue-50 font-bold text-xs" onClick={async () => {
                           const title = prompt("Lesson Title:");
                           const date = prompt("Date (YYYY-MM-DD):", viewingLessonsForSession.start_date || "");
                           if (title && date) {
                              try {
                                await setDoc(doc(collection(db, 'lessons')), {
                                  sessionId: viewingLessonsForSession.id,
                                  lessonTitle: title,
                                  lessonDate: date,
                                  lessonNumber: lessons.filter(l => l.sessionId === viewingLessonsForSession.id).length + 1,
                                  startTime: '19:00',
                                  endTime: '21:00',
                                  lessonStatus: 'scheduled',
                                  createdAt: serverTimestamp()
                                });
                                fetchData();
                                toast.success("Lesson added");
                              } catch(e: any) { toast.error(e.message); }
                           }
                        }}>
                          <Plus className="w-3.5 h-3.5 mr-1" /> New Class
                        </Button>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {lessons.filter(l => l.sessionId === viewingLessonsForSession.id).map((l, idx) => (
                            <div key={l.id} className="p-4 border rounded-xl hover:border-indigo-200 transition-all bg-white shadow-sm flex items-center justify-between group">
                              <div className="flex items-center gap-4">
                                <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                                  {idx + 1}
                                </div>
                                <div className="space-y-1">
                                   <div className="text-sm font-black text-slate-800 tracking-tight">{l.lesson_title}</div>
                                   <div className="text-[10px] font-bold text-slate-400 flex items-center gap-4">
                                      <span className="flex items-center gap-1.5 uppercase font-mono"><CalendarIcon className="w-3 h-3 text-indigo-400"/> {l.lessonDate}</span>
                                      <span className="flex items-center gap-1.5 uppercase font-mono"><Clock className="w-3 h-3 text-indigo-400"/> {l.startTime} - {l.endTime}</span>
                                   </div>
                                </div>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-8 px-2 text-[10px] font-bold uppercase tracking-wider text-green-600 hover:text-green-700 hover:bg-green-50 mr-1" title="Attendance" onClick={() => handleOpenAttendanceModal(l)}>
                                  <ClipboardList className="w-3.5 h-3.5 mr-1" /> Attendance
                                </Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit" onClick={() => {
                                  const newDate = prompt("New Date:", l.lesson_date);
                                  if (newDate) handleUpdateLesson(l.id, { lesson_date: newDate });
                                }}><Edit2 className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50" title="Remove" onClick={() => {
                                    confirmDelete(l.id, 'lesson', l.lesson_title || 'Unknown Lesson');
                                }}><Trash2 className="w-3.5 h-3.5" /></Button>
                              </div>
                            </div>
                          ))}
                          {lessons.filter(l => l.sessionId === viewingLessonsForSession.id).length === 0 && (
                            <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                               <CalendarIcon className="w-10 h-10 mx-auto mb-4 text-slate-200" />
                               <p className="font-bold text-slate-600 mb-1">No lessons scheduled</p>
                               <p className="text-xs max-w-[200px] mx-auto text-slate-400">Use the batch scheduler to automate your run's timetable.</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
              </>
            ) : (
              <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
                <CardHeader className="border-b border-slate-50 bg-slate-50/30">
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-xl font-black text-slate-800 tracking-tight">Session Certificates</CardTitle>
                      <CardDescription className="text-xs font-medium text-slate-500">Manage attendance sheets and issue certificates by course intake</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50/50">
                      <TableRow className="hover:bg-transparent border-slate-100">
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Course / Session</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dates</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enrollees</TableHead>
                        <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</TableHead>
                        <TableHead className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map(s => {
                        const course = courses.find(c => c.id === s.courseId);
                        const sessionRegs = regs.filter(r => r.sessionId === s.id && r.status === 'verified');
                        
                        return (
                          <TableRow key={s.id} className="group border-slate-50 hover:bg-slate-50/50 transition-colors">
                            <TableCell className="px-6 py-4">
                              <div className="font-bold text-slate-800 leading-tight">{course?.title}</div>
                              <div className="text-[10px] font-mono text-slate-400 mt-0.5">{s.sessionName}</div>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-xs font-medium text-slate-600">
                              {s.startDate} - {s.endDate}
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                {sessionRegs.length} STUDENTS
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4">
                              <span className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                                s.sessionStatus === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {s.sessionStatus}
                              </span>
                            </TableCell>
                            <TableCell className="px-6 py-4 text-right">
                              <div className="flex justify-end gap-2">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider gap-2 border-slate-200 hover:bg-white" 
                                  onClick={() => handleExportAttendanceSheet(s, course, sessionRegs)}
                                >
                                  <ClipboardList className="w-3 h-3 text-slate-400" /> Attendance
                                </Button>
                                <Button 
                                  size="sm" 
                                  className="h-8 text-[10px] font-bold uppercase tracking-wider bg-slate-900 hover:bg-black"
                                  onClick={() => handleManageCertificates(s)}
                                >
                                  <Award className="w-3.5 h-3.5 mr-1.5" /> Manage
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search users..."
                      className="pl-9 w-64 h-9 bg-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <select 
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                  >
                    <option value="all">All Roles</option>
                    <option value="admin">Admins</option>
                    <option value="tutor">Instructors</option>
                    <option value="student">Students</option>
                  </select>
                  <select 
                    className="h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
                <Button 
                  onClick={() => {
                    setSelectedUser(null);
                    setUserForm({ role: 'student', status: 'active' });
                    setIsUserModalOpen(true);
                  }}
                  className="gap-2 bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" /> Add User
                </Button>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle>User Directory</CardTitle>
                    <CardDescription>Directory of all system users including staff and students</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleExportCSV(filteredUsers, 'users')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                        <TableRow>
                          <TableHead className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('name')}>User</TableHead>
                          <TableHead className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('role')}>Role</TableHead>
                          <TableHead className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('status')}>Status</TableHead>
                          <TableHead className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => handleSort('createdAt')}>Joined At</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredUsers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                            No users found matching your criteria
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredUsers.map(u => (
                          <TableRow key={u.id}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-sm">
                                  {u.name ? u.name[0] : (u.email ? u.email[0].toUpperCase() : '?')}
                                </div>
                                <div className="flex flex-col">
                                  <p className="font-medium text-slate-800 leading-tight">{u.name || 'No Name'}</p>
                                  <p className="text-xs text-slate-500">{u.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                                u.role === 'tutor' || u.role === 'tutor_pt' ? 'bg-blue-100 text-blue-700' : 
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {u.role === 'tutor_pt' ? 'Instructor (Part-Time)' : u.role === 'tutor' ? 'Instructor (Full-Time)' : u.role ? t(`common.${u.role}`) : t('common.student')}
                              </span>
                            </TableCell>
                            <TableCell>
                               <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${
                                  u.status === 'active' ? 'text-green-600' : 
                                  u.status === 'suspended' ? 'text-red-600' : 
                                  'text-slate-400'
                               }`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${
                                     u.status === 'active' ? 'bg-green-600' : 
                                     u.status === 'suspended' ? 'bg-red-600' : 
                                     'bg-slate-400'
                                  }`} />
                                  {u.status || 'inactive'}
                               </span>
                            </TableCell>
                            <TableCell className="text-xs text-slate-500">
                              {formatHkDate(u.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-indigo-600 cursor-pointer"
                                  onClick={() => navigate(`/admin/student/${u.id}`)}
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2 text-amber-600"
                                  onClick={() => handlePasswordReset(u.email)}
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-8 px-2"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setUserForm({
                                      name: u.name,
                                      email: u.email,
                                      role: u.role,
                                      status: u.status,
                                      phone: u.phone,
                                      remarks: u.remarks
                                    });
                                    setIsUserModalOpen(true);
                                  }}
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'logs' && (
             <Card>
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                 <div>
                   <CardTitle>System Logs</CardTitle>
                   <CardDescription>Security and audit trail (last 100 entries)</CardDescription>
                 </div>
                 <Button variant="outline" size="sm" onClick={() => handleExportCSV(auditLogs, 'audit_logs')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
               </CardHeader>
               <CardContent>
                  <Table className="min-w-[800px]">
                    <TableHeader>
                      <TableRow>
                        <TableHead>Timestamp</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>User Email</TableHead>
                        <TableHead>Resource</TableHead>
                        <TableHead>Details</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {auditLogs.map(l => (
                        <TableRow key={l.id}>
                          <TableCell className="text-xs whitespace-nowrap">{formatHkDate(l.createdAt, true)}</TableCell>
                          <TableCell>
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                               {l.action}
                             </span>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-slate-700">{l.userEmail}</TableCell>
                          <TableCell className="text-xs font-mono text-slate-500">{l.resource} / {l.resourceId?.slice(0, 6)}...</TableCell>
                          <TableCell className="text-xs text-slate-600 max-w-sm overflow-hidden text-ellipsis whitespace-nowrap" title={JSON.stringify(l.details)}>
                             {JSON.stringify(l.details)}
                          </TableCell>
                        </TableRow>
                      ))}
                      {auditLogs.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-slate-500">No logs found.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
               </CardContent>
             </Card>
          )}

          {activeTab === 'promotions' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2"><Sparkles className="w-6 h-6 text-indigo-500"/> Promotions & Discounts</h3>
                <Button onClick={() => {
                  setSelectedPromo(null);
                  setPromoForm({ name: '', code: '', type: 'code', discountType: 'fixed', discountValue: 0, status: 'active', applicableCourseIds: [], bundleCourse1: '', bundleCourse2: '', startDate: '', endDate: '', adminPassword: '' });
                  setIsPromoModalOpen(true);
                }} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 mr-2" /> Add Promotion
                </Button>
              </div>
              
              <Card>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Promotion Name</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Code / Conditions</TableHead>
                        <TableHead>Discount Value</TableHead>
                        <TableHead>Validity Period</TableHead>
                        <TableHead>Usage Count</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {promotions.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.name}</TableCell>
                          <TableCell className="capitalize">{p.type}</TableCell>
                          <TableCell>
                            {p.type === 'code' ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-mono bg-slate-100 text-slate-700">{p.code}</span>
                            ) : p.type === 'bundle' ? (
                                <span className="text-sm text-slate-600">Bundle (2 courses)</span>
                            ) : '-'}
                          </TableCell>
                          <TableCell>
                             {p.discountType === 'percentage' ? `${p.discountValue}%` : `HKD ${p.discountValue}`}
                          </TableCell>
                          <TableCell className="text-xs text-slate-600">
                             {p.startDate ? format(new Date(p.startDate), 'yyyy-MM-dd HH:mm') : 'Any time'} - {p.endDate ? format(new Date(p.endDate), 'yyyy-MM-dd HH:mm') : 'No expiry'}
                          </TableCell>
                          <TableCell>{p.usageCount || 0}</TableCell>
                          <TableCell>
                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${p.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>{p.status}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="text-indigo-600 hover:text-indigo-900"
                                onClick={() => {
                                   let b1 = '';
                                   let b2 = '';
                                   if (p.type === 'bundle' && p.conditions?.requiredCourseIds) {
                                       b1 = p.conditions.requiredCourseIds[0] || '';
                                       b2 = p.conditions.requiredCourseIds[1] || '';
                                   }
                                   setSelectedPromo(p);
                                   setPromoForm({ 
                                     ...p, 
                                     startDate: p.startDate ? p.startDate.split('T')[0] : '',
                                     endDate: p.endDate ? p.endDate.split('T')[0] : '',
                                     bundleCourse1: b1, 
                                     bundleCourse2: b2, 
                                     adminPassword: '' 
                                   });
                                   setIsPromoModalOpen(true);
                                }}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-900 hover:bg-red-50"
                                onClick={() => {
                                  setPromoToDelete(p);
                                  setIsDeletePromoModalOpen(true);
                                }}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                      {promotions.length === 0 && (
                        <TableRow><TableCell colSpan={7} className="text-center h-24 text-slate-500">No promotions configured.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle>School Settings</CardTitle>
                <CardDescription>Customize school information for invoices and receipts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">School Name</label>
                    <Input 
                      value={schoolInfo.name} 
                      onChange={e => setSchoolInfo({...schoolInfo, name: e.target.value})}
                      placeholder="e.g. Training Academy"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">School Logo</label>
                    <div className="flex items-center gap-4">
                      {schoolInfo.logo_url && (
                        <div className="w-10 h-10 rounded overflow-hidden shrink-0 bg-slate-100 border border-slate-200 flex items-center justify-center">
                          <img src={schoolInfo.logo_url} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                        </div>
                      )}
                      <div className="flex-1">
                        <Input 
                          type="file"
                          accept="image/*"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setSchoolInfo({...schoolInfo, logo_url: reader.result as string});
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Official Address</label>
                    <Input 
                      value={schoolInfo.address} 
                      onChange={e => setSchoolInfo({...schoolInfo, address: e.target.value})}
                      placeholder="Full address for invoices"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Contact Phone</label>
                    <Input 
                      value={schoolInfo.phone} 
                      onChange={e => setSchoolInfo({...schoolInfo, phone: e.target.value})}
                      placeholder="+852 XXXX XXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sales Email</label>
                    <Input 
                      value={schoolInfo.email || ''} 
                      onChange={e => setSchoolInfo({...schoolInfo, email: e.target.value})}
                      placeholder="sales@example.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Invoice Prefix</label>
                    <Input 
                      value={schoolInfo.invoice_prefix} 
                      onChange={e => setSchoolInfo({...schoolInfo, invoice_prefix: e.target.value})}
                      placeholder="e.g. INV"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Invoice Terms & Conditions</label>
                  <Textarea 
                    value={schoolInfo.terms_conditions} 
                    onChange={e => setSchoolInfo({...schoolInfo, terms_conditions: e.target.value})}
                    className="min-h-[100px]"
                    placeholder="Enter center fee terms, policies, etc."
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Rooms & Capacity (comma separated)</label>
                  <Textarea 
                    value={schoolInfo.rooms || ''} 
                    onChange={e => setSchoolInfo({...schoolInfo, rooms: e.target.value})}
                    className="min-h-[100px]"
                    placeholder="e.g. Room 101 (20), Room 102 (30), Main Hall (100)"
                  />
                  <p className="text-xs text-slate-500">List of rooms available for classes with capacity. Separate by commas (e.g. Room A (20), Room B (30)).</p>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveSchoolInfo} className="bg-blue-600 hover:bg-blue-700">
                    Save Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

        </main>
      </div>

      {/* User Create/Edit Modal */}
      <Dialog open={isUserModalOpen} onOpenChange={setIsUserModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Create New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? `Updating profile for ${selectedUser.name}` : 'Add a new user to the system. They will need to set their password via email.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={selectedUser ? handleEditUser : handleCreateUser} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500">Full Name</label>
                <Input 
                  required
                  placeholder="John Doe" 
                  value={userForm.name || ''} 
                  onChange={e => setUserForm({...userForm, name: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500">Email Address</label>
                <Input 
                  required
                  type="email"
                  disabled={!!selectedUser}
                  placeholder="john@example.com" 
                  value={userForm.email || ''} 
                  onChange={e => setUserForm({...userForm, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Role</label>
                <select 
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                  value={userForm.role || 'student'}
                  onChange={e => setUserForm({...userForm, role: e.target.value as UserRole})}
                >
                  <option value="student">Student</option>
                  <option value="tutor">Instructor (Full-Time)</option>
                  <option value="tutor_pt">Instructor (Part-Time)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-500">Status</label>
                <select 
                  className="w-full h-9 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm shadow-sm"
                  value={userForm.status || 'active'}
                  onChange={e => setUserForm({...userForm, status: e.target.value as UserStatus})}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500">Phone Number</label>
                <Input 
                  placeholder="+852 XXXX XXXX" 
                  value={userForm.phone || ''} 
                  onChange={e => setUserForm({...userForm, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold uppercase text-slate-500">Admin Remarks</label>
                <Textarea 
                  placeholder="Internal notes about this user..." 
                  value={userForm.remarks || ''} 
                  onChange={e => setUserForm({...userForm, remarks: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsUserModalOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (selectedUser ? 'Save Changes' : 'Create User')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* User Detail View Modal */}
      <Dialog open={isUserViewModalOpen} onOpenChange={setIsUserViewModalOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedUser && (
            <div className="space-y-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                    {selectedUser.name ? selectedUser.name[0] : selectedUser.email[0].toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{selectedUser.name}</h2>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' : 
                        selectedUser.role === 'tutor' || selectedUser.role === 'tutor_pt' ? 'bg-blue-100 text-blue-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedUser.role === 'tutor_pt' ? 'Instructor (Part-Time)' : selectedUser.role === 'tutor' ? 'Instructor (Full-Time)' : selectedUser.role}
                      </span>
                      <span className={`flex items-center gap-1 text-[10px] font-bold uppercase ${
                        selectedUser.status === 'active' ? 'text-green-600' : 'text-slate-400'
                      }`}>
                        <div className={`w-1 h-1 rounded-full ${selectedUser.status === 'active' ? 'bg-green-600' : 'bg-slate-400'}`} />
                        {selectedUser.status}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-500 uppercase font-bold">User ID</p>
                  <p className="text-sm font-mono text-slate-700">{selectedUser.id}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4 md:col-span-1">
                  <Card>
                    <CardContent className="p-4 space-y-4">
                      <div className="flex items-center gap-3 text-slate-600">
                        <Mail className="w-4 h-4" />
                        <span className="text-sm">{selectedUser.email}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span className="text-sm">{selectedUser.phone || 'No phone set'}</span>
                      </div>
                      <div className="flex items-center gap-3 text-slate-600">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">Joined {formatHkDate(selectedUser.createdAt)}</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {selectedUser.remarks && (
                    <Card className="bg-amber-50/50 border-amber-100">
                      <CardContent className="p-4">
                        <p className="text-xs font-bold text-amber-800 uppercase flex items-center gap-2">
                           <ShieldAlert className="w-3 h-3" /> Admin Notes
                        </p>
                        <p className="text-sm text-amber-900 mt-2 italic">"{selectedUser.remarks}"</p>
                      </CardContent>
                    </Card>
                  )}
                </div>

                <div className="md:col-span-2">
                  {['tutor','tutor_pt'].includes(selectedUser.role || '') ? (
                    <div className="space-y-6">
                       <h3 className="text-lg font-bold flex items-center gap-2">
                         <GraduationCap className="w-5 h-5 text-indigo-600" /> Instructor Profile
                       </h3>
                       
                       <div className="grid grid-cols-1 gap-6">
                          {/* Expertise Section */}
                          <Card>
                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Briefcase className="w-4 h-4" /> Expertise Areas
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                              <div className="flex flex-wrap gap-2">
                                {expertise.filter(e => e.tutorId === selectedUser.id).map(exp => (
                                  <div key={exp.id} className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1 w-full sm:w-[calc(50%-0.5rem)]">
                                    <div className="flex justify-between items-start">
                                      <p className="font-bold text-slate-800 text-sm">{exp.expertiseArea}</p>
                                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        exp.skillLevel === 'expert' ? 'bg-indigo-100 text-indigo-700' :
                                        exp.skillLevel === 'advanced' ? 'bg-blue-100 text-blue-700' :
                                        'bg-slate-100 text-slate-600'
                                      }`}>
                                        {exp.skillLevel}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-500">{exp.yearsOfExperience} yrs exp • {exp.preferredCourseLevel} level</p>
                                  </div>
                                ))}
                                {expertise.filter(e => e.tutorId === selectedUser.id).length === 0 && (
                                  <p className="text-xs text-slate-400 italic">No expertise areas recorded.</p>
                                )}
                              </div>
                            </CardContent>
                          </Card>

                          {/* Certifications Section */}
                          <Card>
                            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <Award className="w-4 h-4" /> Certifications
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 scroll-m-1">
                               <div className="space-y-3">
                                 {certs.filter(c => c.tutorId === selectedUser.id).map(cert => (
                                   <div key={cert.id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                                     <div className="flex items-center gap-3">
                                       <div className="w-8 h-8 rounded bg-white border flex items-center justify-center text-indigo-600">
                                         <Award className="w-5 h-5" />
                                       </div>
                                       <div>
                                         <p className="text-sm font-bold text-slate-800">{cert.certificationName}</p>
                                         <p className="text-[10px] text-slate-500 uppercase">{cert.issuingOrganization} • {cert.issueDate}</p>
                                       </div>
                                     </div>
                                     <div className="flex items-center gap-2">
                                       <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                         cert.status === 'active' ? 'bg-green-100 text-green-700' :
                                         cert.status === 'expired' ? 'bg-red-100 text-red-700' :
                                         'bg-amber-100 text-amber-700'
                                       }`}>
                                         {cert.status}
                                       </span>
                                       {cert.certificateFileUrl && (
                                         <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => window.open(cert.certificateFileUrl)}>
                                           <Download className="w-3.5 h-3.5" />
                                         </Button>
                                       )}
                                     </div>
                                   </div>
                                 ))}
                                 {certs.filter(c => c.tutorId === selectedUser.id).length === 0 && (
                                   <p className="text-xs text-slate-400 italic">No certifications recorded.</p>
                                 )}
                               </div>
                            </CardContent>
                          </Card>

                          {/* Workload Section */}
                          <Card>
                            <CardHeader className="py-3 px-4">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" /> Workload Summary
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4">
                               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                                 <div className="p-3 bg-slate-50 rounded-lg">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase">Courses</p>
                                   <p className="text-lg font-bold text-slate-900">{sessions.filter(s => s.tutorId === selectedUser.id).length}</p>
                                 </div>
                                 <div className="p-3 bg-slate-50 rounded-lg">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase">Courses</p>
                                   <p className="text-lg font-bold text-slate-900">{courses.filter(c => c.tutorId === selectedUser.id).length}</p>
                                 </div>
                                 <div className="p-3 bg-slate-50 rounded-lg">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase">Avg Rating</p>
                                   <p className="text-lg font-bold text-slate-900">
                                     {(feedbacks.filter(f => courses.find(c => c.id === f.courseId && c.tutorId === selectedUser.id)).reduce((acc, curr) => acc + curr.rating, 0) / (feedbacks.filter(f => courses.find(c => c.id === f.courseId && c.tutorId === selectedUser.id)).length || 1)).toFixed(1)}
                                   </p>
                                 </div>
                                 <div className="p-3 bg-slate-50 rounded-lg">
                                   <p className="text-[10px] font-bold text-slate-500 uppercase">Hours (MTD)</p>
                                   <p className="text-lg font-bold text-slate-900">
                                     {hours.filter(h => h.tutorId === selectedUser.id && h.status === 'approved').reduce((acc, curr) => acc + (curr.hours || 0), 0)}
                                   </p>
                                 </div>
                                 <div className="p-3 bg-indigo-50 rounded-lg">
                                   <p className="text-[10px] font-bold text-indigo-500 uppercase">Est. Payout</p>
                                   <p className="text-lg font-bold text-indigo-700">
                                     ${(hours.filter(h => h.tutorId === selectedUser.id && h.status === 'approved').reduce((acc, curr) => acc + (curr.hours || 0), 0) * (selectedUser.tutorProfile?.hourlyRate || 150)).toLocaleString()}
                                   </p>
                                 </div>
                               </div>
                            </CardContent>
                          </Card>

                          {/* MTM Report Section */}
                          <Card>
                            <CardHeader className="py-3 px-4">
                              <CardTitle className="text-sm font-bold flex items-center gap-2">
                                <FileText className="w-4 h-4 text-emerald-600" /> Annual MTM Teaching Hours Report
                              </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 flex items-center gap-4">
                              <select 
                                className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white font-medium text-slate-700" 
                                value={mtmYear} 
                                onChange={e => setMtmYear(e.target.value)}
                              >
                                {(() => {
                                   const y = new Date().getFullYear();
                                   return [y, y-1, y-2, y-3].map(yr => (
                                     <option key={yr} value={yr.toString()}>{yr}</option>
                                   ));
                                })()}
                              </select>
                              <Button size="sm" onClick={() => generateMTMReport(selectedUser.id, selectedUser.name || 'Instructor', mtmYear)} className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md">
                                <Download className="w-3.5 h-3.5" /> Export MTM PDF
                              </Button>
                            </CardContent>
                          </Card>
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <h3 className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-indigo-600" /> Student Profile
                      </h3>
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold">Enrolled Courses</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {regs.filter(r => r.studentId === selectedUser.id).map(reg => {
                              const course = courses.find(c => c.id === reg.courseId);
                              return (
                                <div key={reg.id} className="flex items-center justify-between p-2 border rounded hover:bg-slate-50">
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">{course?.title || 'Unknown Course'}</span>
                                    <span className="text-[10px] text-slate-400 capitalize">{reg.status} • {reg.payment_status}</span>
                                  </div>
                                  <Link to={`/admin/finances?registration=${reg.id}`} className="text-indigo-600 hover:underline text-xs">
                                    View Payment
                                  </Link>
                                </div>
                              );
                            })}
                            {regs.filter(r => r.studentId === selectedUser.id).length === 0 && (
                              <p className="text-xs text-slate-400 italic">No course payments found.</p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsUserViewModalOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Session Modal */}
      <Dialog open={sessionModalOpen} onOpenChange={setSessionModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Edit Course Intake</DialogTitle>
            <DialogDescription>Modify specific instance details, scheduling, and quotas</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateSession} className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-left">
            {selectedSession && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Date</label>
                    <Input 
                      type="date"
                      value={selectedSession.startDate} 
                      onChange={e => {
                        const val = e.target.value;
                        const v = isWeekendOrHoliday(val);
                        if (v.isInvalid) {
                          toast.error(v.reason);
                          return;
                        }
                        if (selectedSession.endDate && val > selectedSession.endDate) {
                          toast.error("Start date cannot be later than end date");
                          return;
                        }
                        setSelectedSession({...selectedSession, startDate: val});
                      }}
                      className="h-10 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date</label>
                    <Input 
                      type="date"
                      value={selectedSession.endDate} 
                      onChange={e => {
                        const val = e.target.value;
                        const v = isWeekendOrHoliday(val);
                        if (v.isInvalid) {
                          toast.error(v.reason);
                          return;
                        }
                        if (selectedSession.startDate && val < selectedSession.startDate) {
                          toast.error("End date cannot be earlier than start date");
                          return;
                        }
                        setSelectedSession({...selectedSession, endDate: val});
                      }}
                      className="h-10 border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivery Mode</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                      value={selectedSession.deliveryMode}
                      onChange={e => setSelectedSession({...selectedSession, deliveryMode: e.target.value})}
                    >
                      <option value="onsite">On-site</option>
                      <option value="online">Online</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Lead Instructor</label>
                    <Popover open={isTutorPopoverOpen} onOpenChange={setIsTutorPopoverOpen}>
                      <PopoverTrigger 
                        render={
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={isTutorPopoverOpen}
                            className="w-full justify-between h-10 border-slate-200 font-normal"
                          >
                            {selectedSession.tutorId
                              ? tutors.find((t) => t.id === selectedSession.tutorId)?.name
                              : "-- Unassigned --"}
                            <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 -rotate-90" />
                          </Button>
                        }
                      />
                      <PopoverContent className="w-[--anchor-width] p-0" align="start">
                        <Command>
                          <CommandInput placeholder="Search instructor name..." />
                          <CommandList>
                            <CommandEmpty>No instructor found.</CommandEmpty>
                            <CommandGroup>
                              {tutors.map((t) => (
                                <CommandItem
                                  key={t.id}
                                  value={t.name}
                                  onSelect={() => {
                                    if (!selectedSession.startDate || !selectedSession.endDate) {
                                      toast.error(<span className="font-bold text-red-600">Please enter Start Date and End Date first before selecting an instructor.</span>);
                                      return;
                                    }
                                    
                                    const hasOverlap = sessions.some((s: any) => 
                                      s.id !== selectedSession.id &&
                                      s.tutorId === t.id && 
                                      s.startDate && s.endDate &&
                                      s.startDate <= selectedSession.endDate && 
                                      s.endDate >= selectedSession.startDate &&
                                      s.sessionStatus !== 'cancelled'
                                    );

                                    if (hasOverlap) {
                                      toast.error(<span className="font-bold text-red-600">This instructor is already assigned to an overlapping course intake! Please choose another instructor or different dates.</span>);
                                      return;
                                    }

                                    setSelectedSession({
                                      ...selectedSession,
                                      tutorId: t.id
                                    });
                                    setIsTutorPopoverOpen(false);
                                  }}
                                >
                                  <span className="text-[13px]">{t.name}</span>
                                  <CheckCircle
                                    className={cn(
                                      "ml-auto h-4 w-4 text-blue-600",
                                      selectedSession.tutorId === t.id ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {(selectedSession.deliveryMode === 'online' || selectedSession.deliveryMode === 'hybrid') && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Zoom / Teams Weblink</label>
                    <Input 
                      placeholder="https://zoom.us/j/..." 
                      value={selectedSession.meetingLink} 
                      onChange={e => setSelectedSession({...selectedSession, meetingLink: e.target.value})}
                      className="h-10 bg-blue-50/30 border-blue-100"
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Early Bird Price (HKD)</label>
                    <Input 
                      type="number"
                      value={isNaN(selectedSession.earlyBirdPrice) ? '' : selectedSession.earlyBirdPrice} 
                      onChange={e => setSelectedSession({...selectedSession, earlyBirdPrice: parseFloat(e.target.value) || 0})}
                      className="h-10 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard Price (HKD)</label>
                    <Input 
                      type="number"
                      value={isNaN(selectedSession.standardPrice) ? '' : selectedSession.standardPrice} 
                      onChange={e => setSelectedSession({...selectedSession, standardPrice: parseFloat(e.target.value) || 0, price: parseFloat(e.target.value) || 0})}
                      className="h-10 border-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Enrollment Status</label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                      value={selectedSession.sessionStatus}
                      onChange={e => setSelectedSession({...selectedSession, sessionStatus: e.target.value})}
                    >
                      <option value="open">Open</option>
                      <option value="full">Full</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Student Quota</label>
                    <Input 
                      type="number"
                      value={selectedSession.quota} 
                      onChange={e => setSelectedSession({...selectedSession, quota: parseInt(e.target.value) || 0})}
                      className="h-10 border-slate-200"
                    />
                  </div>
                </div>

                {(selectedSession.sessionStatus === 'full' || selectedSession.sessionStatus === 'completed') && selectedSession.deliveryMode !== 'online' && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                      Choose Room <span className="text-[10px] font-normal text-slate-400 capitalize">(Required for {selectedSession.sessionStatus} courses)</span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-blue-200 bg-blue-50/30 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                      value={selectedSession.room || ''}
                      onChange={e => setSelectedSession({...selectedSession, room: e.target.value})}
                    >
                      <option value="">-- Select a Room --</option>
                      {schoolInfo.rooms?.split(',').map(r => r.trim()).filter(Boolean).map((room, idx) => (
                        <option key={idx} value={room}>{room}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
            <DialogFooter className="pt-6 border-t border-slate-100 flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setSessionModalOpen(false)} className="text-slate-500 font-bold text-xs uppercase tracking-widest">Cancel</Button>
              <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest">
                {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600 font-bold">
              <ShieldAlert className="w-5 h-5" /> 
              {itemToDelete?.type === 'course' ? 'Delete Course Template' 
                : itemToDelete?.type === 'session' ? 'Delete Course Room' 
                : itemToDelete?.type === 'lesson' ? 'Delete Lesson'
                : 'Delete Registration'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              <span className="block mb-2 font-semibold text-slate-800 break-words">
                Deleting: {itemToDelete?.name}
              </span>
              {itemToDelete?.type === 'course' 
                ? "Are you sure you want to delete this course template? This will not affect existing sessions but the template will be permanently removed."
                : itemToDelete?.type === 'session' 
                  ? "Are you sure you want to delete this session? All scheduled lessons and data for this run will be permanently removed."
                  : itemToDelete?.type === 'lesson'
                    ? "Are you sure you want to delete this lesson? This action cannot be undone."
                    : "Are you sure you want to delete this payment record? This action cannot be undone."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-2 sm:justify-end">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
            <Button variant="destructive" className="flex-1 sm:flex-none shadow-sm" onClick={handleDelete} disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={courseCreationModalOpen} onOpenChange={setCourseCreationModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Create Course Template</DialogTitle>
            <DialogDescription>Define the master definition for a new curriculum component</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Code</label>
                  <Input 
                    placeholder="e.g. AZ-900" 
                    value={newCourse.courseCode} 
                    onChange={e => setNewCourse({...newCourse, courseCode: e.target.value})}
                    className="h-10 bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Category</label>
                  <select 
                    value={newCourse.category || ''} 
                    onChange={e => setNewCourse({...newCourse, category: e.target.value})} 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                  >
                    <option value="">Select Category</option>
                    <option value="Microsoft">Microsoft</option>
                    <option value="AWS">AWS</option>
                    <option value="Technology">Technology</option>
                    <option value="Business">Business</option>
                    <option value="Design">Design</option>
                  </select>
                </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supporting Documents (PDF)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 h-[140px] flex flex-col items-center justify-center text-center bg-slate-50/30 hover:bg-slate-50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Course Outline Upload</p>
                    <label className="mt-3 cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                      SELECT FILE
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             setNewCourse({...newCourse, outlineName: file.name});
                           }
                        }} 
                      />
                    </label>
                    {newCourse.outlineName && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <FileText className="w-3 h-3" />
                        {newCourse.outlineName}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Course Title</label>
                  <textarea 
                    placeholder="Enter full descriptive title..." 
                    value={newCourse.title} 
                    onChange={e => setNewCourse({...newCourse, title: e.target.value, certName: e.target.value})}
                    className="w-full min-h-[80px] rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Framework & Modules</label>
                  <textarea 
                    value={newCourse.description}
                    onChange={e => setNewCourse({...newCourse, description: e.target.value})}
                    placeholder="Enter detailed course framework..."
                    className="w-full min-h-[140px] rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Certificate Display Name</label>
                  <Input 
                    placeholder="Name as seen on certificate" 
                    value={newCourse.certName} 
                    onChange={e => setNewCourse({...newCourse, certName: e.target.value})}
                    className="h-10 bg-slate-50/50 border-slate-200"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Level</label>
                <select 
                  value={newCourse.level} 
                  onChange={e => setNewCourse({...newCourse, level: e.target.value})} 
                  className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                >
                  <option value="">Select Level</option>
                  <option value="Fundamental">Fundamental</option>
                  <option value="Beginner">Beginner</option>
                  <option value="Intermediate">Intermediate</option>
                  <option value="Advanced">Advanced</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration (Days)</label>
                <Input 
                  type="number"
                  placeholder="Days" 
                  value={newCourse.day} 
                  onChange={e => setNewCourse({...newCourse, day: e.target.value})}
                  className="h-10 bg-slate-50/50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Early Bird (HK$)</label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={newCourse.earlyBirdPrice || ''} 
                  onChange={e => setNewCourse({...newCourse, earlyBirdPrice: parseFloat(e.target.value) || 0})}
                  className="h-10 bg-slate-50/50 border-slate-200"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard (HK$)</label>
                <Input 
                  type="number"
                  placeholder="0.00" 
                  value={newCourse.standardPrice || ''} 
                  onChange={e => setNewCourse({...newCourse, standardPrice: parseFloat(e.target.value) || 0})}
                  className="h-10 bg-slate-50/50 border-slate-200"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-slate-50/50 rounded-b-lg border-t border-slate-100 flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setCourseCreationModalOpen(false)} className="text-slate-500 font-bold text-xs uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleCreateCourse} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={courseModalOpen} onOpenChange={setCourseModalOpen}>
        <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">Edit Course Template</DialogTitle>
            <DialogDescription>Refine the master definition for this course template</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateCourse} className="flex-1 overflow-y-auto px-6 py-6 space-y-8">
            {selectedCourse && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Code</label>
                      <Input 
                        value={selectedCourse.courseCode || ''} 
                        onChange={e => setSelectedCourse({...selectedCourse, courseCode: e.target.value})}
                        className="h-10 bg-slate-50/50 border-slate-200"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Category</label>
                      <select 
                        value={selectedCourse.category || ''} 
                        onChange={e => setSelectedCourse({...selectedCourse, category: e.target.value})} 
                        className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all"
                      >
                        <option value="">Select Category</option>
                        <option value="Microsoft">Microsoft</option>
                        <option value="AWS">AWS</option>
                        <option value="Technology">Technology</option>
                        <option value="Business">Business</option>
                        <option value="Design">Design</option>
                      </select>
                    </div>

                <div className="space-y-1.5 mt-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Supporting Documents (PDF)</label>
                  <div className="border-2 border-dashed border-slate-200 rounded-lg p-6 h-[140px] flex flex-col items-center justify-center text-center bg-slate-50/30 hover:bg-slate-50 transition-colors">
                    <FileText className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-xs font-semibold text-slate-600">Course Outline Upload</p>
                    <label className="mt-3 cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-sm transition-all active:scale-95">
                      SELECT FILE
                      <input 
                        type="file" 
                        accept=".pdf" 
                        className="hidden" 
                        onChange={(e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             setSelectedCourse({...selectedCourse, outlineName: file.name});
                           }
                        }} 
                      />
                    </label>
                    {selectedCourse.outlineName && (
                      <div className="mt-3 flex items-center gap-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                        <FileText className="w-3 h-3" />
                        {selectedCourse.outlineName}
                      </div>
                    )}
                  </div>
                </div>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Course Title</label>
                      <textarea 
                        value={selectedCourse.title || ''} 
                        onChange={e => setSelectedCourse({...selectedCourse, title: e.target.value, certName: e.target.value})}
                        className="w-full min-h-[80px] rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Course Framework & Modules</label>
                      <textarea 
                        value={selectedCourse.description || ''}
                        onChange={e => setSelectedCourse({...selectedCourse, description: e.target.value})}
                        placeholder="Enter detailed course framework..."
                        className="w-full min-h-[140px] rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition-all resize-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Certificate Display Name</label>
                      <Input 
                        value={selectedCourse.certName || ''} 
                        onChange={e => setSelectedCourse({...selectedCourse, certName: e.target.value})}
                        className="h-10 bg-slate-50/50 border-slate-200"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Level</label>
                    <select 
                      value={selectedCourse.level || ''} 
                      onChange={e => setSelectedCourse({...selectedCourse, level: e.target.value})} 
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                    >
                      <option value="">Select Level</option>
                      <option value="Fundamental">Fundamental</option>
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Duration (Days)</label>
                    <Input 
                      type="number"
                      value={selectedCourse.day || ''} 
                      onChange={e => setSelectedCourse({...selectedCourse, day: e.target.value})}
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Early Bird (HK$)</label>
                    <Input 
                      type="number"
                      value={selectedCourse.earlyBirdPrice || ''} 
                      onChange={e => setSelectedCourse({...selectedCourse, earlyBirdPrice: parseFloat(e.target.value) || 0})}
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard (HK$)</label>
                    <Input 
                      type="number"
                      value={selectedCourse.standardPrice || 0} 
                      onChange={e => setSelectedCourse({...selectedCourse, standardPrice: parseFloat(e.target.value) || 0})}
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
                  <div className="flex gap-3">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="text-xs text-amber-800 leading-relaxed">
                      <strong>Audit Notice:</strong> Changes to course templates will be logged. Modifying prices or codes will not automatically update existing intakes to preserve historical billing integrity.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </form>

          <DialogFooter className="p-6 bg-slate-50/50 rounded-b-lg border-t border-slate-100 flex gap-2">
            <Button type="button" variant="ghost" onClick={() => setCourseModalOpen(false)} className="text-slate-500 font-bold text-xs uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleUpdateCourse} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Template Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionCreationModalOpen} onOpenChange={setSessionCreationModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
          <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-800">
              {selectedTemplateForIntake ? `New Intake: ${selectedTemplateForIntake.title}` : 'Create Course'}
            </DialogTitle>
            <DialogDescription>Schedule a specific instance of a course template</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            {(() => {
              const currentCourseTemplate = selectedTemplateForIntake || courses.find(c => c.id === newSession.courseId);
              return (
                <>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {!selectedTemplateForIntake && (
                      <div className="space-y-1.5 col-span-2">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Target Course Template</label>
                        <Popover open={isCoursePopoverOpen} onOpenChange={setIsCoursePopoverOpen}>
                          <PopoverTrigger 
                            render={
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={isCoursePopoverOpen}
                                className="w-full justify-between h-10 bg-slate-50/50 border-slate-200 font-normal"
                              >
                                {newSession.courseId
                                  ? courses.find((c) => c.id === newSession.courseId)?.title
                                  : "-- Search & Choose Template --"}
                                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                              </Button>
                            }
                          />
                          <PopoverContent className="w-[--anchor-width] p-0" align="start">
                            <Command>
                              <CommandInput placeholder="Search course title or code..." />
                              <CommandList>
                                <CommandEmpty>No matching course found.</CommandEmpty>
                                <CommandGroup>
                                  {courses.map((c) => (
                                    <CommandItem
                                      key={c.id}
                                      value={`${c.title} ${c.courseCode}`}
                                      onSelect={() => {
                                        setNewSession({
                                          ...newSession,
                                          courseId: c.id,
                                          earlyBirdPrice: c.earlyBirdPrice || 0,
                                          standardPrice: c.standardPrice || 0
                                        });
                                        setIsCoursePopoverOpen(false);
                                      }}
                                    >
                                      <div className="flex flex-col">
                                        <span className="font-medium text-[13px]">{c.title}</span>
                                        <span className="text-[10px] text-slate-400 font-mono tracking-tight">{c.courseCode}</span>
                                      </div>
                                      <CheckCircle
                                        className={cn(
                                          "ml-auto h-4 w-4 text-blue-600",
                                          newSession.courseId === c.id ? "opacity-100" : "opacity-0"
                                        )}
                                      />
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </CommandList>
                            </Command>
                          </PopoverContent>
                        </Popover>
                      </div>
                    )}
                    <div className="space-y-1.5 col-span-2">
                       {currentCourseTemplate?.day && (
                         <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 mb-2 font-medium flex items-center gap-2">
                           <Clock className="w-4 h-4" /> Template Duration: {currentCourseTemplate.day} Days
                         </div>
                       )}
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Start Date</label>

                  <Input 
                    type="date" 
                    value={newSession.startDate} 
                    onChange={e => {
                      const val = e.target.value;
                      const v = isWeekendOrHoliday(val);
                      if (v.isInvalid) return toast.error(v.reason);
                      if (newSession.endDate && val > newSession.endDate) return toast.error("Start date cannot be later than end date");
                      setNewSession({...newSession, startDate: val});
                    }}
                    className="h-10 bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">End Date</label>
                  <Input 
                    type="date" 
                    value={newSession.endDate} 
                    onChange={e => {
                      const val = e.target.value;
                      const v = isWeekendOrHoliday(val);
                      if (v.isInvalid) return toast.error(v.reason);
                      if (newSession.startDate && val < newSession.startDate) return toast.error("End date cannot be earlier than start date");
                      setNewSession({...newSession, endDate: val});
                    }}
                    className="h-10 bg-slate-50/50 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Delivery Mode</label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                    value={newSession.deliveryMode}
                    onChange={e => setNewSession({...newSession, deliveryMode: e.target.value})}
                  >
                    <option value="onsite">On-site</option>
                    <option value="online">Online (Zoom/Teams)</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Instructor</label>
                  <Popover open={isTutorPopoverOpen} onOpenChange={setIsTutorPopoverOpen}>
                    <PopoverTrigger 
                      render={
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isTutorPopoverOpen}
                          className="w-full justify-between h-10 bg-slate-50/50 border-slate-200 font-normal"
                        >
                          {newSession.tutorId
                            ? tutors.find((t) => t.id === newSession.tutorId)?.name
                            : "-- Assign Instructor --"}
                          <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 -rotate-90" />
                        </Button>
                      }
                    />
                    <PopoverContent className="w-[--anchor-width] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search instructor name..." />
                        <CommandList>
                          <CommandEmpty>No instructor found.</CommandEmpty>
                          <CommandGroup>
                            {tutors.map((t) => (
                              <CommandItem
                                key={t.id}
                                value={t.name}
                                onSelect={() => {
                                  if (!newSession.startDate || !newSession.endDate) {
                                    toast.error(<span className="font-bold text-red-600">Please enter Start Date and End Date first before selecting an instructor.</span>);
                                    return;
                                  }

                                  const hasOverlap = sessions.some((s: any) => 
                                    s.tutorId === t.id && 
                                    s.startDate && s.endDate &&
                                    s.startDate <= newSession.endDate && 
                                    s.endDate >= newSession.startDate &&
                                    s.sessionStatus !== 'cancelled'
                                  );

                                  if (hasOverlap) {
                                    toast.error(<span className="font-bold text-red-600">This instructor is already assigned to an overlapping course intake! Please choose another instructor or different dates.</span>);
                                    return;
                                  }

                                  setNewSession({
                                    ...newSession,
                                    tutorId: t.id
                                  });
                                  setIsTutorPopoverOpen(false);
                                }}
                              >
                                <span className="text-[13px]">{t.name}</span>
                                <CheckCircle
                                  className={cn(
                                    "ml-auto h-4 w-4 text-blue-600",
                                    newSession.tutorId === t.id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {(newSession.deliveryMode === 'online' || newSession.deliveryMode === 'hybrid') && (
                  <div className="space-y-1.5 col-span-2">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Zoom / Teams Weblink</label>
                    <Input 
                      placeholder="https://zoom.us/j/..." 
                      value={newSession.meetingLink} 
                      onChange={e => setNewSession({...newSession, meetingLink: e.target.value})}
                      className="h-10 bg-blue-50/30 border-blue-100"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Quota</label>
                  <Input type="number" value={isNaN(newSession.quota) ? '' : newSession.quota} onChange={e => setNewSession({...newSession, quota: parseInt(e.target.value) || 0})} className="h-10 bg-slate-50/50 border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Early Bird Price (HKD)</label>
                  <Input type="number" value={isNaN(newSession.earlyBirdPrice) ? '' : newSession.earlyBirdPrice} onChange={e => setNewSession({...newSession, earlyBirdPrice: parseFloat(e.target.value) || 0})} className="h-10 bg-slate-50/50 border-slate-200" />
                  {currentCourseTemplate?.earlyBirdPrice ? <p className="text-[9px] text-slate-400">Template Base: ${currentCourseTemplate.earlyBirdPrice}</p> : null}
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Standard Price (HKD)</label>
                  <Input type="number" value={isNaN(newSession.standardPrice) ? '' : newSession.standardPrice} onChange={e => setNewSession({...newSession, standardPrice: parseFloat(e.target.value) || 0})} className="h-10 bg-slate-50/50 border-slate-200" />
                  {currentCourseTemplate?.standardPrice ? <p className="text-[9px] text-slate-400">Template Base: ${currentCourseTemplate.standardPrice}</p> : null}
                </div>
             </div>
            </>
          );
        })()}
      </div>

          <DialogFooter className="p-6 bg-slate-50/50 rounded-b-lg border-t border-slate-100 flex gap-2">
            <Button type="button" variant="ghost" onClick={() => { setSessionCreationModalOpen(false); setSelectedTemplateForIntake(null); }} className="text-slate-500 font-bold text-xs uppercase tracking-widest">Cancel</Button>
            <Button onClick={handleCreateSession} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest">
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Start Intake
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isCertModalOpen} onOpenChange={setIsCertModalOpen}>
        <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
          <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
            <div className="relative z-10">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                  <div className="p-2 bg-yellow-400 rounded-lg text-slate-900 shadow-lg shadow-yellow-400/20">
                    <Award className="w-6 h-6" /> 
                  </div>
                  Certificate Management
                </DialogTitle>
                <DialogDescription className="text-slate-400 font-medium text-sm mt-2">
                  Session: <span className="text-white font-bold">{selectedSessionCert?.sessionName}</span> • Course: <span className="text-white font-bold">{courses.find(c => c.id === selectedSessionCert?.courseId)?.title}</span>
                </DialogDescription>
              </DialogHeader>
            </div>
            {/* Background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl mr-10 mb-[-10px]"></div>
          </div>
          
          <div className="p-8">
            {isCertLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                  <Sparkles className="w-4 h-4 text-yellow-500 absolute top-0 right-0 animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-slate-800 font-bold text-lg">Calculating Attendance Rates</p>
                  <p className="text-slate-400 text-sm italic">Verifying student qualification thresholds...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:bg-white group">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors"><CheckCircle className="w-4 h-4"/></div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lessons Completed</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{lessons.filter(l => l.sessionId === selectedSessionCert?.id && l.lessonStatus === 'completed').length}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 italic">Total sessions recorded</p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:bg-white group">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors"><Users className="w-4 h-4"/></div>
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Students</p>
                    </div>
                    <p className="text-3xl font-black text-slate-800 tracking-tighter">{sessionStudentsData.length}</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-1 italic">Verified registrations</p>
                  </div>
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 shadow-sm transition-all hover:shadow-md hover:bg-white group border-l-4 border-l-amber-400">
                    <div className="flex items-center gap-3 mb-2">
                       <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-colors"><ShieldCheck className="w-4 h-4"/></div>
                       <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">Passing Criteria</p>
                    </div>
                    <p className="text-3xl font-black text-amber-900 tracking-tighter">80%</p>
                    <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-tight">Minimum Attendance</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    Enrolled Student Roster
                    <div className="h-[1px] flex-1 bg-slate-100"></div>
                  </h4>
                  <div className="border border-slate-100 rounded-xl overflow-hidden bg-white shadow-sm">
                    <Table>
                      <TableHeader className="bg-slate-50/50">
                        <TableRow className="hover:bg-transparent border-slate-100">
                          <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Student Identity</TableHead>
                          <TableHead className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sessionStudentsData.map(student => {
                          return (
                            <TableRow key={student.id} className="border-slate-50 hover:bg-slate-50/30 transition-colors">
                              <TableCell className="px-6 py-4">
                                <div className="font-bold text-slate-800">{student.studentName}</div>
                                <div className="text-[10px] text-slate-400 font-mono italic">{student.studentEmail}</div>
                              </TableCell>
                              <TableCell className="px-6 py-4 text-right">
                                <div className="flex justify-end gap-2">
                                  {(['am', 'pm'] as const).map(type => {
                                    const isConfirmed = student[`${type}Confirmed`];
                                    return (
                                      <Button
                                        key={type}
                                        size="sm"
                                        onClick={() => handleToggleAttendanceConfirm(student.id, type, isConfirmed)}
                                        className={`h-8 px-3 text-[10px] font-black uppercase tracking-wider transition-all ${
                                          isConfirmed 
                                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                                            : 'bg-white border border-slate-200 hover:bg-slate-50 text-slate-500 shadow-none'
                                        }`}
                                      >
                                        {isConfirmed && <CheckCircle className="w-3 h-3 mr-1" />}
                                        {type} CONFIRM
                                      </Button>
                                    );
                                  })}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsCertModalOpen(false)} className="font-bold text-xs uppercase tracking-[0.2em] text-slate-500">Close Manager</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isAttendanceModalOpen} onOpenChange={setIsAttendanceModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Mark Attendance</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              {selectedLessonForAttendance?.lessonTitle} ({selectedLessonForAttendance?.lessonDate})
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-2">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-xs">Student</TableHead>
                  <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-xs">Email</TableHead>
                  <TableHead className="text-center font-bold text-slate-400 uppercase tracking-widest text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regs.filter(r => r.sessionId === selectedLessonForAttendance?.sessionId && r.status === 'verified').length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-slate-500 font-medium">No verified students enrolled in this session.</TableCell>
                  </TableRow>
                ) : regs.filter(r => r.sessionId === selectedLessonForAttendance?.sessionId && r.status === 'verified').map(r => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold text-slate-700">{r.studentName}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{r.studentEmail}</TableCell>
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
                                : 'border-slate-200 text-slate-400 bg-white hover:border-slate-300'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <DialogFooter className="p-6 border-t border-slate-100 flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setIsAttendanceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAttendanceAdmin} disabled={submittingAttendance} className="bg-slate-900 text-white hover:bg-slate-800">
              {submittingAttendance ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Save Attendance
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={isSessionAttendanceModalOpen} onOpenChange={setIsSessionAttendanceModalOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader className="p-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">Manage Attendance</DialogTitle>
            <DialogDescription className="text-slate-500 font-medium">
              Select a class below to mark student attendance.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto px-6 py-2">
            <div className="space-y-3">
              {lessons.filter(l => l.sessionId === selectedSessionForAttendance?.id).map((l, idx) => (
                <div key={l.id} className="p-4 border rounded-xl hover:border-indigo-200 transition-all bg-white shadow-sm flex items-center justify-between group">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{l.lessonTitle || `Lesson ${idx + 1}`}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {l.lessonDate}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {l.startTime} - {l.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button variant="outline" size="sm" className="h-8 px-4 text-xs font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 hover:bg-indigo-50" onClick={() => handleOpenAttendanceModal(l)}>
                      <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Mark Attendance
                    </Button>
                  </div>
                </div>
              ))}
              {lessons.filter(l => l.sessionId === selectedSessionForAttendance?.id).length === 0 && (
                <div className="text-center py-12 text-slate-400 text-sm font-medium border border-dashed rounded-xl bg-slate-50">
                  <p className="mb-4">No classes scheduled for this session yet.</p>
                  <Button 
                    variant="default" 
                    className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wider text-xs"
                    onClick={() => {
                      setIsSessionAttendanceModalOpen(false);
                      setViewingLessonsForSession(selectedSessionForAttendance);
                      setActiveTab('sessions');
                    }}
                  >
                    Go to Class Scheduler
                  </Button>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-slate-100">
            <Button variant="ghost" onClick={() => setIsSessionAttendanceModalOpen(false)} className="w-full font-bold text-xs uppercase tracking-[0.2em] text-slate-500">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Manual Hours Modal */}
      <Dialog open={isManualHoursModalOpen} onOpenChange={setIsManualHoursModalOpen}>
        <DialogContent className="max-w-md bg-white border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
          <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold text-white mb-1">Add Part-time Record</DialogTitle>
              <DialogDescription className="text-indigo-100 text-xs">Record a daily course for a part-time instructor</DialogDescription>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-indigo-50" />
            </div>
          </div>
          <form onSubmit={handleManualHoursSubmit} className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Select Instructor *</label>
                <select 
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                  value={manualHoursForm.tutorId}
                  onChange={e => setManualHoursForm({...manualHoursForm, tutorId: e.target.value})}
                  required
                >
                  <option value="">-- Select Instructor --</option>
                  {tutors.filter(t => t.role === 'tutor_pt').map(t => (
                    <option key={t.id} value={t.id}>{t.name || t.email}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date *</label>
                  <Input 
                    type="date" 
                    value={manualHoursForm.date} 
                    onChange={e => setManualHoursForm({...manualHoursForm, date: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Name *</label>
                    <select
                        className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                        value={manualHoursForm.course}
                        onChange={e => setManualHoursForm({...manualHoursForm, course: e.target.value})}
                        required
                    >
                        <option value="">-- Select Course --</option>
                        {courses.map(c => (
                            <option key={c.id} value={c.title || c.certName}>{c.title || c.certName}</option>
                        ))}
                    </select>
                </div>
              </div>

            </div>
            
            <div className="pt-4 border-t border-slate-100 flex gap-3">
              <Button type="button" variant="outline" onClick={() => setIsManualHoursModalOpen(false)} className="flex-1 font-bold text-xs uppercase tracking-wider">
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmittingManualHours} className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-wider gap-2">
                {isSubmittingManualHours ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Add Hours
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isPromoModalOpen} onOpenChange={setIsPromoModalOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selectedPromo ? 'Edit Promotion' : 'Add Promotion'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
               <label className="text-sm font-medium">Promotion Name</label>
               <Input value={promoForm.name || ''} onChange={e => setPromoForm({...promoForm, name: e.target.value})} placeholder="e.g. Early Bird 2026" />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Type</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2" value={promoForm.type} onChange={e => setPromoForm({...promoForm, type: e.target.value})}>
                     <option value="code">Promo Code</option>
                     <option value="bundle">Course Bundle Automatic (Require 2 Courses)</option>
                  </select>
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2" value={promoForm.status} onChange={e => setPromoForm({...promoForm, status: e.target.value})}>
                     <option value="active">Active</option>
                     <option value="inactive">Inactive</option>
                  </select>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Start Date (Optional)</label>
                  <Input type="date" value={promoForm.startDate || ''} onChange={e => setPromoForm({...promoForm, startDate: e.target.value})} />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">End Date (Optional)</label>
                  <Input type="date" value={promoForm.endDate || ''} onChange={e => setPromoForm({...promoForm, endDate: e.target.value})} />
               </div>
            </div>

            {promoForm.type === 'code' && (
               <div className="space-y-2">
                  <label className="text-sm font-medium">Promo Code</label>
                  <div className="flex gap-2">
                    <Input value={promoForm.code || ''} onChange={e => setPromoForm({...promoForm, code: e.target.value.toUpperCase()})} placeholder="e.g. EARLY26" className="uppercase font-mono flex-1" />
                    <Button type="button" variant="outline" onClick={() => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
                        let result = '';
                        for (let i = 0; i < 6; i++) {
                            result += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        setPromoForm({ ...promoForm, code: result });
                    }}>Generate</Button>
                  </div>
               </div>
            )}
            {promoForm.type === 'bundle' && (
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Bundle Course 1</label>
                     <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2" value={promoForm.bundleCourse1} onChange={e => setPromoForm({...promoForm, bundleCourse1: e.target.value})}>
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.title}</option>)}
                     </select>
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Bundle Course 2</label>
                     <select className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2" value={promoForm.bundleCourse2} onChange={e => setPromoForm({...promoForm, bundleCourse2: e.target.value})}>
                        <option value="">Select Course</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.courseCode} - {c.title}</option>)}
                     </select>
                  </div>
                  <p className="text-xs text-slate-500 col-span-2">System will check if the registering student is taking one course and has the other in their registration history, or both together if cart allows.</p>
               </div>
            )}

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-sm font-medium">Discount Type</label>
                  <Input value="Fixed Amount (HKD)" disabled className="bg-slate-50 text-slate-500 cursor-not-allowed" />
               </div>
               <div className="space-y-2">
                  <label className="text-sm font-medium">Discount Amount (HKD)</label>
                  <Input type="number" min="0" value={promoForm.discountValue} onChange={e => setPromoForm({...promoForm, discountValue: Number(e.target.value)})} />
               </div>
            </div>

            <div className="space-y-2 border-t pt-4 border-slate-100 mt-2">
               <label className="text-sm font-medium flex items-center gap-2"><KeyRound className="w-4 h-4 text-slate-400" /> Admin Password Confirm <span className="text-red-500">*</span></label>
               <Input type="password" placeholder="Enter your password to save changes" value={promoForm.adminPassword || ''} onChange={e => setPromoForm({...promoForm, adminPassword: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsPromoModalOpen(false)}>Cancel</Button>
             <Button onClick={handleSavePromo}>Save Promotion</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Promo Modal */}
      <Dialog open={isDeletePromoModalOpen} onOpenChange={setIsDeletePromoModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Promotion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
             <p className="text-sm text-slate-600">Are you sure you want to delete the promotion "{promoToDelete?.name}"? This action cannot be undone.</p>
          </div>
          <DialogFooter>
             <Button variant="outline" onClick={() => setIsDeletePromoModalOpen(false)}>Cancel</Button>
             <Button 
                variant="destructive" 
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={async () => {
                   if (!promoToDelete) return;
                   try {
                     await deleteDoc(doc(db, 'promotions', promoToDelete.id));
                     toast.success('Promotion deleted successfully');
                     setIsDeletePromoModalOpen(false);
                     fetchData();
                   } catch (e) {
                     toast.error('Failed to delete promotion');
                   }
                }}
             >Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
