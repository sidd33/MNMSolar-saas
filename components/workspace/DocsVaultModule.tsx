"use client";

import { FolderOpen, FileText, Download, ShieldCheck, Zap, Receipt, AlertCircle, HardHat } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export function DocsVaultModule({ project }: { project: any }) {
    const files = project.projectFiles || [];

    const categories = [
        { id: "TECHNICAL", label: "Engineering Blueprints", icon: Zap, color: "text-blue-500", bg: "bg-blue-50" },
        { id: "COMMERCIAL", label: "PO & Invoices", icon: Receipt, color: "text-emerald-500", bg: "bg-emerald-50" },
        { id: "LIAISONING", label: "Permits & Net Metering", icon: ShieldCheck, color: "text-indigo-500", bg: "bg-indigo-50" },
        { id: "EXECUTION", label: "Site Photos", icon: HardHat, color: "text-amber-500", bg: "bg-amber-50" },
        { id: "HANDOVER_SHEET", label: "Commissioning Docs", icon: FileText, color: "text-purple-500", bg: "bg-purple-50" },
    ];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <FolderOpen size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Project Docs Vault</h2>
                    <p className="text-xs text-slate-500 font-medium">Engineering blueprints and approved challans</p>
                </div>
            </div>

            <div className="space-y-8">
                {categories.map((cat) => {
                    const catFiles = files.filter((f: any) => f.category === cat.id);
                    if (catFiles.length === 0) return null;

                    return (
                        <div key={cat.id} className="space-y-4">
                            <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg ${cat.bg} ${cat.color} flex items-center justify-center`}>
                                    <cat.icon size={16} />
                                </div>
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-700">{cat.label}</h3>
                                <Badge variant="outline" className="ml-2 text-[10px] font-bold bg-slate-50">{catFiles.length} Files</Badge>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pl-10">
                                {catFiles.map((file: any) => (
                                    <div key={file.id} className="group flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                                                <FileText size={20} className="text-slate-400" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-slate-700 truncate">{file.name}</p>
                                                <p className="text-[10px] text-slate-400 font-medium mt-0.5 uppercase tracking-wider">
                                                    {new Date(file.createdAt).toLocaleDateString()} • {file.uploadedAtStage}
                                                </p>
                                            </div>
                                        </div>
                                        <Link 
                                            href={file.fileUrl || '#'} 
                                            target="_blank"
                                            className="h-10 w-10 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-400 hover:text-blue-600 flex items-center justify-center transition-colors shrink-0"
                                        >
                                            <Download size={18} />
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}

                {files.length === 0 && (
                    <div className="flex flex-col items-center justify-center p-20 text-center bg-slate-50 rounded-[3rem] border border-dashed border-slate-200">
                        <div className="opacity-50">
                            <FolderOpen size={64} className="mx-auto mb-4 text-slate-400" />
                            <h4 className="text-lg font-black uppercase tracking-widest text-slate-500">Vault is empty</h4>
                            <p className="text-sm text-slate-400 mt-2 font-medium">No documents have been uploaded to this project yet.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
