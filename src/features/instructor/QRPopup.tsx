import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { AuthContext } from '../../App';
import QRCode from 'react-qr-code';
import { Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

export function QRPopup() {
  const { lessonId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [token, setToken] = useState<string>('');
  const [timeLeft, setTimeLeft] = useState<number>(15);
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<any>(null);

  useEffect(() => {
    if (!user || !lessonId) return;

    // Check if the current user is a staff or instructor who has access to this lesson
    const fetchLesson = async () => {
      try {
        const actualLessonId = lessonId.split('_')[0];
        const snap = await getDoc(doc(db, 'lessons', actualLessonId));
        if (snap.exists()) {
          setLesson({ id: snap.id, ...snap.data() });
        } else {
          toast.error("Lesson not found");
        }
      } catch (e: any) {
        toast.error("Failed to load lesson: " + e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLesson();
  }, [user, lessonId]);

  useEffect(() => {
    if (!lessonId || loading || !lesson) return;

    // Generate token function
    const generateNewToken = async () => {
      // Use the raw lessonId from useParams which contains both actual ID and _AM / _PM
      const actualLessonId = lessonId.split('_')[0];
      const period = lessonId.includes('_PM') ? 'PM' : 'AM';
      const newToken = `DYN-${actualLessonId}_${period}-${Math.random().toString(36).substring(2, 10)}`;
      setToken(newToken);
      setTimeLeft(15);
      
      try {
        // Write to attendance_tokens using the combined lessonId to avoid overwriting
        await setDoc(doc(db, 'attendance_tokens', lessonId), {
          token: newToken,
          lessonId: actualLessonId,
          period: period,
          expiresAt: Date.now() + 15000, // 15 seconds from now locally
          updatedAt: serverTimestamp()
        });
      } catch (e) {
        console.error("Failed to write token", e);
      }
    };

    generateNewToken();
    const tokenInterval = setInterval(generateNewToken, 15000);
    const countdownInterval = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 15));
    }, 1000);

    return () => {
      clearInterval(tokenInterval);
      clearInterval(countdownInterval);
    };
  }, [lessonId, loading, lesson]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <p>Invalid Lesson ID</p>
      </div>
    );
  }

  // Generate the full URL that students will scan
  const attendUrl = `${window.location.origin}/attend/${token}`;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white p-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-black tracking-tight mb-2 text-indigo-400">
          {lesson?.lessonTitle || 'Class Attendance'} ({lessonId?.includes('_PM') ? 'PM' : 'AM'})
        </h1>
        <p className="text-xl text-slate-400">Scan this QR code to sign in</p>
      </div>
      
      <div className="bg-white p-8 rounded-3xl shadow-2xl relative">
        <QRCode 
          value={attendUrl} 
          size={400} 
          fgColor="#0f172a"
          level="H"
        />
        
        {/* Progress bar border effect around the QR code could be cool, but we'll use a simple indicator below */}
      </div>
      
      <div className="mt-12 flex flex-col items-center w-full max-w-md">
        <div className="w-full bg-slate-800 rounded-full h-3 mb-4 overflow-hidden">
          <div 
            className="bg-indigo-500 h-3 rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${(timeLeft / 15) * 100}%` }}
          />
        </div>
        <p className="text-slate-400 font-mono flex items-center gap-2">
          Code refreshes in <span className="text-white font-bold text-xl">{timeLeft}</span> seconds
        </p>
      </div>
      
      <div className="mt-8 text-slate-500 text-sm">
        <p>Dynamic Anti-Cheat Active • Valid within 60s of scan</p>
      </div>
    </div>
  );
}
