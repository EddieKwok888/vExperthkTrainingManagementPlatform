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
    <div className="space-y-12 pb-20 bg-slate-50 min-h-screen px-4 pt-6">
      {/* Professional Enterprise Hero Section */}
      <div className="relative overflow-hidden text-center space-y-4 py-16 bg-blue-700 rounded-[2rem] shadow-md border border-blue-600 mx-auto max-w-7xl text-white">
        {/* Subtle background pattern instead of stardust */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        
        <div className="relative z-10 px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/50 border border-blue-500 text-blue-100 text-xs font-bold uppercase tracking-widest mb-4">
            Professional Training
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight drop-shadow-sm pb-2">
            Advance Your Future.
          </h1>
          <p className="text-base md:text-lg text-blue-100 max-w-2xl mx-auto mt-4 font-medium tracking-wide">
            Equip yourself with enterprise-grade skills. Explore our professional curriculum designed for tomorrow's leaders.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Course List & Show All Bar */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-6 z-30 transform -translate-y-10 w-[95%] mx-auto">
          <div className="w-full md:w-1/2 flex items-center">
            <div className="relative w-full">
              <select 
                className="h-14 w-full bg-slate-50 border border-slate-200 hover:border-blue-400 text-slate-800 px-5 rounded-xl focus:ring-2 focus:ring-blue-500/50 outline-none transition-all cursor-pointer font-bold text-lg appearance-none shadow-sm"
                value={selectedSpecificCourse}
                onChange={e => setSelectedSpecificCourse(e.target.value)}
              >
                <option value="" disabled className="text-slate-500">Course List (By Category)...</option>
                {categories.map(cat => (
                  <optgroup key={cat as string} label={cat as string} className="bg-slate-100 text-blue-700 font-black">
                    {/* Get unique courses for this category to avoid listing multiple intakes of the same course */}
                    {Array.from(new Map(courses.filter(c => c.category === cat).map(c => [c.courseId, c])).values()).map(c => (
                      <option key={c.courseId} value={c.courseId} className="text-slate-700 font-medium">
                        {c.courseCode ? `${c.courseCode} - ` : ''}{c.courseTitle}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>
          </div>
          <div className="flex w-full md:w-auto">
            <Button 
              onClick={() => setSelectedSpecificCourse('')}
              className={`w-full md:w-auto h-14 px-8 rounded-xl font-bold uppercase tracking-wider transition-all ${
                selectedSpecificCourse 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed opacity-80'
              }`}
              disabled={!selectedSpecificCourse}
            >
              Show All Courses
            </Button>
          </div>
        </div>

      <div className="space-y-6 max-w-7xl mx-auto px-2">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-800 flex items-center gap-3">
            Available Courses <span className="text-sm font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full">{filteredCourses.length}</span>
          </h2>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
        ) : filteredCourses.length === 0 && promotions.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-300 rounded-3xl bg-white shadow-sm">
            <p className="text-slate-500 text-lg font-medium">No active curriculum matches your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Courses list */}
            <div className={`${promotions.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} space-y-6`}>
              {filteredCourses.length === 0 ? (
                <div className="py-20 text-center border border-dashed border-slate-300 rounded-3xl bg-white shadow-sm">
                  <p className="text-slate-500 text-lg font-medium">No active curriculum matches your criteria.</p>
                </div>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${promotions.length > 0 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3'} gap-6`}>
                  {filteredCourses.map(course => (
                    <Card key={course.sessionId} className="group flex flex-col bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                      
                      <CardHeader className="p-6 pb-4">
                        <div className="flex justify-between items-start mb-4">
                          {course.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2.5 py-1 rounded">
                              {course.category}
                            </span>
                          )}
                          {course.level && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded">
                              {course.level}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-slate-800 line-clamp-2 text-xl font-bold group-hover:text-blue-700 transition-colors" title={`${course.courseCode ? course.courseCode + ' ' : ''}${course.courseTitle} - ${course.startDate || 'TBD'}`}>
                          {course.courseCode && <span className="font-mono text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded mr-2 border border-slate-200">{course.courseCode}</span>}
                          {course.courseTitle} <span className="text-slate-500 font-normal">- {course.startDate || 'TBD'}</span>
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-slate-500 mt-3 text-sm leading-relaxed">
                          <span className="inline-flex items-center gap-1.5 font-semibold text-indigo-700 text-xs uppercase mb-2 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded">
                            <Calendar className="w-3.5 h-3.5" /> {course.startDate ? `${course.startDate} to ${course.endDate || 'TBD'}` : 'Dates TBD'}
                          </span>
                          <br/>
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 text-sm space-y-4 px-6">
                        <div className="flex justify-between items-center text-slate-600 pb-4 border-b border-slate-100">
                          {course.duration_hours && <span className="font-medium text-xs"><span className="text-slate-400">Duration:</span> <span className="text-slate-700">{course.duration_hours}H</span></span>}
                          {course.deliveryMode && <span className="uppercase text-[10px] font-bold tracking-wider bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded">{course.deliveryMode}</span>}
                        </div>
                        <div className="flex justify-between items-center pt-1">
                          {course.certificate_available ? <span className="text-emerald-600 text-xs font-bold uppercase flex items-center gap-1"><Check className="w-3.5 h-3.5"/> Certified</span> : <span />}
                          {course.outlineName && <span className="text-purple-600 text-xs font-bold uppercase flex items-center gap-1"><FileText className="w-3.5 h-3.5"/> Outline</span>}
                        </div>
                        
                        <div className="mt-6 pt-2">
                          {(course.earlyBirdPrice && course.earlyBirdPrice < (course.standardPrice || course.price)) ? (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 mb-1">Early Bird Offer</span>
                              <p className="font-extrabold text-slate-800 text-3xl tracking-tight">${course.earlyBirdPrice?.toLocaleString()} <span className="text-sm font-semibold text-slate-400 line-through ml-1">${(course.standardPrice || course.price)?.toLocaleString()}</span></p>
                            </div>
                          ) : (
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Standard Fee</span>
                              <p className="font-extrabold text-3xl text-slate-800 tracking-tight">${(course.standardPrice || course.price)?.toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-4 mt-auto">
                        <Link to={`/course/${course.courseId}`} className="w-full">
                          <Button className="w-full h-11 bg-slate-100 hover:bg-blue-600 text-slate-700 hover:text-white font-bold uppercase tracking-wider text-xs transition-colors border border-slate-200 hover:border-blue-600">View Details</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {promotions.length > 0 && (
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24 space-y-6">
                  <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-lg font-extrabold text-slate-800 tracking-wider uppercase">Special Deals</h3>
                  </div>

                  <div className="space-y-4">
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
                        <div key={p.id} className={`p-4 rounded-xl border ${isBundle ? 'bg-indigo-50 border-indigo-200' : 'bg-rose-50 border-rose-200'} space-y-3 hover:shadow-sm transition-shadow`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase tracking-wider ${isBundle ? 'bg-indigo-600 text-white' : 'bg-rose-600 text-white'}`}>
                              {isBundle ? '📦 Bundle' : '🎟️ Coupon'}
                            </span>
                            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${isBundle ? 'text-indigo-700 bg-indigo-100' : 'text-rose-700 bg-rose-100'}`}>
                              -HKD {p.discountValue}
                            </span>
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                            {isBundle ? (
                              <div className="space-y-2 pt-2 text-xs text-slate-600 border-t border-indigo-200/50 mt-2">
                                <p className="font-bold text-[10px] text-indigo-600 uppercase tracking-wider bg-indigo-100/50 px-1.5 py-0.5 rounded w-fit">Included in bundle:</p>
                                <ul className="space-y-1.5 px-1">
                                  <li className="font-medium text-[11px] line-clamp-2 flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                    {course1Title}
                                  </li>
                                  <li className="font-medium text-[11px] line-clamp-2 flex items-start gap-2">
                                    <span className="mt-1 w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0"></span>
                                    {course2Title}
                                  </li>
                                </ul>

                                <div className="pt-2">
                                  {course1Id && (
                                    <Link to={`/register/${course1Id}?bundlePromoId=${p.id}`}>
                                      <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md h-9 text-xs gap-2">
                                        🎁 Register for Bundle
                                      </Button>
                                    </Link>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <p className="text-xs text-slate-600">
                                Use the code below during your course registration checkout to get immediate discount.
                              </p>
                            )}
                          </div>

                          {!isBundle && p.code && (
                            <div className="flex items-center gap-2 pt-1 font-sans">
                              <div className="bg-white px-2 py-1.5 rounded border border-slate-200 text-xs font-mono font-bold text-slate-800 flex-1 truncate select-all text-center">
                                {p.code}
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-xs font-bold gap-1 border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                                onClick={() => handleCopyCode(p.code, p.id)}
                              >
                                {copiedId === p.id ? (
                                  <>
                                    <Check className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700">Copied</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-4 h-4 text-slate-500" />
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
