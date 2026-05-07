"use client";

import dynamic from "next/dynamic";


import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Shield, FastForward, ArrowRight, ListTodo, Clock, Eye, DownloadCloud, Settings, Split } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { forwardProject, updateSanctionedLoad } from "@/app/actions/project";
import { claimProject as claimEng, unclaimProject as unclaimEng } from "@/lib/actions/engineering";
import { claimProject as claimExec, unclaimProject as unclaimExec } from "@/lib/actions/execution";
import { DocumentationVault } from "./DocumentationVault";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
const Project360Modal = dynamic(() => import("@/components/dashboard/Project360Modal").then(mod => mod.Project360Modal), { ssr: false });
import { useUser } from "@clerk/nextjs";

interface ProjectHandoffCardProps {
  project: any;
  dept: string;
  initialFiles: any[];
}

const PIPELINE_STAGES = [
  "SITE_SURVEY", "DETAILED_ENGG",
  "WORK_ORDER", "HANDOVER_TO_EXECUTION", "MATERIAL_PROCUREMENT",
  "STRUCTURE_ERECTION", "PV_PANEL_INSTALLATION", "AC_DC_INSTALLATION",
  "NET_METERING", "FINAL_HANDOVER"
];

const DEPARTMENTS = ["Sales", "Engineering", "Execution", "Accounts"];

export function ProjectHandoffCard({ project, dept, initialFiles }: ProjectHandoffCardProps) {
  const [canHandoff, setCanHandoff] = useState(initialFiles.some(f => f.category === "LIAISONING" && f.uploadedAtStage === project.stage) || dept === 'ENGINEERING'); // Engineering uses technical files usually handled by the vault internally
  const [modalOpen, setModalOpen] = useState(false);
  const [sanctionedInput, setSanctionedInput] = useState(project.sanctionedLoad?.replace(" kW", "") || "");
  const [isSavingLoad, setIsSavingLoad] = useState(false);
  const [isForwarding, setIsForwarding] = useState(false);

  const { user } = useUser();
  const role = user?.publicMetadata?.role as string;
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';

  const currentIndex = PIPELINE_STAGES.indexOf(project.stage);
  const selectableStages = isOwner 
    ? PIPELINE_STAGES 
    : [project.stage, PIPELINE_STAGES[currentIndex + 1]].filter(Boolean);

  const salesHandover = initialFiles.find((f: any) => f.category === "HANDOVER_SHEET");

  const handleUpdateSanctioned = async () => {
    setIsSavingLoad(true);
    const toastId = toast.loading("Updating sanctioned load...");
    try {
      const val = sanctionedInput.trim() ? `${sanctionedInput.trim()} kW` : null;
      await updateSanctionedLoad(project.id, val);
      toast.success("Sanctioned load updated", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to update sanctioned load", { id: toastId });
    } finally {
      setIsSavingLoad(false);
    }
  };

  async function handleHandoff(formData: FormData) {
    setIsForwarding(true);
    const toastId = toast.loading("Authorizing project relay...");
    formData.append("currentStage", project.stage);
    try {
      await forwardProject(formData);
      toast.success("Project successfully forwarded", { id: toastId });
    } catch (e: any) {
      toast.error(e.message || "Failed to forward project", { id: toastId });
    } finally {
      setIsForwarding(false);
    }
  }

  const handleClaim = async () => {
    const toastId = toast.loading("Processing claim...");
    try {
      if (dept.toUpperCase() === 'ENGINEERING') {
        await claimEng(project.id);
      } else if (dept.toUpperCase() === 'EXECUTION') {
        await claimExec(project.id);
      }
      toast.success("Project claimed successfully", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to claim project", { id: toastId });
    }
  };

  const handleUnclaim = async () => {
    const toastId = toast.loading("Releasing claim...");
    try {
      if (dept.toUpperCase() === 'ENGINEERING') {
        await unclaimEng(project.id);
      } else if (dept.toUpperCase() === 'EXECUTION') {
        await unclaimExec(project.id);
      }
      toast.success("Project released", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to release claim", { id: toastId });
    }
  };

  return (
    <Card className="overflow-hidden border-none ring-0 p-0 shadow-xl bg-white [contain:paint] will-change-transform group rounded-[2.5rem] transition-all hover:shadow-2xl hover:border-[#1C3384]/20">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Left Section: Project Details */}
        <div className="lg:col-span-2 p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-[#1C3384]/5 text-[#1C3384] font-black px-4 py-1.5 uppercase tracking-[0.15em] text-[9px] border-none rounded-full">
                {project.stage?.replace(/_/g, ' ')}
              </Badge>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                REF: <span className="text-slate-900 font-black">{project.name.split(' ')[0]}</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
              {project.claimedByUserId ? (
                <div className="flex items-center gap-2">
                  <Badge className={cn(
                    "font-black px-3 py-1 uppercase tracking-wider text-[8px] rounded-full",
                    project.claimedByUserId === user?.id 
                      ? "bg-green-100 text-green-700" 
                      : "bg-slate-100 text-slate-500"
                  )}>
                    {project.claimedByUserId === user?.id 
                      ? "Claimed by you" 
                      : `Claimed by ${project.claimedBy?.email?.split('@')[0]}`}
                  </Badge>
                  {(project.claimedByUserId === user?.id || isOwner) && (
                    <button 
                      onClick={handleUnclaim}
                      className="text-[8px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors"
                    >
                      [Release]
                    </button>
                  )}
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleClaim}
                  className="h-7 px-3 rounded-full border-slate-200 text-slate-500 font-black text-[8px] uppercase tracking-widest hover:bg-[#1C3384] hover:text-white transition-all"
                >
                  Claim Project
                </Button>
              )}
              <Button 
                variant="ghost" 
                onClick={() => setModalOpen(true)}
                className="h-9 px-4 rounded-full bg-slate-50 hover:bg-[#1C3384] hover:text-white text-slate-500 font-black text-[9px] uppercase tracking-widest transition-all gap-2"
              >
                <Eye size={14} /> Inspect Data
              </Button>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
              <h3 className="text-3xl font-black tracking-tight group-hover:text-[#1C3384] transition-colors text-[#0F172A] font-[family-name:var(--font-montserrat)] uppercase">
                {project.name}
              </h3>
              
              {dept === 'ENGINEERING' && (
                <div className="flex flex-col gap-2 shrink-0">
                    {salesHandover && (
                        <a 
                            href={salesHandover.fileUrl || `/api/files/proxy?url=${encodeURIComponent(salesHandover.content)}`}
                            target="_blank" rel="noreferrer"
                            className="bg-[#1C3384]/10 hover:bg-[#1C3384]/20 text-[#1C3384] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-[#1C3384]/10"
                        >
                            <DownloadCloud size={14} /> Sales Handover XML
                        </a>
                    )}
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 relative shadow-inner">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-slate-400 pl-2">Sanctioned Load</Label>
                        <div className="flex items-center gap-1">
                            <Input 
                                value={sanctionedInput}
                                onChange={(e) => setSanctionedInput(e.target.value)}
                                className="w-16 h-7 text-xs font-bold bg-white text-center rounded-lg border-slate-200"
                            />
                            <span className="text-[10px] font-bold text-slate-400 mr-2">kW</span>
                            <Button 
                                onClick={handleUpdateSanctioned} 
                                disabled={isSavingLoad}
                                size="sm" 
                                className="h-7 w-7 p-0 rounded-lg bg-[#38A169] hover:bg-[#2F855A] text-white"
                            >
                                <Settings size={12} className={isSavingLoad ? "animate-spin" : ""} />
                            </Button>
                        </div>
                    </div>
                </div>
              )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {/* Task List */}
            <div className="space-y-6">
               <div className="flex items-center gap-2 mb-2">
                  <div className="h-6 w-6 rounded-lg bg-[#1C3384]/10 flex items-center justify-center text-[#1C3384]">
                    <ListTodo size={14} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C3384]">Current Operations</span>
               </div>
               <div className="grid gap-3">
                  {!project.tasks || project.tasks.length === 0 ? (
                    <div className="p-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-center">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest italic">No critical sub-tasks defined.</p>
                    </div>
                  ) : project.tasks.map((task: any) => (
                    <div key={task.id} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all group/task">
                       <div className="flex flex-col">
                          <span className="text-xs font-black text-[#0F172A] tracking-tight group-hover/task:text-[#1C3384] transition-colors">{task.title}</span>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-tighter mt-0.5">@ {task.assignee?.email?.split('@')[0] || "SYSTEM"}</span>
                       </div>
                       <Badge className={cn(
                          "text-[8px] font-black border-none uppercase tracking-widest px-2 py-0.5 rounded-full",
                          task.priority === 'HIGH' ? "bg-red-50 text-red-600" : "bg-blue-50 text-[#1C3384]"
                       )}>
                          {task.priority || "NORMAL"}
                       </Badge>
                    </div>
                  ))}
               </div>
               
               <div className="flex items-center gap-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                    <Clock size={12} className="text-slate-300" />
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                 </div>
                 <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-[#1C3384]">
                    <Shield size={12} className="text-[#1C3384]/40" />
                    {project.currentDepartment} CONTROL
                 </div>
               </div>
            </div>

            {/* Documentation Vault */}
            <div className="bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100 overflow-hidden relative">
              <DocumentationVault 
                projectId={project.id} 
                projectStage={project.stage}
                initialFiles={initialFiles} 
                onFilesChange={setCanHandoff}
              />
            </div>
          </div>
        </div>
        
        {/* Right Section: Handoff Protocol */}
        <div className="bg-[#1C3384] p-10 text-white relative overflow-hidden flex flex-col justify-center">
          <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none text-white scale-150">
             <FastForward size={140} />
          </div>
          
          <h4 className="font-black flex items-center gap-3 mb-8 text-[11px] uppercase tracking-[0.25em] text-[#FFC800] font-[family-name:var(--font-montserrat)] relative z-10">
            <div className="h-5 w-5 rounded-full bg-[#FFC800]/20 flex items-center justify-center">
              <FastForward size={12} />
            </div>
            Transfer Protocol
          </h4>

          {dept === 'ENGINEERING' && (
            <div className="mb-6 p-4 bg-white/10 rounded-2xl border border-white/10">
                <div className="flex items-center gap-2 mb-2 text-[#FFC800]">
                    <Split size={14} />
                    <span className="text-[9px] font-black uppercase tracking-widest">Dual-Track Dispatch</span>
                </div>
                <p className="text-[10px] font-medium text-white/70 leading-relaxed">
                    Engineering triggers a parallel workflow. Liaisoning starts grid approvals while Execution begins site work. Next target: <strong className="text-white">LIAISONING</strong> or <strong className="text-white">EXECUTION</strong>.
                </p>
            </div>
          )}

          <form 
            action={handleHandoff} 
            className="space-y-6 relative z-10"
          >
            <input type="hidden" name="projectId" value={project.id} />
            <div className="space-y-2">
              <Label htmlFor="nextStage" className="text-[9px] font-black uppercase tracking-widest text-blue-200 opacity-60">Strategic Milestone</Label>
              <Select key={project.stage} name="nextStage" defaultValue={project.stage}>
                <SelectTrigger id="nextStage" className="bg-white/10 border-white/10 text-white rounded-2xl h-11">
                  <SelectValue placeholder="Select Stage" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {selectableStages.map(stage => (
                    <SelectItem key={stage} value={stage} className="text-xs font-bold uppercase tracking-tight">{stage.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="department" className="text-[9px] font-black uppercase tracking-widest text-blue-200 opacity-60">Target Directive</Label>
              <Select key={dept} name="department" defaultValue={dept}>
                <SelectTrigger id="department" className="bg-white/10 border-white/10 text-white rounded-2xl h-11">
                  <SelectValue placeholder="Select Dept" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  {DEPARTMENTS.map(d => (
                    <SelectItem key={d} value={d} className="text-xs font-bold uppercase tracking-tight">{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment" className="text-[9px] font-black uppercase tracking-widest text-blue-200 opacity-60">Operational Brief</Label>
              <Textarea 
                name="comment" 
                id="comment" 
                placeholder="Log critical observations..." 
                className="text-xs bg-white/10 border-white/10 text-white h-28 rounded-[1.5rem] resize-none focus:ring-0 placeholder:text-white/20 transition-all font-medium leading-relaxed"
                required
              />
            </div>

            <Tooltip 
              content="Upload FEASIBILITY APPROVED to unlock handoff." 
              enabled={!canHandoff}
            >
              <Button 
                type="submit" 
                disabled={!canHandoff || isForwarding}
                className="w-full h-14 font-black rounded-2xl bg-[#FFC800] text-[#1C3384] hover:bg-[#FFD700] transition-all active:scale-95 group shadow-xl flex items-center justify-center gap-3 disabled:bg-white/5 disabled:text-white/20 disabled:shadow-none"
              >
                {isForwarding ? "PROCESSING..." : (canHandoff ? "AUTHORIZE RELAY" : "LOCKED BY VAULT")} 
                {isForwarding ? <Settings className="h-5 w-5 animate-spin" /> : (canHandoff ? <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /> : <Shield size={18} className="opacity-20" />)}
              </Button>
            </Tooltip>
          </form>
        </div>
      </div>
      <Project360Modal 
        projectId={project.id} 
        open={modalOpen} 
        onOpenChange={setModalOpen} 
        initialData={project}
      />
    </Card>
  );
}
