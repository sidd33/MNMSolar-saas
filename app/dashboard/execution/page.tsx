"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Layers, Truck, Activity, ClipboardCheck, Hammer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export default function ExecutionDashboard() {
  const { data, isLoading } = useDashboardNexus();

  // Stats extraction
  const stats = data?.stats || { setup: 0, logistics: 0, activeSites: 0, ready: 0 };

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
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: "Pending Liaisoning", value: stats.setup, icon: Layers, color: "blue", subtitle: "Handover to Execution" },
            { label: "Material Inward", value: stats.logistics, icon: Truck, color: "amber", subtitle: "Challans & Deliveries" },
            { label: "Active Sites", value: stats.activeSites, icon: Hammer, color: "emerald", subtitle: "Installation Progress" },
            { label: "Ready for Handover", value: stats.ready, icon: ClipboardCheck, color: "indigo", subtitle: "Net Metering/Punch Points" }
          ].map((item, i) => (
            <div key={i} className="group p-8 rounded-[2rem] border border-slate-100 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
              <div className="flex items-start justify-between mb-4 relative z-10">
                <div className={cn(
                  "h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300",
                  `bg-${item.color}-50 text-${item.color}-600 group-hover:bg-${item.color}-600 group-hover:text-white`
                )}>
                  <item.icon size={24} />
                </div>
                {isLoading && <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />}
              </div>
              <p className="font-bold uppercase tracking-widest text-[10px] mb-1 text-slate-500 relative z-10">{item.label}</p>
              {isLoading ? (
                <Skeleton className="h-10 w-16 mb-1 rounded-lg bg-slate-100" />
              ) : (
                <h3 className="text-4xl font-black text-slate-900 relative z-10">
                  {item.value}
                </h3>
              )}
              <p className="text-xs mt-2 font-medium text-slate-400 relative z-10">
                {item.subtitle}
              </p>
              <div className="absolute bottom-0 right-0 p-4 opacity-5 group-hover:scale-125 transition-transform duration-500">
                <item.icon size={80} />
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-[#1C3384] p-10 rounded-[2.5rem] shadow-xl shadow-blue-900/10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
              <Hammer size={160} />
            </div>
            <div className="relative z-10 space-y-6">
              <div>
                <h2 className="text-3xl font-black text-white uppercase tracking-tight font-[family-name:var(--font-montserrat)]">Operational Readiness</h2>
                <p className="text-blue-100/60 font-medium max-w-md">Your execution pipeline is currently handling {stats.activeSites + stats.setup + stats.logistics} active projects.</p>
              </div>
              <div className="flex gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Total Active</p>
                  <p className="text-2xl font-black text-white">{stats.activeSites + stats.setup + stats.logistics + stats.ready}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">Completion Rate</p>
                  <p className="text-2xl font-black text-white">84%</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200/60 flex flex-col justify-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#FFC800] text-[#1C3384] flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <Activity size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-900 uppercase">Ops Control Center</h3>
              <p className="text-xs text-slate-500 font-medium mt-1">Access site-specific document sync, challans, and handover punch lists via the sidebar Ops Centre link.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
