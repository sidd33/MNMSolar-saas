"use client";

import { useState } from "react";
import { SharedAnnexureModule } from "./SharedAnnexureModule";
import { Package, FileText, FileUp, CheckCircle2, Truck, Box, Zap, Layers } from "lucide-react";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { updateExecutionMetadata } from "@/lib/actions/execution";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import { forwardProject } from "@/app/actions/project";
import { 
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ProcurementModuleProps {
    project: any;
}

export function ProcurementModule({ project }: ProcurementModuleProps) {
    const { updateLocalProject } = useDashboardNexus();
    const [view, setView] = useState<"material" | "liaisoning">("material");
    const [isOpen, setIsOpen] = useState(false);
    
    // Extract metadata or use defaults
    const metadata = project.executionMetadata || {};
    const materials = metadata.materials || [
        { id: "modules", label: "Solar Modules", icon: Layers, ordered: 0, atSite: 0, unit: "Nos" },
        { id: "inverters", label: "Inverters", icon: Zap, ordered: 0, atSite: 0, unit: "Nos" },
        { id: "structure", label: "Mounting Structure", icon: Box, ordered: 0, atSite: 0, unit: "Set" },
        { id: "bos", label: "DC/AC Cables & BOS", icon: Package, ordered: 0, atSite: 0, unit: "Lot" }
    ];

    const handleUpdateMaterial = async (id: string, field: "ordered" | "atSite", value: string) => {
        const numValue = parseInt(value) || 0;
        const updatedMaterials = materials.map((m: any) => 
            m.id === id ? { ...m, [field]: numValue } : m
        );

        const newMetadata = { ...metadata, materials: updatedMaterials };
        
        // Optimistic UI
        updateLocalProject(project.id, { executionMetadata: newMetadata });

        try {
            await updateExecutionMetadata(project.id, newMetadata);
            toast.success("Inventory updated");
        } catch (e) {
            toast.error("Failed to sync inventory");
        }
    };

    const handleForward = async () => {
        const formData = new FormData();
        formData.append("projectId", project.id);
        formData.append("nextStage", "STRUCTURE_ERECTION");
        formData.append("department", "Execution");
        formData.append("currentStage", project.stage);

        try {
            await forwardProject(formData);
            toast.success("Project forwarded to Structure Erection");
            setIsOpen(false);
        } catch (e: any) {
            toast.error(e.message || "Failed to forward project");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
            {/* Header with Segmented Toggle */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 p-4 rounded-3xl border border-slate-200/60">
                <div className="flex items-center gap-3 px-2">
                    <div className="h-10 w-10 rounded-xl bg-[#1C3384] text-white flex items-center justify-center">
                        <Package size={20} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black uppercase tracking-tight text-[#1C3384]">Procurement Hub</h4>
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Inventory & Liaisoning Sync</p>
                    </div>
                </div>

                <div className="flex p-1 bg-slate-200/50 rounded-2xl w-full md:w-auto h-12">
                    <button 
                        onClick={() => setView("material")}
                        className={cn(
                            "flex-1 md:px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-h-[44px]",
                            view === "material" ? "bg-white text-[#1C3384] shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Truck size={14} /> Material Track
                    </button>
                    <button 
                        onClick={() => setView("liaisoning")}
                        className={cn(
                            "flex-1 md:px-6 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-2 flex items-center justify-center min-h-[44px]",
                            view === "liaisoning" ? "bg-white text-[#FFC800] shadow-sm" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <FileText size={14} /> Liaisoning Docs
                    </button>
                </div>

                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger render={
                        <Button 
                            className="bg-[#1C3384] hover:bg-[#0F172A] text-white font-black uppercase tracking-widest text-[10px] h-12 px-6 rounded-2xl shadow-lg shadow-blue-900/20 gap-2"
                        >
                            <CheckCircle2 size={16} />
                            Complete & Forward
                        </Button>
                    } />
                    <DialogContent className="rounded-[2rem] border-none shadow-2xl">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-tight text-xl text-[#1C3384]">Confirm Procurement Completion</DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium">
                                This will formally close the Procurement stage and move the project to **Structure Erection**. 
                                Ensure all critical materials are verified at site.
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
                                Dispatch to Site
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {view === "material" ? (
                <div className="bg-white border border-slate-200 rounded-[2rem] overflow-hidden shadow-sm">
                    <Table>
                        <TableHeader className="bg-slate-50">
                            <TableRow>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4 pl-8">Component</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Ordered</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">At Site</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Status</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {materials.map((m: any) => {
                                const isComplete = m.atSite >= m.ordered && m.ordered > 0;
                                const Icon = m.icon || Box;
                                
                                return (
                                    <TableRow key={m.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <TableCell className="py-6 pl-8">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500 group-hover:bg-[#1C3384]/10 group-hover:text-[#1C3384] transition-colors">
                                                    <Icon size={16} />
                                                </div>
                                                <span className="font-bold text-slate-900 text-sm uppercase tracking-tight">{m.label}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative w-20">
                                                <input 
                                                    type="number"
                                                    value={m.ordered}
                                                    onChange={(e) => handleUpdateMaterial(m.id, "ordered", e.target.value)}
                                                    className="w-full bg-slate-100/50 border-none rounded-lg px-3 py-2 text-sm font-black text-slate-700 h-10 focus:bg-white focus:ring-2 focus:ring-[#1C3384]/20 transition-all"
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold text-slate-400 uppercase">{m.unit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative w-20">
                                                <input 
                                                    type="number"
                                                    value={m.atSite}
                                                    onChange={(e) => handleUpdateMaterial(m.id, "atSite", e.target.value)}
                                                    className={cn(
                                                        "w-full rounded-lg px-3 py-2 text-sm font-black h-10 transition-all border-none focus:ring-2 focus:ring-[#1C3384]/20",
                                                        isComplete ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-[#1C3384]"
                                                    )}
                                                />
                                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[8px] font-bold opacity-40 uppercase">{m.unit}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isComplete ? (
                                                <div className="flex items-center gap-2 text-emerald-600">
                                                    <CheckCircle2 size={16} />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">Received</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-blue-500">
                                                    <Truck size={16} className="animate-pulse" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest">In Transit</span>
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>

                    <div className="p-8 border-t border-slate-100 bg-slate-50/30">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                               <div className="h-10 w-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
                                    <FileUp size={18} />
                               </div>
                               <div>
                                   <p className="text-xs font-black text-slate-800 uppercase tracking-tight">Material Challans</p>
                                   <p className="text-[10px] text-slate-500 font-medium">Upload site-received delivery notes</p>
                               </div>
                            </div>
                            <Badge className="bg-[#1C3384] md:h-10 px-6 rounded-xl hover:bg-[#1C3384] cursor-pointer text-[10px] font-black uppercase tracking-widest flex items-center justify-center">
                                Upload New Challan
                            </Badge>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                    <SharedAnnexureModule 
                        projectId={project.id} 
                        projectName={project.name} 
                        projectFiles={project.projectFiles || []} 
                    />
                </div>
            )}
        </div>
    );
}
