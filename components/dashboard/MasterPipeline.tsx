"use client";

import { useState, useMemo } from "react";
import { RubyProjectCard } from "@/components/workspace/RubyProjectCard";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search, Loader2 } from "lucide-react";
import { usePipelineNexus } from "./DashboardNexusProvider";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function MasterPipeline() {
  const { projects, isLoading } = usePipelineNexus();
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  
  const filtered = useMemo(() => {
    if (!search.trim()) return projects;
    const q = search.toLowerCase();
    return (projects as any[]).filter((p: any) => 
      p.name?.toLowerCase().includes(q) ||
      p.id?.toLowerCase().includes(q) ||
      p.stage?.toLowerCase().includes(q) ||
      p.currentDepartment?.toLowerCase().includes(q)
    );
  }, [projects, search]);

  const displayedProjects = showAll ? filtered : filtered.slice(0, 5);
  const remainingCount = filtered.length - 5;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-[#0F172A] uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Master Pipeline
          </h2>
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] italic">
              Centralized Relay Race
            </p>
            {isLoading && <Loader2 size={10} className="animate-spin text-blue-500" />}
          </div>
        </div>
        <div className="relative group">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#1C3384] transition-colors pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter projects..."
            className="pl-9 pr-4 py-2 text-xs font-bold rounded-2xl bg-white text-[#0F172A] placeholder-slate-300 border border-slate-100 shadow-sm focus:outline-none focus:border-[#1C3384] focus:ring-4 focus:ring-[#1C3384]/5 w-64 transition-all"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {projects.length === 0 && isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <div key={i} className="bg-white p-6 rounded-[2rem] border border-slate-100 space-y-4 shadow-sm">
                <div className="flex justify-between items-start">
                   <div className="space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-24" />
                   </div>
                   <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <div className="pt-4 flex gap-4">
                   <Skeleton className="h-2 flex-1 rounded-full" />
                   <Skeleton className="h-2 flex-1 rounded-full" />
                </div>
            </div>
          ))
        ) : displayedProjects.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
             <div className="h-12 w-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-300">
                <Search size={24} />
             </div>
             <p className="text-sm text-slate-400 font-bold uppercase tracking-widest">No matching projects</p>
          </div>
        ) : (
          (displayedProjects as any[]).map((project: any) => (
            <RubyProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {!search && filtered.length > 5 && (
        <Button 
          variant="outline" 
          onClick={() => setShowAll(!showAll)}
          className="w-full py-8 rounded-[2rem] border-2 border-dashed border-slate-100 bg-white text-[#64748B] font-black uppercase tracking-widest hover:text-[#1C3384] hover:bg-blue-50/50 hover:border-blue-100 transition-all flex items-center justify-center gap-3 group shadow-sm"
        >
          {showAll ? (
            <>
              Collapse Overview <ChevronUp size={18} className="group-hover:-translate-y-1 transition-transform" />
            </>
          ) : (
            <>
              View Full Pipeline (+{remainingCount} more) <ChevronDown size={18} className="group-hover:translate-y-1 transition-transform" />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
