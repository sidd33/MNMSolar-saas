"use client";

import { useState, ReactNode } from "react";
import { Search, Shield } from "lucide-react";
import { Card } from "@/components/ui/card";

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
}

export function DepartmentQueueSearch({ projects, dept, children }: DepartmentQueueSearchProps) {
  const [search, setSearch] = useState("");

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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black text-[#0F172A] uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
          {dept.toUpperCase()} QUEUE
        </h2>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={dept === "OVERALL" ? "Search all projects..." : "Search projects..."}
            className="pl-9 pr-3 py-1.5 text-xs font-medium rounded-xl bg-white text-[#0F172A] placeholder-slate-300 border border-slate-200 focus:outline-none focus:border-[#1C3384] focus:ring-1 focus:ring-[#1C3384]/20 w-52 transition-colors"
          />
        </div>
      </div>

      {matchingIndices.length === 0 ? (
        <Card className="border-dashed h-40 flex items-center justify-center bg-[#F7FAFC] rounded-2xl border-slate-200">
          <div className="text-center">
            <Shield className="h-8 w-8 text-slate-200 mx-auto mb-3" />
            <p className="text-[#4A5568] font-black uppercase tracking-widest text-xs">
              No projects match your search
            </p>
          </div>
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
