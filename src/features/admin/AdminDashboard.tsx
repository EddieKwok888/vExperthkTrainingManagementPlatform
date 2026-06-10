import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import "react-big-calendar/lib/css/react-big-calendar.css";
import { useTranslation } from "react-i18next";
import { db, auth, app, storage } from "../../lib/firebase";
import {
  collection,
  query,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
  writeBatch,
  where,
  addDoc,
  limit,
  deleteDoc,
  increment,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import {
  sendPasswordResetEmail,
  getAuth,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { AuthContext } from "../../App";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import {
  MonitorPlay,
  Loader2,
  Plus,
  Database,
  ExternalLink,
  LayoutDashboard,
  BookOpen,
  Calendar as CalendarIcon,
  Users,
  CreditCard,
  Clock,
  MessageSquare,
  CheckCircle,
  XCircle,
  Download,
  FileText,
  Upload,
  GraduationCap,
  BarChart2,
  BarChart3,
  TrendingUp,
  ShieldAlert,
  Building2,
  MapPin,
  CalendarRange,
  Share2,
  ArrowLeftRight,
  ClipboardList,
  Search,
  UserPlus,
  Mail,
  Phone,
  Award,
  ShieldCheck,
  Briefcase,
  KeyRound,
  Copy,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Star,
  AlertTriangle,
  History,
} from "lucide-react";
import { toast } from "sonner";
import { jsPDF } from "jspdf";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { logAudit, updateRecord, createRecord } from "../../lib/services";
import { isWeekendOrHoliday } from "../../lib/holidays";
import { formatHkDate } from "../../lib/utils";
import { Calendar, dateFnsLocalizer, Views } from "react-big-calendar";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../../components/ui/command";
import { cn } from "../../lib/utils";
import {
  User,
  TutorCertification,
  TutorExpertise,
  UserRole,
  UserStatus,
  SkillLevel,
  CourseLevel,
  CertificationStatus,
} from "../../types";
const PermissionsTab = React.lazy(() =>
  import("./components/PermissionsTab").then((m) => ({
    default: m.PermissionsTab,
  })),
);
const LogsTab = React.lazy(() =>
  import("./components/LogsTab").then((m) => ({ default: m.LogsTab })),
);
const PromotionsTab = React.lazy(() =>
  import("./components/PromotionsTab").then((m) => ({
    default: m.PromotionsTab,
  })),
);
import {
  PROMO_CATEGORIES,
  PROMO_CATEGORY_MAP,
} from "./components/PromotionsTab";
const SettingsTab = React.lazy(() =>
  import("./components/SettingsTab").then((m) => ({ default: m.SettingsTab })),
);
const FeedbackTemplateTab = React.lazy(() =>
  import("./components/FeedbackTemplateTab").then((m) => ({
    default: m.FeedbackTemplateTab,
  })),
);
const FeedbackTab = React.lazy(() =>
  import("./components/FeedbackTab").then((m) => ({ default: m.FeedbackTab })),
);
const CoursesTab = React.lazy(() =>
  import("./components/CoursesTab").then((m) => ({ default: m.CoursesTab })),
);
const TutorsTab = React.lazy(() =>
  import("./components/TutorsTab").then((m) => ({ default: m.TutorsTab })),
);
const FinanceTab = React.lazy(() =>
  import("./components/FinanceTab").then((m) => ({ default: m.FinanceTab })),
);
const SchedulingTab = React.lazy(() =>
  import("./components/SchedulingTab").then((m) => ({
    default: m.SchedulingTab,
  })),
);
const OverviewTab = React.lazy(() =>
  import("./components/OverviewTab").then((m) => ({ default: m.OverviewTab })),
);
const SessionsTab = React.lazy(() =>
  import("./components/SessionsTab").then((m) => ({ default: m.SessionsTab })),
);
const UsersTab = React.lazy(() =>
  import("./components/UsersTab").then((m) => ({ default: m.UsersTab })),
);
const AttendanceModal = React.lazy(() =>
  import("./components/modals/AttendanceModal").then((m) => ({
    default: m.AttendanceModal,
  })),
);
const CertificateModal = React.lazy(() =>
  import("./components/modals/CertificateModal").then((m) => ({
    default: m.CertificateModal,
  })),
);
const DeleteConfirmModal = React.lazy(() =>
  import("./components/modals/DeleteConfirmModal").then((m) => ({
    default: m.DeleteConfirmModal,
  })),
);
const DeleteLogsModal = React.lazy(() =>
  import("./components/modals/DeleteLogsModal").then((m) => ({
    default: m.DeleteLogsModal,
  })),
);
const DeletePromoModal = React.lazy(() =>
  import("./components/modals/DeletePromoModal").then((m) => ({
    default: m.DeletePromoModal,
  })),
);
const ManualHoursModal = React.lazy(() =>
  import("./components/modals/ManualHoursModal").then((m) => ({
    default: m.ManualHoursModal,
  })),
);
const PromoModal = React.lazy(() =>
  import("./components/modals/PromoModal").then((m) => ({
    default: m.PromoModal,
  })),
);
const SessionAttendanceModal = React.lazy(() =>
  import("./components/modals/SessionAttendanceModal").then((m) => ({
    default: m.SessionAttendanceModal,
  })),
);
const SessionCreationModal = React.lazy(() =>
  import("./components/modals/SessionCreationModal").then((m) => ({
    default: m.SessionCreationModal,
  })),
);
const SessionEditModal = React.lazy(() =>
  import("./components/modals/SessionEditModal").then((m) => ({
    default: m.SessionEditModal,
  })),
);
const UserDeleteModal = React.lazy(() =>
  import("./components/modals/UserDeleteModal").then((m) => ({
    default: m.UserDeleteModal,
  })),
);
const UserFormModal = React.lazy(() =>
  import("./components/modals/UserFormModal").then((m) => ({
    default: m.UserFormModal,
  })),
);
const UserViewModal = React.lazy(() =>
  import("./components/modals/UserViewModal").then((m) => ({
    default: m.UserViewModal,
  })),
);
const CategoryManagerModal = React.lazy(() =>
  import("./components/modals/CategoryManagerModal").then((m) => ({
    default: m.CategoryManagerModal,
  })),
);
const CourseCreationModal = React.lazy(() =>
  import("./components/modals/CourseCreationModal").then((m) => ({
    default: m.CourseCreationModal,
  })),
);
const CourseEditModal = React.lazy(() =>
  import("./components/modals/CourseEditModal").then((m) => ({
    default: m.CourseEditModal,
  })),
);

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const EXPERTISE_AREAS = [
  "Microsoft 365",
  "Microsoft Copilot",
  "Copilot Studio",
  "Azure",
  "AWS",
  "Google Cloud",
  "Cybersecurity",
  "AI Tools",
  "Data Analytics",
  "Programming",
  "Business Applications",
  "Project Management",
];

const COMMON_CERTS = [
  "AZ-900: Azure Fundamentals",
  "PL-300: Data Analyst",
  "AI-900: AI Fundamentals",
  "PMP: Project Management",
  "AWS Solutions Architect",
  "CompTIA Security+",
];

import { signInWithEmailAndPassword } from "firebase/auth";

// Shared memory Cache to handle Firestore Queries Caching
let adminDataCache: {
  timestamp: number;
  data: {
    courses: any[];
    regs: any[];
    sessions: any[];
    lessons: any[];
    tutors: any[];
    feedbacks: any[];
    hours: any[];
    allUsers: any[];
    certs: any[];
    expertise: any[];
    certificates: any[];
    globalAttendance: any[];
    auditLogs: any[];
    branches: any[];
    tutorShifts: any[];
    promotions: any[];
    schoolInfo: any;
  };
} | null = null;
const CACHE_TTL = 30000; // 30 seconds

export function AdminDashboard() {
  const { role, user } = useContext(AuthContext);
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("overview");

  const [courses, setCourses] = useState<any[]>([]);
  const [courseCategories, setCourseCategories] = useState<string[]>([
    "Microsoft",
    "AWS",
    "Technology",
    "Business",
    "Security",
    "Data & AI",
  ]);
  const [categoryManagerOpen, setCategoryManagerOpen] = useState(false);
  const [regs, setRegs] = useState<any[]>([]);
  const [editingReg, setEditingReg] = useState<any>(null);
  const [isEditRegOpen, setIsEditRegOpen] = useState(false);
  const [regSearchTerm, setRegSearchTerm] = useState("");
  const [sessions, setSessions] = useState<any[]>([]);
  const [lessons, setLessons] = useState<any[]>([]);
  const [tutors, setTutors] = useState<any[]>([]);
  const [feedbacks, setFeedbacks] = useState<any[]>([]);
  const [selectedFeedbackCourse, setSelectedFeedbackCourse] =
    useState<any>(null);
  const [hours, setHours] = useState<any[]>([]);
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [certs, setCerts] = useState<TutorCertification[]>([]);
  const [expertise, setExpertise] = useState<TutorExpertise[]>([]);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [globalAttendance, setGlobalAttendance] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [tutorShifts, setTutorShifts] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [isManualHoursModalOpen, setIsManualHoursModalOpen] = useState(false);
  const [manualHoursForm, setManualHoursForm] = useState({
    tutorId: "",
    date: new Date().toISOString().split("T")[0],
    course: "",
  });
  const [isSubmittingManualHours, setIsSubmittingManualHours] = useState(false);

  const [sessionModalOpen, setSessionModalOpen] = useState(false);
  const [isCoursePopoverOpen, setIsCoursePopoverOpen] = useState(false);
  const [isTutorPopoverOpen, setIsTutorPopoverOpen] = useState(false);
  const [sessionCreationModalOpen, setSessionCreationModalOpen] =
    useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [courseModalOpen, setCourseModalOpen] = useState(false);
  const [courseCreationModalOpen, setCourseCreationModalOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [selectedTemplateForIntake, setSelectedTemplateForIntake] =
    useState<any>(null);
  const [viewingLessonsForSession, setViewingLessonsForSession] =
    useState<any>(null);
  const [sessionEnrollees, setSessionEnrollees] = useState<any[]>([]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>(
    {},
  );
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [isSessionAttendanceModalOpen, setIsSessionAttendanceModalOpen] =
    useState(false);
  const [selectedSessionForAttendance, setSelectedSessionForAttendance] =
    useState<any>(null);
  const [selectedLessonForAttendance, setSelectedLessonForAttendance] =
    useState<any>(null);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // User Management Modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isUserViewModalOpen, setIsUserViewModalOpen] = useState(false);
  const [isDeleteUserModalOpen, setIsDeleteUserModalOpen] = useState(false);
  const [adminPasswordForDelete, setAdminPasswordForDelete] = useState("");
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userForm, setUserForm] = useState<
    Partial<User> & { password?: string }
  >({
    role: "student",
    status: "active",
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [courseSearchTerm, setCourseSearchTerm] = useState("");
  const [instructorSearchTerm, setInstructorSearchTerm] = useState("");
  const [certSearchTerm, setCertSearchTerm] = useState("");
  const [certDateTerm, setCertDateTerm] = useState("");
  const [courseRunSearchTerm, setCourseRunSearchTerm] = useState("");
  const [showCompletedRuns, setShowCompletedRuns] = useState(false);
  const [runsStartDate, setRunsStartDate] = useState("");
  const [runsEndDate, setRunsEndDate] = useState("");

  const [sessionCertSearchTerm, setSessionCertSearchTerm] = useState("");
  const [sessionCertsStartDate, setSessionCertsStartDate] = useState("");
  const [sessionCertsEndDate, setSessionCertsEndDate] = useState("");

  const [courseRunsActiveTab, setCourseRunsActiveTab] = useState<
    "runs" | "attendance"
  >("runs");
  const [scheduleTab, setScheduleTab] = useState<
    | "trainer-daily"
    | "trainer-monthly"
    | "room-daily"
    | "room-monthly"
    | "tech-daily"
  >("trainer-daily");
  const [scheduleDate, setScheduleDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [scheduleInstructorFilter, setScheduleInstructorFilter] = useState("");
  const [scheduleRoomFilter, setScheduleRoomFilter] = useState("");
  const [scheduleMonth, setScheduleMonth] = useState(
    new Date().toISOString().slice(0, 7),
  );
  const [mtmYear, setMtmYear] = useState(new Date().getFullYear().toString());
  const [ptMonth, setPtMonth] = useState(new Date().toISOString().slice(0, 7));
  const [isCertModalOpen, setIsCertModalOpen] = useState(false);
  const [selectedSessionCert, setSelectedSessionCert] = useState<any>(null);
  const [sessionStudentsData, setSessionStudentsData] = useState<any[]>([]);
  const [isCertLoading, setIsCertLoading] = useState(false);
  const [pastDaysToShow, setPastDaysToShow] = useState(0);
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState<{
    key: keyof User;
    direction: "asc" | "desc";
  }>({ key: "name", direction: "asc" });
  const [newBranch, setNewBranch] = useState({
    name: "",
    address: "",
    contact_phone: "",
  });
  const [schedulingBranch, setSchedulingBranch] = useState<string>("");
  const [batchScheduling, setBatchScheduling] = useState({
    branchId: "",
    tutorIds: [] as string[],
    startDate: "",
    endDate: "",
    startTime: "09:00",
    endTime: "18:00",
  });
  const [schoolInfo, setSchoolInfo] = useState({
    name: "Training Academy",
    logo_url: "",
    address: "123 Tech Avenue, Kowloon, Hong Kong",
    phone: "+852 2345 6789",
    email: "sales@example.com",
    invoice_prefix: "INV",
    terms_conditions:
      "1. Fees are non-refundable.\n2. Please present this receipt for course entry.",
    rooms: "",
  });

  // Promotions State
  const [promotions, setPromotions] = useState<any[]>([]);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
  const [isDeletePromoModalOpen, setIsDeletePromoModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState<any>(null);
  const [selectedPromo, setSelectedPromo] = useState<any>(null);
  const [promoForm, setPromoForm] = useState<any>({
    name: "",
    code: "",
    type: "code",
    category: "seminar",
    discountType: "fixed",
    discountValue: 0,
    status: "active",
    applicableCourseIds: [],
    bundleCourse1: "",
    bundleCourse2: "",
    startDate: "",
    endDate: "",
    adminPassword: "",
  });
  const [promoCategoryFilter, setPromoCategoryFilter] = useState("all");

  // Permissions & Granular Access Control States
  const [selectedAccessRole, setSelectedAccessRole] = useState("admin");
  const [simulatedRole, setSimulatedRole] = useState("admin");
  const [isSimulatingGlobally, setIsSimulatingGlobally] = useState<boolean>(
    () => {
      return localStorage.getItem("vex_is_simulating_globally") === "true";
    },
  );
  const [activeAccessSection, setActiveAccessSection] = useState<
    "matrix" | "details" | "sim" | "docs"
  >("matrix");
  const [customRolePermissions, setCustomRolePermissions] = useState<any[]>(
    () => {
      const saved = localStorage.getItem("vex_role_permissions");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse vex_role_permissions", e);
        }
      }
      return [
        {
          roleId: "admin",
          name: "Super Admin",
          desc: "超級管理員 - 可以看到所有東西。擁有最高權限，控制系統設定、備份及所有權限分配。",
          maxAuthAmount: "Unlimited",
          restrictions: "None",
          permissions: {
            overview: "full",
            courses: "full",
            sessions: "full",
            finance: "full",
            certificates: "full",
            scheduling: "full",
            tutors: "full",
            feedback: "full",
            logs: "full",
            staff: "full",
            students: "full",
            promotions: "full",
            permissions: "full",
            settings: "full",
          },
        },
        {
          roleId: "coordinator",
          name: "Course Coordinator",
          desc: "課程統籌 - 負責課程管理、排堂排師、處理證書及學生名單，無法存取財務報表 or 系統設定。",
          maxAuthAmount: "N/A",
          restrictions:
            "Restricted from managing finance, deleting users, or viewing system audit logs.",
          permissions: {
            overview: "view",
            courses: "full",
            sessions: "full",
            finance: "none",
            certificates: "full",
            scheduling: "full",
            tutors: "view",
            feedback: "full",
            logs: "none",
            staff: "full",
            students: "full",
            promotions: "full",
            permissions: "none",
            settings: "full",
          },
        },
        {
          roleId: "finance",
          name: "Finance",
          desc: "會計 - 處理財務報表、付款設定及電子收據。無法管理課程、學生 or 排期。",
          maxAuthAmount: "Unlimited (Finance only)",
          restrictions:
            "Restricted from managing courses, schedules, evaluating feedback, or issuing certificates.",
          permissions: {
            overview: "view",
            courses: "none",
            sessions: "none",
            finance: "full",
            certificates: "none",
            scheduling: "none",
            tutors: "none",
            feedback: "none",
            logs: "view",
            staff: "none",
            students: "none",
            promotions: "none",
            permissions: "none",
            settings: "none",
          },
        },
        {
          roleId: "staff",
          name: "Staff (Other)",
          desc: "一般職員 - 處理基本查詢及客服。",
          maxAuthAmount: "HKD 2,000 / tx",
          restrictions:
            "Restricted from system settings, high-level finance, and course creations.",
          permissions: {
            overview: "none",
            courses: "view",
            sessions: "view",
            finance: "none",
            certificates: "view",
            scheduling: "view",
            tutors: "view",
            feedback: "view",
            logs: "none",
            staff: "view",
            students: "view",
            promotions: "view",
            permissions: "none",
            settings: "none",
          },
        },
      ];
    },
  );

  useEffect(() => {
    localStorage.setItem(
      "vex_is_simulating_globally",
      isSimulatingGlobally ? "true" : "false",
    );
  }, [isSimulatingGlobally]);

  // Real-time Firestore stream listener for global role permissions!
  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, "settings", "role_permissions"),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          if (data && Array.isArray(data.roles)) {
            setCustomRolePermissions(data.roles);
            localStorage.setItem(
              "vex_role_permissions",
              JSON.stringify(data.roles),
            );
          }
        } else {
          // If snapshot doc doesn't exist, seed it with default roles including all 14 keys
          const defaultRoles = [
            {
              roleId: "admin",
              name: "Super Admin",
              desc: "超級管理員 - 可以看到所有東西。擁有最高權限，控制系統設定、備份及所有權限分配。",
              maxAuthAmount: "Unlimited",
              restrictions: "None",
              permissions: {
                overview: "full",
                courses: "full",
                sessions: "full",
                finance: "full",
                certificates: "full",
                scheduling: "full",
                tutors: "full",
                feedback: "full",
                logs: "full",
                staff: "full",
                students: "full",
                promotions: "full",
                permissions: "full",
                settings: "full",
              },
            },
            {
              roleId: "coordinator",
              name: "Course Coordinator",
              desc: "課程統籌 - 負責課程管理、排堂排師、處理證書及學生名單，無法存取財務報表 or 系統設定。",
              maxAuthAmount: "N/A",
              restrictions:
                "Restricted from managing finance, deleting users, or viewing system audit logs.",
              permissions: {
                overview: "view",
                courses: "full",
                sessions: "full",
                finance: "none",
                certificates: "full",
                scheduling: "full",
                tutors: "view",
                feedback: "full",
                logs: "none",
                staff: "full",
                students: "full",
                promotions: "full",
                permissions: "none",
                settings: "full",
              },
            },
            {
              roleId: "finance",
              name: "Finance",
              desc: "會計 - 處理財務報表、付款設定及電子收據。無法管理課程、學生 or 排期。",
              maxAuthAmount: "Unlimited (Finance only)",
              restrictions:
                "Restricted from managing courses, schedules, evaluating feedback, or issuing certificates.",
              permissions: {
                overview: "view",
                courses: "none",
                sessions: "none",
                finance: "full",
                certificates: "none",
                scheduling: "none",
                tutors: "none",
                feedback: "none",
                logs: "view",
                staff: "none",
                students: "none",
                promotions: "none",
                permissions: "none",
                settings: "none",
              },
            },
            {
              roleId: "staff",
              name: "Staff (Other)",
              desc: "一般職員 - 處理基本查詢及客服。",
              maxAuthAmount: "HKD 2,000 / tx",
              restrictions:
                "Restricted from system settings, high-level finance, and course creations.",
              permissions: {
                overview: "none",
                courses: "view",
                sessions: "view",
                finance: "none",
                certificates: "view",
                scheduling: "view",
                tutors: "view",
                feedback: "view",
                logs: "none",
                staff: "view",
                students: "view",
                promotions: "view",
                permissions: "none",
                settings: "none",
              },
            },
          ];
          setDoc(doc(db, "settings", "role_permissions"), {
            roles: defaultRoles,
          }).catch((err) => {
            console.error("Failed to seed initial role permissions:", err);
          });
        }
      },
      (error) => {
        console.error("Error listening to role_permissions changes:", error);
      },
    );
    return () => unsub();
  }, []);

  const updateRolePermissionsInDb = async (newRoles: any[]) => {
    setCustomRolePermissions(newRoles);
    localStorage.setItem("vex_role_permissions", JSON.stringify(newRoles));
    try {
      await setDoc(doc(db, "settings", "role_permissions"), {
        roles: newRoles,
      });
    } catch (e) {
      console.error("Failed to update role_permissions in Firestore:", e);
      toast.error("Failed to synchronize permission adjustments globally.");
    }
  };

  // New Course Form
  const [newCourse, setNewCourse] = useState({
    courseCode: "",
    title: "",
    certName: "",
    category: "",
    level: "",
    day: "",
    description: "",
    outlineName: "",
    outlineData: "",
    earlyBirdPrice: 0,
    standardPrice: 0,
    tutorId: "",
    requiredExpertise: [] as string[],
    requiredCertifications: [] as string[],
  });

  const fetchData = async (forceRefresh = true) => {
    const nowTime = Date.now();

    // Check if we can load fresh-cached data instantly
    if (
      !forceRefresh &&
      adminDataCache &&
      nowTime - adminDataCache.timestamp < CACHE_TTL
    ) {
      const cached = adminDataCache.data;
      setCourses(cached.courses);
      setRegs(cached.regs);
      setSessions(cached.sessions);
      setLessons(cached.lessons);
      setTutors(cached.tutors);
      setFeedbacks(cached.feedbacks);
      setHours(cached.hours);
      setAllUsers(cached.allUsers);
      setCerts(cached.certs);
      setExpertise(cached.expertise);
      setCertificates(cached.certificates);
      setGlobalAttendance(cached.globalAttendance);
      setAuditLogs(cached.auditLogs);
      setBranches(cached.branches);
      setTutorShifts(cached.tutorShifts);
      setPromotions(cached.promotions);
      if (cached.schoolInfo) setSchoolInfo(cached.schoolInfo);
      setLoading(false);
      return;
    }

    // SVR (Stale While Revalidate): If cache exists, apply it immediately, then fetch updates silently in the background
    if (adminDataCache) {
      const cached = adminDataCache.data;
      setCourses(cached.courses);
      setRegs(cached.regs);
      setSessions(cached.sessions);
      setLessons(cached.lessons);
      setTutors(cached.tutors);
      setFeedbacks(cached.feedbacks);
      setHours(cached.hours);
      setAllUsers(cached.allUsers);
      setCerts(cached.certs);
      setExpertise(cached.expertise);
      setCertificates(cached.certificates);
      setGlobalAttendance(cached.globalAttendance);
      setAuditLogs(cached.auditLogs);
      setBranches(cached.branches);
      setTutorShifts(cached.tutorShifts);
      setPromotions(cached.promotions);
      if (cached.schoolInfo) setSchoolInfo(cached.schoolInfo);
    } else {
      setLoading(true);
    }

    try {
      const fetchCollection = async (
        collectionName: string,
        queryConstraint?: any,
      ) => {
        try {
          const q = queryConstraint
            ? query(collection(db, collectionName), ...queryConstraint)
            : collection(db, collectionName);
          return await getDocs(q);
        } catch (e: any) {
          console.error(`Failed to fetch ${collectionName}:`, e);
          if (e.message.includes("permission")) {
            toast.error(`Permission Denied: ${collectionName}`);
          }
          throw e;
        }
      };

      const [
        cSnap,
        rSnap,
        sSnap,
        lSnap,
        tSnap,
        fSnap,
        hSnap,
        certSnap,
        auditSnap,
        schoolSnap,
        bSnap,
        tsSnap,
        uSnap,
        tCertSnap,
        tExpSnap,
        kbSnap,
        ticketSnap,
        promoSnap,
        attSnap,
      ] = await Promise.all([
        fetchCollection("courses", [orderBy("createdAt", "desc"), limit(100)]),
        fetchCollection("registrations", [
          orderBy("createdAt", "desc"),
          limit(200),
        ]),
        fetchCollection("course_sessions", [
          orderBy("createdAt", "desc"),
          limit(200),
        ]),
        fetchCollection("lessons", [orderBy("lessonDate", "asc"), limit(500)]),
        fetchCollection("users", [
          where("role", "in", ["tutor", "tutor_pt"]),
          limit(100),
        ]),
        fetchCollection("feedbacks", [
          orderBy("createdAt", "desc"),
          limit(100),
        ]),
        fetchCollection("teaching_hours", [
          orderBy("createdAt", "desc"),
          limit(100),
        ]),
        fetchCollection("certificates", [limit(100)]),
        fetchCollection("audit_logs", [
          orderBy("createdAt", "desc"),
          limit(1000),
        ]),
        fetchCollection("settings", []),
        fetchCollection("branches", [orderBy("name", "asc")]),
        fetchCollection("tutor_shifts", [limit(500)]),
        fetchCollection("users", [limit(500)]),
        fetchCollection("tutor_certifications", [limit(500)]),
        fetchCollection("tutor_expertise", [limit(500)]),
        fetchCollection("knowledge_base", [limit(500)]),
        fetchCollection("support_tickets", [limit(500)]),
        fetchCollection("promotions", [
          orderBy("createdAt", "desc"),
          limit(200),
        ]),
        fetchCollection("attendance", [limit(2000)]),
      ]);

      const coursesRes = cSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const regsRes = rSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const fetchedSessions = sSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const now = new Date();
      now.setHours(0, 0, 0, 0); // normalize today to midnight

      const updatedSessionsList = await Promise.all(
        fetchedSessions.map(async (session: any) => {
          let changed = false;
          let newStatus = session.sessionStatus;
          const sessionRegsCount = rSnap.docs.filter(
            (d) => d.data().sessionId === session.id,
          ).length;

          // Auto 'completed' 1 day after end date
          if (
            session.endDate &&
            newStatus !== "completed" &&
            newStatus !== "cancelled"
          ) {
            const endDateVal = new Date(session.endDate);
            endDateVal.setDate(endDateVal.getDate() + 1);
            endDateVal.setHours(0, 0, 0, 0);

            if (now >= endDateVal) {
              newStatus = "completed";
              changed = true;
            }
          }

          // Auto 'cancelled' and 'full' based on start date
          if (
            session.startDate &&
            !changed &&
            newStatus !== "completed" &&
            newStatus !== "cancelled"
          ) {
            const startDateVal = new Date(session.startDate);
            startDateVal.setHours(0, 0, 0, 0);

            const oneDayBefore = new Date(startDateVal);
            oneDayBefore.setDate(oneDayBefore.getDate() - 1);
            oneDayBefore.setHours(0, 0, 0, 0);

            if (now >= startDateVal && sessionRegsCount === 0) {
              newStatus = "cancelled";
              changed = true;
            } else if (now >= oneDayBefore && newStatus === "open") {
              newStatus = "full";
              changed = true;
            }
          }

          if (changed) {
            try {
              await updateDoc(doc(db, "course_sessions", session.id), {
                sessionStatus: newStatus,
              });
              return { ...session, sessionStatus: newStatus };
            } catch (err) {
              console.error("Auto status update failed:", err);
            }
          }
          return session;
        }),
      );

      const lessonsRes = lSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const tutorsRes = tSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const feedbacksRes = fSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const hoursRes = hSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const allUsersRes = uSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as User,
      );
      const certsRes = tCertSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as TutorCertification,
      );
      const expertiseRes = tExpSnap.docs.map(
        (d) => ({ id: d.id, ...d.data() }) as TutorExpertise,
      );
      const certificatesRes = certSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const attendanceRes = attSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const auditRes = auditSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const branchesRes = bSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
      const tutorShiftsRes = tsSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const promotionsRes = promoSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      const sData = schoolSnap.docs.find((d) => d.id === "school_info")?.data();
      const catData = schoolSnap.docs
        .find((d) => d.id === "course_categories")
        ?.data();

      if (catData && catData.categories) {
        setCourseCategories(catData.categories);
      } else {
        // Create default if not found
        const defaultCats = [
          "Microsoft",
          "AWS",
          "Technology",
          "Business",
          "Security",
          "Data & AI",
        ];
        setCourseCategories(defaultCats);
      }

      setCourses(coursesRes);
      setRegs(regsRes);
      setSessions(updatedSessionsList);
      setLessons(lessonsRes);
      setTutors(tutorsRes);
      setFeedbacks(feedbacksRes);
      setHours(hoursRes);
      setAllUsers(allUsersRes);
      setCerts(certsRes);
      setExpertise(expertiseRes);
      setCertificates(certificatesRes);
      setGlobalAttendance(attendanceRes);
      setAuditLogs(auditRes);
      setBranches(branchesRes);
      setTutorShifts(tutorShiftsRes);
      setPromotions(promotionsRes);
      if (sData) setSchoolInfo(sData as any);

      // Save to query cache
      adminDataCache = {
        timestamp: Date.now(),
        data: {
          courses: coursesRes,
          regs: regsRes,
          sessions: updatedSessionsList,
          lessons: lessonsRes,
          tutors: tutorsRes,
          feedbacks: feedbacksRes,
          hours: hoursRes,
          allUsers: allUsersRes,
          certs: certsRes,
          expertise: expertiseRes,
          certificates: certificatesRes,
          globalAttendance: attendanceRes,
          auditLogs: auditRes,
          branches: branchesRes,
          tutorShifts: tutorShiftsRes,
          promotions: promotionsRes,
          schoolInfo: sData || schoolInfo,
        },
      };
    } catch (e: any) {
      console.error("Admin Fetch Error:", e);
      toast.error(
        "Failed to load admin data: " + (e.message || "Unknown error"),
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (["admin", "coordinator", "finance", "staff"].includes(role || ""))
      fetchData(false);
  }, [role]);

  // New Course Form State
  const [newSession, setNewSession] = useState({
    courseId: "",
    tutorId: "",
    startDate: "",
    endDate: "",
    quota: 20,
    classroom: "",
    meetingLink: "",
    deliveryMode: "onsite",
    earlyBirdPrice: 0,
    standardPrice: 0,
    registrationOpen: true,
  });

  const [lessonGen, setLessonGen] = useState({
    startDate: "",
    startTime: "19:00",
    endTime: "21:00",
    dayOfWeek: "1", // Monday
    count: 1,
  });

  const handleCreateSession = async () => {
    if (!newSession.courseId) return toast.error("Missing required fields");

    if (newSession.tutorId && newSession.startDate && newSession.endDate) {
      const hasOverlap = sessions.some(
        (s: any) =>
          s.tutorId === newSession.tutorId &&
          s.startDate &&
          s.endDate &&
          s.startDate <= newSession.endDate &&
          s.endDate >= newSession.startDate &&
          s.sessionStatus !== "cancelled",
      );

      if (hasOverlap) {
        toast.error(
          <span className="font-bold text-red-600">
            This instructor is already assigned to an overlapping course intake!
            Please choose another instructor or different dates.
          </span>,
        );
        return;
      }
    }

    try {
      const template = courses.find((c) => c.id === newSession.courseId);
      const sessionData = {
        ...newSession,
        sessionName: `${template?.title || "Course"} - ${newSession.startDate || "Intake"}`,
        enrolledCount: 0,
        sessionStatus: "open",
        earlyBirdPrice:
          newSession.earlyBirdPrice || template?.earlyBirdPrice || 0,
        standardPrice: newSession.standardPrice || template?.standardPrice || 0,
        price: newSession.standardPrice || template?.standardPrice || 0, // Fallback
        createdAt: serverTimestamp(),
      };
      const sessionRef = doc(collection(db, "course_sessions"));
      await setDoc(sessionRef, sessionData);
      await logAudit(
        user?.uid || "admin",
        user?.email || "admin",
        "CREATE_SESSION",
        "course_sessions",
        sessionRef.id,
        sessionData,
      );
      toast.success("Course created!");
      setSessionCreationModalOpen(false);
      setSelectedTemplateForIntake(null);
      setNewSession({
        courseId: "",
        tutorId: "",
        startDate: "",
        endDate: "",
        quota: 20,
        classroom: "",
        meetingLink: "",
        deliveryMode: "onsite",
        earlyBirdPrice: 0,
        standardPrice: 0,
        registrationOpen: true,
      });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleGenerateLessonsAuto = async (sessionId: string) => {
    if (!lessonGen.startDate || !lessonGen.startTime || !lessonGen.endTime)
      return toast.error("Missing schedule info");
    try {
      const batch = writeBatch(db);
      let current = new Date(lessonGen.startDate);
      const targetDay = parseInt(lessonGen.dayOfWeek);

      // Adjust to first instance of targetDay
      while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
      }

      for (let i = 1; i <= lessonGen.count; i++) {
        const lessonRef = doc(collection(db, "lessons"));
        const lessonDate = current.toISOString().split("T")[0];
        const session = sessions.find((s) => s.id === sessionId);

        batch.set(lessonRef, {
          sessionId,
          lessonTitle: `Lesson ${i}`,
          lessonNumber: i,
          lessonDate: lessonDate,
          startTime: lessonGen.startTime,
          endTime: lessonGen.endTime,
          tutorId: session?.tutorId || "",
          classroom: session?.classroom || "",
          meetingLink: session?.meetingLink || "",
          lessonStatus: "scheduled",
          createdAt: serverTimestamp(),
        });

        // Move to next week
        current.setDate(current.getDate() + 7);
      }

      await batch.commit();
      toast.success(`${lessonGen.count} lessons generated!`);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSession) return;

    if (
      (selectedSession.sessionStatus === "full" ||
        selectedSession.sessionStatus === "confirmed" ||
        selectedSession.sessionStatus === "completed") &&
      selectedSession.deliveryMode !== "online" &&
      !selectedSession.room
    ) {
      toast.error(
        <span className="font-bold text-red-600">
          Please choose a room for {selectedSession.sessionStatus} courses.
        </span>,
      );
      return;
    }

    if (
      selectedSession.deliveryMode !== "online" &&
      selectedSession.room &&
      selectedSession.startDate &&
      selectedSession.endDate
    ) {
      const roomOverlap = sessions.some(
        (s: any) =>
          s.id !== selectedSession.id &&
          s.room === selectedSession.room &&
          s.startDate &&
          s.endDate &&
          s.startDate <= selectedSession.endDate &&
          s.endDate >= selectedSession.startDate &&
          s.sessionStatus !== "cancelled",
      );

      if (roomOverlap) {
        toast.error(
          <span className="font-bold text-red-600">
            The selected room is already booked for overlapping dates! Please
            choose another room or different dates.
          </span>,
        );
        return;
      }
    }

    if (
      selectedSession.tutorId &&
      selectedSession.startDate &&
      selectedSession.endDate
    ) {
      const hasOverlap = sessions.some(
        (s: any) =>
          s.id !== selectedSession.id &&
          s.tutorId === selectedSession.tutorId &&
          s.startDate &&
          s.endDate &&
          s.startDate <= selectedSession.endDate &&
          s.endDate >= selectedSession.startDate &&
          s.sessionStatus !== "cancelled",
      );

      if (hasOverlap) {
        toast.error(
          <span className="font-bold text-red-600">
            This instructor is already assigned to an overlapping course intake!
            Please choose another instructor or different dates.
          </span>,
        );
        return;
      }
    }

    setLoading(true);
    try {
      const { id, createdAt, ...updates } = selectedSession;
      await updateDoc(doc(db, "course_sessions", id), {
        ...updates,
        sessionStatus: updates.sessionStatus || "open",
        updatedAt: serverTimestamp(),
      });
      toast.success("Course updated successfully");
      setSessionModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourse) return;
    setLoading(true);
    try {
      const { id, createdAt, ...updates } = selectedCourse;
      await updateDoc(doc(db, "courses", id), {
        ...updates,
        description: updates.description || "",
        status: updates.status || "active",
        updatedAt: serverTimestamp(),
      });
      toast.success("Course template updated successfully");
      setCourseModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [itemToDelete, setItemToDelete] = useState<{
    id: string;
    type: "course" | "session" | "registration" | "lesson";
    name: string;
  } | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      setLoading(true);
      if (itemToDelete.type === "course") {
        await deleteDoc(doc(db, "courses", itemToDelete.id));
        await logAudit(
          user?.uid || "system",
          user?.email || "system",
          "DELETE_COURSE_TEMPLATE",
          "courses",
          itemToDelete.id,
          {},
        );
        toast.success("Course template deleted successfully");
      } else if (itemToDelete.type === "session") {
        const batch = writeBatch(db);
        batch.delete(doc(db, "course_sessions", itemToDelete.id));
        lessons
          .filter((l) => l.sessionId === itemToDelete.id)
          .forEach((l) => {
            batch.delete(doc(db, "lessons", l.id));
          });
        await batch.commit();
        await logAudit(
          user?.uid || "system",
          user?.email || "system",
          "DELETE_SESSION",
          "course_sessions",
          itemToDelete.id,
          {},
        );
        toast.success("Course session deleted");
      } else if (itemToDelete.type === "registration") {
        await deleteDoc(doc(db, "registrations", itemToDelete.id));
        await logAudit(
          user?.uid || "system",
          user?.email || "system",
          "DELETE_REGISTRATION",
          "registrations",
          itemToDelete.id,
          {},
        );
        toast.success("Record deleted successfully");
      } else if (itemToDelete.type === "lesson") {
        await deleteDoc(doc(db, "lessons", itemToDelete.id));
        toast.success("Lesson deleted successfully");
      }
      setDeleteConfirmOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = (
    id: string,
    type: "course" | "session" | "registration" | "lesson",
    name: string,
  ) => {
    setItemToDelete({ id, type, name });
    setDeleteConfirmOpen(true);
  };

  const handleDuplicateSession = async (oldSession: any) => {
    try {
      const { id, createdAt, enrolledCount, ...clonedData } = oldSession;
      const sessionRef = doc(collection(db, "course_sessions"));
      const newSessionData = {
        ...clonedData,
        sessionName: `${clonedData.sessionName} (Copy)`,
        enrolledCount: 0,
        sessionStatus: "open",
        createdAt: serverTimestamp(),
      };
      await setDoc(sessionRef, newSessionData);

      // Also duplicate lesson structure if any
      const relatedLessons = lessons.filter((l) => l.sessionId === id);
      if (relatedLessons.length > 0) {
        const batch = writeBatch(db);
        relatedLessons.forEach((l) => {
          const { id: oldLid, sessionId, createdAt, ...lData } = l;
          const newLRef = doc(collection(db, "lessons"));
          batch.set(newLRef, {
            ...lData,
            sessionId: sessionRef.id,
            createdAt: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      toast.success("Course duplicated successfully!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateLesson = async (lessonId: string, updates: any) => {
    try {
      await updateDoc(doc(db, "lessons", lessonId), updates);
      fetchData();
      toast.success("Lesson updated");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleCreateCourse = async () => {
    try {
      const newRef = doc(collection(db, "courses"));
      const courseData = {
        ...newCourse,
        earlyBirdPrice: Number(newCourse.earlyBirdPrice),
        standardPrice: Number(newCourse.standardPrice),
        price: Number(newCourse.standardPrice), // Compatibility fallback
        status: "active",
        createdAt: serverTimestamp(),
      };
      await setDoc(newRef, courseData);
      await logAudit(
        user?.uid || "system",
        user?.email || "system",
        "CREATE_COURSE",
        "courses",
        newRef.id,
        { title: newCourse.title, courseCode: newCourse.courseCode },
      );
      toast.success("Course created!");
      setCourseCreationModalOpen(false);
      setNewCourse({
        courseCode: "",
        title: "",
        certName: "",
        category: "",
        level: "",
        day: "",
        description: "",
        outlineName: "",
        outlineData: "",
        earlyBirdPrice: 0,
        standardPrice: 0,
        tutorId: "",
        requiredExpertise: [],
        requiredCertifications: [],
      });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateRegStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "registrations", id), {
        status,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || "system",
      });
      const foundReg = regs.find((r) => r.id === id);
      if (status === "verified") {
        if (foundReg?.promoId) {
          try {
            await updateDoc(doc(db, "promotions", foundReg.promoId), {
              usageCount: increment(1),
            });
          } catch (promoErr) {
            console.error(
              "Failed to increment promotion usage count: ",
              promoErr,
            );
          }
        }
      }

      // Update peer bundle registration status synchronously in Firestore
      if (foundReg) {
        const peerId =
          foundReg.peerRegistrationId || foundReg.parentRegistrationId;
        if (peerId) {
          try {
            await updateDoc(doc(db, "registrations", peerId), {
              status,
              updatedAt: serverTimestamp(),
              updatedBy: user?.email || "system",
            });
          } catch (peerErr) {
            console.error(
              "Failed to update peer bundle registration status synchronously: ",
              peerErr,
            );
          }
        }
      }

      await logAudit(
        user?.uid || "system",
        user?.email || "system",
        "UPDATE_REGISTRATION_STATUS",
        "registrations",
        id,
        { status },
      );
      toast.success(`Registration ${status}!`);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteRegistration = async (id: string) => {
    // Deprecated, use confirmDelete directly
  };

  const handleUpdateRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { id, ...data } = editingReg;
      await updateDoc(doc(db, "registrations", id), {
        ...data,
        updatedAt: serverTimestamp(),
        updatedBy: user?.email || "system",
      });
      setIsEditRegOpen(false);
      toast.success("Registration updated");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateUserRole = async (userId: string, newRole: string) => {
    try {
      await updateDoc(doc(db, "users", userId), { role: newRole });
      await logAudit(
        user?.uid || "system",
        user?.email || "system",
        "UPDATE_USER_ROLE",
        "users",
        userId,
        { role: newRole },
      );
      toast.success("User role updated successfully");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateHoursStatus = async (id: string, status: string) => {
    try {
      await updateDoc(doc(db, "teaching_hours", id), { status });
      await logAudit(
        user?.uid || "system",
        user?.email || "system",
        "UPDATE_HOURS_STATUS",
        "teaching_hours",
        id,
        { status },
      );
      toast.success("Hours status updated!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleManualHoursSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualHoursForm.tutorId)
      return toast.error("Please select an instructor");

    setIsSubmittingManualHours(true);
    try {
      const selectedTutor = tutors.find(
        (t) => t.id === manualHoursForm.tutorId,
      );

      await addDoc(collection(db, "teaching_hours"), {
        tutorId: manualHoursForm.tutorId,
        tutorName: selectedTutor?.name || selectedTutor?.email || "Unknown",
        date: manualHoursForm.date,
        course: manualHoursForm.course,
        hours: 0,
        notes: manualHoursForm.course || "",
        status: "pending",
        isManual: true,
        createdAt: serverTimestamp(),
      });

      await logAudit(
        user?.uid || "system",
        user?.email || "system",
        "ADD_MANUAL_TEACHING_HOURS",
        "teaching_hours",
        "",
        { tutorId: manualHoursForm.tutorId, hours: 0 },
      );

      toast.success("Teaching record added manually");
      setManualHoursForm({
        tutorId: "",
        date: new Date().toISOString().split("T")[0],
        course: "",
      });
      setIsManualHoursModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmittingManualHours(false);
    }
  };

  const filteredUsers = allUsers
    .filter((u) => {
      if (activeTab === "staff" && u.role === "student") return false;
      if (activeTab === "students" && u.role !== "student") return false;

      const matchesSearch =
        (u.name?.toLowerCase() || "").includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || "").includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesRole && matchesStatus;
    })
    .sort((a, b) => {
      const aValue = a[sortConfig.key] || "";
      const bValue = b[sortConfig.key] || "";
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.email || !userForm.name) return;
    setLoading(true);
    let tempApp;
    try {
      let userId = `user_${Date.now()}`;

      if (userForm.password) {
        // Use a secondary app to create the user in Firebase Auth without signing out the current admin
        tempApp = initializeApp(app.options, "SecondaryApp");
        const tempAuth = getAuth(tempApp);
        const userCredential = await createUserWithEmailAndPassword(
          tempAuth,
          userForm.email,
          userForm.password,
        );
        userId = userCredential.user.uid;
      }

      const newUser: User = {
        id: userId,
        email: userForm.email!,
        name: userForm.name!,
        role: (userForm.role as UserRole) || "student",
        status: (userForm.status as UserStatus) || "active",
        phone: userForm.phone || "",
        company: userForm.company || "",
        qualifiedCategories:
          userForm.role === "tutor" || userForm.role === "tutor_pt"
            ? userForm.qualifiedCategories || []
            : [],
        remarks: userForm.remarks || "",
        createdAt: serverTimestamp(),
      };

      await setDoc(doc(db, "users", userId), newUser);
      await logAudit(
        user?.uid || "admin",
        user?.email || "admin",
        "CREATE_USER",
        "users",
        userId,
        newUser,
      );

      toast.success("User created successfully");
      setIsUserModalOpen(false);
      setUserForm({ role: "student", status: "active" });
      fetchData();
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        toast.error("User with this email already exists in the system.");
      } else {
        toast.error(e.message);
      }
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      setLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    if (
      userToDelete.email === "system.admin@vexperthk.com" ||
      userToDelete.role === "admin"
    ) {
      toast.error("Administrators cannot be deleted.");
      setIsDeleteUserModalOpen(false);
      setUserToDelete(null);
      setAdminPasswordForDelete("");
      return;
    }

    if (!adminPasswordForDelete) {
      toast.error("Please enter your admin password to confirm deletion.");
      return;
    }

    let tempApp;
    setLoading(true);

    try {
      if (!user?.email) throw new Error("Admin email not found");
      tempApp = initializeApp(app.options, "SecondaryApp_Delete_" + Date.now());
      const tempAuth = getAuth(tempApp);
      await signInWithEmailAndPassword(
        tempAuth,
        user.email,
        adminPasswordForDelete,
      );

      await deleteDoc(doc(db, "users", userToDelete.id));
      await logAudit(
        user?.uid || "admin",
        user?.email || "admin",
        "DELETE_USER",
        "users",
        userToDelete.id,
        {},
      );
      toast.success("User deleted successfully");
      setIsDeleteUserModalOpen(false);
      setUserToDelete(null);
      setAdminPasswordForDelete("");
      fetchData();
    } catch (e: any) {
      toast.error("Invalid password or deletion failed: " + e.message);
    } finally {
      if (tempApp) {
        await deleteApp(tempApp);
      }
      setLoading(false);
    }
  };

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (
      (selectedUser.email === "system.admin@vexperthk.com" ||
        selectedUser.role === "admin") &&
      userForm.status !== "active"
    ) {
      toast.error("Administrators cannot be deactivated");
      return;
    }

    if (
      (selectedUser.role === "admin" ||
        selectedUser.email === "system.admin@vexperthk.com") &&
      userForm.role !== "admin"
    ) {
      toast.error("Administrator role cannot be changed");
      return;
    }

    setLoading(true);
    try {
      const updates = {
        name: userForm.name,
        phone: userForm.phone || "",
        company: userForm.company || "",
        qualifiedCategories:
          userForm.role === "tutor" || userForm.role === "tutor_pt"
            ? userForm.qualifiedCategories || []
            : [],
        status:
          selectedUser.email === "system.admin@vexperthk.com" ||
          selectedUser.role === "admin"
            ? "active"
            : userForm.status,
        remarks: userForm.remarks || "",
        role:
          selectedUser.email === "system.admin@vexperthk.com" ||
          selectedUser.role === "admin"
            ? "admin"
            : userForm.role,
      };

      await updateDoc(doc(db, "users", selectedUser.id), updates);
      await logAudit(
        user?.uid || "admin",
        user?.email || "admin",
        "EDIT_USER",
        "users",
        selectedUser.id,
        updates,
      );

      toast.success("User updated successfully");
      setIsUserModalOpen(false);
      setSelectedUser(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      await logAudit(
        user?.uid || "admin",
        user?.email || "admin",
        "PASSWORD_RESET_REQUESTED",
        "auth",
        email,
        {},
      );
      toast.success(`Password reset email sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSort = (key: keyof User) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const handleOpenAttendanceModal = async (lesson: any) => {
    setSelectedLessonForAttendance(lesson);
    setIsAttendanceModalOpen(true);

    try {
      const attendanceSnap = await getDocs(
        query(collection(db, "attendance"), where("lessonId", "==", lesson.id)),
      );
      const existingAttendance: Record<string, string> = {};
      attendanceSnap.docs.forEach((d) => {
        existingAttendance[d.data().studentId] = d.data().status;
      });
      const enrolled = regs.filter(
        (r) => r.sessionId === lesson.sessionId && r.status === "verified",
      );

      const mergedData: Record<string, string> = {};
      enrolled.forEach((s: any) => {
        mergedData[s.studentId] = existingAttendance[s.studentId] || "present";
      });
      setAttendanceData(mergedData);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveAttendanceAdmin = async () => {
    if (!selectedLessonForAttendance) return;
    setSubmittingAttendance(true);
    try {
      const batch = writeBatch(db);
      for (const studentId of Object.keys(attendanceData)) {
        const attendanceId = `${selectedLessonForAttendance.id}_${studentId}`;
        const attRef = doc(db, "attendance", attendanceId);
        batch.set(attRef, {
          lessonId: selectedLessonForAttendance.id,
          sessionId: selectedLessonForAttendance.sessionId,
          studentId: studentId,
          status: attendanceData[studentId],
          recordedAt: serverTimestamp(),
          recordedBy: user?.uid || "admin",
        });
      }
      await batch.commit();

      setGlobalAttendance((prev) => {
        const newAtt = [...prev];
        for (const studentId of Object.keys(attendanceData)) {
          const id = `${selectedLessonForAttendance.id}_${studentId}`;
          const existsIdx = newAtt.findIndex((a) => a.id === id);
          if (existsIdx >= 0) {
            newAtt[existsIdx].status = attendanceData[studentId];
          } else {
            newAtt.push({
              id,
              lessonId: selectedLessonForAttendance.id,
              sessionId: selectedLessonForAttendance.sessionId,
              studentId: studentId,
              status: attendanceData[studentId],
            });
          }
        }
        return newAtt;
      });

      await logAudit(
        user?.uid || "admin",
        user?.email || "",
        "ADMIN_MARK_ATTENDANCE",
        "attendance",
        selectedLessonForAttendance.id,
        { students: Object.keys(attendanceData).length },
      );

      toast.success("Attendance saved successfully");
      setIsAttendanceModalOpen(false);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleExportAttendanceSheet = (
    session: any,
    course: any,
    enrolledStudents: any[],
  ) => {
    const doc = new jsPDF({ orientation: "landscape", format: "a4" });
    const date = formatHkDate(new Date());
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    // Header
    if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith("data:image")) {
      try {
        doc.addImage(schoolInfo.logo_url, "PNG", margin, 10, 15, 15);
      } catch (e) {
        // Fallback
      }
    }
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("CLASS ATTENDANCE SHEET", pageWidth / 2, 20, { align: "center" });

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated on: ${date}`, pageWidth - margin, 20, {
      align: "right",
    });

    const sessionLessons = lessons.filter(
      (l) => l.sessionId === session.id || l.session_id === session.id,
    );
    let courseDates: string[] = [];
    if (sessionLessons && sessionLessons.length > 0) {
      const dates = sessionLessons
        .map((l) => l.lessonDate || l.lesson_date)
        .filter(Boolean);
      courseDates = Array.from(new Set(dates)).sort();
    }
    if (courseDates.length === 0) {
      const start = session.startDate;
      const end = session.endDate;
      if (start && end && start !== end) {
        let current = new Date(start);
        const endD = new Date(end);
        while (current <= endD) {
          courseDates.push(current.toISOString().split("T")[0]);
          current.setDate(current.getDate() + 1);
        }
      } else if (start) {
        courseDates.push(start);
      } else {
        courseDates.push("N/A");
      }
    }

    if (courseDates.length === 0) courseDates = ["N/A"];

    const instructor =
      tutors.find((t) => t.id === session.tutorId) ||
      tutors.find((t) => t.id === course?.tutorId);

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");

    const courseText = `Course: ${course?.title || "Unknown"}`;
    const splitCourseText = doc.splitTextToSize(
      courseText,
      contentWidth / 2 - 10,
    );
    const textLines = splitCourseText.length;

    // Base height is 25. For every line beyond 1, add 6 to the height.
    const boxHeight = 25 + Math.max(0, (textLines - 1) * 6);

    // Course Info Box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.rect(margin, 30, contentWidth, boxHeight, "F");
    doc.rect(margin, 30, contentWidth, boxHeight);

    doc.setTextColor(30, 41, 59);
    doc.text(splitCourseText, margin + 5, 40);

    const datesStr =
      courseDates.length > 3
        ? `${courseDates[0]} to ${courseDates[courseDates.length - 1]}`
        : courseDates.join(", ");

    const sessionDateY = 40 + textLines * 6; // below course text
    doc.text(`Course Date: ${datesStr}`, margin + 5, sessionDateY);

    doc.text(
      `Instructor: ${instructor?.name || "N/A"}`,
      margin + contentWidth / 2 + 10,
      40,
    );
    const roomStr = (session.room || session.classroom || "N/A").replace(
      /\s*\(Persons:.*?\)/gi,
      "",
    );
    doc.text(`Room: ${roomStr}`, margin + contentWidth / 2 + 10, 47);

    // Table Header
    const tableTop = 30 + boxHeight + 10;

    // Columns Layout
    const nameColWidth = 50;
    const dateSectionWidth = contentWidth - nameColWidth;
    const singleDateWidth = dateSectionWidth / courseDates.length;

    // Redraw Header Helper
    const drawHeader = (startY: number) => {
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(226, 232, 240);
      // Header height mapping
      doc.rect(margin, startY, contentWidth, 14, "F");
      doc.rect(margin, startY, contentWidth, 14);

      // Name Col line
      doc.line(
        margin + nameColWidth,
        startY,
        margin + nameColWidth,
        startY + 14,
      );

      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(30, 41, 59);
      doc.text("Student Name", margin + 5, startY + 9);

      // Date Columns
      courseDates.forEach((d, idx) => {
        const dateStartX = margin + nameColWidth + idx * singleDateWidth;
        if (idx > 0) {
          // Divider between dates
          doc.line(dateStartX, startY, dateStartX, startY + 14);
        }
        // Date title centered
        doc.text(d, dateStartX + singleDateWidth / 2, startY + 6, {
          align: "center",
        });

        // Middle divider for AM/PM
        const amPmY = startY + 8;
        doc.line(dateStartX, amPmY, dateStartX + singleDateWidth, amPmY);
        doc.line(
          dateStartX + singleDateWidth / 2,
          amPmY,
          dateStartX + singleDateWidth / 2,
          startY + 14,
        );

        doc.setFontSize(8);
        doc.text("AM", dateStartX + singleDateWidth / 4, startY + 12, {
          align: "center",
        });
        doc.text("PM", dateStartX + (singleDateWidth * 3) / 4, startY + 12, {
          align: "center",
        });
        doc.setFontSize(10);
      });
    };

    drawHeader(tableTop);

    // Table Rows
    let currentY = tableTop + 14;
    enrolledStudents.forEach((student) => {
      const rowHeight = 16;
      if (currentY + rowHeight > pageHeight - margin) {
        doc.addPage();
        currentY = margin;
        drawHeader(currentY);
        currentY += 14;
      }
      doc.setDrawColor(226, 232, 240);
      doc.rect(margin, currentY, contentWidth, rowHeight);

      // Name Col divider
      doc.line(
        margin + nameColWidth,
        currentY,
        margin + nameColWidth,
        currentY + rowHeight,
      );

      // Row dividers
      courseDates.forEach((d, idx) => {
        const dateStartX = margin + nameColWidth + idx * singleDateWidth;
        if (idx > 0) {
          doc.line(dateStartX, currentY, dateStartX, currentY + rowHeight);
        }
        // AM / PM divider inside the date
        doc.line(
          dateStartX + singleDateWidth / 2,
          currentY,
          dateStartX + singleDateWidth / 2,
          currentY + rowHeight,
        );
      });

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const name = student.studentName;
      // limit max chars
      const splitName = doc.splitTextToSize(name, nameColWidth - 5);
      doc.text(
        splitName[0] + (splitName.length > 1 ? "..." : ""),
        margin + 5,
        currentY + 10,
      );

      currentY += rowHeight;
    });

    doc.save(
      `Attendance_${course?.courseCode || "Course"}_${session.startDate || "N/A"}.pdf`,
    );
  };

  const handleRescheduleSession = async (
    sessionId: string,
    newDate: string,
    newStart: string,
  ) => {
    try {
      await updateDoc(doc(db, "course_sessions", sessionId), {
        startDate: newDate,
        startTime: newStart,
      });
      toast.success("Course rescheduled");
      fetchData();
      setSessionModalOpen(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const generatePTReport = (
    tutorId: string,
    tutorName: string,
    month: string,
  ) => {
    const doc = new jsPDF();
    const monthlyRecords = hours
      .filter(
        (h) => h.tutorId === tutorId && h.date && h.date.startsWith(month),
      )
      .sort((a, b) => (a.date || "").localeCompare(b.date || ""));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Part-time Instructor Monthly Report", 105, 20, {
      align: "center",
    });
    doc.setFontSize(12);
    doc.text("Instructor: " + tutorName, 20, 35);
    doc.text("Report Month: " + month, 20, 42);
    doc.setLineWidth(0.5);
    doc.line(20, 48, 190, 48);
    doc.setFontSize(10);
    doc.text("Date", 20, 55);
    doc.text("Course Name", 60, 55);
    doc.text("Status", 150, 55);
    doc.setLineWidth(0.2);
    doc.line(20, 58, 190, 58);
    doc.setFont("helvetica", "normal");
    let y = 65;
    monthlyRecords.forEach((h) => {
      if (y > 250) {
        doc.addPage();
        y = 20;
      }
      doc.text(h.date || "N/A", 20, y);
      const courseText = h.course || h.details || h.notes || "Course";
      const splitNotes = doc.splitTextToSize(
        courseText.replace(/\n/g, " "),
        80,
      );
      doc.text(splitNotes, 60, y);
      doc.text(h.status === "completed" ? "Completed" : "Open", 150, y);
      y += splitNotes.length * 5 + 3;
    });
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    y += 20;
    doc.setLineWidth(0.2);
    doc.line(20, y, 70, y);
    doc.text("Instructor Signature", 20, y + 5);
    doc.text("Date:", 20, y + 12);
    doc.save(
      "PT_Instructor_Report_" +
        tutorName.replace(/\s+/g, "_") +
        "_" +
        month +
        ".pdf",
    );
  };

  const generateMTMReport = (
    tutorId: string,
    tutorName: string,
    year: string,
  ) => {
    const doc = new jsPDF();

    // Find all lessons for this tutor in the given year where course category is Microsoft
    const tutorLessons = lessons
      .filter((l) => {
        const session = sessions.find(
          (s) => s.id === l.sessionId || s.id === l.session_id,
        );
        const course = courses.find((c) => c.id === session?.courseId);
        const isMicrosoft =
          course?.category === "Microsoft" ||
          course?.category?.toLowerCase() === "microsoft";
        const tid =
          l.tutorId || l.tutor_id || session?.tutorId || session?.tutor_id;
        const inYear = (l.lessonDate || l.lesson_date || "").startsWith(year);
        return tid === tutorId && inYear && isMicrosoft;
      })
      .sort((a, b) =>
        (a.lessonDate || a.lesson_date || "").localeCompare(
          b.lessonDate || b.lesson_date || "",
        ),
      );

    const calculateHours = (start: string, end: string) => {
      if (!start || !end) return 0;
      const [sh, sm] = start.split(":").map(Number);
      const [eh, em] = end.split(":").map(Number);
      const diff = (eh * 60 + em - (sh * 60 + sm)) / 60;
      return diff > 0 ? diff : 0;
    };

    let yearlyRecords = tutorLessons.map((l) => {
      const session = sessions.find(
        (s) => s.id === l.sessionId || s.id === l.session_id,
      );
      const course = courses.find((c) => c.id === session?.courseId);
      const startTime = l.startTime || session?.startTime;
      const endTime = l.endTime || session?.endTime;
      const hrs = calculateHours(startTime, endTime);
      return {
        date: l.lessonDate || l.lesson_date,
        notes:
          (course?.title || session?.sessionName || "Course") +
          " (" +
          (startTime || "TBC") +
          " - " +
          (endTime || "TBC") +
          ")",
        hours: hrs,
      };
    });

    const manualMsHours = hours
      .filter((h) => {
        if (h.tutorId !== tutorId || !h.isManual) return false;
        if (!h.date || !h.date.startsWith(year)) return false;

        let isMicrosoft = false;
        if (h.course) {
          const courseObj = courses.find(
            (c) => c.title === h.course || c.certName === h.course,
          );
          if (
            courseObj &&
            (courseObj.category === "Microsoft" ||
              courseObj.category?.toLowerCase() === "microsoft")
          )
            isMicrosoft = true;
          if (
            h.course.toLowerCase().includes("microsoft") ||
            h.course.toLowerCase().match(/ms-|az-|dp-|ai-|sc-|pl-|mb-/)
          )
            isMicrosoft = true;
        }

        return isMicrosoft;
      })
      .map((h) => ({
        date: h.date,
        notes: h.notes || h.course,
        hours: h.hours,
      }));

    yearlyRecords = [...yearlyRecords, ...manualMsHours].sort((a, b) =>
      (a.date || "").localeCompare(b.date || ""),
    );

    const totalHours = yearlyRecords.reduce(
      (acc, curr) => acc + (curr.hours || 0),
      0,
    );

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Instructor Teaching Hours (MTM Report)`, 105, 20, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.text(`Instructor: ${tutorName}`, 20, 35);
    doc.text(`Report Year: ${year}`, 20, 42);
    doc.text(`Total Teaching Hours: ${totalHours} hrs`, 20, 49);

    doc.setLineWidth(0.5);
    doc.line(20, 53, 190, 53);

    doc.setFontSize(10);
    doc.text("Date", 20, 60);
    doc.text("Description / Notes", 60, 60);
    doc.text("Hours", 170, 60);

    doc.setLineWidth(0.2);
    doc.line(20, 63, 190, 63);

    doc.setFont("helvetica", "normal");
    let y = 70;

    yearlyRecords.forEach((h) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(h.date || "N/A", 20, y);
      const splitNotes = doc.splitTextToSize(
        h.notes?.replace(/\n/g, " ") || "No description provided",
        100,
      );
      doc.text(splitNotes, 60, y);
      doc.text(String(h.hours || 0), 170, y);

      y += splitNotes.length * 5 + 3;
    });

    doc.save(`MTM_Report_${tutorName.replace(/\s+/g, "_")}_${year}.pdf`);
  };

  const generateBulkCertificatesPDF = (
    certsList: any[],
    courseTitle: string,
  ) => {
    const doc = new jsPDF({ orientation: "landscape" });

    certsList.forEach((cert, index) => {
      if (index > 0) doc.addPage();

      // Simple design
      doc.setFillColor(240, 248, 255);
      doc.rect(0, 0, 297, 210, "F");

      // Border
      doc.setDrawColor(37, 99, 235);
      doc.setLineWidth(2);
      doc.rect(10, 10, 277, 190, "S");

      if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith("data:image")) {
        try {
          doc.addImage(schoolInfo.logo_url, "PNG", 133, 15, 30, 30);
        } catch (e) {
          // Fallback
        }
      }

      doc.setTextColor(30, 58, 138);
      doc.setFontSize(40);
      doc.text("Certificate of Completion", 148, 65, { align: "center" });

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(16);
      doc.text("This is to certify that", 148, 90, { align: "center" });

      doc.setTextColor(15, 23, 42);
      doc.setFontSize(30);
      doc.text(cert.studentName || "Student Name", 148, 110, {
        align: "center",
      });

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(16);
      doc.text("has successfully completed the course", 148, 130, {
        align: "center",
      });

      doc.setTextColor(37, 99, 235);
      doc.setFontSize(24);
      doc.text(
        cert.courseTitle || cert.course_title || courseTitle || "Course Title",
        148,
        150,
        { align: "center" },
      );

      doc.setTextColor(100, 116, 139);
      doc.setFontSize(12);
      doc.text(
        `Issue Date: ${formatHkDate(cert.issuedAt || cert.issued_at || new Date())}`,
        148,
        180,
        { align: "center" },
      );
      doc.text(`Certificate ID: ${cert.id}`, 148, 190, { align: "center" });
    });

    doc.save(`${courseTitle.replace(/\s+/g, "_")}_Certificates.pdf`);
  };

  const handleManageCertificates = async (session: any) => {
    setSelectedSessionCert(session);
    setIsCertModalOpen(true);
    setIsCertLoading(true);
    setPastDaysToShow(0);
    try {
      const enrolledStudents = regs.filter(
        (r) => r.sessionId === session.id && r.status === "verified",
      );
      const sessionLessons = lessons.filter(
        (l) => l.sessionId === session.id,
      );

      if (sessionLessons.length === 0) {
        setSessionStudentsData(
          enrolledStudents.map((s) => ({
            ...s,
            attendanceRate: 0,
            lessonsAttended: 0,
            totalLessons: 0,
            alreadyIssued: false,
          })),
        );
        return;
      }

      const attendancePromises = enrolledStudents.map(async (student) => {
        const attSnap = await getDocs(
          query(
            collection(db, "attendance"),
            where("sessionId", "==", session.id),
            where("studentId", "==", student.studentId),
          ),
        );
        const attendedCount = attSnap.docs.filter(
          (d) =>
            d.data().status === "present" ||
            d.data().status === "present_am" ||
            d.data().status === "present_pm" ||
            d.data().status === "AM" ||
            d.data().status === "PM",
        ).length;
        const totalPossible = sessionLessons.length;
        const rate =
          totalPossible > 0 ? (attendedCount / totalPossible) * 100 : 0;

        const certSnap = await getDocs(
          query(
            collection(db, "certificates"),
            where("registrationId", "==", student.id),
          ),
        );

        const rawAttendance: Record<string, string> = {};
        attSnap.docs.forEach((d) => {
          const data = d.data();
          if (data.lessonId) {
            rawAttendance[data.lessonId] = data.status;
          }
        });

        return {
          ...student,
          attendanceRate: rate,
          lessonsAttended: attendedCount,
          totalLessons: totalPossible,
          alreadyIssued: !certSnap.empty,
          rawAttendance,
        };
      });

      const results = await Promise.all(attendancePromises);
      setSessionStudentsData(results);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsCertLoading(false);
    }
  };

  const handleToggleAttendanceConfirm = async (
    regId: string,
    date: string,
    type: "am" | "pm" | "eve",
    currentValue: boolean,
  ) => {
    try {
      const fieldPath = `attendanceRecords.${date}.${type}`;
      await updateDoc(doc(db, "registrations", regId), {
        [fieldPath]: !currentValue,
      });
      toast.success(
        `${type.toUpperCase()} Attendance for ${date} ${!currentValue ? "Confirmed" : "Removed"}`,
      );

      setRegs((prev) =>
        prev.map((r) => {
          if (r.id === regId) {
            const newRecords = { ...(r.attendanceRecords || {}) };
            if (!newRecords[date]) newRecords[date] = {};
            newRecords[date][type] = !currentValue;
            return { ...r, attendanceRecords: newRecords };
          }
          return r;
        }),
      );

      setSessionStudentsData((prev) =>
        prev.map((s) => {
          if (s.id === regId) {
            const newRecords = { ...(s.attendanceRecords || {}) };
            if (!newRecords[date]) newRecords[date] = {};
            newRecords[date][type] = !currentValue;
            return { ...s, attendanceRecords: newRecords };
          }
          return s;
        }),
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleUpdateSingleAttendance = async (
    studentId: string,
    lessonId: string,
    sessionId: string,
    status: string
  ) => {
    try {
      const compositeId = `${lessonId}_${studentId}`;
      const attRef = doc(db, "attendance", compositeId);
      
      if (status === "") {
        await deleteDoc(attRef);
      } else {
        await setDoc(attRef, {
          lessonId,
          sessionId,
          studentId,
          status,
          recordedAt: serverTimestamp(),
          recordedBy: user?.uid
        }, { merge: true });
      }

      toast.success("Attendance updated successfully");

      setSessionStudentsData((prev) =>
        prev.map((s) => {
          if (s.studentId === studentId) {
            const newRaw = { ...(s.rawAttendance || {}) };
            if (status === "") {
               delete newRaw[lessonId];
            } else {
               newRaw[lessonId] = status;
            }
            return { ...s, rawAttendance: newRaw };
          }
          return s;
        })
      );
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleIssueCertificateDirectly = async (studentData: any) => {
    try {
      const course = courses.find((c) => c.id === studentData.courseId);
      const certId =
        studentData.invoiceNumber ||
        studentData.invoice_number ||
        doc(collection(db, "certificates")).id;
      const certRef = doc(db, "certificates", certId);
      const certData = {
        studentId: studentData.studentId || "N/A",
        studentName: studentData.studentName,
        studentEmail: studentData.studentEmail,
        courseId: studentData.courseId,
        courseTitle: course?.title || "Unknown Course",
        registrationId: studentData.id,
        issuedAt: serverTimestamp(),
      };

      await setDoc(certRef, certData);
      await logAudit(
        user?.uid || "admin",
        user?.email || "admin",
        "ISSUE_CERTIFICATE",
        "certificates",
        certId,
        { studentName: studentData.studentName },
      );

      toast.success(`Certificate issued to ${studentData.studentName}`);
      setSessionStudentsData((prev) =>
        prev.map((s) =>
          s.id === studentData.id ? { ...s, alreadyIssued: true } : s,
        ),
      );

      const certSnap = await getDocs(collection(db, "certificates"));
      setCertificates(certSnap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleGenerateInvoice = (reg: any) => {
    const doc = new jsPDF();

    // Header
    if (schoolInfo.logo_url && schoolInfo.logo_url.startsWith("data:image")) {
      try {
        doc.addImage(schoolInfo.logo_url, "PNG", 20, 10, 25, 25);
        doc.setFontSize(22);
        doc.text(schoolInfo.name || "School Name", 50, 22);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(schoolInfo.address || "Address", 50, 30);
        doc.text(schoolInfo.phone || "Phone", 50, 35);
      } catch (e) {
        // Fallback if image format fails
        doc.setFontSize(22);
        doc.text(schoolInfo.name || "School Name", 20, 20);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(schoolInfo.address || "Address", 20, 28);
        doc.text(schoolInfo.phone || "Phone", 20, 33);
      }
    } else {
      doc.setFontSize(22);
      doc.text(schoolInfo.name || "School Name", 20, 20);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(schoolInfo.address || "Address", 20, 28);
      doc.text(schoolInfo.phone || "Phone", 20, 33);
    }

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(20, 40, 190, 40);

    // Receipt Info
    doc.setFontSize(16);
    doc.setTextColor(0);
    doc.text("OFFICIAL RECEIPT", 105, 55, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Receipt No: ${reg.invoice_number || "N/A"}`, 20, 70);
    doc.text(`Date: ${formatHkDate(reg.createdAt)}`, 140, 70);

    // Student Info
    doc.setFontSize(11);
    doc.text("Billed To:", 20, 85);
    doc.setFontSize(12);
    doc.text(reg.studentName, 20, 92);
    doc.setFontSize(10);
    doc.text(reg.studentEmail, 20, 97);

    // Itemized Table
    doc.setDrawColor(200);
    doc.rect(20, 110, 170, 60);
    doc.line(20, 120, 190, 120);

    doc.setFontSize(10);
    doc.text("Description", 25, 117);
    doc.text("Amount", 160, 117);

    const relatedCourse = courses.find((c) => c.id === reg.courseId);
    doc.text(relatedCourse?.title || "Course Payment", 25, 130);
    doc.text(`$${reg.amount || 0}`, 160, 130);

    // Total
    doc.line(140, 170, 190, 170);
    doc.setFontSize(12);
    doc.text("Total Paid:", 140, 180);
    doc.text(`$${reg.amount || 0}`, 170, 180);

    // Payment Method
    doc.setFontSize(10);
    doc.text(`Payment Method: ${reg.paymentMethod || "N/A"}`, 20, 180);
    doc.text(`Status: ${reg.status?.toUpperCase() || "N/A"}`, 20, 185);

    // Terms & Conditions
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text("Terms & Conditions:", 20, 210);
    const terms = schoolInfo.terms_conditions || "";
    const splitTerms = doc.splitTextToSize(terms, 170);
    doc.text(splitTerms, 20, 215);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text("Thank you for your business!", 105, 270, { align: "center" });

    doc.save(`${reg.invoiceNumber || "receipt"}_${reg.studentName}.pdf`);
  };

  const handleCreateBranch = async () => {
    if (!newBranch.name) return toast.error("Branch name is required");
    try {
      await addDoc(collection(db, "branches"), {
        ...newBranch,
        createdAt: serverTimestamp(),
      });
      toast.success("Branch created");
      setNewBranch({ name: "", address: "", contact_phone: "" });
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleBatchUpdateShifts = async (
    branchId: string,
    tutorIds: string[],
    startDate: string,
    endDate: string,
    startTime: string,
    endTime: string,
  ) => {
    if (!branchId || tutorIds.length === 0 || !startDate || !endDate)
      return toast.error("Missing required fields");
    try {
      const batch = writeBatch(db);
      const start = new Date(startDate);
      const end = new Date(endDate);

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        tutorIds.forEach((tutorId) => {
          const shiftRef = doc(collection(db, "tutor_shifts"));
          batch.set(shiftRef, {
            tutorId,
            branchId,
            date: dateStr,
            startTime,
            endTime,
            type: "regular",
            status: "scheduled",
            updatedAt: serverTimestamp(),
          });
        });
      }
      await batch.commit();
      toast.success("Batch shifts scheduled");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleSaveSchoolInfo = async () => {
    try {
      await setDoc(doc(db, "settings", "school_info"), {
        ...schoolInfo,
        updatedAt: serverTimestamp(),
      });
      toast.success("School settings saved successfully!");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleIssueCertificate = async (reg: any) => {
    try {
      // First update the registration to 'completed' / verified
      await updateDoc(doc(db, "registrations", reg.id), {
        status: "verified",
        updatedAt: serverTimestamp(),
      });
      if (reg?.promoId) {
        try {
          await updateDoc(doc(db, "promotions", reg.promoId), {
            usageCount: increment(1),
          });
        } catch (promoErr) {
          console.error(
            "Failed to increment promotion usage count: ",
            promoErr,
          );
        }
      }

      const relatedCourse = courses.find((c) => c.id === reg.courseId);

      // Create the certificate record
      const certId =
        reg.invoiceNumber ||
        reg.invoice_number ||
        doc(collection(db, "certificates")).id;
      const certRef = doc(db, "certificates", certId);
      await setDoc(certRef, {
        studentId: reg.studentId || "",
        studentEmail: reg.studentEmail,
        studentName: reg.studentName,
        courseId: reg.courseId,
        courseTitle: relatedCourse ? relatedCourse.title : reg.courseId,
        registrationId: reg.id,
        issuedAt: serverTimestamp(),
      });

      toast.success("Certificate issued successfully!");
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data.length) return toast.info("No data to export");
    const headers = Object.keys(data[0]).filter(
      (k) => k !== "createdAt" && k !== "updatedAt",
    );
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers
          .map((h) => `"${(row[h] || "").toString().replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    const hkDate = formatHkDate(new Date()).replace(/\//g, "-");
    link.download = `${filename}_${hkDate}.csv`;
    link.click();
  };

  const handleSeedData = async () => {
    setSeeding(true);
    try {
      const batch = writeBatch(db);

      const t1Ref = doc(collection(db, "users"));
      batch.set(t1Ref, {
        name: "Alice Smith",
        email: "alice.tutor@example.com",
        role: "tutor",
        createdAt: serverTimestamp(),
      });

      const c1Ref = doc(collection(db, "courses"));
      batch.set(c1Ref, {
        courseCode: "AZ-900T00",
        title: "Introduction to Microsoft Azure",
        certName: "Fundamental",
        category: "Microsoft",
        level: "Beginner",
        day: "1",
        description:
          "MODULE 1: Describe cloud concepts\nMODULE 2: Describe Azure architecture and services\nMODULE 3: Describe Azure management and governance",
        earlyBirdPrice: 2000,
        standardPrice: 4000,
        price: 4000,
        certificateAvailable: true,
        tutorId: t1Ref.id,
        status: "active",
        createdAt: serverTimestamp(),
      });

      const cs1Ref = doc(collection(db, "course_sessions"));
      batch.set(cs1Ref, {
        courseId: c1Ref.id,
        tutorId: t1Ref.id,
        sessionName: "June Intake",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        startTime: "18:00",
        endTime: "20:00",
        location: "Online via Zoom",
        deliveryMode: "online",
        quota: 30,
        sessionStatus: "open",
        createdAt: serverTimestamp(),
      });

      const kb1Ref = doc(collection(db, "knowledge_base"));
      batch.set(kb1Ref, {
        topic: "Refund Policy",
        category: "General",
        content:
          "Our refund policy allows full refunds up to 7 days before the course starts.",
        status: "published",
      });

      await batch.commit();
      toast.success("Sample data seeded successfully!");
      fetchData();
    } catch (e: any) {
      toast.error("Seeding failed: " + e.message);
    } finally {
      setSeeding(false);
    }
  };

  const handleSavePromo = async () => {
    if (!user?.email) return;

    if (!promoForm.adminPassword) {
      toast.error("Please enter your admin password to confirm");
      return;
    }

    try {
      // Re-authenticate admin to confirm promotion creation/edit
      await signInWithEmailAndPassword(
        auth,
        user.email,
        promoForm.adminPassword,
      );
    } catch (e: any) {
      toast.error("Invalid password. Promotion not saved.");
      return;
    }

    try {
      let conditions: any = {};
      if (promoForm.type === "bundle") {
        if (!promoForm.bundleCourse1 || !promoForm.bundleCourse2) {
          toast.error("Please select two courses for the bundle.");
          return;
        }
        conditions.requiredCourseIds = [
          promoForm.bundleCourse1,
          promoForm.bundleCourse2,
        ];
      }

      const payload = {
        name: promoForm.name,
        code: promoForm.type === "code" ? promoForm.code.toUpperCase() : null,
        type: promoForm.type,
        category: promoForm.category || "seminar",
        discountType: "fixed",
        discountValue: Number(promoForm.discountValue),
        status: promoForm.status,
        applicableCourseIds: promoForm.applicableCourseIds,
        startDate: promoForm.startDate
          ? `${promoForm.startDate}T00:00:00`
          : null,
        endDate: promoForm.endDate ? `${promoForm.endDate}T23:59:59` : null,
        conditions,
        updatedAt: serverTimestamp(),
      };

      if (selectedPromo) {
        await updateDoc(doc(db, "promotions", selectedPromo.id), {
          ...payload,
          updatedByAdminId: user.uid,
          updatedByAdminEmail: user.email,
        });
        toast.success("Promotion updated");
      } else {
        await addDoc(collection(db, "promotions"), {
          ...payload,
          createdAt: serverTimestamp(),
          usageCount: 0,
          createdByAdminId: user.uid,
          createdByAdminEmail: user.email,
        });
        toast.success("Promotion created");
      }
      setIsPromoModalOpen(false);
      fetchData();
    } catch (e: any) {
      toast.error("Failed to save promotion: " + e.message);
    }
  };

  const feedbacksByCourse = useMemo(() => {
    const groups: Record<string, any> = {};
    feedbacks.forEach((f) => {
      if (!groups[f.courseId]) {
        const course = courses.find((c) => c.id === f.courseId);
        groups[f.courseId] = {
          courseId: f.courseId,
          courseName: course?.title || f.courseName || "Unknown Course",
          feedbacks: [],
          avgRating: 0,
        };
      }
      groups[f.courseId].feedbacks.push(f);
    });

    Object.values(groups).forEach((g: any) => {
      const totalRating = g.feedbacks.reduce(
        (acc: number, curr: any) =>
          acc + (parseFloat(curr.rating || curr.overallCourseScore) || 0),
        0,
      );
      g.avgRating =
        g.feedbacks.length > 0
          ? (totalRating / g.feedbacks.length).toFixed(1)
          : 0;
    });

    return Object.values(groups);
  }, [feedbacks, courses]);

  const [logSearchTerm, setLogSearchTerm] = useState("");
  const [logMonth, setLogMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [isDeleteLogsModalOpen, setIsDeleteLogsModalOpen] = useState(false);
  const [logDeleteDate, setLogDeleteDate] = useState("");
  const [adminPasswordForLogDelete, setAdminPasswordForLogDelete] =
    useState("");

  const handleDeleteLogsByDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordForLogDelete !== "admin123") {
      // Very basic password check, you can change logic
      toast.error("Incorrect admin password");
      return;
    }
    if (!logDeleteDate) {
      toast.error("Please select a date");
      return;
    }
    try {
      setLoading(true);
      const tzOffset = new Date().getTimezoneOffset() * 60000;
      const startOfDay = new Date(new Date(logDeleteDate).getTime() - tzOffset);
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date(startOfDay.getTime() + 86400000);

      const logsRef = collection(db, "audit_logs");
      const q = query(
        logsRef,
        where("createdAt", ">=", startOfDay),
        where("createdAt", "<", endOfDay),
      );
      const snap = await getDocs(q);
      const batch = writeBatch(db);
      snap.docs.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit();

      toast.success(`Deleted ${snap.size} logs for ${logDeleteDate}`);

      // refresh table
      const auditSnap = await getDocs(
        query(
          collection(db, "audit_logs"),
          orderBy("createdAt", "desc"),
          limit(1000),
        ),
      );
      setAuditLogs(auditSnap.docs.map((d) => ({ id: d.id, ...d.data() })));

      setIsDeleteLogsModalOpen(false);
      setLogDeleteDate("");
      setAdminPasswordForLogDelete("");
    } catch (error) {
      console.error("Failed to delete logs", error);
      toast.error("Failed to delete logs");
    } finally {
      setLoading(false);
    }
  };

  const allTabs = [
    { id: "overview", label: t("nav.overview"), icon: LayoutDashboard },
    { id: "courses", label: "Templates", icon: BookOpen },
    { id: "sessions", label: "Courses", icon: CalendarIcon },
    { id: "certificates", label: t("nav.certificates"), icon: Database },
    { id: "scheduling", label: t("nav.scheduling"), icon: CalendarRange },
    { id: "tutors", label: t("nav.tutors"), icon: Clock },
    { id: "feedback", label: t("nav.feedback"), icon: MessageSquare },
    { id: "logs", label: t("nav.logs"), icon: ShieldAlert },
    { id: "staff", label: "Staff Directory", icon: Briefcase },
    { id: "students", label: "Student Directory", icon: Users },
    { id: "promotions", label: "Promotions", icon: Sparkles },
    { id: "permissions", label: "Access Control", icon: ShieldCheck },
    { id: "settings", label: t("nav.settings"), icon: Upload },
    { id: "finance", label: t("nav.finance"), icon: BarChart2 },
  ];

  const getPermission = (moduleKey: string) => {
    const activeRole = isSimulatingGlobally ? simulatedRole : role;
    if (!activeRole) return "none";

    // Admin always gets full unless we are simulated
    if (
      role === "admin" &&
      user?.email === "system.admin@vexperthk.com" &&
      !isSimulatingGlobally
    )
      return "full";
    if (activeRole === "admin") return "full";

    const roleConfig = customRolePermissions.find(
      (r) => r.roleId === activeRole,
    );
    if (!roleConfig) {
      if (activeRole === "coordinator") {
        const fallbacks: Record<string, string> = {
          overview: "view",
          courses: "full",
          sessions: "full",
          finance: "none",
          certificates: "full",
          scheduling: "full",
          tutors: "view",
          feedback: "full",
          logs: "none",
          promotions: "full",
          settings: "full",
          staff: "full",
          students: "full",
          permissions: "none",
        };
        return fallbacks[moduleKey] || "none";
      }
      if (activeRole === "finance") {
        const fallbacks: Record<string, string> = {
          overview: "view",
          courses: "none",
          sessions: "none",
          finance: "full",
          certificates: "none",
          scheduling: "none",
          tutors: "none",
          feedback: "none",
          logs: "view",
          promotions: "none",
          settings: "none",
          staff: "none",
          students: "none",
          permissions: "none",
        };
        return fallbacks[moduleKey] || "none";
      }
      if (activeRole === "staff") {
        const fallbacks: Record<string, string> = {
          overview: "none",
          courses: "view",
          sessions: "view",
          finance: "none",
          certificates: "view",
          scheduling: "view",
          tutors: "view",
          feedback: "view",
          logs: "none",
          promotions: "view",
          settings: "none",
          staff: "view",
          students: "view",
          permissions: "none",
        };
        return fallbacks[moduleKey] || "none";
      }
      return "none";
    }

    if (roleConfig.permissions[moduleKey] === undefined) {
      if (moduleKey === "permissions") return "none";
      if (moduleKey === "staff" || moduleKey === "students") return "view";
    }

    return roleConfig.permissions[moduleKey] || "none";
  };

  const getAccessibleTabs = () => {
    const activeRole = isSimulatingGlobally ? simulatedRole : role;
    if (!activeRole) return [];

    if (
      role === "admin" &&
      user?.email === "system.admin@vexperthk.com" &&
      !isSimulatingGlobally
    )
      return allTabs;

    return allTabs.filter((tab) => {
      const perm = getPermission(tab.id);
      return perm === "full" || perm === "view";
    });
  };

  useEffect(() => {
    if (!loading && role && activeTab) {
      const allowed = getAccessibleTabs().map((t) => t.id);
      if (allowed.length > 0 && !allowed.includes(activeTab)) {
        setActiveTab(allowed[0]);
      }
    }
  }, [
    role,
    activeTab,
    loading,
    isSimulatingGlobally,
    simulatedRole,
    customRolePermissions,
  ]);

  const ReadOnlyAlert = ({ moduleKey }: { moduleKey: string }) => {
    if (getPermission(moduleKey) === "view") {
      return (
        <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mb-6 text-xs text-amber-800 flex items-start gap-4 shadow-sm font-sans">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 animate-pulse mt-0.5" />
          <div>
            <span className="font-extrabold block text-amber-950 text-sm mb-0.5">
              👁️ Read-Only Access Mode
            </span>
            <span className="text-amber-750 leading-relaxed font-semibold">
              Your current active role profile is set to read-only for this
              section. Operations such as creating records, editing profiles,
              and deleting data are restricted in real-time.
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  const activeRole = isSimulatingGlobally ? simulatedRole : role;
  const isAuthorizedToAdmin =
    activeRole === "admin" ||
    activeRole === "coordinator" ||
    activeRole === "finance" ||
    activeRole === "staff" ||
    activeRole?.startsWith("custom_") ||
    getAccessibleTabs().length > 0;

  if (!isAuthorizedToAdmin) {
    return (
      <div className="text-center py-20 font-bold text-slate-500 font-sans mt-12 bg-white rounded-2xl border border-slate-200 max-w-md mx-auto p-8 shadow-sm">
        Access Denied: You do not have permission to view the Admin Dashboard.
      </div>
    );
  }

  const NavigationMenu = () => (
    <div className="flex flex-col gap-2 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
      <div className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 px-2">
        Menu
      </div>
      {getAccessibleTabs().map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}
        >
          <tab.icon
            className={`w-4 h-4 ${activeTab === tab.id ? "text-blue-600" : "text-slate-400"}`}
          />
          {tab.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-6 relative px-4 md:px-8 py-8 font-sans bg-slate-50/30 min-h-screen">
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <img
            src={previewImage}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl"
          />
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
          Admin Dashboard
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside className="hidden md:block w-full">
          <NavigationMenu />
        </aside>

        {/* Mobile Nav */}
        <div className="md:hidden overflow-x-auto pb-2">
          <div className="flex gap-2 min-w-max">
            {getAccessibleTabs().map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-indigo-600 text-white shadow" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <main className="flex-1 space-y-6">
          <React.Suspense
            fallback={
              <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3 font-sans font-medium bg-white/50 border border-slate-100 rounded-2xl shadow-sm">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <span>Loading tab panel...</span>
              </div>
            }
          >
            {activeTab === "overview" && (
              <OverviewTab
                getPermission={getPermission}
                allUsers={allUsers}
                courses={courses}
                sessions={sessions}
                regs={regs}
              />
            )}

            {activeTab === "finance" && (
              <div className="space-y-6">
                <ReadOnlyAlert moduleKey="finance" />
                <FinanceTab
                  regSearchTerm={regSearchTerm}
                  setRegSearchTerm={setRegSearchTerm}
                  regs={regs}
                  handleExportCSV={handleExportCSV}
                  formatHkDate={formatHkDate}
                  setPreviewImage={setPreviewImage}
                  handleGenerateInvoice={handleGenerateInvoice}
                  handleUpdateRegStatus={handleUpdateRegStatus}
                  editingReg={editingReg}
                  setEditingReg={setEditingReg}
                  isEditRegOpen={isEditRegOpen}
                  setIsEditRegOpen={setIsEditRegOpen}
                  handleUpdateRegistration={handleUpdateRegistration}
                  confirmDelete={confirmDelete}
                  readOnly={getPermission("finance") === "view"}
                />
              </div>
            )}

            {activeTab === "certificates" && (
              <div className="space-y-6">
                <ReadOnlyAlert moduleKey="certificates" />
                <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-50 gap-4">
                    <div>
                      <CardTitle className="text-xl font-black text-slate-800 tracking-tight">
                        Certificates History
                      </CardTitle>
                      <CardDescription className="text-xs font-medium text-slate-500">
                        Record of all issued digital certificates
                      </CardDescription>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <div className="relative w-full sm:w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                          placeholder="Search course name..."
                          className="pl-9 h-8 text-xs focus:ring-blue-500 border-slate-200"
                          value={certSearchTerm}
                          onChange={(e) => setCertSearchTerm(e.target.value)}
                        />
                      </div>
                      <div className="relative w-full sm:w-40 flex items-center bg-white border border-slate-200 rounded-md overflow-hidden">
                        <CalendarIcon className="w-4 h-4 ml-3 text-slate-400 shrink-0" />
                        <select
                          className="h-8 text-xs bg-transparent focus:ring-0 focus:outline-none flex-1 px-2 cursor-pointer min-w-0"
                          value={certDateTerm}
                          onChange={(e) => setCertDateTerm(e.target.value)}
                        >
                          <option value="">All months</option>
                          {Array.from(
                            new Set(
                              certificates
                                .map((c: any) => {
                                  const dateObj = c.issuedAt?.toDate
                                    ? c.issuedAt.toDate()
                                    : new Date(c.issuedAt || c.issued_at);
                                  return isNaN(dateObj.getTime())
                                    ? ""
                                    : `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, "0")}`;
                                })
                                .filter(Boolean),
                            ),
                          )
                            .sort()
                            .reverse()
                            .map((monthStr) => {
                              const [year, month] = (monthStr as string).split(
                                "-",
                              );
                              const label = new Date(
                                parseInt(year),
                                parseInt(month) - 1,
                              ).toLocaleString("en-US", {
                                month: "long",
                                year: "numeric",
                              });
                              return (
                                <option key={monthStr as string} value={label}>
                                  {label}
                                </option>
                              );
                            })}
                        </select>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleExportCSV(certificates, "certificates")
                        }
                        className="gap-2 h-8 text-[10px] font-bold uppercase tracking-wider border-slate-200"
                      >
                        <Download className="w-3.5 h-3.5" /> Export
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="hover:bg-transparent border-slate-100">
                            <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Course
                            </TableHead>
                            <TableHead className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Issued At
                            </TableHead>
                            <TableHead className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              Actions
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(
                            certificates
                              .filter((cert: any) => {
                                const reg = regs.find(
                                  (r) => r.id === cert.registrationId,
                                );
                                const session = sessions.find(
                                  (s) => s.id === reg?.sessionId,
                                );
                                return session?.sessionStatus === "completed";
                              })
                              .reduce(
                                (acc, cert) => {
                                  const reg = regs.find(
                                    (r) => r.id === cert.registrationId,
                                  );
                                  const session = sessions.find(
                                    (s) => s.id === reg?.sessionId,
                                  );
                                  const sessionLabel = session
                                    ? `${session.sessionName} (${session.startDate} to ${session.endDate})`
                                    : "Unknown Course";

                                  const key = `${cert.courseId || "Unknown Course"}_${session?.id || "unknown"}`;
                                  if (!acc[key])
                                    acc[key] = {
                                      courseTitle:
                                        cert.courseTitle || cert.course_title,
                                      sessionLabel: sessionLabel,
                                      certs: [],
                                    };
                                  acc[key].certs.push(cert);
                                  return acc;
                                },
                                {} as Record<
                                  string,
                                  {
                                    courseTitle: string;
                                    sessionLabel: string;
                                    certs: any[];
                                  }
                                >,
                              ),
                          )
                            .filter(([key, data]: [string, any]) => {
                              let match = true;
                              if (certSearchTerm) {
                                match =
                                  match &&
                                  !!data.courseTitle
                                    ?.toLowerCase()
                                    .includes(certSearchTerm.toLowerCase());
                              }
                              if (certDateTerm) {
                                const issuedAt =
                                  data.certs.length > 0
                                    ? data.certs[0].issuedAt ||
                                      data.certs[0].issued_at
                                    : null;
                                const dateObj = issuedAt?.toDate
                                  ? issuedAt.toDate()
                                  : new Date(issuedAt);
                                const certMonthStr =
                                  issuedAt && !isNaN(dateObj.getTime())
                                    ? dateObj.toLocaleString("en-US", {
                                        month: "long",
                                        year: "numeric",
                                      })
                                    : "";
                                match = match && certMonthStr === certDateTerm;
                              }
                              return match;
                            })
                            .sort(
                              (
                                [, dataA]: [string, any],
                                [, dataB]: [string, any],
                              ) => {
                                const dateA =
                                  dataA.certs.length > 0
                                    ? dataA.certs[0].issuedAt?.toDate
                                      ? dataA.certs[0].issuedAt.toDate()
                                      : new Date(
                                          dataA.certs[0].issuedAt ||
                                            dataA.certs[0].issued_at,
                                        )
                                    : new Date(0);
                                const dateB =
                                  dataB.certs.length > 0
                                    ? dataB.certs[0].issuedAt?.toDate
                                      ? dataB.certs[0].issuedAt.toDate()
                                      : new Date(
                                          dataB.certs[0].issuedAt ||
                                            dataB.certs[0].issued_at,
                                        )
                                    : new Date(0);
                                return dateB.getTime() - dateA.getTime();
                              },
                            )
                            .map(([key, data]: [string, any]) => (
                              <TableRow
                                key={key}
                                className="border-slate-50 hover:bg-slate-50/50 transition-colors"
                              >
                                <TableCell className="px-6 py-4">
                                  <div className="font-bold text-slate-800">
                                    {data.courseTitle || "Unknown Course"}
                                  </div>
                                  <div className="text-xs font-medium text-slate-500 mt-0.5">
                                    {data.sessionLabel}
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4">
                                  <div className="text-xs font-bold text-slate-700">
                                    {data.certs.length > 0
                                      ? formatHkDate(
                                          data.certs[0].issuedAt ||
                                            data.certs[0].issued_at,
                                        )
                                      : "N/A"}
                                  </div>
                                  <div className="text-[10px] text-slate-400 mt-0.5">
                                    {data.certs.length} certificates
                                  </div>
                                </TableCell>
                                <TableCell className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() =>
                                        generateBulkCertificatesPDF(
                                          data.certs,
                                          `${data.courseTitle} - ${data.sessionLabel}`,
                                        )
                                      }
                                      className="gap-2 h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-blue-600 border-blue-100 hover:bg-blue-50/50"
                                    >
                                      <Download className="w-3 h-3" /> Download{" "}
                                      {data.certs.length} PDFs
                                    </Button>
                                    {getPermission("certificates") !==
                                    "view" ? (
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={async () => {
                                          if (
                                            window.confirm(
                                              "Are you sure you want to remove all certificates for this course session? This cannot be undone.",
                                            )
                                          ) {
                                            try {
                                              const deletePromises =
                                                data.certs.map((c: any) =>
                                                  deleteDoc(
                                                    doc(
                                                      collection(
                                                        db,
                                                        "certificates",
                                                      ),
                                                      c.id,
                                                    ),
                                                  ),
                                                );
                                              await Promise.all(deletePromises);
                                              setCertificates((prev) =>
                                                prev.filter(
                                                  (p) =>
                                                    !data.certs.some(
                                                      (c: any) => c.id === p.id,
                                                    ),
                                                ),
                                              );
                                              toast.success(
                                                "Certificates removed successfully",
                                              );
                                            } catch (e: any) {
                                              toast.error(e.message);
                                            }
                                          }
                                        }}
                                        className="gap-2 h-8 px-3 text-[10px] font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 hover:text-red-700"
                                      >
                                        <Trash2 className="w-3 h-3" /> Remove
                                      </Button>
                                    ) : (
                                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 border border-slate-200 px-3 py-2 rounded">
                                        Locked
                                      </span>
                                    )}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          {certificates.length === 0 && (
                            <TableRow>
                              <TableCell
                                colSpan={3}
                                className="text-center py-12 text-slate-400 text-xs italic tracking-wider"
                              >
                                No certificates found in system records.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === "scheduling" && (
              <SchedulingTab
                scheduleTab={scheduleTab}
                setScheduleTab={setScheduleTab}
                scheduleDate={scheduleDate}
                setScheduleDate={setScheduleDate}
                scheduleMonth={scheduleMonth}
                setScheduleMonth={setScheduleMonth}
                scheduleInstructorFilter={scheduleInstructorFilter}
                setScheduleInstructorFilter={setScheduleInstructorFilter}
                scheduleRoomFilter={scheduleRoomFilter}
                setScheduleRoomFilter={setScheduleRoomFilter}
                schoolInfo={schoolInfo}
                courses={courses}
                sessions={sessions}
                lessons={lessons}
                tutors={tutors}
                regs={regs}
              />
            )}

            {activeTab === "courses" && (
              <div className="space-y-4">
                <ReadOnlyAlert moduleKey="courses" />
                <CoursesTab
                  courseSearchTerm={courseSearchTerm}
                  setCourseSearchTerm={setCourseSearchTerm}
                  setCourseCreationModalOpen={setCourseCreationModalOpen}
                  courses={courses}
                  sessions={sessions}
                  setSelectedTemplateForIntake={setSelectedTemplateForIntake}
                  newSession={newSession}
                  setNewSession={setNewSession}
                  setActiveTab={setActiveTab}
                  setSelectedCourse={setSelectedCourse}
                  setCourseModalOpen={setCourseModalOpen}
                  confirmDelete={confirmDelete}
                  readOnly={getPermission("courses") === "view"}
                />
              </div>
            )}

            {activeTab === "tutors" && (
              <TutorsTab
                instructorSearchTerm={instructorSearchTerm}
                setInstructorSearchTerm={setInstructorSearchTerm}
                ptMonth={ptMonth}
                setPtMonth={setPtMonth}
                setIsManualHoursModalOpen={setIsManualHoursModalOpen}
                hours={hours}
                tutors={tutors}
                generatePTReport={generatePTReport}
                handleUpdateHoursStatus={handleUpdateHoursStatus}
              />
            )}

            {activeTab === "feedback-template" && <FeedbackTemplateTab />}

            {activeTab === "feedback" && (
              <FeedbackTab
                feedbacks={feedbacks}
                courses={courses}
                sessions={sessions}
                selectedFeedbackCourse={selectedFeedbackCourse}
                setSelectedFeedbackCourse={setSelectedFeedbackCourse}
                handleExportCSV={handleExportCSV}
                onOpenTemplate={() => setActiveTab("feedback-template")}
              />
            )}

            {activeTab === "sessions" && (
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
                confirmDelete={confirmDelete}
                fetchData={fetchData}
                certificates={certificates}
                db={db}
              />
            )}

            {(activeTab === "staff" || activeTab === "students") && (
              <UsersTab
                activeTab={activeTab}
                getPermission={getPermission}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                roleFilter={roleFilter}
                setRoleFilter={setRoleFilter}
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
                filteredUsers={filteredUsers}
                setUserForm={setUserForm}
                setIsUserModalOpen={setIsUserModalOpen}
                handleExportCSV={handleExportCSV}
                handleSort={handleSort}
                sortConfig={sortConfig}
                setSelectedUser={setSelectedUser}
                handlePasswordReset={handlePasswordReset}
                setUserToDelete={setUserToDelete}
                setIsDeleteUserModalOpen={setIsDeleteUserModalOpen}
                schoolInfo={schoolInfo}
                formatHkDate={formatHkDate}
                navigate={navigate}
                role={role}
              />
            )}

            {activeTab === "logs" && (
              <LogsTab
                logSearchTerm={logSearchTerm}
                setLogSearchTerm={setLogSearchTerm}
                logMonth={logMonth}
                setLogMonth={setLogMonth}
                setIsDeleteLogsModalOpen={setIsDeleteLogsModalOpen}
                auditLogs={auditLogs}
                allUsers={allUsers}
                handleExportCSV={handleExportCSV}
              />
            )}

            {activeTab === "promotions" && (
              <div className="space-y-6">
                <ReadOnlyAlert moduleKey="promotions" />
                <PromotionsTab
                  promotions={promotions}
                  promoCategoryFilter={promoCategoryFilter}
                  setPromoCategoryFilter={setPromoCategoryFilter}
                  regs={regs}
                  setSelectedPromo={setSelectedPromo}
                  setPromoForm={setPromoForm}
                  setIsPromoModalOpen={setIsPromoModalOpen}
                  setPromoToDelete={setPromoToDelete}
                  setIsDeletePromoModalOpen={setIsDeletePromoModalOpen}
                  courses={courses}
                  sessions={sessions}
                  readOnly={getPermission("promotions") === "view"}
                />
              </div>
            )}

            {activeTab === "settings" && (
              <div className="space-y-6">
                <ReadOnlyAlert moduleKey="settings" />
                <SettingsTab
                  schoolInfo={schoolInfo}
                  setSchoolInfo={setSchoolInfo}
                  handleSaveSchoolInfo={handleSaveSchoolInfo}
                  readOnly={getPermission("settings") === "view"}
                />
              </div>
            )}

            {activeTab === "permissions" && (
              <div className="space-y-6">
                <ReadOnlyAlert moduleKey="permissions" />
                <PermissionsTab
                  customRolePermissions={customRolePermissions}
                  setCustomRolePermissions={updateRolePermissionsInDb}
                  selectedAccessRole={selectedAccessRole}
                  setSelectedAccessRole={setSelectedAccessRole}
                  simulatedRole={simulatedRole}
                  setSimulatedRole={setSimulatedRole}
                  activeAccessSection={activeAccessSection}
                  setActiveAccessSection={setActiveAccessSection}
                  isSimulatingGlobally={isSimulatingGlobally}
                  setIsSimulatingGlobally={setIsSimulatingGlobally}
                  readOnly={getPermission("permissions") === "view"}
                />
              </div>
            )}
          </React.Suspense>
        </main>
      </div>

      {/* Delete User Confirmation Modal */}
      <UserDeleteModal
        adminPasswordForDelete={adminPasswordForDelete}
        handleDeleteUser={handleDeleteUser}
        isDeleteUserModalOpen={isDeleteUserModalOpen}
        loading={loading}
        name={name}
        role={role}
        setAdminPasswordForDelete={setAdminPasswordForDelete}
        setIsDeleteUserModalOpen={setIsDeleteUserModalOpen}
        user={user}
        userToDelete={userToDelete}
      />

      {/* User Create/Edit Modal */}
      <UserFormModal
        activeTab={activeTab}
        courses={courses}
        customRolePermissions={customRolePermissions}
        getPermission={getPermission}
        handleCreateUser={handleCreateUser}
        handleEditUser={handleEditUser}
        handlePasswordReset={handlePasswordReset}
        isUserModalOpen={isUserModalOpen}
        loading={loading}
        name={name}
        role={role}
        selectedUser={selectedUser}
        setIsUserModalOpen={setIsUserModalOpen}
        setUserForm={setUserForm}
        user={user}
        userForm={userForm}
      />

      {/* User Detail View Modal */}
      <UserViewModal
        certificates={certificates}
        certs={certs}
        courses={courses}
        expertise={expertise}
        feedbacks={feedbacks}
        generateBulkCertificatesPDF={generateBulkCertificatesPDF}
        generateMTMReport={generateMTMReport}
        globalAttendance={globalAttendance}
        hours={hours}
        isUserViewModalOpen={isUserViewModalOpen}
        lessons={lessons}
        mtmYear={mtmYear}
        name={name}
        regs={regs}
        role={role}
        selectedUser={selectedUser}
        sessions={sessions}
        setIsUserViewModalOpen={setIsUserViewModalOpen}
        setMtmYear={setMtmYear}
      />

      {/* Edit Course Modal */}
      <SessionEditModal
        isWeekendOrHoliday={isWeekendOrHoliday}
        courses={courses}
        handleUpdateSession={handleUpdateSession}
        isTutorPopoverOpen={isTutorPopoverOpen}
        loading={loading}
        name={name}
        role={role}
        schoolInfo={schoolInfo}
        selectedSession={selectedSession}
        sessionModalOpen={sessionModalOpen}
        sessions={sessions}
        setIsTutorPopoverOpen={setIsTutorPopoverOpen}
        setSelectedSession={setSelectedSession}
        setSessionModalOpen={setSessionModalOpen}
        tutors={tutors}
      />
      <DeleteConfirmModal
        deleteConfirmOpen={deleteConfirmOpen}
        handleDelete={handleDelete}
        itemToDelete={itemToDelete}
        lessons={lessons}
        loading={loading}
        name={name}
        sessions={sessions}
        setDeleteConfirmOpen={setDeleteConfirmOpen}
      />
      <CourseCreationModal
        open={courseCreationModalOpen}
        onOpenChange={setCourseCreationModalOpen}
        newCourse={newCourse}
        setNewCourse={setNewCourse}
        courseCategories={courseCategories}
        setCategoryManagerOpen={setCategoryManagerOpen}
        handleCreateCourse={handleCreateCourse}
        loading={loading}
      />

      <CourseEditModal
        open={courseModalOpen}
        onOpenChange={setCourseModalOpen}
        selectedCourse={selectedCourse}
        setSelectedCourse={setSelectedCourse}
        courseCategories={courseCategories}
        setCategoryManagerOpen={setCategoryManagerOpen}
        handleUpdateCourse={handleUpdateCourse}
        loading={loading}
      />

      <SessionCreationModal
        isWeekendOrHoliday={isWeekendOrHoliday}
        courses={courses}
        handleCreateSession={handleCreateSession}
        isCoursePopoverOpen={isCoursePopoverOpen}
        isTutorPopoverOpen={isTutorPopoverOpen}
        loading={loading}
        name={name}
        newSession={newSession}
        role={role}
        selectedTemplateForIntake={selectedTemplateForIntake}
        sessionCreationModalOpen={sessionCreationModalOpen}
        sessions={sessions}
        setIsCoursePopoverOpen={setIsCoursePopoverOpen}
        setIsTutorPopoverOpen={setIsTutorPopoverOpen}
        setNewSession={setNewSession}
        setSelectedTemplateForIntake={setSelectedTemplateForIntake}
        setSessionCreationModalOpen={setSessionCreationModalOpen}
        tutors={tutors}
      />

      <CertificateModal
        courses={courses}
        handleToggleAttendanceConfirm={handleToggleAttendanceConfirm}
        handleUpdateSingleAttendance={handleUpdateSingleAttendance}
        isCertLoading={isCertLoading}
        isCertModalOpen={isCertModalOpen}
        lessons={lessons}
        pastDaysToShow={pastDaysToShow}
        selectedSessionCert={selectedSessionCert}
        sessionStudentsData={sessionStudentsData}
        sessions={sessions}
        setIsCertModalOpen={setIsCertModalOpen}
        setPastDaysToShow={setPastDaysToShow}
      />

      <AttendanceModal
        attendanceData={attendanceData}
        handleSaveAttendanceAdmin={handleSaveAttendanceAdmin}
        isAttendanceModalOpen={isAttendanceModalOpen}
        regs={regs}
        selectedLessonForAttendance={selectedLessonForAttendance}
        setAttendanceData={setAttendanceData}
        setIsAttendanceModalOpen={setIsAttendanceModalOpen}
        submittingAttendance={submittingAttendance}
      />
      <SessionAttendanceModal
        handleOpenAttendanceModal={handleOpenAttendanceModal}
        isSessionAttendanceModalOpen={isSessionAttendanceModalOpen}
        lessons={lessons}
        selectedSessionForAttendance={selectedSessionForAttendance}
        sessions={sessions}
        setActiveTab={setActiveTab}
        setIsSessionAttendanceModalOpen={setIsSessionAttendanceModalOpen}
        setViewingLessonsForSession={setViewingLessonsForSession}
      />

      {/* Manual Hours Modal */}
      <ManualHoursModal
        courses={courses}
        handleManualHoursSubmit={handleManualHoursSubmit}
        isManualHoursModalOpen={isManualHoursModalOpen}
        isSubmittingManualHours={isSubmittingManualHours}
        manualHoursForm={manualHoursForm}
        name={name}
        role={role}
        setIsManualHoursModalOpen={setIsManualHoursModalOpen}
        setManualHoursForm={setManualHoursForm}
        tutors={tutors}
      />

      <DeleteLogsModal
        adminPasswordForLogDelete={adminPasswordForLogDelete}
        handleDeleteLogsByDate={handleDeleteLogsByDate}
        isDeleteLogsModalOpen={isDeleteLogsModalOpen}
        loading={loading}
        logDeleteDate={logDeleteDate}
        setAdminPasswordForLogDelete={setAdminPasswordForLogDelete}
        setIsDeleteLogsModalOpen={setIsDeleteLogsModalOpen}
        setLogDeleteDate={setLogDeleteDate}
      />

      <PromoModal
        PROMO_CATEGORIES={PROMO_CATEGORIES}
        courses={courses}
        handleSavePromo={handleSavePromo}
        isPromoModalOpen={isPromoModalOpen}
        name={name}
        promoForm={promoForm}
        selectedPromo={selectedPromo}
        setIsPromoModalOpen={setIsPromoModalOpen}
        setPromoForm={setPromoForm}
      />

      {/* Delete Promo Modal */}
      <DeletePromoModal
        PROMO_CATEGORIES={PROMO_CATEGORIES}
        db={db}
        doc={doc}
        fetchData={fetchData}
        isDeletePromoModalOpen={isDeletePromoModalOpen}
        name={name}
        promoToDelete={promoToDelete}
        promotions={promotions}
        setIsDeletePromoModalOpen={setIsDeletePromoModalOpen}
      />
    </div>
  );
}
