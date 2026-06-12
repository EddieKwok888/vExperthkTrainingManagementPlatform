import React, { useEffect, useState, useContext } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AuthContext } from '../../App';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Loader2, ArrowLeft, CheckCircle2, Calendar, Clock, MapPin, Sparkles, GraduationCap, FileText } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/error';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog';

import { jsPDF } from 'jspdf';
import { WarningTextFormatter } from '../../components/ui/WarningTextFormatter';

export function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [isOutlineModalOpen, setIsOutlineModalOpen] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const { user, role, login } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const fromPath = searchParams.get('from') || '/';
  const fromText = fromPath.includes('student') ? 'Back to Student Dashboard' : 'Back to Course Catalog';

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
           const regSnap = await getDocs(query(collection(db, 'registrations'), where('courseId', '==', id)));
           const regs = regSnap.docs.map(d => d.data()).filter((r: any) => r.status === 'verified');
           
           sessionDocs.forEach((s: any) => {
              s.enrolledCount = regs.filter(r => r.sessionId === s.id).length;
           });
        }
        
        sessionDocs.sort((a: any, b: any) => {
          const dateA = a.startDate || '';
          const dateB = b.startDate || '';
          return dateA.localeCompare(dateB);
        });
        
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

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;
  if (!course) return <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 text-slate-400">Course not found</div>;

  return (
    <div className="bg-[#0A0F1C] min-h-screen px-4 pt-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        <Link to={fromPath} className="group text-slate-400 hover:text-blue-400 flex items-center gap-2 w-fit font-black uppercase text-[10px] tracking-widest transition-colors mb-6">
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" /> {fromText}
        </Link>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Card className="bg-[#111827] border border-slate-800 shadow-[0_0_50px_-10px_rgba(59,130,246,0.15)] overflow-hidden rounded-3xl relative">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none z-10"></div>
              <CardHeader className="bg-[#0D1426] border-b border-slate-800 pb-16 pt-12 px-10 relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10 mix-blend-color-dodge"></div>
                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none transform translate-x-10 -translate-y-10">
                   <GraduationCap className="w-64 h-64 text-blue-500 rotate-12 blur-[2px]" />
                </div>
                <div className="absolute bottom-0 left-0 p-8 opacity-20 pointer-events-none blur-3xl">
                  <div className="w-64 h-64 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="space-y-8 relative z-20">
                  <CardTitle className="text-4xl md:text-5xl font-black leading-tight text-white tracking-tighter drop-shadow-md">{course.title}</CardTitle>
                  <div className="flex flex-wrap items-center gap-3">
                    {course.courseCode && (
                      <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest font-mono shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                        {course.courseCode}
                      </span>
                    )}
                    {course.category && (
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest">
                        {course.category}
                      </span>
                    )}
                    {course.level && (
                      <span className="bg-slate-800 border border-slate-700 text-slate-300 px-4 py-1.5 rounded-sm text-[10px] font-black uppercase tracking-widest">
                        {course.level}
                      </span>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="py-12 px-10 relative z-20">
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {course.targetAudience && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <MapPin className="w-3 h-3 text-indigo-400" /> Target Audience
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap"><WarningTextFormatter text={course.targetAudience} /></p>
                      </div>
                    )}
                    {course.prerequisites && (
                      <div className="space-y-2">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Prerequisites
                        </h3>
                        <p className="text-slate-300 text-sm leading-relaxed font-medium whitespace-pre-wrap"><WarningTextFormatter text={course.prerequisites} /></p>
                      </div>
                    )}
                  </div>

                  <div className="h-px bg-slate-800" />

                  <div>
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-6">Course Framework & Modules</h3>
                    <div className="space-y-6">
                      {course.description && (
                        <div className="bg-[#0D1426] p-6 rounded-2xl border border-slate-800 text-slate-400 text-sm leading-relaxed whitespace-pre-wrap shadow-inner font-medium">
                          <WarningTextFormatter text={course.description} />
                        </div>
                      )}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {course.durationHours && (
                          <div className="flex items-center gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-800 transition-all hover:border-blue-500/30 group">
                            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:scale-110 transition-transform border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Total Duration</p>
                              <p className="text-slate-200 font-bold tracking-tight">{course.durationHours} Teaching Hours</p>
                            </div>
                          </div>
                        )}
                        {course.outlineData && course.outlineData.startsWith('http') && (
                          <div className="flex items-center gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-800 transition-all hover:border-purple-500/30 group cursor-pointer" onClick={() => {
                               window.open(course.outlineData, '_blank');
                               toast.success('Course outline opened!');
                          }}>
                            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.1)]">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Course Outline</p>
                              <p className="text-slate-200 font-bold tracking-tight line-clamp-1">View Document</p>
                            </div>
                          </div>
                        )}
                        {course.certificateAvailable && (
                          <div className="flex items-center gap-4 bg-[#111827] p-5 rounded-2xl border border-slate-800 transition-all hover:border-emerald-500/30 group">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                              <CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                              <p className="text-[9px] font-black uppercase tracking-widest text-slate-500">Certification</p>
                              <p className="text-slate-200 font-bold tracking-tight">{course.certName || 'Professional Certificate'}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

          <Card className="shadow-[0_0_40px_-15px_rgba(59,130,246,0.2)] border border-slate-800 bg-[#111827] overflow-hidden rounded-3xl mt-12 relative">
             <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none blur-3xl">
               <div className="w-64 h-64 bg-indigo-500 rounded-full"></div>
             </div>
             <CardHeader className="bg-[#0D1426]/50 border-b border-slate-800 px-8 py-8 relative z-10">
                <CardTitle className="text-2xl font-black text-white tracking-tight flex items-center gap-3">
                  <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20"><Calendar className="w-6 h-6" /></div> Upcoming Intakes
                </CardTitle>
                <CardDescription className="text-sm font-semibold uppercase tracking-widest text-slate-500 mt-2">Secure your spot in the next session</CardDescription>
             </CardHeader>
             <CardContent className="p-0 relative z-10">
                {loadingSessions ? (
                  <div className="p-16 flex justify-center"><Loader2 className="animate-spin text-blue-500 w-10 h-10" /></div>
                ) : sessions.length === 0 ? (
                  <div className="p-16 text-center text-slate-600 italic font-medium flex flex-col items-center gap-4">
                    <Calendar className="w-16 h-16 opacity-10" />
                    <p className="text-lg">No active intakes currently scheduled.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {sessions.map(s => (
                      <div key={s.id} className="p-8 flex flex-col md:flex-row justify-between md:items-center gap-8 hover:bg-[#1f2937]/50 transition-all duration-300 group">
                        <div className="space-y-4 flex-1">
                          <div className="flex items-center gap-2 font-black text-white tracking-tight text-xl" title={`${course.courseCode ? course.courseCode + ' ' : ''}${course.title} - ${s.startDate || 'TBD'}`}>
                            {course.courseCode ? <span className="text-blue-400 font-mono">{course.courseCode}</span> : ''} {course.title} <span className="text-slate-700 font-normal mx-1">|</span> <span className="text-slate-400">{s.startDate || 'TBD'}</span>
                          </div>
                          <div className="flex flex-wrap gap-x-8 gap-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800 border border-slate-700 px-3 py-1 rounded-md">
                              <Calendar className="w-4 h-4 text-blue-400" /> {s.startDate}
                            </div>
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest bg-slate-800 border border-slate-700 px-3 py-1 rounded-md">
                              <MapPin className="w-4 h-4 text-emerald-400" /> {s.deliveryMode}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col items-end gap-4 min-w-[200px]">
                          {(s.earlyBirdPrice || s.standardPrice || s.price) && (
                            <div className="flex flex-col items-end text-right">
                              {(s.earlyBirdPrice && s.earlyBirdPrice < (s.standardPrice || s.price)) ? (
                                <>
                                  <span className="text-[10px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 px-2.5 py-0.5 rounded-full mb-1 border border-amber-500/20">Early Bird Offer</span>
                                  <span className="text-3xl font-black text-white tracking-tighter">HK${s.earlyBirdPrice.toLocaleString()}</span>
                                  <span className="text-sm font-medium text-slate-500 line-through">HK${(s.standardPrice || s.price).toLocaleString()}</span>
                                </>
                              ) : (
                                <>
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Standard Fee</span>
                                  <span className="text-3xl font-black text-white tracking-tighter">HK${(s.standardPrice || s.price)?.toLocaleString()}</span>
                                </>
                              )}
                            </div>
                          )}
                          <Button 
                            onClick={() => handleEnroll(s.id)} 
                            className={`w-full h-12 font-black uppercase tracking-widest text-[10px] transition-all duration-300 ${s.enrolledCount >= s.quota ? 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed hover:bg-slate-800' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.3)] hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] hover:-translate-y-0.5'}`}
                            disabled={s.enrolledCount >= s.quota}
                          >
                            {s.enrolledCount >= s.quota ? 'Waitlist Only' : 'Register Now'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
           <Card className="bg-[#111827] border border-slate-800 shadow-[0_0_40px_-15px_rgba(59,130,246,0.15)] overflow-hidden sticky top-8">
             <CardContent className="pt-8 space-y-8 relative z-10">
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium">Life-time access to materials</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium">Expert-led instruction</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                    <span className="text-sm font-medium">Graduation certificate included</span>
                  </div>
                </div>

                <div className="h-px bg-slate-800" />

                <div className="space-y-3">
                  <Button className="w-full h-14 text-xs font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,130,246,0.3)] hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] bg-blue-600 hover:bg-blue-500 transition-all" onClick={() => handleEnroll()}>
                    Start Registration
                  </Button>
                </div>

                <p className="text-[9px] text-center text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
                  Need corporate pricing? <br/>
                  {schoolSettings?.email ? (
                    <a href={`mailto:${schoolSettings.email}`} className="text-blue-400 hover:text-blue-300 transition-colors">
                      Contact our sales team
                    </a>
                  ) : (
                    <span className="text-blue-400">Contact our sales team</span>
                  )}
                </p>
             </CardContent>
           </Card>
        </div>
      </div>
      </div>
    </div>
  );
}
