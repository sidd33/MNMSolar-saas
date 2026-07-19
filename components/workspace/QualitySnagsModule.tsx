"use client";

import { useState, useRef } from "react";
import { format } from "date-fns";
import { AlertTriangle, CheckCircle2, Camera, ImagePlus, ShieldAlert, Loader2, Save, BadgeCheck, Wrench, FileWarning, SearchX } from "lucide-react";
import { toast } from "sonner";
import { updateExecutionMetadata } from "@/lib/actions/execution";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export function QualitySnagsModule({ project, refresh }: { project: any, refresh: () => void }) {
    // State for raising a new snag
    const [isRaising, setIsRaising] = useState(false);
    const [stage, setStage] = useState(project.stage || "STRUCTURE_ERECTION");
    const [description, setDescription] = useState("");
    const [actionRequired, setActionRequired] = useState("");
    
    // File upload for new snag
    const { uploadFiles, isUploading, progress } = useProjectFileUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [pendingFiles, setPendingFiles] = useState<File[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Existing Snags
    const rawSnags = project?.executionMetadata?.snags;
    let existingSnags: any[] = [];
    if (Array.isArray(rawSnags)) {
        existingSnags = rawSnags;
    } else if (rawSnags?.records && Array.isArray(rawSnags.records)) {
        existingSnags = rawSnags.records;
    } else if (rawSnags && typeof rawSnags === 'object') {
        existingSnags = Object.values(rawSnags).filter((v: any) => v && v.id);
    }
    
    // Sort snags: OPEN first, then RESOLVED, then VERIFIED
    const sortedSnags = [...existingSnags].sort((a, b) => {
        const order = { "OPEN": 1, "RESOLVED": 2, "VERIFIED": 3 };
        return (order[a.status as keyof typeof order] || 99) - (order[b.status as keyof typeof order] || 99);
    });

    const getLocalDateString = () => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        setPendingFiles(Array.from(e.target.files));
    };

    const handleSubmitSnag = async () => {
        if (!description || !actionRequired) {
            toast.error("Please provide both description and action required");
            return;
        }

        setIsSaving(true);
        const toastId = toast.loading("Logging Punch Point...");

        try {
            let attachedFiles: any[] = [];
            if (pendingFiles.length > 0) {
                toast.loading(`Uploading ${pendingFiles.length} evidence photos...`, { id: toastId });
                const uploadedData = await uploadFiles(
                    project.id,
                    pendingFiles,
                    "EXECUTION",
                    null,
                    undefined,
                    stage
                );
                
                if (uploadedData) {
                    attachedFiles = uploadedData.map((res: any) => ({
                        url: res.ufsUrl || res.url,
                        name: res.name
                    }));
                }
            }

            const newSnag = {
                id: crypto.randomUUID(),
                date: getLocalDateString(),
                stage,
                description,
                actionRequired,
                status: "OPEN",
                attachedFiles,
                resolvedAt: null,
                resolutionFiles: [],
                verifiedAt: null,
                createdAt: new Date().toISOString()
            };

            await updateExecutionMetadata(project.id, 'snags', { records: [...existingSnags, newSnag] });
            
            toast.success("Punch Point Raised Successfully!", { id: toastId });
            setDescription("");
            setActionRequired("");
            setPendingFiles([]);
            setIsRaising(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
            refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to log snag", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-full max-h-[750px] animate-in fade-in duration-500">
            {/* Left Panel: Snags List */}
            <div className="flex-1 bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col h-full overflow-hidden relative">
                <div className="flex items-center justify-between mb-6 shrink-0">
                    <div>
                        <h2 className="text-sm font-black uppercase tracking-widest text-slate-800 flex items-center gap-2">
                            <ShieldAlert size={16} className="text-red-500" />
                            Punch List
                        </h2>
                        <p className="text-xs font-bold text-slate-400 mt-1">Track and resolve installation defects</p>
                    </div>
                    <Button 
                        onClick={() => setIsRaising(!isRaising)}
                        className={cn(
                            "rounded-xl h-10 px-4 text-xs font-black uppercase tracking-widest shadow-sm transition-all duration-300",
                            isRaising ? "bg-slate-100 text-slate-600 hover:bg-slate-200" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-200"
                        )}
                    >
                        {isRaising ? "Cancel" : "+ Raise Snag"}
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-none pr-2 space-y-4">
                    {sortedSnags.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                            <BadgeCheck size={48} className="mx-auto mb-4 text-emerald-400" />
                            <h4 className="text-sm font-black uppercase tracking-widest text-slate-500">No Punch Points</h4>
                            <p className="text-xs text-slate-400 mt-2">All quality checks have passed so far.</p>
                        </div>
                    ) : (
                        sortedSnags.map((snag) => (
                            <SnagCard key={snag.id} snag={snag} project={project} existingSnags={existingSnags} refresh={refresh} />
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Raise Snag Form (Conditionally rendered or slide-in) */}
            {isRaising && (
                <div className="w-full lg:w-[450px] bg-slate-50 rounded-[2rem] border border-slate-200 shadow-inner p-6 flex flex-col h-full overflow-y-auto scrollbar-none shrink-0 animate-in slide-in-from-right-4 duration-300">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-800 flex items-center gap-2 mb-6 border-b border-slate-200 pb-4">
                        <FileWarning size={14} className="text-amber-500" />
                        Log New Defect
                    </h2>
                    
                    <div className="space-y-5 flex-1">
                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Installation Stage</label>
                            <Select value={stage} onValueChange={setStage}>
                                <SelectTrigger className="w-full h-12 bg-white rounded-xl border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                                    <SelectValue placeholder="Select stage" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-slate-200 shadow-xl bg-white">
                                    <SelectItem value="STRUCTURE_ERECTION" className="text-xs font-bold text-slate-700">Structure Erection</SelectItem>
                                    <SelectItem value="PV_PANEL_INSTALLATION" className="text-xs font-bold text-slate-700">Panel Installation</SelectItem>
                                    <SelectItem value="AC_DC_INSTALLATION" className="text-xs font-bold text-slate-700">AC/DC Installation</SelectItem>
                                    <SelectItem value="NET_METERING" className="text-xs font-bold text-slate-700">Net Metering</SelectItem>
                                    <SelectItem value="FINAL_HANDOVER" className="text-xs font-bold text-slate-700">Final Handover</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Defect Description</label>
                            <Textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="E.g. Loose wiring on inverter #2..."
                                className="resize-none h-24 bg-white rounded-xl border-slate-200 focus:ring-red-500/20 focus:border-red-500 text-xs font-medium shadow-sm"
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Action Required</label>
                            <Textarea 
                                value={actionRequired}
                                onChange={e => setActionRequired(e.target.value)}
                                placeholder="E.g. Retighten connections and add conduits..."
                                className="resize-none h-24 bg-white rounded-xl border-slate-200 focus:ring-red-500/20 focus:border-red-500 text-xs font-medium shadow-sm"
                            />
                        </div>

                        <div className="space-y-1.5 pt-2 border-t border-slate-200">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                                <Camera size={10} /> Photo Evidence (Mandatory)
                            </label>
                            <Button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={isUploading || isSaving} 
                                variant="outline"
                                className={cn(
                                    "w-full h-12 rounded-xl border-dashed border-2 text-[10px] font-black uppercase tracking-widest transition-all shadow-sm",
                                    pendingFiles.length > 0 
                                        ? "border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100" 
                                        : "border-slate-300 text-slate-500 hover:bg-white hover:border-slate-400"
                                )}
                            >
                                {pendingFiles.length > 0 ? (
                                    <><CheckCircle2 size={16} className="mr-2" /> {pendingFiles.length} Photos Queued</>
                                ) : (
                                    <><ImagePlus size={16} className="mr-2" /> Attach Defect Photos</>
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
                        onClick={handleSubmitSnag} 
                        disabled={isSaving || isUploading || !description || !actionRequired || pendingFiles.length === 0} 
                        className="w-full mt-6 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/20 font-black text-xs uppercase tracking-widest transition-all"
                    >
                        {isSaving || isUploading ? (
                            <><Loader2 size={16} className="mr-2 animate-spin" /> Logging...</>
                        ) : (
                            <><ShieldAlert size={16} className="mr-2" /> Log Punch Point</>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
}

function SnagCard({ snag, project, existingSnags, refresh }: { snag: any, project: any, existingSnags: any[], refresh: () => void }) {
    const { uploadFiles, isUploading } = useProjectFileUpload();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleResolveFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0) return;
        const files = Array.from(e.target.files);
        
        setIsUpdating(true);
        const toastId = toast.loading("Uploading resolution proof...");

        try {
            const uploadedData = await uploadFiles(
                project.id,
                files,
                "EXECUTION",
                null,
                undefined,
                snag.stage
            );
            
            let resolutionFiles: any[] = [];
            if (uploadedData) {
                resolutionFiles = uploadedData.map((res: any) => ({
                    url: res.ufsUrl || res.url,
                    name: res.name
                }));
            }

            const updatedSnag = {
                ...snag,
                status: "RESOLVED",
                resolvedAt: new Date().toISOString(),
                resolutionFiles
            };

            const updatedSnags = existingSnags.map(s => s.id === snag.id ? updatedSnag : s);
            await updateExecutionMetadata(project.id, 'snags', { records: updatedSnags });
            
            toast.success("Snag marked as RESOLVED", { id: toastId });
            refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to resolve snag", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleVerify = async () => {
        setIsUpdating(true);
        const toastId = toast.loading("Verifying resolution...");

        try {
            const updatedSnag = {
                ...snag,
                status: "VERIFIED",
                verifiedAt: new Date().toISOString()
            };

            const updatedSnags = existingSnags.map(s => s.id === snag.id ? updatedSnag : s);
            await updateExecutionMetadata(project.id, 'snags', { records: updatedSnags });
            
            toast.success("Snag officially VERIFIED and closed", { id: toastId });
            refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to verify snag", { id: toastId });
        } finally {
            setIsUpdating(false);
        }
    };

    const statusColors = {
        OPEN: "bg-red-50 text-red-700 border-red-200",
        RESOLVED: "bg-amber-50 text-amber-700 border-amber-200",
        VERIFIED: "bg-emerald-50 text-emerald-700 border-emerald-200"
    };

    const statusIcons = {
        OPEN: <ShieldAlert size={14} className="text-red-500" />,
        RESOLVED: <Wrench size={14} className="text-amber-500" />,
        VERIFIED: <BadgeCheck size={14} className="text-emerald-500" />
    };

    return (
        <div className={cn(
            "p-5 rounded-2xl border-2 transition-all relative overflow-hidden",
            snag.status === "OPEN" ? "border-red-100 bg-red-50/20" : 
            snag.status === "RESOLVED" ? "border-amber-100 bg-amber-50/20" : 
            "border-emerald-100 bg-emerald-50/20 opacity-80"
        )}>
            {/* Status Banner */}
            <div className="flex items-center gap-3 mb-4">
                <Badge variant="outline" className={cn("text-[9px] font-black uppercase tracking-widest px-2.5 py-0.5 border flex items-center gap-1.5", statusColors[snag.status as keyof typeof statusColors])}>
                    {statusIcons[snag.status as keyof typeof statusIcons]}
                    {snag.status}
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300" /> {format(new Date(snag.date), 'MMM do, yyyy')}
                </span>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    <span className="w-1 h-1 rounded-full bg-slate-300" /> {snag.stage.replace(/_/g, ' ')}
                </span>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Defect Description</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{snag.description}</p>
                </div>
                <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Action Required</span>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">{snag.actionRequired}</p>
                </div>
            </div>

            {/* Photos & Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200/60">
                <div className="flex items-center gap-4">
                    {/* View Original Photos */}
                    {snag.attachedFiles && snag.attachedFiles.length > 0 && (
                        <PhotoViewerDialog title="Defect Photos" files={snag.attachedFiles} triggerText={`View ${snag.attachedFiles.length} Defect Photos`} variant="destructive" />
                    )}
                    
                    {/* View Resolution Photos */}
                    {snag.resolutionFiles && snag.resolutionFiles.length > 0 && (
                        <PhotoViewerDialog title="Resolution Proof" files={snag.resolutionFiles} triggerText={`View ${snag.resolutionFiles.length} Fix Photos`} variant="warning" />
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {snag.status === "OPEN" && (
                        <>
                            <input type="file" ref={fileInputRef} onChange={handleResolveFiles} className="hidden" multiple accept="image/*" />
                            <Button 
                                onClick={() => fileInputRef.current?.click()} 
                                disabled={isUpdating || isUploading}
                                className="h-9 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest shadow-sm"
                            >
                                {isUpdating || isUploading ? <Loader2 size={14} className="animate-spin" /> : <><Wrench size={14} className="mr-1.5" /> Mark Resolved</>}
                            </Button>
                        </>
                    )}
                    
                    {snag.status === "RESOLVED" && (
                        <Button 
                            onClick={handleVerify}
                            disabled={isUpdating}
                            className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] uppercase tracking-widest shadow-sm"
                        >
                            {isUpdating ? <Loader2 size={14} className="animate-spin" /> : <><BadgeCheck size={14} className="mr-1.5" /> Verify & Close</>}
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PhotoViewerDialog({ title, files, triggerText, variant = "default" }: { title: string, files: any[], triggerText: string, variant?: "default" | "destructive" | "warning" }) {
    const btnClasses = {
        default: "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 border-indigo-100",
        destructive: "text-red-600 bg-red-50 hover:bg-red-100 border-red-100",
        warning: "text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-100"
    };

    return (
        <Dialog>
            <DialogTrigger className={cn(
                "flex items-center gap-2 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-colors",
                btnClasses[variant]
            )}>
                <Camera size={12} /> {triggerText}
            </DialogTrigger>
            <DialogContent className="max-w-4xl bg-slate-50 rounded-[2.5rem] border-slate-200 shadow-xl p-8 overflow-hidden">
                <DialogHeader className="mb-6">
                    <DialogTitle className="text-xl font-black uppercase tracking-tight text-slate-800">
                        {title}
                    </DialogTitle>
                </DialogHeader>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-h-[60vh] overflow-y-auto scrollbar-none pr-2">
                    {files.map((file: any, index: number) => (
                        <div key={index} className="aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 shadow-sm relative group bg-slate-200">
                            <img src={file.url} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
