import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, increment } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2, ArrowLeft, UploadCloud, CheckCircle, QrCode, CreditCard } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { toast } from 'sonner';

export function PaymentStatus() {
  const { id } = useParams<{ id: string }>();
  const [reg, setReg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentProofBase64, setPaymentProofBase64] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'fps' | 'payme' | 'paypal'>('fps');
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  // Course Details State
  const [course1, setCourse1] = useState<any>(null);
  const [session1, setSession1] = useState<any>(null);
  const [course2, setCourse2] = useState<any>(null);
  const [session2, setSession2] = useState<any>(null);

  useEffect(() => {
    const fetchReg = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'registrations', id));
        if (snap.exists()) {
          const regData = { id: snap.id, ...snap.data() } as any;
          setReg(regData);

          // Fetch Course 1 and Session 1 details
          if (regData.courseId) {
            const courseSnap = await getDoc(doc(db, 'courses', regData.courseId));
            if (courseSnap.exists()) {
              setCourse1({ id: courseSnap.id, ...courseSnap.data() });
            }
          }
          if (regData.sessionId) {
            const sessionSnap = await getDoc(doc(db, 'course_sessions', regData.sessionId));
            if (sessionSnap.exists()) {
              setSession1({ id: sessionSnap.id, ...sessionSnap.data() });
            }
          }

          // Fetch Course 2 and Session 2 details (for 2-Course Bundle)
          if (regData.peerCourseId) {
            const courseSnap = await getDoc(doc(db, 'courses', regData.peerCourseId));
            if (courseSnap.exists()) {
              setCourse2({ id: courseSnap.id, ...courseSnap.data() });
            }
          }
          if (regData.peerSessionId) {
            const sessionSnap = await getDoc(doc(db, 'course_sessions', regData.peerSessionId));
            if (sessionSnap.exists()) {
              setSession2({ id: sessionSnap.id, ...sessionSnap.data() });
            }
          }
        }

        const settingsSnap = await getDoc(doc(db, 'settings', 'school_info'));
        if (settingsSnap.exists()) setSchoolSettings(settingsSnap.data());
      } catch (e) {
         handleFirestoreError(e, OperationType.GET, `registrations/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchReg();
  }, [id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error("Only image files are allowed");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentProofBase64(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateInvoiceNumber = async (regData: any) => {
    const prefix = schoolSettings?.invoice_prefix || 'INV';
    let datePart = 'unknown';
    
    if (regData?.sessionId) {
      const sSnap = await getDoc(doc(db, 'course_sessions', regData.sessionId));
      if (sSnap.exists()) {
        const sessionData = sSnap.data();
        if (sessionData?.startDate) {
          datePart = sessionData.startDate.replace(/[\s-]/g, '');
        }
      }
    }
    
    if (datePart === 'unknown') {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      datePart = `${yyyy}${mm}${dd}`;
    }
    
    const startPrefix = `${prefix}-${datePart}-`;
    const regsSnap = await getDocs(query(
      collection(db, 'registrations'),
      where('invoiceNumber', '>=', startPrefix),
      where('invoiceNumber', '<=', startPrefix + '\uf8ff')
    ));
    
    const count = regsSnap.size;
    const seq = String(count + 1).padStart(3, '0');
    return `${startPrefix}${seq}`;
  };

  const handleSubmitProof = async () => {
    if (!id || !paymentProofBase64) return;
    setUploading(true);
    try {
      const invoiceNumber = await generateInvoiceNumber(reg);

      await updateDoc(doc(db, 'registrations', id), {
        paymentProof: paymentProofBase64,
        paymentMethod: paymentMethod,
        invoiceNumber,
        status: 'pending_verification'
      });

      // Synchronously update linked bundle peer registration
      if (reg?.peerRegistrationId) {
        try {
          await updateDoc(doc(db, 'registrations', reg.peerRegistrationId), {
            paymentProof: paymentProofBase64,
            paymentMethod: paymentMethod,
            invoiceNumber,
            status: 'pending_verification'
          });
        } catch (peerErr) {
          console.error("Failed to update child registration synchronously:", peerErr);
        }
      }

      toast.success("Payment proof uploaded successfully!");
      setReg((prev: any) => ({ ...prev, status: 'pending_verification', paymentProof: paymentProofBase64, paymentMethod: paymentMethod, invoiceNumber }));
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `registrations/${id}`);
      toast.error(e.message || "Failed to upload proof");
    } finally {
      setUploading(false);
    }
  };

  const handleSimulatePayPal = async () => {
    if (!id) return;
    setUploading(true);
    try {
      const invoiceNumber = await generateInvoiceNumber(reg);

      await updateDoc(doc(db, 'registrations', id), {
        paymentMethod: 'paypal',
        invoiceNumber,
        status: 'verified'
      });

      // Synchronously verify linked child registration
      if (reg?.peerRegistrationId) {
        try {
          await updateDoc(doc(db, 'registrations', reg.peerRegistrationId), {
            paymentMethod: 'paypal',
            invoiceNumber,
            status: 'verified'
          });
        } catch (peerErr) {
          console.error("Failed to verify child registration on PayPal payment:", peerErr);
        }
      }

      if (reg?.promoId) {
        try {
          await updateDoc(doc(db, 'promotions', reg.promoId), {
            usageCount: increment(1)
          });
        } catch (promoErr) {
          console.error("Failed to increment promotion usage count:", promoErr);
        }
      }
      toast.success("PayPal payment successful!");
      setReg((prev: any) => ({ ...prev, status: 'verified', paymentMethod: 'paypal', invoiceNumber }));
    } catch (e: any) {
      handleFirestoreError(e, OperationType.UPDATE, `registrations/${id}`);
      toast.error(e.message || "Failed to process PayPal payment");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!reg) return <div className="text-center py-20">Registration not found.</div>;

  return (
    <div className="max-w-md mx-auto space-y-6">
      <Link to="/" className="text-blue-600 hover:text-blue-800 flex items-center gap-1 w-fit">
        <ArrowLeft className="w-4 h-4" /> Go Home
      </Link>
      <Card className="text-center">
        <CardHeader>
          {schoolSettings?.logo_url ? (
            <img src={schoolSettings.logo_url} alt={schoolSettings?.name} className="mx-auto h-12 mb-2 object-contain" />
          ) : (
             <div className="w-12 h-12 bg-blue-600 rounded-xl mx-auto flex items-center justify-center mb-2 shadow-sm">
                <div className="w-6 h-6 border-2 border-white rounded-full"></div>
             </div>
          )}
          <CardTitle>Electronic Bill</CardTitle>
          <CardDescription>Checkout & Payment for your enrollment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="py-2">
            <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold tracking-wide uppercase shadow-sm ${
              reg.status === 'verified' ? 'bg-green-100 text-green-700' : 
              reg.status === 'rejected' ? 'bg-red-100 text-red-700' :
              reg.status === 'pending_verification' ? 'bg-blue-100 text-blue-700' :
              'bg-yellow-100 text-yellow-700'
            }`}>
              {reg.status === 'pending' ? 'Payment Required' : (reg.status || '').replace('_', ' ')}
            </span>
          </div>
          
          <div className="bg-slate-50 p-4 rounded-lg text-left text-sm space-y-3 text-slate-600 shadow-inner">
            {reg.invoiceNumber && (
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="font-medium">Invoice No:</span>
                <span className="font-mono text-slate-900">{reg.invoiceNumber}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="font-medium">Student:</span>
              <span>{reg.studentName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-medium">Email:</span>
              <span>{reg.studentEmail}</span>
            </div>

            {/* Registered Courses Section */}
            <div className="border-b border-slate-200 pb-3 mt-1 space-y-2">
              <span className="font-bold text-xs uppercase text-indigo-700 tracking-wider block">Registered Courses</span>
              {reg.isBundleParent ? (
                <div className="space-y-2">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg text-xs leading-relaxed">
                     <p className="font-bold text-slate-800">1. {course1?.title || 'Loading course...'}</p>
                     <p className="text-slate-500 font-medium mt-0.5">Session: {session1?.sessionName || 'Loading session...'}</p>
                  </div>
                  <div className="bg-indigo-50/50 border border-indigo-100 p-2.5 rounded-lg text-xs leading-relaxed">
                     <p className="font-bold text-slate-800">2. {course2?.title || 'Loading course...'}</p>
                     <p className="text-slate-500 font-medium mt-0.5">Session: {session2?.sessionName || 'Loading session...'}</p>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50/40 border border-blue-100 p-2.5 rounded-lg text-xs leading-relaxed">
                   <p className="font-bold text-slate-800">{course1?.title || 'Loading course...'}</p>
                   <p className="text-slate-500 font-medium mt-0.5">Session: {session1?.sessionName || 'Loading session...'}</p>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-2">
              <span className="font-medium text-lg text-slate-800">Total Due:</span>
              <span className="font-bold text-xl text-blue-600">HKD ${reg.amount}</span>
            </div>
          </div>

          {reg.status === 'pending' && !reg.paymentProof && (
            <div className="space-y-6 border-t border-slate-100 pt-6">
               <p className="text-sm font-semibold text-slate-700">Select Payment Method</p>
               
               <div className="grid grid-cols-3 gap-2">
                 <Button 
                   variant={paymentMethod === 'fps' ? 'default' : 'outline'} 
                   onClick={() => setPaymentMethod('fps')}
                   className="flex flex-col h-auto py-3 gap-1 px-1"
                 >
                   <QrCode className="w-5 h-5" />
                   <span className="text-xs">FPS</span>
                 </Button>
                 <Button 
                   variant={paymentMethod === 'payme' ? 'default' : 'outline'} 
                   onClick={() => setPaymentMethod('payme')}
                   className="flex flex-col h-auto py-3 gap-1 px-1"
                 >
                   <QrCode className="w-5 h-5" />
                   <span className="text-xs">PayMe</span>
                 </Button>
                 <Button 
                   variant={paymentMethod === 'paypal' ? 'default' : 'outline'} 
                   onClick={() => setPaymentMethod('paypal')}
                   className="flex flex-col h-auto py-3 gap-1 px-1"
                 >
                   <CreditCard className="w-5 h-5" />
                   <span className="text-xs">PayPal</span>
                 </Button>
               </div>

               {(paymentMethod === 'fps' || paymentMethod === 'payme') && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                   <div className="text-center space-y-2 relative mt-4">
                     <p className="text-xs font-medium text-slate-600">Scan {paymentMethod.toUpperCase()} QR Code</p>
                     <div className="bg-slate-100 w-48 h-48 mx-auto flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 relative overflow-hidden group">
                        <QrCode className="w-16 h-16 text-slate-400 group-hover:scale-110 transition-transform" />
                        <span className="text-slate-400 font-medium text-sm mt-2">{paymentMethod.toUpperCase()} Mock</span>
                        <div className="absolute inset-0 bg-blue-50/20 mix-blend-overlay"></div>
                     </div>
                   </div>
                   
                   <div className="space-y-3 text-left mt-6">
                     <label className="text-sm font-medium text-slate-800">Upload Payment Screenshot</label>
                     <Input type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer file:cursor-pointer file:bg-blue-50 file:text-blue-700 file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 hover:file:bg-blue-100 h-11" />
                     {paymentProofBase64 && (
                        <div className="mt-4 flex flex-col items-center gap-2 border border-slate-200 p-2 rounded-lg bg-slate-50">
                           <p className="text-xs font-semibold text-slate-500 uppercase">Preview</p>
                           <img src={paymentProofBase64} alt="Preview" className="max-h-40 rounded shadow-sm" />
                        </div>
                     )}
                   </div>

                   <Button className="w-full h-12 gap-2 text-md mt-6" onClick={handleSubmitProof} disabled={!paymentProofBase64 || uploading}>
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <UploadCloud className="w-5 h-5" />}
                      Submit {paymentMethod.toUpperCase()} Proof
                   </Button>
                 </div>
               )}

               {paymentMethod === 'paypal' && (
                 <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 mt-6 space-y-4 bg-blue-50 p-6 rounded-lg border border-blue-100">
                    <p className="text-sm text-blue-800">You will be redirected to PayPal to complete your secure payment.</p>
                    <Button className="w-full h-12 gap-2 bg-[#003087] hover:bg-[#001C64] text-white" onClick={handleSimulatePayPal} disabled={uploading}>
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin"/> : <CreditCard className="w-5 h-5" />}
                      Pay with PayPal (Simulate)
                    </Button>
                 </div>
               )}
            </div>
          )}

          {reg.status === 'pending_verification' && (
             <div className="space-y-4 border-t border-slate-100 pt-6">
               <CheckCircle className="w-12 h-12 text-blue-500 mx-auto" />
               <p className="text-sm text-slate-600 leading-relaxed">
                 Thank you! We have received your {reg.paymentMethod?.toUpperCase()} payment proof. Our administration team verify your payment within 1-2 business days.
               </p>
             </div>
          )}

          {reg.status === 'verified' && (
             <div className="space-y-4 border-t border-slate-100 pt-6">
               <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
               <p className="text-sm text-slate-600 leading-relaxed font-medium">
                 Payment Verified ({reg.paymentMethod?.toUpperCase()})
               </p>
               <p className="text-sm text-slate-500">
                 Your e-bill is settled. You will receive an email shortly with your course details and receipt.
               </p>
             </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
