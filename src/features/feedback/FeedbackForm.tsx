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
import { DEFAULT_TEMPLATE } from '../admin/components/FeedbackTemplateTab';

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
  const [template, setTemplate] = useState<any>(null);
  
  const [courseName, setCourseName] = useState('');
  const [trainerName, setInstructorName] = useState('N/A');
  
  const [formData, setFormData] = useState<Record<string, string>>({});
  
  const [marketingConsent, setMarketingConsent] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Initial pre-fill
    if (user?.displayName) updateForm('studentName', user.displayName);
    if (user?.email) updateForm('studentEmail', user.email);
  }, [user]);

  useEffect(() => {
    const fetchContextAndTemplate = async () => {
      try {
        let tId = null;
        if (id) {
          const courseRef = doc(db, 'courses', id);
          const courseSnap = await getDoc(courseRef);
          if (courseSnap.exists()) {
            setCourseName(courseSnap.data().title || 'Course');
            tId = courseSnap.data().tutorId;
          }
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

        if (user?.uid) {
           try {
              const uRef = doc(db, 'users', user.uid);
              const uSnap = await getDoc(uRef);
              if (uSnap.exists()) {
                 const udata = uSnap.data();
                 setFormData(prev => ({ 
                   ...prev, 
                   companyName: udata.company || udata.companyName || '',
                   studentName: udata.name || user.displayName || '',
                   studentEmail: udata.email || user.email || ''
                 }));
              }
           } catch (e) {
              console.warn("Could not load user profile", e);
           }
        }

        const applyTemplate = (tmpl: any) => {
           setTemplate(tmpl);
           setFormData(prev => {
             const newForm = { ...prev };
             tmpl.fields?.forEach((f: any) => {
               if (f.type === 'rating' && !newForm[f.id]) {
                 newForm[f.id] = '5';
               }
             });
             return newForm;
           });
        };

        // Fetch template
        try {
           const tmplRef = doc(db, 'settings', 'feedback_template');
           const tmplSnap = await getDoc(tmplRef);
           if(tmplSnap.exists()) {
              applyTemplate(tmplSnap.data());
           } else {
              applyTemplate(DEFAULT_TEMPLATE);
           }
        } catch (e) {
           console.error("Failed loading template, using default.", e);
           applyTemplate(DEFAULT_TEMPLATE);
        }

      } catch (err) {
        console.error("Failed to load context:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchContextAndTemplate();
  }, [id, sessionId]);

  const updateForm = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!template) return;
    
    // Validation
    const missingFields: string[] = [];
    template.fields.forEach((f: any) => {
       if (f.required && !formData[f.id]?.trim()) {
          missingFields.push(f.label);
       }
    });

    if (missingFields.length > 0) {
       toast.error(`Please fill in required fields: ${missingFields[0]}...`);
       return;
    }
    
    setSubmitting(true);
    try {
      
      const payload: any = {
        courseId: id,
        sessionId: sessionId || null,
        studentName: formData['studentName'] || user?.displayName || 'Anonymous',
        studentEmail: formData['studentEmail'] || user?.email || '',
        companyName: formData['companyName'] || '',
        courseName,
        trainerName,
        date: getHkDateString(),
        marketingConsent,
        createdAt: serverTimestamp()
      };

      // Add dynamic fields, parse numbers if rating
      template.fields.forEach((f: any) => {
         const val = formData[f.id] || '';
         if (f.type === 'rating') {
             payload[f.id] = val ? parseInt(val) : 0;
         } else {
             payload[f.id] = val;
         }
      });
      
      // Fallbacks for specific analytics fields if they happened to change ID but not semantics (best effort)
      if(!payload.rating && payload.overallCourseScore) payload.rating = payload.overallCourseScore;
      if(!payload.comment && formData.comment) payload.comment = formData.comment;

      await addDoc(collection(db, 'feedbacks'), payload);
      
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
                  studentName: payload.studentName,
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

  if (loading || !template) {
     return <div className="flex justify-center items-center py-24"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  }

  const renderRadioGroup = (f: any) => (
    <div key={f.id} className="py-4">
      <p className="text-sm font-medium text-slate-800 mb-3">{f.label} {f.required && <span className="text-red-500">*</span>}</p>
      <div className="flex flex-wrap gap-6 sm:gap-12 pl-2">
        {['5', '4', '3', '2', '1'].map(grade => (
          <label key={grade} className="flex items-center gap-2 cursor-pointer transition-colors hover:text-indigo-600">
            <input type="radio" className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer" 
              name={f.id} 
              value={grade} 
              checked={formData[f.id] === grade} 
              onChange={(e) => updateForm(f.id, e.target.value)} 
            />
            <span className="text-sm font-bold text-slate-700">{grade}</span>
          </label>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-500 font-sans">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">{template.title}</h1>
        <p className="text-slate-500 text-sm mt-2">{template.description}</p>
      </div>
      
      {/* Required Course Metadata Block */}
      <Card className="border-t-4 border-t-indigo-600 shadow-md">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-xs font-black uppercase tracking-wider text-slate-500">GENERAL INFORMATION</CardTitle>
          <CardDescription className="text-xs font-medium">Auto-filled data regarding the current session</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course Name</label>
               <Input value={courseName || 'Loading...'} readOnly className="bg-slate-50 font-bold text-slate-700 border-slate-200" />
             </div>
             <div className="space-y-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Instructor</label>
               <Input value={trainerName} readOnly className="bg-slate-50 font-bold text-slate-700 border-slate-200" />
             </div>
             <div className="space-y-2 md:col-span-2">
               <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</label>
               <Input value={getHkDateString()} readOnly className="bg-slate-50 font-bold text-slate-700 border-slate-200" />
             </div>
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Fields */}
      <Card className="shadow-md border-none">
        <CardContent className="p-0">
          <div className="divide-y divide-slate-100">
            {template.fields.map((f: any) => {
               if (f.type === 'rating') {
                  return (
                    <div className="p-6 md:p-8 bg-white hover:bg-slate-50/50 transition-colors" key={f.id}>
                       {renderRadioGroup(f)}
                    </div>
                  );
               } else if (f.type === 'textarea') {
                  return (
                    <div className="p-6 md:p-8 bg-white hover:bg-slate-50/50 transition-colors" key={f.id}>
                       <label className="text-sm font-medium text-slate-800 block mb-2">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                       <textarea 
                         value={formData[f.id] || ''} 
                         onChange={e => updateForm(f.id, e.target.value)} 
                         className="w-full h-24 border border-slate-200 rounded-md p-3 text-sm focus:ring-2 focus:ring-indigo-600 outline-none resize-none font-medium text-slate-700 bg-white" 
                       />
                    </div>
                  );
               } else {
                  const isReadOnly = ['studentName', 'studentEmail', 'companyName'].includes(f.id);
                  return (
                    <div className="p-6 md:p-8 bg-white hover:bg-slate-50/50 transition-colors" key={f.id}>
                       <label className="text-sm font-medium text-slate-800 block mb-2">{f.label} {f.required && <span className="text-red-500">*</span>}</label>
                       <Input 
                         value={formData[f.id] || ''} 
                         onChange={e => { if (!isReadOnly) updateForm(f.id, e.target.value); }} 
                         readOnly={isReadOnly}
                         className={`w-full h-10 border-slate-200 text-sm font-medium text-slate-700 max-w-sm ${isReadOnly ? 'bg-slate-50 opacity-70 cursor-not-allowed' : 'bg-white'}`} 
                       />
                    </div>
                  );
               }
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-slate-200 bg-transparent">
        <CardContent className="p-6">
           <label className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors shadow-sm">
              <input type="checkbox" checked={marketingConsent} onChange={e => setMarketingConsent(e.target.checked)} className="mt-1 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer" />
              <div className="text-sm text-slate-600 leading-relaxed">
                 <p className="font-bold text-slate-800 mb-1">Marketing Consent</p>
                 <p className="font-medium">Kenfil Hong Kong Limited may use my comment for marketing purpose. Please check the box to indicate your consent.</p>
                 <p className="italic mt-2 text-xs text-slate-400">Note: We assure you that your personal information will be kept confidential and will not be shared with any third party.</p>
              </div>
           </label>
           
           <div className="flex gap-4 pt-6">
              <Button type="button" variant="outline" className="w-1/3 h-12 text-xs uppercase tracking-wider font-bold shadow-sm" onClick={() => window.location.reload()}>Reset Defaults</Button>
              <Button className="w-2/3 gap-2 h-12 text-xs uppercase tracking-wider font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md active:scale-[0.98] transition-transform" onClick={handleSubmit} disabled={submitting}>
                {submitting && <Loader2 className="w-5 h-5 animate-spin"/>}
                Submit Evaluation
              </Button>
           </div>
        </CardContent>
      </Card>
      
      <div className="text-center text-xs font-medium text-slate-400 py-4">
         © {new Date().getFullYear()} Copyright: <strong className="text-slate-500 font-bold">Kenfil Hong Kong Limited</strong>
      </div>
    </div>
  );
}
