const fs = require('fs');

const path = 'src/features/admin/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const startStr = "          {activeTab === 'sessions' && (";
const endStr = "          {(activeTab === 'staff' || activeTab === 'students') && (";

const startIndex = content.indexOf(startStr);
const endIndex = content.indexOf(endStr);

if (startIndex !== -1 && endIndex !== -1) {
  const extracted = content.substring(startIndex + startStr.length, endIndex);
  
  const sessionsTabCode = `import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Switch } from '../../../components/ui/switch';
import { Label } from '../../../components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../../components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { CalendarIcon, ChevronLeft, ChevronRight, CheckCircle, Clock, Download, MapPin, MoreVertical, Plus, Printer, RefreshCw, Save, Search, Settings, ShieldCheck, Users, UsersRound, Video } from 'lucide-react';
import { ReadOnlyAlert } from './ReadOnlyAlert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { toast } from 'sonner';
import { doc, collection, setDoc, deleteDoc } from 'firebase/firestore';

export interface SessionsTabProps {
  courseRunsActiveTab: string;
  setCourseRunsActiveTab: (val: string) => void;
  getPermission: (module: string) => string;
  setSessionCreationModalOpen: (val: boolean) => void;
  viewingLessonsForSession: any;
  setViewingLessonsForSession: (val: any) => void;
  courses: any[];
  sessions: any[];
  regs: any[];
  lessons: any[];
  tutors: any[];
  courseRunSearchTerm: string;
  setCourseRunSearchTerm: (val: string) => void;
  runsStartDate: string;
  setRunsStartDate: (val: string) => void;
  runsEndDate: string;
  setRunsEndDate: (val: string) => void;
  showCompletedRuns: boolean;
  setShowCompletedRuns: (val: boolean) => void;
  handleExportCSV: (data: any[], type: string) => void;
  setSelectedSession: (val: any) => void;
  setSessionModalOpen: (val: boolean) => void;
  lessonGen: any;
  setLessonGen: (val: any) => void;
  handleGenerateLessonsAuto: () => void;
  handleOpenAttendanceModal: (session: any) => void;
  handleUpdateLesson: (e: any) => void;
  sessionCertSearchTerm: string;
  setSessionCertSearchTerm: (val: string) => void;
  sessionCertsStartDate: string;
  setSessionCertsStartDate: (val: string) => void;
  sessionCertsEndDate: string;
  setSessionCertsEndDate: (val: string) => void;
  handleExportAttendanceSheet: (sessionId: string) => void;
  handleManageCertificates: (sessionId: string) => void;
  isWeekendOrHoliday: (dateStr: string) => { isInvalid: boolean, reason: string };
  db: any;
}

export function SessionsTab({
  courseRunsActiveTab, setCourseRunsActiveTab, getPermission, setSessionCreationModalOpen,
  viewingLessonsForSession, setViewingLessonsForSession, courses, sessions, regs, lessons, tutors,
  courseRunSearchTerm, setCourseRunSearchTerm, runsStartDate, setRunsStartDate, runsEndDate, setRunsEndDate,
  showCompletedRuns, setShowCompletedRuns, handleExportCSV, setSelectedSession, setSessionModalOpen,
  lessonGen, setLessonGen, handleGenerateLessonsAuto, handleOpenAttendanceModal, handleUpdateLesson,
  sessionCertSearchTerm, setSessionCertSearchTerm, sessionCertsStartDate, setSessionCertsStartDate,
  sessionCertsEndDate, setSessionCertsEndDate, handleExportAttendanceSheet, handleManageCertificates,
  isWeekendOrHoliday, db
}: SessionsTabProps) {
  return (
    ${extracted}
  );
}
`;

  fs.writeFileSync('src/features/admin/components/SessionsTab.tsx', sessionsTabCode, 'utf8');

  const replacement = `          {activeTab === 'sessions' && (
            <SessionsTab 
              courseRunsActiveTab={courseRunsActiveTab}
              setCourseRunsActiveTab={setCourseRunsActiveTab}
              getPermission={getPermission}
              setSessionCreationModalOpen={setSessionCreationModalOpen}
              viewingLessonsForSession={viewingLessonsForSession}
              setViewingLessonsForSession={setViewingLessonsForSession}
              courses={courses}
              sessions={sessions}
              regs={regs}
              lessons={lessons}
              tutors={tutors}
              courseRunSearchTerm={courseRunSearchTerm}
              setCourseRunSearchTerm={setCourseRunSearchTerm}
              runsStartDate={runsStartDate}
              setRunsStartDate={setRunsStartDate}
              runsEndDate={runsEndDate}
              setRunsEndDate={setRunsEndDate}
              showCompletedRuns={showCompletedRuns}
              setShowCompletedRuns={setShowCompletedRuns}
              handleExportCSV={handleExportCSV}
              setSelectedSession={setSelectedSession}
              setSessionModalOpen={setSessionModalOpen}
              lessonGen={lessonGen}
              setLessonGen={setLessonGen}
              handleGenerateLessonsAuto={handleGenerateLessonsAuto}
              handleOpenAttendanceModal={handleOpenAttendanceModal}
              handleUpdateLesson={handleUpdateLesson}
              sessionCertSearchTerm={sessionCertSearchTerm}
              setSessionCertSearchTerm={setSessionCertSearchTerm}
              sessionCertsStartDate={sessionCertsStartDate}
              setSessionCertsStartDate={setSessionCertsStartDate}
              sessionCertsEndDate={sessionCertsEndDate}
              setSessionCertsEndDate={setSessionCertsEndDate}
              handleExportAttendanceSheet={handleExportAttendanceSheet}
              handleManageCertificates={handleManageCertificates}
              isWeekendOrHoliday={isWeekendOrHoliday}
              db={db}
            />
          )}

`;

  const newContent = content.substring(0, startIndex) + replacement + content.substring(endIndex);
  fs.writeFileSync(path, newContent, 'utf8');
  console.log('Successfully extracted SessionsTab');
}
