"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Project {
  id: string;
  name: string;
  stage: string;
  isBottlenecked: boolean;
  currentDepartment: string;
}

interface ProjectListProps {
  projects: Project[];
  selectedId: string | null;
  onSelect: (projectId: string) => void;
}

export function ProjectList({ projects, selectedId, onSelect }: ProjectListProps) {
  return (
    <div className="flex flex-col h-full bg-slate-50/50 border-r border-slate-200 overflow-hidden">
      <div className="p-4 border-b border-slate-200">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 font-[family-name:var(--font-montserrat)]">
          Project Pipeline
        </h3>
      </div>
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {projects.map((p) => (
            <div
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={cn(
                "group flex flex-col gap-1.5 p-3 rounded-xl transition-all cursor-pointer border relative",
                selectedId === p.id 
                  ? "bg-white border-[#1C3384] shadow-md ring-1 ring-[#1C3384]/5" 
                  : "bg-transparent border-transparent hover:bg-white hover:border-slate-200"
              )}
            >
              <div className="flex items-center justify-between">
                <span className={cn(
                  "text-[11px] font-bold truncate pr-2 group-hover:text-[#1C3384] transition-colors",
                  selectedId === p.id ? "text-[#1C3384]" : "text-slate-700"
                )}>
                  {p.name}
                </span>
                {p.isBottlenecked && (
                  <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/50" />
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <Badge className="bg-slate-100 text-slate-500 border-none font-bold text-[8px] px-1.5 py-0 shadow-none uppercase">
                  {p.stage.replace(/_/g, ' ')}
                </Badge>
                <span className="text-[8px] font-medium text-slate-400">
                  {p.currentDepartment}
                </span>
              </div>

              {selectedId === p.id && (
                <div className="absolute left-0 top-3 bottom-3 w-1 bg-[#1C3384] rounded-r-full" />
              )}
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
