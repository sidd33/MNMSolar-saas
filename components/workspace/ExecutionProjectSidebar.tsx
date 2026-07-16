"use client";

import { 
    Camera, 
    FolderOpen, 
    PackageSearch, 
    ClipboardList,
    Flag,
    CheckCircle2,
    CircleDashed,
    Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ExecutionSection = "FIELD_UPLOAD" | "DOCS" | "MATERIAL_REQUEST" | "TESTING" | "HANDOVER";

interface SidebarItem {
    id: ExecutionSection;
    label: string;
    icon: any;
    subtitle: string;
    group: "FIELD_TOOLS" | "EXECUTION_COMMAND";
}

const ITEMS: SidebarItem[] = [
    { id: "FIELD_UPLOAD", label: "Site Work & Uploads", icon: Camera, subtitle: "Photos & Snags", group: "FIELD_TOOLS" },
    { id: "MATERIAL_REQUEST", label: "Material Request", icon: PackageSearch, subtitle: "Indent items to site", group: "FIELD_TOOLS" },
    
    { id: "DOCS", label: "Docs Vault", icon: FolderOpen, subtitle: "Blueprints & Challans", group: "EXECUTION_COMMAND" },
    { id: "HANDOVER", label: "Handover Desk", icon: Flag, subtitle: "Final clearance", group: "EXECUTION_COMMAND" }
];

interface ExecutionProjectSidebarProps {
    activeSection: ExecutionSection;
    onChange: (section: ExecutionSection) => void;
    project: any;
}

export function ExecutionProjectSidebar({ activeSection, onChange, project }: ExecutionProjectSidebarProps) {
    const getStatusPip = (id: ExecutionSection) => {
        const metadata = project.executionMetadata || {};
        
        switch (id) {
            case "FIELD_UPLOAD":
                if (metadata.fieldUploads?.length > 0) return <CheckCircle2 size={12} className="text-emerald-500" />;
                return <CircleDashed size={12} className="text-slate-300" />;
            case "MATERIAL_REQUEST":
                return <CircleDashed size={12} className="text-slate-300" />;
            case "DOCS":
                if (project.projectFiles?.length > 0) return <CheckCircle2 size={12} className="text-emerald-500" />;
                return <CircleDashed size={12} className="text-slate-300" />;
            case "TESTING":
                if (metadata.commissioningData) return <CheckCircle2 size={12} className="text-emerald-500" />;
                return <CircleDashed size={12} className="text-slate-300" />;
            case "HANDOVER":
                if (project.stage === "FINAL_HANDOVER" || project.stage === "NET_METERING") return <CheckCircle2 size={12} className="text-emerald-500" />;
                return <CircleDashed size={12} className="text-slate-300" />;
            default:
                return <CircleDashed size={12} className="text-slate-300" />;
        }
    };

    return (
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-6 p-4 bg-slate-50/50 rounded-[2.5rem] border border-slate-200/60">
            
            <div className="space-y-2">
                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Field Tools</h6>
                {ITEMS.filter(i => i.group === "FIELD_TOOLS").map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group min-h-[64px] relative",
                                isActive 
                                    ? "bg-white shadow-xl shadow-blue-900/5 ring-1 ring-slate-200" 
                                    : "hover:bg-white/60 text-slate-500"
                            )}
                        >
                            <div className="absolute top-4 right-4">{getStatusPip(item.id)}</div>
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                                isActive ? "bg-[#1C3384] text-white rotate-3 scale-110" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:rotate-3"
                            )}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className={cn("text-sm font-black uppercase tracking-tight truncate", isActive ? "text-[#1C3384]" : "text-slate-700")}>{item.label}</span>
                                <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none mt-0.5">{item.subtitle}</span>
                            </div>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2">
                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Execution Command</h6>
                {ITEMS.filter(i => i.group === "EXECUTION_COMMAND").map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onChange(item.id)}
                            className={cn(
                                "w-full flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group min-h-[64px] relative",
                                isActive 
                                    ? "bg-white shadow-xl shadow-blue-900/5 ring-1 ring-slate-200" 
                                    : "hover:bg-white/60 text-slate-500"
                            )}
                        >
                            <div className="absolute top-4 right-4">{getStatusPip(item.id)}</div>
                            <div className={cn(
                                "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                                isActive ? "bg-[#1C3384] text-white rotate-3 scale-110" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:rotate-3"
                            )}>
                                <item.icon size={22} />
                            </div>
                            <div className="flex flex-col text-left overflow-hidden">
                                <span className={cn("text-sm font-black uppercase tracking-tight truncate", isActive ? "text-[#1C3384]" : "text-slate-700")}>{item.label}</span>
                                <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none mt-0.5">{item.subtitle}</span>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
