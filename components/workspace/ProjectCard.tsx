"use client";

import { Calendar, Paperclip, MoreHorizontal, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { Project360Modal } from "@/components/dashboard/Project360Modal";
import { Button } from "@/components/ui/button";

interface ProjectCardProps {
  project: any;
  onClick?: () => void;
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const priority = project.priority || "MEDIUM";
  const priorityColors: Record<string, string> = {
    LOW: "bg-emerald-50 text-emerald-600 border-none",
    MEDIUM: "bg-amber-50 text-amber-600 border-none",
    HIGH: "bg-red-50 text-red-600 border-none",
  };

  return (
    <>
      <div 
        onClick={() => setIsDetailsOpen(true)}
        className={cn(
          "group bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm transition-all cursor-pointer relative overflow-hidden",
          "before:absolute before:left-0 before:top-0 before:bottom-0 before:w-1 before:bg-[#FFC800] before:rounded-full",
          "hover:shadow-xl hover:border-[#1C3384]/10 hover:-translate-y-1 active:scale-[0.98]"
        )}
      >
        <div className="flex items-start justify-between mb-4">
          <Badge className={cn(
            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.1em] border-none",
            priorityColors[priority] || priorityColors.MEDIUM
          )}>
            {priority}
          </Badge>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
             <span className="text-[9px] font-black text-[#1C3384] uppercase tracking-widest mr-1">Inspect</span>
             <ChevronRight size={12} className="text-[#1C3384]" />
          </div>
        </div>

        <h3 className="text-sm font-black text-[#0F172A] mb-2 tracking-tight group-hover:text-[#1C3384] transition-colors font-[family-name:var(--font-montserrat)] uppercase">
          {project.name}
        </h3>
        
        <p className="text-[10px] text-[#64748B] line-clamp-2 mb-6 font-medium leading-relaxed font-[family-name:var(--font-geist-sans)]">
          {project.description || "Operational suite for MNMSOLAR project deployment..."}
        </p>

        {/* Footer Metrics */}
        <div className="flex items-center justify-between pt-5 border-t border-slate-50 mt-2">
          <div className="flex -space-x-2">
            {[1, 2].map((i) => (
              <div 
                key={i} 
                className="h-7 w-7 rounded-xl border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-black text-[#1C3384] shadow-sm uppercase"
              >
                U{i}
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-amber-500 transition-colors">
              <Calendar size={12} strokeWidth={2.5} />
              <span className="text-[8px] font-black uppercase tracking-tighter">PHASE {project.stage?.split('_')[0]}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300 group-hover:text-blue-500 transition-colors">
              <Paperclip size={12} strokeWidth={2.5} />
              <span className="text-[8px] font-black uppercase tracking-tighter">{project.projectFiles?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>

      <Project360Modal 
        projectId={project.id} 
        open={isDetailsOpen} 
        onOpenChange={setIsDetailsOpen} 
      />
    </>
  );
}
