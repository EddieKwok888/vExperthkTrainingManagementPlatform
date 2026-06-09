import {
  ClipboardList,
  CheckCircle,
  Award,
  Users,
  ShieldCheck,
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
export interface SessionAttendanceModalProps {
  handleOpenAttendanceModal: any;
  isSessionAttendanceModalOpen: any;
  lessons: any;
  selectedSessionForAttendance: any;
  sessions: any;
  setActiveTab: any;
  setIsSessionAttendanceModalOpen: any;
  setViewingLessonsForSession: any;
}

export function SessionAttendanceModal({
  handleOpenAttendanceModal,
  isSessionAttendanceModalOpen,
  lessons,
  selectedSessionForAttendance,
  sessions,
  setActiveTab,
  setIsSessionAttendanceModalOpen,
  setViewingLessonsForSession,
}: SessionAttendanceModalProps) {
  return (
    <Dialog
      open={isSessionAttendanceModalOpen}
      onOpenChange={setIsSessionAttendanceModalOpen}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">
            Manage Attendance
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Select a class below to mark student attendance.
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-2">
          <div className="space-y-3">
            {lessons
              .filter((l) => l.sessionId === selectedSessionForAttendance?.id)
              .map((l, idx) => (
                <div
                  key={l.id}
                  className="p-4 border rounded-xl hover:border-indigo-200 transition-all bg-white shadow-sm flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-sm border border-indigo-100">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">
                        {l.lessonTitle || `Lesson ${idx + 1}`}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {l.lessonDate}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {l.startTime} - {l.endTime}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-4 text-xs font-bold uppercase tracking-wider text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                      onClick={() => handleOpenAttendanceModal(l)}
                    >
                      <ClipboardList className="w-3.5 h-3.5 mr-1.5" /> Mark
                      Attendance
                    </Button>
                  </div>
                </div>
              ))}
            {lessons.filter(
              (l) => l.sessionId === selectedSessionForAttendance?.id,
            ).length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm font-medium border border-dashed rounded-xl bg-slate-50">
                <p className="mb-4">
                  No classes scheduled for this session yet.
                </p>
                <Button
                  variant="default"
                  className="bg-indigo-600 hover:bg-indigo-700 font-bold uppercase tracking-wider text-xs"
                  onClick={() => {
                    setIsSessionAttendanceModalOpen(false);
                    setViewingLessonsForSession(selectedSessionForAttendance);
                    setActiveTab("sessions");
                  }}
                >
                  Go to Class Scheduler
                </Button>
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="p-4 border-t border-slate-100">
          <Button
            variant="ghost"
            onClick={() => setIsSessionAttendanceModalOpen(false)}
            className="w-full font-bold text-xs uppercase tracking-[0.2em] text-slate-500"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
