"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Layers, Truck, Activity, ClipboardCheck, Hammer, ArrowRight, PackageSearch } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function ExecutionDashboard() {
  const { data, isLoading } = useDashboardNexus();

  const stats = data?.stats || { setup: 0, activeSites: 0, ready: 0, logistics: 0 };
  const projects = data?.projects || [];
  const activity = data?.activity || [];

  // Group projects for the list
  const incomingLogistics = projects.filter((p: any) => p.stage === 'MATERIAL_PROCUREMENT');
  const pendingSetup = projects.filter((p: any) => p.stage === 'HANDOVER_TO_EXECUTION');
  const activeInstallation = projects.filter((p: any) => ['STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION'].includes(p.stage));
  const readyHandover = projects.filter((p: any) => ['NET_METERING'].includes(p.stage));

  // Calculate real completion rate
  const completedProjectsCount = readyHandover.length; // You could also include FINAL_HANDOVER if it's in the pipeline data.
  const totalProjects = pendingSetup.length + activeInstallation.length + readyHandover.length + incomingLogistics.length;
  const completionRate = totalProjects > 0 ? Math.round((completedProjectsCount / totalProjects) * 100) : 0;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* 🚀 Header: Operations Command Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2">
            Operations Intelligence
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Execution Hub
          </h1>
          <p className="text-slate-500 font-medium text-sm text-left">Real-time site management and operational analytics.</p>
        </div>
      </div>

      {/* 📊 SUMMARY VIEW: Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {[
          { label: "Incoming Logistics", value: incomingLogistics.length || 0, icon: PackageSearch, color: "orange", subtitle: "Procurement phase" },
          { label: "Pending Setup", value: pendingSetup.length || 0, icon: Layers, color: "blue", subtitle: "Awaiting start" },
          { label: "Active Sites", value: stats.activeSites || 0, icon: Hammer, color: "emerald", subtitle: "Installation" },
          { label: "Ready for Handover", value: stats.ready || 0, icon: ClipboardCheck, color: "indigo", subtitle: "Net Metering", dark: true }
        ].map((item, i) => (
          <div key={i} className={cn(
            "group p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden",
            item.dark ? "bg-[#1C3384]" : "bg-white"
          )}>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                item.dark ? "bg-white/10 text-indigo-200 group-hover:bg-indigo-500 group-hover:text-white" : `bg-${item.color}-50 text-${item.color}-600 group-hover:bg-${item.color}-600 group-hover:text-white`
              )}>
                <item.icon size={24} />
              </div>
              {isLoading && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
            </div>
            <p className={cn(
              "font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10",
              item.dark ? "text-blue-200" : "text-slate-500"
            )}>{item.label}</p>
            {isLoading ? (
               <Skeleton className={cn("h-10 w-16 mb-1 rounded-lg", item.dark ? "bg-white/5" : "bg-slate-100")} />
            ) : (
               <h3 className={cn("text-4xl font-black relative z-10", item.dark ? "text-white" : "text-slate-900")}>
                 {item.value}
               </h3>
            )}
            <p className={cn("text-xs mt-2 font-medium relative z-10", item.dark ? "text-blue-200/50" : "text-slate-400")}>
              {item.subtitle}
            </p>
            <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                <item.icon size={80} color={item.dark ? "white" : "currentColor"} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Project Lists */}
        <div className="lg:col-span-2 space-y-8">
            {/* Active Installations */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Hammer size={20} className="text-emerald-500" />
                  Active Installations
                </h2>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase">{activeInstallation.length} Sites</Badge>
              </div>
              <div className="flex-1 p-6 space-y-4">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                        <Skeleton className="h-16 w-full rounded-2xl" />
                     </div>
                 ) : activeInstallation.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <Hammer size={40} className="mx-auto mb-4" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">No active sites</p>
                    </div>
                 ) : (
                     activeInstallation.map((project: any) => (
                         <Link key={project.id} href={`/dashboard/execution/fielduploads?search=${encodeURIComponent(project.name)}`}>
                             <div className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50/30 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">{project.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-slate-100 text-slate-500 border-none px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-widest">
                                            {project.stage.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400 font-medium">{project.clientName}</span>
                                     </div>
                                 </div>
                                 <ArrowRight size={16} className="text-slate-300 group-hover:text-emerald-500 transition-colors" />
                             </div>
                         </Link>
                     ))
                 )}
              </div>
            </div>

            {/* Pending Setup */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Layers size={20} className="text-blue-500" />
                  Pending Setup
                </h2>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase">{pendingSetup.length} Sites</Badge>
              </div>
              <div className="flex-1 p-6 space-y-4">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                     </div>
                 ) : pendingSetup.length === 0 ? (
                    <div className="text-center py-6 opacity-40">
                        <p className="font-bold uppercase tracking-widest text-[10px]">No pending setup</p>
                    </div>
                 ) : (
                     pendingSetup.map((project: any) => (
                         <Link key={project.id} href={`/dashboard/execution/fielduploads?search=${encodeURIComponent(project.name)}`}>
                             <div className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer">
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{project.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-slate-100 text-slate-500 border-none px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-widest">
                                            {project.stage.replace(/_/g, ' ')}
                                        </Badge>
                                     </div>
                                 </div>
                                 <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                             </div>
                         </Link>
                     ))
                 )}
              </div>
            </div>
            {/* Incoming Logistics (View Only) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col opacity-80">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <PackageSearch size={20} className="text-orange-500" />
                  Incoming Logistics (Procurement Phase)
                </h2>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase">{incomingLogistics.length} Sites</Badge>
              </div>
              <div className="flex-1 p-6 space-y-4">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                     </div>
                 ) : incomingLogistics.length === 0 ? (
                    <div className="text-center py-6 opacity-40">
                        <p className="font-bold uppercase tracking-widest text-[10px]">No incoming logistics</p>
                    </div>
                 ) : (
                     incomingLogistics.map((project: any) => (
                         <div key={project.id} className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 transition-all cursor-default opacity-70">
                             <div>
                                 <h4 className="font-bold text-slate-800">{project.name}</h4>
                                 <div className="flex items-center gap-2 mt-1">
                                    <Badge className="bg-slate-100 text-slate-500 border-none px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-widest">
                                        MATERIAL PROCUREMENT
                                    </Badge>
                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest">VIEW ONLY (Procurement Owns)</span>
                                 </div>
                             </div>
                         </div>
                     ))
                 )}
              </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            {/* Readiness Banner */}
            <div className="bg-[#1C3384] p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                    <Activity size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight font-[family-name:var(--font-montserrat)]">Ops Control</h2>
                        <p className="text-blue-100/60 font-medium text-sm mt-1">Overall execution rate</p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Scope</p>
                            <p className="text-2xl font-black text-white">{totalProjects}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5 flex-1">
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Completion</p>
                            <p className="text-2xl font-black text-white">{completionRate}%</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Truck size={18} className="text-slate-400" />
                  Recent Handoffs
                </h2>
              </div>
              <div className="flex-1 p-6 space-y-6">
                {isLoading ? (
                   Array(3).fill(0).map((_, i) => (
                     <div key={i} className="flex gap-4 items-center animate-pulse">
                        <div className="h-10 w-10 rounded-xl bg-slate-100 shrink-0" />
                        <div className="space-y-2 w-full">
                           <Skeleton className="h-4 w-1/2" />
                           <Skeleton className="h-2 w-1/3" />
                        </div>
                     </div>
                   ))
                ) : activity.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 text-center opacity-30">
                        <p className="font-bold uppercase tracking-widest text-[10px]">No recent activity</p>
                    </div>
                ) : (
                    activity.map((act: any) => (
                        <div key={act.id} className="flex gap-4 group text-wrap">
                            <div className="relative">
                                <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-slate-50 text-slate-400 group-hover:bg-[#1C3384] group-hover:text-white transition-all">
                                    <Activity size={18} />
                                </div>
                            </div>
                            <div className="flex-1 space-y-0.5">
                                <div className="flex items-center justify-between gap-2 overflow-hidden">
                                    <h4 className="text-sm font-bold text-slate-800 truncate">{act.project?.name}</h4>
                                    <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                        {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none px-1.5 py-0 rounded text-[9px] font-bold">
                                        {act.toStage.replace(/_/g, ' ')}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    ))
                )}
              </div>
            </div>
        </div>

      </div>
    </div>
  );
}
