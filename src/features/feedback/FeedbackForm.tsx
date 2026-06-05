import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, getDocs, collection, addDoc, query, where, serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { getHkDateString } from '../../lib/utils';
import { AuthContext } from '../../App';
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
  const dateStr = new Date().toLocaleDateString();
  doc.text(`Issue Date: ${dateStr}`, 148, 175, { align: 'center' });
  doc.text(`Certificate ID: ${cert.id || 'N/A'}`, 148, 182, { align: 'center' });
  doc.setFillColor(234, 179, 8);
  doc.circle(148, 195, 12, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.text("OFFICIAL", 148, 196, { align: 'center' });
  doc.save(`Certificate-${cert.course_title || cert.courseTitle || 'Course'}.pdf`);
};

export function FeedbackForm() {
  const { id } = useParams<{ id: string }>(); // represents courseId
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session');
  
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  const [loading, setLoading] = useState(true);
  const [courseName, setCourseName] = useState('');
  const [trainerName, setInstructorName] = useState('N/A');
  
  // Basic info
  const [studentName, setStudentName] = useState(user?.displayName || '');
  const [studentEmail, setStudentEmail] = useState(user?.email || '');
  const [companyName, setCompanyName] = useState('');
  
  // Part A Ratings
  const [contentScore, setContentScore] = useState('');
  const [levelScore, setLevelScore] = useState('');
  const [materialsScore, setMaterialsScore] = useState('');
  const [facilitiesScore, setFacilitiesScore] = useState('');
  const [practiceScore, setPracticeScore] = useState('');
  const [jobApplicabilityScore, setJobApplicabilityScore] = useState('');
  const [overallCourseScore, setOverallCourseScore] = useState('');
  
  // Part A Text
  const [usefulTopics, setUsefulTopics] = useState('');
  const [leastUsefulTopics, setLeastUsefulTopics] = useState('');
  const [meetObjective, setMeetObjective] = useState('');
  
  // Part B Ratings
  const [tutorKnowledgeScore, setTutorKnowledgeScore] = useState('');
  const [tutorOrganizationScore, setTutorOrganizationScore] = useState('');
  const [tutorPresentationScore, setTutorPresentationScore] = useState('');
  const [tutorAttentionScore, setTutorAttentionScore] = useState('');
  const [overallTutorScore, setOverallTutorScore] = useState('');
  
  // Part C
  const [comments, setComments] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(true);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        if (!id) return;
        const courseRef = doc(db, 'courses', id);
        const courseSnap = await getDoc(courseRef);
        let tId = null;
        if (courseSnap.exists()) {
          setCourseName(courseSnap.data().title || 'Course');
          tId = courseSnap.data().tutorId;
        }
        
        if (sessionId) {
           const sessionRef = doc(db, 'course_sessions', sessionId);
           const sessionSnap = await getDoc(sessionRef);
           if (sessionSnap.exists() && sessionSnap.data().tutorId) {
              tId = sessionSnap.data().tutorId;
           }
        }
        
        if (tId) {
           try {
             const tutorRef = doc(db, 'users', tId);
             const tutorSnap = await getDoc(tutorRef);
             if (tutorSnap.exists()) {
                setInstructorName(tutorSnap.data().name || 'N/A');
             }
           } catch (e) {
             console.warn("Could not load tutor profile");
           }
        }
      } catch (err) {
        console.error("Failed to load context:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContext();
  }, [id, sessionId]);

  const handleSubmit = async () => {
    if (!id || !studentName.trim() || !studentEmail.trim() || !companyName.trim()) {
      toast.error('Please fill in all required fields (marked with *).');
      return;
    }
    
    // Validate that all radio buttons are checked
    if (!contentScore || !levelScore || !materialsScore || !facilitiesScore || !practiceScore || !jobApplicabilityScore || !overallCourseScore || !tutorKnowledgeScore || !tutorOrganizationScore || !tutorPresentationScore || !tutorAttentionScore || !overallTutorScore) {
       toast.error('Please rate all dimensions in Part A and Part B.');
       return;
    }
    
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'feedbacks'), {
        courseId: id,
        sessionId: sessionId || null,
        studentName,
        studentEmail,
        companyName,
        courseName,
        trainerName,
        date: getHkDateString(),
        
        // Part A Course
        contentScore: parseInt(contentScore),
        levelScore: parseInt(levelScore),
        materialsScore: parseInt(materialsScore),
        facilitiesScore: parseInt(facilitiesScore),
        practiceScore: parseInt(practiceScore),
        jobApplicabilityScore: parseInt(jobApplicabilityScore),
        overallCourseScore: parseInt(overallCourseScore),
        
        // Part A Text
        usefulTopics,
        leastUsefulTopics,
        meetObjective,
        
        // Part B Instructor
        tutorKnowledgeScore: parseInt(tutorKnowledgeScore),
        tutorOrganizationScore: parseInt(tutorOrganizationScore),
        tutorPresentationScore: parseInt(tutorPresentationScore),
        tutorAttentionScore: parseInt(tutorAttentionScore),
        overallTutorScore: parseInt(overallTutorScore),
        
        rating: parseInt(overallCourseScore), // Keep for backward compatibility
        comment: comments, // Keep for backward compatibility
        
        // Part C
        comments,
        marketingConsent,
        
        createdAt: serverTimestamp()
      });
      
      // Auto-issue certificate since feedback is completed
      if (sessionId && user?.email) {
         try {
           const regsSnap = await getDocs(query(
             collection(db, 'registrations'),
             where('studentEmail', '==', user.email),
             where('sessionId', '==', sessionId)
           ));
           
           if (!regsSnap.empty) {
              const regId = regsSnap.docs[0].id;
              // Check if certificate already exists to avoid duplicates
              const existingCertSnap = await getDocs(query(
                 collection(db, 'certificates'), 
                 where('registrationId', '==', regId),
                 where('studentEmail', '==', user.email)
              ));
              
              if (existingCertSnap.empty) {
                const certData = {
                  studentId: user.uid,
                  studentEmail: user.email,
                  studentName: studentName,
                  courseId: id,
                  course_title: courseName,
                  registrationId: regId,
                  issuedAt: serverTimestamp()
                };
                const newDocRef = await addDoc(collection(db, 'certificates'), certData);
                generateCertificatePDF({ ...certData, id: newDocRef.id });
              } else {
                generateCertificatePDF(existingCertSnap.docs[0].data());
              }
           }
         } catch (err) {
           console.error("Failed to auto-issue certificate:", err);
         }
      }

      toast.success("Feedback submitted! Your certificate has been downloaded.");
      navigate('/student/registrations');
    } catch(e: any) {
      console.error(e);
      toast.error(e.message || "Failed to submit feedback");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
     return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  }

  const renderRadioGroup = (label: string, value: string, setter: (val: string) => void) => (
    <div className="py-3">
      <p className="text-sm font-medium text-slate-800 mb-3">{label}</p>
      <div className="flex flex-wrap gap-6 sm:gap-12 pl-2">
        {['5', '4', '3', '2', '1'].map(grade => (
          <label key={grade} className="flex items-center gap-2 cursor-pointer transition-colors hover:text-blue-600">
            <input type="radio" className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer" name={label} value={grade} checked={value === grade} onChange={(e) => setter(e.target.value)} />
            <span className="text-sm">{grade}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-900 uppercase tracking-widest">COURSE EVALUATION QUESTIONNAIRE</h1>
        <p className="text-slate-500 text-sm mt-1">課程問卷</p>
      </div>
      
      <Card className="border-t-4 border-t-blue-600 shadow-md">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg uppercase tracking-wider text-slate-800">GENERAL INFORMATION 基本資料：</CardTitle>
          <CardDescription>Fields marked with an * are required.<br/>* 號標記的欄位必須填寫。</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Course Name 課程名稱 *</label>
               <Input value={courseName || 'Loading...'} readOnly className="bg-slate-50 font-medium text-slate-600" />
             </div>
             
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Date 日期 :</label>
               <Input value={getHkDateString()} readOnly className="bg-slate-50 font-medium text-slate-600" />
             </div>
             
             <div className="space-y-2 md:col-span-2">
               <label className="text-sm font-bold text-slate-700">Instructor 課程導師 *</label>
               <Input value={trainerName} readOnly className="bg-slate-50 font-medium text-slate-600 text-sm" />
             </div>
             
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Student Name 學生姓名 *</label>
               <Input value={studentName} onChange={e => setStudentName(e.target.value)} />
             </div>
             
             <div className="space-y-2">
               <label className="text-sm font-bold text-slate-700">Email 電郵地址 *</label>
               <Input type="email" value={studentEmail} onChange={e => setStudentEmail(e.target.value)} />
             </div>
             
             <div className="space-y-2 md:col-span-2">
               <label className="text-sm font-bold text-slate-700">Company Name 機構名稱 *</label>
               <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
             </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-md">
        <CardHeader className="bg-indigo-50 border-b border-indigo-100 pb-4">
           <CardTitle className="text-lg uppercase tracking-wider text-slate-800">PART A 第一部分 - COURSE EVALUATION 課程評分：</CardTitle>
           <CardDescription className="text-slate-600">Please rate the course according to the following dimensions by checking the appropriate boxes.<br/>請作出對此課程的評分，根據以下項目填上適當意見。<br/><span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 mt-2 inline-block rounded font-mono">(Highest 最高:5; Lowest 最低:1)</span></CardDescription>
        </CardHeader>
        <CardContent className="pt-6 divide-y divide-slate-100">
           {renderRadioGroup("Content of the course 內容:", contentScore, setContentScore)}
           {renderRadioGroup("Level of the course 程度:", levelScore, setLevelScore)}
           {renderRadioGroup("Course material usefulness 教材 :", materialsScore, setMaterialsScore)}
           {renderRadioGroup("Teaching aids, facilities & environment 設施 :", facilitiesScore, setFacilitiesScore)}
           {renderRadioGroup("Adequacy of practice/exercise 練習 :", practiceScore, setPracticeScore)}
           {renderRadioGroup("Job applicability / usefulness 實用 :", jobApplicabilityScore, setJobApplicabilityScore)}
           {renderRadioGroup("OVERALL 整體評分 :", overallCourseScore, setOverallCourseScore)}
           
           <div className="py-4 space-y-2">
               <label className="text-sm font-medium text-slate-800 block mb-2">What topic(s) did you find most useful and interesting? 你對哪些課題最有興趣?</label>
               <textarea value={usefulTopics} onChange={e => setUsefulTopics(e.target.value)} className="w-full h-24 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
           </div>
           
           <div className="py-4 space-y-2">
               <label className="text-sm font-medium text-slate-800 block mb-2">What topic(s) did you find least useful and interesting? 你認為哪些課題較沉悶?</label>
               <textarea value={leastUsefulTopics} onChange={e => setLeastUsefulTopics(e.target.value)} className="w-full h-24 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
           </div>
           
           <div className="py-4 space-y-2">
               <label className="text-sm font-medium text-slate-800 block mb-2">Did the course meet the course objective? If not, why? 你認為此課程能達到課程目標? 如果未能，請列出原因。</label>
               <textarea value={meetObjective} onChange={e => setMeetObjective(e.target.value)} className="w-full h-24 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-blue-600 outline-none resize-none" />
           </div>
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader className="bg-emerald-50 border-b border-emerald-100 pb-4">
           <CardTitle className="text-lg uppercase tracking-wider text-slate-800">PART B 第二部分 - TRAINER(S) EVALUATION 對導師評分：</CardTitle>
           <CardDescription className="text-slate-600">Please rate the trainer's performance according to the following dimensions.<br/>請作出對導師的評分，根據以下項目填上適當意見。<br/><span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 mt-2 inline-block rounded font-mono">(Highest 最高:5; Lowest 最低:1)</span></CardDescription>
        </CardHeader>
        <CardContent className="pt-6 divide-y divide-slate-100">
           {renderRadioGroup("Knowledge of the subject 科目的認識:", tutorKnowledgeScore, setTutorKnowledgeScore)}
           {renderRadioGroup("Organization & Logic 教學編排:", tutorOrganizationScore, setTutorOrganizationScore)}
           {renderRadioGroup("Presentation & communication skills 表達技巧 :", tutorPresentationScore, setTutorPresentationScore)}
           {renderRadioGroup("Individual attention given 對學生的照顧 :", tutorAttentionScore, setTutorAttentionScore)}
           {renderRadioGroup("OVERALL 整體評分 :", overallTutorScore, setOverallTutorScore)}
        </CardContent>
      </Card>
      
      <Card className="shadow-md">
        <CardHeader className="bg-amber-50 border-b border-amber-100 pb-4">
           <CardTitle className="text-lg uppercase tracking-wider text-slate-800">PART C 第三部分 - ANY OTHER COMMENTS 其他意見：</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
           <textarea 
             value={comments} 
             onChange={e => setComments(e.target.value)} 
             placeholder="Comments" 
             className="flex min-h-[120px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 resize-none"
           />
           
           <label className="flex items-start gap-3 p-4 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors">
              <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} className="mt-1 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer" />
              <div className="text-sm text-slate-600 leading-relaxed">
                 <p className="font-semibold text-slate-800">Kenfil Hong Kong Limited may use my comment for marketing purpose.</p>
                 <p>Please check the box to indicate your consent.</p>
                 <p className="italic mt-1 text-xs">Note: We assure you that your personal information will be kept confidential and will not be shared with any third party.</p>
              </div>
           </label>
           
           <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="w-1/3 h-12 text-xs uppercase tracking-wider font-bold" onClick={() => window.location.reload()}>Reset 重新設定</Button>
              <Button className="w-2/3 gap-2 h-12 text-xs uppercase tracking-wider font-bold bg-blue-600 hover:bg-blue-700 text-white" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="w-5 h-5 animate-spin"/>}
                Submit 提交
              </Button>
           </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-xs text-slate-400 py-4">
         © 2026 Copyright: <strong className="text-slate-500">Kenfil Hong Kong Limited</strong>
      </div>
    </div>
  )
}
