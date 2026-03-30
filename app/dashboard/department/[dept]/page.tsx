import Link from "next/link";
import { getDepartmentalProjects } from "@/app/actions/dashboard";
import { getProjectFiles } from "@/app/actions/project";
import { Card } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ProjectHandoffCard } from "@/components/workspace/ProjectHandoffCard";
import { DepartmentQueueSearch } from "@/components/dashboard/DepartmentQueueSearch";

import { currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function DepartmentDashboard({ params }: { params: Promise<{ dept: string }> }) {
  const { dept } = await params;
  const user = await currentUser();

  if (!user) redirect('/sign-in');

  const role = user.publicMetadata?.role as string | undefined;
  const department = user.publicMetadata?.department as string | undefined;

  // Owners can see any department (including 'OVERALL')
  // Employees can only see their assigned department
  const isOwner = role === 'OWNER';
  const isAssignedEmployee = role === 'EMPLOYEE' && department === dept;

  if (!isOwner && !isAssignedEmployee) {
    redirect('/dashboard');
  }

  const projects = await getDepartmentalProjects(dept);

  // Safety Check: Organization Selection
  if ((projects as any).error === "NO_ORG") {
    return (
      <DashboardShell title="Access Restricted" subtitle="Organization Membership Required">
        <Card className="border-dashed h-64 flex items-center justify-center bg-[#F7FAFC]">
          <div className="text-center p-8 max-w-md">
            <Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" />
            <h3 className="text-xl font-black mb-2 text-[#2D3748]">Organization Required</h3>
            <p className="text-[#4A5568] font-medium mb-6 text-sm">
              Please join the MNMSOLAR Organization to see your tasks and manage project pipelines.
            </p>
            <Link href="/" className="inline-flex items-center justify-center bg-[#1A365D] text-white font-black rounded-xl px-6 py-2.5 transition-all hover:opacity-90 shadow-lg active:scale-95">
               Return to Onboarding
            </Link>
          </div>
        </Card>
      </DashboardShell>
    );
  }

  const projectList = Array.isArray(projects) ? projects : [];

  return (
    <DashboardShell 
      title={`${dept.toUpperCase()} QUEUE`}
      subtitle={`Strategic oversight and vertical pipeline management for ${dept}.`}
    >
      {projectList.length === 0 ? (
        <Card className="border-dashed h-64 flex items-center justify-center bg-[#F7FAFC] rounded-2xl border-slate-200">
          <div className="text-center">
             <Shield className="h-12 w-12 text-slate-200 mx-auto mb-4" />
             <p className="text-[#4A5568] font-black uppercase tracking-widest text-xs">No active projects in {dept} queue.</p>
          </div>
        </Card>
      ) : (
        <DepartmentQueueSearch
          projects={projectList.map((p: any) => ({
            id: p.id,
            name: p.name,
            stage: p.stage,
            currentDepartment: p.currentDepartment,
          }))}
          dept={dept}
        >
          {await Promise.all(projectList.map(async (project: any) => {
            const initialFiles = await getProjectFiles(project.id);
            return (
              <ProjectHandoffCard 
                key={project.id} 
                project={project} 
                dept={dept} 
                initialFiles={initialFiles} 
              />
            );
          }))}
        </DepartmentQueueSearch>
      )}
    </DashboardShell>
  );
}


