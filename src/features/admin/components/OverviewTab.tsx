import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { 
  Users, BookOpen, CalendarIcon, AlertCircle, Clock, 
  CreditCard, TrendingUp, AlertTriangle, ArrowRight
} from "lucide-react";
import { ReadOnlyAlert } from "./ReadOnlyAlert";
import { addDays, isWithinInterval, startOfDay, parseISO } from "date-fns";

export interface OverviewTabProps {
  getPermission: (module: string) => string;
  allUsers: any[];
  courses: any[];
  sessions: any[];
  regs: any[];
  onNavigateToSession: (sessionId: string) => void;
}

export function OverviewTab({
  getPermission,
  allUsers,
  courses,
  sessions,
  regs,
  onNavigateToSession,
}: OverviewTabProps) {

  const today = startOfDay(new Date());
  const next7Days = addDays(today, 7);
  const next14Days = addDays(today, 14);

  // 1. Pending Payments
  const pendingRegs = useMemo(() => {
    return regs.filter(r => r.status === "pending" || r.status === "processing" || r.status === "submitted");
  }, [regs]);

  // 2. Pre-calculate enrollments for each session
  const sessionStats = useMemo(() => {
    return sessions.map(s => {
      const enrolledCount = regs.filter(r => r.sessionId === s.id && r.status === "verified").length;
      const quota = parseInt(s.quota) || 20;
      const course = courses.find(c => c.id === s.courseId);
      return { 
        ...s, 
        enrolledCount, 
        quota, 
        courseTitle: course?.title || s.sessionName || "Unknown Course",
        courseCode: course?.courseCode || "" 
      };
    });
  }, [sessions, regs, courses]);

  // 3. Upcoming Classes (Next 7 Days)
  const upcomingClasses = useMemo(() => {
    return sessionStats.filter(s => {
      if (s.sessionStatus === "completed" || s.sessionStatus === "cancelled") return false;
      if (!s.startDate) return false;
      const d = parseISO(s.startDate);
      if (isNaN(d.getTime())) return false;
      return d > today && d <= next7Days;
    }).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  }, [sessionStats, today, next7Days]);

  // 4. Low Enrollment (Next 14 Days, < 50% capacity)
  const lowEnrollmentAlerts = useMemo(() => {
    return sessionStats.filter(s => {
      if (s.sessionStatus === "completed" || s.sessionStatus === "cancelled") return false;
      if (!s.startDate) return false;
      const d = parseISO(s.startDate);
      if (isNaN(d.getTime())) return false;
      const isWithin14 = d >= today && d <= next14Days;
      const isLow = s.enrolledCount < (s.quota * 0.5);
      return isWithin14 && isLow && s.sessionStatus !== "full";
    }).sort((a, b) => parseISO(a.startDate).getTime() - parseISO(b.startDate).getTime());
  }, [sessionStats, today, next14Days]);

  // 5. Nearly Full (1-2 spots left)
  const nearlyFullAlerts = useMemo(() => {
    return sessionStats.filter(s => {
      if (s.sessionStatus === "completed" || s.sessionStatus === "cancelled" || s.sessionStatus === "full") return false;
      const remaining = s.quota - s.enrolledCount;
      return remaining > 0 && remaining <= 2;
    });
  }, [sessionStats]);

  const activeConfirmedSessions = sessions.filter(s => s.sessionStatus === "confirmed" || s.sessionStatus === "full");

  return (
    <div className="space-y-6">
      
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

        <Card className="border border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase">
              Course Base
            </CardTitle>
            <BookOpen className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {courses.length}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Course templates available
            </p>
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm bg-white hover:border-slate-300 transition-colors">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase">
              Live Intakes Courses
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {activeConfirmedSessions.length}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Confirmed Courses
            </p>
          </CardContent>
        </Card>

        {/* New KPI: Pending Payments */}
        <Card className="border border-rose-200 shadow-sm bg-rose-50/30">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-rose-600 uppercase">
              Pending Actions
            </CardTitle>
            <CreditCard className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-rose-700 tracking-tight">
              {pendingRegs.length}
            </div>
            <p className="text-[10px] text-rose-500 font-bold uppercase mt-1">
              Awaiting Verification
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Upcoming Classes */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <CardTitle className="text-base font-bold text-slate-800">Next 7 Days</CardTitle>
            </div>
            <CardDescription>Courses scheduled to start within the next 7 days</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {upcomingClasses.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {upcomingClasses.map(session => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <button onClick={() => onNavigateToSession(session.id)} className="font-bold text-sm text-slate-800 hover:text-blue-600 hover:underline transition-colors block text-left">
                        {session.courseCode && <span className="font-mono text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mr-2">{session.courseCode}</span>}
                        {session.courseTitle}
                      </button>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500 font-medium">
                        <span className="flex items-center gap-1">
                          <CalendarIcon className="w-3.5 h-3.5" /> 
                          {session.startDate} {session.endDate ? `to ${session.endDate}` : ''}
                        </span>
                        <span className="bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold text-slate-600">{session.deliveryMode || "N/A"}</span>
                        <span className={`px-2 py-0.5 rounded uppercase tracking-wider text-[10px] font-bold ${
                          (session.sessionStatus === 'confirmed' || session.sessionStatus === 'full') ? 'bg-blue-100 text-blue-700' :
                          session.sessionStatus === 'cancelled' ? 'bg-rose-100 text-rose-700' :
                          session.sessionStatus === 'completed' ? 'bg-slate-200 text-slate-600' :
                          'bg-emerald-100 text-emerald-700'
                        }`}>
                          {session.sessionStatus === 'full' ? 'Confirmed' : (session.sessionStatus || 'Open')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <div className="text-sm font-black text-slate-700">
                        {session.enrolledCount} <span className="text-xs font-semibold text-slate-400">/ {session.quota}</span>
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Enrolled</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-sm flex flex-col items-center">
                <CalendarIcon className="w-8 h-8 mb-2 opacity-20" />
                No classes scheduled for the next 7 days
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Operational Alerts */}
        <div className="space-y-6">
          {/* Nearly Full Alert */}
          <Card className="border-amber-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-amber-500 to-orange-400 px-4 py-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Nearly Full</h3>
              </div>
            </div>
            <CardContent className="p-0 bg-amber-50/30">
              {nearlyFullAlerts.length > 0 ? (
                <div className="divide-y divide-amber-100">
                  {nearlyFullAlerts.map(session => (
                    <div key={session.id} className="p-3.5">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                        {session.courseCode && <span className="font-mono text-[10px] text-amber-700 bg-amber-100/50 px-1 py-0.5 rounded border border-amber-200 mr-1.5">{session.courseCode}</span>}
                        {session.courseTitle}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{session.startDate} {session.endDate ? `to ${session.endDate}` : ''}</span>
                        <span className="text-[11px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded">
                          Only {session.quota - session.enrolledCount} spots left!
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-amber-600/60 text-xs font-medium">
                  No courses are nearly full right now.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Low Enrollment Alert */}
          <Card className="border-rose-200 shadow-sm overflow-hidden">
            <div className="bg-rose-50 px-4 py-3 border-b border-rose-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h3 className="text-sm font-bold text-rose-700 uppercase tracking-wider">Low Enrollment Warning</h3>
              </div>
              <p className="text-[10px] text-rose-500 mt-0.5 leading-tight">Starting in 14 days with &lt;50% capacity</p>
            </div>
            <CardContent className="p-0">
              {lowEnrollmentAlerts.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {lowEnrollmentAlerts.map(session => (
                    <div key={session.id} className="p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="text-xs font-bold text-slate-800 line-clamp-1 mb-1">
                        {session.courseCode && <span className="font-mono text-[10px] text-rose-700 bg-rose-100/50 px-1 py-0.5 rounded border border-rose-200 mr-1.5">{session.courseCode}</span>}
                        {session.courseTitle}
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">{session.startDate} {session.endDate ? `to ${session.endDate}` : ''}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] font-black text-rose-600">
                            {session.enrolledCount} / {session.quota}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 text-xs font-medium">
                  All upcoming courses have healthy enrollment! 🎉
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
