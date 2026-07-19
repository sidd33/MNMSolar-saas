"use client";

import { 
    Camera, 
    FolderOpen, 
    ShieldAlert,
    CheckCircle2,
    CircleDashed,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type QualitySection = "QUALITY_SNAGS" | "FIELD_GALLERY" | "DOCS_VAULT";

interface SidebarItem {
    id: QualitySection;
    label: string;
    icon: any;
    subtitle: string;
    group: "AUDIT_TOOLS" | "REFERENCE";
}

const ITEMS: SidebarItem[] = [
    { id: "QUALITY_SNAGS", label: "Punch List", icon: ShieldAlert, subtitle: "Track & verify defects", group: "AUDIT_TOOLS" },
    { id: "FIELD_GALLERY", label: "Execution Photos", icon: Camera, subtitle: "Review site progress", group: "AUDIT_TOOLS" },
    { id: "DOCS_VAULT", label: "Blueprints", icon: FolderOpen, subtitle: "Reference drawings", group: "REFERENCE" },
];

interface QualityProjectSidebarProps {
    activeSection: QualitySection;
    onChange: (section: QualitySection) => void;
    project: any;
}

export function QualityProjectSidebar({ activeSection, onChange, project }: QualityProjectSidebarProps) {
    const getStatusPip = (id: QualitySection) => {
        const metadata = project.executionMetadata || {};
        
        switch (id) {
            case "QUALITY_SNAGS":
                let snags = [];
                if (Array.isArray(metadata.snags)) snags = metadata.snags;
                else if (metadata.snags?.records) snags = metadata.snags.records;
                else if (typeof metadata.snags === 'object') snags = Object.values(metadata.snags);
                const openSnags = snags.filter((s: any) => s && s.id && s.status === "OPEN").length;
                if (openSnags > 0) return <div className="h-4 min-w-4 px-1 rounded-full bg-red-500 flex items-center justify-center text-[8px] font-black text-white">{openSnags}</div>;
                if (snags.length > 0) return <CheckCircle2 size={12} className="text-emerald-400" />;
                return <CircleDashed size={12} className="text-white/20" />;
            case "FIELD_GALLERY":
                if (metadata.fieldUploads?.length > 0) return <CheckCircle2 size={12} className="text-emerald-400" />;
                return <CircleDashed size={12} className="text-white/20" />;
            case "DOCS_VAULT":
                if (project.projectFiles?.length > 0) return <CheckCircle2 size={12} className="text-emerald-400" />;
                return <CircleDashed size={12} className="text-white/20" />;
            default:
                return <CircleDashed size={12} className="text-white/20" />;
        }
    };

    return (
        <div className="w-full flex flex-col h-full"> 
            <div className="px-4 py-4 border-b border-white/10 shrink-0 space-y-1">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-red-400 font-[family-name:var(--font-montserrat)]">
                    Quality Command
                </h3>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-none p-2 space-y-6 pb-20">
                <div className="space-y-1">
                    <h6 className="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Audit Tools</h6>
                    {ITEMS.filter(i => i.group === "AUDIT_TOOLS").map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onChange(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative border",
                                    isActive 
                                        ? "bg-white/10 border-white/10" 
                                        : "border-transparent hover:bg-white/5 text-red-100/50 hover:text-white/80"
                                )}
                            >
                                <div className="absolute top-3 right-3">{getStatusPip(item.id)}</div>
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                    isActive ? "bg-red-500 text-white scale-105" : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/80"
                                )}>
                                    <item.icon size={16} />
                                </div>
                                <div className="flex flex-col text-left overflow-hidden">
                                    <span className={cn("text-xs font-bold uppercase tracking-tight truncate", isActive ? "text-white" : "")}>{item.label}</span>
                                    <span className="text-[9px] font-bold text-white/30 truncate uppercase tracking-widest leading-none mt-0.5">{item.subtitle}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>

                <div className="space-y-1">
                    <h6 className="text-[9px] font-black text-white/30 uppercase tracking-widest px-3 mb-2">Reference</h6>
                    {ITEMS.filter(i => i.group === "REFERENCE").map((item) => {
                        const isActive = activeSection === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => onChange(item.id)}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative border",
                                    isActive 
                                        ? "bg-white/10 border-white/10" 
                                        : "border-transparent hover:bg-white/5 text-red-100/50 hover:text-white/80"
                                )}
                            >
                                <div className="absolute top-3 right-3">{getStatusPip(item.id)}</div>
                                <div className={cn(
                                    "h-8 w-8 rounded-lg flex items-center justify-center shrink-0 transition-all duration-300",
                                    isActive ? "bg-red-500 text-white scale-105" : "bg-white/5 text-white/40 group-hover:bg-white/10 group-hover:text-white/80"
                                )}>
                                    <item.icon size={16} />
                                </div>
                                <div className="flex flex-col text-left overflow-hidden">
                                    <span className={cn("text-xs font-bold uppercase tracking-tight truncate", isActive ? "text-white" : "")}>{item.label}</span>
                                    <span className="text-[9px] font-bold text-white/30 truncate uppercase tracking-widest leading-none mt-0.5">{item.subtitle}</span>
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
