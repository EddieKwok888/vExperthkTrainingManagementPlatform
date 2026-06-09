import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "../../../components/ui/card";
import { Button } from "../../../components/ui/button";
import { Users, BookOpen, Clock, CalendarIcon } from "lucide-react";
import { ReadOnlyAlert } from "./ReadOnlyAlert";

export interface OverviewTabProps {
  getPermission: (module: string) => string;
  allUsers: any[];
  courses: any[];
  sessions: any[];
  regs: any[];
}

export function OverviewTab({
  getPermission,
  allUsers,
  courses,
  sessions,
  regs,
}: OverviewTabProps) {
  const verifiedRegs = regs.filter((r) => r.status === "verified");
  const totalRev = verifiedRegs.reduce((acc, r) => acc + (r.amount || 0), 0);

  const revMap: Record<string, number> = {};
  verifiedRegs.forEach((r) => {
    const cRef =
      courses.find((c) => c.id === r.courseId)?.title ||
      r.courseId?.slice(0, 8);
    revMap[cRef] = (revMap[cRef] || 0) + (r.amount || 0);
  });
  const courseRevData = Object.keys(revMap).map((k) => ({
    name: k,
    revenue: revMap[k],
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-b shadow-none bg-slate-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase">
              Users
            </CardTitle>
            <Users className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {allUsers.length}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Total registered users
            </p>
          </CardContent>
        </Card>

        <Card className="border-b shadow-none bg-slate-50/50">
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

        <Card className="border-b shadow-none bg-slate-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase">
              Live Intakes
            </CardTitle>
            <CalendarIcon className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800 tracking-tight">
              {sessions.length}
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
              Active class instances
            </p>
          </CardContent>
        </Card>

        <Card className="border-b shadow-none bg-emerald-50 border-emerald-100">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-emerald-700 uppercase">
              Gross Revenue
            </CardTitle>
            <span className="h-5 w-5 bg-emerald-200 text-emerald-800 rounded-full flex items-center justify-center font-bold text-xs">
              $
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-800 tracking-tight">
              ${totalRev.toLocaleString()}
            </div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">
              Verified enrollments
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 uppercase">
              Recent Activity Console
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-center justify-center bg-slate-50 border-t border-slate-100 font-mono text-xs text-slate-400">
            (Telemetry data simulation)
          </CardContent>
        </Card>

        <Card className="shadow-none border-slate-200">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 uppercase">
              Enrollment Revenue Chart
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64 flex items-end justify-center bg-slate-50 border-t border-slate-100 pb-4 px-4 gap-2">
            {courseRevData.length > 0 ? (
              courseRevData.slice(0, 6).map((c, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center flex-1 h-full justify-end gap-2 group"
                >
                  <div
                    className="w-full bg-emerald-500 rounded-t-sm transition-all duration-500 group-hover:bg-emerald-400 relative"
                    style={{
                      height: `${Math.max(10, (c.revenue / totalRev) * 100)}%`,
                    }}
                  >
                    <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      ${(c.revenue || 0).toLocaleString()}
                    </span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-500 transform -rotate-45 origin-top-left -ml-2 whitespace-nowrap overflow-hidden text-ellipsis w-16">
                    {c.name}
                  </span>
                </div>
              ))
            ) : (
              <div className="font-mono text-xs text-slate-400 h-full flex items-center">
                (No revenue tracking)
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
