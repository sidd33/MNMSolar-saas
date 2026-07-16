"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Card } from "@/components/ui/card";
import { Zap, Settings, Search, Shield } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineeringHandoffCard } from "@/components/workspace/EngineeringHandoffCard";
import { Input } from "@/components/ui/input";
import { getBulkProjectDetails } from "@/lib/actions/engineering";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function DetailedEnggQueue() {
  const { user } = useUser();
  const { data, isLoading } = useDashboardNexus();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const projects = data?.projects?.filter((p: any) => 
    p.stage === "DETAILED_ENGG" && (
      p.claimedByUserId === user?.id || 
      p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
    )
  ) || [];

  const filteredProjects = searchQuery.trim() === "" ? [] : projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.stage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (filteredProjects.length === 0 || isSyncing) return;

    const uncachedIds = filteredProjects
      .filter((p: any) => !detailCache[p.id])
      .map((p: any) => p.id);

    if (uncachedIds.length === 0) return;

    setIsSyncing(true);

    getBulkProjectDetails(uncachedIds)
      .then((results) => {
        setDetailCache(prev => {
          const updated = { ...prev };
          results.forEach((detail: any) => {
            if (detail) updated[detail.id] = detail;
          });
          return updated;
        });
      })
      .catch((err) => {
        console.error("Failed to fetch bulk details:", err);
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, [filteredProjects.length, searchQuery]);

  if (isLoading) {
    return (
      <DashboardShell title="DETAILED ENGG DESK">
        <div className="p-12 flex justify-center">
          <Settings className="animate-spin text-slate-300" size={48} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell 
      title="DETAILED ENGG DESK"
      subtitle="Draft SLDs and Structure Layouts for field technicians."
    >
      {projects.length === 0 ? (
        <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
          <Zap size={48} className="opacity-20 mx-auto mb-4" />
          <p className="font-black uppercase tracking-widest text-[10px]">No pending engineering drafting tasks.</p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
            <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter font-[family-name:var(--font-montserrat)]">
              ENGINEERING QUEUE
            </h2>
            <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search technical queue..." 
                    className="pl-12 h-14 bg-white border-slate-100 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full font-medium placeholder:text-slate-300"
                />
            </div>
          </div>
          
          {searchQuery.trim() === "" ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
              <Search size={48} className="opacity-20 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-[10px]">Select a project from the sidebar or search.</p>
            </Card>
          ) : filteredProjects.length === 0 ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
              <Shield size={48} className="opacity-20 mx-auto mb-4" />
              <p className="font-black uppercase tracking-widest text-[10px]">No projects match your search criteria</p>
            </Card>
          ) : (
            <div className="space-y-8">
              {filteredProjects.map((project: any) => {
                const detail = detailCache[project.id];
                const mergedProject = detail 
                  ? { ...project, ...detail }
                  : { ...project, tasks: [], projectFiles: [] };

                return (
                  <EngineeringHandoffCard 
                    key={project.id} 
                    project={mergedProject} 
                    dept="ENGINEERING" 
                    initialFiles={detail?.projectFiles || []} 
                  />
                );
              })}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  );
}
