"use client";

import { usePipelineNexus, useAuditNexus } from "./DashboardNexusProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { AlertTriangle, Users, Activity, Zap, PieChart, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { MasterPipeline } from "./MasterPipeline";

export function OwnerDashboardContent() {
  const { projects, stats: nexusStats, isLoading: isPipelineLoading, role, department } = usePipelineNexus();
  const { auditLogs, isLoading: isAuditLoading } = useAuditNexus();
  
  const isLoading = isPipelineLoading || isAuditLoading;
  const bottlenecks = projects.filter((p: any) => p.isBottlenecked);
  const workload = nexusStats?.workload || {};

  const stats = [
    { 
      label: "Total Projects", 
      value: projects.length, 
      icon: Activity, 
      color: "text-[#1A365D]", 
      bg: "bg-blue-50",
    },
    { 
      label: "Critical Bottlenecks", 
      value: bottlenecks.length, 
      icon: AlertTriangle, 
      color: "text-red-500", 
      bg: "bg-red-50",
    },
    { 
      label: "Active Departments", 
      value: Object.values(workload).filter(v => (v as number) > 0).length, 
      icon: Users, 
      color: "text-indigo-500", 
      bg: "bg-indigo-50",
    },
    { 
      label: "Operational Velocity", 
      value: "94%", 
      icon: Zap, 
      color: "text-amber-500", 
      bg: "bg-amber-50",
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-6 pb-20">
      {/* Main Content Area */}
      <div className="col-span-12 lg:col-span-8 space-y-8">
        {/* Metrics Row */}
        <div className="space-y-6">
           <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, i) => (
              <Card key={i} className="border-none shadow-sm bg-white rounded-3xl overflow-hidden group hover:shadow-md transition-all">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <div className={cn(stat.bg, stat.color, "p-2.5 rounded-2xl shadow-sm transition-transform group-hover:scale-110")}>
                    <stat.icon className="h-4 w-4" strokeWidth={3} />
                  </div>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-8 w-12 rounded-lg" />
                      <Skeleton className="h-3 w-20 rounded-md" />
                    </div>
                  ) : (
                    <>
                      <div className="text-3xl font-black text-[#0F172A] tracking-tighter">{stat.value}</div>
                      <p className="text-[10px] uppercase font-black tracking-widest text-[#64748B] mt-1">{stat.label}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Master Pipeline View */}
        <MasterPipeline />
      </div>

      {/* Sidebar Right */}
      <div className="col-span-12 lg:col-span-4 space-y-8 sticky top-24 self-start max-h-[calc(100vh-120px)] overflow-y-auto scrollbar-none pr-1">
        {/* Departmental Heatmap */}
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl">
                    <PieChart size={18} strokeWidth={3} />
                  </div>
                  <CardTitle className="text-sm font-black text-[#2D3748] uppercase tracking-tighter font-[family-name:var(--font-montserrat)]">Departmental Load</CardTitle>
                </div>
             </div>
          </CardHeader>
          <CardContent className="space-y-5 px-8 pb-8">
             {isLoading ? (
                Array(4).fill(0).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex justify-between">
                       <Skeleton className="h-3 w-16" />
                       <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))
             ) : (
               Object.entries(workload).map(([dept, count]: any) => (
                 <div key={dept} className="space-y-2 group">
                   <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                     <span className="group-hover:text-indigo-600 transition-colors uppercase">{dept}</span>
                     <span className="text-[#0F172A] bg-slate-50 px-2 py-0.5 rounded-full lowercase">{count} Projects</span>
                   </div>
                   <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-700 ease-in-out",
                          dept === "ENGINEERING" ? "bg-[#1C3384]" : 
                          dept === "SALES" ? "bg-[#FFC800]" : 
                          dept === "EXECUTION" ? "bg-[#3B82F6]" : "bg-slate-400"
                        )} 
                        style={{ width: `${(count / (projects.length || 1)) * 100}%` }} 
                      />
                   </div>
                 </div>
               ))
             )}
          </CardContent>
        </Card>

        {/* Activity Log */}
        <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
          <CardHeader className="pb-4 pt-8 px-8">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-emerald-50 text-emerald-600 p-2.5 rounded-2xl">
                    <Activity size={18} strokeWidth={3} />
                  </div>
                  <CardTitle className="text-sm font-black text-[#2D3748] uppercase tracking-tighter font-[family-name:var(--font-montserrat)]">Live Activity Log</CardTitle>
                </div>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-none text-[9px] font-bold uppercase py-0 px-2">Real-Time</Badge>
             </div>
          </CardHeader>
          <CardContent className="px-8 pb-8">
             <div className="space-y-8 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-slate-50">
                {isLoading ? (
                  Array(5).fill(0).map((_, i) => (
                    <div key={i} className="relative pl-8">
                       <Skeleton className="absolute left-0 top-1 w-4 h-4 rounded-full" />
                       <div className="space-y-2">
                          <Skeleton className="h-3 w-full" />
                          <Skeleton className="h-2 w-24" />
                       </div>
                    </div>
                  ))
                ) : auditLogs.length === 0 ? (
                   <div className="text-center py-10 opacity-20">
                      <Clock size={32} className="mx-auto mb-2" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No activity recorded</p>
                   </div>
                ) : (
                  auditLogs.slice(0, 8).map((log: any) => (
                    <div key={log.id} className="relative pl-8 group">
                       <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full border-4 border-white bg-[#0F172A] shadow-sm z-10 group-hover:scale-125 transition-transform" />
                       <p className="text-xs leading-relaxed text-[#64748B]">
                          <span className="font-black text-[#0F172A] uppercase tracking-tighter">{log.user?.email?.split('@')[0] || "System"}</span>
                          <span className="mx-1.5 text-[#64748B]">performed</span>
                          <span className="font-bold text-[#0F172A]">{log.action?.replace(/_/g, ' ') || "Update"}</span>
                          <span className="mx-1 text-[#64748B]">to</span>
                          <span className="font-black text-[#1C3384] uppercase tracking-tighter">{log.newValue || "SITE_SURVEY"}</span>
                       </p>
                       <div className="flex items-center gap-2 mt-1.5">
                          <span className="text-[9px] font-black text-[#4A5568] uppercase tracking-[0.1em] bg-slate-50 px-1.5 py-0.5 rounded italic">{log.task?.project?.name || log.project?.name || "System Update"}</span>
                          <span className="text-[9px] text-slate-300 font-medium">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>
                       </div>
                    </div>
                  ))
                )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
