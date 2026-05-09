import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, ArrowLeft, UploadCloud, CheckCircle, QrCode, CreditCard } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error';
import { toast } from 'sonner';

export function PaymentStatus() {
  const { id } = useParams<{ id: string }>();
  const [reg, setReg] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentProofBase64, setPaymentProofBase64] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'fps' | 'payme' | 'paypal'>('fps');

  useEffect(() => {
    const fetchReg = async () => {
      if (!id) return;
      try {
        const snap = await getDoc(doc(db, 'registrations', id));
        if (snap.exists()) setReg({ id: snap.id, ...snap.data() });
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

  const handleSubmitProof = async () => {
    if (!id || !paymentProofBase64) return;
    setUploading(true);
    try {
      await updateDoc(doc(db, 'registrations', id), {
        paymentProof: paymentProofBase64,
        paymentMethod: paymentMethod,
        status: 'pending_verification'
      });
      toast.success("Payment proof uploaded successfully!");
      setReg((prev: any) => ({ ...prev, status: 'pending_verification', paymentProof: paymentProofBase64, paymentMethod: paymentMethod }));
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
      await updateDoc(doc(db, 'registrations', id), {
        paymentMethod: 'paypal',
        status: 'verified'
      });
      toast.success("PayPal payment successful!");
      setReg((prev: any) => ({ ...prev, status: 'verified', paymentMethod: 'paypal' }));
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
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-medium">Invoice No:</span>
              <span className="font-mono text-slate-900">{reg.invoiceNumber || reg.id.slice(0, 8).toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Student:</span>
              <span>{reg.studentName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200 pb-2">
              <span className="font-medium">Email:</span>
              <span>{reg.studentEmail}</span>
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
