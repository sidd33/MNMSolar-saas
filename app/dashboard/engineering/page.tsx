"use client";

import { useEngineeringNexus } from "@/components/dashboard/EngineeringNexusProvider";
import { 
  Briefcase, 
  Settings, 
  MapPin, 
  AlertTriangle, 
  ArrowUpRight, 
  Clock, 
  CheckCircle2,
  ListTodo,
  TrendingUp,
  CircleArrowRight,
  Zap,
  FolderLock,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function EngineeringDashboardPage() {
  const { data, isLoading } = useEngineeringNexus();
  const { stats, activity } = data;

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
        <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <MapPin size={24} />
            </div>
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Survey Inbox</p>
          <h3 className="text-4xl font-black text-slate-900">{stats.survey}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Waiting for preliminary checks</p>
        </div>

        <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Zap size={24} />
            </div>
            <TrendingUp size={16} className="text-blue-500" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Detailed Engg</p>
          <h3 className="text-4xl font-black text-slate-900">{stats.detailed}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Drafting SLD & Layouts</p>
        </div>

        <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
          <div className="absolute -right-4 -bottom-4 text-slate-50 opacity-50 scale-150 pointer-events-none">
            <CheckCircle2 size={100} />
          </div>
          <div className="flex items-start justify-between mb-4 relative z-10">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
              <ListTodo size={24} />
            </div>
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10">Work Order Desk</p>
          <h3 className="text-4xl font-black text-slate-900 relative z-10">{stats.workOrder}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium relative z-10">Quality check & dispatch</p>
        </div>

        <div className="group bg-[#1C3384] p-8 rounded-[2rem] shadow-lg shadow-blue-900/20 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors duration-300">
              <AlertTriangle size={24} />
            </div>
          </div>
          <p className="text-blue-200 font-bold uppercase tracking-widest text-[10px] mb-1">Bottlenecks</p>
          <h3 className="text-4xl font-black text-white">{stats.bottlenecks}</h3>
          <p className="text-xs text-blue-200/50 mt-2 font-medium">Delayed &gt;72 Hours</p>
        </div>
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
            {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                    <Clock size={40} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No recent intake found</p>
                </div>
            ) : (
                activity.map((act: any) => (
                    <div key={act.id} className="flex gap-4 group">
                        <div className="relative">
                            <div className="h-10 w-10 rounded-xl flex items-center justify-center shadow-sm bg-blue-50 text-blue-600">
                                <MapPin size={18} />
                            </div>
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1C3384] transition-colors">{act.project.name}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">
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
