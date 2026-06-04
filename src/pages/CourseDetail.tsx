import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { AuthContext } from '../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2, Calendar, Clock, MapPin, Sparkles, GraduationCap, FileText } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error';
import { toast } from 'sonner';

import { jsPDF } from 'jspdf';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const { user, role, login } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourse = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'courses', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setCourse({ id: docSnap.id, ...docSnap.data() });
        } else {
          toast.error("Course not found");
        }

        const settingsRef = doc(db, 'settings', 'school_info');
        const settingsSnap = await getDoc(settingsRef);
        if (settingsSnap.exists()) {
          setSchoolSettings(settingsSnap.data());
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `courses/${id}`);
      } finally {
        setLoading(false);
      }
    };
    
    const fetchSessions = async () => {
      if (!id) return;
      try {
        const q = query(
          collection(db, 'course_sessions'), 
          where('courseId', '==', id), 
          where('sessionStatus', '==', 'open')
        );
        const snap = await getDocs(q);
        const sessionDocs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        if (sessionDocs.length > 0) {
           const regSnap = await getDocs(query(collection(db, 'registrations'), where('courseId', '==', id), where('status', '==', 'verified')));
           const regs = regSnap.docs.map(d => d.data());
           
           sessionDocs.forEach((s: any) => {
              s.enrolledCount = regs.filter(r => r.sessionId === s.id).length;
           });
        }
        
        setSessions(sessionDocs);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingSessions(false);
      }
    };

    fetchCourse();
    fetchSessions();
  }, [id]);

  const handleEnroll = (sessionId?: string) => {
    if (sessionId) {
      navigate(`/register/${id}?session=${sessionId}`);
    } else {
      navigate(`/register/${id}`);
    }
  };

  const handleAskAI = () => {
    // We can dispatch a custom event that the ChatBot component will listen to
    const event = new CustomEvent('open-chatbot', { 
      detail: { initialMessage: `Tell me more about the course "${course?.title}".` }
    });
    window.dispatchEvent(event);
  };

  const formatTextWithWarning = (text: string) => {
    if (!text) return null;
    const regex = /(warning\b[^\n]*)/i; // match the word warning and the rest of the line
    const parts = text.split(/(warning\b[^\n]*)/i);
    return parts.map((part, i) => 
      part.toLowerCase().startsWith('warning') ? <span key={i} className="text-red-600 font-bold">{part}</span> : <span key={i}>{part}</span>
    );
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!course) return <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">Course not found</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <Link to="/" className="group text-slate-500 hover:text-blue-600 flex items-center gap-2 w-fit font-bold uppercase text-[10px] tracking-widest transition-colors">
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> Back to Course Catalog
      </Link>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card className="shadow-2xl shadow-slate-200/50 border-0 overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="bg-gradient-to-br from-slate-900 to-slate-800 border-b pb-12 pt-10 px-8 relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                 <GraduationCap className="w-40 h-40 text-white rotate-12" />
              </div>
              <div className="space-y-6 relative z-10">
                <CardTitle className="text-4xl md:text-5xl font-black leading-tight text-white tracking-tighter italic">{course.title}</CardTitle>
                <div className="flex flex-wrap items-center gap-3">
                  {course.courseCode && (
                    <span className="bg-white/20 text-white px-3 py-1 rounded-[4px] text-xs font-bold uppercase tracking-widest font-mono">
                      {course.courseCode}
                    </span>
                  )}
                  {course.category && (
                    <span className="bg-blue-500/30 text-blue-100 px-3 py-1 rounded-[4px] text-xs font-bold uppercase tracking-widest">
                      {course.category}
                    </span>
                  )}
                  {course.level && (
                    <span className="bg-emerald-500/30 text-emerald-100 px-3 py-1 rounded-[4px] text-xs font-bold uppercase tracking-widest">
                      {course.level}
                    </span>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="py-10 px-8">
              <div className="space-y-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {course.targetAudience && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-blue-500" /> Target Audience
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{formatTextWithWarning(course.targetAudience)}</p>
                    </div>
                  )}
                  {course.prerequisites && (
                    <div className="space-y-2">
                      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-green-500" /> Prerequisites
                      </h3>
                      <p className="text-slate-600 text-sm leading-relaxed font-medium whitespace-pre-wrap">{formatTextWithWarning(course.prerequisites)}</p>
                    </div>
                  )}
                </div>

                <div className="h-px bg-slate-100" />

                <div>
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Course Framework & Modules</h3>
                  <div className="space-y-6">
                    {course.description && (
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 italic text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {formatTextWithWarning(course.description)}
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {course.durationHours && (
                        <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <Clock className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Duration</p>
                            <p className="text-slate-800 font-bold">{course.durationHours} Teaching Hours</p>
                          </div>
                        </div>
                      )}
                      {course.certificateAvailable && (
                        <div className="flex items-center gap-4 bg-slate-50 p-5 rounded-2xl border border-slate-100 transition-all hover:bg-white hover:shadow-md group">
                          <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
                            <CheckCircle2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Certification</p>
                            <p className="text-slate-800 font-bold">{course.certName || 'Professional Certificate'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-xl shadow-slate-200/50 border-0 ring-1 ring-slate-100 overflow-hidden">
             <CardHeader className="bg-slate-50/50 pb-6 border-b border-slate-100">
                <CardTitle className="text-lg font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" /> Upcoming Intakes
                </CardTitle>
                <CardDescription className="text-xs font-bold uppercase tracking-widest text-slate-400">Secure your spot in the next session</CardDescription>
             </CardHeader>
             <CardContent className="p-0">
                {loadingSessions ? (
                  <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-300 w-8 h-8" /></div>
                ) : sessions.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 italic font-medium flex flex-col items-center gap-4">
                    <Calendar className="w-12 h-12 opacity-10" />
                    <p>No active intakes currently scheduled.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {sessions.map(s => (
                      <div key={s.id} className="p-6 flex flex-col sm:flex-row justify-between sm:items-center gap-6 hover:bg-slate-50/50 transition-colors group">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 font-black text-slate-800 tracking-tight text-lg">
                            {s.sessionName || 'Intake Session'}
                          </div>
                          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <Calendar className="w-3.5 h-3.5 text-blue-400" /> {s.startDate}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <Clock className="w-3.5 h-3.5 text-slate-400" /> {s.startTime} - {s.endTime}
                            </div>
                            <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                              <MapPin className="w-3.5 h-3.5 text-slate-400" /> {s.deliveryMode}
                            </div>
                            {s.quota && (
                              <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                                <span className={s.enrolledCount >= s.quota ? 'text-red-500' : 'text-green-500'}>
                                  ● {s.enrolledCount || 0}/{s.quota} Filled
                                </span>
                              </div>
                            )}
                            {(s.earlyBirdPrice || s.standardPrice || s.price) && (
                              <div className="flex flex-col col-span-2 pt-2 border-t border-slate-100 mt-2">
                                {(s.earlyBirdPrice && s.earlyBirdPrice < (s.standardPrice || s.price)) ? (
                                  <div className="flex flex-wrap items-baseline gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest bg-amber-100 text-amber-800 px-2 py-0.5 rounded-sm">Early Bird</span>
                                    <span className="text-xl font-bold text-amber-600">HK${s.earlyBirdPrice.toLocaleString()}</span>
                                    <span className="text-xs font-medium text-slate-400 line-through">HK${(s.standardPrice || s.price).toLocaleString()}</span>
                                  </div>
                                ) : (
                                  <div className="flex items-baseline gap-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Standard Fee</span>
                                    <span className="text-lg font-bold text-slate-800">HK${(s.standardPrice || s.price)?.toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleEnroll(s.id)} 
                          className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 h-11 px-8 font-black uppercase tracking-widest text-[10px] group-hover:scale-105 transition-transform"
                          disabled={s.enrolledCount >= s.quota}
                        >
                          {s.enrolledCount >= s.quota ? 'Waitlist Only' : 'Register Now'}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="border-0 shadow-2xl shadow-blue-900/10 ring-1 ring-blue-100 overflow-hidden sticky top-8">
             <CardContent className="pt-8 space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-medium">Life-time access to materials</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-medium">Expert-led instruction</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
                    <span className="text-sm font-medium">Graduation certificate included</span>
                  </div>
                </div>

                <div className="h-px bg-slate-100" />

                <div className="space-y-3">
                  <Button className="w-full h-14 text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-blue-200 bg-blue-600 hover:bg-blue-700" onClick={() => handleEnroll()}>
                    Start Registration
                  </Button>
                </div>

                <p className="text-[9px] text-center text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                  Need corporate pricing? <br/>
                  {schoolSettings?.email ? (
                    <a href={`mailto:${schoolSettings.email}`} className="text-blue-500 hover:text-blue-600 transition-colors">
                      Contact our sales team
                    </a>
                  ) : (
                    <span className="text-blue-500">Contact our sales team</span>
                  )}
                </p>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
