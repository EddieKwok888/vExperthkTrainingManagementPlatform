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
                Certificate Management
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
                    let baseDates: string[] = [];
                    const sessionLessons = lessons.filter(
                      (l) =>
                        l.sessionId === selectedSessionCert?.id ||
                        l.session_id === selectedSessionCert?.id,
                    );
                    if (sessionLessons.length > 0) {
                      baseDates = sessionLessons
                        .map((l) => l.lessonDate || l.lesson_date)
                        .filter(Boolean);
                    } else {
                      const start = selectedSessionCert?.startDate;
                      const end = selectedSessionCert?.endDate;
                      if (start && end && start !== end) {
                        let current = new Date(start);
                        const endD = new Date(end);
                        while (current <= endD) {
                          baseDates.push(current.toISOString().split("T")[0]);
                          current.setDate(current.getDate() + 1);
                        }
                      } else if (start) {
                        baseDates.push(start);
                      } else {
                        baseDates.push("N/A");
                      }
                    }

                    baseDates = Array.from(new Set(baseDates))
                      .filter((d) => d !== "N/A")
                      .sort();

                    const todayStr = new Date().toLocaleDateString("en-CA", {
                      timeZone: "Asia/Hong_Kong",
                    });
                    let displayDates = new Set<string>();

                    let currentIndex = -1;

                    if (baseDates.includes(todayStr)) {
                      currentIndex = baseDates.indexOf(todayStr);
                    } else {
                      const pastDates = baseDates.filter((d) => d <= todayStr);
                      if (pastDates.length > 0) {
                        currentIndex = baseDates.indexOf(
                          pastDates[pastDates.length - 1],
                        );
                      } else if (baseDates.length > 0) {
                        currentIndex = 0;
                      }
                    }

                    if (currentIndex !== -1) {
                      displayDates.add(baseDates[currentIndex]);
                      for (let i = 1; i <= pastDaysToShow; i++) {
                        if (currentIndex - i >= 0) {
                          displayDates.add(baseDates[currentIndex - i]);
                        }
                      }
                    }

                    let sessionDates = Array.from(displayDates).sort();
                    if (sessionDates.length === 0) sessionDates.push("N/A");

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
                          {sessionStudentsData.map((student) => {
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
                                    {sessionDates.map((date, idx) => (
                                      <div
                                        key={date}
                                        className="flex flex-row items-center gap-3 bg-slate-50/50 p-1.5 rounded-lg border border-slate-100/60 w-max shrink-0"
                                      >
                                        <span className="text-[10px] font-bold text-slate-500 w-20 text-right">
                                          {date}
                                        </span>
                                        <div className="flex gap-1">
                                          {(["am", "pm"] as const).map(
                                            (type) => {
                                              const isRecordPresent =
                                                student.attendanceRecords &&
                                                student.attendanceRecords[
                                                  date
                                                ] &&
                                                typeof student
                                                  .attendanceRecords[date][
                                                  type
                                                ] !== "undefined";
                                              const isFirstDay =
                                                baseDates.length > 0 &&
                                                date === baseDates[0];
                                              const isConfirmed =
                                                isRecordPresent
                                                  ? student.attendanceRecords[
                                                      date
                                                    ][type]
                                                  : isFirstDay &&
                                                    student[`${type}Confirmed`];

                                              return (
                                                <Button
                                                  key={type}
                                                  size="sm"
                                                  onClick={() =>
                                                    handleToggleAttendanceConfirm(
                                                      student.id,
                                                      date,
                                                      type,
                                                      !!isConfirmed,
                                                    )
                                                  }
                                                  className={`h-7 px-2.5 text-[9px] font-black uppercase tracking-wider transition-all ${
                                                    isConfirmed
                                                      ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                                                      : "bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 shadow-none"
                                                  }`}
                                                >
                                                  {isConfirmed && (
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                  )}
                                                  {type}
                                                </Button>
                                              );
                                            },
                                          )}
                                        </div>
                                      </div>
                                    ))}
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
