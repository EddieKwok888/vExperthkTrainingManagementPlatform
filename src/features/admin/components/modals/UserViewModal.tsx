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
  Loader2,
} from "lucide-react";
import { formatHkDate } from "../../../../lib/utils";
import React, { useState, useEffect } from "react";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
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
  schoolInfo?: any;
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
  schoolInfo = {},
}: UserViewModalProps) {
  const [systemCategories, setSystemCategories] = useState<string[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  useEffect(() => {
    if (isUserViewModalOpen && selectedUser && (selectedUser.role === "tutor" || selectedUser.role === "tutor_pt")) {
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
      fetchCategories();
    }
  }, [isUserViewModalOpen, selectedUser]);

  const generateTutorProfilePDF = async () => {
    if (!selectedUser || isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    
    try {
      const docPdf = new jsPDF();
      
      let yPos = 40;
      // Header
      if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith("data:image")) {
        try {
          docPdf.addImage(schoolInfo.logo_url, "PNG", 20, 10, 25, 25);
          docPdf.setTextColor(0, 0, 0);
          docPdf.setFontSize(22);
          docPdf.text(schoolInfo.name || "School Name", 50, 22);
          docPdf.setFontSize(10);
          docPdf.setTextColor(100);
          docPdf.text(schoolInfo.address || "Address", 50, 30);
          docPdf.text(schoolInfo.phone || "Phone", 50, 35);
        } catch (e) {
          docPdf.setTextColor(0, 0, 0);
          docPdf.setFontSize(22);
          docPdf.text(schoolInfo.name || "School Name", 20, 20);
          docPdf.setFontSize(10);
          docPdf.setTextColor(100);
          docPdf.text(schoolInfo.address || "Address", 20, 28);
          docPdf.text(schoolInfo.phone || "Phone", 20, 33);
        }
      } else {
        docPdf.setTextColor(0, 0, 0);
        docPdf.setFontSize(22);
        docPdf.text(schoolInfo.name || "School Name", 20, 20);
        docPdf.setFontSize(10);
        docPdf.setTextColor(100);
        docPdf.text(schoolInfo.address || "Address", 20, 28);
        docPdf.text(schoolInfo.phone || "Phone", 20, 33);
      }

      docPdf.setDrawColor(0);
      docPdf.setLineWidth(0.5);
      docPdf.line(20, yPos, 190, yPos);
      yPos += 12;

      docPdf.setFontSize(20);
      docPdf.setTextColor(40, 40, 40);
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Instructor Profile", 20, yPos);
      yPos += 10;
      
      docPdf.setFontSize(14);
      docPdf.setTextColor(60, 60, 60);
      docPdf.setFont("helvetica", "bold");
      docPdf.text(selectedUser.name || "N/A", 20, yPos);
      yPos += 8;
      
      docPdf.setFontSize(10);
      docPdf.setTextColor(100, 100, 100);
      docPdf.setFont("helvetica", "normal");
      docPdf.text(`Email: ${selectedUser.email || "N/A"}`, 20, yPos);
      yPos += 6;
      docPdf.text(`Phone: ${selectedUser.phone || "N/A"}`, 20, yPos);
      yPos += 6;
      docPdf.text(`Company: ${selectedUser.company || "N/A"}`, 20, yPos);
      yPos += 12;
      
      const tutor = selectedUser.tutorProfile || {};
      
      if (tutor.bio) {
        docPdf.setFontSize(12);
        docPdf.setTextColor(40, 40, 40);
        docPdf.setFont("helvetica", "bold");
        docPdf.text("Professional Summary", 20, yPos);
        yPos += 8;
        
        docPdf.setFont("helvetica", "normal");
        docPdf.setFontSize(10);
        docPdf.setTextColor(60, 60, 60);
        const splitBio = docPdf.splitTextToSize(tutor.bio, 170); // 190 - 20 = 170
        docPdf.text(splitBio, 20, yPos);
        yPos += (splitBio.length * 5) + 10;
      }
      
      docPdf.setFontSize(12);
      docPdf.setTextColor(40, 40, 40);
      docPdf.setFont("helvetica", "bold");
      docPdf.text("Details", 20, yPos);
      yPos += 8;

      docPdf.setFont("helvetica", "normal");
      docPdf.setFontSize(10);
      docPdf.setTextColor(60, 60, 60);
      
      const printLine = (label: string, value: string) => {
        docPdf.setFont("helvetica", "bold");
        docPdf.text(`${label}:`, 20, yPos);
        docPdf.setFont("helvetica", "normal");
        const splitValue = docPdf.splitTextToSize(value, 120);
        docPdf.text(splitValue, 60, yPos);
        yPos += (splitValue.length * 5) + 2;
      };

      const translateLang = (lang: string) => {
        if (lang === '廣東話' || lang === 'Cantonese') return 'Cantonese';
        if (lang === '普通話' || lang === 'Mandarin') return 'Mandarin';
        if (lang === '英文' || lang === 'English') return 'English';
        return lang;
      };

      const languages = tutor.teachingLanguages?.map(translateLang).join(', ') || "Not specified";

      printLine("Employment Type", tutor.employmentType ? tutor.employmentType.replace('_', ' ').toUpperCase() : "Not specified");
      printLine("Teaching Languages", languages);
      printLine("Available Days", tutor.availableDays?.join(', ') || "Not specified");
      printLine("Qualified Categories", selectedUser.qualifiedCategories?.join(', ') || "Not specified");
      
      docPdf.save(`${selectedUser.name}_Instructor_Profile.pdf`.replace(/\s+/g, '_'));
    } catch (e: any) {
      console.error("PDF generation failed", e);
      toast.error(`Failed to generate PDF: ${e.message || "Unknown error"}`);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

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
                    <h3 className="text-lg font-bold flex items-center justify-between w-full">
                      <span className="flex items-center gap-2">
                        <GraduationCap className="w-5 h-5 text-indigo-600" />{" "}
                        Instructor Profile
                      </span>
                      <Button disabled={isGeneratingPdf} onClick={generateTutorProfilePDF} size="sm" variant="outline" className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                        {isGeneratingPdf ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} 
                        {isGeneratingPdf ? "Generating..." : "Export CV (PDF)"}
                      </Button>
                    </h3>

                    <div className="grid grid-cols-1 gap-6">
                        <Card className="bg-indigo-50/50 border-indigo-100">
                          <CardHeader className="py-3 px-4">
                            <CardTitle className="text-sm font-bold text-indigo-800">
                              Teaching Preferences & Bio
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="p-4 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">Employment Type</span>
                                <p className="text-sm font-medium text-slate-800 capitalize mt-1">
                                  {selectedUser.tutorProfile?.employmentType?.replace('_', ' ') || "Not specified"}
                                </p>
                              </div>
                              <div>
                                <span className="text-xs font-semibold text-slate-500 uppercase">Teaching Languages</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedUser.tutorProfile?.teachingLanguages?.length ? 
                                    selectedUser.tutorProfile.teachingLanguages.map(l => (
                                      <span key={l} className="px-2 py-0.5 bg-white border border-slate-200 text-slate-700 text-xs rounded-md">{l}</span>
                                    )) : <span className="text-sm text-slate-400">Not specified</span>
                                  }
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Available Days</span>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedUser.tutorProfile?.availableDays?.length ? 
                                    selectedUser.tutorProfile.availableDays.map(d => (
                                      <span key={d} className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-md font-medium">{d.substring(0, 3)}</span>
                                    )) : <span className="text-sm text-slate-400">Not specified</span>
                                  }
                                </div>
                              </div>
                              <div className="col-span-2">
                                <span className="text-xs font-semibold text-slate-500 uppercase">Bio</span>
                                <p className="text-sm text-slate-700 mt-1 whitespace-pre-wrap">
                                  {selectedUser.tutorProfile?.bio || <span className="text-slate-400 italic">No bio provided.</span>}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                      <Card>
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <BookOpen className="w-4 h-4" /> Qualified
                            Categories (Can Teach)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                          <div className="flex flex-wrap gap-2">
                            {systemCategories.length > 0 ? (
                              systemCategories.map((category) => {
                                const isSelected = selectedUser.qualifiedCategories?.includes(category);
                                return (
                                  <span
                                    key={category}
                                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-full border flex flex-col leading-tight ${isSelected ? "bg-indigo-50 text-indigo-700 border-indigo-100" : "bg-slate-50 text-slate-400 border-slate-100"}`}
                                  >
                                    <span>{category}</span>
                                  </span>
                                );
                              })
                            ) : (
                              selectedUser.qualifiedCategories?.map((category) => (
                                <span
                                  key={category}
                                  className="px-2.5 py-1.5 bg-indigo-50 text-indigo-700 text-xs font-semibold rounded-full border border-indigo-100 flex flex-col leading-tight"
                                >
                                  <span>{category}</span>
                                </span>
                              ))
                            )}
                            {(!selectedUser.qualifiedCategories || selectedUser.qualifiedCategories.length === 0) && systemCategories.length === 0 && (
                              <p className="text-xs text-slate-400 italic">
                                No specific categories assigned.
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
                            {[...certs]
                              .filter((c) => c.tutorId === selectedUser.id)
                              .sort((a, b) => (a.order || 0) - (b.order || 0))
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
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
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
