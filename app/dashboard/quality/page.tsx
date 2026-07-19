"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { ShieldAlert, MapPin, ArrowRight, Activity, ShieldCheck, Camera } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

export default function QualityDashboard() {
  const { data, isLoading } = useDashboardNexus();
  const projects = data?.projects || [];

  // Parse snags for all projects
  const projectsWithSnags = projects.map((p: any) => {
      const metadata = p.executionMetadata || {};
      let snags = [];
      if (Array.isArray(metadata.snags)) snags = metadata.snags;
      else if (metadata.snags?.records) snags = metadata.snags.records;
      else if (typeof metadata.snags === 'object') snags = Object.values(metadata.snags);
      
      const openSnags = snags.filter((s: any) => s && s.id && s.status === "OPEN").length;
      const totalSnags = snags.filter((s: any) => s && s.id).length;
      return { ...p, openSnags, totalSnags };
  });

  const sitesWithOpenSnags = projectsWithSnags.filter((p: any) => p.openSnags > 0);
  const totalOpenSnags = sitesWithOpenSnags.reduce((acc: number, p: any) => acc + p.openSnags, 0);
  
  // Sites under active installation that we should probably audit
  const activeInstallations = projectsWithSnags.filter((p: any) => 
      ['STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION'].includes(p.stage)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* 🚀 Header: Quality Command Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2 border border-red-200">
            QA/QC Intelligence
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase flex items-center gap-4">
            Quality Command <ShieldAlert size={36} className="text-red-500" />
          </h1>
          <p className="text-slate-500 font-medium text-sm text-left">Central hub for tracking punch points, execution defects, and verification.</p>
        </div>
      </div>

      {/* 📊 SUMMARY VIEW: Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="group p-8 rounded-[2rem] border border-red-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-red-500">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300 bg-white/10 text-red-100 group-hover:bg-white/20 group-hover:text-white">
                <ShieldAlert size={24} />
              </div>
              {isLoading && <div className="h-2 w-2 rounded-full bg-red-300 animate-pulse" />}
            </div>
            <p className="font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10 text-red-200">
               Open Punch Points
            </p>
            {isLoading ? (
               <Skeleton className="h-10 w-16 mb-1 rounded-lg bg-white/20" />
            ) : (
               <h3 className="text-5xl font-black relative z-10 text-white">
                 {totalOpenSnags}
               </h3>
            )}
            <p className="text-xs mt-2 font-medium relative z-10 text-red-100/60">
              Across {sitesWithOpenSnags.length} active sites
            </p>
            <div className="absolute -bottom-4 -right-4 p-4 opacity-10 group-hover:scale-125 transition-transform duration-500">
                <ShieldAlert size={120} color="white" />
            </div>
        </div>

        <div className="group p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300 bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white">
                <Activity size={24} />
              </div>
            </div>
            <p className="font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10 text-slate-500">
               Sites to Audit
            </p>
            {isLoading ? (
               <Skeleton className="h-10 w-16 mb-1 rounded-lg bg-slate-100" />
            ) : (
               <h3 className="text-4xl font-black relative z-10 text-slate-900">
                 {activeInstallations.length}
               </h3>
            )}
            <p className="text-xs mt-2 font-medium relative z-10 text-slate-400">
              Active Installation phase
            </p>
        </div>

        <div className="group p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden bg-white">
            <div className="flex items-start justify-between mb-4 relative z-10">
              <div className="h-12 w-12 rounded-2xl flex items-center justify-center transition-colors duration-300 bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white">
                <ShieldCheck size={24} />
              </div>
            </div>
            <p className="font-bold uppercase tracking-widest text-[10px] mb-1 relative z-10 text-slate-500">
               Total Snags Tracked
            </p>
            {isLoading ? (
               <Skeleton className="h-10 w-16 mb-1 rounded-lg bg-slate-100" />
            ) : (
               <h3 className="text-4xl font-black relative z-10 text-slate-900">
                 {projectsWithSnags.reduce((acc: number, p: any) => acc + p.totalSnags, 0)}
               </h3>
            )}
            <p className="text-xs mt-2 font-medium relative z-10 text-slate-400">
              Historical Defect Logs
            </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">
        
        {/* Project Lists */}
        <div className="lg:col-span-2 space-y-8">
            {/* Sites with Open Snags */}
            <div className="bg-white rounded-[2rem] border border-red-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert size={20} className="text-red-500" />
                  Sites Requiring Action
                </h2>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase border-red-200 text-red-600 bg-red-50">{sitesWithOpenSnags.length} Sites</Badge>
              </div>
              <div className="flex-1 p-6 space-y-4 bg-red-50/10">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                     </div>
                 ) : sitesWithOpenSnags.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <ShieldCheck size={40} className="mx-auto mb-4 text-emerald-500" />
                        <p className="font-bold uppercase tracking-widest text-[10px] text-emerald-700">Zero Open Defects</p>
                    </div>
                 ) : (
                     sitesWithOpenSnags.map((project: any) => (
                         <Link key={project.id} href={`/dashboard/quality/project?search=${encodeURIComponent(project.name)}`}>
                             <div className="group flex items-center justify-between p-4 rounded-2xl border border-red-100 hover:border-red-300 hover:bg-red-50 transition-all cursor-pointer shadow-sm hover:shadow-md bg-white">
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-red-700 transition-colors">{project.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-red-100 text-red-600 border-none px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-widest">
                                            {project.openSnags} Open Punch Point{project.openSnags > 1 ? 's' : ''}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400 font-medium">{project.clientName}</span>
                                     </div>
                                 </div>
                                 <ArrowRight size={16} className="text-slate-300 group-hover:text-red-500 transition-colors" />
                             </div>
                         </Link>
                     ))
                 )}
              </div>
            </div>

            {/* Active Installations (Audit Targets) */}
            <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Camera size={20} className="text-blue-500" />
                  Execution Workspace Directory
                </h2>
                <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase">{activeInstallations.length} Sites</Badge>
              </div>
              <div className="flex-1 p-6 space-y-4">
                 {isLoading ? (
                     <div className="space-y-4">
                        <Skeleton className="h-16 w-full rounded-2xl" />
                     </div>
                 ) : activeInstallations.length === 0 ? (
                    <div className="text-center py-10 opacity-40">
                        <MapPin size={40} className="mx-auto mb-4" />
                        <p className="font-bold uppercase tracking-widest text-[10px]">No active execution sites</p>
                    </div>
                 ) : (
                     activeInstallations.map((project: any) => (
                         <Link key={project.id} href={`/dashboard/quality/project?search=${encodeURIComponent(project.name)}`}>
                             <div className="group flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all cursor-pointer shadow-sm hover:shadow-md">
                                 <div>
                                     <h4 className="font-bold text-slate-800 group-hover:text-blue-700 transition-colors">{project.name}</h4>
                                     <div className="flex items-center gap-2 mt-1">
                                        <Badge className="bg-slate-100 text-slate-500 border-none px-1.5 py-0 rounded text-[9px] font-bold uppercase tracking-widest">
                                            {project.stage.replace(/_/g, ' ')}
                                        </Badge>
                                        <span className="text-[10px] text-slate-400 font-medium">{project.clientName}</span>
                                     </div>
                                 </div>
                                 <ArrowRight size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors" />
                             </div>
                         </Link>
                     ))
                 )}
              </div>
            </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-8">
            <div className="bg-[#1C3384] p-8 rounded-[2.5rem] shadow-xl shadow-blue-900/10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                    <ShieldCheck size={120} />
                </div>
                <div className="relative z-10 space-y-6">
                    <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-tight font-[family-name:var(--font-montserrat)]">Quality Directive</h2>
                        <p className="text-blue-100/60 font-medium text-sm mt-2 leading-relaxed">
                            Your objective is to ensure 100% compliance across all active execution sites. Log defects with photo evidence and verify resolutions uploaded by the execution team.
                        </p>
                    </div>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
}
