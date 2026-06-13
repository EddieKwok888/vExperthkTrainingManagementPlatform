import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../../components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import {
  Award,
  CalendarIcon,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  ClipboardList,
  Clock,
  Download,
  Edit2,
  MapPin,
  MoreVertical,
  Plus,
  Printer,
  RefreshCw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Users,
  UsersRound,
  Video,
} from "lucide-react";
import { ReadOnlyAlert } from "./ReadOnlyAlert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { toast } from "sonner";
import {
  doc,
  collection,
  setDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

export interface SessionsTabProps {
  courseRunsActiveTab: "runs" | "attendance";
  setCourseRunsActiveTab: (val: "runs" | "attendance") => void;
  getPermission: (module: string) => string;
  setSessionCreationModalOpen: (val: boolean) => void;
  viewingLessonsForSession: any;
  setViewingLessonsForSession: (val: any) => void;
  courses: any[];
  sessions: any[];
  regs: any[];
  lessons: any[];
  tutors: any[];
  certificates: any[];
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
  handleGenerateLessonsAuto: (sessionId: string) => Promise<string | number>;
  handleUpdateLesson: (lessonId: string, updates: any) => Promise<void>;
  sessionCertSearchTerm: string;
  setSessionCertSearchTerm: (val: string) => void;
  sessionCertsStartDate: string;
  setSessionCertsStartDate: (val: string) => void;
  sessionCertsEndDate: string;
  setSessionCertsEndDate: (val: string) => void;
  handleExportAttendanceSheet: (
    session: any,
    course: any,
    enrolledStudents: any[],
  ) => void;
  handleManageCertificates: (sessionId: string) => void;
  isWeekendOrHoliday: (dateStr: string) => {
    isInvalid: boolean;
    reason?: string;
  };
  confirmDelete: (id: string, type: any, name: string) => void;
  fetchData: () => void;
  db: any;
}

export function SessionsTab({
  courseRunsActiveTab,
  setCourseRunsActiveTab,
  getPermission,
  setSessionCreationModalOpen,
  viewingLessonsForSession,
  setViewingLessonsForSession,
  courses,
  sessions,
  regs,
  lessons,
  tutors,
  certificates,
  courseRunSearchTerm,
  setCourseRunSearchTerm,
  runsStartDate,
  setRunsStartDate,
  runsEndDate,
  setRunsEndDate,
  showCompletedRuns,
  setShowCompletedRuns,
  handleExportCSV,
  setSelectedSession,
  setSessionModalOpen,
  lessonGen,
  setLessonGen,
  handleGenerateLessonsAuto,
  handleUpdateLesson,
  sessionCertSearchTerm,
  setSessionCertSearchTerm,
  sessionCertsStartDate,
  setSessionCertsStartDate,
  sessionCertsEndDate,
  setSessionCertsEndDate,
  handleExportAttendanceSheet,
  handleManageCertificates,
  isWeekendOrHoliday,
  confirmDelete,
  fetchData,
  db,
}: SessionsTabProps) {
  const [activeRunsPage, setActiveRunsPage] = React.useState(1);
  const [confirmedRunsPage, setConfirmedRunsPage] = React.useState(1);
  const itemsPerPage = 10;

  React.useEffect(() => { setActiveRunsPage(1); }, [courseRunSearchTerm, runsStartDate, runsEndDate, showCompletedRuns]);
  React.useEffect(() => { setConfirmedRunsPage(1); }, [sessionCertSearchTerm, sessionCertsStartDate, sessionCertsEndDate]);

  const filteredActiveRuns = sessions
    .filter((s) => {
      const hasCertificates = certificates.some(
        (cert: any) => {
          const reg = regs.find((r: any) => r.id === cert.registrationId);
          return reg?.sessionId === s.id;
        },
      );
      if (hasCertificates) return false;

      if (!showCompletedRuns && (s.sessionStatus === "completed" || s.sessionStatus === "cancelled")) return false;
      if (s.sessionStatus === "confirmed" || s.sessionStatus === "full") return false;
      if (runsStartDate && s.startDate && s.startDate < runsStartDate) return false;
      if (runsEndDate && s.startDate && s.startDate > runsEndDate) return false;

      if (courseRunSearchTerm) {
        const course = courses.find((c: any) => c.id === s.courseId);
        const instructor = tutors.find((t: any) => t.id === s.tutorId);
        const term = courseRunSearchTerm.toLowerCase();
        return (
          course?.courseCode?.toLowerCase().includes(term) ||
          s.sessionName?.toLowerCase().includes(term) ||
          course?.title?.toLowerCase().includes(term) ||
          instructor?.name?.toLowerCase().includes(term) ||
          s.sessionStatus?.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const isAConf = a.sessionStatus === "confirmed";
      const isBConf = b.sessionStatus === "confirmed";
      if (isAConf && !isBConf) return -1;
      if (!isAConf && isBConf) return 1;
      const dateA = a.startDate || "9999-12-31";
      const dateB = b.startDate || "9999-12-31";
      return dateA.localeCompare(dateB);
    });

  const activeRunsTotalPages = Math.ceil(filteredActiveRuns.length / itemsPerPage) || 1;
  const paginatedActiveRuns = filteredActiveRuns.slice((activeRunsPage - 1) * itemsPerPage, activeRunsPage * itemsPerPage);

  const filteredConfirmedRuns = sessions
    .filter((s) => {
      const hasCertificates = certificates.some(
        (cert: any) => {
          const reg = regs.find((r: any) => r.id === cert.registrationId);
          return reg?.sessionId === s.id;
        },
      );
      if (hasCertificates) return false;

      if (s.sessionStatus !== "confirmed" && s.sessionStatus !== "full") return false;
      if (sessionCertsStartDate && s.startDate && s.startDate < sessionCertsStartDate) return false;
      if (sessionCertsEndDate && s.startDate && s.startDate > sessionCertsEndDate) return false;

      if (sessionCertSearchTerm) {
        const course = courses.find((c: any) => c.id === s.courseId);
        const instructor = tutors.find((t: any) => t.id === s.tutorId);
        const term = sessionCertSearchTerm.toLowerCase();
        return (
          course?.courseCode?.toLowerCase().includes(term) ||
          s.sessionName?.toLowerCase().includes(term) ||
          course?.title?.toLowerCase().includes(term) ||
          instructor?.name?.toLowerCase().includes(term)
        );
      }
      return true;
    })
    .sort((a, b) => {
      const isAConf = a.sessionStatus === "confirmed" || a.sessionStatus === "full";
      const isBConf = b.sessionStatus === "confirmed" || b.sessionStatus === "full";
      if (isAConf && !isBConf) return -1;
      if (!isAConf && isBConf) return 1;
      const dateA = a.startDate || "9999-12-31";
      const dateB = b.startDate || "9999-12-31";
      return dateA.localeCompare(dateB);
    });

  const confirmedRunsTotalPages = Math.ceil(filteredConfirmedRuns.length / itemsPerPage) || 1;
  const paginatedConfirmedRuns = filteredConfirmedRuns.slice((confirmedRunsPage - 1) * itemsPerPage, confirmedRunsPage * itemsPerPage);

  return (
    <div className="space-y-6">
      <ReadOnlyAlert moduleKey="sessions" getPermission={getPermission} />
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-max mb-6">
        <Button
          variant={courseRunsActiveTab === "runs" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCourseRunsActiveTab("runs")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          Course Runs
        </Button>
        <Button
          variant={courseRunsActiveTab === "attendance" ? "default" : "ghost"}
          size="sm"
          onClick={() => setCourseRunsActiveTab("attendance")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          Confirmed Course
        </Button>
      </div>

      {courseRunsActiveTab === "runs" ? (
        <>
          {!viewingLessonsForSession ? (
            <>
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div>
                  <h2 className="text-lg font-bold text-slate-800 font-sans tracking-tight">
                    Active Courses & Intakes
                  </h2>
                  <p className="text-xs text-slate-500">
                    Manage your course runs and schedules
                  </p>
                </div>
                {getPermission("sessions") !== "view" ? (
                  <Button
                    onClick={() => setSessionCreationModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-6 font-bold text-xs uppercase tracking-widest transition-all hover:scale-105 active:scale-95"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Course Instance
                  </Button>
                ) : (
                  <Button
                    disabled
                    className="bg-slate-100 text-slate-400 border border-slate-200 font-bold text-xs uppercase tracking-widest cursor-not-allowed whitespace-nowrap h-10 px-4"
                  >
                    🔒 Read-Only
                  </Button>
                )}
              </div>

              <Card className="shadow-sm">
                <CardHeader className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-base font-bold text-slate-800">
                        Active Courses & Intakes
                      </CardTitle>
                      <CardDescription className="text-xs text-slate-500">
                        Manage your course runs and schedules
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                      <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search Code, Course Title, Instructor..."
                          className="pl-9 h-8 text-xs focus:ring-blue-500 border-slate-200"
                          value={courseRunSearchTerm}
                          onChange={(e) =>
                            setCourseRunSearchTerm(e.target.value)
                          }
                        />
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleExportCSV(sessions, "sessions")}
                        className="gap-2 h-8 text-xs"
                      >
                        <Download className="w-3.5 h-3.5" /> Export
                      </Button>
                    </div>
                  </div>

                  {/* Date selection and Hide Completed Filter Row */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                        <CalendarIcon className="w-3.5 h-3.5 text-slate-400" />{" "}
                        Date Range:
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="date"
                          className="h-8 text-xs w-36 px-2 cursor-pointer border-slate-200 bg-white"
                          value={runsStartDate}
                          onChange={(e) => setRunsStartDate(e.target.value)}
                        />
                        <span className="text-xs text-slate-400">to</span>
                        <Input
                          type="date"
                          className="h-8 text-xs w-36 px-2 cursor-pointer border-slate-200 bg-white"
                          value={runsEndDate}
                          onChange={(e) => setRunsEndDate(e.target.value)}
                        />
                      </div>
                      {(runsStartDate || runsEndDate) && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setRunsStartDate("");
                            setRunsEndDate("");
                          }}
                          className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 font-semibold"
                        >
                          Clear
                        </Button>
                      )}
                    </div>

                    <div
                      className="flex items-center gap-2 bg-slate-50 border border-slate-200 hover:border-slate-300 transition-all rounded-lg px-3 py-1.5 cursor-pointer"
                      onClick={() => setShowCompletedRuns(!showCompletedRuns)}
                    >
                      <input
                        type="checkbox"
                        checked={showCompletedRuns}
                        onChange={(e) => {
                          // Let click handler on div handle toggle to make toggle area larger and more touch-friendly
                          e.stopPropagation();
                          setShowCompletedRuns(e.target.checked);
                        }}
                        className="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-xs font-semibold text-slate-700 select-none">
                        Show Completed / Cancelled
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Code</TableHead>
                          <TableHead>Title</TableHead>
                          <TableHead>day</TableHead>
                          <TableHead>EB Price</TableHead>
                          <TableHead>Base Price</TableHead>
                          <TableHead>Instructor</TableHead>
                          <TableHead>Delivery & Room</TableHead>
                          <TableHead>Enrolled</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedActiveRuns
                          .map((s) => {
                            const course = courses.find(
                              (c) => c.id === s.courseId,
                            );
                            const instructor = tutors.find(
                              (t) => t.id === s.tutorId,
                            );
                            return (
                              <TableRow
                                key={s.id}
                                className="hover:bg-slate-50/50"
                              >
                                <TableCell>
                                  <div className="font-bold text-slate-900 whitespace-normal break-words max-w-[124px] leading-none mb-1 text-sm">
                                    {course?.courseCode || s.sessionName}
                                  </div>
                                  <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50/85 border border-blue-100/80 px-2 py-0.5 rounded-full mt-1.5">
                                    <CalendarIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                                    <span>
                                      {s.startDate || "No date"} to{" "}
                                      {s.endDate || "No date"}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-xs whitespace-normal break-words max-w-[180px] leading-tight font-medium text-slate-700">
                                  {course?.title || "Unknown"}
                                </TableCell>
                                <TableCell className="text-xs font-semibold text-indigo-600">
                                  {course?.day ? `${course.day} Days` : "-"}
                                </TableCell>
                                <TableCell className="text-xs font-bold text-emerald-600">
                                  {s.earlyBirdPrice !== undefined
                                    ? `HK$${s.earlyBirdPrice}`
                                    : course?.earlyBirdPrice !== undefined
                                      ? `HK$${course.earlyBirdPrice}`
                                      : "-"}
                                </TableCell>
                                <TableCell className="text-xs font-bold text-slate-600">
                                  {s.standardPrice !== undefined
                                    ? `HK$${s.standardPrice}`
                                    : course?.standardPrice !== undefined
                                      ? `HK$${course.standardPrice}`
                                      : "-"}
                                </TableCell>
                                <TableCell className="text-xs font-medium">
                                  {instructor?.name || "Unassigned"}
                                </TableCell>
                                <TableCell>
                                  <div className="flex flex-col gap-1 items-start">
                                    <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-black text-[10px] tracking-tight text-slate-600">
                                      {s.deliveryMode === "onsite"
                                        ? "ClassRoom"
                                        : s.deliveryMode === "online"
                                          ? "Online"
                                          : s.deliveryMode === "hybrid"
                                            ? "Hybrid"
                                            : s.deliveryMode || "N/A"}
                                    </span>
                                    {s.room && (
                                      <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> Room:{" "}
                                        {s.room.replace(
                                          /\s*\(Persons:.*?\)/gi,
                                          "",
                                        )}
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold">
                                      {
                                        regs.filter(
                                          (r) =>
                                            r.sessionId === s.id &&
                                            r.status === "verified",
                                        ).length
                                      }
                                    </span>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-slate-500">
                                      {s.quota}
                                    </span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <span
                                    className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                                      s.sessionStatus === "open"
                                        ? "bg-green-100 text-green-700"
                                        : s.sessionStatus === "completed"
                                          ? "bg-slate-100 text-slate-500"
                                          : s.sessionStatus === "cancelled"
                                            ? "bg-red-100 text-red-700"
                                            : (s.sessionStatus === "full" || s.sessionStatus === "confirmed")
                                              ? "bg-blue-100 text-blue-700"
                                              : "bg-blue-50 text-blue-600"
                                    }`}
                                  >
                                    {s.sessionStatus === "completed"
                                      ? "Completed"
                                      : s.sessionStatus === "cancelled"
                                        ? "Cancelled"
                                        : (s.sessionStatus === "full" || s.sessionStatus === "confirmed")
                                          ? "Confirmed"
                                          : s.sessionStatus || "Active"}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">
                                  {getPermission("sessions") === "view" ? (
                                    <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-2 py-1 rounded">
                                      Locked
                                    </span>
                                  ) : (
                                    <div className="flex justify-end gap-1">
                                      {regs.filter((r) => r.sessionId === s.id && r.status === "verified").length > 0 && (
                                         <Button
                                           variant="ghost"
                                           size="sm"
                                           className="h-8 w-8 p-0 text-emerald-400 hover:text-emerald-600 hover:bg-emerald-50"
                                           title="Download Attendance List"
                                           onClick={() => {
                                             const verifiedStudents = regs.filter((r) => r.sessionId === s.id && r.status === "verified");
                                             if (handleExportAttendanceSheet) {
                                               handleExportAttendanceSheet(s, course, verifiedStudents);
                                             }
                                           }}
                                         >
                                           <ClipboardList className="w-3.5 h-3.5" />
                                         </Button>
                                      )}
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                                        title="Edit"
                                        onClick={() => {
                                          setSelectedSession(s);
                                          setSessionModalOpen(true);
                                        }}
                                      >
                                        <Edit2 className="w-3.5 h-3.5" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-8 w-8 p-0 text-red-300 hover:text-red-600"
                                        title="Delete"
                                        onClick={() =>
                                          confirmDelete(
                                            s.id,
                                            "session",
                                            s.sessionName || "Unknown Course",
                                          )
                                        }
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </Button>
                                    </div>
                                  )}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </div>
                  {filteredActiveRuns.length > 10 && (
                    <div className="flex justify-end mt-4 pt-4 border-t border-slate-100">
                      <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                        <span className="text-xs text-slate-500 font-medium">Page</span>
                        <select
                          value={activeRunsPage}
                          onChange={(e) => setActiveRunsPage(Number(e.target.value))}
                          className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 outline-none font-medium cursor-pointer"
                        >
                          {Array.from({ length: activeRunsTotalPages }, (_, i) => i + 1).map(page => (
                            <option key={page} value={page}>{page}</option>
                          ))}
                        </select>
                        <span className="text-xs text-slate-500 font-medium">of {activeRunsTotalPages}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setViewingLessonsForSession(null)}
                    className="h-8 text-slate-600"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800">
                      {viewingLessonsForSession.sessionName}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Manage lesson curriculum and scheduling for this run
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1 border-indigo-100 bg-indigo-50/10 shadow-sm self-start">
                  <CardHeader>
                    <CardTitle className="text-xs font-bold uppercase tracking-widest text-indigo-600 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> AI Batch Scheduler
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        First Lesson Date
                      </label>
                      <Input
                        type="date"
                        value={lessonGen.startDate}
                        onChange={(e) => {
                          const val = e.target.value;
                          const v = isWeekendOrHoliday(val);
                          if (v.isInvalid) return toast.error(v.reason);
                          setLessonGen({ ...lessonGen, startDate: val });
                        }}
                        className="h-10"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase">
                          Start Time
                        </label>
                        <Input
                          type="time"
                          value={lessonGen.startTime}
                          onChange={(e) =>
                            setLessonGen({
                              ...lessonGen,
                              startTime: e.target.value,
                            })
                          }
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-600 uppercase">
                          End Time
                        </label>
                        <Input
                          type="time"
                          value={lessonGen.endTime}
                          onChange={(e) =>
                            setLessonGen({
                              ...lessonGen,
                              endTime: e.target.value,
                            })
                          }
                          className="h-10"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        Class Day
                      </label>
                      <select
                        className="w-full h-10 px-3 rounded-md border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={lessonGen.dayOfWeek}
                        onChange={(e) =>
                          setLessonGen({
                            ...lessonGen,
                            dayOfWeek: e.target.value,
                          })
                        }
                      >
                        <option value="1">Every Monday</option>
                        <option value="2">Every Tuesday</option>
                        <option value="3">Every Wednesday</option>
                        <option value="4">Every Thursday</option>
                        <option value="5">Every Friday</option>
                        <option value="6">Every Saturday</option>
                        <option value="0">Every Sunday</option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-600 uppercase">
                        Number of Lessons
                      </label>
                      <Input
                        type="number"
                        value={
                          isNaN(lessonGen.count) || lessonGen.count === 0
                            ? ""
                            : lessonGen.count
                        }
                        onChange={(e) =>
                          setLessonGen({
                            ...lessonGen,
                            count: parseInt(e.target.value) || 0,
                          })
                        }
                        className="h-10"
                      />
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={() =>
                          handleGenerateLessonsAuto(viewingLessonsForSession.id)
                        }
                        className="w-full bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
                      >
                        Generate Timetable
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="lg:col-span-2 shadow-sm">
                  <CardHeader className="flex flex-row items-center justify-between pb-4 border-b mb-4">
                    <CardTitle className="text-lg">Class Schedule</CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 text-blue-600 hover:bg-blue-50 font-bold text-xs"
                      onClick={async () => {
                        const title = prompt("Lesson Title:");
                        const date = prompt(
                          "Date (YYYY-MM-DD):",
                          viewingLessonsForSession.start_date || "",
                        );
                        if (title && date) {
                          try {
                            await setDoc(doc(collection(db, "lessons")), {
                              sessionId: viewingLessonsForSession.id,
                              lessonTitle: title,
                              lessonDate: date,
                              lessonNumber:
                                lessons.filter(
                                  (l) =>
                                    l.sessionId === viewingLessonsForSession.id,
                                ).length + 1,
                              startTime: "19:00",
                              endTime: "21:00",
                              lessonStatus: "scheduled",
                              createdAt: serverTimestamp(),
                            });
                            fetchData();
                            toast.success("Lesson added");
                          } catch (e: any) {
                            toast.error(e.message);
                          }
                        }
                      }}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> New Class
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lessons
                        .filter(
                          (l) => l.sessionId === viewingLessonsForSession.id,
                        )
                        .map((l, idx) => (
                          <div
                            key={l.id}
                            className="p-4 border rounded-xl hover:border-indigo-200 transition-all bg-white shadow-sm flex items-center justify-between group"
                          >
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                                {idx + 1}
                              </div>
                              <div className="space-y-1">
                                <div className="text-sm font-black text-slate-800 tracking-tight">
                                  {l.lesson_title}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 flex items-center gap-4">
                                  <span className="flex items-center gap-1.5 uppercase font-mono">
                                    <CalendarIcon className="w-3 h-3 text-indigo-400" />{" "}
                                    {l.lessonDate}
                                  </span>
                                  <span className="flex items-center gap-1.5 uppercase font-mono">
                                    <Clock className="w-3 h-3 text-indigo-400" />{" "}
                                    {l.startTime} - {l.endTime}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                title="Edit"
                                onClick={() => {
                                  const newDate = prompt(
                                    "New Date:",
                                    l.lesson_date,
                                  );
                                  if (newDate)
                                    handleUpdateLesson(l.id, {
                                      lesson_date: newDate,
                                    });
                                }}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-slate-300 hover:text-red-500 hover:bg-red-50"
                                title="Remove"
                                onClick={() => {
                                  confirmDelete(
                                    l.id,
                                    "lesson",
                                    l.lesson_title || "Unknown Lesson",
                                  );
                                }}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      {lessons.filter(
                        (l) => l.sessionId === viewingLessonsForSession.id,
                      ).length === 0 && (
                        <div className="text-center py-16 text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                          <CalendarIcon className="w-10 h-10 mx-auto mb-4 text-slate-200" />
                          <p className="font-bold text-slate-600 mb-1">
                            No lessons scheduled
                          </p>
                          <p className="text-xs max-w-[200px] mx-auto text-slate-400">
                            Use the batch scheduler to automate your run's
                            timetable.
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </>
      ) : (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm overflow-hidden">
          <CardHeader className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/50">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-lg font-black text-slate-800 tracking-tight">
                  Confirmed Course
                </CardTitle>
                <CardDescription className="text-xs font-medium text-slate-500">
                  Manage attendance sheets and issue certificates by course
                  intake
                </CardDescription>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search Code, Course Title, Course Name..."
                  className="pl-9 h-8 text-xs focus:ring-indigo-500 border-slate-200 bg-white"
                  value={sessionCertSearchTerm}
                  onChange={(e) => setSessionCertSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filter Row: Dates and Completed switch */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500 font-bold flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5 text-slate-400" /> Date
                  Range:
                </span>
                <div className="flex items-center gap-1.5">
                  <Input
                    type="date"
                    className="h-8 text-xs w-36 px-2 cursor-pointer border-slate-200 bg-white"
                    value={sessionCertsStartDate}
                    onChange={(e) => setSessionCertsStartDate(e.target.value)}
                  />
                  <span className="text-xs text-slate-400">to</span>
                  <Input
                    type="date"
                    className="h-8 text-xs w-36 px-2 cursor-pointer border-slate-200 bg-white"
                    value={sessionCertsEndDate}
                    onChange={(e) => setSessionCertsEndDate(e.target.value)}
                  />
                </div>
                {(sessionCertsStartDate || sessionCertsEndDate) && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSessionCertsStartDate("");
                      setSessionCertsEndDate("");
                    }}
                    className="h-7 text-xs text-rose-500 hover:text-rose-600 hover:bg-rose-50 px-2.5 font-semibold"
                  >
                    Clear
                  </Button>
)}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>day</TableHead>
                  <TableHead>EB Price</TableHead>
                  <TableHead>Base Price</TableHead>
                  <TableHead>Instructor</TableHead>
                  <TableHead>Delivery & Room</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedConfirmedRuns.map((s) => {
                  const course = courses.find((c) => c.id === s.courseId);
                  const instructor = tutors.find((t) => t.id === s.tutorId);
                  const sessionRegs = regs.filter(
                    (r) => r.sessionId === s.id && r.status === "verified",
                  );

                  return (
                    <TableRow
                      key={s.id}
                        className="hover:bg-slate-50/50"
                      >
                        <TableCell>
                          <div className="font-bold text-slate-900 whitespace-normal break-words max-w-[124px] leading-none mb-1 text-sm">
                            {course?.courseCode || s.sessionName}
                          </div>
                          <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-600 bg-blue-50/85 border border-blue-100/80 px-2 py-0.5 rounded-full mt-1.5">
                            <CalendarIcon className="w-3 h-3 text-blue-500 flex-shrink-0" />
                            <span>
                              {s.startDate || "No date"} to{" "}
                              {s.endDate || "No date"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs whitespace-normal break-words max-w-[180px] leading-tight font-medium text-slate-700">
                          {course?.title || "Unknown"}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-indigo-600">
                          {course?.day ? `${course.day} Days` : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-emerald-600">
                          {s.earlyBirdPrice !== undefined
                            ? `HK$${s.earlyBirdPrice}`
                            : course?.earlyBirdPrice !== undefined
                              ? `HK$${course.earlyBirdPrice}`
                              : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-600">
                          {s.standardPrice !== undefined
                            ? `HK$${s.standardPrice}`
                            : course?.standardPrice !== undefined
                              ? `HK$${course.standardPrice}`
                              : "-"}
                        </TableCell>
                        <TableCell className="text-xs font-medium">
                          {instructor?.name || "Unassigned"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            <span className="bg-slate-100 px-2 py-0.5 rounded uppercase font-black text-[10px] tracking-tight text-slate-600">
                              {s.deliveryMode === "onsite"
                                ? "ClassRoom"
                                : s.deliveryMode === "online"
                                  ? "Online"
                                  : s.deliveryMode === "hybrid"
                                    ? "Hybrid"
                                    : s.deliveryMode || "N/A"}
                            </span>
                            {s.room && (
                              <span className="text-[10px] font-bold text-blue-600 flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> Room:{" "}
                                {s.room.replace(
                                  /\s*\(Persons:.*?\)/gi,
                                  "",
                                )}
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">
                              {sessionRegs.length}
                            </span>
                            <span className="text-slate-400 text-xs">
                              / {s.quota || "-"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-black uppercase tracking-widest ${
                              s.sessionStatus === "completed"
                                ? "bg-slate-100 text-slate-500"
                                : (s.sessionStatus === "full" || s.sessionStatus === "confirmed")
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-blue-50 text-blue-600"
                            }`}
                          >
                            {s.sessionStatus === "completed"
                              ? "Completed"
                              : (s.sessionStatus === "full" || s.sessionStatus === "confirmed")
                                ? "Confirmed"
                                : s.sessionStatus || "Active"}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end items-center gap-1">
                            {getPermission("sessions") !== "view" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-slate-400 hover:text-blue-600"
                                  title="Edit"
                                  onClick={() => {
                                    setSelectedSession(s);
                                    setSessionModalOpen(true);
                                  }}
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 text-red-300 hover:text-red-600"
                                  title="Delete"
                                  onClick={() =>
                                    confirmDelete(
                                      s.id,
                                      "session",
                                      s.sessionName || "Unknown Course",
                                    )
                                  }
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold tracking-wider"
                              onClick={() => handleManageCertificates(s)}
                            >
                              Manage
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </CardContent>
          {filteredConfirmedRuns.length > 10 && (
            <div className="flex justify-end p-4 border-t border-slate-100">
              <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-500 font-medium">Page</span>
                <select
                  value={confirmedRunsPage}
                  onChange={(e) => setConfirmedRunsPage(Number(e.target.value))}
                  className="bg-white border border-slate-300 text-slate-700 text-xs rounded focus:ring-blue-500 focus:border-blue-500 block px-2 py-1 outline-none font-medium cursor-pointer"
                >
                  {Array.from({ length: confirmedRunsTotalPages }, (_, i) => i + 1).map(page => (
                    <option key={page} value={page}>{page}</option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 font-medium">of {confirmedRunsTotalPages}</span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
