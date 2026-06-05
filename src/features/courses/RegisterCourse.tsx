import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
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

  // Bundle Mode State
  const [isBundleMode, setIsBundleMode] = useState(false);
  const [bundlePromo, setBundlePromo] = useState<any>(null);
  const [course2, setCourse2] = useState<any>(null);
  const [sessions2, setSessions2] = useState<any[]>([]);
  const [formSession2Id, setFormSession2Id] = useState('');

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

  // Auto-fill user profile info if signed in
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        studentName: user.displayName || prev.studentName || '',
        studentEmail: user.email || prev.studentEmail || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (!id) return;
    const fetchData = async () => {
      try {
        const bundlePromoId = searchParams.get('bundlePromoId');
        
        if (bundlePromoId) {
          // Fetch settings, promotions and resolve courses and sessions for both in bundle
          const [settingsSnap, promosSnap] = await Promise.all([
            getDoc(doc(db, 'settings', 'school_info')),
            getDocs(query(collection(db, 'promotions'), where('status', '==', 'active')))
          ]);

          if (settingsSnap.exists()) {
            setSchoolSettings(settingsSnap.data());
          }

          const promosList = promosSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));
          const foundBundle = promosList.find(p => p.id === bundlePromoId);

          if (foundBundle) {
            const required = foundBundle.conditions?.requiredCourseIds || [];
            if (required.length === 2) {
              const [c1Id, c2Id] = required;
              setIsBundleMode(true);
              setBundlePromo(foundBundle);
              setAppliedPromo(foundBundle);

              // Fetch course details and sessions for both courses in the bundle
              const [course1Snap, course2Snap, s1Snap, s2Snap] = await Promise.all([
                getDoc(doc(db, 'courses', c1Id)),
                getDoc(doc(db, 'courses', c2Id)),
                getDocs(query(collection(db, 'course_sessions'), where('courseId', '==', c1Id))),
                getDocs(query(collection(db, 'course_sessions'), where('courseId', '==', c2Id)))
              ]);

              if (course1Snap.exists()) {
                setCourse({ id: course1Snap.id, ...course1Snap.data() });
              }
              if (course2Snap.exists()) {
                setCourse2({ id: course2Snap.id, ...course2Snap.data() });
              }

              const s1Fetched = s1Snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((s: any) => s.sessionStatus === 'open');
              setSessions(s1Fetched);

              const s2Fetched = s2Snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((s: any) => s.sessionStatus === 'open');
              setSessions2(s2Fetched);

              if (s1Fetched.length > 0) {
                setFormData(prev => ({ ...prev, sessionId: s1Fetched[0].id }));
              }
              if (s2Fetched.length > 0) {
                setFormSession2Id(s2Fetched[0].id);
              }
            } else {
              toast.error("This bundle promotion does not correctly define two courses.");
            }
          } else {
            toast.error("Bundle promotion not found.");
          }
        } else {
          // Original Course register mode
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

          const promosList = promosSnap.docs.map(d => ({ id: d.id, ...d.data() } as any));

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
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id, preselectedSession, searchParams, user]);

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
      toast.error('Please select an intake session');
      return;
    }

    if (isBundleMode && !formSession2Id) {
      toast.error('Please select an intake session for the second course');
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
      if (isBundleMode) {
        // Compute overall bundle amount
        const s1 = sessions.find(s => s.id === formData.sessionId);
        const early1 = s1?.earlyBirdPrice || course.earlyBirdPrice;
        const std1 = s1?.standardPrice || course.standardPrice || course.price;
        const price1 = (early1 && early1 < std1) ? early1 : (std1 || 0);

        const s2 = sessions2.find(s => s.id === formSession2Id);
        const early2 = s2?.earlyBirdPrice || course2.earlyBirdPrice;
        const std2 = s2?.standardPrice || course2.standardPrice || course2.price;
        const price2 = (early2 && early2 < std2) ? early2 : (std2 || 0);

        const combinedBasePrice = price1 + price2;
        let finalAmount = combinedBasePrice;

        if (appliedPromo) {
          if (appliedPromo.discountType === 'fixed') {
            finalAmount = Math.max(0, finalAmount - appliedPromo.discountValue);
          } else if (appliedPromo.discountType === 'percentage') {
            finalAmount = Math.max(0, finalAmount - (finalAmount * (appliedPromo.discountValue / 100)));
          }
        }

        // Create Course 1 Registration (Bundle Parent)
        const parentPayload = {
          courseId: id,
          sessionId: formData.sessionId,
          studentId: user?.uid || null,
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          studentPhone: formData.studentPhone,
          company: formData.company,
          jobTitle: formData.jobTitle,
          remarks: formData.remarks + "\n[System Notes: Registered under 2-Course Bundle promotion]",
          pax,
          promoCode: appliedPromo?.code || appliedPromo?.name || null,
          promoId: appliedPromo?.id || null,
          status: 'pending',
          amount: Number(finalAmount),
          isBundleParent: true,
          peerCourseId: course2.id,
          peerSessionId: formSession2Id,
        };

        const parentRef = await addDoc(collection(db, 'registrations'), {
          ...parentPayload,
          createdAt: serverTimestamp(),
        });

        // Create Course 2 Registration (Bundle Child with amount 0)
        const childPayload = {
          courseId: course2.id,
          sessionId: formSession2Id,
          studentId: user?.uid || null,
          studentName: formData.studentName,
          studentEmail: formData.studentEmail,
          studentPhone: formData.studentPhone,
          company: formData.company,
          jobTitle: formData.jobTitle,
          remarks: formData.remarks + `\n[System Notes: Registered under 2-Course Bundle promotion. Linked Parent registration: ${parentRef.id}]`,
          pax,
          promoCode: appliedPromo?.code || appliedPromo?.name || null,
          promoId: appliedPromo?.id || null,
          status: 'pending',
          amount: 0,
          isBundleChild: true,
          parentCourseId: id,
          parentSessionId: formData.sessionId,
          parentRegistrationId: parentRef.id,
        };

        const childRef = await addDoc(collection(db, 'registrations'), {
          ...childPayload,
          createdAt: serverTimestamp(),
        });

        // Link parent to Child
        await updateDoc(doc(db, 'registrations', parentRef.id), {
          peerRegistrationId: childRef.id
        });

        toast.success("Bundle registrations submitted successfully!");
        navigate(`/payment-status/${parentRef.id}`);

      } else {
        // Standard Course Register flow
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
      }
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
      <Card className="border border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50 border-b pb-6">
          <CardTitle className="text-2xl text-slate-800">Course Payment</CardTitle>
          <CardDescription>Fill out your details to secure your spot</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          
          {/* Main Course Pricing Panels */}
          <div className="bg-indigo-50/50 border border-indigo-100 p-5 rounded-xl mb-6 space-y-4">
            <div>
              <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest mb-1">
                {isBundleMode ? '📦 Selected 2-Course Bundle' : 'Selected Course'}
              </p>
              {isBundleMode ? (
                <div className="space-y-2 mt-2">
                  <div className="flex justify-between items-start gap-4">
                     <span className="font-bold text-sm text-slate-800">1. {course.title}</span>
                     {(() => {
                        const s = sessions.find(s => s.id === formData.sessionId);
                        const early = s?.earlyBirdPrice || course.earlyBirdPrice;
                        const std = s?.standardPrice || course.standardPrice || course.price;
                        const price = (early && early < std) ? early : (std || 0);
                        return <span className="text-xs font-mono font-bold text-slate-600">${price.toLocaleString()}</span>;
                     })()}
                  </div>
                  <div className="flex justify-between items-start gap-4">
                     <span className="font-bold text-sm text-slate-800">2. {course2?.title || 'Loading second course...'}</span>
                     {(() => {
                        const s = sessions2.find(s => s.id === formSession2Id);
                        const early = s?.earlyBirdPrice || course2?.earlyBirdPrice;
                        const std = s?.standardPrice || course2?.standardPrice || course2?.price;
                        const price = (early && early < std) ? early : (std || 0);
                        return <span className="text-xs font-mono font-bold text-slate-600">${price.toLocaleString()}</span>;
                     })()}
                  </div>
                </div>
              ) : (
                <p className="font-semibold text-lg text-slate-800">{course.title}</p>
              )}
            </div>

            <div className="border-t border-indigo-100 pt-3">
              {(() => {
                let basePrice = 0;
                let earlyBirdApplied = false;

                if (isBundleMode && course && course2) {
                  const s1 = sessions.find(s => s.id === formData.sessionId);
                  const early1 = s1?.earlyBirdPrice || course.earlyBirdPrice;
                  const std1 = s1?.standardPrice || course.standardPrice || course.price;
                  const price1 = (early1 && early1 < std1) ? early1 : (std1 || 0);

                  const s2 = sessions2.find(s => s.id === formSession2Id);
                  const early2 = s2?.earlyBirdPrice || course2.earlyBirdPrice;
                  const std2 = s2?.standardPrice || course2.standardPrice || course2.price;
                  const price2 = (early2 && early2 < std2) ? early2 : (std2 || 0);

                  basePrice = price1 + price2;
                  earlyBirdApplied = (early1 && early1 < std1) || (early2 && early2 < std2);
                } else {
                  const s = sessions.find(s => s.id === formData.sessionId);
                  const early = s?.earlyBirdPrice || course.earlyBirdPrice;
                  const std = s?.standardPrice || course.standardPrice || course.price;
                  basePrice = (early && early < std) ? early : (std || 0);
                  earlyBirdApplied = (early && early < std);
                }

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
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-500 font-medium">Subtotal:</span>
                       <span className="font-semibold text-slate-700">${basePrice.toLocaleString()}</span>
                    </div>
                    {earlyBirdApplied && (
                       <div className="w-fit text-[9px] font-black uppercase tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded leading-none">
                         Early Bird Price Applied
                       </div>
                    )}
                    {appliedPromo && (
                       <div className="flex justify-between items-center text-emerald-600 font-bold text-xs mt-1">
                          <span>Discount ({appliedPromo.name}):</span>
                          <span>-${discountAmt.toLocaleString()}</span>
                       </div>
                    )}
                    <div className="flex justify-between items-center border-t border-indigo-200/50 pt-2 mt-2">
                       <span className="text-sm font-bold text-indigo-900">Total Invoice Fee:</span>
                       <span className="font-extrabold text-indigo-700 text-2xl">${totalAmount.toLocaleString()}</span>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {!isBundleMode && (
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
          )}

          <form onSubmit={handleRegister} className="space-y-4">
            
            {isBundleMode ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                    <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">1</span>
                    Session for {course.title} <span className="text-red-500">*</span>
                  </label>
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

                <div className="space-y-2">
                  <label className="text-sm font-bold text-indigo-900 flex items-center gap-1.5 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100">
                    <span className="bg-indigo-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-xs">2</span>
                    Session for {course2?.title || 'Second Course'} <span className="text-red-500">*</span>
                  </label>
                  <select 
                    required 
                    value={formSession2Id} 
                    onChange={(e) => setFormSession2Id(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
                  >
                    <option value="" disabled>Select a session</option>
                    {sessions2.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.sessionName} ({s.startDate} to {s.endDate})
                      </option>
                    ))}
                  </select>
                  {sessions2.length === 0 && <p className="text-xs text-red-500">No active sessions available for this course.</p>}
                </div>
              </div>
            ) : (
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
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
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
                <Input name="studentPhone" value={formData.studentPhone} onChange={handleChange} placeholder="91234567" />
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

            <Button type="submit" className="w-full h-12 text-md mt-4 font-bold bg-indigo-600 hover:bg-indigo-700 text-white" disabled={submitting || sessions.length === 0 || (isBundleMode && sessions2.length === 0)}>
              {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Continue to Payment
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

