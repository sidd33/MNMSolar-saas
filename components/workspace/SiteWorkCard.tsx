"use client";

import { useState } from "react";
import { 
    Hammer, 
    Camera, 
    FileText, 
    CheckCircle2, 
    Image as ImageIcon,
    Clock,
    AlertCircle,
    Plus,
    X,
    Maximize2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { updateExecutionMetadata } from "@/lib/actions/execution";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SiteWorkCardProps {
    project: any;
    stageId: "structure" | "pv" | "acdc";
    label: string;
    description: string;
    tag: string;
}

export function SiteWorkCard({ project, stageId, label, description, tag }: SiteWorkCardProps) {
    const { updateLocalProject } = useDashboardNexus();
    const { uploadFiles, isUploading, progress } = useProjectFileUpload();
    
    // Extract metadata
    const metadata = project.executionMetadata || {};
    const siteWork = metadata.siteWork || {};
    const currentStatus = siteWork[stageId] || "NOT_STARTED";
    
    // Filter files for this specific stage
    const stageFiles = (project.projectFiles || []).filter(
        (f: any) => f.uploadedAtStage === tag
    );
    
    const photoFiles = stageFiles.filter((f: any) => 
        ['jpg', 'jpeg', 'png', 'webp'].includes(f.fileUrl?.split('.').pop()?.toLowerCase() || '')
    );
    
    const docFiles = stageFiles.filter((f: any) => 
        !['jpg', 'jpeg', 'png', 'webp'].includes(f.fileUrl?.split('.').pop()?.toLowerCase() || '')
    );

    const isVerified = photoFiles.length >= 2 && currentStatus !== "NOT_STARTED";

    const handleStatusChange = async (newStatus: string) => {
        const newMetadata = { 
            ...metadata, 
            siteWork: { ...siteWork, [stageId]: newStatus } 
        };
        
        // Optimistic UI
        updateLocalProject(project.id, { executionMetadata: newMetadata });

        try {
            await updateExecutionMetadata(project.id, newMetadata);
            toast.success(`${label} status updated to ${newStatus.replace('_', ' ')}`);
        } catch (e) {
            toast.error("Failed to update status");
        }
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        try {
            await uploadFiles(
                project.id, 
                files, 
                "EXECUTION", 
                null, 
                () => {
                    // Success callback - usually handled by Nexus revalidation but we can refresh here if needed
                },
                tag // Custom tag for this stage
            );
        } catch (err) {
            console.error("Upload error:", err);
        }
    };

    return (
        <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 🏷️ Card Header */}
            <div className="p-6 pb-4 border-b border-slate-100 flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black uppercase tracking-tight text-[#1C3384] font-[family-name:var(--font-montserrat)]">
                            {label}
                        </h3>
                        {isVerified && (
                             <div className="flex items-center gap-1 bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-lg border border-emerald-100 animate-in zoom-in duration-300">
                                <CheckCircle2 size={12} />
                                <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
                             </div>
                        )}
                    </div>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none truncate max-w-[200px]">
                        {description}
                    </p>
                </div>
                
                <div className={cn(
                    "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                    isVerified ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-400"
                )}>
                    <Hammer size={20} />
                </div>
            </div>

            {/* ⚡ Status Toggle */}
            <div className="px-6 py-4 bg-slate-50/50 flex flex-col gap-3 border-b border-slate-100">
                <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Installation Status</span>
                    <span className={cn(
                        "text-[10px] font-black uppercase tracking-widest",
                        currentStatus === "COMPLETED" ? "text-emerald-600" : 
                        currentStatus === "IN_PROGRESS" ? "text-blue-500" : "text-slate-400"
                    )}>
                        {currentStatus.replace('_', ' ')}
                    </span>
                </div>
                
                <div className="flex p-1 bg-slate-200/50 rounded-2xl h-11">
                    {[
                        { id: "NOT_STARTED", label: "Pending", color: "text-slate-500" },
                        { id: "IN_PROGRESS", label: "Active", color: "text-blue-600" },
                        { id: "COMPLETED", label: "Done", color: "text-emerald-700" }
                    ].map((s) => (
                        <button
                            key={s.id}
                            onClick={() => handleStatusChange(s.id)}
                            className={cn(
                                "flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                                currentStatus === s.id 
                                    ? "bg-white text-[#1C3384] shadow-sm" 
                                    : "text-slate-400 hover:text-slate-600"
                            )}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 📸 Evidence Vault (Photos) */}
            <div className="flex-1 p-6 space-y-6">
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <Camera size={14} className="text-[#1C3384]" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#1C3384]">Site Photos</span>
                             <Badge variant="secondary" className="bg-blue-50 text-blue-600 border-none text-[8px] px-1.5 h-4">
                                {photoFiles.length}
                             </Badge>
                        </div>
                        
                        <label className="cursor-pointer">
                            <input 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept="image/*"
                                onChange={handleUpload}
                                disabled={isUploading}
                            />
                            <div className="h-8 px-3 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Plus size={14} /> Add Photos
                            </div>
                        </label>
                    </div>

                    {photoFiles.length > 0 ? (
                        <div className="grid grid-cols-4 gap-2">
                            {photoFiles.map((file: any) => (
                                <div key={file.id} className="aspect-square rounded-xl bg-slate-100 relative group overflow-hidden border border-slate-200">
                                    <img 
                                        src={file.fileUrl} 
                                        className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                                        alt="Site upload"
                                    />
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                         <button className="h-6 w-6 rounded-full bg-white text-slate-800 flex items-center justify-center">
                                            <Maximize2 size={12} />
                                         </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="aspect-video rounded-3xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-slate-300 gap-2 bg-slate-50/30">
                            <ImageIcon size={24} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">No photos yet</span>
                        </div>
                    )}
                </div>

                {/* 📄 Technical Docs */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                             <FileText size={14} className="text-[#1C3384]" />
                             <span className="text-[10px] font-black uppercase tracking-widest text-[#1C3384]">Technical Docs</span>
                             <Badge variant="secondary" className="bg-amber-50 text-amber-600 border-none text-[8px] px-1.5 h-4">
                                {docFiles.length}
                             </Badge>
                        </div>
                        
                        <label className="cursor-pointer">
                            <input 
                                type="file" 
                                className="hidden" 
                                multiple 
                                accept=".pdf,.doc,.docx"
                                onChange={handleUpload}
                                disabled={isUploading}
                            />
                            <div className="h-8 px-3 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 hover:bg-amber-100 transition-all text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Plus size={14} /> Add Docs
                            </div>
                        </label>
                    </div>

                    {docFiles.length > 0 ? (
                        <div className="space-y-2">
                            {docFiles.map((file: any) => (
                                <div key={file.id} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-2xl group hover:bg-white hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-3 overflow-hidden">
                                        <div className="h-8 w-8 rounded-lg bg-white flex items-center justify-center text-amber-600 border border-slate-100">
                                            <FileText size={14} />
                                        </div>
                                        <div className="flex flex-col overflow-hidden text-left">
                                            <span className="text-[10px] font-bold text-slate-700 truncate uppercase tracking-tight">{file.name}</span>
                                            <span className="text-[8px] font-medium text-slate-400 uppercase tracking-widest">
                                                {new Date(file.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <a 
                                        href={file.fileUrl} 
                                        target="_blank" 
                                        rel="noopener noreferrer" 
                                        className="h-7 w-7 rounded-lg bg-white text-slate-400 hover:text-[#1C3384] hover:shadow-sm flex items-center justify-center transition-all"
                                    >
                                        <Maximize2 size={12} />
                                    </a>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="p-6 rounded-3xl border-2 border-dashed border-slate-100 flex items-center justify-center text-slate-300 gap-2 bg-slate-50/30">
                            <FileText size={18} />
                            <span className="text-[9px] font-bold uppercase tracking-widest">No reports archived</span>
                        </div>
                    )}
                </div>
            </div>

            {/* 📤 Bottom Upload Progress Overlay */}
            {isUploading && (
                <div className="absolute inset-x-0 bottom-0 p-4 bg-white/95 backdrop-blur-sm border-t border-slate-100 flex items-center gap-4 animate-in slide-in-from-bottom-full duration-300">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                         <Clock size={18} className="animate-spin" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-blue-600">
                            <span>Syncing Evidence...</span>
                            <span>{progress}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-blue-100 rounded-full overflow-hidden">
                            <div 
                                className="h-full bg-blue-500 transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
