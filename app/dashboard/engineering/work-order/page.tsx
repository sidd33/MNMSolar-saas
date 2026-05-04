"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Card } from "@/components/ui/card";
import { ListTodo, Settings } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WorkOrderHandoffCard } from "@/components/workspace/WorkOrderHandoffCard";
import { DepartmentQueueSearch } from "@/components/dashboard/DepartmentQueueSearch";
import { getBulkProjectDetails } from "@/lib/actions/engineering";
import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { useSearchParams } from "next/navigation";

export default function WorkOrderDesk() {
  const { user } = useUser();
  const { data, isLoading } = useDashboardNexus();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  const projects = data?.projects?.filter((p: any) => 
    p.stage !== "SITE_SURVEY" && (
      p.claimedByUserId === user?.id || 
      p.assignedToEngineerId === user?.id ||
      p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
    )
  ) || [];

  useEffect(() => {
    if (projects.length === 0 || isSyncing) return;

    const uncachedIds = projects
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
      .finally(() => {
        setIsSyncing(false);
      });
  }, [projects.length]);

  if (isLoading) {
    return (
      <DashboardShell title="WORK ORDER DESK">
        <div className="p-12 flex justify-center">
          <Settings className="animate-spin text-slate-300" size={48} />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell 
      title="WORK ORDER DESK"
      subtitle="Final quality check and dual-track dispatch to Liaisoning and Execution."
    >
      {projects.length === 0 ? (
        <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
          <ListTodo size={48} className="opacity-20 mx-auto mb-4" />
          <p className="font-black uppercase tracking-widest text-[10px]">No pending work orders to dispatch.</p>
        </Card>
      ) : (
        <DepartmentQueueSearch
          projects={projects.map((p: any) => ({
            id: p.id,
            name: p.name,
            stage: p.stage,
            currentDepartment: p.currentDepartment,
          }))}
          dept="ENGINEERING"
          initialSearch={initialSearch}
        >
          {projects.map((project: any) => {
            const detail = detailCache[project.id];
            const mergedProject = detail 
              ? { ...project, ...detail }
              : { ...project, projectFiles: [] };

            return (
              <WorkOrderHandoffCard 
                key={project.id} 
                project={mergedProject} 
                dept="ENGINEERING" 
                initialFiles={mergedProject.projectFiles || []} 
              />
            );
          })}
        </DepartmentQueueSearch>
      )}
    </DashboardShell>
  );
}
