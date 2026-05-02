"use client";

import { useState, useEffect } from "react";
import { 
    ExecutionProjectSidebar, 
    ExecutionSection 
} from "./ExecutionProjectSidebar";
import { ProcurementModule } from "./ProcurementModule";
import { SafetyModule } from "./SafetyModule";
import SiteWorkModule from "./SiteWorkModule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ExternalLink, Share2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { claimProject, unclaimProject } from "@/lib/actions/execution";
import { toast } from "sonner";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";

interface ExecutionProjectManagerProps {
    project: any;
    onBack?: () => void;
    forcedSection?: ExecutionSection;
}

export function ExecutionProjectManager({ project, onBack, forcedSection }: ExecutionProjectManagerProps) {
    const [activeSection, setActiveSection] = useState<ExecutionSection>(forcedSection || "PROCUREMENT");
    const { refresh } = useDashboardNexus();
    const { user } = useUser();
    const role = user?.publicMetadata?.role as string;
    const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';

    // Sync state if forcedSection changes
    useEffect(() => {
        if (forcedSection) {
            setActiveSection(forcedSection);
        }
    }, [forcedSection]);

    const handleClaim = async () => {
        const toastId = toast.loading("Processing claim...");
        try {
          await claimProject(project.id);
          toast.success("Project claimed successfully", { id: toastId });
          refresh();
        } catch (err: any) {
          toast.error(err.message || "Failed to claim project", { id: toastId });
        }
    };

    const handleUnclaim = async () => {
        const toastId = toast.loading("Releasing claim...");
        try {
          await unclaimProject(project.id);
          toast.success("Project released", { id: toastId });
          refresh();
        } catch (err: any) {
          toast.error(err.message || "Failed to release claim", { id: toastId });
        }
    };

    const renderMainContent = () => {
        switch (activeSection) {
            case "PROCUREMENT":
                return <ProcurementModule project={project} />;
            case "SAFETY":
                return <SafetyModule project={project} />;
            case "SITE_WORK":
                return <SiteWorkModule project={project} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-slate-300">
                             <AlertCircle size={40} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Module Pending</h4>
                            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Specific technical workflows for {activeSection.replace('_', ' ')} are coming in the next sync phase.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex flex-col gap-6 animate-in fade-in duration-700">
            {/* 📍 Top Context Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-slate-200 shadow-sm">
                <div className="flex items-center gap-5">
                    {onBack && (
                        <button 
                            onClick={onBack}
                            className="h-12 w-12 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all active:scale-95"
                        >
                            <ChevronLeft size={24} />
                        </button>
                    )}
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 mb-1">
                            <Badge className="bg-[#1C3384] text-white font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-lg border-none">
                                {project.executionStage?.replace(/_/g, ' ') || 'SITE SETUP'}
                            </Badge>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{project.clientName || "Direct Project"}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none font-[family-name:var(--font-montserrat)]">
                            {project.name}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {project.claimedByUserId ? (
                        <div className="flex items-center gap-2 mr-2">
                            <Badge className={cn(
                                "font-black px-4 py-2 uppercase tracking-wider text-[9px] rounded-xl shadow-sm",
                                project.claimedByUserId === user?.id 
                                ? "bg-green-100 text-green-700 border border-green-200" 
                                : "bg-slate-100 text-slate-500 border border-slate-200"
                            )}>
                                {project.claimedByUserId === user?.id 
                                ? "You are handling this site" 
                                : `Handled by ${project.claimedBy?.email?.split('@')[0]}`}
                            </Badge>
                            {(project.claimedByUserId === user?.id || isOwner) && (
                                <button 
                                    onClick={handleUnclaim}
                                    className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-red-500 transition-colors bg-slate-50 px-3 py-2 rounded-xl border border-slate-100"
                                >
                                    Release
                                </button>
                            )}
                        </div>
                    ) : (
                        <Button 
                            onClick={handleClaim}
                            className="h-12 px-6 rounded-2xl bg-[#FFC800] text-[#1C3384] font-black text-[10px] uppercase tracking-widest hover:bg-[#FFD700] transition-all shadow-lg shadow-yellow-400/20 mr-2"
                        >
                            Claim this Site
                        </Button>
                    )}
                    <button 
                        disabled
                        className="h-12 px-6 rounded-2xl border border-slate-100 bg-slate-50 text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex items-center cursor-not-allowed opacity-60"
                    >
                        <Share2 size={16} /> Share Site Reports (Soon)
                    </button>
                    <button 
                        disabled
                        className="h-12 px-6 rounded-2xl bg-slate-100 text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all gap-2 flex items-center cursor-not-allowed opacity-60"
                    >
                        <ExternalLink size={16} /> Site Vault (Soon)
                    </button>
                </div>
            </div>

            {/* 🏗️ Core Layout: Sidebar + Content */}
            <div className="flex flex-col lg:flex-row gap-6 items-start">
                <ExecutionProjectSidebar 
                    activeSection={activeSection} 
                    onChange={setActiveSection} 
                    project={project}
                />

                <Card className="flex-1 w-full bg-white border border-slate-200 shadow-sm rounded-[3rem] p-8 min-h-[600px] overflow-hidden">
                    {renderMainContent()}
                </Card>
            </div>
        </div>
    );
}
