import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy, getDocFromServer, getDocsFromServer, documentId } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Loader2, ArrowLeft, BookOpen, CreditCard, Award, MessageSquare, User as UserIcon, Calendar, CheckCircle2, XCircle, FileText, Download, Mail, Phone, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { formatHkDate, getHkDateString } from '../../lib/utils';
import { jsPDF } from 'jspdf';

export function StudentProfile() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { role, user } = useContext(AuthContext);
  const targetId = id || user?.uid;
  
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<any[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]); // tutor evaluations
  const [sessions, setSessions] = useState<Record<string, any>>({});
  const [courses, setCourses] = useState<Record<string, any>>({});
  const [tutors, setTutors] = useState<Record<string, any>>({});
  const [schoolInfo, setSchoolInfo] = useState<any>({});
  
  useEffect(() => {
    fetchStudentData();
  }, [targetId]);

  const fetchStudentData = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      // Fetch School Info
      const schoolDoc = await getDocFromServer(doc(db, 'settings', 'school_info'));
      if (schoolDoc.exists()) setSchoolInfo(schoolDoc.data());

      // 1. Fetch Student Profile
      const studentDoc = await getDocFromServer(doc(db, 'users', targetId));
      let studentData = null;
      if (studentDoc.exists()) {
        studentData = { id: studentDoc.id, ...studentDoc.data() } as any;
        setStudent(studentData);
      } else {
        toast.error("Student not found");
        setLoading(false);
        return;
      }

      // 2. Fetch Registrations (Courses & Payment Records)
      const regQById = query(collection(db, 'registrations'), where('studentId', '==', targetId));
      const regSnapById = await getDocsFromServer(regQById);
      const regListById = regSnapById.docs.map(d => ({ id: d.id, ...d.data() } as any));
      
      let regListByEmail: any[] = [];
      if (studentData.email) {
        const regQByEmail = query(collection(db, 'registrations'), where('studentEmail', '==', studentData.email));
        const regSnapByEmail = await getDocsFromServer(regQByEmail);
        regListByEmail = regSnapByEmail.docs.map(d => ({ id: d.id, ...d.data() } as any));
      }
      
      // Merge uniquely by id
      const regMap = new Map();
      regListById.forEach(r => regMap.set(r.id, r));
      regListByEmail.forEach(r => regMap.set(r.id, r));
      const regList = Array.from(regMap.values());
      
      setRegistrations(regList);

      // Collect unique session, course, and tutor IDs
      const sessionIds = [...new Set(regList.flatMap(r => [r.sessionId, r.peerSessionId]).filter(Boolean))];
      const courseIds = [...new Set(regList.flatMap(r => [r.courseId, r.peerCourseId]).filter(Boolean))];

      // Fetch Sessions
      const sessionMap: Record<string, any> = {};
      const tutorIds = new Set<string>();
      if (sessionIds.length > 0) {
        // Firestore 'in' query supports up to 10 items. For robustness, fetch independently or chunk.
        // We'll chunk to be safe.
        for (let i = 0; i < sessionIds.length; i += 10) {
           const chunk = sessionIds.slice(i, i + 10);
           const sQ = query(collection(db, 'course_sessions'), where(documentId(), 'in', chunk));
           const sSnap = await getDocsFromServer(sQ);
           sSnap.docs.forEach(d => {
             sessionMap[d.id] = { id: d.id, ...d.data() };
             if (d.data().tutorId) tutorIds.add(d.data().tutorId);
           });
        }
      }
      setSessions(sessionMap);

      // Fetch Courses
      const courseMap: Record<string, any> = {};
      if (courseIds.length > 0) {
        for (let i = 0; i < courseIds.length; i += 10) {
           const chunk = courseIds.slice(i, i + 10);
           const cQ = query(collection(db, 'courses'), where(documentId(), 'in', chunk));
           const cSnap = await getDocsFromServer(cQ);
           cSnap.docs.forEach(d => {
             courseMap[d.id] = { id: d.id, ...d.data() };
           });
        }
      }
      setCourses(courseMap);

      // Fetch Tutors
      const tutorMap: Record<string, any> = {};
      if (tutorIds.size > 0) {
         const tList = Array.from(tutorIds);
         for (let i = 0; i < tList.length; i += 10) {
           const chunk = tList.slice(i, i + 10);
           const tQ = query(collection(db, 'users'), where(documentId(), 'in', chunk));
           const tSnap = await getDocsFromServer(tQ);
           tSnap.docs.forEach(d => {
             tutorMap[d.id] = { id: d.id, ...d.data() };
           });
         }
      }
      setTutors(tutorMap);

      // 3. Fetch Attendance
      const attDocs: any[] = [];
      if (sessionIds.length > 0) {
        for (let i = 0; i < sessionIds.length; i += 10) {
          const chunk = sessionIds.slice(i, i + 10);
          const attSnap = await getDocsFromServer(query(collection(db, 'attendance'), where('sessionId', 'in', chunk)));
          attDocs.push(...attSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        }
      }
      
      const myRegistrationIds = new Set(regList.map((r: any) => r.id));
      const myAtt = attDocs.filter(a => 
        a.studentId === targetId || 
        myRegistrationIds.has(a.registrationId) || 
        myRegistrationIds.has(a.studentId) ||
        (studentData?.email && a.studentEmail === studentData.email)
      );
      setAttendance(myAtt);

      // 4. Fetch Certificates
      let certList: any[] = [];
      const certMap = new Map();

      // Query by studentId
      const certQById = query(collection(db, 'certificates'), where('studentId', '==', targetId));
      const certSnapById = await getDocsFromServer(certQById);
      certSnapById.docs.forEach(d => certMap.set(d.id, { id: d.id, ...d.data() }));

      // Query by email
      if (studentData?.email) {
        const certQByEmail = query(collection(db, 'certificates'), where('studentEmail', '==', studentData.email));
        const certSnapByEmail = await getDocsFromServer(certQByEmail);
        certSnapByEmail.docs.forEach(d => certMap.set(d.id, { id: d.id, ...d.data() }));
      }

      // Query by registration IDs (since old certs might only have registrationId)
      if (regList.length > 0) {
        const regIds = regList.map(r => r.id);
        // Firestore 'in' query supports up to 10 items
        for (let i = 0; i < regIds.length; i += 10) {
          const chunk = regIds.slice(i, i + 10);
          const certQByReg = query(collection(db, 'certificates'), where('registrationId', 'in', chunk));
          const certSnapByReg = await getDocsFromServer(certQByReg);
          certSnapByReg.docs.forEach(d => certMap.set(d.id, { id: d.id, ...d.data() }));
        }
      }

      certList = Array.from(certMap.values());
      setCertificates(certList);

      // 5. Fetch Evaluations
      try {
        const evalQById = query(collection(db, 'student_evaluations'), where('studentId', '==', targetId), orderBy('createdAt', 'desc'));
        const evalSnapById = await getDocsFromServer(evalQById);
        let evalList = evalSnapById.docs.map(d => ({ id: d.id, ...d.data() }));

        if (studentData?.email) {
           const evalQByEmail = query(collection(db, 'student_evaluations'), where('studentEmail', '==', studentData.email), orderBy('createdAt', 'desc'));
           const evalSnapByEmail = await getDocsFromServer(evalQByEmail);
           const emailEvals = evalSnapByEmail.docs.map(d => ({ id: d.id, ...d.data() }));
           const evalMap = new Map();
           evalList.forEach(e => evalMap.set(e.id, e));
           emailEvals.forEach(e => evalMap.set(e.id, e));
           evalList = Array.from(evalMap.values());
        }
        setEvaluations(evalList);
      } catch (e) {
        console.log("No student evaluations found or missing index.");
      }

    } catch (error: any) {
      console.error(error);
      toast.error("Failed to load student profile");
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceRate = (sessionId: string) => {
     const sessionAtts = attendance.filter(a => a.sessionId === sessionId);
     if (sessionAtts.length === 0) return 0;
     const present = sessionAtts.filter(a => a.status === 'present' || a.status === 'present_am' || a.status === 'present_pm' || a.status === 'AM' || a.status === 'PM').length;
     return Math.round((present / sessionAtts.length) * 100);
  };

  const handleDownloadReceipt = (reg: any) => {
    const doc = new jsPDF();

    // Header
    if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith("data:image")) {
      try {
        doc.addImage(schoolInfo.logo_url, "PNG", 20, 10, 25, 25);
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
    doc.text("OFFICIAL RECEIPT", 105, 55, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Receipt No: ${reg.invoiceNumber || "N/A"}`, 20, 70);
    doc.text(`Date: ${formatHkDate(reg.createdAt)}`, 140, 70);

    // Student Info
    doc.setFontSize(11);
    doc.text("Billed To:", 20, 85);
    doc.setFontSize(12);
    doc.text(student?.name || reg.studentName || "N/A", 20, 92);
    doc.setFontSize(10);
    doc.text(student?.email || reg.studentEmail || "N/A", 20, 97);

    // Itemized Table
    doc.setDrawColor(200);
    doc.rect(20, 110, 170, 60);
    doc.line(20, 120, 190, 120);

    doc.setFontSize(10);
    doc.text("Description", 25, 117);
    doc.text("Amount", 160, 117);

    if (reg.courseList && reg.courseList.length > 1) {
      let yOffset = 0;
      reg.courseList.forEach((title: string, index: number) => {
        const titleText = doc.splitTextToSize(`${index + 1}. ${title}`, 125);
        doc.text(titleText, 25, 130 + yOffset);
        if (index === 0) {
           doc.text(`HKD ${reg.totalAmount || reg.amount || 0}`, 160, 130 + yOffset);
        }
        yOffset += titleText.length * 5;
      });
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`(Bundle Special Deal)`, 25, 130 + yOffset);
      doc.setFontSize(10);
      doc.setTextColor(0);
    } else {
      const singleTitle = reg.courseList?.[0] || courses[reg.courseId]?.title || "Course Payment";
      const title1 = doc.splitTextToSize(singleTitle, 125);
      doc.text(title1, 25, 130);
      doc.text(`HKD ${reg.totalAmount || reg.amount || 0}`, 160, 130);
    }

    // Total
    doc.line(140, 170, 190, 170);
    doc.setFontSize(12);
    doc.text("Total Paid:", 140, 180);
    doc.text(`HKD ${reg.totalAmount || reg.amount || 0}`, 170, 180);

    // Payment Method
    doc.setFontSize(10);
    doc.text(`Payment Method: ${reg.paymentMethod || "N/A"}`, 20, 180);
    doc.text(`Status: ${reg.status?.toUpperCase() || "N/A"}`, 20, 185);

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
    doc.text("Thank you for your business!", 105, 270, { align: "center" });

    doc.save(`${reg.invoiceNumber || "receipt"}_${student?.name || reg.studentName || "student"}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!student) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
        <UserIcon className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Student Profile Not Found</h2>
        <Button variant="outline" onClick={() => navigate('/admin')}><ArrowLeft className="w-4 h-4 mr-2"/> Back to Dashboard</Button>
      </div>
    );
  }
  // Remove the strict filter so that pending/other statuses also display
  const activeRegistrations = registrations;

  return (
    <div className="space-y-6 w-full max-w-full pb-12">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="rounded-full shadow-sm bg-white border border-slate-200">
          <ArrowLeft className="w-5 h-5"/>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Student 360 View <span className="ml-2 uppercase text-[10px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold">{student.role}</span>
          </h1>
          <p className="text-slate-500 text-sm">Comprehensive profile and activity records</p>
        </div>
        <div className="ml-auto">
           <Button variant="outline" size="sm" onClick={fetchStudentData} className="gap-2 bg-white"><RefreshCw className="w-4 h-4"/> Refresh Data</Button>
        </div>
      </div>

      {/* Top Level Info Card */}
      <Card className="bg-white border-none shadow-sm overflow-hidden">
         <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
         <CardContent className="px-6 pb-6 pt-0 sm:px-10 relative">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end -mt-12 mb-6">
                <div className="w-24 h-24 rounded-full bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden shrink-0">
                   <div className="w-full h-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-bold uppercase">
                      {student.name ? student.name.substring(0, 2) : student.email.substring(0, 2)}
                   </div>
                </div>
                <div className="flex-1 pb-1">
                   <h2 className="text-2xl font-bold text-slate-800">{student.name}</h2>
                   <div className="flex items-center gap-4 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1.5"><Mail className="w-4 h-4"/> {student.email}</span>
                      {student.phone && <span className="flex items-center gap-1.5"><Phone className="w-4 h-4"/> {student.phone}</span>}
                   </div>
                </div>
                <div className="flex flex-col items-end gap-2 pb-1 text-right">
                   <div className="text-xs uppercase font-semibold tracking-wider text-slate-400">Account Status</div>
                   <span className={`px-3 py-1 rounded-full text-xs font-bold ${student.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-700'}`}>
                     {student.status || 'Active'}
                   </span>
                   <div className="text-[10px] text-slate-400 mt-1">Joined {formatHkDate(student.createdAt)}</div>
                </div>
            </div>
         </CardContent>
      </Card>

      <Tabs defaultValue="courses" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-slate-100/50 p-1 rounded-xl h-auto">
          <TabsTrigger value="courses" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 text-sm font-medium">
             <BookOpen className="w-4 h-4"/> <span className="hidden sm:inline">Courses & Attendance</span>
          </TabsTrigger>
          <TabsTrigger value="payments" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 text-sm font-medium">
             <CreditCard className="w-4 h-4"/> <span className="hidden sm:inline">Payment Records</span>
          </TabsTrigger>
          <TabsTrigger value="certificates" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 text-sm font-medium">
             <Award className="w-4 h-4"/> <span className="hidden sm:inline">Certificates</span>
          </TabsTrigger>

        </TabsList>

        <div className="mt-6">
          {/* 1. Courses and Attendance */}
          <TabsContent value="courses" className="m-0 focus:outline-none">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-indigo-500 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-indigo-500"/> Enrolled Courses & Attendance</CardTitle>
                <CardDescription>Overview of courses the student has joined and their attendance rate.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead>Course Name</TableHead>
                      <TableHead>Session Intake</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Attendance %</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeRegistrations.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-slate-500 h-24">No courses enrolled yet.</TableCell></TableRow>
                    ) : (Array.from(new Map(
                       activeRegistrations
                         .filter(reg => reg.courseId && reg.sessionId)
                         .map(reg => [reg.sessionId, { id: reg.id, courseId: reg.courseId, sessionId: reg.sessionId }])
                    ).values()).sort((a: any, b: any) => {
                      const sessionA = sessions[a.sessionId] || {};
                      const sessionB = sessions[b.sessionId] || {};
                      const todayStr = getHkDateString();
                      
                      const getScore = (session: any, sessionId: string) => {
                        if (!session.id) return 2;
                        const status = session.sessionStatus || 'active';
                        const isPast = (session.endDate || session.startDate || '') < todayStr;
                        const rate = getAttendanceRate(sessionId);
                        
                        if ((status === 'confirmed' || status === 'full') && rate === 100) return 4;
                        if ((status === 'confirmed' || status === 'full') && !isPast) return 1;
                        if ((status === 'confirmed' || status === 'full' || status === 'completed') && isPast) return 3;
                        return 2; // open or others
                      };
                      
                      const scoreA = getScore(sessionA, a.sessionId);
                      const scoreB = getScore(sessionB, b.sessionId);
                      
                      if (scoreA !== scoreB) {
                        return scoreA - scoreB;
                      }
                      
                      // if same score, sort by date
                      const dateA = sessionA.startDate || '';
                      const dateB = sessionB.startDate || '';
                      
                      // for past courses, sort newest first (descending). for others, sort closest first (ascending)
                      if (scoreA === 3) {
                         return dateB.localeCompare(dateA);
                      }
                      return dateB.localeCompare(dateA);
                    }).map((record) => {
                      const course = courses[record.courseId];
                      const session = sessions[record.sessionId];
                      const tutor = tutors[session?.tutorId as string];
                      const rate = getAttendanceRate(record.sessionId);
                      
                      const formatSessionDate = (dString?: string) => {
                         if (!dString) return '';
                         const parts = dString.split('-');
                         if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                         return dString;
                      };
                      const startStr = formatSessionDate(session?.startDate);
                      const endStr = formatSessionDate(session?.endDate);
                      const displayDate = startStr === endStr ? startStr : (startStr && endStr ? `${startStr} - ${endStr}` : (startStr || endStr));
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{course?.title || 'Unknown Course'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                               <span>{course?.title ? `${course.title} - ${startStr}` : (session?.sessionName || 'Unknown Session')}</span>
                               <span className="text-xs text-slate-400 font-mono">{displayDate}</span>
                            </div>
                          </TableCell>
                          <TableCell>{tutor?.name || 'N/A'}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded text-xs font-medium border ${
                               session?.sessionStatus === 'completed' ? 'text-green-600 border-green-200 bg-green-50' : 
                               session?.sessionStatus === 'open' ? 'text-blue-600 border-blue-200 bg-blue-50' : (session?.sessionStatus === 'full' || session?.sessionStatus === 'confirmed') ? 'text-amber-600 border-amber-200 bg-amber-50' : 'text-slate-600 border-slate-200 bg-slate-50'
                            }`}>
                              {(session?.sessionStatus === 'full' || session?.sessionStatus === 'confirmed') ? 'Confirmed' : (session?.sessionStatus || 'active')}
                            </span>
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex flex-col items-center justify-center gap-1">
                               <span className={`text-sm font-bold ${rate > 80 ? 'text-green-600' : rate > 50 ? 'text-amber-600' : 'text-slate-600'}`}>
                                 {rate}%
                               </span>
                               <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full ${rate > 80 ? 'bg-green-500' : rate > 50 ? 'bg-amber-500' : 'bg-slate-400'}`} style={{ width: `${rate}%` }}></div>
                               </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    }))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 2. Payment Records */}
          <TabsContent value="payments" className="m-0 focus:outline-none">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-emerald-500 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><CreditCard className="w-5 h-5 text-emerald-500"/> Payment Records</CardTitle>
                <CardDescription>History of course fees paid and official receipts.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead>Invoice No.</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Receipt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrations.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center text-slate-500 h-24">No payment records found.</TableCell></TableRow>
                    ) : (
                      (() => {
                        const grouped = Array.from(registrations.reduce((acc, reg) => {
                          const key = reg.invoiceNumber || reg.id;
                          if (!acc.has(key)) {
                             acc.set(key, { 
                               ...reg, 
                               courseList: [courses[reg.courseId]?.title].filter(Boolean),
                               totalAmount: Number(reg.amount || 0)
                             });
                          } else {
                             const existing = acc.get(key);
                             const cTitle = courses[reg.courseId]?.title;
                             if (cTitle && !existing.courseList.includes(cTitle)) {
                               existing.courseList.push(cTitle);
                             }
                             existing.totalAmount += Number(reg.amount || 0);
                          }
                          return acc;
                        }, new Map()).values());

                        grouped.sort((a: any, b: any) => {
                          const invA = a.invoiceNumber || '';
                          const invB = b.invoiceNumber || '';
                          if (invA !== invB) return invB.localeCompare(invA);
                          const timeA = a.createdAt?.toMillis?.() || 0;
                          const timeB = b.createdAt?.toMillis?.() || 0;
                          return timeB - timeA;
                        });

                        return grouped.map((reg: any) => (
                          <TableRow key={reg.id}>
                            <TableCell className="font-mono text-xs">{reg.invoiceNumber || '-'}</TableCell>
                            <TableCell className="text-sm">{formatHkDate(reg.createdAt)}</TableCell>
                            <TableCell className="font-medium text-slate-700">
                              {reg.courseList.length > 0 ? (
                                <div className="flex flex-col gap-1">
                                  {reg.courseList.map((title: string, i: number) => (
                                    <span key={i} className="flex items-center gap-1.5">
                                      {reg.courseList.length > 1 && <span className="w-1 h-1 rounded-full bg-slate-400"></span>}
                                      {title}
                                    </span>
                                  ))}
                                </div>
                              ) : 'Unknown Course'}
                            </TableCell>
                            <TableCell>HKD {reg.totalAmount}</TableCell>
                            <TableCell>{reg.paymentMethod || 'Online'}</TableCell>
                            <TableCell>
                              {reg.status === 'verified' ? (
                                 <span className="px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1"><CheckCircle2 className="w-3 h-3"/> Paid</span>
                              ) : reg.status === 'rejected' ? (
                                 <span className="px-2 py-1 rounded text-xs font-semibold bg-red-100 text-red-700 inline-flex items-center gap-1"><XCircle className="w-3 h-3"/> Rejected</span>
                              ) : (
                                 <span className="px-2 py-1 rounded text-xs font-semibold bg-amber-100 text-amber-700 inline-flex items-center gap-1">Pending</span>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {reg.status === 'verified' && (
                                <Button variant="outline" size="sm" onClick={() => handleDownloadReceipt(reg)} className="h-8 text-xs gap-1.5">
                                  <Download className="w-3.5 h-3.5" /> Download
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ));
                      })()
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 3. Certificates */}
          <TabsContent value="certificates" className="m-0 focus:outline-none">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-amber-500 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-amber-500"/> Certificates Achieved</CardTitle>
                <CardDescription>Official certificates issued to the student upon completing programs.</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.length === 0 ? (
                      <TableRow><TableCell colSpan={3} className="text-center text-slate-500 h-24">No certificates issued yet.</TableCell></TableRow>
                    ) : (certificates.map((cert) => {
                      return (
                        <TableRow key={cert.id}>
                          <TableCell className="font-medium text-slate-800">{cert.courseTitle || cert.course_title}</TableCell>
                          <TableCell className="text-sm">{formatHkDate(cert.issuedAt || cert.issued_at)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => {
                               const doc = new jsPDF({ orientation: "landscape" });
                               doc.setFillColor(240, 248, 255);
                               doc.rect(0, 0, 297, 210, "F");
                               doc.setDrawColor(37, 99, 235);
                               doc.setLineWidth(2);
                               doc.rect(10, 10, 277, 190, "S");
                               if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith("data:image")) {
                                 try { doc.addImage(schoolInfo.logo_url, "PNG", 133, 15, 30, 30); } catch (e) {}
                               }
                               doc.setTextColor(30, 58, 138);
                               doc.setFontSize(40);
                               doc.text("Certificate of Completion", 148, 65, { align: "center" });
                               doc.setTextColor(100, 116, 139);
                               doc.setFontSize(16);
                               doc.text("This is to certify that", 148, 90, { align: "center" });
                               doc.setTextColor(15, 23, 42);
                               doc.setFontSize(30);
                               doc.text(cert.studentName || student?.name || student?.displayName || "Student", 148, 110, { align: "center" });
                               doc.setTextColor(100, 116, 139);
                               doc.setFontSize(16);
                               doc.text("has successfully completed the course", 148, 130, { align: "center" });
                               doc.setTextColor(37, 99, 235);
                               doc.setFontSize(24);
                               doc.text(cert.courseTitle || cert.course_title || "Course", 148, 150, { align: "center" });
                               doc.setTextColor(100, 116, 139);
                               doc.setFontSize(12);
                               let issueDateStr = "N/A";
                               if (cert.issuedAt || cert.issued_at) {
                                 const dVal = cert.issuedAt || cert.issued_at;
                                 const d = new Date(dVal.seconds ? dVal.seconds * 1000 : dVal);
                                 if (!isNaN(d.getTime())) {
                                   issueDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                                 }
                               } else {
                                 const d = new Date();
                                 issueDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
                               }
                               doc.text(`Issue Date: ${issueDateStr}`, 148, 180, { align: "center" });
                               doc.save(`${(cert.courseTitle || "Certificate").replace(/\s+/g, "_")}.pdf`);
                            }} className="h-8 text-xs gap-1.5 border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                              <Download className="w-3.5 h-3.5" /> Download
                            </Button>
                          </TableCell>
                        </TableRow>
                      )
                    }))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>


        </div>
      </Tabs>
    </div>
  );
}
