"use client";

import { useParams } from "next/navigation";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { useState, useEffect } from "react";
import { HardHat, Search, Layers, Truck, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProjectDetail } from "@/lib/actions/engineering";
import { ExecutionProjectManager } from "@/components/workspace/ExecutionProjectManager";
import { ExecutionSection } from "@/components/workspace/ExecutionProjectSidebar";

export default function ExecutionStagePage() {
  const params = useParams();
  const stageSlug = params.stage as string;
  const { data } = useDashboardNexus();
  const [searchQuery, setSearchQuery] = useState("");
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());

  // Map slug to internal section ID
  const slugMap: Record<string, ExecutionSection> = {
    procurement: "PROCUREMENT",
    sitework: "SITE_WORK",
    quality: "QUALITY",
    handover: "HANDOVER",
    safety: "SAFETY"
  };

  const activeSection = slugMap[stageSlug] || "PROCUREMENT";

  // Filter projects strictly assigned to Execution pipeline stages
  const executionStages = ['HANDOVER_TO_EXECUTION', 'MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING'];
  const baseProjects = data?.projects?.filter((p: any) => 
    executionStages.includes(p.stage) &&
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Lazy loading details in background
  useEffect(() => {
    if (baseProjects.length === 0) return;
    const uncachedProjects = baseProjects.filter((p: any) => !detailCache[p.id] && !loadingIds.has(p.id));
    if (uncachedProjects.length === 0) return;

    const newLoadingIds = new Set(loadingIds);
    uncachedProjects.forEach((p: any) => newLoadingIds.add(p.id));
    setLoadingIds(newLoadingIds);

    Promise.all(
      uncachedProjects.map(async (p: any) => {
        try {
          const detail = await getProjectDetail(p.id);
          return { id: p.id, detail };
        } catch {
          return { id: p.id, detail: null };
        }
      })
    ).then((results) => {
      setDetailCache(prev => {
        const updated = { ...prev };
        results.forEach(({ id, detail }) => {
          if (detail) updated[id] = detail;
        });
        return updated;
      });
      setLoadingIds(new Set());
    });
  }, [baseProjects.length, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* 🚀 Header: Work Desk Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2">
            Execution Workspace
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            {stageSlug.replace(/-/g, ' ')}
          </h1>
          <p className="text-slate-500 font-medium text-sm text-left">Internal site operations and stage management.</p>
        </div>

        <div className="relative w-full lg:max-w-md group shrink-0">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
            <Input 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search site projects..." 
                className="pl-12 h-14 bg-white border-slate-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-sm w-full"
            />
        </div>
      </div>

      <div className="space-y-10">
        {baseProjects.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
              <HardHat size={48} className="opacity-20" />
              <p className="font-bold uppercase tracking-widest text-[10px]">No projects in this stage</p>
          </div>
        ) : (
          baseProjects.map((project: any) => {
             const detail = detailCache[project.id];
             const mergedProject = detail 
               ? { ...project, ...detail }
               : { ...project, tasks: [], projectFiles: [] };

             return (
                <div key={project.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ExecutionProjectManager 
                        project={mergedProject} 
                        forcedSection={activeSection}
                    />
                </div>
             );
          })
        )}
      </div>
    </div>
  );
}
