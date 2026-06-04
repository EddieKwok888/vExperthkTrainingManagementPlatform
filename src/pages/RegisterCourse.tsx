import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
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

  // Promotions State
  const [promotions, setPromotions] = useState<any[]>([]);
  const [pastCourseIds, setPastCourseIds] = useState<string[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const [pax, setPax] = useState(1);

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
        const [courseSnap, settingsSnap, promosSnap] = await Promise.all([
          getDoc(doc(db, 'courses', id)),
          getDoc(doc(db, 'settings', 'school_info')),
          getDocs(query(collection(db, 'promotions'), where('status', '==', 'active')))
        ]);

        if (courseSnap.exists()) {
          setCourse({ id: courseSnap.id, ...courseSnap.data() });
        }

        if (settingsSnap.exists()) {
          setSchoolSettings(settingsSnap.data());
        }

        const promosList = promosSnap.docs.map(d => ({ id: d.id, ...d.data() }));

        // Fetch user's past courses if user exists
        let pCourses: string[] = [];
        if (user?.uid) {
           const pastRegs = await getDocs(query(collection(db, 'registrations'), where('studentId', '==', user.uid)));
           pCourses = pastRegs.docs.filter(d => d.data().status === 'verified').map(d => d.data().courseId);
           setPastCourseIds(pCourses);
        }

        const q = query(collection(db, 'course_sessions'), where('courseId', '==', id));
        const sSnap = await getDocs(q);
        const fetchedSessions = sSnap.docs.map(d => ({ id: d.id, ...d.data() })).filter((s: any) => s.sessionStatus === 'open');
        setSessions(fetchedSessions);
        
        if (preselectedSession && fetchedSessions.some(s => s.id === preselectedSession)) {
          setFormData(prev => ({ ...prev, sessionId: preselectedSession }));
        } else if (fetchedSessions.length > 0) {
          setFormData(prev => ({ ...prev, sessionId: fetchedSessions[0].id }));
        }

        // Update list to be valid dates only
        const now = new Date();
        const validPromos = promosList.filter(p => {
           if (p.startDate && new Date(p.startDate) > now) return false;
           if (p.endDate && new Date(p.endDate) < now) return false;
           return true;
        });
        setPromotions(validPromos);

        // Auto-apply bundle promos if any match
        if (courseSnap.exists()) {
           const bundlePromo = validPromos.find(p => {
               if (p.type !== 'bundle') return false;
               
               const required = p.conditions?.requiredCourseIds || [];
               if (required.length !== 2) return false;
               
               const [c1, c2] = required;
               
               // Registering for C1, has C2 in history
               if (courseSnap.id === c1 && pCourses.includes(c2)) return true;
               // Registering for C2, has C1 in history
               if (courseSnap.id === c2 && pCourses.includes(c1)) return true;
               
               return false;
           });
           
           if (bundlePromo) {
             setAppliedPromo(bundlePromo);
             toast.success(`Bundle discount '${bundlePromo.name}' applied automatically!`);
           }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, preselectedSession, user]);

  const handleApplyPromoCode = () => {
    if (!promoCodeInput) return;
    const p = promotions.find(p => p.code?.toUpperCase() === promoCodeInput.toUpperCase() && p.type === 'code');
    if (!p) {
       toast.error("Invalid Promo Code");
       return;
    }
    if (p.applicableCourseIds && p.applicableCourseIds.length > 0 && !p.applicableCourseIds.includes(id as string)) {
       toast.error("This promo code is not applicable to this course");
       return;
    }
    setAppliedPromo(p);
    toast.success("Promo code applied!");
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
  };

  // Removed unused group promo auto apply code

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
      const s = sessions.find(s => s.id === formData.sessionId);
      const early = s?.earlyBirdPrice || course.earlyBirdPrice;
      const std = s?.standardPrice || course.standardPrice || course.price;
      let baseAmount = (early && early < std) ? early : (std || 0);
      
      if (appliedPromo) {
          if (appliedPromo.discountType === 'fixed') {
             baseAmount = Math.max(0, baseAmount - appliedPromo.discountValue);
          } else if (appliedPromo.discountType === 'percentage') {
             baseAmount = Math.max(0, baseAmount - (baseAmount * (appliedPromo.discountValue / 100)));
          }
      }

      const payload = {
        courseId: id,
        sessionId: formData.sessionId,
        studentId: user?.uid || null,
        studentName: formData.studentName,
        studentEmail: formData.studentEmail,
        studentPhone: formData.studentPhone,
        company: formData.company,
        jobTitle: formData.jobTitle,
        remarks: formData.remarks,
        pax, // Save number of tickets
        promoCode: appliedPromo?.code || null,
        promoId: appliedPromo?.id || null,
        status: 'pending',
        amount: Number(baseAmount),
      };

      const existingQ = query(collection(db, 'registrations'), where('studentEmail', '==', formData.studentEmail));
      const existingSnap = await getDocs(existingQ);
      const matchedDocs = existingSnap.docs.filter(d => d.data().sessionId === formData.sessionId);

      if (matchedDocs.length > 0) {
         const existingDoc = matchedDocs[0];
         const existingData = existingDoc.data();
         if (existingData.status === 'pending') {
             await updateDoc(doc(db, 'registrations', existingDoc.id), {
                 ...payload,
                 updatedAt: serverTimestamp()
             });
             toast.success("Registration updated!");
             navigate(`/payment-status/${existingDoc.id}`);
             return;
         } else {
             toast.error("You have already registered for this session and the payment is already in progress or completed.");
             navigate(`/payment-status/${existingDoc.id}`);
             return;
         }
      }
      
      const docRef = await addDoc(collection(db, 'registrations'), {
        ...payload,
        createdAt: serverTimestamp(),
      });
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

  let computedAmount = 0;
  if (course) {
     const s = sessions.find(s => s.id === formData.sessionId);
     const early = s?.earlyBirdPrice || course.earlyBirdPrice;
     const std = s?.standardPrice || course.standardPrice || course.price;
     let basePrice = (early && early < std) ? early : (std || 0);
     computedAmount = basePrice;
     if (appliedPromo) {
        if (appliedPromo.discountType === 'fixed') {
           computedAmount = Math.max(0, computedAmount - appliedPromo.discountValue);
        } else if (appliedPromo.discountType === 'percentage') {
           computedAmount = Math.max(0, computedAmount - (computedAmount * (appliedPromo.discountValue / 100)));
        }
     }
  }

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
                let basePrice = (early && early < std) ? early : (std || 0);
                
                let totalAmount = basePrice;
                let discountAmt = 0;

                if (appliedPromo) {
                   if (appliedPromo.discountType === 'fixed') {
                      discountAmt = appliedPromo.discountValue;
                      totalAmount = Math.max(0, totalAmount - discountAmt);
                   } else if (appliedPromo.discountType === 'percentage') {
                      discountAmt = (totalAmount * (appliedPromo.discountValue / 100));
                      totalAmount = Math.max(0, totalAmount - discountAmt);
                   }
                }

                return (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-3">
                       <p className="font-bold text-slate-800">${basePrice.toLocaleString()}</p>
                       {early && early < std && <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-100 px-2 py-0.5 rounded">Early Bird Applied</span>}
                    </div>
                    {appliedPromo && (
                       <p className="font-bold text-emerald-600">-${discountAmt.toLocaleString()} <span className="text-sm font-normal text-emerald-600/80">({appliedPromo.name})</span></p>
                    )}
                    {appliedPromo && (
                       <p className="font-bold text-blue-700 text-2xl border-t border-blue-100 pt-2 mt-1">${totalAmount.toLocaleString()} <span className="text-sm font-normal text-slate-500">Total Fee</span></p>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          <div className="mb-6 space-y-3">
             <label className="text-sm font-medium">Apply Promo Code</label>
             <div className="flex gap-2">
                <Input 
                  value={promoCodeInput} 
                  onChange={(e) => setPromoCodeInput(e.target.value)} 
                  disabled={appliedPromo !== null} 
                  placeholder="EARLYBIRD2026" 
                  className="bg-white"
                />
                {appliedPromo ? (
                  <Button variant="outline" type="button" onClick={handleRemovePromo} className="text-red-500 hover:text-red-600 hover:bg-red-50">Remove</Button>
                ) : (
                  <Button variant="secondary" type="button" onClick={handleApplyPromoCode}>Apply</Button>
                )}
             </div>
             {appliedPromo && <p className="text-sm text-emerald-600 font-medium flex items-center gap-1.5 px-1">Promo applied: {appliedPromo.name}</p>}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
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
                      {s.sessionName} ({s.startDate} to {s.endDate})
                    </option>
                  ))}
                </select>
                {sessions.length === 0 && <p className="text-xs text-red-500">No active sessions available for this course.</p>}
              </div>
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
