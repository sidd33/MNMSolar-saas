"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { ProcurementProjectCard } from "@/components/workspace/ProcurementProjectCard";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { FileText, Search, CircleArrowRight } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { useSearchParams } from "next/navigation";

export default function BOMReviewPage() {
  const { data, isLoading } = useDashboardNexus();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const activeStages = ['HANDOVER_TO_EXECUTION', 'MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING', 'FINAL_HANDOVER'];
  const projects = data?.projects?.filter((p: any) => activeStages.includes(p.stage)) || [];
  
  const filteredProjects = searchQuery.trim() === "" ? [] : projects.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell title="BOM REVIEW" subtitle="Approve Bill of Materials handed over from Engineering.">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
            <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search projects..." 
                    className="pl-12 h-14 bg-white border-slate-100 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full font-medium placeholder:text-slate-300"
                />
            </div>
        </div>

        {searchQuery.trim() === "" ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                <Search size={48} className="opacity-20 mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-[10px]">Select a project from the sidebar to view BOM</p>
            </Card>
        ) : filteredProjects.length === 0 ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                <FileText size={48} className="opacity-20 mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-[10px]">No BOM reviews pending</p>
            </Card>
        ) : (
            <div className="flex flex-col gap-6">
                {filteredProjects.map((project: any) => (
                    <ProcurementProjectCard 
                        key={project.id} 
                        project={project} 
                        view="BOM_REVIEW" 
                    />
                ))}
            </div>
        )}
    </DashboardShell>
  );
}
