import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Input } from "../../../components/ui/input";
import {
  Building2,
  CalendarIcon,
  Clock,
  MapPin,
  MonitorPlay,
  Users,
} from "lucide-react";

interface SchedulingTabProps {
  scheduleTab:
    | "trainer-daily"
    | "trainer-monthly"
    | "room-daily"
    | "room-monthly"
    | "tech-daily";
  setScheduleTab: (
    tab:
      | "trainer-daily"
      | "trainer-monthly"
      | "room-daily"
      | "room-monthly"
      | "tech-daily",
  ) => void;
  scheduleDate: string;
  setScheduleDate: (date: string) => void;
  scheduleMonth: string;
  setScheduleMonth: (month: string) => void;
  scheduleInstructorFilter: string;
  setScheduleInstructorFilter: (val: string) => void;
  scheduleRoomFilter: string;
  setScheduleRoomFilter: (val: string) => void;
  schoolInfo: any;
  courses: any[];
  sessions: any[];
  lessons: any[];
  tutors: any[];
  regs: any[];
}

export function SchedulingTab({
  scheduleTab,
  setScheduleTab,
  scheduleDate,
  setScheduleDate,
  scheduleMonth,
  setScheduleMonth,
  scheduleInstructorFilter,
  setScheduleInstructorFilter,
  scheduleRoomFilter,
  setScheduleRoomFilter,
  schoolInfo,
  courses,
  sessions,
  lessons,
  tutors,
  regs,
}: SchedulingTabProps) {
  return (
    <div className="space-y-6">
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-max mb-6">
        <Button
          variant={scheduleTab === "trainer-daily" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScheduleTab("trainer-daily")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          Instructor (Daily)
        </Button>
        <Button
          variant={scheduleTab === "trainer-monthly" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScheduleTab("trainer-monthly")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          Instructor (Monthly)
        </Button>
        <Button
          variant={scheduleTab === "room-daily" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScheduleTab("room-daily")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          Room (Daily)
        </Button>
        <Button
          variant={scheduleTab === "room-monthly" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScheduleTab("room-monthly")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          Room (Monthly)
        </Button>
        <Button
          variant={scheduleTab === "tech-daily" ? "default" : "ghost"}
          size="sm"
          onClick={() => setScheduleTab("tech-daily")}
          className="px-6 h-8 text-[11px] font-bold uppercase tracking-wider"
        >
          <div className="bg-blue-600 text-white p-1 rounded mr-1.5 flex items-center justify-center">
            <Building2 className="w-3 h-3" />
          </div>{" "}
          Tech Setup (Daily)
        </Button>
      </div>

      {/* TECH SETUP DAILY */}
      {scheduleTab === "tech-daily" && (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm relative overflow-hidden">
          <div className="absolute top-0 inset-x-0 h-1 bg-blue-600"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-50">
            <div>
              <CardTitle className="flex items-center gap-2">
                <div className="bg-blue-600 text-white p-1.5 rounded-md flex items-center justify-center">
                  <Building2 className="w-4 h-4" />
                </div>{" "}
                Tech Setup Overview
              </CardTitle>
              <CardDescription>
                Detailed daily breakdown of room usage and configuration
                requirements
              </CardDescription>
            </div>
            <div className="flex bg-slate-50 rounded-lg p-1 border border-slate-200">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const today = new Date();
                  setScheduleDate(today.toISOString().split("T")[0]);
                }}
                className="h-8 px-3 text-xs font-bold text-slate-600"
              >
                Today
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setScheduleDate(tomorrow.toISOString().split("T")[0]);
                }}
                className="h-8 px-3 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100"
              >
                Tomorrow
              </Button>
              <div className="w-[1px] bg-slate-200 mx-2 my-1"></div>
              <Input
                type="date"
                className="w-auto h-8 text-xs border-transparent bg-transparent focus-visible:ring-0 shadow-none"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-6">
              {(() => {
                let configRooms = schoolInfo?.rooms
                  ? schoolInfo.rooms
                      .split(",")
                      .map((r: string) => r.trim())
                      .filter(Boolean)
                  : [];
                const usedRooms = lessons
                  .map((l) => {
                    const session = sessions.find(
                      (s) => s.id === l.sessionId || s.id === l.session_id,
                    );
                    return l.classroom || session?.room || session?.classroom;
                  })
                  .filter(Boolean);
                let availableRooms = Array.from(
                  new Set([...configRooms, ...usedRooms, "unassigned"]),
                ) as string[];

                const activeLessonsToday = lessons.filter(
                  (l) => (l.lessonDate || l.lesson_date || "") === scheduleDate,
                );

                const activeSessionsToday = sessions.filter((s) => {
                  if (
                    s.sessionStatus !== "confirmed" &&
                    s.sessionStatus !== "full" &&
                    s.sessionStatus !== "completed"
                  )
                    return false;
                  const isDailyLesson = activeLessonsToday.some(
                    (l) => l.sessionId === s.id,
                  );
                  if (isDailyLesson) return true;
                  if (!s.startDate || !s.endDate) return false;
                  if (
                    s.deliveryMode === "self_paced" ||
                    s.deliveryMode === "video"
                  )
                    return false;
                  return (
                    s.startDate <= scheduleDate && s.endDate >= scheduleDate
                  );
                });

                const allSessionsToDisplay: any[] = [];
                const processedSessionIds = new Set();

                activeLessonsToday.forEach((l) => {
                  const session = sessions.find(
                    (s) => s.id === l.sessionId || s.id === l.session_id,
                  );
                  if (!session) return;
                  if (
                    session.sessionStatus !== "confirmed" &&
                    session.sessionStatus !== "full" &&
                    session.sessionStatus !== "completed"
                  )
                    return;

                  allSessionsToDisplay.push({
                    id: l.id,
                    sessionId: session.id,
                    room:
                      l.classroom ||
                      session.room ||
                      session.classroom ||
                      "unassigned",
                    startTime: l.startTime || session.startTime,
                    endTime: l.endTime || session.endTime,
                    courseId: session.courseId,
                    sessionName: session.sessionName,
                    tutorId:
                      l.tutorId ||
                      l.tutor_id ||
                      session.tutorId ||
                      session.tutor_id,
                    remarks: session.remarks || session.notes || "",
                    isLesson: true,
                    lessonTitle: l.lessonTitle,
                  });
                  processedSessionIds.add(session.id);
                });

                activeSessionsToday.forEach((s) => {
                  if (processedSessionIds.has(s.id)) return;
                  allSessionsToDisplay.push({
                    id: s.id,
                    sessionId: s.id,
                    room:
                      s.room || s.classroom || s.deliveryMode || "unassigned",
                    startTime: s.startTime,
                    endTime: s.endTime,
                    courseId: s.courseId,
                    sessionName: s.sessionName,
                    tutorId: s.tutorId || s.tutor_id,
                    remarks: s.remarks || s.notes || "",
                    isLesson: false,
                    lessonTitle: "",
                  });
                });

                const roomGroups: Record<string, any[]> = {};
                allSessionsToDisplay.forEach((item) => {
                  const r = item.room || "unassigned";
                  if (!roomGroups[r]) roomGroups[r] = [];
                  roomGroups[r].push(item);
                });

                const roomKeys = Object.keys(roomGroups).sort();

                if (roomKeys.length === 0) {
                  return (
                    <div className="py-12 border-2 border-dashed border-slate-200 rounded-xl text-center text-slate-500 flex flex-col items-center">
                      <Building2 className="w-10 h-10 mb-3 text-slate-300" />
                      <p className="font-medium text-sm">
                        No setups required for {scheduleDate}.
                      </p>
                    </div>
                  );
                }

                return roomKeys.map((rName) => {
                  const roomItems = roomGroups[rName].sort((a, b) =>
                    (a.startTime || "").localeCompare(b.startTime || ""),
                  );
                  return (
                    <div
                      key={rName}
                      className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="bg-blue-600 px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-slate-300" />
                          <h3 className="font-black text-white text-sm uppercase tracking-wider">
                            {rName === "unassigned"
                              ? "Unassigned Room"
                              : rName.replace(/\s*\(Persons:.*?\)/gi, "")}
                          </h3>
                        </div>
                        <div className="px-2 py-0.5 rounded bg-white/20 text-[10px] font-bold tracking-wider text-white uppercase">
                          {roomItems.length} Courses
                        </div>
                      </div>
                      <div className="divide-y divide-slate-100 p-2 space-y-2">
                        {roomItems.map((item) => {
                          const course = courses.find(
                            (c) => c.id === item.courseId,
                          );
                          const tutor = tutors.find(
                            (t) => t.id === item.tutorId,
                          );
                          const studentCount = regs.filter(
                            (reg) =>
                              reg.sessionId === item.sessionId &&
                              reg.status === "verified",
                          ).length;

                          // Determine config color context
                          const isMicrosoft =
                            course?.category === "Microsoft" ||
                            course?.category?.toLowerCase() === "microsoft" ||
                            (course?.title || "")
                              .toLowerCase()
                              .includes("microsoft");
                          const configBadge = isMicrosoft
                            ? "bg-blue-100 text-blue-700 border-blue-200"
                            : "bg-slate-100 text-slate-700 border-slate-200";

                          return (
                            <div
                              key={item.id}
                              className="p-4 rounded-lg bg-slate-50/50 border border-slate-100 hover:bg-slate-50 transition-colors flex flex-col lg:flex-row gap-4 justify-between"
                            >
                              <div className="space-y-4 flex-1">
                                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                                  <div className="border-l-4 border-blue-600 pl-3">
                                    <div className="font-black text-slate-800 text-base leading-tight">
                                      {course?.title || item.sessionName}
                                    </div>
                                    {item.lessonTitle && (
                                      <div className="text-xs font-semibold text-slate-500 mt-1 flex items-center gap-1.5">
                                        <CalendarIcon className="w-3.5 h-3.5" />{" "}
                                        {item.lessonTitle}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2 self-start">
                                    <div className="text-sm font-black bg-white border border-slate-200 text-slate-800 px-3 py-1.5 rounded-lg shadow-sm whitespace-nowrap flex items-center gap-2">
                                      <Clock className="w-4 h-4 text-slate-400" />
                                      {item.startTime} - {item.endTime}
                                    </div>
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 pl-4 border-l border-slate-200 ml-0.5">
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                                      <Users className="w-3 h-3 text-slate-400" />{" "}
                                      Instructor
                                    </div>
                                    <div className="text-sm font-black text-slate-700 flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-500">
                                        {tutor?.name?.charAt(0) || "?"}
                                      </div>
                                      {tutor?.name ||
                                        tutor?.email ||
                                        "Unassigned"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                                      <MonitorPlay className="w-3 h-3 text-slate-400" />{" "}
                                      Requirements
                                    </div>
                                    <div
                                      className={`inline-flex items-center text-xs font-bold px-2 py-1 rounded border shadow-sm ${configBadge}`}
                                    >
                                      {course?.category || "Standard Config"}
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
                                      <Users className="w-3 h-3 text-slate-400" />{" "}
                                      Pax Status
                                    </div>
                                    <div className="text-xs font-bold text-slate-600 flex items-center gap-2">
                                      <div className="px-2 py-0.5 bg-green-100 text-green-700 rounded shadow-sm">
                                        {studentCount} Enrolled
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TRAINER DAILY */}
      {scheduleTab === "trainer-daily" && (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <CardTitle>Instructor Daily Schedule</CardTitle>
              <CardDescription>
                View all trainers for a specific day
              </CardDescription>
            </div>
            <Input
              type="date"
              className="w-auto h-9 text-xs"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {tutors.map((tutor) => {
                const tutorLessons = lessons.filter((l) => {
                  const session = sessions.find(
                    (s) => s.id === l.sessionId || s.id === l.session_id,
                  );
                  const tid =
                    l.tutorId ||
                    l.tutor_id ||
                    session?.tutorId ||
                    session?.tutor_id;
                  const date = l.lessonDate || l.lesson_date || "";
                  return tid === tutor.id && date === scheduleDate;
                });

                const tutorSessions = sessions.filter((s) => {
                  if (
                    s.sessionStatus !== "confirmed" &&
                    s.sessionStatus !== "full" &&
                    s.sessionStatus !== "completed"
                  )
                    return false;
                  const tid = s.tutorId || s.tutor_id;
                  if (tid !== tutor.id) return false;
                  if (!s.startDate || !s.endDate) return false;
                  return (
                    s.startDate <= scheduleDate && s.endDate >= scheduleDate
                  );
                });

                if (tutorLessons.length === 0 && tutorSessions.length === 0)
                  return null;

                return (
                  <div
                    key={tutor.id}
                    className="p-4 border border-slate-100 rounded-lg shadow-sm"
                  >
                    <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2">
                      <Users className="w-5 h-5 text-indigo-500" /> {tutor.name}
                    </h3>

                    {tutorLessons.length > 0 && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                        {tutorLessons.map((l) => {
                          const session = sessions.find(
                            (s) =>
                              s.id === l.sessionId || s.id === l.session_id,
                          );
                          const course = courses.find(
                            (c) => c.id === session?.courseId,
                          );
                          const displayStartTime = l.startTime
                            ? l.startTime
                            : session?.startTime;
                          const displayEndTime = l.endTime
                            ? l.endTime
                            : session?.endTime;
                          const timeDisplay =
                            displayStartTime && displayEndTime
                              ? `${displayStartTime} - ${displayEndTime}`
                              : "Time TBC";
                          return (
                            <div
                              key={l.id}
                              className="p-3 bg-indigo-50/50 border border-indigo-100 rounded text-sm"
                            >
                              <div className="font-bold text-indigo-900">
                                {course?.title || session?.sessionName}
                              </div>
                              <div className="text-xs text-indigo-700 mt-1">
                                {timeDisplay}
                              </div>
                              <div className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                                <MapPin className="w-3 h-3" />{" "}
                                {(
                                  l.classroom ||
                                  session?.room ||
                                  session?.classroom ||
                                  session?.deliveryMode ||
                                  "Room TBC"
                                ).replace(/\s*\(Persons:.*?\)/gi, "")}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {tutorSessions.length > 0 && (
                      <div>
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                          Active Assigned Intakes Spanning This Date
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {tutorSessions
                            .sort((a, b) =>
                              (a.startDate || "").localeCompare(
                                b.startDate || "",
                              ),
                            )
                            .map((s) => {
                              const course = courses.find(
                                (c) => c.id === s.courseId,
                              );
                              return (
                                <div
                                  key={s.id}
                                  className="p-3 border border-slate-200 bg-slate-50/50 rounded flex flex-col justify-center"
                                >
                                  <div className="font-bold text-slate-700 text-xs mb-1">
                                    {course?.title || s.sessionName}
                                  </div>
                                  <div className="text-[10px] text-slate-500 font-medium">
                                    Duration: {s.startDate} to {s.endDate}
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {tutors.filter((tutor) => {
                const tidHasLessons = lessons.some((l) => {
                  const session = sessions.find(
                    (s) => s.id === l.sessionId || s.id === l.session_id,
                  );
                  const tid =
                    l.tutorId ||
                    l.tutor_id ||
                    session?.tutorId ||
                    session?.tutor_id;
                  const date = l.lessonDate || l.lesson_date || "";
                  return tid === tutor.id && date === scheduleDate;
                });
                const tidHasSessions = sessions.some((s) => {
                  if (s.sessionStatus === "cancelled") return false;
                  const tid = s.tutorId || s.tutor_id;
                  if (tid !== tutor.id) return false;
                  return (
                    s.startDate &&
                    s.endDate &&
                    s.startDate <= scheduleDate &&
                    s.endDate >= scheduleDate
                  );
                });
                return tidHasLessons || tidHasSessions;
              }).length === 0 && (
                <div className="py-12 text-center text-slate-400 text-sm italic tracking-wide">
                  No classes or assigned intakes scheduled for {scheduleDate}.
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* TRAINER MONTHLY */}
      {scheduleTab === "trainer-monthly" && (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <CardTitle>Instructor Monthly Overview</CardTitle>
              <CardDescription>
                View a specific trainer's month at a glance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white"
                value={scheduleInstructorFilter}
                onChange={(e) => setScheduleInstructorFilter(e.target.value)}
              >
                <option value="">All Instructors</option>
                {tutors.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Input
                type="month"
                className="w-auto h-9 text-xs"
                value={scheduleMonth}
                onChange={(e) => setScheduleMonth(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(() => {
              const overlappingSessions = sessions.filter((s) => {
                if (
                  s.sessionStatus !== "confirmed" &&
                  s.sessionStatus !== "full" &&
                  s.sessionStatus !== "completed"
                )
                  return false;
                const tid = s.tutorId || s.tutor_id;
                if (
                  scheduleInstructorFilter &&
                  tid !== scheduleInstructorFilter
                )
                  return false;
                if (!s.startDate || !s.endDate) return false;
                return (
                  s.startDate.startsWith(scheduleMonth) ||
                  s.endDate.startsWith(scheduleMonth) ||
                  (s.startDate < scheduleMonth && s.endDate > scheduleMonth)
                );
              });

              return (
                <div className="mt-6">
                  {(() => {
                    const groupedByInstructor: Record<string, any[]> = {};
                    overlappingSessions.forEach((s) => {
                      const tid = s.tutorId || s.tutor_id || "unassigned";
                      if (!groupedByInstructor[tid])
                        groupedByInstructor[tid] = [];
                      groupedByInstructor[tid].push(s);
                    });

                    const instructorKeys = Object.keys(
                      groupedByInstructor,
                    ).sort((a, b) => {
                      if (a === "unassigned") return 1;
                      if (b === "unassigned") return -1;
                      const tA = tutors.find((t) => t.id === a)?.name || "";
                      const tB = tutors.find((t) => t.id === b)?.name || "";
                      return tA.localeCompare(tB);
                    });

                    if (instructorKeys.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400 text-sm italic">
                          No active intakes for this month.
                        </div>
                      );
                    }

                    return instructorKeys.map((tid) => {
                      const instructorName =
                        tid === "unassigned"
                          ? "Unassigned Instructor"
                          : tutors.find((t) => t.id === tid)?.name || "Unknown";
                      const sessionsForTid = groupedByInstructor[tid].sort(
                        (a, b) =>
                          (a.startDate || "").localeCompare(b.startDate || ""),
                      );

                      return (
                        <div key={tid} className="mb-8">
                          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <Users className="w-4 h-4 text-indigo-500" />{" "}
                            {instructorName} - Active Intakes
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sessionsForTid.map((s) => {
                              const course = courses.find(
                                (c) => c.id === s.courseId,
                              );
                              return (
                                <div
                                  key={s.id}
                                  className="p-3 border border-indigo-100 bg-indigo-50/30 rounded-lg flex flex-col justify-center"
                                >
                                  <div className="font-bold text-indigo-900 text-sm mb-1">
                                    {course?.title || s.sessionName}
                                  </div>
                                  <div className="text-[11px] text-indigo-600 font-medium mb-1">
                                    Duration: {s.startDate} to {s.endDate}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}

      {/* ROOM DAILY */}
      {scheduleTab === "room-daily" && (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <CardTitle>Room Daily Schedule</CardTitle>
              <CardDescription>
                View all training spaces for a specific day
              </CardDescription>
            </div>
            <Input
              type="date"
              className="w-auto h-9 text-xs"
              value={scheduleDate}
              onChange={(e) => setScheduleDate(e.target.value)}
            />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {(() => {
                let configRooms = schoolInfo?.rooms
                  ? schoolInfo.rooms
                      .split(",")
                      .map((r: string) => r.trim())
                      .filter(Boolean)
                  : [];
                const usedRooms = lessons
                  .map((l) => {
                    const session = sessions.find(
                      (s) => s.id === l.sessionId || s.id === l.session_id,
                    );
                    return l.classroom || session?.room || session?.classroom;
                  })
                  .filter(Boolean);
                let availableRooms = Array.from(
                  new Set([...configRooms, ...usedRooms]),
                ) as string[];

                if (availableRooms.length === 0)
                  availableRooms = [
                    "Training Room 1",
                    "Training Room 2",
                    "Training Room 3",
                    "Training Room 4",
                  ];

                return availableRooms.map((roomName) => {
                  const roomLessons = lessons.filter((l) => {
                    const session = sessions.find(
                      (s) => s.id === l.sessionId || s.id === l.session_id,
                    );
                    const r =
                      l.classroom || session?.room || session?.classroom;
                    const date = l.lessonDate || l.lesson_date || "";
                    return r === roomName && date === scheduleDate;
                  });

                  const roomSessions = sessions.filter((s) => {
                    if (
                      s.sessionStatus !== "confirmed" &&
                      s.sessionStatus !== "full" &&
                      s.sessionStatus !== "completed"
                    )
                      return false;
                    const r = s.room || s.classroom || s.deliveryMode;
                    if (r !== roomName) return false;
                    if (!s.startDate || !s.endDate) return false;
                    return (
                      s.startDate <= scheduleDate && s.endDate >= scheduleDate
                    );
                  });

                  return (
                    <div
                      key={roomName}
                      className="p-4 bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      <h3 className="font-black text-slate-800 mb-4 inline-flex px-3 py-1 bg-white border border-slate-200 rounded-md shadow-sm items-center gap-2">
                        <Building2 className="w-4 h-4 text-emerald-600" />{" "}
                        {roomName}
                      </h3>
                      <div className="space-y-4 text-sm">
                        {roomLessons.length === 0 &&
                          roomSessions.length === 0 && (
                            <div className="p-4 text-center text-slate-400 text-xs italic uppercase tracking-wider">
                              Available (No Bookings)
                            </div>
                          )}

                        {roomLessons.length > 0 && (
                          <div className="space-y-2">
                            {roomLessons.map((l) => {
                              const session = sessions.find(
                                (s) =>
                                  s.id === l.sessionId || s.id === l.session_id,
                              );
                              const course = courses.find(
                                (c) => c.id === session?.courseId,
                              );
                              const displayStartTime = l.startTime
                                ? l.startTime
                                : session?.startTime;
                              const displayEndTime = l.endTime
                                ? l.endTime
                                : session?.endTime;
                              const timeDisplay =
                                displayStartTime && displayEndTime
                                  ? `${displayStartTime} - ${displayEndTime}`
                                  : "Time TBC";
                              const tid =
                                l.tutorId ||
                                l.tutor_id ||
                                session?.tutorId ||
                                session?.tutor_id;
                              const tutor = tutors.find((t) => t.id === tid);
                              return (
                                <div
                                  key={l.id}
                                  className="p-3 bg-white border-l-4 border-emerald-500 rounded shadow-sm"
                                >
                                  <div className="font-bold text-slate-800">
                                    {timeDisplay}
                                  </div>
                                  <div className="text-emerald-700 font-medium">
                                    {course?.title || session?.sessionName}
                                  </div>
                                  <div className="text-xs text-slate-500 mt-1">
                                    Instructor:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {tutor?.name || "Unassigned"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}

                        {roomSessions.length > 0 && (
                          <div>
                            <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                              Active Course Intakes Spanning This Date
                            </h4>
                            <div className="space-y-2">
                              {roomSessions
                                .sort((a, b) =>
                                  (a.startDate || "").localeCompare(
                                    b.startDate || "",
                                  ),
                                )
                                .map((s) => {
                                  const course = courses.find(
                                    (c) => c.id === s.courseId,
                                  );
                                  const tutor = tutors.find(
                                    (t) => t.id === (s.tutorId || s.tutor_id),
                                  );
                                  return (
                                    <div
                                      key={s.id}
                                      className="p-2 border border-slate-200 bg-white shadow-sm rounded flex flex-col justify-center"
                                    >
                                      <div className="font-bold text-slate-700 text-xs mb-1">
                                        {course?.title || s.sessionName}
                                      </div>
                                      <div className="text-[10px] text-slate-500 font-medium mb-1">
                                        Duration: {s.startDate} to {s.endDate}
                                      </div>
                                      <div className="text-[10px] text-slate-500">
                                        Instructor:{" "}
                                        <span className="font-semibold text-slate-700">
                                          {tutor?.name || "Unassigned"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ROOM MONTHLY */}
      {scheduleTab === "room-monthly" && (
        <Card className="border-none shadow-xl shadow-slate-200/50 bg-white/80 backdrop-blur-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2 border-b border-slate-50">
            <div>
              <CardTitle>Room Monthly Overview</CardTitle>
              <CardDescription>
                View a specific training space's month at a glance
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                className="h-9 px-3 border border-slate-200 rounded text-sm outline-none bg-white"
                value={scheduleRoomFilter}
                onChange={(e) => setScheduleRoomFilter(e.target.value)}
              >
                <option value="">All Rooms</option>
                {(() => {
                  let configRooms = schoolInfo?.rooms
                    ? schoolInfo.rooms
                        .split(",")
                        .map((r: string) => r.trim())
                        .filter(Boolean)
                    : [];
                  const usedRooms = lessons
                    .map((l) => {
                      const session = sessions.find(
                        (s) => s.id === l.sessionId || s.id === l.session_id,
                      );
                      return l.classroom || session?.room || session?.classroom;
                    })
                    .filter(Boolean);
                  let availableRooms = Array.from(
                    new Set([...configRooms, ...usedRooms]),
                  ) as string[];
                  if (availableRooms.length === 0)
                    availableRooms = [
                      "Training Room 1",
                      "Training Room 2",
                      "Training Room 3",
                      "Training Room 4",
                    ];
                  return availableRooms.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ));
                })()}
              </select>
              <Input
                type="month"
                className="w-auto h-9 text-xs"
                value={scheduleMonth}
                onChange={(e) => setScheduleMonth(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {(() => {
              const today = new Date().toISOString().split("T")[0];
              const overlappingSessions = sessions.filter((s) => {
                if (
                  s.sessionStatus !== "confirmed" &&
                  s.sessionStatus !== "full" &&
                  s.sessionStatus !== "completed"
                )
                  return false;
                if (s.endDate && s.endDate < today) return false;
                const r = s.room || s.classroom || s.deliveryMode;
                if (scheduleRoomFilter && r !== scheduleRoomFilter)
                  return false;
                if (!s.startDate || !s.endDate) return false;
                return (
                  s.startDate.startsWith(scheduleMonth) ||
                  s.endDate.startsWith(scheduleMonth) ||
                  (s.startDate < scheduleMonth && s.endDate > scheduleMonth)
                );
              });

              return (
                <div className="mt-6">
                  {(() => {
                    const groupedByRoom: Record<string, any[]> = {};
                    overlappingSessions.forEach((s) => {
                      const room =
                        s.room || s.classroom || s.deliveryMode || "unassigned";
                      if (!groupedByRoom[room]) groupedByRoom[room] = [];
                      groupedByRoom[room].push(s);
                    });

                    const roomKeys = Object.keys(groupedByRoom).sort((a, b) => {
                      if (a === "unassigned") return 1;
                      if (b === "unassigned") return -1;
                      return a.localeCompare(b);
                    });

                    if (roomKeys.length === 0) {
                      return (
                        <div className="py-8 text-center text-slate-400 text-sm italic">
                          No active intakes for this room this month.
                        </div>
                      );
                    }

                    return roomKeys.map((roomName) => {
                      const sessionsForRoom = groupedByRoom[roomName].sort(
                        (a, b) =>
                          (a.startDate || "").localeCompare(b.startDate || ""),
                      );

                      return (
                        <div key={roomName} className="mb-8">
                          <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />{" "}
                            {roomName === "unassigned"
                              ? "Unassigned Room"
                              : roomName.replace(
                                  /\s*\(Persons:.*?\)/gi,
                                  "",
                                )}{" "}
                            - Active Intakes
                          </h3>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {sessionsForRoom.map((s) => {
                              const course = courses.find(
                                (c) => c.id === s.courseId,
                              );
                              const tutor = tutors.find(
                                (t) => t.id === (s.tutorId || s.tutor_id),
                              );
                              return (
                                <div
                                  key={s.id}
                                  className="p-3 border border-emerald-100 bg-emerald-50/30 rounded-lg flex flex-col justify-center"
                                >
                                  <div className="font-bold text-emerald-900 text-sm mb-1">
                                    {course?.title || s.sessionName}
                                  </div>
                                  <div className="text-[11px] text-emerald-600 font-medium mb-1">
                                    Duration: {s.startDate} to {s.endDate}
                                  </div>
                                  <div className="text-[10px] text-slate-500 mb-1">
                                    Instructor:{" "}
                                    <span className="font-semibold text-slate-700">
                                      {tutor?.name || "Unassigned"}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              );
            })()}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
