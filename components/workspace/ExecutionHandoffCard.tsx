"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Eye, AlertCircle, FileCheck, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Project360Modal } from "../dashboard/Project360Modal";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import { SharedAnnexureModule } from "./SharedAnnexureModule";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";

interface ExecutionHandoffCardProps {
  project: any;
  initialFiles?: any[];
  activeSection: string; // The layout parent now passes this context down
}

export function ExecutionHandoffCard({ project, initialFiles = [], activeSection }: ExecutionHandoffCardProps) {
  const [modalOpen, setModalOpen] = useState(false);
  
  // Manage files locally initialized from props
  const [files, setFiles] = useState<any[]>(initialFiles);
  
  const { uploadFiles } = useProjectFileUpload();
  const { refresh, updateLocalProject } = useDashboardNexus();

  // Sync state with incoming props safely
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
        setFiles(initialFiles);
    } else if (files.length === 0 && initialFiles) {
        setFiles(initialFiles);
    }
  }, [initialFiles]);

  const handleExecutionUpload = async (event: React.ChangeEvent<HTMLInputElement>, prefix: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const taggedFile = new File([file], `[${prefix}]_${file.name}`, { type: file.type });
    const toastId = toast.loading(`Uploading ${prefix}...`);

    try {
      await uploadFiles(project.id, [taggedFile], "EXECUTION", null, (savedFiles) => {
        const updatedFiles = [...files, ...savedFiles];
        setFiles(updatedFiles);
        updateLocalProject(project.id, { projectFiles: updatedFiles });
        toast.success(`Uploaded successfully`, { id: toastId });
        refresh(); // Triggers server-side re-count if needed
      });
    } catch {
      toast.error(`Failed to upload`, { id: toastId });
    }
  };

  const renderContent = () => {
    switch (activeSection) {
      case "liaisoning-sync":
        return <SharedAnnexureModule projectId={project.id} projectName={project.name} projectFiles={files} />;
      
      case "material-inward":
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#1C3384] font-[family-name:var(--font-montserrat)]">Material Inward</h3>
                    <p className="text-xs text-slate-500 font-medium">Upload and verify delivery challans</p>
                </div>
                
                <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center relative hover:border-[#1C3384]/30 hover:bg-[#1C3384]/5 transition-colors group cursor-pointer">
                    <FileCheck size={32} className="mb-3 text-slate-300 group-hover:text-[#1C3384]" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-600 group-hover:text-[#1C3384]">Upload Challan</p>
                    <p className="text-[10px] uppercase font-bold text-slate-400 mt-1">PDF or Image</p>
                    <input type="file" onChange={(e) => handleExecutionUpload(e, "CHALLAN")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                {files.filter(f => f.category === "EXECUTION" && f.name.includes("CHALLAN")).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {files.filter(f => f.category === "EXECUTION" && f.name.includes("CHALLAN")).map((file: any) => (
                             <a 
                                key={file.id} 
                                href={file.fileUrl || `/api/files/proxy?url=${encodeURIComponent(file.content)}`}
                                target="_blank" rel="noreferrer"
                                className="flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-xl hover:border-[#1C3384]/30 transition-colors"
                             >
                               <div className="flex items-center gap-2">
                                  <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                  <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                               </div>
                             </a>
                        ))}
                    </div>
                )}
            </div>
        );

      case "punch-points":
        return (
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-black uppercase tracking-tight text-[#1C3384] font-[family-name:var(--font-montserrat)]">Punch Points</h3>
                    <p className="text-xs text-slate-500 font-medium">Record required fixes before handover</p>
                </div>
                
                 <div className="border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl p-8 flex flex-col items-center justify-center relative hover:border-amber-500/30 hover:bg-amber-50 cursor-pointer group transition-colors">
                    <AlertCircle size={32} className="mb-3 text-slate-300 group-hover:text-amber-500" />
                    <p className="text-sm font-black uppercase tracking-widest text-slate-600 group-hover:text-amber-600">Upload Punch List</p>
                    <input type="file" onChange={(e) => handleExecutionUpload(e, "PUNCH")} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                </div>

                {files.filter(f => f.category === "EXECUTION" && f.name.includes("PUNCH")).length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {files.filter(f => f.category === "EXECUTION" && f.name.includes("PUNCH")).map((file: any) => (
                             <a 
                                key={file.id} 
                                href={file.fileUrl || `/api/files/proxy?url=${encodeURIComponent(file.content)}`}
                                target="_blank" rel="noreferrer"
                                className="flex flex-col gap-2 bg-white border border-slate-200 p-3 rounded-xl hover:border-amber-500/30 transition-colors"
                             >
                               <div className="flex items-center gap-2">
                                  <AlertCircle size={14} className="text-amber-500 shrink-0" />
                                  <span className="text-[10px] font-bold text-slate-700 truncate">{file.name}</span>
                               </div>
                             </a>
                        ))}
                    </div>
                )}
            </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50/50 rounded-2xl border border-slate-200">
             <div className="h-16 w-16 mb-4 rounded-full bg-slate-100 flex items-center justify-center blur-[1px] shadow-sm">
                <Clock size={24} className="text-slate-400" />
             </div>
             <p className="text-sm font-bold text-slate-700">Module Under Construction</p>
             <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-medium">Awaiting component load for {activeSection}</p>
          </div>
        );
    }
  };

  return (
    <Card className="overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:border-slate-300 bg-white rounded-3xl transition-all flex flex-col mb-6">
      
      {/* Top Bar Navigation/Header */}
      <div className="h-16 shrink-0 bg-slate-50 border-b border-slate-100 flex items-center justify-between px-6 z-10">
         <div className="flex items-center gap-4">
              <Badge className="bg-[#1C3384] text-white font-extrabold px-3 py-1 uppercase tracking-widest text-[9px] rounded-lg">
                {project.executionStage?.replace(/_/g, ' ') || 'SITE SETUP'}
              </Badge>
              <div>
                <h3 className="text-base font-black tracking-tight text-[#0F172A] font-[family-name:var(--font-montserrat)] uppercase">
                  {project.name}
                </h3>
              </div>
         </div>
         <button
              onClick={() => setModalOpen(true)}
              className="h-8 px-4 rounded-xl bg-white border border-slate-200 hover:bg-[#1C3384] hover:text-white hover:border-[#1C3384] text-slate-600 font-bold text-[10px] uppercase tracking-widest transition-all gap-2 flex items-center shadow-sm"
            >
              <Eye size={14} /> Open Vault
         </button>
      </div>

      {/* Unified Workspace directly in the card body */}
      <div className="p-8">
        <div className="max-w-5xl mx-auto">
            {renderContent()}
        </div>
      </div>

      <Project360Modal projectId={project.id} open={modalOpen} onOpenChange={setModalOpen} initialData={project} />
    </Card>
  );
}
