"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { 
  Clock, 
  Paperclip, 
  MessageSquare, 
  CornerDownRight, 
  MoreHorizontal,
  ChevronRight,
  Zap
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { quickAddTask } from "@/app/actions/project";
import { useTransition, useState } from "react";
import { Project360Modal } from "@/components/dashboard/Project360Modal";

interface RubyProjectCardProps {
  project: any;
}

const STAGES = [
  "PROSPECT", "SITE_SURVEY", "PRELIMINARY_QUOTE", "DETAILED_ENGG",
  "WORK_ORDER", "HANDOVER_TO_EXECUTION", "MATERIAL_PROCUREMENT",
  "STRUCTURE_ERECTION", "PV_PANEL_INSTALLATION", "AC_DC_INSTALLATION",
  "NET_METERING", "FINAL_HANDOVER"
];

const EXECUTION_STAGES = ["SURVEY", "STRUCTURE", "PANEL_INSTALL", "INVERTER_WIRING"];
const LIASONING_STAGES = ["NOT_STARTED", "FEASIBILITY", "L1_APPROVED", "AGREEMENT", "COMMISSIONED"];

export function RubyProjectCard({ project }: RubyProjectCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  
  const execIndex = EXECUTION_STAGES.indexOf(project.executionStage || "SURVEY");
  const liasonIndex = LIASONING_STAGES.indexOf(project.liasoningStage || "NOT_STARTED");

  const execProgress = Math.round(((execIndex + 1) / EXECUTION_STAGES.length) * 100);
  const liasonProgress = Math.round(((liasonIndex + 1) / LIASONING_STAGES.length) * 100);

  async function handleQuickAdd(formData: FormData) {
    startTransition(async () => {
      await quickAddTask(formData);
    });
  }

  return (
    <Card className={cn(
      "group relative border-2 transition-all duration-500 bg-white rounded-2xl overflow-hidden mb-4 shadow-sm",
      project.isBottlenecked 
        ? "border-[#FF4D4D] shadow-[0_0_15px_rgba(255,77,77,0.1)]" 
        : "border-slate-100 hover:border-slate-200"
    )}>
      <CardContent className="p-0">
        
        {/* Ribbon Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 bg-slate-50/30">
           <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-[#FFC800] flex items-center justify-center shadow-lg shadow-yellow-400/20">
                 <Zap size={16} className="text-[#1C3384] fill-[#1C3384]" />
              </div>
              <div className="flex flex-col">
                 <h3 className="text-sm font-black text-[#0F172A] uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
                   {project.name}
                 </h3>
                 <p className="text-[10px] font-black text-[#64748B] uppercase tracking-widest leading-none">
                   ID: {project.id.slice(-6)}
                 </p>
              </div>
           </div>
           <div className="flex items-center gap-2">
              {project.isBottlenecked && (
                <Badge className="bg-[#FF4D4D] text-white font-black text-[9px] px-2 py-0.5 rounded-lg border-none">
                  BOTTLENECKED
                </Badge>
              )}
              <Badge className="bg-[#1C3384] text-white font-black text-[9px] px-2 py-0.5 rounded-lg border-none">
                 {project.stage.replace(/_/g, ' ')}
              </Badge>
           </div>
        </div>

        <div className="p-6 space-y-5">
           
           {/* Dual Progress Visualizer */}
           <div className="grid grid-cols-2 gap-6">
              {/* Execution Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                   <span className="flex items-center gap-1.5"><Zap size={10} /> Execution</span>
                   <span className="text-[#1C3384]">{execProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[#EDF2F7] rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                   <div 
                     className="h-full bg-[#1C3384] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(28,51,132,0.4)]" 
                     style={{ width: `${execProgress}%` }} 
                   />
                </div>
              </div>

              {/* Liaisoning Progress */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-[#64748B]">
                   <span className="flex items-center gap-1.5"><ShieldCheck size={10} /> Liaisoning</span>
                   <span className="text-[#FFC800]">{liasonProgress}%</span>
                </div>
                <div className="h-2 w-full bg-[#EDF2F7] rounded-full overflow-hidden p-0.5 border border-slate-100 shadow-inner">
                   <div 
                     className="h-full bg-[#FFC800] rounded-full transition-all duration-1000 shadow-[0_0_8px_rgba(255,200,0,0.4)]" 
                     style={{ width: `${liasonProgress}%` }} 
                   />
                </div>
              </div>
           </div>

           {/* Metadata & Assignees */}
           <div className="flex items-center justify-between py-2 border-t border-slate-50 mt-4 pt-4">
              <div className="flex items-center gap-4">
                 <div className="flex items-center gap-1 text-[10px] font-medium text-[#64748B] font-[family-name:var(--font-geist-sans)]">
                    <Clock size={12} className="text-[#64748B]/50" />
                    {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                 </div>
                 <div className="flex items-center gap-1 text-[10px] font-medium text-[#64748B] font-[family-name:var(--font-geist-sans)]">
                    <Building2 size={12} className="text-[#64748B]/50" />
                    {project.currentDepartment}
                 </div>
              </div>
              <div className="flex -space-x-2">
                 {[1, 2].map(i => (
                   <div key={i} className="h-6 w-6 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold text-slate-400">
                     <User size={12} />
                   </div>
                 ))}
                 <div className="h-6 w-6 rounded-full border-2 border-white bg-[#1C3384] text-white text-[8px] flex items-center justify-center font-black shadow-sm">+1</div>
              </div>
           </div>

           {/* Quick Task Input Box */}
           <div className="relative pt-2">
              <form action={handleQuickAdd} className="relative group/input">
                 <input type="hidden" name="projectId" value={project.id} />
                 <Input 
                   name="title" 
                   placeholder="Log site update..." 
                   className="pl-9 pr-12 py-5 bg-slate-50/50 border-slate-100 focus-visible:ring-[#1C3384] focus-visible:bg-white rounded-xl text-xs font-medium transition-all font-[family-name:var(--font-geist-sans)]"
                   required
                 />
                 <CornerDownRight size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within/input:text-[#1C3384] transition-colors" />
                 <Button 
                   type="submit" 
                   disabled={isPending}
                   className="absolute right-1.5 top-1/2 -translate-y-1/2 h-7 px-2.5 bg-[#1C3384] text-white hover:bg-[#0F172A] rounded-lg text-[9px] font-black opacity-0 group-focus-within/input:opacity-100 transition-all scale-90 group-focus-within/input:scale-100"
                 >
                   {isPending ? "..." : "ADD"}
                 </Button>
              </form>
           </div>
        </div>

        {/* Action Bar */}
        <div className={cn(
          "flex items-center justify-between px-6 py-3 transition-colors",
          project.isBottlenecked ? "bg-[#FF4D4D]" : "bg-[#1C3384]"
        )}>
           <p className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-2">
              <span className={cn(
                "h-1.5 w-1.5 rounded-full bg-white",
                project.isBottlenecked ? "bg-red-200" : "bg-emerald-400"
              )} />
              {project.isBottlenecked ? "Action Required: Liaisoning Stalled" : "Status: Operational"}
           </p>
           <Button 
             variant="ghost" 
             size="sm" 
             onClick={() => setIsDetailsOpen(true)}
             className="text-[10px] font-black text-[#FFC800] uppercase tracking-widest hover:bg-white/10 p-0 h-auto"
           >
              Inspect Data <ChevronRight size={12} className="ml-0.5" />
           </Button>
        </div>

        <Project360Modal 
          projectId={project.id} 
          open={isDetailsOpen} 
          onOpenChange={setIsDetailsOpen} 
        />

      </CardContent>
    </Card>
  );
}

import { ShieldCheck, Building2, User } from "lucide-react";
