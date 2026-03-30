import { getAllProjectsForList, getProjectGanttData } from "@/lib/actions/gantt";
import { ProjectGantt } from "@/components/gantt/ProjectGantt";
import { GanttSummaryStrip } from "@/components/gantt/GanttSummaryStrip";
import Link from "next/link";
import { Calendar } from "lucide-react";

export default async function TimelinePage({
  searchParams,
}: {
  searchParams: Promise<{ project?: string }>;
}) {
  const { project: selectedProjectId } = await searchParams;
  const projects = await getAllProjectsForList();
  
  const activeProjectId = selectedProjectId || projects[0]?.id;
  
  let ganttData: any = null;
  if (activeProjectId) {
    ganttData = await getProjectGanttData(activeProjectId);
  }

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden -m-6 lg:-m-8">

      {/* LEFT PANEL — 20% width, full height, dark navy */}
      <div className="w-[20%] shrink-0 flex flex-col h-full bg-gradient-to-b from-[#0f1f54] to-[#1C3384] border-r border-white/5">
        <div className="px-4 py-3 border-b border-white/10 shrink-0">
          <h3 className="text-[10px] font-black uppercase tracking-widest text-blue-300/50 font-[family-name:var(--font-montserrat)]">
            Active Pipeline
          </h3>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-0.5">
          {projects.length === 0 ? (
            <div className="py-20 text-center opacity-30">
              <p className="text-xs font-bold uppercase tracking-widest text-white/40">No projects</p>
            </div>
          ) : (
            projects.map((p) => (
              <Link
                key={p.id}
                href={`/dashboard/timeline?project=${p.id}`}
                className={`group flex flex-col gap-1.5 px-3 py-2.5 rounded-xl transition-all border ${
                  activeProjectId === p.id 
                    ? 'bg-white/10 border-white/10' 
                    : 'border-transparent hover:bg-white/5'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold truncate pr-2 transition-colors ${
                    activeProjectId === p.id ? 'text-white' : 'text-blue-100/50 group-hover:text-white/80'
                  }`}>
                    {p.name}
                  </span>
                  {p.isBottlenecked && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] font-black uppercase tracking-widest text-blue-200/25 bg-white/5 px-1.5 py-0.5 rounded">
                    {p.stage.replace(/_/g, ' ')}
                  </span>
                  <span className="text-[8px] font-bold text-blue-200/20 uppercase">{p.currentDepartment}</span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL — 80% width, full height */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50/50">
        {ganttData ? (
          <>
            {/* Summary Strip — slim, fixed height */}
            <div className="shrink-0">
              <GanttSummaryStrip 
                projectName={ganttData.projectName}
                createdAt={ganttData.createdAt}
                currentStage={ganttData.ganttData.find((t: any) => t.isCurrent)?.id || "N/A"}
                isBottlenecked={ganttData.ganttData.some((t: any) => t.isBottlenecked)}
                totalTasks={ganttData.ganttData.length}
                completedTasks={ganttData.ganttData.filter((t: any) => t.isCompleted).length}
              />
            </div>
            
            {/* Gantt Chart — fills ALL remaining space */}
            <div className="flex-1 overflow-auto min-h-0">
              <ProjectGantt tasks={ganttData.ganttData} />
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <Calendar size={28} className="text-slate-300" />
            </div>
            <h3 className="text-lg font-black text-slate-300 uppercase tracking-tighter">No Project Selected</h3>
            <p className="text-xs text-slate-400 max-w-[200px] mt-2 font-medium">Select a project from the left panel.</p>
          </div>
        )}
      </div>
    </div>
  );
}
