import {
  Loader2,
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
  CheckCircle,
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
export interface AttendanceModalProps {
  attendanceData: any;
  handleSaveAttendanceAdmin: any;
  isAttendanceModalOpen: any;
  regs: any;
  selectedLessonForAttendance: any;
  setAttendanceData: any;
  setIsAttendanceModalOpen: any;
  submittingAttendance: any;
}

export function AttendanceModal({
  attendanceData,
  handleSaveAttendanceAdmin,
  isAttendanceModalOpen,
  regs,
  selectedLessonForAttendance,
  setAttendanceData,
  setIsAttendanceModalOpen,
  submittingAttendance,
}: AttendanceModalProps) {
  return (
    <Dialog
      open={isAttendanceModalOpen}
      onOpenChange={setIsAttendanceModalOpen}
    >
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader className="p-6 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-black text-slate-800 tracking-tight">
            Mark Attendance
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            {selectedLessonForAttendance?.lessonTitle} (
            {selectedLessonForAttendance?.lessonDate})
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto px-6 py-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-xs">
                  Student
                </TableHead>
                <TableHead className="font-bold text-slate-400 uppercase tracking-widest text-xs">
                  Email
                </TableHead>
                <TableHead className="text-center font-bold text-slate-400 uppercase tracking-widest text-xs">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regs.filter(
                (r) =>
                  r.sessionId === selectedLessonForAttendance?.sessionId &&
                  r.status === "verified",
              ).length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={3}
                    className="text-center py-8 text-slate-500 font-medium"
                  >
                    No verified students enrolled in this session.
                  </TableCell>
                </TableRow>
              ) : (
                regs
                  .filter(
                    (r) =>
                      r.sessionId === selectedLessonForAttendance?.sessionId &&
                      r.status === "verified",
                  )
                  .map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-bold text-slate-700">
                        {r.studentName}
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">
                        {r.studentEmail}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1.5 sm:gap-2">
                          {["present", "absent", "late", "excused"].map(
                            (status) => (
                              <button
                                key={status}
                                onClick={() =>
                                  setAttendanceData((prev) => ({
                                    ...prev,
                                    [r.studentId]: status,
                                  }))
                                }
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider border-2 ${
                                  attendanceData[r.studentId] === status
                                    ? status === "present"
                                      ? "bg-green-600 border-green-600 text-white shadow-md"
                                      : status === "absent"
                                        ? "bg-red-600 border-red-600 text-white shadow-md"
                                        : status === "late"
                                          ? "bg-amber-500 border-amber-500 text-white shadow-md"
                                          : "bg-blue-600 border-blue-600 text-white shadow-md"
                                    : "border-slate-200 text-slate-400 bg-white hover:border-slate-300"
                                }`}
                              >
                                {status}
                              </button>
                            ),
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </div>
        <DialogFooter className="p-6 border-t border-slate-100 flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsAttendanceModalOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSaveAttendanceAdmin}
            disabled={submittingAttendance}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            {submittingAttendance ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            Save Attendance
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
