import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function RegisterCourse() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const preselectedSession = searchParams.get('session');
  
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // Form State
  const [formData, setFormData] = useState({
    studentName: '',
    studentEmail: '',
    studentPhone: '',
    company: '',
    jobTitle: '',
    sessionId: '',
    remarks: ''
  });

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const [courseSnap, settingsSnap] = await Promise.all([
          getDoc(doc(db, 'courses', id)),
          getDoc(doc(db, 'settings', 'school_info'))
        ]);

        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() });
        }

        if (settingsSnap.exists()) {
          setSchoolSettings(settingsSnap.data());
        }
        
        const q = query(collection(db, 'course_sessions'), where('courseId', '==', id), where('sessionStatus', '==', 'open'));
        const sSnap = await getDocs(q);
        const fetchedSessions = sSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        setSessions(fetchedSessions);
        
        if (preselectedSession && fetchedSessions.some(s => s.id === preselectedSession)) {
          setFormData(prev => ({ ...prev, sessionId: preselectedSession }));
        } else if (fetchedSessions.length > 0) {
          setFormData(prev => ({ ...prev, sessionId: fetchedSessions[0].id }));
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, preselectedSession]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !course) return;
    if (!formData.sessionId) {
      toast.error('Please select a session');
      return;
    }
    
    // Email Validation
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(formData.studentEmail)) {
      toast.error('Please enter a valid email address');
      return;
    }

    // Phone Validation (must be HK format: 8 digits, maybe with +852 or spaces)
    const normalizedPhone = formData.studentPhone.replace(/[\s-]/g, '');
    const phoneRe = /^(?:\+?852)?([2-9]\d{7})$/;
    if (!phoneRe.test(normalizedPhone)) {
      toast.error('Please enter a valid Hong Kong phone number');
      return;
    }

    setSubmitting(true);
    try {
      const existingQ = query(collection(db, 'registrations'), where('studentEmail', '==', formData.studentEmail), where('sessionId', '==', formData.sessionId));
      const existingSnap = await getDocs(existingQ);
      if (!existingSnap.empty) {
         toast.error("You have already registered for this session.");
         navigate(`/payment-status/${existingSnap.docs[0].id}`);
         return;
      }

      const prefix = schoolSettings?.invoice_prefix || 'INV';
      const invoiceNumber = `${prefix}-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      const s = sessions.find(s => s.id === formData.sessionId);
      const early = s?.earlyBirdPrice || course.earlyBirdPrice;
      const std = s?.standardPrice || course.standardPrice || course.price;
      const finalAmount = (early && early < std) ? early : (std || 0);

      const payload = {
        courseId: id,
        sessionId: formData.sessionId,
        invoiceNumber,
        studentId: user?.uid || null,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        studentPhone: formData.studentPhone,
        company: formData.company,
        jobTitle: formData.jobTitle,
        remarks: formData.remarks,
        status: 'pending',
        amount: Number(finalAmount),
        createdAt: serverTimestamp(),
      };
      
      const docRef = await addDoc(collection(db, 'registrations'), payload);
      toast.success("Registration submitted!");
      navigate(`/payment-status/${docRef.id}`);
    } catch(e: any) {
      console.error(e);
      toast.error(e.message || "Failed to register");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!course) return <div className="text-center py-20">Course not found.</div>;

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card>
        <CardHeader className="bg-slate-50 border-b pb-6">
          <CardTitle className="text-2xl">Course Payment</CardTitle>
          <CardDescription>Fill out your details to secure your spot</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg mb-6">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Selected Course</p>
            <p className="font-semibold text-lg text-slate-800">{course.title}</p>
            <div className="mt-2 text-xl">
              {(() => {
                const s = sessions.find(s => s.id === formData.sessionId);
                const early = s?.earlyBirdPrice || course.earlyBirdPrice;
                const std = s?.standardPrice || course.standardPrice || course.price;
                if (early && early < std) {
                  return <p className="font-bold text-amber-600">${early?.toLocaleString()} <span className="text-sm font-normal text-slate-500 line-through ml-1">${std?.toLocaleString()}</span> <span className="text-sm font-bold uppercase tracking-widest text-amber-600 ml-2 bg-amber-100 px-2 py-0.5 rounded">Early Bird</span></p>;
                }
                return <p className="font-bold text-blue-700">${std?.toLocaleString()} <span className="text-sm font-normal text-slate-500">Total Fee</span></p>;
              })()}
            </div>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Intake / Session <span className="text-red-500">*</span></label>
              <select 
                name="sessionId" 
                required 
                value={formData.sessionId} 
                onChange={handleChange}
                className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
              >
                <option value="" disabled>Select a session</option>
                {sessions.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.sessionName} ({s.startDate} to {s.endDate}) - {s.deliveryMode}
                  </option>
                ))}
              </select>
              {sessions.length === 0 && <p className="text-xs text-red-500">No active sessions available for this course.</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Full Name <span className="text-red-500">*</span></label>
                <Input name="studentName" required value={formData.studentName} onChange={handleChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Email Address <span className="text-red-500">*</span></label>
                <Input type="email" name="studentEmail" required value={formData.studentEmail} onChange={handleChange} placeholder="john@example.com" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Phone Number</label>
                <Input name="studentPhone" value={formData.studentPhone} onChange={handleChange} placeholder="+1 234 567 890" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Company</label>
                <Input name="company" value={formData.company} onChange={handleChange} placeholder="Acme Corp" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Job Title</label>
              <Input name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="Software Engineer" />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Remarks or Special Requirements</label>
              <textarea 
                name="remarks"
                value={formData.remarks}
                onChange={handleChange}
                placeholder="Any dietary requirements or special accommodations?"
                className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2"
              />
            </div>

            <Button type="submit" className="w-full h-12 text-md mt-4" disabled={submitting || sessions.length === 0}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue to Payment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
