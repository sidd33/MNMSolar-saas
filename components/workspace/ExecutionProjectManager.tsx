"use client";

import { useState, useEffect } from "react";
import { 
    ExecutionProjectSidebar, 
    ExecutionSection 
} from "./ExecutionProjectSidebar";

import { FieldUploadModule } from "./FieldUploadModule";
import { DocsVaultModule } from "./DocsVaultModule";
import { DailyProgressModule } from "./DailyProgressModule";
import { TechnicalChecklistModule } from "./TechnicalChecklistModule";
import { HandoverModule } from "./HandoverModule";
import { SiteReceiptModule } from "./SiteReceiptModule";
import { QualitySnagsModule } from "./QualitySnagsModule";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ExternalLink, Share2, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { claimProject, unclaimProject } from "@/lib/actions/execution";
import { updateExecutionMetadata } from "@/lib/actions/execution";

import { toast } from "sonner";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import { forwardProject } from "@/app/actions/project";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ExecutionProjectManagerProps {
    project: any;
    onBack?: () => void;
    forcedSection?: ExecutionSection;
}

export function ExecutionProjectManager({ project, onBack, forcedSection }: ExecutionProjectManagerProps) {
    const [activeSection, setActiveSection] = useState<ExecutionSection>(forcedSection || "FIELD_UPLOAD");
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
            case "FIELD_UPLOAD":
                return <FieldUploadModule project={project} />;
            case "DOCS":
                return <DocsVaultModule project={project} />;
            case "SITE_RECEIPT":
                return <SiteReceiptModule project={project} />;
            case "DAILY_PROGRESS":
                return <DailyProgressModule project={project} />;
            case "TESTING":
                return <TechnicalChecklistModule project={project} />;
            case "HANDOVER":
                return <HandoverModule project={project} />;
            case "QUALITY":
                return <QualitySnagsModule project={project} refresh={refresh} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center p-20 text-center space-y-4 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="h-20 w-20 rounded-3xl bg-white shadow-xl flex items-center justify-center text-slate-300">
                             <AlertCircle size={40} />
                        </div>
                        <div>
                            <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Module Pending</h4>
                            <p className="text-sm font-medium text-slate-500 max-w-xs mx-auto">Specific technical workflows for {String(activeSection).replace('_', ' ')} are coming in the next sync phase.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-full overflow-hidden">
            
            {/* 🏗️ Core Layout: Sidebar + Content */}
            {/* LEFT PANEL — 20% width, full height, dark navy */}
            <div className="w-[20%] shrink-0 h-full overflow-y-auto hidden lg:flex flex-col bg-gradient-to-b from-[#0f1f54] to-[#1C3384] border-r border-white/5">
                <ExecutionProjectSidebar 
                    activeSection={activeSection} 
                    onChange={setActiveSection} 
                    project={project}
                />
            </div>

            {/* RIGHT PANEL — 80% width, full height */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
                
                {/* 📍 Top Context Bar */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-8 pt-8 pb-4 shrink-0 z-10">
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
                                : `Handled by ${project.claimedBy?.name || project.claimedBy?.email?.split('@')[0]}`}
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

                {(() => {
                    let openSnagsCount = 0;
                    const metadata = project.executionMetadata || {};
                    let snags = [];
                    if (Array.isArray(metadata.snags)) snags = metadata.snags;
                    else if (metadata.snags?.records) snags = metadata.snags.records;
                    else if (typeof metadata.snags === 'object') snags = Object.values(metadata.snags);
                    openSnagsCount = snags.filter((s: any) => s && s.id && s.status === "OPEN").length;

                    if (openSnagsCount > 0 && activeSection !== "QUALITY") {
                        return (
                            <div className="bg-red-500 text-white px-8 py-3 flex items-center justify-between shrink-0 shadow-inner z-20">
                                <div className="flex items-center gap-3">
                                    <AlertCircle size={20} className="animate-pulse" />
                                    <span className="font-bold text-sm tracking-wide">⚠️ {openSnagsCount} Open Punch Point{openSnagsCount > 1 ? 's require' : ' requires'} immediate resolution.</span>
                                </div>
                                <Button 
                                    onClick={() => setActiveSection("QUALITY")}
                                    className="bg-white text-red-600 hover:bg-red-50 text-[10px] font-black uppercase tracking-widest px-4 h-8 rounded-lg shadow-sm transition-all"
                                >
                                    View Punch List
                                </Button>
                            </div>
                        );
                    }
                    return null;
                })()}

                <div className="flex-1 w-full p-8 overflow-y-auto bg-white">
                    <div className="max-w-6xl mx-auto h-full">
                        {renderMainContent()}
                    </div>
                </div>
            </div>
        </div>
    );
}
