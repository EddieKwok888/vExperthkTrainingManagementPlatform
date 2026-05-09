import React, { useEffect, useState, useMemo } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Loader2, Search, Filter } from 'lucide-react';
import { handleFirestoreError, OperationType } from '../lib/error';

export function Home() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const q = query(collection(db, 'courses'), where('status', '==', 'active'));
        const querySnapshot = await getDocs(q);
        const fetched = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetched.sort((a: any, b: any) => b.createdAt?.toMillis() - a.createdAt?.toMillis());
        setCourses(fetched);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'courses');
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

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
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">Advance Your Career with ProTrain</h1>
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
        ) : filteredCourses.length === 0 ? (
          <p className="text-slate-500 py-8 text-center text-lg">No courses match your criteria. Please try a different search.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map(course => (
              <Card key={course.id} className="flex flex-col shadow-sm border-slate-200 hover:shadow-md transition-shadow">
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
                  <CardTitle className="text-slate-800 line-clamp-1">{course.title}</CardTitle>
                  <CardDescription className="line-clamp-2 text-slate-500">{course.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 text-sm space-y-1">
                  {course.duration_hours && <p className="text-slate-500"><span className="font-medium text-slate-700">Duration:</span> {course.duration_hours} hours</p>}
                  {course.certificate_available && <p className="text-green-600 font-medium">✓ Certificate Available</p>}
                  <p className="font-semibold text-xl text-blue-600 mt-2">${course.price}</p>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Link to={`/course/${course.id}`} className="flex-1">
                    <Button className="w-full bg-slate-800 hover:bg-slate-700 text-white">View Details</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
