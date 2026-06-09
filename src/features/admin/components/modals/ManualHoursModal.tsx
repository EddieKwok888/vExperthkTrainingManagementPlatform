import {
  Loader2,
  Award,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
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
  Clock,
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
export interface ManualHoursModalProps {
  courses: any;
  handleManualHoursSubmit: any;
  isManualHoursModalOpen: any;
  isSubmittingManualHours: any;
  manualHoursForm: any;
  name: any;
  role: any;
  setIsManualHoursModalOpen: any;
  setManualHoursForm: any;
  tutors: any;
}

export function ManualHoursModal({
  courses,
  handleManualHoursSubmit,
  isManualHoursModalOpen,
  isSubmittingManualHours,
  manualHoursForm,
  name,
  role,
  setIsManualHoursModalOpen,
  setManualHoursForm,
  tutors,
}: ManualHoursModalProps) {
  return (
    <Dialog
      open={isManualHoursModalOpen}
      onOpenChange={setIsManualHoursModalOpen}
    >
      <DialogContent className="max-w-md bg-white border-none shadow-2xl p-0 overflow-hidden rounded-2xl">
        <div className="bg-indigo-600 px-6 py-5 flex items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-bold text-white mb-1">
              Add Part-time Record
            </DialogTitle>
            <DialogDescription className="text-indigo-100 text-xs">
              Record a daily course for a part-time instructor
            </DialogDescription>
          </div>
          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
            <Clock className="w-5 h-5 text-indigo-50" />
          </div>
        </div>
        <form onSubmit={handleManualHoursSubmit} className="p-6 space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Instructor *
              </label>
              <select
                className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                value={manualHoursForm.tutorId}
                onChange={(e) =>
                  setManualHoursForm({
                    ...manualHoursForm,
                    tutorId: e.target.value,
                  })
                }
                required
              >
                <option value="">-- Select Instructor --</option>
                {tutors
                  .filter((t) => t.role === "tutor_pt")
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name || t.email}
                    </option>
                  ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Date *
                </label>
                <Input
                  type="date"
                  value={manualHoursForm.date}
                  onChange={(e) =>
                    setManualHoursForm({
                      ...manualHoursForm,
                      date: e.target.value,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Course Name *
                </label>
                <select
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 text-sm bg-white"
                  value={manualHoursForm.course}
                  onChange={(e) =>
                    setManualHoursForm({
                      ...manualHoursForm,
                      course: e.target.value,
                    })
                  }
                  required
                >
                  <option value="">-- Select Course --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.title || c.certName}>
                      {c.title || c.certName}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsManualHoursModalOpen(false)}
              className="flex-1 font-bold text-xs uppercase tracking-wider"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingManualHours}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 font-bold text-xs uppercase tracking-wider gap-2"
            >
              {isSubmittingManualHours ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              Add Hours
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
