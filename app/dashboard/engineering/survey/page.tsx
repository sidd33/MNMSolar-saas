"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Card } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { MapPin, Zap, Search } from "lucide-react";
import { EngineeringHandoffCard } from "@/components/workspace/EngineeringHandoffCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getProjectDetail, getBulkProjectDetails } from "@/lib/actions/engineering";

export default function EngineeringSurveyQueue() {
  const { data } = useDashboardNexus();
  const [searchQuery, setSearchQuery] = useState("");

  const filterProjects = (projects: any[], stages: string[]) => {
    return projects.filter(p => 
      stages.includes(p.stage) && 
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const surveyProjects = filterProjects(data?.projects || [], ["SITE_SURVEY"]);
  const detailedProjects = filterProjects(data?.projects || [], ["DETAILED_ENGG"]);
  const allVisibleProjects = [...surveyProjects, ...detailedProjects];

  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    if (allVisibleProjects.length === 0 || isSyncing) return;

    const uncachedIds = allVisibleProjects
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
  }, [allVisibleProjects.length, searchQuery]);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* 🚀 Header: Engineering Command Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2">
            Engineering Operations
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Survey Desk
          </h1>
          <p className="text-slate-500 font-medium text-sm text-left">Verify site limits and manage technical surveys.</p>
        </div>
      </div>

      <Tabs defaultValue="site-survey" className="w-full space-y-6">
        {/* 🛠 Controls Row: Type & Search */}
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
                    className="pl-12 h-14 bg-white border-slate-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-sm w-full"
                />
            </div>
        </div>

        {/* 📊 Content Area */}
        <TabsContent value="site-survey" className="mt-0 w-full focus-visible:outline-none">
            {surveyProjects.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                    <MapPin size={48} className="opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No site surveys pending check</p>
                </div>
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
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                    <Zap size={48} className="opacity-20" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No pending engineering drafting tasks</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {detailedProjects.map((project: any) => {
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
      </Tabs>
    </div>
  );
}
