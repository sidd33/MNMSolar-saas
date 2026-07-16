"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { ProcurementProjectCard } from "@/components/workspace/ProcurementProjectCard";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { Truck, Search, PlusCircle } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";

import { useSearchParams } from "next/navigation";

export default function LogisticsDispatchPage() {
  const { data, isLoading } = useDashboardNexus();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  // Sync searchQuery when URL changes via sidebar clicks
  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const activeStages = ['MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING', 'FINAL_HANDOVER'];
  const projects = data?.projects?.filter((p: any) => activeStages.includes(p.stage)) || [];
  
  // Empty state by default to save bandwidth, just like Engineering
  const filteredProjects = searchQuery.trim() === "" ? [] : projects.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardShell title="DISPATCH & LOGISTICS" subtitle="Track material inwards, generate challans, and manage dispatches.">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between mb-6">
            <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search logistics queue..." 
                    className="pl-12 h-14 bg-white border-slate-100 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full font-medium placeholder:text-slate-300"
                />
            </div>
        </div>

        {searchQuery.trim() === "" ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                <Search size={48} className="opacity-20 mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-[10px]">Select a project from the sidebar to view dispatch</p>
            </Card>
        ) : filteredProjects.length === 0 ? (
            <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                <Truck size={48} className="opacity-20 mx-auto mb-4" />
                <p className="font-black uppercase tracking-widest text-[10px]">No logistics pending for this project</p>
            </Card>
        ) : (
            <div className="flex flex-col gap-6">
                {filteredProjects.map((project: any) => (
                    <ProcurementProjectCard 
                        key={project.id} 
                        project={project} 
                        view="DISPATCH" 
                    />
                ))}
            </div>
        )}
    </DashboardShell>
  );
}
