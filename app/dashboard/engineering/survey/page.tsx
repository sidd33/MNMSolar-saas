"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { MapPin, Zap, Settings, Search } from "lucide-react";
import { EngineeringHandoffCard } from "@/components/workspace/EngineeringHandoffCard";
import { SurveyHandoffCard } from "@/components/workspace/SurveyHandoffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUser } from "@clerk/nextjs";
import { getBulkProjectDetails } from "@/lib/actions/engineering";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { Input } from "@/components/ui/input";
import { useSearchParams } from "next/navigation";

export default function EngineeringSurveyQueue() {
  const { user } = useUser();
  const { data, isLoading } = useDashboardNexus();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [activeTab, setActiveTab] = useState("site-survey");
  const [searchQuery, setSearchQuery] = useState(initialSearch);

  useEffect(() => {
    if (initialSearch) {
      setSearchQuery(initialSearch);
    }
  }, [initialSearch]);

  const projects = data?.projects?.filter((p: any) => 
    (p.stage === "SITE_SURVEY" || p.stage === "DETAILED_ENGG") && (
      p.claimedByUserId === user?.id || 
      p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
    )
  ) || [];

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (filteredProjects.length === 0 || isSyncing) return;

    const uncachedIds = filteredProjects
      .filter((p: any) => !detailCache[p.id])
      .map((p: any) => p.id);

    if (uncachedIds.length === 0) return;

    setIsSyncing(true);
    getBulkProjectDetails(uncachedIds)
      .then((results) => {
        setDetailCache(prev => {
          const updated = { ...prev };
          results.forEach((detail: any) => {
            if (detail) updated[detail.id] = detail;
          });
          return updated;
        });
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, [filteredProjects.length]);

  if (isLoading) {
    return (
      <DashboardShell title="SURVEY DESK">
        <div className="p-12 flex justify-center">
          <Settings className="animate-spin text-slate-300" size={48} />
        </div>
      </DashboardShell>
    );
  }

  const surveyProjects = filteredProjects.filter(p => p.stage === "SITE_SURVEY");
  const detailedProjects = filteredProjects.filter(p => p.stage === "DETAILED_ENGG");

  return (
    <DashboardShell 
      title="SURVEY DESK"
      subtitle="Verify site limits and manage technical surveys."
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <TabsList className="bg-slate-100/50 border border-slate-200/60 p-1.5 rounded-2xl h-14 w-full lg:w-auto">
                <TabsTrigger value="site-survey" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#1C3384] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-2">
                    <MapPin size={16} />
                    Site Survey
                </TabsTrigger>
                <TabsTrigger value="detailed-survey" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#FFC800] data-[state=active]:text-[#1C3384] data-[state=active]:shadow-lg transition-all h-full gap-2">
                    <Zap size={16} />
                    Detailed Survey
                </TabsTrigger>
            </TabsList>

            <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search technical queue..." 
                    className="pl-12 h-14 bg-white border-slate-100 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-[0_8px_30px_rgb(0,0,0,0.04)] w-full font-medium placeholder:text-slate-300"
                />
            </div>
        </div>

        <TabsContent value="site-survey" className="mt-0 w-full focus-visible:outline-none">
            {surveyProjects.length === 0 ? (
                <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                    <MapPin size={48} className="opacity-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">No site surveys found</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {surveyProjects.map((project: any) => {
                        const detail = detailCache[project.id];
                        const mergedProject = detail 
                          ? { ...project, ...detail }
                          : { ...project, tasks: [], projectFiles: [] };

                        return (
                            <EngineeringHandoffCard 
                                key={project.id} 
                                project={mergedProject} 
                                dept="ENGINEERING" 
                                initialFiles={detail?.projectFiles || []} 
                            />
                        );
                    })}
                </div>
            )}
        </TabsContent>

        <TabsContent value="detailed-survey" className="mt-0 w-full focus-visible:outline-none">
            {detailedProjects.length === 0 ? (
                <Card className="border-dashed h-64 flex flex-col items-center justify-center bg-[#F7FAFC] rounded-[2.5rem] border-slate-200 text-slate-400 gap-3">
                    <Zap size={48} className="opacity-20 mx-auto mb-4" />
                    <p className="font-black uppercase tracking-widest text-[10px]">No drafting tasks found</p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {detailedProjects.map((project: any) => {
                        const detail = detailCache[project.id];
                        const mergedProject = detail 
                          ? { ...project, ...detail }
                          : { ...project, tasks: [], projectFiles: [] };

                        return (
                            <SurveyHandoffCard 
                                key={project.id} 
                                project={mergedProject} 
                                dept="ENGINEERING" 
                                initialFiles={detail?.projectFiles || []} 
                            />
                        );
                    })}
                </div>
            )}
        </TabsContent>
      </Tabs>
    </DashboardShell>
  );
}
