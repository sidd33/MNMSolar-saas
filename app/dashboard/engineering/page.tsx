"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Settings, MapPin, AlertTriangle, Clock, ListTodo, CircleArrowRight, Zap, FolderLock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function EngineeringDashboardPage() {
  const { data, isLoading } = useDashboardNexus();
  
  // Safe extraction from Nexus data
  const stats = data?.stats || { survey: 0, detailed: 0, workOrder: 0, bottlenecks: 0 };
  const activity = data?.activity || [];

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
            Technical Operations
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)]">
            Engineering Hub
          </h1>
          <p className="text-slate-500 font-medium">Design blueprints, monitor technical operations and dispatch layouts.</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: "Survey Inbox", value: stats.survey, icon: MapPin, color: "amber", subtitle: "Waiting for preliminary checks" },
          { label: "Detailed Engg", value: stats.detailed, icon: Zap, color: "blue", subtitle: "Drafting SLD & Layouts" },
          { label: "Work Order Desk", value: stats.workOrder, icon: ListTodo, color: "emerald", subtitle: "Quality check & dispatch" },
          { label: "Bottlenecks", value: stats.bottlenecks, icon: AlertTriangle, color: "red", subtitle: "Delayed >72 Hours", dark: true }
        ].map((item, i) => (
          <div key={i} className={cn(
            "group p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden",
            item.dark ? "bg-[#1C3384]" : "bg-white"
          )}>
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className={cn(
                "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                item.dark ? "bg-white/10 text-red-400 group-hover:bg-red-500 group-hover:text-white" : `bg-${item.color}-50 text-${item.color}-600 group-hover:bg-${item.color}-600 group-hover:text-white`
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
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Workflow Shortcuts */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Technical Assembly Line</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Link href="/dashboard/engineering/survey">
                <div className="bg-[#1C3384] p-6 rounded-3xl group hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-blue-900/10 h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 translate-x-4 -translate-y-4 text-white pointer-events-none transition-transform group-hover:scale-125">
                      <MapPin size={80} />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white mb-4 group-hover:bg-[#FFC800] group-hover:text-[#1C3384] transition-colors relative z-10">
                        <FolderLock size={20} />
                    </div>
                    <h3 className="text-white font-bold mb-1 relative z-10">Inbox: Site Survey</h3>
                    <p className="text-white/60 text-xs font-medium relative z-10">Extract Sales Handover Files & Verify Limits.</p>
                </div>
             </Link>

             <Link href="/dashboard/engineering/detailed">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 group hover:scale-[1.02] transition-all shadow-sm hover:shadow-md cursor-pointer h-full relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 translate-x-4 -translate-y-4 text-[#1C3384] pointer-events-none transition-transform group-hover:scale-125">
                      <Zap size={80} />
                    </div>
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 mb-4 group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors relative z-10">
                        <Settings size={20} />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1 relative z-10">Detailed Engg Desk</h3>
                    <p className="text-slate-500 text-xs font-medium relative z-10">Draft & Fast-Upload SLDs and Layouts.</p>
                </div>
             </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-[#1C3384]" />
              Engineering Intake Pulse
            </h2>
            <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase">Live Activity</Badge>
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
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                    <Clock size={40} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No recent intake found</p>
                </div>
            ) : (
                activity.map((act: any) => (
                    <div key={act.id} className="flex gap-4 group text-wrap">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <MapPin size={18} />
                            </div>
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between gap-2 overflow-hidden">
                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1C3384] transition-colors truncate">{act.project.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium shrink-0">
                                    {formatDistanceToNow(new Date(act.createdAt), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium italic">
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none px-1.5 py-0 rounded text-[9px] font-bold">
                                        RECEIVED
                                    </Badge>
                                    <span>From {act.fromDept.charAt(0).toUpperCase() + act.fromDept.slice(1).toLowerCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
          <Link href="/dashboard/engineering/survey" className="p-4 bg-slate-50/50 hover:bg-slate-50 text-center text-xs font-bold text-[#1C3384] flex items-center justify-center gap-2 transition-colors border-t border-slate-100">
            Open Survey Inbox
            <CircleArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// Utility function for conditional classes if not already global
function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
