import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Loader2, Search, Filter, Sparkles, Copy, Check, Gift, Zap } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../../lib/error';

export function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [rawCoursesList, setRawCoursesList] = useState<any[]>([]);
  const [promotions, setPromotions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

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
      const matchesSearch = course.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            course.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? course.category === selectedCategory : true;
      const matchesLevel = selectedLevel ? course.level === selectedLevel : true;
      return matchesSearch && matchesCategory && matchesLevel;
    });
  }, [courses, searchQuery, selectedCategory, selectedLevel]);

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4 py-16 bg-blue-600 rounded-2xl shadow-sm text-white">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Advance Your Career with Us</h1>
        <p className="text-xl text-blue-100 max-w-2xl mx-auto">Explore our range of professional courses designed to equip you with the skills of tomorrow.</p>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search courses..." 
            className="pl-9 bg-slate-50 border-slate-200"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map(c => <option key={c as string} value={c as string}>{c as string}</option>)}
          </select>
          <select 
            className="flex h-10 w-full items-center justify-between rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedLevel}
            onChange={e => setSelectedLevel(e.target.value)}
          >
            <option value="">All Levels</option>
            {levels.map(l => <option key={l as string} value={l as string}>{l as string}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">Available Courses ({filteredCourses.length})</h2>
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
        ) : filteredCourses.length === 0 && promotions.length === 0 ? (
          <p className="text-slate-500 py-8 text-center text-lg">No courses match your criteria. Please try a different search.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Courses list */}
            <div className={`${promotions.length > 0 ? 'lg:col-span-8 xl:col-span-9' : 'lg:col-span-12'} space-y-6`}>
              {filteredCourses.length === 0 ? (
                <p className="text-slate-500 py-8 text-center text-lg">No courses match your criteria. Please try a different search.</p>
              ) : (
                <div className={`grid grid-cols-1 md:grid-cols-2 ${promotions.length > 0 ? 'lg:grid-cols-2 xl:grid-cols-3' : 'lg:grid-cols-3'} gap-6`}>
                  {filteredCourses.map(course => (
                    <Card key={course.sessionId} className="flex flex-col shadow-sm border-slate-200 hover:shadow-md transition-shadow">
                      <CardHeader>
                        <div className="flex justify-between items-start mb-2">
                          {course.category && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-sm">
                              {course.category}
                            </span>
                          )}
                          {course.level && (
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-sm">
                              {course.level}
                            </span>
                          )}
                        </div>
                        <CardTitle className="text-slate-800 line-clamp-1">
                          {course.courseCode && <span className="font-mono text-sm text-slate-500 mr-2">{course.courseCode}</span>}
                          {course.courseTitle}
                        </CardTitle>
                        <CardDescription className="line-clamp-2 text-slate-500 mt-1">
                          <span className="block font-semibold text-blue-600 tracking-tight text-xs uppercase mb-1">
                            {course.sessionName} • {course.startDate && course.endDate ? `${course.startDate} to ${course.endDate}` : 'Dates TBD'}
                          </span>
                          {course.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex-1 text-sm space-y-2">
                        <div className="flex justify-between items-center text-slate-600">
                          {course.duration_hours && <span><span className="font-medium text-slate-700">Duration:</span> {course.duration_hours} hours</span>}
                          {course.deliveryMode && <span className="uppercase text-[10px] font-bold tracking-widest bg-slate-100 px-1.5 py-0.5 rounded">{course.deliveryMode}</span>}
                        </div>
                        <div className="flex justify-between items-center pt-2">
                          {course.certificate_available ? <span className="text-green-600 text-[10px] font-bold uppercase tracking-wider bg-green-50 px-2 py-0.5 rounded">✓ Certificate</span> : <span />}
                          {course.outlineName && <span className="text-purple-600 text-[10px] font-bold uppercase tracking-wider bg-purple-50 px-2 py-0.5 rounded line-clamp-1 truncate ml-2">📄 Outline</span>}
                        </div>
                        
                        <div className="mt-2">
                          {(course.earlyBirdPrice && course.earlyBirdPrice < (course.standardPrice || course.price)) ? (
                            <p className="font-bold text-amber-600 text-2xl">${course.earlyBirdPrice?.toLocaleString()} <span className="text-sm font-normal text-slate-500 line-through ml-1">${(course.standardPrice || course.price)?.toLocaleString()}</span></p>
                          ) : (
                            <p className="font-bold text-2xl text-blue-600">${(course.standardPrice || course.price)?.toLocaleString()}</p>
                          )}
                        </div>
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Link to={`/course/${course.courseId}`} className="flex-1">
                          <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">View Details</Button>
                        </Link>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar with active promotions */}
            {promotions.length > 0 && (
              <div className="lg:col-span-4 xl:col-span-3">
                <div className="bg-gradient-to-br from-indigo-50/70 via-white to-white p-5 rounded-xl border border-indigo-100 shadow-sm sticky top-6 space-y-4">
                  <div className="flex items-center gap-2 pb-1 border-b border-indigo-100/50">
                    <Sparkles className="w-5 h-5 text-indigo-600 animate-pulse" />
                    <h3 className="text-sm font-bold text-slate-800 tracking-tight">Special Deals & Bundles</h3>
                  </div>

                  <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-1">
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
                        <div key={p.id} className={`p-4 rounded-xl border transition-all ${isBundle ? 'bg-indigo-50/50 border-indigo-200 hover:border-indigo-300' : 'bg-rose-50/30 border-rose-100 hover:border-rose-200'} space-y-3`}>
                          <div className="flex items-start justify-between gap-2">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${isBundle ? 'bg-indigo-100 text-indigo-700' : 'bg-rose-100 text-rose-700'}`}>
                              {isBundle ? '📦 2-Course Bundle' : '🎟️ Promo Coupon'}
                            </span>
                            <span className="text-xs font-black text-rose-600">
                              -HKD {p.discountValue}
                            </span>
                          </div>

                          <div className="space-y-1">
                            <h4 className="text-xs font-black text-slate-800 leading-snug">{p.name}</h4>
                            {isBundle ? (
                              <div className="space-y-1 pt-1.5 text-[11px] text-slate-600">
                                <p className="font-semibold text-[10px] text-slate-500 uppercase tracking-wider">Bundle course set:</p>
                                <ul className="list-disc pl-4 space-y-1">
                                  <li className="font-bold line-clamp-1 text-indigo-900">
                                    {course1Id ? (
                                      <Link to={`/course/${course1Id}`} className="hover:underline hover:text-indigo-700 transition-colors">
                                        {course1Title}
                                      </Link>
                                    ) : course1Title}
                                  </li>
                                  <li className="font-bold line-clamp-1 text-indigo-900">
                                    {course2Id ? (
                                      <Link to={`/course/${course2Id}`} className="hover:underline hover:text-indigo-700 transition-colors">
                                        {course2Title}
                                      </Link>
                                    ) : course2Title}
                                  </li>
                                </ul>
                                {course1Id && (
                                  <div className="mt-3.5 pt-1.5">
                                    <Link to={`/register/${course1Id}?bundlePromoId=${p.id}`} className="block">
                                      <Button className="w-full h-8.5 text-[11px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm flex items-center justify-center gap-1.5 uppercase tracking-wider rounded-lg transition-all active:scale-[0.98]">
                                        <span>Register Bundle Now</span>
                                        <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                                      </Button>
                                    </Link>
                                  </div>
                                )}
                                <p className="text-[9px] text-slate-400 mt-2 font-medium leading-normal italic">
                                  *Automatically applied when purchasing both courses together during registration!
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
  );
}
