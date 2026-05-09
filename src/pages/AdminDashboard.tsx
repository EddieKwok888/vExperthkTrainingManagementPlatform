import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslation } from 'react-i18next';
import { db, auth } from '../lib/firebase';
import { collection, query, getDocs, doc, setDoc, updateDoc, serverTimestamp, orderBy, writeBatch, where, addDoc, limit, deleteDoc } from 'firebase/firestore';
import { sendPasswordResetEmail } from 'firebase/auth';
import { AuthContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Loader2, Plus, Database, ExternalLink, LayoutDashboard, BookOpen, Calendar as CalendarIcon, Users, CreditCard, Clock, MessageSquare, CheckCircle, XCircle, Download, FileText, Upload, GraduationCap, BarChart2, ShieldAlert, Building2, MapPin, CalendarRange, Share2, ArrowLeftRight, ClipboardList, Search, UserPlus, Mail, Phone, Award, ShieldCheck, Briefcase, KeyRound, Copy, Edit2, Trash2, ChevronLeft, Sparkles } from 'lucide-react';
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

export function AdminDashboard() {
  const { role, user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  
  const [courses, setCourses] = useState<any[]>([]);
  const [regs, setRegs] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [hours, setHours] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [certs, setCerts] = useState<TutorCertification[]>([]);
  const [expertise, setExpertise] = useState<TutorExpertise[]>([]);
  const [materials, setMaterials] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [tutorShifts, setTutorShifts] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
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
    name: 'ProTrain Academy',
    logo_url: '',
    address: '123 Tech Avenue, Kowloon, Hong Kong',
    phone: '+852 2345 6789',
    invoice_prefix: 'INV',
    terms_conditions: '1. Fees are non-refundable.\n2. Please present this receipt for course entry.'
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

      const [cSnap, rSnap, sSnap, lSnap, tSnap, fSnap, hSnap, mSnap, certSnap, auditSnap, schoolSnap, bSnap, tsSnap, uSnap, tCertSnap, tExpSnap, kbSnap, ticketSnap] = await Promise.all([
        fetchCollection('courses', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('registrations', [orderBy('createdAt', 'desc'), limit(200)]),
        fetchCollection('course_sessions', [orderBy('createdAt', 'desc'), limit(200)]), 
        fetchCollection('lessons', [orderBy('lessonDate', 'asc'), limit(500)]),
        fetchCollection('users', [where('role', '==', 'tutor'), limit(50)]),
        fetchCollection('feedbacks', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('teaching_hours', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('materials', [limit(100)]),
        fetchCollection('certificates', [limit(100)]),
        fetchCollection('audit_logs', [orderBy('createdAt', 'desc'), limit(100)]),
        fetchCollection('settings', [limit(1)]),
        fetchCollection('branches', [orderBy('name', 'asc')]),
        fetchCollection('tutor_shifts', [limit(500)]),
        fetchCollection('users', [limit(500)]),
        fetchCollection('tutor_certifications', [limit(500)]),
        fetchCollection('tutor_expertise', [limit(500)]),
        fetchCollection('knowledge_base', [limit(500)]),
        fetchCollection('support_tickets', [limit(500)])
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
      setMaterials(mSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setAuditLogs(auditSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setBranches(bSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      setTutorShifts(tsSnap.docs.map(d => ({ id: d.id, ...d.data() })));

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
    price: 0,
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
    try {
      const template = courses.find(c => c.id === newSession.courseId);
      const sessionData = {
        ...newSession,
        sessionName: `${template?.title || 'Course'} - ${newSession.startDate || 'Intake'}`,
        enrolledCount: 0,
        sessionStatus: 'open',
        price: newSession.price || template?.standardPrice || 0,
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
        price: 0,
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

  const [itemToDelete, setItemToDelete] = useState<{id: string, type: 'course' | 'session'} | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      if (itemToDelete.type === 'course') {
        await deleteDoc(doc(db, 'courses', itemToDelete.id));
        await logAudit(user?.uid || 'system', user?.email || 'system', 'DELETE_COURSE_TEMPLATE', 'courses', itemToDelete.id, {});
        toast.success("Course template deleted successfully");
      } else {
        const batch = writeBatch(db);
        batch.delete(doc(db, 'course_sessions', itemToDelete.id));
        lessons.filter(l => l.sessionId === itemToDelete.id).forEach(l => {
          batch.delete(doc(db, 'lessons', l.id));
        });
        await batch.commit();
        await logAudit(user?.uid || 'system', user?.email || 'system', 'DELETE_SESSION', 'course_sessions', itemToDelete.id, {});
        toast.success("Course session deleted");
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

  const confirmDelete = (id: string, type: 'course' | 'session') => {
    setItemToDelete({ id, type });
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
      await updateDoc(doc(db, 'registrations', id), { status, updatedAt: serverTimestamp() });
      await logAudit(user?.uid || 'system', user?.email || 'system', 'UPDATE_REGISTRATION_STATUS', 'registrations', id, { status });
      toast.success(`Registration ${status}!`);
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

  const handleExportAttendanceSheet = (session: any, course: any, enrolledStudents: any[]) => {
    const doc = new jsPDF();
    const date = formatHkDate(new Date());
    
    // Header
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
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Course: ${course?.title || 'Unknown'}`, 25, 45);
    doc.text(`Session Date: ${session.startDate}`, 25, 52);
    doc.text(`Time: ${session.startTime} - ${session.endTime}`, 25, 59);
    
    doc.text(`Instructor: ${tutors.find(t => t.id === course?.tutorId)?.name || 'N/A'}`, 120, 45);
    doc.text(`Room/Mode: ${session.deliveryMode}`, 120, 52);
    
    // Table Header
    const tableTop = 75;
    doc.setFillColor(241, 245, 249);
    doc.rect(20, tableTop, 170, 10, 'F');
    doc.rect(20, tableTop, 170, 10);
    
    doc.setFontSize(10);
    doc.text('Student Name', 25, tableTop + 6.5);
    doc.text('Email', 85, tableTop + 6.5);
    doc.text('Signature / Status', 150, tableTop + 6.5);
    
    // Table Rows
    enrolledStudents.forEach((student, index) => {
      const y = tableTop + 10 + (index * 12);
      if (y > 270) {
        doc.addPage();
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(20, y, 170, 12);
      doc.setFont('helvetica', 'normal');
      doc.text(student.studentName, 25, y + 7.5);
      doc.setFontSize(8);
      doc.text(student.studentEmail, 85, y + 7.5);
      doc.setFontSize(10);
      
      // Signature boxes
      doc.setDrawColor(200);
      doc.rect(155, y + 2, 8, 8); 
      doc.rect(175, y + 2, 8, 8); 
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
    doc.text(cert.course_title || "Course Title", 148, 150, { align: 'center' });
    
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(12);
    doc.text(`Issue Date: ${formatHkDate(new Date())}`, 148, 180, { align: 'center' });
    doc.text(`Certificate ID: ${cert.id}`, 148, 190, { align: 'center' });
    
    doc.save(`${cert.studentName.replace(' ', '_')}_Certificate.pdf`);
  };

  const handleGenerateInvoice = (reg: any) => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(22);
    doc.text(schoolInfo.name || "School Name", 20, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(schoolInfo.address || "Address", 20, 28);
    doc.text(schoolInfo.phone || "Phone", 20, 33);
    
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
    doc.text(relatedCourse?.title || "Course Registration", 25, 130);
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

  if (role !== 'admin') return <div className="text-center py-20">Access Denied</div>;

  const NavigationMenu = () => (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">Menu</div>
      {[
        { id: 'overview', label: t('nav.overview'), icon: LayoutDashboard },
        { id: 'courses', label: 'Templates', icon: BookOpen },
        { id: 'sessions', label: 'Sessions', icon: CalendarIcon },
        { id: 'registrations', label: t('nav.registrations'), icon: CreditCard },
        { id: 'finance', label: t('nav.finance'), icon: BarChart2 },
        { id: 'materials', label: t('nav.materials'), icon: BookOpen },
        { id: 'certificates', label: t('nav.certificates'), icon: Database },
        { id: 'scheduling', label: t('nav.scheduling'), icon: CalendarRange },
        { id: 'tutors', label: t('nav.tutors'), icon: Clock },
        { id: 'feedback', label: t('nav.feedback'), icon: MessageSquare },
        { id: 'logs', label: t('nav.logs'), icon: ShieldAlert },
        { id: 'users', label: t('nav.users'), icon: Users },
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
             {['overview', 'courses', 'sessions', 'scheduling', 'registrations', 'finance', 'materials', 'certificates', 'tutors', 'feedback', 'logs', 'users', 'settings'].map(tab => (
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
                <Card className="shadow-sm border-slate-200 cursor-pointer hover:border-red-300 transition-colors" onClick={() => setActiveTab('registrations')}>
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
                             <p className="text-xs text-slate-500">Taking sessions</p>
                          </div>
                          <span className="text-2xl font-bold text-slate-800">{tutors.length}</span>
                       </div>
                    </CardContent>
                 </Card>
              </div>
            </div>
          )
          })()}

          {activeTab === 'registrations' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Manage Registrations</CardTitle>
                  <CardDescription>Review and verify manual bank transfers</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(regs, 'registrations')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
              </CardHeader>
              <CardContent>
                {loading ? <div className="py-10 flex justify-center"><Loader2 className="animate-spin w-6 h-6 text-slate-400" /></div> : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Course Session</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Proof</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regs.map(r => (
                          <TableRow key={r.id}>
                            <TableCell>
                              <div className="font-medium text-slate-800">{r.studentName}</div>
                              <div className="text-xs text-slate-500">{r.studentEmail}</div>
                              <div className="text-xs text-slate-400">{r.studentPhone}</div>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded w-max mb-1">C: {r.courseId?.slice(0,6)}...</div>
                              <div className="text-xs font-mono bg-slate-100 px-2 py-0.5 rounded w-max">S: {r.sessionId?.slice(0,6)}...</div>
                            </TableCell>
                            <TableCell className="font-bold">${r.amount}</TableCell>
                            <TableCell>
                              {r.paymentProof ? (
                                <Button variant="ghost" size="sm" className="h-8 text-blue-600 gap-1 px-2" onClick={() => setPreviewImage(r.paymentProof)}>
                                  <ExternalLink className="w-3 h-3" /> View
                                </Button>
                              ) : <span className="text-xs text-slate-400 italic">None</span>}
                            </TableCell>
                            <TableCell>
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                                r.status === 'verified' ? 'bg-green-100 text-green-700' : 
                                r.status === 'rejected' ? 'bg-red-100 text-red-700' : 
                                r.status === 'pending_verification' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'}`}>
                                {r.status?.replace('_', ' ')}
                              </span>
                            </TableCell>
                            <TableCell>
                              {(r.status === 'pending_verification' || r.status === 'pending') && (
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateRegStatus(r.id, 'verified')} className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white shadow-sm border-0"><CheckCircle className="w-3 h-3 mr-1" /> Approve</Button>
                                  <Button size="sm" variant="outline" onClick={() => handleUpdateRegStatus(r.id, 'rejected')} className="h-7 text-xs text-red-600 border-red-200 hover:bg-red-50"><XCircle className="w-3 h-3 mr-1" /> Reject</Button>
                                </div>
                              )}
                              {r.status === 'verified' && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[10px] text-green-600 font-medium">Confirmed</span>
                                  {r.status !== 'completed' && (
                                    <Button size="sm" variant="outline" onClick={() => handleIssueCertificate(r)} className="h-7 text-[10px]"><GraduationCap className="w-3 h-3 mr-1"/> Issue Certificate</Button>
                                  )}
                                  {r.status === 'completed' && (
                                    <span className="text-[10px] text-blue-600 font-medium whitespace-nowrap">Cert Issued</span>
                                  )}
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                        {regs.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No registrations found.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'finance' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Financial Reconciliation</CardTitle>
                  <CardDescription>Track e-bills and revenue</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(regs.map((r:any) => ({ Invoice: r.invoiceNumber, Student: r.studentName, Amount: r.amount, Method: r.paymentMethod, Status: r.status, Date: formatHkDate(r.createdAt, true) })), 'financial_report')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export CSV</Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <Card className="bg-slate-50 border-none shadow-none">
                     <CardContent className="p-4">
                       <p className="text-sm font-medium text-slate-500">Total Verified Revenue</p>
                       <p className="text-2xl font-bold text-green-600">
                          ${regs.filter((r:any) => r.status === 'verified').reduce((sum: number, r:any) => sum + (r.amount || 0), 0).toLocaleString()}
                       </p>
                     </CardContent>
                  </Card>
                  <Card className="bg-slate-50 border-none shadow-none">
                     <CardContent className="p-4">
                       <p className="text-sm font-medium text-slate-500">Pending Verification</p>
                       <p className="text-2xl font-bold text-blue-600">
                          ${regs.filter((r:any) => r.status === 'pending_verification').reduce((sum: number, r:any) => sum + (r.amount || 0), 0).toLocaleString()}
                       </p>
                     </CardContent>
                  </Card>
                  <Card className="bg-slate-50 border-none shadow-none">
                     <CardContent className="p-4">
                       <p className="text-sm font-medium text-slate-500">Total Invoices Issued</p>
                       <p className="text-2xl font-bold text-slate-800">
                          {regs.length}
                       </p>
                     </CardContent>
                  </Card>
                </div>

                <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice No.</TableHead>
                          <TableHead>Student</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {regs.map((r: any) => (
                           <TableRow key={r.id}>
                             <TableCell className="font-mono text-sm">{r.invoiceNumber || 'N/A'}</TableCell>
                             <TableCell>
                               <div className="font-medium text-slate-800">{r.studentName}</div>
                               <div className="text-xs text-slate-500">{r.studentEmail}</div>
                             </TableCell>
                             <TableCell>
                               {r.paymentMethod ? (
                                  <span className="uppercase text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{r.paymentMethod}</span>
                               ) : '-'}
                             </TableCell>
                             <TableCell className="font-semibold text-slate-700">${r.amount}</TableCell>
                             <TableCell className="text-sm text-slate-500">{formatHkDate(r.createdAt)}</TableCell>
                             <TableCell>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs px-2 py-1 rounded-full font-semibold capitalize ${r.status === 'verified' ? 'bg-green-100 text-green-700' : r.status === 'pending_verification' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                    {r.status?.replace('_', ' ')}
                                  </span>
                                  {r.status === 'verified' && (
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-600" onClick={() => handleGenerateInvoice(r)} title="Download Receipt">
                                      <FileText className="w-4 h-4" />
                                    </Button>
                                  )}
                                </div>
                             </TableCell>
                           </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'certificates' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle>Certificates</CardTitle>
                  <CardDescription>Generated student certificates</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => handleExportCSV(certificates, 'certificates')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Course</TableHead>
                        <TableHead>Issued At</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {certificates.map(c => (
                        <TableRow key={c.id}>
                          <TableCell>
                            <div className="font-medium text-slate-800">{c.studentName}</div>
                            <div className="text-xs text-slate-500">{c.studentEmail}</div>
                          </TableCell>
                          <TableCell className="text-sm">{c.course_title}</TableCell>
                          <TableCell className="text-sm">{formatHkDate(c.issued_at)}</TableCell>
                          <TableCell>
                             <Button size="sm" variant="outline" onClick={() => generateCertificatePDF(c)} className="gap-2 h-8 text-blue-600"><Download className="w-3.5 h-3.5"/> PDF</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                      {certificates.length === 0 && (
                        <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No certificates generated yet.</TableCell></TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="w-5 h-5 text-blue-600" /> Branch Management
                    </CardTitle>
                    <CardDescription>Manage your school locations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-500 uppercase">New Branch</label>
                      <Input placeholder="Branch Name" value={newBranch.name} onChange={e => setNewBranch({...newBranch, name: e.target.value})} />
                      <Input placeholder="Address" value={newBranch.address} onChange={e => setNewBranch({...newBranch, address: e.target.value})} />
                      <Input placeholder="Contact Phone" value={newBranch.contact_phone} onChange={e => setNewBranch({...newBranch, contact_phone: e.target.value})} />
                      <Button onClick={handleCreateBranch} className="w-full mt-2">Add Branch</Button>
                    </div>
                    <hr className="my-4" />
                    <div className="space-y-3">
                      {branches.map(b => (
                        <div key={b.id} className="p-3 bg-slate-50 rounded-lg border border-slate-100 flex justify-between items-center text-sm">
                          <div>
                            <p className="font-bold text-slate-800">{b.name}</p>
                            <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {b.address || 'No address'}</p>
                          </div>
                        </div>
                      ))}
                      {branches.length === 0 && <p className="text-center text-xs text-slate-400 py-4 italic">No branches added.</p>}
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <CalendarRange className="w-5 h-5 text-indigo-600" /> Batch Scheduling
                    </CardTitle>
                    <CardDescription>Assign shifts to multiple instructors at once</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Select Branch</label>
                        <select 
                          value={batchScheduling.branchId} 
                          onChange={e => setBatchScheduling({...batchScheduling, branchId: e.target.value})}
                          className="w-full h-10 px-3 rounded-md border border-slate-200 text-sm focus:ring-2 focus:ring-blue-600 outline-none"
                        >
                          <option value="">Choose Branch...</option>
                          {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Shift Type</label>
                        <div className="p-2 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-600 uppercase flex items-center justify-center">Regular Shift</div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium">Select Instructors</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[120px] overflow-y-auto p-2 border border-slate-200 rounded-md text-sm">
                        {tutors.map(t => (
                          <label key={t.id} className="flex items-center gap-2 p-1.5 hover:bg-slate-50 rounded cursor-pointer text-xs">
                            <input 
                              type="checkbox" 
                              checked={batchScheduling.tutorIds.includes(t.id)} 
                              onChange={e => {
                                const ids = e.target.checked 
                                  ? [...batchScheduling.tutorIds, t.id]
                                  : batchScheduling.tutorIds.filter(id => id !== t.id);
                                setBatchScheduling({...batchScheduling, tutorIds: ids});
                              }}
                            />
                            <span className="truncate">{t.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Start Date</label>
                        <Input type="date" value={batchScheduling.startDate} onChange={e => {
                          const val = e.target.value;
                          const v = isWeekendOrHoliday(val);
                          if (v.isInvalid) return toast.error(v.reason);
                          if (batchScheduling.endDate && val > batchScheduling.endDate) return toast.error("Start date cannot be later than end date");
                          setBatchScheduling({...batchScheduling, startDate: val});
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">End Date</label>
                        <Input type="date" value={batchScheduling.endDate} onChange={e => {
                          const val = e.target.value;
                          const v = isWeekendOrHoliday(val);
                          if (v.isInvalid) return toast.error(v.reason);
                          if (batchScheduling.startDate && val < batchScheduling.startDate) return toast.error("End date cannot be earlier than start date");
                          setBatchScheduling({...batchScheduling, endDate: val});
                        }} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Work Start</label>
                        <Input type="time" value={batchScheduling.startTime} onChange={e => setBatchScheduling({...batchScheduling, startTime: e.target.value})} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium">Work End</label>
                        <Input type="time" value={batchScheduling.endTime} onChange={e => setBatchScheduling({...batchScheduling, endTime: e.target.value})} />
                      </div>
                    </div>

                    <Button 
                      onClick={() => handleBatchUpdateShifts(batchScheduling.branchId, batchScheduling.tutorIds, batchScheduling.startDate, batchScheduling.endDate, batchScheduling.startTime, batchScheduling.endTime)}
                      className="w-full bg-indigo-600 hover:bg-indigo-700"
                    >
                      Schedule Shifts
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle>Master Schedule</CardTitle>
                    <CardDescription>Consolidated view of all instructor shifts</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <select 
                      className="h-9 px-3 rounded-md border border-slate-200 text-sm outline-none"
                      value={schedulingBranch}
                      onChange={e => setSchedulingBranch(e.target.value)}
                    >
                      <option value="">All Branches</option>
                      {branches.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                    </select>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Branch</TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Time Range</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {tutorShifts
                          .filter(s => !schedulingBranch || s.branchId === schedulingBranch)
                          .sort((a,b) => b.date.localeCompare(a.date))
                          .slice(0, 50)
                          .map(s => {
                            const t = tutors.find(ti => ti.id === s.tutorId);
                            const b = branches.find(bi => bi.id === s.branchId);
                            return (
                              <TableRow key={s.id}>
                                <TableCell className="font-semibold">{t?.name || 'Unknown'}</TableCell>
                                <TableCell>{b?.name || 'Unknown'}</TableCell>
                                <TableCell className="text-sm font-mono">{s.date}</TableCell>
                                <TableCell className="text-sm">{s.startTime} - {s.endTime}</TableCell>
                                <TableCell>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                    s.type === 'regular' ? 'bg-blue-100 text-blue-700' : 
                                    s.type === 'borrow' ? 'bg-orange-100 text-orange-700' :
                                    s.type === 'swap' ? 'bg-purple-100 text-purple-700' : 'bg-red-100 text-red-700'}`}>
                                    {s.type}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:text-blue-600" title="Transfer/Loan" onClick={async () => {
                                      const newBranchId = prompt("Enter target Branch ID for loan/transfer:");
                                      if (newBranchId) {
                                        try {
                                          await updateDoc(doc(db, 'tutor_shifts', s.id), { branchId: newBranchId, type: 'borrow' });
                                          toast.success("Shift transferred successfully");
                                          fetchData();
                                        } catch(err: any) { toast.error(err.message); }
                                      }
                                    }}>
                                      <ArrowLeftRight className="w-3.5 h-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400 hover:text-red-600" onClick={async () => {
                                      try {
                                          await updateDoc(doc(db, 'tutor_shifts', s.id), { status: 'cancelled' });
                                          toast.success("Shift cancelled");
                                          fetchData();
                                        } catch(err: any) { toast.error(err.message); }
                                    }}>
                                      <XCircle className="w-3.5 h-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        {tutorShifts.length === 0 && (
                          <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No shifts scheduled.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'materials' && (
             <Card>
               <CardHeader>
                 <CardTitle>Course Materials</CardTitle>
                 <CardDescription>Since file upload to Storage is disabled for this prototype without proper rules, add material links below.</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="mb-8 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                   <h3 className="text-sm font-semibold mb-3">Add Material Link</h3>
                    <form className="grid grid-cols-1 md:grid-cols-3 gap-4" onSubmit={async (e) => {
                      e.preventDefault();
                      const form = e.target as HTMLFormElement;
                      const courseId = (form.elements.namedItem('courseId') as HTMLSelectElement).value;
                      const title = (form.elements.namedItem('title') as HTMLInputElement).value;
                      const url = (form.elements.namedItem('url') as HTMLInputElement).value;
                      
                      if (!courseId || !title || !url) return toast.error("Please fill all fields");
                      
                      try {
                        const mRef = doc(collection(db, 'materials'));
                        await setDoc(mRef, { courseId, title, file_url: url, createdAt: serverTimestamp(), uploaded_by: user?.uid });
                        toast.success("Material added");
                        form.reset();
                        fetchData();
                      } catch (err: any) { toast.error(err.message); }
                   }}>
                     <select name="courseId" className="h-10 px-3 rounded-md border border-slate-200 text-sm">
                       <option value="">Select Course</option>
                       {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                     </select>
                     <Input name="title" placeholder="Material Title (e.g. Week 1 Slides)" />
                     <div className="flex gap-2">
                       <Input name="url" placeholder="URL (Google Drive, Dropbox, etc)" />
                       <Button type="submit"><Plus className="w-4 h-4"/></Button>
                     </div>
                   </form>
                 </div>
                 
                 <Table>
                   <TableHeader>
                      <TableRow><TableHead>Course</TableHead><TableHead>Title</TableHead><TableHead>Link</TableHead></TableRow>
                   </TableHeader>
                   <TableBody>
                      {materials.map(m => (
                         <TableRow key={m.id}>
                            <TableCell className="font-mono text-xs">{m.courseId}</TableCell>
                            <TableCell className="font-medium">{m.title}</TableCell>
                            <TableCell><a href={m.file_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-xs flex items-center gap-1"><ExternalLink className="w-3 h-3"/> Open</a></TableCell>
                         </TableRow>
                      ))}
                      {materials.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">No materials added.</TableCell></TableRow>}
                   </TableBody>
                 </Table>
               </CardContent>
             </Card>
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
                          <TableHead>Sessions</TableHead>
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
                                      price: c.standardPrice || 0
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
                                  onClick={() => confirmDelete(c.id, 'course')}
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
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle>Teaching Hours Verification</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleExportCSV(hours, 'teaching_hours')} className="gap-2 h-8"><Download className="w-3.5 h-3.5" /> Export</Button>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instructor ID</TableHead>
                        <TableHead>Hours</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {hours.map(h => (
                        <TableRow key={h.id}>
                        <TableCell className="font-mono text-xs">{h.tutorId?.slice(0,6)}...</TableCell>
                          <TableCell className="font-bold">{h.hours}h</TableCell>
                          <TableCell className="text-xs text-slate-500">{h.details}</TableCell>
                          <TableCell>
                             <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${h.status === 'approved' ? 'bg-green-100 text-green-700' : h.status === 'paid' ? 'bg-indigo-100 text-indigo-700' : 'bg-yellow-100 text-yellow-700'}`}>
                               {h.status?.replace('_', ' ')}
                             </span>
                          </TableCell>
                          <TableCell>
                             {h.status === 'pending_approval' && (
                                <Button size="sm" onClick={() => handleUpdateHoursStatus(h.id, 'approved')} className="h-7 text-xs">Approve</Button>
                             )}
                             {h.status === 'approved' && (
                                <Button size="sm" variant="outline" onClick={() => handleUpdateHoursStatus(h.id, 'paid')} className="h-7 text-xs border-indigo-200 text-indigo-600 hover:bg-indigo-50">Mark Paid</Button>
                             )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {hours.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-4 text-slate-500">No hours logged yet.</TableCell></TableRow>}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader><CardTitle>Registered Instructors</CardTitle></CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>ID</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tutors.map(t => (
                        <TableRow key={t.id}>
                          <TableCell className="font-medium text-slate-800">{t.name}</TableCell>
                          <TableCell className="text-slate-500">{t.email}</TableCell>
                          <TableCell className="font-mono text-xs bg-slate-50 rounded px-2 py-1">{t.id}</TableCell>
                        </TableRow>
                      ))}
                      {tutors.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-4 text-slate-500">No instructors found.</TableCell></TableRow>}
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
              {!viewingLessonsForSession ? (
                <>
                  <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div>
                      <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">Active Sessions & Intakes</h2>
                      <p className="text-xs text-slate-500">Manage your course runs and schedules</p>
                    </div>
                    <Button 
                      onClick={() => setSessionCreationModalOpen(true)} 
                      className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                    >
                      <Plus className="w-4 h-4 mr-2" /> 
                      New Session Instance
                    </Button>
                  </div>

                  <Card className="shadow-sm">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Active Sessions & Intakes</CardTitle>
                        <CardDescription>Manage your course runs and schedules</CardDescription>
                      </div>
                      <div className="flex gap-2">
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
                              <TableHead>Enrolled</TableHead>
                              <TableHead>Classes</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {sessions.map(s => {
                              const course = courses.find(c => c.id === s.courseId);
                              const instructor = tutors.find(t => t.id === s.tutorId);
                              const sessionLessons = lessons.filter(l => l.sessionId === s.id);
                              return (
                                <TableRow key={s.id} className="hover:bg-slate-50/50">
                                  <TableCell>
                                    <div className="font-semibold text-slate-800 whitespace-pre-wrap leading-snug">{course?.courseCode || s.sessionName}</div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mt-0.5">
                                      {s.deliveryMode} • {s.startDate || 'No date'} - {s.endDate || 'No date'}
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-xs whitespace-pre-wrap max-w-[200px] leading-tight">{course?.title || 'Unknown'}</TableCell>
                                  <TableCell className="text-xs font-medium">{instructor?.name || 'Unassigned'}</TableCell>
                                  <TableCell>
                                    <div className="flex items-center gap-1.5">
                                      <span className="font-bold">{s.enrolledCount || 0}</span>
                                      <span className="text-slate-300">/</span>
                                      <span className="text-slate-500">{s.quota}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-7 text-[10px] text-blue-600 gap-1 px-2 font-bold bg-blue-50 hover:bg-blue-100"
                                      onClick={() => setViewingLessonsForSession(s)}
                                    >
                                      {sessionLessons.length} LESSONS <ExternalLink className="w-2.5 h-2.5" />
                                    </Button>
                                  </TableCell>
                                  <TableCell>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight ${s.sessionStatus === 'open' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                                      {s.sessionStatus}
                                    </span>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">

                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600" title="Duplicate" onClick={() => handleDuplicateSession(s)}><Copy className="w-3.5 h-3.5" /></Button>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600" title="Edit" onClick={() => { setSelectedSession(s); setSessionModalOpen(true); }}><Edit2 className="w-3.5 h-3.5" /></Button>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-300 hover:text-red-600" title="Delete" onClick={() => confirmDelete(s.id, 'session')}>
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
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50" title="Edit" onClick={() => {
                                  const newDate = prompt("New Date:", l.lesson_date);
                                  if (newDate) handleUpdateLesson(l.id, { lesson_date: newDate });
                                }}><Edit2 className="w-3.5 h-3.5" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50" title="Remove" onClick={async () => {
                                    try {
                                      await deleteDoc(doc(db, 'lessons', l.id));
                                      fetchData();
                                      toast.success("Lesson deleted");
                                    } catch(e: any) { toast.error(e.message); }
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
                                u.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 
                                'bg-slate-100 text-slate-600'
                              }`}>
                                {u.role ? t(`common.${u.role}`) : t('common.student')}
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
                                  className="h-8 px-2 text-indigo-600"
                                  onClick={() => {
                                    setSelectedUser(u);
                                    setIsUserViewModalOpen(true);
                                  }}
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
                      placeholder="e.g. ProTrain Academy"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Logo URL</label>
                    <Input 
                      value={schoolInfo.logo_url} 
                      onChange={e => setSchoolInfo({...schoolInfo, logo_url: e.target.value})}
                      placeholder="https://example.com/logo.png"
                    />
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
                  <option value="tutor">Instructor</option>
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
                        selectedUser.role === 'tutor' ? 'bg-blue-100 text-blue-700' : 
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {selectedUser.role}
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
                  {selectedUser.role === 'tutor' ? (
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
                                   <p className="text-[10px] font-bold text-slate-500 uppercase">Sessions</p>
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
                              <p className="text-xs text-slate-400 italic">No course registrations found.</p>
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
              {itemToDelete?.type === 'course' ? 'Delete Course Template' : 'Delete Course Session'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {itemToDelete?.type === 'course' 
                ? "Are you sure you want to delete this course template? This will not affect existing sessions but the template will be permanently removed."
                : "Are you sure you want to delete this session? All scheduled lessons and data for this run will be permanently removed."}
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
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Course Title</label>
                  <textarea 
                    placeholder="Enter full descriptive title..." 
                    value={newCourse.title} 
                    onChange={e => setNewCourse({...newCourse, title: e.target.value})}
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

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
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
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Full Course Title</label>
                      <textarea 
                        value={selectedCourse.title || ''} 
                        onChange={e => setSelectedCourse({...selectedCourse, title: e.target.value})}
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pb-6 border-b border-slate-100">
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
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
              {selectedTemplateForIntake ? `New Intake: ${selectedTemplateForIntake.title}` : 'Create Course Session'}
            </DialogTitle>
            <DialogDescription>Schedule a specific instance of a course template</DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
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
                                      price: c.standardPrice || 0
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
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Final Price (HK$)</label>
                  <Input type="number" value={isNaN(newSession.price) ? '' : newSession.price} onChange={e => setNewSession({...newSession, price: parseFloat(e.target.value) || 0})} className="h-10 bg-slate-50/50 border-slate-200" />
                </div>
             </div>
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
    </div>
  )
}
