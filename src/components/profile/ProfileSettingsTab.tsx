import React, { useState, useEffect } from 'react';
import { updateDoc, doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db } from '../../lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { User as UserIcon, ShieldCheck, Mail, Lock, Loader2, Save, Phone, Briefcase, Award, Trash2, Plus, ArrowUp, ArrowDown } from 'lucide-react';

interface ProfileSettingsTabProps {
  user: any;
  userData: any;
  role: string | null;
}

const LANGUAGES = ["English", "廣東話", "普通話"];
const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export function ProfileSettingsTab({ user, userData, role }: ProfileSettingsTabProps) {
  const [loading, setLoading] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  
  // Basic Info State
  const [name, setName] = useState(userData?.name || '');
  const [phone, setPhone] = useState(userData?.phone || '');
  const [company, setCompany] = useState(userData?.company || '');
  
  // Tutor Info State
  const tutorProfile = userData?.tutorProfile || {};
  const [bio, setBio] = useState(tutorProfile.bio || '');
  const [employmentType] = useState(tutorProfile.employmentType || 'full_time');
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>(tutorProfile.teachingLanguages || []);
  const [availableDays, setAvailableDays] = useState<string[]>(tutorProfile.availableDays || []);
  const [qualifiedCategories, setQualifiedCategories] = useState<string[]>(userData?.qualifiedCategories || []);
  const [systemCategories, setSystemCategories] = useState<string[]>([]);

  // Extra Info State
  const [expertise, setExpertise] = useState<any[]>([]);
  const [certs, setCerts] = useState<any[]>([]);
  const [newExp, setNewExp] = useState({ expertiseArea: '', skillLevel: 'intermediate', yearsOfExperience: '', preferredCourseLevel: 'beginner' });
  const [newCert, setNewCert] = useState({ certificationName: '', status: 'active' });

  const isInstructor = role === 'tutor' || role === 'tutor_pt';
  const isGoogleUser = user?.providerData?.some((p: any) => p.providerId === 'google.com');

  useEffect(() => {
    if (isInstructor) {
      const fetchCategories = async () => {
        try {
          const docRef = doc(db, 'settings', 'course_categories');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists() && docSnap.data().categories) {
            setSystemCategories(docSnap.data().categories);
          }
        } catch (error) {
          console.error("Failed to fetch course categories", error);
        }
      };
      
      const fetchExtraData = async () => {
        if (!user?.uid) return;
        try {
          const expSnap = await getDocs(query(collection(db, 'tutor_expertise'), where('tutorId', '==', user.uid)));
          setExpertise(expSnap.docs.map(d => ({ id: d.id, ...d.data() })));
          
          const certSnap = await getDocs(query(collection(db, 'tutor_certifications'), where('tutorId', '==', user.uid)));
          setCerts(certSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) {
          console.error("Failed to fetch expertise/certs", e);
        }
      };
      
      fetchCategories();
      fetchExtraData();
    }
  }, [isInstructor, user?.uid]);
  
  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateBasicInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);
    try {
      const updateData: any = {
        name,
        phone,
        company,
      };

      if (isInstructor) {
        updateData.tutorProfile = {
          ...tutorProfile,
          bio,
          employmentType,
          teachingLanguages,
          availableDays,
        };
        updateData.qualifiedCategories = qualifiedCategories;
      }

      await updateDoc(doc(db, 'users', user.uid), updateData);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !user.email) return;
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }

    setPwLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      toast.success('Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error updating password:', error);
      if (error.code === 'auth/invalid-credential') {
        toast.error('Incorrect current password');
      } else {
        toast.error(error.message || 'Failed to update password');
      }
    } finally {
      setPwLoading(false);
    }
  };

  const toggleArrayItem = (item: string, array: string[], setArray: (val: string[]) => void) => {
    if (array.includes(item)) {
      setArray(array.filter(i => i !== item));
    } else {
      setArray([...array, item]);
    }
  };

  const handleAddExpertise = async () => {
    if (!newExp.expertiseArea) return toast.error("Area is required");
    try {
      const docRef = await addDoc(collection(db, 'tutor_expertise'), {
        ...newExp,
        tutorId: user.uid,
        createdAt: serverTimestamp()
      });
      setExpertise([...expertise, { id: docRef.id, ...newExp, tutorId: user.uid }]);
      setNewExp({ expertiseArea: '', skillLevel: 'intermediate', yearsOfExperience: '', preferredCourseLevel: 'beginner' });
      toast.success("Expertise added");
    } catch(e:any) {
      toast.error(e.message);
    }
  };

  const handleDeleteExpertise = async (id: string) => {
    if (!confirm("Delete this expertise area?")) return;
    try {
      await deleteDoc(doc(db, 'tutor_expertise', id));
      setExpertise(expertise.filter(e => e.id !== id));
      toast.success("Expertise removed");
    } catch(e:any) {
      toast.error(e.message);
    }
  };

  const handleAddCert = async () => {
    if (!newCert.certificationName) return toast.error("Name is required");
    try {
      const newOrder = certs.length;
      const docRef = await addDoc(collection(db, 'tutor_certifications'), {
        ...newCert,
        tutorId: user.uid,
        order: newOrder,
        createdAt: serverTimestamp()
      });
      setCerts([...certs, { id: docRef.id, ...newCert, tutorId: user.uid, order: newOrder }]);
      setNewCert({ certificationName: '', status: 'active' });
      toast.success("Certification added");
    } catch(e:any) {
      toast.error(e.message);
    }
  };

  const handleDeleteCert = async (id: string) => {
    if (!confirm("Delete this certification?")) return;
    try {
      await deleteDoc(doc(db, 'tutor_certifications', id));
      setCerts(certs.filter(c => c.id !== id));
      toast.success("Certification removed");
    } catch(e:any) {
      toast.error(e.message);
    }
  };

  const handleMoveCert = async (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === certs.length - 1) return;

    const sortedCerts = [...certs].sort((a, b) => (a.order || 0) - (b.order || 0));
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    const currentCert = sortedCerts[index];
    const targetCert = sortedCerts[targetIndex];

    try {
      await updateDoc(doc(db, 'tutor_certifications', currentCert.id), { order: targetIndex });
      await updateDoc(doc(db, 'tutor_certifications', targetCert.id), { order: index });
      
      const newCerts = sortedCerts.map((c, i) => {
        if (i === index) return { ...c, order: targetIndex };
        if (i === targetIndex) return { ...c, order: index };
        return { ...c, order: i };
      });
      
      setCerts(newCerts);
    } catch(e:any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Account Overview */}
      <Card>
        <CardContent className="p-6 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold uppercase shrink-0">
            {userData?.name ? userData.name.substring(0, 2) : userData?.email?.substring(0, 2)}
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold text-slate-800">{userData?.name || 'User'}</h2>
            <p className="text-slate-500">{userData?.email}</p>
            <div className="flex items-center justify-center sm:justify-start gap-3 mt-3">
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${role === 'student' ? 'bg-slate-100 text-slate-600' : 'bg-blue-100 text-blue-700'}`}>
                {role === 'tutor_pt' ? 'Instructor (PT)' : role === 'tutor' ? 'Instructor (FT)' : role}
              </span>
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase flex items-center gap-1 ${userData?.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${userData?.status === 'active' ? 'bg-green-600' : 'bg-slate-400'}`}></div>
                {userData?.status || 'active'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleUpdateBasicInfo}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><UserIcon className="w-5 h-5 text-indigo-500" /> Basic Information</CardTitle>
              <CardDescription>Update your personal and contact details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="email" type="email" value={userData?.email || ''} disabled className="pl-9 bg-slate-50" />
                </div>
                <p className="text-[10px] text-slate-500">Email cannot be changed.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name <span className="text-red-500">*</span></Label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company / Organization</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="company" value={company} onChange={e => setCompany(e.target.value)} className="pl-9" />
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-slate-50 border-t justify-end">
              <Button type="submit" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile
              </Button>
            </CardFooter>
          </Card>

          {/* Instructor Settings */}
          {isInstructor && (
            <Card className="md:col-span-1 border-t-4 border-t-blue-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2"><Briefcase className="w-5 h-5 text-blue-500" /> Instructor Settings</CardTitle>
                <CardDescription>Update your teaching preferences and bio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-2">
                  <Label>Employment Type</Label>
                  <div className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 font-medium capitalize items-center">
                    {employmentType.replace('_', ' ')}
                  </div>
                  <p className="text-[10px] text-slate-400">Employment type is managed by administrators.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Qualified Categories (Can Teach)</Label>
                  {systemCategories.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {systemCategories.map(cat => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => toggleArrayItem(cat, qualifiedCategories, setQualifiedCategories)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${qualifiedCategories.includes(cat) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Loading categories...</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>Teaching Languages</Label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map(lang => (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleArrayItem(lang, teachingLanguages, setTeachingLanguages)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${teachingLanguages.includes(lang) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {lang}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Available Days</Label>
                  <div className="flex flex-wrap gap-2">
                    {DAYS.map(day => (
                      <button
                        key={day}
                        type="button"
                        onClick={() => toggleArrayItem(day, availableDays, setAvailableDays)}
                        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border ${availableDays.includes(day) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                      >
                        {day.substring(0, 3)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bio / Introduction</Label>
                  <Textarea 
                    value={bio} 
                    onChange={e => setBio(e.target.value)} 
                    placeholder="Tell students about your experience and expertise..."
                    className="resize-none h-24"
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isInstructor && (
            <div className="md:col-span-2 flex justify-end">
               <Button type="submit" disabled={loading} className="gap-2 bg-indigo-600 hover:bg-indigo-700 px-8">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save Profile Changes
                </Button>
            </div>
          )}
        </div>
      </form>

      {/* Certifications Forms */}
      {isInstructor && (
        <div className="grid grid-cols-1 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2"><Award className="w-5 h-5 text-indigo-500" /> Certifications</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...certs].sort((a, b) => (a.order || 0) - (b.order || 0)).map((cert, index) => (
                  <div key={cert.id} className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1 relative group">
                    <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-indigo-600" onClick={() => handleMoveCert(index, 'up')} disabled={index === 0}>
                        <ArrowUp className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-500 hover:text-indigo-600" onClick={() => handleMoveCert(index, 'down')} disabled={index === certs.length - 1}>
                        <ArrowDown className="w-4 h-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => handleDeleteCert(cert.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{cert.certificationName}</p>
                  </div>
                ))}
              </div>
              <div className="bg-white border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div className="sm:col-span-3 space-y-1">
                  <Label className="text-xs">Certification Name</Label>
                  <Input value={newCert.certificationName} onChange={e => setNewCert({...newCert, certificationName: e.target.value})} placeholder="e.g. AWS Solutions Architect" />
                </div>
                <div className="space-y-1">
                  <Button type="button" onClick={handleAddCert} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700"><Plus className="w-4 h-4"/> Add</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Security Section */}
      <Card className="border-red-100">
        <CardHeader className="bg-red-50/50">
          <CardTitle className="text-lg flex items-center gap-2 text-slate-800"><ShieldCheck className="w-5 h-5 text-red-500" /> Account Security</CardTitle>
          <CardDescription>Manage your password and security settings.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          {isGoogleUser ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                <svg className="w-6 h-6" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800">Google Managed Account</h3>
              <p className="text-sm text-slate-500 mt-2 max-w-sm">
                You signed in using your Google account. Password changes and security settings are managed directly through Google.
              </p>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="max-w-md space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="current-password" type="password" required value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="new-password" type="password" required minLength={6} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="pl-9" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input id="confirm-password" type="password" required minLength={6} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="pl-9" />
                </div>
              </div>
              <Button type="submit" disabled={pwLoading} className="w-full bg-slate-800 hover:bg-slate-900">
                {pwLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />} Update Password
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
