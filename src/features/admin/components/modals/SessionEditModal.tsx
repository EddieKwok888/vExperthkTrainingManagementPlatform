import {
  Loader2,
  Award,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Clock,
  Mail,
  Phone,
  CalendarIcon,
  Download,
  FileText,
  ExternalLink as Link,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
} from "lucide-react";
import { cn } from "../../../../lib/utils";
import { toast } from "sonner";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../../components/ui/popover";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "../../../../components/ui/command";
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
export interface SessionEditModalProps {
  isWeekendOrHoliday: any;
  courses: any;
  handleUpdateSession: any;
  isTutorPopoverOpen: any;
  loading: any;
  name: any;
  role: any;
  schoolInfo: any;
  selectedSession: any;
  sessionModalOpen: any;
  sessions: any;
  setIsTutorPopoverOpen: any;
  setSelectedSession: any;
  setSessionModalOpen: any;
  tutors: any;
}

export function SessionEditModal({
  isWeekendOrHoliday,
  courses,
  handleUpdateSession,
  isTutorPopoverOpen,
  loading,
  name,
  role,
  schoolInfo,
  selectedSession,
  sessionModalOpen,
  sessions,
  setIsTutorPopoverOpen,
  setSelectedSession,
  setSessionModalOpen,
  tutors,
}: SessionEditModalProps) {
  return (
    <Dialog open={sessionModalOpen} onOpenChange={setSessionModalOpen}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            Edit Course Intake
          </DialogTitle>
          <DialogDescription>
            Modify specific instance details, scheduling, and quotas
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={handleUpdateSession}
          className="flex-1 overflow-y-auto px-6 py-6 space-y-6 text-left"
        >
          {selectedSession && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Start Date
                  </label>
                  <Input
                    type="date"
                    value={selectedSession.startDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const v = isWeekendOrHoliday(val);
                      if (v.isInvalid) {
                        toast.error(v.reason);
                        return;
                      }
                      if (
                        selectedSession.endDate &&
                        val > selectedSession.endDate
                      ) {
                        toast.error("Start date cannot be later than end date");
                        return;
                      }
                      setSelectedSession({
                        ...selectedSession,
                        startDate: val,
                      });
                    }}
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    End Date
                  </label>
                  <Input
                    type="date"
                    value={selectedSession.endDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      const v = isWeekendOrHoliday(val);
                      if (v.isInvalid) {
                        toast.error(v.reason);
                        return;
                      }
                      if (
                        selectedSession.startDate &&
                        val < selectedSession.startDate
                      ) {
                        toast.error(
                          "End date cannot be earlier than start date",
                        );
                        return;
                      }
                      setSelectedSession({ ...selectedSession, endDate: val });
                    }}
                    className="h-10 border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Delivery Mode
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                    value={selectedSession.deliveryMode}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        deliveryMode: e.target.value,
                      })
                    }
                  >
                    <option value="onsite">ClassRoom</option>
                    <option value="online">Online</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Lead Instructor
                  </label>
                  <Popover
                    open={isTutorPopoverOpen}
                    onOpenChange={setIsTutorPopoverOpen}
                  >
                    <PopoverTrigger
                      render={
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={isTutorPopoverOpen}
                          className="w-full justify-between h-10 border-slate-200 font-normal"
                        >
                          {selectedSession.tutorId
                            ? tutors.find(
                                (t) => t.id === selectedSession.tutorId,
                              )?.name
                            : "-- Unassigned --"}
                          <ChevronLeft className="ml-2 h-4 w-4 shrink-0 opacity-50 -rotate-90" />
                        </Button>
                      }
                    />
                    <PopoverContent
                      className="w-[--anchor-width] p-0"
                      align="start"
                    >
                      <Command>
                        <CommandInput placeholder="Search instructor name..." />
                        <CommandList>
                          <CommandEmpty>No instructor found.</CommandEmpty>
                          <CommandGroup>
                            {tutors.map((t) => (
                              <CommandItem
                                key={t.id}
                                value={t.name}
                                onSelect={() => {
                                  if (
                                    !selectedSession.startDate ||
                                    !selectedSession.endDate
                                  ) {
                                    toast.error(
                                      <span className="font-bold text-red-600">
                                        Please enter Start Date and End Date
                                        first before selecting an instructor.
                                      </span>,
                                    );
                                    return;
                                  }

                                  const hasOverlap = sessions.some(
                                    (s: any) =>
                                      s.id !== selectedSession.id &&
                                      s.tutorId === t.id &&
                                      s.startDate &&
                                      s.endDate &&
                                      s.startDate <= selectedSession.endDate &&
                                      s.endDate >= selectedSession.startDate &&
                                      s.sessionStatus !== "cancelled",
                                  );

                                  if (hasOverlap) {
                                    toast.error(
                                      <span className="font-bold text-red-600">
                                        This instructor is already assigned to
                                        an overlapping course intake! Please
                                        choose another instructor or different
                                        dates.
                                      </span>,
                                    );
                                    return;
                                  }

                                  setSelectedSession({
                                    ...selectedSession,
                                    tutorId: t.id,
                                  });
                                  setIsTutorPopoverOpen(false);
                                }}
                              >
                                <span className="text-[13px]">{t.name}</span>
                                <CheckCircle
                                  className={cn(
                                    "ml-auto h-4 w-4 text-blue-600",
                                    selectedSession.tutorId === t.id
                                      ? "opacity-100"
                                      : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>

                  {(() => {
                    if (selectedSession.tutorId && selectedSession.courseId) {
                      const course = courses.find(
                        (c: any) => c.id === selectedSession.courseId,
                      );
                      const tutor = tutors.find(
                        (t: any) => t.id === selectedSession.tutorId,
                      );
                      if (
                        course &&
                        course.category &&
                        tutor &&
                        tutor.qualifiedCategories &&
                        !tutor.qualifiedCategories.includes(course.category)
                      ) {
                        return (
                          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-md">
                            <p className="text-xs font-bold text-red-600 leading-tight">
                              <AlertTriangle className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
                              Warning: Instructor is not qualified to teach "
                              {course.category}" category.
                            </p>
                          </div>
                        );
                      }
                    }
                    return null;
                  })()}
                </div>
              </div>

              {(selectedSession.deliveryMode === "online" ||
                selectedSession.deliveryMode === "hybrid") && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                    Zoom / Teams Weblink
                  </label>
                  <Input
                    placeholder="https://zoom.us/j/..."
                    value={selectedSession.meetingLink}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        meetingLink: e.target.value,
                      })
                    }
                    className="h-10 bg-blue-50/30 border-blue-100"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Early Bird Price (HKD)
                  </label>
                  <Input
                    type="number"
                    value={
                      selectedSession.earlyBirdPrice !== undefined &&
                      selectedSession.earlyBirdPrice !== null &&
                      !isNaN(selectedSession.earlyBirdPrice)
                        ? selectedSession.earlyBirdPrice
                        : (courses.find(
                            (c: any) => c.id === selectedSession.courseId,
                          )?.earlyBirdPrice ?? "")
                    }
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        earlyBirdPrice: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-10 border-slate-200"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Standard Price (HKD)
                  </label>
                  <Input
                    type="number"
                    value={
                      selectedSession.standardPrice !== undefined &&
                      selectedSession.standardPrice !== null &&
                      !isNaN(selectedSession.standardPrice)
                        ? selectedSession.standardPrice
                        : (courses.find(
                            (c: any) => c.id === selectedSession.courseId,
                          )?.standardPrice ?? "")
                    }
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        standardPrice: parseFloat(e.target.value) || 0,
                        price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="h-10 border-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Enrollment Status
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none disabled:opacity-50"
                    value={selectedSession.sessionStatus}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        sessionStatus: e.target.value,
                      })
                    }
                    disabled={selectedSession.sessionStatus === "completed"}
                  >
                    <option value="open">Open</option>
                    <option value="full">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                    {selectedSession.sessionStatus === "completed" && (
                      <option value="completed">Completed</option>
                    )}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Student Quota
                  </label>
                  <Input
                    type="number"
                    value={selectedSession.quota}
                    onChange={(e) =>
                      setSelectedSession({
                        ...selectedSession,
                        quota: parseInt(e.target.value) || 0,
                      })
                    }
                    className="h-10 border-slate-200"
                  />
                </div>
              </div>

              {(selectedSession.sessionStatus === "full" ||
                selectedSession.sessionStatus === "completed") &&
                selectedSession.deliveryMode !== "online" && (
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600 flex items-center gap-1">
                      Choose Room{" "}
                      <span className="text-[10px] font-normal text-slate-400 capitalize">
                        (Required for {selectedSession.sessionStatus} courses)
                      </span>
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-blue-200 bg-blue-50/30 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 outline-none"
                      value={selectedSession.room || ""}
                      onChange={(e) =>
                        setSelectedSession({
                          ...selectedSession,
                          room: e.target.value,
                        })
                      }
                    >
                      <option value="">-- Select a Room --</option>
                      {schoolInfo.rooms
                        ?.split(",")
                        .map((r) => r.trim())
                        .filter(Boolean)
                        .map((room, idx) => (
                          <option key={idx} value={room}>
                            {room}
                          </option>
                        ))}
                    </select>
                  </div>
                )}
            </div>
          )}
          <DialogFooter className="pt-6 border-t border-slate-100 flex gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setSessionModalOpen(false)}
              className="text-slate-500 font-bold text-xs uppercase tracking-widest"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
