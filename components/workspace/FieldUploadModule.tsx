"use client";

import { Camera, CalendarIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export function FieldUploadModule({ project }: { project: any }) {
    // 1. Get historical files from static cache
    const executionFiles = (project.projectFiles || [])
        .filter((f: any) => f.category === "EXECUTION");

    // 2. Get highly reactive newly uploaded files from DPR metadata
    let existingDPRs: any[] = [];
    const rawDpr = project?.executionMetadata?.dpr;
    if (Array.isArray(rawDpr)) {
        existingDPRs = rawDpr;
    } else if (rawDpr?.records && Array.isArray(rawDpr.records)) {
        existingDPRs = rawDpr.records;
    } else if (rawDpr && typeof rawDpr === 'object') {
        existingDPRs = Object.values(rawDpr).filter((v: any) => v && v.id && v.date);
    }

    // 3. Merge them, avoiding duplicates by URL
    const mergedFilesMap = new Map();

    executionFiles.forEach((f: any) => {
        mergedFilesMap.set(f.fileUrl, {
            id: f.id,
            fileUrl: f.fileUrl,
            name: f.name,
            createdAt: f.createdAt,
            uploadedAtStage: f.uploadedAtStage || 'GENERAL'
        });
    });

    existingDPRs.forEach(dpr => {
        if (dpr.attachedFiles && Array.isArray(dpr.attachedFiles)) {
            dpr.attachedFiles.forEach((f: any) => {
                if (!mergedFilesMap.has(f.url)) {
                    mergedFilesMap.set(f.url, {
                        id: f.url, 
                        fileUrl: f.url,
                        name: f.name,
                        createdAt: dpr.createdAt || dpr.date,
                        uploadedAtStage: project.stage || 'GENERAL'
                    });
                }
            });
        }
    });

    const allExecutionFiles = Array.from(mergedFilesMap.values())
        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Group files by date
    const groupedFiles = allExecutionFiles.reduce((acc: any, file: any) => {
        const dateString = new Date(file.createdAt).toISOString().split('T')[0];
        if (!acc[dateString]) acc[dateString] = [];
        acc[dateString].push(file);
        return acc;
    }, {});
    
    // Sort dates descending
    const sortedDates = Object.keys(groupedFiles).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

    return (
        <div className="flex flex-col h-full animate-in fade-in duration-500">
            {allExecutionFiles.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 bg-slate-50/50 rounded-[3rem] border border-dashed border-slate-200">
                    <Camera size={48} className="mx-auto mb-4 text-slate-300" />
                    <h4 className="text-lg font-black uppercase tracking-widest text-slate-400">No photos yet</h4>
                    <p className="text-xs text-slate-400 mt-2">Photos uploaded via Daily Progress will appear here.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-y-auto scrollbar-none pr-2 space-y-12 pb-12">
                    {sortedDates.map(dateStr => (
                        <div key={dateStr} className="space-y-4">
                            <div className="flex items-center gap-3 border-b border-slate-100 pb-2">
                                <CalendarIcon size={16} className="text-slate-400" />
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                                    {format(new Date(dateStr), 'EEEE, MMMM do, yyyy')}
                                </h3>
                                <Badge variant="outline" className="ml-2 text-[9px] font-bold uppercase tracking-widest text-slate-400 border-slate-200">
                                    {groupedFiles[dateStr].length} Photos
                                </Badge>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                {groupedFiles[dateStr].map((file: any) => (
                                    <Link key={file.id} href={file.fileUrl || '#'} target="_blank" className="group relative aspect-square rounded-[2rem] overflow-hidden border-2 border-slate-100 hover:border-indigo-400 transition-all bg-white shadow-sm block">
                                        <img src={file.fileUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-5">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Badge className="bg-white/20 text-white hover:bg-white/30 font-black text-[9px] uppercase tracking-widest border-none backdrop-blur-sm">
                                                    {file.uploadedAtStage?.replace(/_/g, ' ') || 'GENERAL'}
                                                </Badge>
                                            </div>
                                            <span className="text-xs text-white/80 font-medium truncate">
                                                {new Date(file.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
