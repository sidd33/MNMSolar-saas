"use client";

import { Zap, Clock, TrendingUp, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface GanttSummaryProps {
  projectName: string;
  createdAt: Date;
  currentStage: string;
  isBottlenecked: boolean;
  totalTasks: number;
  completedTasks: number;
}

export function GanttSummaryStrip({ 
  projectName, 
  createdAt, 
  currentStage, 
  isBottlenecked,
  totalTasks,
  completedTasks
}: GanttSummaryProps) {
  const elapsedDays = Math.ceil((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  const expectedTotal = 60;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);

  return (
    <div className="bg-[#1C3384] px-6 py-2 flex items-center justify-between gap-6 overflow-hidden relative border-b border-white/10 max-h-[60px]">


      <div className="flex items-center gap-3 min-w-[200px] z-10">
        <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
        <h2 className="text-sm font-black text-white uppercase tracking-tight font-[family-name:var(--font-montserrat)] truncate">
            {projectName}
        </h2>
      </div>

      <div className="flex items-center gap-8 z-10">
        <div className="flex items-center gap-2">
            <Clock size={12} className="text-blue-300/40" />
            <span className="text-xs font-black text-white">{elapsedDays}<span className="text-blue-300/30 ml-1">/ {expectedTotal}d</span></span>
        </div>

        <div className="flex items-center gap-2">
            <TrendingUp size={12} className="text-[#FFC800]/60" />
            <span className="text-xs font-black text-[#FFC800]">{progressPercent}%</span>
        </div>

        <div className="flex items-center gap-2">
            <Zap size={12} className="text-blue-200/40" />
            <span className="text-[10px] font-black text-white/70 uppercase tracking-widest">
                {currentStage.replace(/_/g, ' ')}
            </span>
        </div>

        <span className={cn(
            "text-[9px] font-black uppercase px-2 py-0.5 rounded-md border",
            isBottlenecked ? "bg-red-500/20 text-red-400 border-red-500/20 animate-pulse" : 
            elapsedDays > expectedTotal ? "bg-amber-500/20 text-amber-400 border-amber-500/20" : "bg-emerald-500/20 text-emerald-400 border-emerald-500/20"
        )}>
            {isBottlenecked ? "Blocked" : elapsedDays > expectedTotal ? "Delayed" : "On Track"}
        </span>
      </div>
    </div>
  );
}
