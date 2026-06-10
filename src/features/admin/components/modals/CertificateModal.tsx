import {
  Loader2,
  Sparkles,
  History,
  ShieldAlert,
  Trash2,
  Clock,
  Search,
  AlertTriangle,
  ChevronLeft,
  Mail,
  Phone,
  CalendarIcon,
  Download,
  FileText,
  ExternalLink as Link,
  CheckCircle,
  Award,
  Users,
  ShieldCheck,
} from "lucide-react";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../../../../components/ui/dialog";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../../../components/ui/select";
import { Textarea } from "../../../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "../../../../components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "../../../../components/ui/card";

// Note: Using 'any' for speed and to avoid TS errors.
export interface CertificateModalProps {
  courses: any;
  handleToggleAttendanceConfirm: any;
  handleUpdateSingleAttendance?: any;
  isCertLoading: any;
  isCertModalOpen: any;
  lessons: any;
  pastDaysToShow: any;
  selectedSessionCert: any;
  sessionStudentsData: any;
  sessions: any;
  setIsCertModalOpen: any;
  setPastDaysToShow: any;
}

export function CertificateModal({
  courses,
  handleToggleAttendanceConfirm,
  handleUpdateSingleAttendance,
  isCertLoading,
  isCertModalOpen,
  lessons,
  pastDaysToShow,
  selectedSessionCert,
  sessionStudentsData,
  sessions,
  setIsCertModalOpen,
  setPastDaysToShow,
}: CertificateModalProps) {
  return (
    <Dialog open={isCertModalOpen} onOpenChange={setIsCertModalOpen}>
      <DialogContent className="sm:max-w-[900px] max-h-[85vh] overflow-y-auto p-0 border-none shadow-2xl rounded-2xl overflow-hidden bg-white/95 backdrop-blur-xl">
        <div className="bg-slate-900 p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-2xl font-black tracking-tight">
                <div className="p-2 bg-yellow-400 rounded-lg text-slate-900 shadow-lg shadow-yellow-400/20">
                  <Award className="w-6 h-6" />
                </div>
                Attendance Management
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-medium text-sm mt-2">
                Course:{" "}
                <span className="text-white font-bold">
                  {selectedSessionCert?.sessionName}
                </span>{" "}
                • Course:{" "}
                <span className="text-white font-bold">
                  {
                    courses.find((c) => c.id === selectedSessionCert?.courseId)
                      ?.title
                  }
                </span>
              </DialogDescription>
            </DialogHeader>
          </div>
          {/* Background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-400/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
          <div className="absolute bottom-0 right-0 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl mr-10 mb-[-10px]"></div>
        </div>

        <div className="p-8">
          {isCertLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="relative">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
                <Sparkles className="w-4 h-4 text-yellow-500 absolute top-0 right-0 animate-pulse" />
              </div>
              <div className="text-center">
                <p className="text-slate-800 font-bold text-lg">
                  Calculating Attendance Rates
                </p>
                <p className="text-slate-400 text-sm italic">
                  Verifying student qualification thresholds...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:bg-white group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-md group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <CheckCircle className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Lessons Completed
                    </p>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">
                    {
                      lessons.filter(
                        (l) =>
                          l.sessionId === selectedSessionCert?.id &&
                          l.lessonStatus === "completed",
                      ).length
                    }
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 italic">
                    Total sessions recorded
                  </p>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 shadow-sm transition-all hover:shadow-md hover:bg-white group">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-indigo-100 text-indigo-600 rounded-md group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <Users className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Total Students
                    </p>
                  </div>
                  <p className="text-3xl font-black text-slate-800 tracking-tighter">
                    {sessionStudentsData.length}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-1 italic">
                    Verified registrations
                  </p>
                </div>
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 shadow-sm transition-all hover:shadow-md hover:bg-white group border-l-4 border-l-amber-400">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-md group-hover:bg-amber-600 group-hover:text-white transition-colors">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">
                      Passing Criteria
                    </p>
                  </div>
                  <p className="text-3xl font-black text-amber-900 tracking-tighter">
                    80%
                  </p>
                  <p className="text-[10px] text-amber-600 font-bold mt-1 uppercase tracking-tight">
                    Minimum Attendance
                  </p>
                </div>
              </div>

              <div>
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2 flex-1">
                    Enrolled Student Roster
                    <div className="h-[1px] flex-1 bg-slate-100 ml-2"></div>
                  </h4>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-[10px] uppercase font-bold text-slate-500"
                    onClick={() => setPastDaysToShow((p) => p + 1)}
                  >
                    <History className="w-3 h-3 mr-1" /> 顯示上一日
                  </Button>
                </div>
                <div className="border border-slate-100 rounded-xl overflow-x-auto bg-white shadow-sm">
                  {(() => {
                    const sessionLessons = lessons.filter(
                      (l: any) =>
                        l.sessionId === selectedSessionCert?.id ||
                        l.session_id === selectedSessionCert?.id,
                    ).sort((a: any, b: any) => (a.lessonDate || "").localeCompare(b.lessonDate || ""));

                    if (sessionLessons.length === 0) {
                      return <div className="p-8 text-center text-slate-400 font-bold">No classes scheduled yet.</div>;
                    }

                    const todayStr = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Hong_Kong" });
                    let displayLessons = [...sessionLessons];
                    
                    const todayIndex = displayLessons.findIndex(l => l.lessonDate === todayStr);
                    if (todayIndex !== -1 || pastDaysToShow > 0) {
                       const endIndex = todayIndex !== -1 ? todayIndex : displayLessons.length - 1;
                       const startIndex = Math.max(0, endIndex - pastDaysToShow);
                       displayLessons = displayLessons.slice(startIndex, endIndex + 1);
                    }

                    return (
                      <Table>
                        <TableHeader className="bg-slate-50/50 whitespace-nowrap">
                          <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Student Identity
                            </TableHead>
                            <TableHead className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest min-w-[200px]">
                              Attendance Checks
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sessionStudentsData.map((student: any) => {
                            const raw = student.rawAttendance || {};
                            return (
                              <TableRow
                                key={student.id}
                                className="border-slate-50 hover:bg-slate-50/30 transition-colors"
                              >
                                <TableCell className="px-6 py-4">
                                  <div className="font-bold text-slate-800 whitespace-nowrap">
                                    {student.studentName}
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono italic">
                                    {student.studentEmail}
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                  <div className="flex flex-col gap-2 justify-end items-end w-full">
                                    {displayLessons.map((lesson: any) => {
                                      const status = raw[lesson.id] || "unmarked";
                                      
                                      const getButtons = (s: string) => {
                                        return [
                                          { id: 'present_am', label: 'AM Present', color: 'bg-emerald-600 border-emerald-600' },
                                          { id: 'present_pm', label: 'PM Present', color: 'bg-indigo-600 border-indigo-600' },
                                          { id: 'absent', label: 'Absent', color: 'bg-red-600 border-red-600' }
                                        ].map(item => {
                                          const isMarked = s === item.id || ((item.id === 'present_am' || item.id === 'present_pm') && s === 'present');
                                          return (
                                            <button
                                              key={item.id}
                                              onClick={() => {
                                                let nextStatus = item.id;
                                                if (item.id === 'absent') {
                                                  nextStatus = s === 'absent' ? '' : 'absent';
                                                } else if (item.id === 'present_am') {
                                                  if (s === 'present_am') nextStatus = '';
                                                  else if (s === 'present_pm') nextStatus = 'present';
                                                  else if (s === 'present') nextStatus = 'present_pm';
                                                } else if (item.id === 'present_pm') {
                                                  if (s === 'present_pm') nextStatus = '';
                                                  else if (s === 'present_am') nextStatus = 'present';
                                                  else if (s === 'present') nextStatus = 'present_am';
                                                }
                                                handleUpdateSingleAttendance && handleUpdateSingleAttendance(
                                                  student.studentId,
                                                  lesson.id,
                                                  lesson.sessionId,
                                                  nextStatus
                                                );
                                              }}
                                              className={`px-2 py-1 rounded-md text-[9px] font-black uppercase transition-all tracking-wider border ${
                                                isMarked
                                                  ? `${item.color} text-white shadow-md`
                                                  : "border-slate-200 text-slate-400 bg-white hover:border-slate-300 hover:text-slate-700"
                                              }`}
                                            >
                                              {item.label}
                                            </button>
                                          );
                                        });
                                      };

                                      return (
                                        <div
                                          key={lesson.id}
                                          className="flex flex-row items-center gap-3 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/60 w-max shrink-0"
                                        >
                                          <div className="flex flex-col items-end">
                                              <span className="text-[10px] font-bold text-slate-500 text-right truncate">
                                                {lesson.lessonTitle || `Lesson`}
                                              </span>
                                              <span className="text-[9px] font-medium text-slate-400 text-right truncate">
                                                {lesson.lessonDate}
                                              </span>
                                          </div>
                                          <div className="flex gap-1 min-w-[70px] justify-end">
                                            {getButtons(status)}
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}
        </div>
        <DialogFooter className="p-6 bg-slate-50/50 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => setIsCertModalOpen(false)}
            className="font-bold text-xs uppercase tracking-[0.2em] text-slate-500"
          >
            Close Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
