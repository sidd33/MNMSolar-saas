"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Card } from "@/components/ui/card";
import { ListTodo } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { EngineeringHandoffCard } from "@/components/workspace/EngineeringHandoffCard";
import { DepartmentQueueSearch } from "@/components/dashboard/DepartmentQueueSearch";

import { useUser } from "@clerk/nextjs";

export default function WorkOrderDesk() {
  const { user } = useUser();
  const { data } = useDashboardNexus();
  const projects = data?.projects?.filter((p: any) => 
    p.stage === "WORK_ORDER" && (
      p.claimedByUserId === user?.id || 
      p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
    )
  ) || [];

  return (
    <DashboardShell 
      title="WORK ORDER DESK"
      subtitle="Final quality check and dual-track dispatch to Liaisoning and Execution."
    >
      {projects.length === 0 ? (
        <Card className="border-dashed h-64 flex items-center justify-center bg-[#F7FAFC] rounded-2xl border-slate-200">
          <div className="text-center">
             <ListTodo className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-[#4A5568] font-black uppercase tracking-widest text-xs">No pending work orders to dispatch.</p>
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
