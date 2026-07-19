"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, Loader2, Save, HardHat, AlertTriangle, CheckCircle2, ArrowRight, Camera, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { updateExecutionMetadata, upsertLaborLog } from "@/lib/actions/execution";
import { forwardProject } from "@/app/actions/project";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface DailyProgressModuleProps {
    project: any;
}

export function DailyProgressModule({ project }: DailyProgressModuleProps) {
    const { refresh } = useDashboardNexus();
    const [isSaving, setIsSaving] = useState(false);
    
    // Form state
    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    const [date, setDate] = useState(getLocalDateString());
    const [laborCount, setLaborCount] = useState<number | "">("");
    const [tasksCompleted, setTasksCompleted] = useState("");
    const [blockers, setBlockers] = useState("");
    const [nextPlan, setNextPlan] = useState("");
    
    // Stage Advancement Logic
    const [selectedStage, setSelectedStage] = useState(project.stage || "STRUCTURE_ERECTION");

    // File Upload Hook & Queue
    const { uploadFiles, isUploading, progress, status } = useProjectFileUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);

    const handleUploadEvidence = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setPendingFiles(Array.from(e.target.files));
    };

    // Gracefully handle dpr data structure
    let existingDPRs: any[] = [];
    const rawDpr = project?.executionMetadata?.dpr;
    if (Array.isArray(rawDpr)) {
        existingDPRs = rawDpr;
    } else if (rawDpr?.records && Array.isArray(rawDpr.records)) {
        existingDPRs = rawDpr.records;
    } else if (rawDpr && typeof rawDpr === 'object') {
        // Recover broken object spread array data
        existingDPRs = Object.values(rawDpr).filter((v: any) => v && v.id && v.date);
    }

    const EXECUTION_STAGES = [
        { value: "HANDOVER_TO_EXECUTION", label: "Site Handover" },
        { value: "MATERIAL_PROCUREMENT", label: "Material Procurement" },
        { value: "STRUCTURE_ERECTION", label: "Structure Erection" },
        { value: "PV_PANEL_INSTALLATION", label: "PV Panel Installation" },
        { value: "AC_DC_INSTALLATION", label: "AC / DC Installation" },
        { value: "NET_METERING", label: "Testing & Net Metering" },
        { value: "FINAL_HANDOVER", label: "Final Handover" }
    ];

    const handleSubmit = async () => {
        if (!laborCount) {
            toast.error("Please enter the number of laborers on site.");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Saving Daily Progress Report...");
        
        try {
            let attachedFiles: any[] = [];
            
            // Upload files if queued
            if (pendingFiles.length > 0) {
                toast.loading(`Uploading ${pendingFiles.length} photos...`, { id: toastId });
                const uploadedData = await uploadFiles(
                    project.id,
                    pendingFiles,
                    "EXECUTION",
                    null,
                    undefined,
                    selectedStage
                );
                
                // uploadFiles returns the result of startUpload, which gives us the urls/keys
                // But the hook actually uploads to our database in `onClientUploadComplete` and it triggers `onSuccess`.
                // Since startUpload is async and onClientUploadComplete happens asynchronously after, 
                // we might need a promise. Wait, `useProjectFileUpload` actually returns the startUpload promise.
                // For simplicity, we can just save the file names or assume they will be in the gallery.
                // Wait, startUpload resolves with the uploaded files array!
                if (uploadedData) {
                    attachedFiles = uploadedData.map((res: any) => ({
                        url: res.ufsUrl || res.url,
                        name: res.name
                    }));
                }
            }

            // Log labor formally
            await upsertLaborLog(project.id, new Date(date), Number(laborCount), tasksCompleted);
            
            // Log full DPR into JSON metadata
            const newDPR = {
                id: crypto.randomUUID(),
                date,
                laborCount: Number(laborCount),
                tasksCompleted,
                blockers,
                nextPlan,
                attachedFiles,
                createdAt: new Date().toISOString()
            };

            await updateExecutionMetadata(project.id, 'dpr', { records: [...existingDPRs, newDPR] });
            
            // Advance Stage if a new one was selected
            if (selectedStage && selectedStage !== project.stage) {
                const formData = new FormData();
                formData.append("projectId", project.id);
                formData.append("nextStage", selectedStage);
                formData.append("department", "Execution");
                formData.append("comment", "Pipeline stage updated via Daily Progress Report.");
                
                await forwardProject(formData);
            }

            toast.success("DPR logged successfully", { id: toastId });
            setLaborCount("");
            setTasksCompleted("");
            setBlockers("");
            setNextPlan("");
            setPendingFiles([]);
            if (fileInputRef.current) fileInputRef.current.value = "";
            refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to log DPR", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-8 animate-in fade-in duration-500">
            {/* Form Section */}
            <Card className="p-6 rounded-[2rem] border-slate-200 shadow-sm flex flex-col h-full">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#1C3384]/10 text-[#1C3384] flex items-center justify-center shrink-0">
                            <HardHat size={20} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 leading-none">Daily Progress</h2>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Log Site Activity</p>
                        </div>
                    </div>

                    <div className="flex-1 max-w-[240px]">
                        <Select value={selectedStage} onValueChange={setSelectedStage}>
                            <SelectTrigger className="h-9 bg-slate-50 font-bold text-[11px] uppercase tracking-wider text-slate-700 border-slate-200 shadow-sm">
                                <SelectValue placeholder="Project Stage" />
                            </SelectTrigger>
                            <SelectContent>
                                {EXECUTION_STAGES.map(stage => (
                                    <SelectItem key={stage.value} value={stage.value} className="font-semibold text-xs py-2">
                                        {stage.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-4 flex-1">
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Report Date</label>
                            <Input 
                                type="date" 
                                value={date} 
                                onChange={(e) => setDate(e.target.value)} 
                                className="h-10 bg-slate-50/50 border-slate-200 text-sm font-semibold"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Total Labor Count</label>
                            <Input 
                                type="number" 
                                placeholder="0" 
                                value={laborCount} 
                                onChange={(e) => setLaborCount(e.target.value ? parseInt(e.target.value) : "")} 
                                className="h-10 bg-slate-50/50 border-slate-200 text-sm font-semibold"
                            />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-emerald-600 flex items-center gap-1.5">
                            <CheckCircle2 size={10} /> Tasks Completed & Minor Changes
                        </label>
                        <Textarea 
                            placeholder="e.g., Structure installed for 20kW, 40 panels mounted..." 
                            value={tasksCompleted} 
                            onChange={(e) => setTasksCompleted(e.target.value)}
                            className="resize-none h-20 bg-slate-50/50 border-slate-200 text-sm text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1.5">
                            <AlertTriangle size={10} /> Issues & Blockers
                        </label>
                        <Textarea 
                            placeholder="e.g., Rain delayed work by 2 hours, short on MC4 connectors..." 
                            value={blockers} 
                            onChange={(e) => setBlockers(e.target.value)}
                            className="resize-none h-16 bg-slate-50/50 border-slate-200 text-sm text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[9px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1.5">
                            <ArrowRight size={10} /> Next Day Plan
                        </label>
                        <Textarea 
                            placeholder="e.g., Will begin DC wiring and earthing pits..." 
                            value={nextPlan} 
                            onChange={(e) => setNextPlan(e.target.value)}
                            className="resize-none h-16 bg-slate-50/50 border-slate-200 text-sm text-slate-700 placeholder:text-slate-400"
                        />
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                            <Camera size={10} /> Photo Evidence
                        </label>
                        <Button 
                            onClick={handleUploadEvidence} 
                            disabled={isUploading} 
                            variant="outline"
                            className={cn(
                                "w-full h-12 rounded-xl border-dashed border-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                                pendingFiles.length > 0 
                                    ? "border-indigo-300 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100" 
                                    : "border-slate-200 text-slate-500 hover:bg-slate-50 hover:border-slate-300"
                            )}
                        >
                            {pendingFiles.length > 0 ? (
                                <><CheckCircle2 size={16} className="mr-2" /> {pendingFiles.length} Photos Queued</>
                            ) : (
                                <><ImagePlus size={16} className="mr-2" /> Attach Photos</>
                            )}
                        </Button>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleFileChange} 
                            className="hidden" 
                            multiple 
                            accept="image/*,video/*"
                        />
                    </div>

                </div>
                <Button 
                    onClick={handleSubmit} 
                    disabled={isSaving} 
                    className="w-full h-12 rounded-xl bg-[#1C3384] hover:bg-blue-900 text-white font-black text-xs uppercase tracking-widest transition-all shadow-lg shadow-blue-900/10 mt-6 group shrink-0"
                >
                        {isSaving ? <Loader2 className="animate-spin" /> : (
                            <>
                                <Save size={18} className="mr-2" />
                                Submit Daily Log
                            </>
                        )}
                    </Button>
            </Card>

            {/* History Section - Timeline View */}
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col h-full max-h-[750px]">
                <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2 shrink-0">
                    <CalendarIcon size={14} className="text-[#1C3384]" /> Activity Timeline
                </h3>

                {existingDPRs.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-2xl text-center text-slate-400 bg-slate-50/50">
                        <CalendarIcon size={28} className="mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">No activity logged</p>
                    </div>
                ) : (
                    <div className="flex-1 overflow-y-auto scrollbar-none pr-4 -mr-4 relative">
                        <div className="absolute top-2 bottom-2 left-[11px] w-[2px] bg-slate-100 rounded-full" />
                        
                        <div className="space-y-6">
                            {[...existingDPRs].reverse().map((dpr: any, i: number) => (
                                <div key={dpr.id} className="relative pl-8">
                                    {/* Timeline Node */}
                                    <div className="absolute left-[7px] top-1 h-[10px] w-[10px] rounded-full bg-white border-[3px] border-[#1C3384] ring-4 ring-white z-10" />
                                    
                                    <div className="flex justify-between items-baseline mb-2">
                                        <h4 className="font-bold text-slate-800 text-xs tracking-tight">
                                            {format(new Date(dpr.date), 'MMM do, yyyy')}
                                        </h4>
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/60">
                                            {dpr.laborCount} Workers
                                        </span>
                                    </div>
                                    
                                    <div className="space-y-1.5">
                                        {dpr.tasksCompleted && (
                                            <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100/60">
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">Completed</span>
                                                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{dpr.tasksCompleted}</p>
                                            </div>
                                        )}
                                        {dpr.blockers && (
                                            <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100/60">
                                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest block mb-0.5">Blockers</span>
                                                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{dpr.blockers}</p>
                                            </div>
                                        )}
                                        {dpr.nextPlan && (
                                            <div className="bg-[#1C3384]/5 p-3 rounded-xl border border-[#1C3384]/10">
                                                <span className="text-[9px] font-black text-[#1C3384] uppercase tracking-widest block mb-0.5">Next Plan</span>
                                                <p className="text-[11px] text-slate-700 leading-relaxed font-medium">{dpr.nextPlan}</p>
                                            </div>
                                        )}
                                        
                                        {/* Embedded Photo Evidence */}
                                        {dpr.attachedFiles && dpr.attachedFiles.length > 0 && (
                                            <div className="mt-3 pt-3 border-t border-slate-100">
                                                <Dialog>
                                                    <DialogTrigger className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50/50 hover:bg-indigo-100 border border-indigo-100 px-3 py-1.5 rounded-lg transition-colors">
                                                        <Camera size={12} /> View {dpr.attachedFiles.length} Photos
                                                    </DialogTrigger>
                                                    <DialogContent className="max-w-4xl bg-slate-50 rounded-[2.5rem] border-slate-200 shadow-xl p-8 overflow-hidden">
                                                        <DialogHeader className="mb-6">
                                                            <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800 flex items-center gap-3">
                                                                Evidence <span className="text-xs text-slate-400">|</span> {format(new Date(dpr.date), 'MMM do, yyyy')}
                                                            </DialogTitle>
                                                        </DialogHeader>
                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto scrollbar-none pr-2">
                                                            {dpr.attachedFiles.map((file: any, index: number) => (
                                                                <div key={index} className="aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 shadow-sm relative group bg-slate-200">
                                                                    <img src={file.url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </DialogContent>
                                                </Dialog>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
