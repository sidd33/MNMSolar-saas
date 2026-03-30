"use client";

import { useState } from "react";
import { RubyProjectCard } from "@/components/workspace/RubyProjectCard";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Search } from "lucide-react";

interface MasterPipelineProps {
  projects: any[];
}

export function MasterPipeline({ projects }: MasterPipelineProps) {
  const [showAll, setShowAll] = useState(false);
  const [search, setSearch] = useState("");
  
  const filtered = search.trim()
    ? projects.filter((p) => {
        const q = search.toLowerCase();
        return (
          p.name?.toLowerCase().includes(q) ||
          p.id?.toLowerCase().includes(q) ||
          p.stage?.toLowerCase().includes(q) ||
          p.currentDepartment?.toLowerCase().includes(q)
        );
      })
    : projects;

  const displayedProjects = showAll ? filtered : filtered.slice(0, 5);
  const remainingCount = filtered.length - 5;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Master Pipeline
          </h2>
          <p className="text-xs font-medium text-[#64748B] italic">
            Centralized Relay Race: Real-time project velocity and handoffs.
          </p>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl bg-white text-[#0F172A] placeholder-slate-300 border border-slate-200 focus:outline-none focus:border-[#1C3384] focus:ring-1 focus:ring-[#1C3384]/20 w-52 transition-colors"
          />
        </div>
      </div>
      
      <div className="space-y-4">
        {displayedProjects.length === 0 ? (
          <p className="text-center text-sm text-slate-400 font-medium py-8">No projects found</p>
        ) : (
          displayedProjects.map((project) => (
            <RubyProjectCard key={project.id} project={project} />
          ))
        )}
      </div>

      {!search && filtered.length > 5 && (
        <Button 
          variant="outline" 
          onClick={() => setShowAll(!showAll)}
          className="w-full py-6 rounded-2xl border-dashed border-2 text-[#4A5568] font-bold hover:text-[#2D3748] hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          {showAll ? (
            <>
              Show Less <ChevronUp size={18} />
            </>
          ) : (
            <>
              Show All Active Projects (+{remainingCount}) <ChevronDown size={18} />
            </>
          )}
        </Button>
      )}
    </div>
  );
}
