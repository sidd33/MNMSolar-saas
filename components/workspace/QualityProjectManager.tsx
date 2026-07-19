"use client";

import { useState, useEffect } from "react";
import { QualityProjectSidebar, QualitySection } from "./QualityProjectSidebar";
import { QualitySnagsModule } from "./QualitySnagsModule";
import { FieldUploadModule } from "./FieldUploadModule";
import { DocsVaultModule } from "./DocsVaultModule";
import { 
    ChevronLeft,
    RefreshCcw,
    ShieldAlert
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ProjectErrorBoundary } from "./ProjectErrorBoundary";

interface QualityProjectManagerProps {
    project: any;
    forcedSection?: string;
}

export function QualityProjectManager({ project, forcedSection }: QualityProjectManagerProps) {
    const [activeSection, setActiveSection] = useState<QualitySection>((forcedSection as QualitySection) || "QUALITY_SNAGS");
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState(Date.now());

    // Update section if forcedSection changes (e.g., from URL navigation)
    useEffect(() => {
        if (forcedSection) {
            setActiveSection(forcedSection as QualitySection);
        }
    }, [forcedSection]);

    const handleRefresh = () => {
        setIsRefreshing(true);
        setTimeout(() => {
            setLastRefresh(Date.now());
            setIsRefreshing(false);
        }, 1000);
    };

    const renderMainContent = () => {
        switch (activeSection) {
            case "QUALITY_SNAGS": return <QualitySnagsModule project={project} refresh={handleRefresh} key={lastRefresh} />;
            case "FIELD_GALLERY": return <FieldUploadModule project={project} refresh={handleRefresh} key={lastRefresh} />;
            case "DOCS_VAULT": return <DocsVaultModule project={project} />;
            default: return <QualitySnagsModule project={project} refresh={handleRefresh} key={lastRefresh} />;
        }
    };

    return (
        <div className="flex h-full w-full bg-slate-50/50">
            {/* Sidebar */}
            <div className="w-64 border-r border-slate-200 shrink-0 bg-white">
                <QualityProjectSidebar 
                    activeSection={activeSection}
                    onChange={setActiveSection}
                    project={project}
                />
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0">
                
                {/* Topbar */}
                <div className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 shrink-0 shadow-sm z-10">
                    <div className="flex items-center gap-4">
                        <Link href={`/dashboard/quality`} className="h-8 w-8 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors group">
                            <ChevronLeft size={18} className="text-slate-400 group-hover:text-slate-700" />
                        </Link>
                        
                        <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 border-slate-200">
                                    {project.stage.replace(/_/g, ' ')}
                                </Badge>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{project.clientName}</span>
                            </div>
                            <h2 className="text-sm font-black text-slate-800 uppercase tracking-tight">{project.name}</h2>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button 
                            onClick={handleRefresh}
                            disabled={isRefreshing}
                            className="flex items-center gap-2 h-9 px-4 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors bg-white border border-slate-200 shadow-sm"
                        >
                            <RefreshCcw size={14} className={cn(isRefreshing && "animate-spin")} />
                            {isRefreshing ? "Syncing..." : "Sync"}
                        </button>
                    </div>
                </div>

                {/* Content Container */}
                <div className="flex-1 overflow-hidden p-6 relative">
                    <ProjectErrorBoundary key={activeSection}>
                        {renderMainContent()}
                    </ProjectErrorBoundary>
                </div>
            </div>
        </div>
    );
}
