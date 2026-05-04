"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { Badge } from "@/components/ui/badge";
import { Inbox, Search, RefreshCcw, LayoutGrid, UserCheck, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { ProjectPoolCard } from "@/components/workspace/ProjectPoolCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUser } from "@clerk/nextjs";

export default function ProjectPoolPage() {
  const { user } = useUser();
  const { data, isLoading, refresh } = useDashboardNexus();
  const [searchQuery, setSearchQuery] = useState("");

  const projects = data?.projects || [];
  
  // Filtering logic
  const filteredProjects = projects.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const unclaimed = filteredProjects.filter((p: any) => 
    (!p.assignedEngineers || p.assignedEngineers.length === 0) && 
    !p.claimedByUserId && 
    !p.assignedToEngineerId
  );
  
  const myProjects = filteredProjects.filter((p: any) => 
    p.claimedByUserId === user?.id || 
    p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
  );
  
  const assignedToMe = filteredProjects.filter((p: any) => 
    p.assignedToEngineerId === user?.id || 
    p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* 🚀 Header: Engineering Command Level */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2">
            Engineering Shared Intake
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Project Pool
          </h1>
          <p className="text-slate-500 font-medium text-sm text-left">Claim available technical tasks or monitor the team workload.</p>
        </div>
        <button 
            onClick={() => refresh()}
            className="h-14 w-14 rounded-2xl bg-white border border-slate-100 shadow-sm flex items-center justify-center text-slate-400 hover:text-[#1C3384] hover:border-[#1C3384]/20 transition-all active:rotate-180 duration-500"
        >
            <RefreshCcw size={22} />
        </button>
      </div>

      <Tabs defaultValue="all" className="w-full space-y-6">
        {/* 🛠 Controls Row: Logic & Filter */}
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <TabsList className="bg-slate-100/50 border border-slate-200/60 p-1.5 rounded-2xl h-14 w-full lg:w-auto">
                <TabsTrigger value="all" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#1C3384] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-2">
                    <LayoutGrid size={16} />
                    All Projects
                    <Badge variant="secondary" className="bg-white/10 text-white/40 border-none px-1.5 py-0 rounded text-[9px] group-data-[state=active]:text-white">
                        {filteredProjects.length}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="unclaimed" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#FFC800] data-[state=active]:text-[#1C3384] data-[state=active]:shadow-lg transition-all h-full gap-2">
                    <Inbox size={16} />
                    Unclaimed
                    <Badge variant="secondary" className="bg-[#1C3384]/10 text-[#1C3384] border-none px-1.5 py-0 rounded text-[9px]">
                        {unclaimed.length}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="mine" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#38A169] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-2">
                    <UserCheck size={16} />
                    My Desk
                    <Badge variant="secondary" className="bg-white/20 text-white border-none px-1.5 py-0 rounded text-[9px]">
                        {myProjects.length}
                    </Badge>
                </TabsTrigger>
                <TabsTrigger value="assigned" className="rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-2">
                    <Lock size={16} />
                    Assigned
                    <Badge variant="secondary" className="bg-white/20 text-white border-none px-1.5 py-0 rounded text-[9px]">
                        {assignedToMe.length}
                    </Badge>
                </TabsTrigger>
            </TabsList>

            <div className="relative w-full lg:max-w-md group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={20} />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search pool archive..." 
                    className="pl-12 h-14 bg-white border-slate-200 rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 focus-visible:border-[#1C3384] transition-all shadow-sm w-full font-medium"
                />
            </div>
        </div>

        {/* 📋 Content Area */}
        <TabsContent value="all" className="mt-0 focus-visible:outline-none">
            {filteredProjects.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                    <Inbox size={48} className="opacity-20" />
                    <p className="font-black uppercase tracking-widest text-[10px]">Project pool is currently empty</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-6">
                    {filteredProjects.map((project: any) => (
                        <ProjectPoolCard key={project.id} project={project} />
                    ))}
                </div>
            )}
        </TabsContent>

        <TabsContent value="unclaimed" className="mt-0 focus-visible:outline-none">
             <div className="grid grid-cols-1 gap-6">
                {unclaimed.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                        <Inbox size={48} className="opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[10px]">No unclaimed projects available</p>
                    </div>
                ) : (
                    unclaimed.map((project: any) => (
                        <ProjectPoolCard key={project.id} project={project} />
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="mine" className="mt-0 focus-visible:outline-none">
             <div className="grid grid-cols-1 gap-6">
                {myProjects.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                        <UserCheck size={48} className="opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Your desk is clear</p>
                    </div>
                ) : (
                    myProjects.map((project: any) => (
                        <ProjectPoolCard key={project.id} project={project} />
                    ))
                )}
            </div>
        </TabsContent>

        <TabsContent value="assigned" className="mt-0 focus-visible:outline-none">
             <div className="grid grid-cols-1 gap-6">
                {assignedToMe.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                        <Lock size={48} className="opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[10px]">No direct assignments found</p>
                    </div>
                ) : (
                    assignedToMe.map((project: any) => (
                        <ProjectPoolCard key={project.id} project={project} />
                    ))
                )}
            </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
