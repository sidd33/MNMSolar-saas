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

  // 1. Truly Unclaimed: No official assignment and no self-claim
  const unclaimed = filteredProjects.filter((p: any) => 
    !p.assignedToEngineerId && !p.claimedByUserId
  );
  
  // 2. My Desk: All projects the user is responsible for (either self-claimed OR officially assigned)
  const myDeskProjects = filteredProjects.filter((p: any) => 
    p.claimedByUserId === user?.id || 
    p.assignedToEngineerId === user?.id ||
    p.assignedEngineers?.some((eng: any) => eng.id === user?.id)
  );
  
  // 3. Assigned to Me: Only official assignments from a manager to this user
  const assignedToMe = filteredProjects.filter((p: any) => 
    p.assignedToEngineerId === user?.id
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 w-full">
      {/* Header */}
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
        <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
            <TabsList className="bg-slate-100/50 border border-slate-200/60 p-1.5 rounded-2xl h-14 w-full lg:w-auto">
                <TabsTrigger value="all" className="group rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#1C3384] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-3">
                    <LayoutGrid size={16} />
                    All Projects
                    <Badge className="bg-slate-200 text-slate-600 group-data-[state=active]:bg-white group-data-[state=active]:text-[#1C3384] border-none px-2 py-0.5 rounded-full text-[10px] font-black transition-colors">
                        {filteredProjects.length}
                    </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="unclaimed" className="group rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#FFC800] data-[state=active]:text-[#1C3384] data-[state=active]:shadow-lg transition-all h-full gap-3">
                    <Inbox size={16} />
                    Unclaimed
                    <Badge className="bg-slate-200 text-slate-600 group-data-[state=active]:bg-[#1C3384] group-data-[state=active]:text-white border-none px-2 py-0.5 rounded-full text-[10px] font-black transition-colors">
                        {unclaimed.length}
                    </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="mine" className="group rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-[#38A169] data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-3">
                    <UserCheck size={16} />
                    My Desk
                    <Badge className="bg-slate-200 text-slate-600 group-data-[state=active]:bg-white group-data-[state=active]:text-[#38A169] border-none px-2 py-0.5 rounded-full text-[10px] font-black transition-colors">
                        {myDeskProjects.length}
                    </Badge>
                </TabsTrigger>
                
                <TabsTrigger value="assigned" className="group rounded-xl px-8 font-black uppercase tracking-widest text-[11px] data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all h-full gap-3">
                    <Lock size={16} />
                    Assigned
                    <Badge className="bg-slate-200 text-slate-600 group-data-[state=active]:bg-white group-data-[state=active]:text-blue-600 border-none px-2 py-0.5 rounded-full text-[10px] font-black transition-colors">
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

        {/* Content Area */}
        <TabsContent value="all" className="mt-0 focus-visible:outline-none">
            <div className="grid grid-cols-1 gap-6">
                {filteredProjects.map((project: any) => (
                    <ProjectPoolCard key={project.id} project={project} />
                ))}
            </div>
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
                {myDeskProjects.length === 0 ? (
                    <div className="h-64 flex flex-col items-center justify-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200 text-slate-400 gap-3">
                        <UserCheck size={48} className="opacity-20" />
                        <p className="font-black uppercase tracking-widest text-[10px]">Your desk is clear</p>
                    </div>
                ) : (
                    myDeskProjects.map((project: any) => (
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
