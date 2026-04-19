"use client";

import { ShieldAlert, CheckCircle2, AlertTriangle, HardHat, Footprints, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { updateExecutionMetadata } from "@/lib/actions/execution";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";

interface SafetyModuleProps {
    project: any;
}

export function SafetyModule({ project }: SafetyModuleProps) {
    const { updateLocalProject } = useDashboardNexus();
    
    // Extract metadata or use defaults
    const metadata = project.executionMetadata || {};
    const safetyItems = metadata.safetyItems || [
        { id: "ppe", label: "PPE Kits Verified", icon: HardHat, description: "Helmets, Jackets, Gloves distributed", status: false },
        { id: "harness", label: "Full Body Harness", icon: ShieldAlert, description: "Inspected for height work (>2m)", status: false },
        { id: "briefing", label: "Site Tool-Box Talk", icon: AlertTriangle, description: "Daily safety briefing completed", status: false },
        { id: "shoes", label: "Quality Safety Shoes", icon: Footprints, description: "Verification for all site workers", status: false },
        { id: "tools", label: "Tools & Equipment", icon: ClipboardCheck, description: "Power tools health check completed", status: false }
    ];

    const handleToggleSafety = async (id: string) => {
        const updatedItems = safetyItems.map((item: any) => 
            item.id === id ? { ...item, status: !item.status } : item
        );

        const newMetadata = { ...metadata, safetyItems: updatedItems };
        
        // Optimistic UI
        updateLocalProject(project.id, { executionMetadata: newMetadata });

        try {
            await updateExecutionMetadata(project.id, newMetadata);
            // toast.success("Safety state updated");
        } catch (e) {
            toast.error("Failed to sync safety state");
        }
    };

    const isAllSafe = safetyItems.every((i: any) => i.status);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center border border-amber-200">
                        <ShieldAlert size={28} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black uppercase tracking-tight text-slate-800">Safety & HSE Desk</h4>
                        <p className="text-xs text-slate-500 font-medium">Daily compliance and PPE verification</p>
                    </div>
                </div>

                {isAllSafe ? (
                    <div className="flex items-center gap-2 bg-emerald-50 text-emerald-700 px-4 py-2 rounded-2xl border border-emerald-100">
                        <CheckCircle2 size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Site Ready to Work</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 bg-rose-50 text-rose-700 px-4 py-2 rounded-2xl border border-rose-100 animate-pulse">
                        <AlertTriangle size={18} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Compliance Pending</span>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {safetyItems.map((item: any) => (
                    <button
                        key={item.id}
                        onClick={() => handleToggleSafety(item.id)}
                        className={cn(
                            "group p-6 rounded-[2rem] border-2 transition-all flex items-center gap-5 text-left min-h-[96px]",
                            item.status 
                                ? "bg-emerald-50 border-emerald-200 shadow-sm" 
                                : "bg-white border-slate-100 hover:border-amber-200 hover:bg-amber-50/30"
                        )}
                    >
                        <div className={cn(
                            "h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-colors",
                            item.status 
                                ? "bg-emerald-500 text-white" 
                                : "bg-slate-100 text-slate-400 group-hover:bg-amber-500 group-hover:text-white"
                        )}>
                            <item.icon size={24} />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h5 className={cn(
                                "font-black uppercase tracking-tight text-sm mb-0.5",
                                item.status ? "text-emerald-800" : "text-slate-800"
                            )}>
                                {item.label}
                            </h5>
                            <p className={cn(
                                "text-[10px] font-medium leading-tight",
                                item.status ? "text-emerald-600/70" : "text-slate-400"
                            )}>
                                {item.description}
                            </p>
                        </div>

                        <div className={cn(
                            "h-8 w-8 rounded-full flex items-center justify-center transition-all",
                            item.status 
                                ? "bg-emerald-200 text-emerald-700 scale-110" 
                                : "bg-slate-100 text-slate-300"
                        )}>
                            <CheckCircle2 size={18} fill={item.status ? "currentColor" : "none"} />
                        </div>
                    </button>
                ))}
            </div>

            <div className="p-8 mt-4 bg-slate-900 rounded-[2.5rem] relative overflow-hidden group">
                <div className="absolute right-0 top-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <ShieldAlert size={120} className="text-white" />
                </div>
                <div className="relative z-10">
                    <h5 className="text-white font-black uppercase tracking-widest text-[10px] mb-2">Pre-Installation Policy</h5>
                    <p className="text-slate-400 text-xs font-medium max-w-sm leading-relaxed">
                        Site execution must not begin until all primary safety checkpoints are "Blue" or "Green". Failure to verify PPE will hold the project in the Planning stage.
                    </p>
                </div>
            </div>
        </div>
    );
}
