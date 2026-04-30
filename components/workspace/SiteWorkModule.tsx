"use client";

import { SiteWorkCard } from "./SiteWorkCard";
import { 
    Hammer, 
    ShieldCheck,
    CheckCircle2,
    Clock,
    ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { forwardProject } from "@/app/actions/project";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { useState } from "react";

interface SiteWorkModuleProps {
    project: any;
}

export function SiteWorkModule({ project }: SiteWorkModuleProps) {
    const metadata = project.executionMetadata || {};
    const siteWork = metadata.siteWork || {};
    const [isOpen, setIsOpen] = useState(false);
    
    const statuses = [
        siteWork.structure || "NOT_STARTED",
        siteWork.pv || "NOT_STARTED",
        siteWork.acdc || "NOT_STARTED"
    ];
    
    const completedCount = statuses.filter(s => s === "COMPLETED").length;
    const progressPercent = Math.round((completedCount / 3) * 100);

    const handleForward = async () => {
        let nextStage = "";
        if (project.stage === "STRUCTURE_ERECTION") nextStage = "PV_PANEL_INSTALLATION";
        else if (project.stage === "PV_PANEL_INSTALLATION") nextStage = "AC_DC_INSTALLATION";
        else if (project.stage === "AC_DC_INSTALLATION") nextStage = "NET_METERING";

        if (!nextStage) {
            toast.error("No further site stages available");
            return;
        }

        const formData = new FormData();
        formData.append("projectId", project.id);
        formData.append("nextStage", nextStage);
        formData.append("department", "Execution");
        formData.append("currentStage", project.stage);

        try {
            await forwardProject(formData);
            toast.success(`Project moved to ${nextStage.replace(/_/g, ' ')}`);
            setIsOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to advance stage");
        }
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-2xl bg-[#1C3384] text-white flex items-center justify-center shadow-lg shadow-blue-900/10 rotate-2">
                        <Hammer size={28} />
                    </div>
                    <div className="space-y-1">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter leading-none font-[family-name:var(--font-montserrat)]">
                            Installation Tracker
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Site Work Phase</span>
                            <div className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{completedCount}/3 Major Stages Done</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-6 pr-4">
                    <div className="hidden sm:flex flex-col items-end gap-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Progress</span>
                        <div className="flex items-center gap-3">
                             <div className="h-2 w-32 bg-slate-200 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-emerald-500 transition-all duration-1000" 
                                    style={{ width: `${progressPercent}%` }}
                                />
                             </div>
                             <span className="text-sm font-black text-slate-700">{progressPercent}%</span>
                        </div>
                    </div>

                    <div className={cn(
                        "h-12 px-6 rounded-2xl flex items-center gap-2 transition-all",
                        progressPercent === 100 ? "bg-emerald-100 text-emerald-700" : "bg-[#FFC800]/10 text-amber-600"
                    )}>
                        {progressPercent === 100 ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {progressPercent === 100 ? "Ready for Handoff" : "Active Site"}
                        </span>
                    </div>

                    <Dialog open={isOpen} onOpenChange={setIsOpen}>
                        <DialogTrigger render={
                            <Button 
                                disabled={progressPercent < 100}
                                className="bg-[#1C3384] hover:bg-[#0F172A] text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl shadow-lg shadow-blue-900/20 gap-2"
                            >
                                <ArrowRight size={16} />
                                Forward Stage
                            </Button>
                        } />
                        <DialogContent className="rounded-[2rem] border-none shadow-2xl">
                            <DialogHeader>
                                <DialogTitle className="font-black uppercase tracking-tight text-xl text-[#1C3384]">Advance Site Stage?</DialogTitle>
                                <DialogDescription className="text-slate-500 font-medium">
                                    You are about to close the current installation phase and move to the next logical stage in the pipeline.
                                </DialogDescription>
                            </DialogHeader>
                            <DialogFooter className="gap-3 mt-4">
                                <Button 
                                    variant="outline"
                                    onClick={() => setIsOpen(false)}
                                    className="rounded-xl font-bold uppercase text-[10px] tracking-widest border-slate-200"
                                >
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleForward}
                                    className="bg-[#1C3384] hover:bg-[#0F172A] text-white rounded-xl font-bold uppercase text-[10px] tracking-widest px-8"
                                >
                                    Confirm Forward
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* 📋 Linear Installation Timeline: Horizontal Scroll + Snap */}
            <div className="flex flex-row overflow-x-auto gap-0 pb-8 scroll-smooth snap-x snap-mandatory no-scrollbar">
                {/* Stage 1: Structure */}
                <div className="flex items-center shrink-0 snap-center">
                    <div className="w-[350px] md:w-[380px]">
                        <SiteWorkCard 
                            project={project}
                            stageId="structure"
                            tag="SITE_WORK_STRUCTURE"
                            label="Structure"
                            description="Mounting & alignment"
                        />
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center px-4 text-slate-300">
                        <ArrowRight size={24} className="animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-2">Next Stage</span>
                    </div>
                </div>
                
                {/* Stage 2: PV Install */}
                <div className="flex items-center shrink-0 snap-center">
                    <div className="w-[350px] md:w-[380px]">
                        <SiteWorkCard 
                            project={project}
                            stageId="pv"
                            tag="SITE_WORK_PV"
                            label="PV Install"
                            description="Mod. mounting & strings"
                        />
                    </div>
                    <div className="hidden md:flex flex-col items-center justify-center px-4 text-slate-300">
                        <ArrowRight size={24} className="animate-pulse" />
                        <span className="text-[8px] font-black uppercase tracking-[0.2em] mt-2">Final Stage</span>
                    </div>
                </div>
                
                {/* Stage 3: AC/DC Work */}
                <div className="flex items-center shrink-0 snap-center pr-10">
                    <div className="w-[350px] md:w-[380px]">
                        <SiteWorkCard 
                            project={project}
                            stageId="acdc"
                            tag="SITE_WORK_ACDC"
                            label="AC/DC Work"
                            description="Inverters & terminations"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-blue-50/50 border border-blue-100 p-6 rounded-[2.5rem] flex items-start gap-4">
                <div className="h-10 w-10 rounded-2xl bg-white text-blue-500 flex items-center justify-center shrink-0 border border-blue-100">
                    <ShieldCheck size={20} />
                </div>
                <div className="space-y-1">
                    <h5 className="text-[10px] font-black text-[#1C3384] uppercase tracking-widest">Engineer Guidance</h5>
                    <p className="text-xs font-medium text-slate-500 leading-relaxed">
                        Ensure all installation stages reach "Verified" status before closing the Site Work phase. 
                        A stage is automatically verified once at least 2 evidence photos are uploaded and the status is active.
                    </p>
                </div>
            </div>
        </div>
    );
}

export default SiteWorkModule;
