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
                          {[
                            { id: 'present_am', label: 'AM Present', color: 'bg-emerald-600 border-emerald-600' },
                            { id: 'present_pm', label: 'PM Present', color: 'bg-indigo-600 border-indigo-600' },
                            { id: 'absent', label: 'Absent', color: 'bg-red-600 border-red-600' }
                          ].map(
                            (item) => {
                              const currentStatus = attendanceData[r.id] ?? '';
                              const isMarked = currentStatus === item.id || ((item.id === 'present_am' || item.id === 'present_pm') && currentStatus === 'present');
                              return (
                              <button
                                key={item.id}
                                onClick={() =>
                                  setAttendanceData((prev: any) => {
                                    const cur = prev[r.id] || '';
                                    let nextStatus = item.id;
                                    if (item.id === 'absent') {
                                      nextStatus = cur === 'absent' ? '' : 'absent';
                                    } else if (item.id === 'present_am') {
                                      if (cur === 'present_am') nextStatus = '';
                                      else if (cur === 'present_pm') nextStatus = 'present';
                                      else if (cur === 'present') nextStatus = 'present_pm';
                                    } else if (item.id === 'present_pm') {
                                      if (cur === 'present_pm') nextStatus = '';
                                      else if (cur === 'present_am') nextStatus = 'present';
                                      else if (cur === 'present') nextStatus = 'present_am';
                                    }
                                    return { ...prev, [r.id]: nextStatus };
                                  })
                                }
                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all tracking-wider border ${
                                  isMarked
                                    ? `${item.color} text-white shadow-md`
                                    : "border-slate-200 text-slate-400 bg-white hover:border-slate-300 hover:text-slate-700"
                                }`}
                              >
                                {item.label}
                              </button>
                            )}
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
