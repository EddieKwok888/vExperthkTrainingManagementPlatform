import {
  GraduationCap,
  BookOpen,
  Briefcase,
  BarChart2,
  MessageSquare,
  Star,
  CheckCircle,
  ShieldCheck,
  Trash2,
  Clock,
  Search,
  AlertTriangle,
  ChevronLeft,
  ExternalLink as Link,
  Award,
  Users,
  ShieldAlert,
  Mail,
  Phone,
  Calendar as CalendarIcon,
  Download,
  FileText,
} from "lucide-react";
import { formatHkDate } from "../../../../lib/utils";
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
export interface UserViewModalProps {
  certificates: any;
  certs: any;
  courses: any;
  expertise: any;
  feedbacks: any;
  generateBulkCertificatesPDF: any;
  generateMTMReport: any;
  globalAttendance: any;
  hours: any;
  isUserViewModalOpen: any;
  lessons: any;
  mtmYear: any;
  name: any;
  regs: any;
  role: any;
  selectedUser: any;
  sessions: any;
  setIsUserViewModalOpen: any;
  setMtmYear: any;
}

export function UserViewModal({
  certificates,
  certs,
  courses,
  expertise,
  feedbacks,
  generateBulkCertificatesPDF,
  generateMTMReport,
  globalAttendance,
  hours,
  isUserViewModalOpen,
  lessons,
  mtmYear,
  name,
  regs,
  role,
  selectedUser,
  sessions,
  setIsUserViewModalOpen,
  setMtmYear,
}: UserViewModalProps) {
  return (
    <Dialog open={isUserViewModalOpen} onOpenChange={setIsUserViewModalOpen}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        {selectedUser && (
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-2xl">
                  {selectedUser.name
                    ? selectedUser.name[0]
                    : selectedUser.email[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    {selectedUser.name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        selectedUser.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : selectedUser.role === "tutor" ||
                              selectedUser.role === "tutor_pt"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {selectedUser.role === "tutor_pt"
                        ? "Instructor (Part-Time)"
                        : selectedUser.role === "tutor"
                          ? "Instructor (Full-Time)"
                          : selectedUser.role}
                    </span>
                    <span
                      className={`flex items-center gap-1 text-[10px] font-bold uppercase ${
                        selectedUser.status === "active"
                          ? "text-green-600"
                          : "text-slate-400"
                      }`}
                    >
                      <div
                        className={`w-1 h-1 rounded-full ${selectedUser.status === "active" ? "bg-green-600" : "bg-slate-400"}`}
                      />
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-500 uppercase font-bold">
                  User ID
                </p>
                <p className="text-sm font-mono text-slate-700">
                  {selectedUser.id}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-4 md:col-span-1">
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-3 text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="text-sm">{selectedUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">
                        {selectedUser.phone || "No phone set"}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-600">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="text-sm">
                        Joined {formatHkDate(selectedUser.createdAt)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {selectedUser.remarks && (
                  <Card className="bg-amber-50/50 border-amber-100">
                    <CardContent className="p-4">
                      <p className="text-xs font-bold text-amber-800 uppercase flex items-center gap-2">
                        <ShieldAlert className="w-3 h-3" /> Admin Notes
                      </p>
                      <p className="text-sm text-amber-900 mt-2 italic">
                        "{selectedUser.remarks}"
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <div className="md:col-span-2">
                {["tutor", "tutor_pt"].includes(selectedUser.role || "") ? (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <GraduationCap className="w-5 h-5 text-indigo-600" />{" "}
                      Instructor Profile
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Qualified
                            Categories (Can Teach)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          {selectedUser.qualifiedCategories &&
                          selectedUser.qualifiedCategories.length > 0 ? (
                            <div className="space-y-4">
                              <div className="flex flex-wrap gap-2">
                                {selectedUser.qualifiedCategories.map(
                                  (category) => (
                                    <span
                                      key={category}
                                      className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex flex-col leading-tight"
                                    >
                                      <span>{category}</span>
                                    </span>
                                  ),
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400 italic">
                              No specific categories assigned.
                            </p>
                          )}
                        </CardContent>
                      </Card>

                      {/* Expertise Section */}
                      <Card>
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Expertise Areas
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {expertise
                              .filter((e) => e.tutorId === selectedUser.id)
                              .map((exp) => (
                                <div
                                  key={exp.id}
                                  className="bg-slate-50 border rounded-lg p-3 flex flex-col gap-1 w-full sm:w-[calc(50%-0.5rem)]"
                                >
                                  <div className="flex justify-between items-start">
                                    <p className="font-bold text-slate-800 text-sm">
                                      {exp.expertiseArea}
                                    </p>
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        exp.skillLevel === "expert"
                                          ? "bg-indigo-100 text-indigo-700"
                                          : exp.skillLevel === "advanced"
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-slate-100 text-slate-600"
                                      }`}
                                    >
                                      {exp.skillLevel}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500">
                                    {exp.yearsOfExperience} yrs exp •{" "}
                                    {exp.preferredCourseLevel} level
                                  </p>
                                </div>
                              ))}
                            {expertise.filter(
                              (e) => e.tutorId === selectedUser.id,
                            ).length === 0 && (
                              <p className="text-xs text-slate-400 italic">
                                No expertise areas recorded.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Certifications Section */}
                      <Card>
                        <CardHeader className="py-3 px-4 flex flex-row items-center justify-between">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <Award className="w-4 h-4" /> Certifications
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 scroll-m-1">
                          <div className="space-y-3">
                            {certs
                              .filter((c) => c.tutorId === selectedUser.id)
                              .map((cert) => (
                                <div
                                  key={cert.id}
                                  className="flex items-center justify-between p-3 border rounded-lg bg-slate-50"
                                >
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded bg-white border flex items-center justify-center text-indigo-600">
                                      <Award className="w-5 h-5" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-bold text-slate-800">
                                        {cert.certificationName}
                                      </p>
                                      <p className="text-[10px] text-slate-500 uppercase">
                                        {cert.issuingOrganization} •{" "}
                                        {cert.issueDate}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                        cert.status === "active"
                                          ? "bg-green-100 text-green-700"
                                          : cert.status === "expired"
                                            ? "bg-red-100 text-red-700"
                                            : "bg-amber-100 text-amber-700"
                                      }`}
                                    >
                                      {cert.status}
                                    </span>
                                    {cert.certificateFileUrl && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 w-7 p-0"
                                        onClick={() =>
                                          window.open(cert.certificateFileUrl)
                                        }
                                      >
                                        <Download className="w-3.5 h-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              ))}
                            {certs.filter((c) => c.tutorId === selectedUser.id)
                              .length === 0 && (
                              <p className="text-xs text-slate-400 italic">
                                No certifications recorded.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>

                      {/* Workload Section */}
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BarChart2 className="w-4 h-4" /> Workload Summary
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                Courses Handled
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {
                                  sessions.filter(
                                    (s) => s.tutorId === selectedUser.id,
                                  ).length
                                }
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                Avg Rating
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {(() => {
                                  const tutorFeedbacks = feedbacks.filter(
                                    (f) => {
                                      if (
                                        f.trainerName &&
                                        f.trainerName === selectedUser.name
                                      )
                                        return true;
                                      if (f.sessionId)
                                        return (
                                          sessions.find(
                                            (s) => s.id === f.sessionId,
                                          )?.tutorId === selectedUser.id
                                        );
                                      return (
                                        courses.find((c) => c.id === f.courseId)
                                          ?.tutorId === selectedUser.id
                                      );
                                    },
                                  );
                                  const total = tutorFeedbacks.reduce(
                                    (acc, curr) =>
                                      acc +
                                      parseFloat(
                                        curr.overallTrainerScore ||
                                          curr.overallCourseScore ||
                                          curr.rating ||
                                          0,
                                      ),
                                    0,
                                  );
                                  return tutorFeedbacks.length > 0
                                    ? (total / tutorFeedbacks.length).toFixed(1)
                                    : "N/A";
                                })()}
                              </p>
                            </div>
                            <div className="p-3 bg-slate-50 rounded-lg">
                              <p className="text-[10px] font-bold text-slate-500 uppercase">
                                Hours (MTD)
                              </p>
                              <p className="text-lg font-bold text-slate-900">
                                {hours
                                  .filter(
                                    (h) =>
                                      h.tutorId === selectedUser.id &&
                                      h.status === "approved",
                                  )
                                  .reduce(
                                    (acc, curr) => acc + (curr.hours || 0),
                                    0,
                                  )}
                              </p>
                            </div>
                            <div className="p-3 bg-indigo-50 rounded-lg">
                              <p className="text-[10px] font-bold text-indigo-500 uppercase">
                                Est. Payout
                              </p>
                              <p className="text-lg font-bold text-indigo-700">
                                $
                                {(
                                  hours
                                    .filter(
                                      (h) =>
                                        h.tutorId === selectedUser.id &&
                                        h.status === "approved",
                                    )
                                    .reduce(
                                      (acc, curr) => acc + (curr.hours || 0),
                                      0,
                                    ) *
                                  (selectedUser.tutorProfile?.hourlyRate || 150)
                                ).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* MTM Report Section */}
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <FileText className="w-4 h-4 text-emerald-600" />{" "}
                            Annual MTM Teaching Hours Report
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 flex items-center gap-4">
                          <select
                            className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white font-medium text-slate-700"
                            value={mtmYear}
                            onChange={(e) => setMtmYear(e.target.value)}
                          >
                            {(() => {
                              const y = new Date().getFullYear();
                              return [y, y - 1, y - 2, y - 3].map((yr) => (
                                <option key={yr} value={yr.toString()}>
                                  {yr}
                                </option>
                              ));
                            })()}
                          </select>
                          <Button
                            size="sm"
                            onClick={() =>
                              generateMTMReport(
                                selectedUser.id,
                                selectedUser.name || "Instructor",
                                mtmYear,
                              )
                            }
                            className="gap-2 h-9 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
                          >
                            <Download className="w-3.5 h-3.5" /> Export MTM PDF
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Instructor Evaluations Section */}
                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <MessageSquare className="w-4 h-4 text-blue-600" />{" "}
                            Instructor Evaluations
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            {feedbacks
                              .filter((f) => {
                                if (
                                  f.trainerName &&
                                  f.trainerName === selectedUser.name
                                )
                                  return true;
                                if (f.sessionId)
                                  return (
                                    sessions.find((s) => s.id === f.sessionId)
                                      ?.tutorId === selectedUser.id
                                  );
                                return (
                                  courses.find((c) => c.id === f.courseId)
                                    ?.tutorId === selectedUser.id
                                );
                              })
                              .map((f: any) => (
                                <div
                                  key={f.id}
                                  className="p-3 border rounded-lg hover:bg-blue-50/30 transition-colors"
                                >
                                  <div className="flex justify-between items-start mb-1">
                                    <span
                                      className="text-sm font-semibold text-slate-700 max-w-[200px] truncate"
                                      title={f.courseName}
                                    >
                                      {f.courseName}
                                    </span>
                                    <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                      <Star className="w-2.5 h-2.5 fill-current" />{" "}
                                      {f.overallTrainerScore ||
                                        f.overallCourseScore ||
                                        f.rating ||
                                        "-"}
                                    </span>
                                  </div>
                                  {f.trainerFeedback && (
                                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">
                                      "{f.trainerFeedback}"
                                    </p>
                                  )}
                                  {f.comment && !f.trainerFeedback && (
                                    <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">
                                      "{f.comment}"
                                    </p>
                                  )}
                                  <div className="text-[9px] text-slate-400 mt-2 font-mono">
                                    By: {f.studentName || "Anonymous"} •{" "}
                                    {f.date || "Unknown Date"}
                                  </div>
                                </div>
                              ))}
                            {feedbacks.filter((f) => {
                              if (
                                f.trainerName &&
                                f.trainerName === selectedUser.name
                              )
                                return true;
                              if (f.sessionId)
                                return (
                                  sessions.find((s) => s.id === f.sessionId)
                                    ?.tutorId === selectedUser.id
                                );
                              return (
                                courses.find((c) => c.id === f.courseId)
                                  ?.tutorId === selectedUser.id
                              );
                            }).length === 0 && (
                              <p className="text-xs text-slate-400 italic">
                                No evaluations received yet.
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-600" /> Student
                      Profile
                    </h3>
                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-bold">
                          Enrolled Courses
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {regs
                            .filter((r) => r.studentId === selectedUser.id)
                            .map((reg) => {
                              const course = courses.find(
                                (c) => c.id === reg.courseId,
                              );
                              const sessionLessons = lessons.filter(
                                (l) =>
                                  l.sessionId === reg.sessionId &&
                                  l.lessonStatus === "completed",
                              );
                              const attended = globalAttendance.filter(
                                (a) =>
                                  a.sessionId === reg.sessionId &&
                                  a.studentId === reg.studentId &&
                                  (a.status === "present" ||
                                    a.status === "present_am" ||
                                    a.status === "present_pm" ||
                                    a.status === "AM" ||
                                    a.status === "PM"),
                              ).length;
                              const total = sessionLessons.length;
                              const attPercentage =
                                total > 0
                                  ? Math.round((attended / total) * 100)
                                  : 0;
                              return (
                                <div
                                  key={reg.id}
                                  className="flex items-center justify-between p-2 border rounded hover:bg-slate-50"
                                >
                                  <div className="flex flex-col">
                                    <span className="text-sm font-medium">
                                      {course?.title || "Unknown Course"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 capitalize">
                                      {reg.status} • {reg.payment_status}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <div className="flex flex-col items-end">
                                      <span className="text-xs font-bold text-slate-700">
                                        {total > 0
                                          ? `${attPercentage}%`
                                          : "N/A"}
                                      </span>
                                      <span className="text-[9px] text-slate-400 uppercase tracking-wider">
                                        Attendance
                                      </span>
                                    </div>
                                    <Link
                                      to={`/admin/finances?registration=${reg.id}`}
                                      className="text-indigo-600 hover:underline text-xs"
                                    >
                                      View Payment
                                    </Link>
                                  </div>
                                </div>
                              );
                            })}
                          {regs.filter((r) => r.studentId === selectedUser.id)
                            .length === 0 && (
                            <p className="text-xs text-slate-400 italic">
                              No course payments found.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <Award className="w-4 h-4 text-emerald-600" />{" "}
                          Certificates Earned
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {certificates
                            .filter(
                              (cert: any) =>
                                cert.studentId === selectedUser.id ||
                                (cert.studentEmail &&
                                  cert.studentEmail === selectedUser.email),
                            )
                            .map((c: any) => (
                              <div
                                key={c.id}
                                className="flex items-center justify-between p-2 border rounded hover:bg-emerald-50/30 transition-colors"
                              >
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-slate-700">
                                    {c.courseTitle || c.courseId}
                                  </span>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    Issued:{" "}
                                    {c.issuedAt?.toDate
                                      ? c.issuedAt.toDate().toLocaleDateString()
                                      : "Unknown Date"}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-bold hidden sm:inline">
                                    CERTIFIED
                                  </span>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() =>
                                      generateBulkCertificatesPDF(
                                        [c],
                                        c.courseTitle || "Certificate",
                                      )
                                    }
                                    className="h-7 text-[10px] px-2 gap-1 font-bold text-emerald-700 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"
                                  >
                                    <Download className="w-3 h-3" /> View
                                  </Button>
                                </div>
                              </div>
                            ))}
                          {certificates.filter(
                            (cert: any) =>
                              cert.studentId === selectedUser.id ||
                              (cert.studentEmail &&
                                cert.studentEmail === selectedUser.email),
                          ).length === 0 && (
                            <p className="text-xs text-slate-400 italic">
                              No certificates earned yet.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-blue-600" />{" "}
                          Submitted Feedbacks
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="space-y-2">
                          {feedbacks
                            .filter(
                              (f) => f.studentEmail === selectedUser.email,
                            )
                            .map((f: any) => (
                              <div
                                key={f.id}
                                className="p-3 border rounded-lg hover:bg-blue-50/30 transition-colors"
                              >
                                <div className="flex justify-between items-start mb-1">
                                  <span
                                    className="text-sm font-semibold text-slate-700 max-w-[200px] truncate"
                                    title={f.courseName}
                                  >
                                    {f.courseName}
                                  </span>
                                  <span className="bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded text-[10px] font-bold inline-flex items-center gap-1">
                                    <Star className="w-2.5 h-2.5 fill-current" />{" "}
                                    {f.overallCourseScore || f.rating || "-"}
                                  </span>
                                </div>
                                {f.comment && (
                                  <p className="text-xs text-slate-500 italic mt-1 line-clamp-2">
                                    "{f.comment}"
                                  </p>
                                )}
                                <div className="text-[9px] text-slate-400 mt-2 font-mono">
                                  {f.date || "Unknown Date"}
                                </div>
                              </div>
                            ))}
                          {feedbacks.filter(
                            (f) => f.studentEmail === selectedUser.email,
                          ).length === 0 && (
                            <p className="text-xs text-slate-400 italic">
                              No feedbacks submitted.
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsUserViewModalOpen(false)}
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
