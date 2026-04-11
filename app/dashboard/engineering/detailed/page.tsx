"use client";

import { useEngineeringNexus } from "@/components/dashboard/EngineeringNexusProvider";
import { Card } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineeringHandoffCard } from "@/components/workspace/EngineeringHandoffCard";
import { DepartmentQueueSearch } from "@/components/dashboard/DepartmentQueueSearch";

export default function DetailedEnggQueue() {
  const { data } = useEngineeringNexus();

  const projects = data.projects.filter(p => p.stage === "DETAILED_ENGG");

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
          {projects.map((project: any) => (
            <EngineeringHandoffCard 
              key={project.id} 
              project={project} 
              dept="ENGINEERING" 
              initialFiles={project.projectFiles || []} 
            />
          ))}
        </DepartmentQueueSearch>
      )}
    </DashboardShell>
  );
}
