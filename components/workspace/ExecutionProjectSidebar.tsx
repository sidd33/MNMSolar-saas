"use client";

import { 
    Package, 
    Hammer, 
    ShieldCheck, 
    Flag, 
    ShieldAlert,
    ChevronRight,
    CircleDashed,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

export type ExecutionSection = "PROCUREMENT" | "SITE_WORK" | "QUALITY" | "HANDOVER" | "SAFETY";

interface SidebarItem {
    id: ExecutionSection;
    label: string;
    icon: any;
    subtitle: string;
}

const ITEMS: SidebarItem[] = [
    { id: "PROCUREMENT", label: "Procurement", icon: Package, subtitle: "Inventory & Liaisoning" },
    { id: "SITE_WORK", label: "Site Work", icon: Hammer, subtitle: "Installation Progress" },
    { id: "QUALITY", label: "Quality & Punch", icon: ShieldCheck, subtitle: "Inspections & DWGs" },
    { id: "HANDOVER", label: "Handover", icon: Flag, subtitle: "Final site clearance" },
    { id: "SAFETY", label: "Safety / HSE", icon: ShieldAlert, subtitle: "PPE & Site Briefing" },
];

interface ExecutionProjectSidebarProps {
    activeSection: ExecutionSection;
    onChange: (section: ExecutionSection) => void;
    project: any;
}

export function ExecutionProjectSidebar({ activeSection, onChange, project }: ExecutionProjectSidebarProps) {
    
    // Status Logic for Pips
    const getStatusPip = (id: ExecutionSection) => {
        const metadata = project.executionMetadata || {};
        
        switch (id) {
            case "PROCUREMENT":
                const materials = metadata.materials || [];
                const complete = materials.length > 0 && materials.every((m: any) => m.atSite >= m.ordered && m.ordered > 0);
                if (complete) return <CheckCircle2 size={12} className="text-emerald-500" />;
                if (materials.some((m: any) => m.atSite > 0)) return <Loader2 size={12} className="text-blue-500 animate-spin" />;
                return <CircleDashed size={12} className="text-slate-300" />;
            
            case "SAFETY":
                const safety = metadata.safetyItems || [];
                const safe = safety.length > 0 && safety.every((i: any) => i.status);
                if (safe) return <CheckCircle2 size={12} className="text-emerald-500" />;
                if (safety.some((i: any) => i.status)) return <Loader2 size={12} className="text-blue-500 animate-spin" />;
                return <CircleDashed size={12} className="text-slate-300" />;

            case "SITE_WORK":
                // Map to existing executionStage
                const siteWorkStages = ["STRUCTURE", "PANEL_INSTALL", "INVERTER_WIRING"];
                if (project.executionStage === "INVERTER_WIRING") return <CheckCircle2 size={12} className="text-emerald-500" />;
                if (siteWorkStages.includes(project.executionStage)) return <Loader2 size={12} className="text-blue-500 animate-spin" />;
                return <CircleDashed size={12} className="text-slate-300" />;

            default:
                return <CircleDashed size={12} className="text-slate-300" />;
        }
    };

    return (
        <div className="w-full lg:w-80 shrink-0 flex flex-col gap-2 p-2 bg-slate-50/50 rounded-[2.5rem] border border-slate-200/60">
            {ITEMS.map((item) => {
                const isActive = activeSection === item.id;
                const Pip = getStatusPip(item.id);

                return (
                    <button
                        key={item.id}
                        onClick={() => onChange(item.id)}
                        className={cn(
                            "flex items-center gap-4 p-4 rounded-3xl transition-all duration-300 group min-h-[64px] relative",
                            isActive 
                                ? "bg-white shadow-xl shadow-blue-900/5 ring-1 ring-slate-200" 
                                : "hover:bg-white/60 text-slate-500"
                        )}
                    >
                        {/* Status Pip Indicator */}
                        <div className="absolute top-4 right-4">
                            {Pip}
                        </div>

                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300",
                            isActive 
                                ? "bg-[#1C3384] text-white rotate-3 scale-110" 
                                : "bg-slate-200 text-slate-500 group-hover:bg-slate-300 group-hover:rotate-3"
                        )}>
                            <item.icon size={22} />
                        </div>

                        <div className="flex flex-col text-left overflow-hidden">
                            <span className={cn(
                                "text-sm font-black uppercase tracking-tight truncate",
                                isActive ? "text-[#1C3384]" : "text-slate-700"
                            )}>
                                {item.label}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-widest leading-none mt-0.5">
                                {item.subtitle}
                            </span>
                        </div>

                        {isActive && (
                            <ChevronRight size={18} className="ml-auto text-[#1C3384] animate-pulse" />
                        )}
                    </button>
                );
            })}
        </div>
    );
}
