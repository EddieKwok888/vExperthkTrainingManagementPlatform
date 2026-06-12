import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../App';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';
import { getHkTime } from '../../lib/utils';

export function AttendPage() {
  const { token } = useParams();
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'unauthorized'>('loading');
  const [message, setMessage] = useState('Verifying attendance token...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage("Invalid token format.");
      return;
    }

    if (!user) {
      setStatus('unauthorized');
      setMessage("Please login to register your attendance.");
      return;
    }

    const processAttendance = async () => {
      try {
        let targetLessonId = '';
        
        if (token.startsWith('DYN-')) {
          const parts = token.split('-');
          if (parts.length >= 3) {
            targetLessonId = parts[1];
            
            // Verify token in database
            const tokenSnap = await getDoc(doc(db, 'attendance_tokens', targetLessonId));
            if (!tokenSnap.exists()) {
              setStatus('error');
              setMessage("Token not found. The instructor might have closed the attendance session.");
              return;
            }
            const data = tokenSnap.data();
            
            // 60 second grace period
            const isExpired = Date.now() > data.expiresAt + 60000;
            if (data.token !== token && isExpired) {
              setStatus('error');
              setMessage("Token has expired. Please scan the newest QR code on the screen.");
              return;
            }
          }
        } else if (token.startsWith('STAT-')) {
          const parts = token.split('-');
          if (parts.length >= 3) {
            targetLessonId = parts[1];
          }
        } else {
          setStatus('error');
          setMessage("Unrecognized token format.");
          return;
        }

        if (!targetLessonId) {
          setStatus('error');
          setMessage("Could not determine the lesson from token.");
          return;
        }

        let actualLessonId = targetLessonId;
        let forcedPeriod: 'AM' | 'PM' | null = null;
        
        if (targetLessonId.includes('_AM') || targetLessonId.includes('_PM')) {
          const splitParts = targetLessonId.split('_');
          actualLessonId = splitParts[0];
          forcedPeriod = splitParts[1] as 'AM' | 'PM';
        }

        // Mark attendance (AM/PM logic)
        let isAM = true;
        if (forcedPeriod) {
          isAM = forcedPeriod === 'AM';
        } else {
          // Legacy fallback
          const nowHour = getHkTime().getHours();
          isAM = nowHour < 13; 
        }
        
        const attendanceId = `${actualLessonId}_${user.uid}`;
        const attRef = doc(db, 'attendance', attendanceId);
        
        const attSnap = await getDoc(attRef);
        if (attSnap.exists()) {
          const updates: any = {};
          if (isAM) updates.present_am = true;
          else updates.present_pm = true;
          updates.updatedAt = serverTimestamp();
          
          await updateDoc(attRef, updates);
        } else {
          await setDoc(attRef, {
            lessonId: actualLessonId,
            studentId: user.uid,
            present_am: isAM,
            present_pm: !isAM,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
        }
        
        setStatus('success');
        setMessage(`Successfully checked in for the ${isAM ? 'Morning' : 'Afternoon'} session!`);

      } catch (err: any) {
        console.error(err);
        setStatus('error');
        setMessage(err.message || "An error occurred.");
      }
    };

    processAttendance();
  }, [token, user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-slate-800">Processing</h2>
            <p className="text-slate-500 mt-2">{message}</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Check-in Complete!</h2>
            <p className="text-slate-500">{message}</p>
            <Button className="mt-8 w-full" onClick={() => navigate('/student/registrations')}>
              Go to Dashboard
            </Button>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Check-in Failed</h2>
            <p className="text-slate-500">{message}</p>
            <Button variant="outline" className="mt-8 w-full" onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        )}

        {status === 'unauthorized' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-6">
              <XCircle className="w-10 h-10 text-amber-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Login Required</h2>
            <p className="text-slate-500 mb-6">{message}</p>
            <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={login}>
              Log In Now
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
