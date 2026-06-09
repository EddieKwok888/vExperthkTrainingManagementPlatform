/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Outlet, Link, useNavigate, Navigate } from 'react-router-dom';
import React, { useEffect, useState, createContext, useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { auth, db } from './lib/firebase';
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocs, updateDoc, deleteDoc } from 'firebase/firestore';
import { Toaster } from './components/ui/sonner';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { LogIn, LogOut, Loader2, Languages, Mail, Lock, User as UserIcon, ShieldCheck, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

import { Home } from './features/courses/Home';
import { CourseDetail } from './features/courses/CourseDetail';
import { RegisterCourse } from './features/courses/RegisterCourse';
import { PaymentStatus } from './features/payment/PaymentStatus';
import { AdminDashboard } from './features/admin/AdminDashboard';
import { InstructorDashboard } from './features/instructor/InstructorDashboard';
import { StudentDashboard } from './features/student/StudentDashboard';
import { FeedbackForm } from './features/feedback/FeedbackForm';
import { ChatBot } from './components/common/ChatBot';
import { StudentProfile } from './features/student/StudentProfile';
import { UserRole } from './types';

// Context for Auth
interface AuthContextType {
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
}
export const AuthContext = createContext<AuthContextType>({
  user: null, role: null, loading: true, login: () => {}, logout: () => {}
});

function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [schoolSettings, setSchoolSettings] = useState<any>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'school_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchoolSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const cleanAllOldPDFs = async () => {
      try {
        const outlinesSnap = await getDocs(collection(db, 'courseOutlines'));
        for (const oDoc of outlinesSnap.docs) {
          await deleteDoc(doc(db, 'courseOutlines', oDoc.id));
        }
        const coursesSnap = await getDocs(collection(db, 'courses'));
        for (const cDoc of coursesSnap.docs) {
          const data = cDoc.data();
          if (data.outlineData) {
            const val = data.outlineData;
            if (!val.startsWith('http') || val.startsWith('data:') || val.includes('firebasestorage') || val.includes('course_outlines')) {
              await updateDoc(doc(db, 'courses', cDoc.id), {
                outlineData: '',
                outlineName: ''
              });
            }
          }
        }
        console.log('Automated physical file clean action completed nicely.');
      } catch (e) {
        console.log('PDF cleanup log handled.');
      }
    };
    cleanAllOldPDFs();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        setUser(u);
        setIsLoginModalOpen(false);
        try {
          const userDoc = await getDoc(doc(db, 'users', u.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            if (userData.status === 'inactive' || userData.status === 'suspended') {
                await signOut(auth);
                toast.error(`Account is ${userData.status}. Please contact administrator.`);
                setUser(null);
                setRole(null);
                setLoading(false);
                return;
            }
            setRole(userData.role);
          } else {
            // Check if admin bootstrap config exists and bypass
            const adminDoc = await getDoc(doc(db, 'admins', u.uid));
            if (adminDoc.exists() || u.email === 'aieddie0310@gmail.com' || u.email?.toLowerCase() === 'system.admin@vexperthk.com') {
              setRole('admin');
              await setDoc(doc(db, 'users', u.uid), {
                email: u.email,
                name: u.displayName || 'Admin',
                role: 'admin',
                status: 'active',
                createdAt: serverTimestamp()
              });
            } else if (u.email?.toLowerCase() === 'trainer@vexperthk.com') {
              setRole('tutor');
              await setDoc(doc(db, 'users', u.uid), {
                email: u.email,
                name: u.displayName || 'Instructor',
                role: 'tutor',
                status: 'active',
                createdAt: serverTimestamp()
              });
            } else {
              await setDoc(doc(db, 'users', u.uid), {
                email: u.email,
                name: u.displayName || 'Student',
                role: 'student',
                status: 'active',
                createdAt: serverTimestamp()
              });
              setRole('student');
            }
          }
        } catch (e) {
          console.error(e);
          toast.error("Error fetching user data");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const login = () => {
    setIsLoginModalOpen(true);
  };
  
  const handleGoogleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return toast.error("Please enter email and password");
    setAuthLoading(true);
    try {
      if (authMode === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (e: any) {
      if (e.code === 'auth/email-already-in-use') {
        toast.error("User with this email already exists.");
      } else {
        toast.error(e.message);
      }
    } finally {
      setAuthLoading(false);
    }
  };

  const handleQuickLogin = async (quickEmail: string, quickPass: string, roleName: string) => {
    setAuthLoading(true);
    try {
      try {
        await signInWithEmailAndPassword(auth, quickEmail, quickPass);
      } catch (err: any) {
        if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || (err.message && (err.message.includes('invalid-credential') || err.message.includes('user-not-found')))) {
          const userCredential = await createUserWithEmailAndPassword(auth, quickEmail, quickPass);
          toast.success(`${roleName} Account Created & Logged In!`);
        } else {
          throw err;
        }
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const logout = () => {
    signOut(auth);
    setEmail('');
    setPassword('');
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout }}>
      {children}
      <Dialog open={isLoginModalOpen} onOpenChange={setIsLoginModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Welcome to {schoolSettings?.name || 'School Dashboard'}</DialogTitle>
            <DialogDescription>
              Sign in to manage your training, view courses, and access materials.
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="local" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Local Account</TabsTrigger>
              <TabsTrigger value="google">Google</TabsTrigger>
            </TabsList>
            <TabsContent value="local" className="space-y-4 pt-4">
              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="email" type="email" placeholder="student@example.com" value={email} onChange={e => setEmail(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="pl-9" />
                  </div>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={authLoading}>
                  {authLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {authMode === 'login' ? 'Sign In' : 'Sign Up'}
                </Button>
                <div className="text-center text-sm text-slate-500">
                  {authMode === 'login' ? (
                    <>Don't have an account? <button type="button" onClick={() => setAuthMode('signup')} className="text-blue-600 hover:underline">Sign up</button></>
                  ) : (
                    <>Already have an account? <button type="button" onClick={() => setAuthMode('login')} className="text-blue-600 hover:underline">Sign in</button></>
                  )}
                </div>
                
                <div className="mt-6 border-t border-slate-200 pt-4">
                  <p className="text-xs text-slate-500 font-medium mb-3 text-center uppercase tracking-wider">Demo Accounts (Quick Login)</p>
                  <div className="space-y-2">
                    <Button type="button" variant="outline" className="w-full justify-between font-normal h-11" onClick={() => handleQuickLogin('System.Admin@vexperthk.com', 'admin123', 'Admin')} disabled={authLoading}>
                      <span className="flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-slate-500" /> Admin</span>
                      <span className="text-xs text-slate-400">System.Admin@vexperthk.com</span>
                    </Button>
                    <Button type="button" variant="outline" className="w-full justify-between font-normal h-11" onClick={() => handleQuickLogin('trainer@vexperthk.com', 'admin123', 'Instructor')} disabled={authLoading}>
                      <span className="flex items-center gap-2"><Briefcase className="w-4 h-4 text-slate-500" /> Instructor</span>
                      <span className="text-xs text-slate-400">trainer@...</span>
                    </Button>
                    <Button type="button" variant="outline" className="w-full justify-between font-normal h-11" onClick={() => handleQuickLogin('student@vexperthk.com', 'admin123', 'Student')} disabled={authLoading}>
                       <span className="flex items-center gap-2"><UserIcon className="w-4 h-4 text-slate-500" /> Student</span>
                       <span className="text-xs text-slate-400">student@...</span>
                    </Button>
                  </div>
                </div>
              </form>
            </TabsContent>
            <TabsContent value="google" className="pt-4 flex flex-col items-center justify-center space-y-4">
              <Button onClick={handleGoogleLogin} variant="outline" className="w-full gap-2 h-12">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                Sign in with Google
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </AuthContext.Provider>
  );
}

function Layout() {
  const { user, role, login, logout, loading } = useContext(AuthContext);
  const { t, i18n } = useTranslation();
  const [schoolSettings, setSchoolSettings] = useState<any>(null);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'school_info');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setSchoolSettings(docSnap.data());
        }
      } catch (error) {
        console.error("Failed to fetch settings", error);
      } finally {
        setLoadingSettings(false);
      }
    };
    fetchSettings();
  }, []);

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 overflow-hidden">
      <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <Link to="/" className="font-bold text-xl tracking-tight text-slate-800 flex items-center gap-3">
          {loadingSettings ? (
            <div className="w-8 h-8 rounded-lg bg-slate-200 animate-pulse"></div>
          ) : schoolSettings?.logo_url ? (
             <img src={schoolSettings.logo_url} alt={schoolSettings.name} className="w-8 h-8 object-contain rounded" />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 border-2 border-white rounded-full"></div>
            </div>
          )}
          <span>{loadingSettings ? <span className="block w-24 h-6 bg-slate-200 animate-pulse rounded"></span> : schoolSettings?.name ? schoolSettings.name : <>School <span className="text-blue-600">Portal</span></>}</span>
        </Link>
        <div className="flex items-center gap-6">
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2" />}>
              <Languages className="w-4 h-4" />
              <span className="hidden sm:inline">{i18n.language === 'en' ? 'English' : '繁體中文'}</span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => changeLanguage('en')}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => changeLanguage('zh-HK')}>
                繁體中文 (廣東話)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <nav className="flex items-center gap-4">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : user ? (
              <div className="flex items-center gap-6">
                <div className="flex bg-slate-100 p-1 rounded-md text-xs font-medium">
                  {(['admin', 'coordinator', 'finance', 'staff'].includes(role || '') || (role && role.startsWith('custom_'))) && <Link to="/admin" className="px-3 py-1 bg-white shadow-sm rounded text-blue-600 border border-slate-200">{t('common.admin')}</Link>}
                  {['tutor', 'tutor_pt'].includes(role || '') && <Link to="/instructor" className="px-3 py-1 bg-white shadow-sm rounded text-blue-600 border border-slate-200">{t('common.tutor')}</Link>}
                  {role === 'student' && (
                    <>
                      <Link to="/student/registrations" className="px-3 py-1 hover:bg-white hover:shadow-sm rounded text-slate-600 hover:text-blue-600 transition-all">Student Dashboard</Link>
                    </>
                  )}
                </div>
                <div className="h-8 w-px bg-slate-200 mx-1"></div>
                <div className="flex items-center gap-3">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-semibold text-slate-700">{user.displayName || user.email?.split('@')[0]}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider">{role ? (role.startsWith('custom_') ? 'Custom Role' : t(`common.${role}`)) : t('common.student')}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-200 rounded-full border-2 border-white shadow-sm overflow-hidden flex items-center justify-center">
                    <div className="w-full h-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold uppercase">
                      {user.displayName ? user.displayName.substring(0, 2) : user.email?.substring(0, 2)}
                    </div>
                  </div>
                  <button onClick={logout} className="text-slate-400 hover:text-slate-600 ml-2">
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <Button size="sm" onClick={login} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white"><LogIn className="w-4 h-4" /> {t('common.login')}</Button>
            )}
          </nav>
        </div>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 w-full max-w-full flex flex-col gap-6">
          <Outlet />
        </main>
      </div>
      <ChatBot />
    </div>
  )
}

function BookIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
    </svg>
  )
}

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode, allowedRoles: UserRole[] }) {
  const { user, role, loading } = useContext(AuthContext);
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  if (!user) {
    return <Navigate to="/" replace />;
  }
  if (role) {
    const isAllowed = allowedRoles.includes(role) || 
      (role.startsWith('custom_') && allowedRoles.some(r => ['admin', 'coordinator', 'finance', 'staff'].includes(r)));
    if (!isAllowed) {
      return <div className="text-center py-20 text-slate-500 font-medium font-sans">Access Denied: You do not have permission to view this page.</div>;
    }
  }
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="course/:id" element={<CourseDetail />} />
            <Route path="register/:id" element={<RegisterCourse />} />
            <Route path="payment-status/:id" element={<PaymentStatus />} />
            <Route path="admin" element={<ProtectedRoute allowedRoles={['admin', 'coordinator', 'finance', 'staff']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="admin/student/:id" element={<ProtectedRoute allowedRoles={['admin', 'coordinator', 'staff']}><StudentProfile /></ProtectedRoute>} />
            <Route path="instructor" element={<ProtectedRoute allowedRoles={['admin', 'coordinator', 'tutor', 'tutor_pt']}><InstructorDashboard /></ProtectedRoute>} />
            <Route path="student/registrations" element={<ProtectedRoute allowedRoles={['admin', 'student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="feedback/:id" element={<ProtectedRoute allowedRoles={['admin', 'tutor', 'student']}><FeedbackForm /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
      <Toaster />
    </AuthProvider>
  );
}

