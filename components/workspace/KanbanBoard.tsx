"use client";

import { ProjectCard } from "./ProjectCard";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  projects: any[];
}

export function KanbanBoard({ projects }: KanbanBoardProps) {
  // Logical columns based on PipelineStage
  const columns = [
    { 
      id: "TODO", 
      title: "TO DO", 
      stages: ["PROSPECT", "SITE_SURVEY", "PRELIMINARY_QUOTE"],
      color: "bg-slate-400"
    },
    { 
      id: "IN_PROGRESS", 
      title: "IN PROGRESS", 
      stages: ["DETAILED_ENGG", "WORK_ORDER", "HANDOVER_TO_EXECUTION", "MATERIAL_PROCUREMENT", "STRUCTURE_ERECTION", "PV_PANEL_INSTALLATION", "AC_DC_INSTALLATION", "NET_METERING"],
      color: "bg-yellow-400"
    },
    { 
      id: "COMPLETED", 
      title: "COMPLETED", 
      stages: ["FINAL_HANDOVER"],
      color: "bg-emerald-400"
    }
  ];

  return (
    <div className="flex gap-6 overflow-x-auto pb-8 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
      {columns.map((column) => {
        const columnProjects = projects.filter(p => column.stages.includes(p.stage));
        
        return (
          <div 
            key={column.id} 
            className="flex-shrink-0 w-80 flex flex-col h-full min-h-[500px]"
          >
            {/* Column Header */}
            <div className="flex items-center justify-between mb-4 px-2">
              <div className="flex items-center gap-2">
                <div className={cn("h-2 w-2 rounded-full", column.color)} />
                <h2 className="text-xs font-black tracking-widest text-[#001F3F] uppercase">
                  {column.title}
                </h2>
                <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  {columnProjects.length}
                </span>
              </div>
              <button className="text-slate-300 hover:text-[#001F3F] transition-colors font-black">
                +
              </button>
            </div>

            {/* Column Body */}
            <div className="bg-slate-50/50 rounded-2xl p-3 flex-1 border border-slate-100/50 backdrop-blur-sm shadow-inner">
              <div className="flex flex-col gap-4">
                {columnProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
                
                {columnProjects.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-32 border-2 border-dashed border-slate-200 rounded-xl bg-white/30">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Empty Queue</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
