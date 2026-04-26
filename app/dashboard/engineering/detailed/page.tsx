"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineeringHandoffCard } from "@/components/workspace/EngineeringHandoffCard";
import { DepartmentQueueSearch } from "@/components/dashboard/DepartmentQueueSearch";
import { getProjectDetail, getBulkProjectDetails } from "@/lib/actions/engineering";
import { useState, useEffect } from "react";

/**
 * Detailed Engineering Queue — Ultra-Lean Edition
 * 
 * The Nexus now only provides lightweight project metadata.
 * Files & Tasks are fetched in bulk for all visible projects.
 */
export default function DetailedEnggQueue() {
  const { data } = useDashboardNexus();
  const projects = data?.projects?.filter((p: any) => p.stage === "DETAILED_ENGG") || [];
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Fetch details for all visible projects (batch)
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
  }, [projects.length]); // Only re-run when the count changes

  return (
    <DashboardShell 
      title="DETAILED ENGG DESK"
      subtitle="Draft SLDs and Structure Layouts for field technicians."
    >
      {projects.length === 0 ? (
        <Card className="border-dashed h-64 flex items-center justify-center bg-[#F7FAFC] rounded-2xl border-slate-200">
          <div className="text-center">
             <Zap className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-[#4A5568] font-black uppercase tracking-widest text-xs">No pending engineering drafting tasks.</p>
          </div>
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
        >
          {projects.map((project: any) => {
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
        </DepartmentQueueSearch>
      )}
    </DashboardShell>
  );
}
