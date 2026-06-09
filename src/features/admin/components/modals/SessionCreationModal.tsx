import {
  Loader2,
  Award,
  Users,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Mail,
  Phone,
  CalendarIcon,
  Download,
  FileText,
  ExternalLink as Link,
  CheckCircle,
  Clock,
  Search,
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
export interface SessionCreationModalProps {
  isWeekendOrHoliday: any;
  courses: any;
  handleCreateSession: any;
  isCoursePopoverOpen: any;
  isTutorPopoverOpen: any;
  loading: any;
  name: any;
  newSession: any;
  role: any;
  selectedTemplateForIntake: any;
  sessionCreationModalOpen: any;
  sessions: any;
  setIsCoursePopoverOpen: any;
  setIsTutorPopoverOpen: any;
  setNewSession: any;
  setSelectedTemplateForIntake: any;
  setSessionCreationModalOpen: any;
  tutors: any;
}

export function SessionCreationModal({
  isWeekendOrHoliday,
  courses,
  handleCreateSession,
  isCoursePopoverOpen,
  isTutorPopoverOpen,
  loading,
  name,
  newSession,
  role,
  selectedTemplateForIntake,
  sessionCreationModalOpen,
  sessions,
  setIsCoursePopoverOpen,
  setIsTutorPopoverOpen,
  setNewSession,
  setSelectedTemplateForIntake,
  setSessionCreationModalOpen,
  tutors,
}: SessionCreationModalProps) {
  return (
    <Dialog
      open={sessionCreationModalOpen}
      onOpenChange={setSessionCreationModalOpen}
    >
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col p-0 border-none shadow-2xl">
        <DialogHeader className="p-6 pb-2 bg-slate-50/50 rounded-t-lg border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {selectedTemplateForIntake
              ? `New Intake: ${selectedTemplateForIntake.title}`
              : "Create Course"}
          </DialogTitle>
          <DialogDescription>
            Schedule a specific instance of a course template
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {(() => {
            const currentCourseTemplate =
              selectedTemplateForIntake ||
              courses.find((c) => c.id === newSession.courseId);
            return (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {!selectedTemplateForIntake && (
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Target Course Template
                      </label>
                      <Popover
                        open={isCoursePopoverOpen}
                        onOpenChange={setIsCoursePopoverOpen}
                      >
                        <PopoverTrigger
                          render={
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={isCoursePopoverOpen}
                              className="w-full justify-between h-10 bg-slate-50/50 border-slate-200 font-normal"
                            >
                              {newSession.courseId
                                ? courses.find(
                                    (c) => c.id === newSession.courseId,
                                  )?.title
                                : "-- Search & Choose Template --"}
                              <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                          }
                        />
                        <PopoverContent
                          className="w-[--anchor-width] p-0"
                          align="start"
                        >
                          <Command>
                            <CommandInput placeholder="Search course title or code..." />
                            <CommandList>
                              <CommandEmpty>
                                No matching course found.
                              </CommandEmpty>
                              <CommandGroup>
                                {courses.map((c) => (
                                  <CommandItem
                                    key={c.id}
                                    value={`${c.title} ${c.courseCode}`}
                                    onSelect={() => {
                                      setNewSession({
                                        ...newSession,
                                        courseId: c.id,
                                        earlyBirdPrice: c.earlyBirdPrice || 0,
                                        standardPrice: c.standardPrice || 0,
                                      });
                                      setIsCoursePopoverOpen(false);
                                    }}
                                  >
                                    <div className="flex flex-col">
                                      <span className="font-medium text-[13px]">
                                        {c.title}
                                      </span>
                                      <span className="text-[10px] text-slate-400 font-mono tracking-tight">
                                        {c.courseCode}
                                      </span>
                                    </div>
                                    <CheckCircle
                                      className={cn(
                                        "ml-auto h-4 w-4 text-blue-600",
                                        newSession.courseId === c.id
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
                    </div>
                  )}
                  <div className="space-y-1.5 col-span-2">
                    {currentCourseTemplate?.day && (
                      <div className="text-xs bg-blue-50 text-blue-700 p-2 rounded border border-blue-100 mb-2 font-medium flex items-center gap-2">
                        <Clock className="w-4 h-4" /> Template Duration:{" "}
                        {currentCourseTemplate.day} Days
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Start Date
                    </label>

                    <Input
                      type="date"
                      value={newSession.startDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const v = isWeekendOrHoliday(val);
                        if (v.isInvalid) return toast.error(v.reason);
                        if (newSession.endDate && val > newSession.endDate)
                          return toast.error(
                            "Start date cannot be later than end date",
                          );
                        setNewSession({ ...newSession, startDate: val });
                      }}
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      End Date
                    </label>
                    <Input
                      type="date"
                      value={newSession.endDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        const v = isWeekendOrHoliday(val);
                        if (v.isInvalid) return toast.error(v.reason);
                        if (newSession.startDate && val < newSession.startDate)
                          return toast.error(
                            "End date cannot be earlier than start date",
                          );
                        setNewSession({ ...newSession, endDate: val });
                      }}
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Delivery Mode
                    </label>
                    <select
                      className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none"
                      value={newSession.deliveryMode}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          deliveryMode: e.target.value,
                        })
                      }
                    >
                      <option value="onsite">ClassRoom</option>
                      <option value="online">Online (Zoom/Teams)</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Instructor
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
                            className="w-full justify-between h-10 bg-slate-50/50 border-slate-200 font-normal"
                          >
                            {newSession.tutorId
                              ? tutors.find((t) => t.id === newSession.tutorId)
                                  ?.name
                              : "-- Assign Instructor --"}
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
                                      !newSession.startDate ||
                                      !newSession.endDate
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
                                        s.tutorId === t.id &&
                                        s.startDate &&
                                        s.endDate &&
                                        s.startDate <= newSession.endDate &&
                                        s.endDate >= newSession.startDate &&
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

                                    setNewSession({
                                      ...newSession,
                                      tutorId: t.id,
                                    });
                                    setIsTutorPopoverOpen(false);
                                  }}
                                >
                                  <span className="text-[13px]">{t.name}</span>
                                  <CheckCircle
                                    className={cn(
                                      "ml-auto h-4 w-4 text-blue-600",
                                      newSession.tutorId === t.id
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
                      if (newSession.tutorId && newSession.courseId) {
                        const course = courses.find(
                          (c: any) => c.id === newSession.courseId,
                        );
                        const tutor = tutors.find(
                          (t: any) => t.id === newSession.tutorId,
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

                  {(newSession.deliveryMode === "online" ||
                    newSession.deliveryMode === "hybrid") && (
                    <div className="space-y-1.5 col-span-2">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                        Zoom / Teams Weblink
                      </label>
                      <Input
                        placeholder="https://zoom.us/j/..."
                        value={newSession.meetingLink}
                        onChange={(e) =>
                          setNewSession({
                            ...newSession,
                            meetingLink: e.target.value,
                          })
                        }
                        className="h-10 bg-blue-50/30 border-blue-100"
                      />
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Quota
                    </label>
                    <Input
                      type="number"
                      value={isNaN(newSession.quota) ? "" : newSession.quota}
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          quota: parseInt(e.target.value) || 0,
                        })
                      }
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Early Bird Price (HKD)
                    </label>
                    <Input
                      type="number"
                      value={
                        isNaN(newSession.earlyBirdPrice)
                          ? ""
                          : newSession.earlyBirdPrice
                      }
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          earlyBirdPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                    {currentCourseTemplate?.earlyBirdPrice ? (
                      <p className="text-[9px] text-slate-400">
                        Template Base: ${currentCourseTemplate.earlyBirdPrice}
                      </p>
                    ) : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      Standard Price (HKD)
                    </label>
                    <Input
                      type="number"
                      value={
                        isNaN(newSession.standardPrice)
                          ? ""
                          : newSession.standardPrice
                      }
                      onChange={(e) =>
                        setNewSession({
                          ...newSession,
                          standardPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="h-10 bg-slate-50/50 border-slate-200"
                    />
                    {currentCourseTemplate?.standardPrice ? (
                      <p className="text-[9px] text-slate-400">
                        Template Base: ${currentCourseTemplate.standardPrice}
                      </p>
                    ) : null}
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        <DialogFooter className="p-6 bg-slate-50/50 rounded-b-lg border-t border-slate-100 flex gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSessionCreationModalOpen(false);
              setSelectedTemplateForIntake(null);
            }}
            className="text-slate-500 font-bold text-xs uppercase tracking-widest"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateSession}
            className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-600/20 px-8 font-bold text-xs uppercase tracking-widest"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            Start Intake
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
