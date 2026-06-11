import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../../../components/ui/card";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, ComposedChart
} from "recharts";
import { TrendingUp, Users, BookOpen, CircleDollarSign } from "lucide-react";
import { format, subDays, startOfMonth, isAfter, parseISO } from "date-fns";

interface AnalyticsTabProps {
  regs: any[];
  courses: any[];
  sessions: any[];
  allUsers: any[];
}

export function AnalyticsTab({ regs, courses, sessions, allUsers }: AnalyticsTabProps) {
  // 1. KPIs Calculations
  const now = new Date();
  const startOfThisMonth = startOfMonth(now);
  
  const thisMonthRegs = regs.filter((r) => {
    if (!r.createdAt) return false;
    const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
    if (isNaN(d.getTime())) return false;
    return isAfter(d, startOfThisMonth);
  });
  
  const verifiedThisMonth = thisMonthRegs.filter(r => r.status === "verified");
  const thisMonthRevenue = verifiedThisMonth.reduce((acc, r) => acc + (r.amount || 0), 0);
  
  const activeSessions = sessions.filter(s => s.sessionStatus === "confirmed" || s.sessionStatus === "full");

  // 2. Daily Registrations Trend (Last 30 days)
  const dailyData = useMemo(() => {
    const data: Record<string, number> = {};
    for (let i = 29; i >= 0; i--) {
      const date = format(subDays(now, i), "MMM dd");
      data[date] = 0;
    }
    
    regs.forEach(r => {
      if (!r.createdAt) return;
      const d = r.createdAt?.toDate ? r.createdAt.toDate() : new Date(r.createdAt);
      if (isNaN(d.getTime())) return;
      
      if (d > subDays(now, 30)) {
        const dateStr = format(d, "MMM dd");
        if (data[dateStr] !== undefined) {
          data[dateStr]++;
        }
      }
    });
    
    return Object.keys(data).map(key => ({
      date: key,
      registrations: data[key]
    }));
  }, [regs, now]);

  // 3. Top Popular Courses (Enrollments vs Revenue)
  const courseStats = useMemo(() => {
    const stats: Record<string, { name: string; enrollments: number; revenue: number }> = {};
    
    regs.forEach(r => {
      const cRef = courses.find((c) => c.id === r.courseId)?.title || r.courseId?.slice(0, 8);
      if (!cRef) return;
      
      if (!stats[cRef]) {
        stats[cRef] = { name: cRef, enrollments: 0, revenue: 0 };
      }
      stats[cRef].enrollments += 1;
      if (r.status === "verified") {
        stats[cRef].revenue += (r.amount || 0);
      }
    });
    
    // Sort by enrollments descending, take top 10
    return Object.values(stats)
      .sort((a, b) => b.enrollments - a.enrollments)
      .slice(0, 10);
  }, [regs, courses]);

  // 4. Course Category Distribution
  const categoryData = useMemo(() => {
    const stats: Record<string, number> = {};
    courses.forEach(c => {
      const cat = c.category || "Uncategorized";
      stats[cat] = (stats[cat] || 0) + 1;
    });
    
    return Object.keys(stats).map(key => ({
      name: key,
      value: stats[key]
    }));
  }, [courses]);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f43f5e'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight font-sans">Management Insights</h2>
          <p className="text-sm text-slate-500">Overview of platform performance, top courses, and operational metrics</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-slate-200 shadow-sm bg-blue-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-blue-700 uppercase">This Month Regs</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-blue-900">{thisMonthRegs.length}</div>
            <p className="text-[10px] text-blue-600 font-bold uppercase mt-1">Registrations</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-emerald-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-emerald-700 uppercase">This Month Revenue</CardTitle>
            <CircleDollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-emerald-900">${thisMonthRevenue.toLocaleString()}</div>
            <p className="text-[10px] text-emerald-600 font-bold uppercase mt-1">Verified Income</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm bg-amber-50/50">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-bold text-amber-700 uppercase">Live Intakes Courses</CardTitle>
            <BookOpen className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-amber-900">{activeSessions.length}</div>
            <p className="text-[10px] text-amber-600 font-bold uppercase mt-1">Confirmed Courses</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Courses Chart */}
        <Card className="lg:col-span-2 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Top 10 Courses</CardTitle>
            <CardDescription>Comparison of Enrollments vs. Revenue</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {courseStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={courseStats} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" tick={{ fontSize: 10 }} />
                  <YAxis yAxisId="right" orientation="right" stroke="#10b981" tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                    formatter={(value: number, name: string) => {
                      if (name === "Revenue ($)") return [`$${value.toLocaleString()}`, name];
                      return [value, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="enrollments" name="Enrollments" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue ($)" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </ComposedChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No data available</div>
            )}
          </CardContent>
        </Card>

        {/* Category Pie Chart */}
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Course Category Distribution</CardTitle>
            <CardDescription>Course Templates by Category</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-sm">No categories found</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Daily Operations Trend */}
      <Card className="border-slate-200 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm font-bold text-slate-800 uppercase tracking-widest">Daily Registrations Trend</CardTitle>
          <CardDescription>Registration volume over the last 30 days</CardDescription>
        </CardHeader>
        <CardContent className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dailyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#64748b' }} tickMargin={10} minTickGap={20} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', fontWeight: 'bold' }}
                itemStyle={{ color: '#3b82f6' }}
              />
              <Line type="monotone" dataKey="registrations" name="Registrations" stroke="#3b82f6" strokeWidth={3} dot={false} activeDot={{ r: 6, fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
