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
  const [activeTab, setActiveTab] = useState<'primary' | 'execution'>('primary');

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
            
            <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full lg:w-auto">
              <button 
                onClick={() => setActiveTab('primary')}
                className={`flex-1 lg:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'primary' ? 'bg-white text-[#1C3384] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <FileText size={14} />
                Primary ({projects.filter((p: any) => p.stage === "MATERIAL_PROCUREMENT").length})
              </button>
              <button 
                onClick={() => setActiveTab('execution')}
                className={`flex-1 lg:flex-none px-6 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'execution' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                <CircleArrowRight size={14} />
                Execution ({projects.filter((p: any) => p.stage !== "MATERIAL_PROCUREMENT").length})
              </button>
            </div>
        </div>

        {searchQuery.trim() !== "" ? (
            filteredProjects.filter((p: any) => activeTab === 'primary' ? p.stage === "MATERIAL_PROCUREMENT" : p.stage !== "MATERIAL_PROCUREMENT").length === 0 ? (
                <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                    <FileText size={48} className="opacity-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">No BOM reviews pending for search</p>
                </Card>
            ) : (
                <div className="flex flex-col gap-6">
                    {filteredProjects
                        .filter((p: any) => activeTab === 'primary' ? p.stage === "MATERIAL_PROCUREMENT" : p.stage !== "MATERIAL_PROCUREMENT")
                        .map((project: any) => (
                        <ProcurementProjectCard key={project.id} project={project} view="BOM_REVIEW" />
                    ))}
                </div>
            )
        ) : (
            <div className="space-y-6">
                {/* TAB CONTENT */}
                {activeTab === 'primary' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {projects.filter((p: any) => p.stage === "MATERIAL_PROCUREMENT").length === 0 ? (
                            <Card className="border-dashed h-48 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2rem] border-slate-200 text-slate-400">
                                <FileText size={32} className="opacity-20 mb-3" />
                                <p className="font-black uppercase tracking-widest text-[10px]">No Primary Projects Pending</p>
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {projects.filter((p: any) => p.stage === "MATERIAL_PROCUREMENT").map((project: any) => (
                                    <ProcurementProjectCard key={project.id} project={project} view="BOM_REVIEW" />
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'execution' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {projects.filter((p: any) => p.stage !== "MATERIAL_PROCUREMENT").length === 0 ? (
                            <Card className="border-dashed h-48 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2rem] border-slate-200 text-slate-400">
                                <CircleArrowRight size={32} className="opacity-20 mb-3" />
                                <p className="font-black uppercase tracking-widest text-[10px]">No Execution Support Needed</p>
                            </Card>
                        ) : (
                            <div className="flex flex-col gap-6">
                                {projects.filter((p: any) => p.stage !== "MATERIAL_PROCUREMENT").map((project: any) => (
                                    <ProcurementProjectCard key={project.id} project={project} view="BOM_REVIEW" />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        )}
    </DashboardShell>
  );
}
