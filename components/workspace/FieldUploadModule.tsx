"use client";

import { Camera, ImagePlus, CheckCircle2, ShieldAlert, UploadCloud, Loader2, FileText, ArrowRight } from "lucide-react";
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { cn } from "@/lib/utils";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import Link from "next/link";

export function FieldUploadModule({ project }: { project: any }) {
    const { uploadFiles, isUploading, progress, status } = useProjectFileUpload();
    const { refresh } = useDashboardNexus();
    
    const [uploadingType, setUploadingType] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedType, setSelectedType] = useState<"SAFETY" | "PROGRESS" | "PUNCH" | null>(null);

    const handleTriggerUpload = (type: "SAFETY" | "PROGRESS" | "PUNCH") => {
        if (isUploading) return;
        setSelectedType(type);
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !selectedType) return;
        
        const files = Array.from(e.target.files);
        setUploadingType(selectedType);
        
        try {
            await uploadFiles(
                project.id,
                files,
                "EXECUTION",
                null,
                () => {
                    refresh(); // Refresh dashboard data to show new files
                },
                selectedType // Passes the sub-category as stage
            );
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setUploadingType(null);
            setSelectedType(null);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    // Filter project files to only show EXECUTION category files
    const executionFiles = (project.projectFiles || [])
        .filter((f: any) => f.category === "EXECUTION")
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                className="hidden" 
                multiple 
                accept="image/*,video/*"
            />
            
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-inner">
                    <Camera size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Field Uploads & Evidence</h2>
                    <p className="text-xs text-slate-500 font-medium">Capture safety, progress, and punch point photos natively.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Upload Buttons */}
                <div className="flex flex-col gap-4">
                    <UploadButton 
                        icon={ShieldAlert}
                        label="Safety Evidence"
                        type="SAFETY"
                        colorClass="text-indigo-600"
                        bgClass="hover:bg-indigo-50/50"
                        borderClass="hover:border-indigo-300"
                        isUploading={uploadingType === "SAFETY"}
                        onClick={() => handleTriggerUpload("SAFETY")}
                        progress={progress}
                        status={status}
                    />
                    <UploadButton 
                        icon={CheckCircle2}
                        label="Installation Progress"
                        type="PROGRESS"
                        colorClass="text-emerald-600"
                        bgClass="hover:bg-emerald-50/50"
                        borderClass="hover:border-emerald-300"
                        isUploading={uploadingType === "PROGRESS"}
                        onClick={() => handleTriggerUpload("PROGRESS")}
                        progress={progress}
                        status={status}
                    />
                    <UploadButton 
                        icon={ImagePlus}
                        label="Punch Point Resolve"
                        type="PUNCH"
                        colorClass="text-amber-600"
                        bgClass="hover:bg-amber-50/50"
                        borderClass="hover:border-amber-300"
                        isUploading={uploadingType === "PUNCH"}
                        onClick={() => handleTriggerUpload("PUNCH")}
                        progress={progress}
                        status={status}
                    />
                </div>

                <div className="lg:col-span-2 bg-slate-50 rounded-[2.5rem] border border-slate-200/60 overflow-hidden flex flex-col h-[500px]">
                    <div className="p-6 border-b border-slate-200/60 bg-white/50 flex items-center justify-between">
                         <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">Recent Captures</h3>
                         <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">{executionFiles.length} Photos</span>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-6 scrollbar-none">
                        {executionFiles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center opacity-60">
                                <Camera size={48} className="mx-auto mb-4 text-slate-300" />
                                <h4 className="text-lg font-black uppercase tracking-widest text-slate-400">No recent uploads</h4>
                                <p className="text-xs text-slate-400 mt-2">Select a category on the left to capture and tag a photo.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                {executionFiles.map((file: any) => (
                                    <Link key={file.id} href={file.fileUrl || '#'} target="_blank" className="group relative aspect-square rounded-3xl overflow-hidden border-2 border-slate-100 hover:border-indigo-400 transition-all bg-white shadow-sm block">
                                        <img src={file.fileUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-white mb-1">
                                                {file.uploadedAtStage}
                                            </span>
                                            <span className="text-xs text-white/80 font-medium truncate">
                                                {new Date(file.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function UploadButton({ icon: Icon, label, type, colorClass, bgClass, borderClass, isUploading, onClick, progress, status }: any) {
    return (
        <button 
            onClick={onClick}
            disabled={isUploading}
            className={cn(
                "group relative flex flex-col items-center justify-center p-8 bg-white border-2 border-dashed border-slate-200 rounded-3xl transition-all shadow-sm overflow-hidden",
                bgClass, borderClass,
                isUploading ? "border-solid border-indigo-200 bg-indigo-50/50 pointer-events-none" : ""
            )}
        >
            {isUploading ? (
                <div className="flex flex-col items-center">
                    <Loader2 size={32} className="mb-2 text-indigo-500 animate-spin" />
                    <span className="font-bold text-sm uppercase tracking-widest text-indigo-700">{progress}%</span>
                    <span className="text-[9px] text-indigo-500/70 uppercase tracking-widest font-bold mt-1">{status || "Uploading..."}</span>
                </div>
            ) : (
                <>
                    <Icon size={32} className={cn("mb-2 transition-colors", colorClass ? colorClass : "text-slate-400")} />
                    <span className={cn("font-bold text-sm uppercase tracking-widest transition-colors", colorClass ? colorClass : "text-slate-500")}>{label}</span>
                </>
            )}
        </button>
    );
}
