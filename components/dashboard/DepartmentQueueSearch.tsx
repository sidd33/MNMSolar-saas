"use client";

import { useState, ReactNode, useEffect } from "react";
import { Search, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface ProjectEntry {
  id: string;
  name: string;
  stage: string;
  currentDepartment: string | null;
}

interface DepartmentQueueSearchProps {
  projects: ProjectEntry[];
  dept: string;
  children: ReactNode[];
  initialSearch?: string;
}

export function DepartmentQueueSearch({ projects, dept, children, initialSearch = "" }: DepartmentQueueSearchProps) {
  const [search, setSearch] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  const matchingIndices = search.trim()
    ? projects
        .map((p, i) => {
          const q = search.toLowerCase();
          const match =
            p.name?.toLowerCase().includes(q) ||
            p.id?.toLowerCase().includes(q) ||
            p.stage?.toLowerCase().includes(q) ||
            p.currentDepartment?.toLowerCase().includes(q);
          return match ? i : -1;
        })
        .filter((i) => i !== -1)
    : projects.map((_, i) => i);

  return (
    <>
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <h2 className="text-xl font-black text-[#0F172A] uppercase tracking-tighter font-[family-name:var(--font-montserrat)]">
          {dept.toUpperCase()} QUEUE
        </h2>
        
        <div className="relative w-full lg:max-w-md group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
            <Input 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={dept === "OVERALL" ? "Search all projects..." : "Search technical queue..."}
                className="pl-12 h-14 bg-white border-slate-100 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full font-medium placeholder:text-slate-300"
            />
        </div>
      </div>

      {matchingIndices.length === 0 ? (
        <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
          <Shield size={48} className="opacity-20" />
          <p className="font-black uppercase tracking-widest text-[10px]">
            No projects match your search criteria
          </p>
        </Card>
      ) : (
        <div className="space-y-8">
          {matchingIndices.map((i) => (
            <div key={projects[i].id}>{children[i]}</div>
          ))}
        </div>
      )}
    </>
  );
}
