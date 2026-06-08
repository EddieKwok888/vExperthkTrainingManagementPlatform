import React, { useState, useEffect, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { db, auth } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Loader2, ArrowLeft, BookOpen, CreditCard, Award, MessageSquare, User as UserIcon, Calendar, CheckCircle2, XCircle, FileText, Download, Mail, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { formatHkDate } from '../../lib/utils';
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
  
  useEffect(() => {
    fetchStudentData();
  }, [targetId]);

  const fetchStudentData = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      // 1. Fetch Student Profile
      const studentDoc = await getDoc(doc(db, 'users', targetId));
      if (studentDoc.exists()) {
        setStudent({ id: studentDoc.id, ...studentDoc.data() });
      } else {
        toast.error("Student not found");
        setLoading(false);
        return;
      }

      // 2. Fetch Registrations (Courses & Payment Records)
      const regQ = query(collection(db, 'registrations'), where('studentId', '==', targetId));
      const regSnap = await getDocs(regQ);
      const regList = regSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
      setRegistrations(regList);

      // Collect unique session, course, and tutor IDs
      const sessionIds = [...new Set(regList.filter(r => r.sessionId).map(r => r.sessionId))];
      const courseIds = [...new Set(regList.filter(r => r.courseId).map(r => r.courseId))];

      // Fetch Sessions
      const sessionMap: Record<string, any> = {};
      const tutorIds = new Set<string>();
      if (sessionIds.length > 0) {
        // Firestore 'in' query supports up to 10 items. For robustness, fetch independently or chunk.
        // We'll chunk to be safe.
        for (let i = 0; i < sessionIds.length; i += 10) {
           const chunk = sessionIds.slice(i, i + 10);
           const sQ = query(collection(db, 'course_sessions'), where('__name__', 'in', chunk));
           const sSnap = await getDocs(sQ);
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
           const cQ = query(collection(db, 'courses'), where('__name__', 'in', chunk));
           const cSnap = await getDocs(cQ);
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
           const tQ = query(collection(db, 'users'), where('__name__', 'in', chunk));
           const tSnap = await getDocs(tQ);
           tSnap.docs.forEach(d => {
             tutorMap[d.id] = { id: d.id, ...d.data() };
           });
         }
      }
      setTutors(tutorMap);

      // 3. Fetch Attendance
      const attQ = query(collection(db, 'attendance'), where('studentId', '==', targetId));
      const attSnap = await getDocs(attQ);
      setAttendance(attSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 4. Fetch Certificates
      const certQ = query(collection(db, 'certificates'), where('studentId', '==', targetId));
      const certSnap = await getDocs(certQ);
      setCertificates(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));

      // 5. Fetch Evaluations (Assuming a collection student_evaluations or feedbacks about the student)
      // Since evaluating students isn't explicitly defined before, we check for 'student_evaluations'
      try {
        const evalQ = query(collection(db, 'student_evaluations'), where('studentId', '==', targetId), orderBy('createdAt', 'desc'));
        const evalSnap = await getDocs(evalQ);
        setEvaluations(evalSnap.docs.map(d => ({ id: d.id, ...d.data() })));
      } catch (e) {
        // Fallback or ignore if indexing not ready
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
    const course = courses[reg.courseId];
    const session = sessions[reg.sessionId];
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("Payment Receipt", 105, 20, { align: "center" });

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    let y = 40;
    
    doc.text(`Receipt No: ${reg.invoiceNumber || 'N/A'}`, 20, y);
    y += 10;
    doc.text(`Date: ${formatHkDate(reg.createdAt)}`, 20, y);
    y += 10;
    doc.text(`Student Name: ${student?.name || reg.studentName}`, 20, y);
    y += 10;
    doc.text(`Student Email: ${student?.email || reg.studentEmail}`, 20, y);
    y += 15;
    
    doc.setLineWidth(0.5);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont("helvetica", "bold");
    doc.text("Description", 20, y);
    doc.text("Amount", 160, y);
    y += 8;
    
    doc.setLineWidth(0.2);
    doc.line(20, y, 190, y);
    y += 10;

    doc.setFont("helvetica", "normal");
    const itemName = `${course?.title || 'Course'} (${session?.sessionName || 'Session'})`;
    const splitTitle = doc.splitTextToSize(itemName, 130);
    doc.text(splitTitle, 20, y);
    doc.text(`HKD ${reg.amount || 0}`, 160, y);
    
    y += (splitTitle.length * 6) + 10;
    
    doc.line(20, y, 190, y);
    y += 10;
    
    doc.setFont("helvetica", "bold");
    doc.text("Total Paid:", 120, y);
    doc.text(`HKD ${reg.amount || 0}`, 160, y);
    y += 10;
    doc.text(`Payment Method: ${reg.paymentMethod || 'Online'}`, 120, y);

    doc.save(`Receipt_${reg.invoiceNumber || 'Payment'}.pdf`);
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

  const activeRegistrations = registrations.filter(r => r.status === 'verified');

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
          <TabsTrigger value="evaluations" className="py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg flex items-center gap-2 text-sm font-medium">
             <MessageSquare className="w-4 h-4"/> <span className="hidden sm:inline">Instructor Evaluations</span>
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
                    ) : (activeRegistrations.map((reg) => {
                      const course = courses[reg.courseId];
                      const session = sessions[reg.sessionId];
                      const tutor = tutors[session?.tutorId];
                      const rate = getAttendanceRate(reg.sessionId);
                      
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-medium">{course?.title || 'Unknown Course'}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                               <span>{session?.sessionName || 'Unknown Session'}</span>
                               <span className="text-xs text-slate-400 font-mono">{session?.startDate} - {session?.endDate}</span>
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
                    ) : (registrations.sort((a,b) => b.createdAt?.toMillis() - a.createdAt?.toMillis()).map((reg) => {
                      const course = courses[reg.courseId];
                      return (
                        <TableRow key={reg.id}>
                          <TableCell className="font-mono text-xs">{reg.invoiceNumber || '-'}</TableCell>
                          <TableCell className="text-sm">{formatHkDate(reg.createdAt)}</TableCell>
                          <TableCell className="font-medium text-slate-700">{course?.title || 'Unknown Course'}</TableCell>
                          <TableCell>HKD {reg.amount || 0}</TableCell>
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
                      )
                    }))}
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
                      <TableHead>Certificate ID</TableHead>
                      <TableHead>Course Title</TableHead>
                      <TableHead>Issue Date</TableHead>
                      <TableHead className="text-right">View</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {certificates.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-slate-500 h-24">No certificates issued yet.</TableCell></TableRow>
                    ) : (certificates.map((cert) => {
                      return (
                        <TableRow key={cert.id}>
                          <TableCell className="font-mono text-xs text-slate-500">{cert.id}</TableCell>
                          <TableCell className="font-medium text-slate-800">{cert.courseTitle || cert.course_title}</TableCell>
                          <TableCell className="text-sm">{formatHkDate(cert.issuedAt || cert.issued_at)}</TableCell>
                          <TableCell className="text-right">
                             {/* In a real app, this could open a PDF view */}
                             <Button variant="ghost" size="sm" className="h-8 px-2 text-indigo-600"><FileText className="w-4 h-4"/></Button>
                          </TableCell>
                        </TableRow>
                      )
                    }))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 4. Instructor Evaluations */}
          <TabsContent value="evaluations" className="m-0 focus:outline-none">
            <Card className="border-slate-200 shadow-sm border-t-4 border-t-purple-500 overflow-hidden">
              <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                <CardTitle className="text-lg flex items-center gap-2"><MessageSquare className="w-5 h-5 text-purple-500"/> Instructor Evaluations</CardTitle>
                <CardDescription>Feedback and remarks provided by instructors.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 bg-slate-50/30">
                {evaluations.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                     <MessageSquare className="w-12 h-12 text-slate-200 mb-3" />
                     <p>No evaluations have been submitted for this student yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {evaluations.map((ev, index) => {
                       const tutor = tutors[ev.tutorId];
                       const course = courses[ev.courseId];
                       return (
                         <div key={ev.id || index} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                               <div>
                                 <p className="font-medium text-slate-800">{course?.title || 'Unknown Course'}</p>
                                 <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                                    <span className="flex items-center gap-1"><UserIcon className="w-3 h-3"/> {tutor?.name || 'Instructor'}</span>
                                    <span>•</span>
                                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3"/> {formatHkDate(ev.createdAt)}</span>
                                 </div>
                               </div>
                               <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded text-lg font-bold">
                                 {ev.rating ? `${ev.rating} / 5` : ''}
                               </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">{ev.comment || ev.remarks}</p>
                         </div>
                       )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
