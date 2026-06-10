import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2, Search, Filter, Sparkles, Copy, Check, Gift, Zap, Calendar, FileText } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/error';

export function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [rawCoursesList, setRawCoursesList] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [selectedSpecificCourse, setSelectedSpecificCourse] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const sq = query(collection(db, 'course_sessions'), where('sessionStatus', '==', 'open'));
        const sessionSnap = await getDocs(sq);
        const sessions = sessionSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const cq = query(collection(db, 'courses'), where('status', '==', 'active'));
        const courseSnap = await getDocs(cq);
        const mappedCourses = courseSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
        setRawCoursesList(mappedCourses);

        const combined = sessions.map((session: any) => {
          const courseRef = mappedCourses.find((c: any) => c.id === session.courseId);
          return {
             ...courseRef,
             ...session,
             courseTitle: courseRef?.title || 'Unknown Course',
             sessionId: session.id,
             courseId: session.courseId
          };
        }).filter((item: any) => item.title); // Only keep if course exists and is active

        combined.sort((a: any, b: any) => {
           if (!a.startDate || !b.startDate) return 0;
           return a.startDate.localeCompare(b.startDate);
        });
        setCourses(combined);

        // Fetch active promotions
        const pq = query(collection(db, 'promotions'), where('status', '==', 'active'));
        const promoSnap = await getDocs(pq);
        const promoList = promoSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const now = new Date();
        const activePromos = promoList.filter((p: any) => {
          if (p.startDate && new Date(p.startDate) > now) return false;
          if (p.endDate && new Date(p.endDate) < now) return false;
          return true;
        });
        setPromotions(activePromos);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'courses');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  const categories = useMemo(() => Array.from(new Set(courses.map(c => c.category).filter(Boolean))), [courses]);
  const levels = useMemo(() => Array.from(new Set(courses.map(c => c.level).filter(Boolean))), [courses]);

  const filteredCourses = useMemo(() => {
    return courses.filter(course => {
      const matchesSpecific = selectedSpecificCourse ? course.courseId === selectedSpecificCourse : true;
      const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? course.category === selectedCategory : true;
      const matchesLevel = selectedLevel ? course.level === selectedLevel : true;
      return matchesSpecific && matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel, selectedSpecificCourse]);

  return (
    <div className="space-y-12 pb-20 bg-[#0A0F1C] min-h-screen px-4 pt-6">
      {/* Futuristic Enterprise Hero Section */}
      <div className="relative overflow-hidden text-center space-y-4 py-16 bg-[#0D1426] rounded-[2rem] shadow-[0_0_80px_-20px_rgba(59,130,246,0.3)] border border-blue-900/30 mx-auto max-w-7xl">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-color-dodge"></div>
        
        {/* Glow Effects */}
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="relative z-10 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-4 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span> Next-Gen Learning
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white via-blue-100 to-slate-400 drop-shadow-sm pb-2">
            Advance Your Future.
          </h1>
          <p className="text-base md:text-lg text-slate-400 max-w-2xl mx-auto mt-4 font-medium tracking-wide">
            Equip yourself with enterprise-grade skills. Explore our professional curriculum designed for tomorrow's leaders.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Course List & Show All Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-[#111827]/80 backdrop-blur-xl p-4 rounded-2xl border border-slate-700/50 shadow-[0_0_30px_rgba(59,130,246,0.15)] sticky top-6 z-30 transform -translate-y-10 w-[95%] mx-auto">
          <div className="w-full md:w-1/2 flex items-center">
            <div className="relative w-full">
              <select 
                className="h-14 w-full bg-[#0A0F1C] border border-blue-500/30 hover:border-blue-400 text-white px-5 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer font-bold text-lg appearance-none shadow-inner"
                value={selectedSpecificCourse}
                onChange={e => setSelectedSpecificCourse(e.target.value)}
              >
                <option value="" disabled className="text-slate-500">Course List (By Category)...</option>
                {categories.map(cat => (
                  <optgroup key={cat as string} label={cat as string} className="bg-slate-900 text-blue-400 font-black">
                    {/* Get unique courses for this category to avoid listing multiple intakes of the same course */}
                    {Array.from(new Map(courses.filter(c => c.category === cat).map(c => [c.courseId, c])).values()).map(c => (
                      <option key={c.courseId} value={c.courseId} className="text-white font-medium">
                        {c.courseCode ? `${c.courseCode} - ` : ''}{c.courseTitle}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div className="flex w-full md:w-auto">
            <Button 
              onClick={() => setSelectedSpecificCourse('')}
              className={`w-full md:w-auto h-14 px-8 rounded-xl font-black uppercase tracking-widest transition-all ${
                selectedSpecificCourse 
                  ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]' 
                  : 'bg-slate-800 text-slate-400 border border-slate-700 hover:text-white cursor-not-allowed opacity-80'
              }`}
              disabled={!selectedSpecificCourse}
            >
              Show All Courses
            </Button>
          </div>
        </div>

      <div className="space-y-6 max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
            Available Courses <span className="text-sm font-mono bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">{filteredCourses.length}</span>
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-500" /></div>
        ) : filteredCourses.length === 0 && promotions.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-[#111827]/30 backdrop-blur-sm">
            <p className="text-slate-500 text-lg font-medium">No active curriculum matches your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Courses list */}
            <div className={`${promotions.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} space-y-6`}>
              {filteredCourses.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-[#111827]/30 backdrop-blur-sm">
                  <p className="text-slate-500 text-lg font-medium">No active curriculum matches your criteria.</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${promotions.length > 0 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3'} gap-6`}>
                  {filteredCourses.map(course => (
                    <Card key={course.sessionId} className="group relative flex flex-col bg-[#111827] rounded-2xl overflow-hidden border border-slate-800 hover:border-blue-500/50 shadow-none hover:shadow-[0_0_30px_-5px_rgba(59,130,246,0.3)] transition-all duration-500 hover:-translate-y-2">
                      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                      
                      <CardHeader className="p-6 pb-4 relative z-10">
                        <div className="flex justify-between items-start mb-4">
                          {course.category && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-sm shadow-[0_0_10px_rgba(59,130,246,0.1)]">
                              {course.category}
                            </span>
                          )}
                          {course.level && (
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-sm">
                              {course.level}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-slate-100 line-clamp-2 text-xl font-black group-hover:text-white transition-colors tracking-tight" title={`${course.courseCode ? course.courseCode + ' ' : ''}${course.courseTitle} - ${course.startDate || 'TBD'}`}>
                          {course.courseCode && <span className="font-mono text-xs text-blue-400 bg-blue-950 px-2 py-0.5 rounded mr-2 border border-blue-900/50">{course.courseCode}</span>}
                          {course.courseTitle} <span className="text-slate-600 font-normal">- {course.startDate || 'TBD'}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-slate-400 mt-3 text-sm leading-relaxed">
                          <span className="inline-flex items-center gap-1.5 font-bold text-indigo-400 text-[10px] uppercase tracking-widest mb-2 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-sm">
                            <Calendar className="w-3 h-3" /> {course.startDate ? `${course.startDate} to ${course.endDate || 'TBD'}` : 'Dates TBD'}
                          </span>
                          <br/>
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 text-sm space-y-4 px-6 relative z-10">
                        <div className="flex justify-between items-center text-slate-400 pb-4 border-b border-slate-800">
                          {course.duration_hours && <span className="font-medium text-xs"><span className="text-slate-500">Duration:</span> <span className="text-slate-200">{course.duration_hours}H</span></span>}
                          {course.deliveryMode && <span className="uppercase text-[9px] font-black tracking-widest bg-slate-800 border border-slate-700 text-slate-300 px-2 py-0.5 rounded-sm">{course.deliveryMode}</span>}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          {course.certificate_available ? <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><Check className="w-3 h-3"/> Certified</span> : <span />}
                          {course.outlineName && <span className="text-purple-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-1"><FileText className="w-3 h-3"/> Outline</span>}
                        </div>
                        
                        <div className="mt-6 pt-2">
                          {(course.earlyBirdPrice && course.earlyBirdPrice < (course.standardPrice || course.price)) ? (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-amber-500 mb-1">Early Bird Offer</span>
                              <p className="font-black text-white text-3xl tracking-tighter">${course.earlyBirdPrice?.toLocaleString()} <span className="text-sm font-semibold text-slate-500 line-through ml-1">${(course.standardPrice || course.price)?.toLocaleString()}</span></p>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Standard Fee</span>
                              <p className="font-black text-3xl text-white tracking-tighter">${(course.standardPrice || course.price)?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-4 mt-auto relative z-10">
                        <Link to={`/course/${course.courseId}`} className="w-full">
                          <Button className="w-full h-12 bg-slate-800 hover:bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] transition-all border border-slate-700 hover:border-blue-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">View Details</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {promotions.length > 0 && (
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="bg-[#0D1426] p-8 rounded-[2rem] border border-indigo-500/50 shadow-[0_0_60px_-15px_rgba(79,70,229,0.3)] sticky top-24 space-y-6 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 pointer-events-none z-0"></div>
                  <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/20 blur-[50px] pointer-events-none rounded-full group-hover:bg-indigo-400/30 transition-all duration-700"></div>
                  <div className="flex items-center gap-3 pb-4 border-b border-indigo-500/30 relative z-10">
                    <Sparkles className="w-6 h-6 text-indigo-400 animate-pulse drop-shadow-[0_0_10px_rgba(129,140,248,0.8)]" />
                    <h3 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400 tracking-widest uppercase drop-shadow-md">Special Deals</h3>
                  </div>

                  <div className="space-y-5 relative z-10">
                    {promotions.map((p: any) => {
                      const isBundle = p.type === 'bundle';
                      let course1Title = 'Course A';
                      let course2Title = 'Course B';
                      let course1Id = '';
                      let course2Id = '';

                      if (isBundle && p.conditions?.requiredCourseIds) {
                        const [c1Id, c2Id] = p.conditions.requiredCourseIds;
                        course1Id = c1Id;
                        course2Id = c2Id;
                        const c1 = rawCoursesList.find((c: any) => c.id === c1Id);
                        const c2 = rawCoursesList.find((c: any) => c.id === c2Id);
                        if (c1) course1Title = c1.title;
                        if (c2) course2Title = c2.title;
                      }

                      return (
                        <div key={p.id} className={`p-4 rounded-xl border transition-all ${isBundle ? 'bg-[#1e1b4b]/60 border-indigo-400/50 shadow-[0_0_20px_rgba(79,70,229,0.1)] hover:border-indigo-300 hover:shadow-[0_0_30px_rgba(79,70,229,0.25)]' : 'bg-rose-950/40 border-rose-400/50 shadow-[0_0_20px_rgba(244,63,94,0.1)] hover:border-rose-300 hover:shadow-[0_0_30px_rgba(244,63,94,0.25)]'} space-y-3 group/card hover:-translate-y-1 duration-300`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[9px] px-2 py-1 rounded text-white font-black uppercase tracking-widest ${isBundle ? 'bg-indigo-500 border border-indigo-400 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-rose-500 border border-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`}>
                              {isBundle ? '📦 Bundle' : '🎟️ Coupon'}
                            </span>
                            <span className="text-[10px] font-black text-white bg-white/10 px-2 py-0.5 rounded-full backdrop-blur-md border border-white/20">
                              -HKD {p.discountValue}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-white leading-tight drop-shadow-sm">{p.name}</h4>
                            {isBundle ? (
                              <div className="space-y-2 pt-2 text-xs text-indigo-100 border-t border-indigo-500/30 mt-2">
                                <p className="font-bold text-[9px] text-indigo-300 uppercase tracking-widest bg-indigo-500/10 px-1.5 py-0.5 rounded w-fit">Included in bundle:</p>
                                <ul className="space-y-1.5 px-1">
                                  <li className="font-medium text-[11px] line-clamp-2 text-white flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_5px_rgba(129,140,248,0.8)]"></span>
                                    {course1Id ? (
                                      <Link to={`/course/${course1Id}`} className="hover:text-indigo-200 transition-colors">
                                        {course1Title}
                                      </Link>
                                    ) : course1Title}
                                  </li>
                                  <li className="font-medium text-[11px] line-clamp-2 text-white flex items-start gap-2">
                                    <span className="mt-1 w-1 h-1 rounded-full bg-indigo-400 shrink-0 shadow-[0_0_5px_rgba(129,140,248,0.8)]"></span>
                                    {course2Id ? (
                                      <Link to={`/course/${course2Id}`} className="hover:text-indigo-300 hover:underline transition-colors">
                                        {course2Title}
                                      </Link>
                                    ) : course2Title}
                                  </li>
                                </ul>

                                <p className="text-[9px] text-indigo-300 mt-2 font-medium leading-relaxed bg-indigo-900/40 p-2 rounded-lg border border-indigo-500/20">
                                  *Automatically applied when purchasing both courses together!
                                </p>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-500">
                                Use the code below during your course registration checkout to get immediate discount.
                              </p>
                            )}
                          </div>

                          {!isBundle && p.code && (
                            <div className="flex items-center gap-2 pt-1 font-sans">
                              <div className="bg-white px-2 py-1 rounded border border-slate-200 text-xs font-mono font-bold text-slate-700 flex-1 truncate select-all">
                                {p.code}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-[10px] font-bold uppercase tracking-wider gap-1 border-slate-200 px-2 bg-white"
                                onClick={() => handleCopyCode(p.code, p.id)}
                              >
                                {copiedId === p.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-green-600" />
                                    <span>Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
