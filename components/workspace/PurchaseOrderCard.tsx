"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, UploadCloud, ArrowRight, Settings, Trash2, Edit3, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { forwardProject, deleteProjectFile } from "@/app/actions/project";
import { formatDistanceToNow } from "date-fns";

interface PurchaseOrderCardProps {
  project: any;
  initialFiles: any[];
}

export function PurchaseOrderCard({ project, initialFiles }: PurchaseOrderCardProps) {
  const { refresh, updateLocalProject } = useDashboardNexus();
  const [files, setFiles] = useState(initialFiles || []);
  const { uploadFiles } = useProjectFileUpload();
  const [uploadingTag, setUploadingTag] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      setFiles(initialFiles);
    } else if (files.length === 0 && initialFiles) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  const vendorQuotesFile = files.find((f: any) => f.name.includes("[VENDOR_QUOTES]"));
  const poFile = files.find((f: any) => f.name.includes("[PURCHASE_ORDER]"));
  const piFile = files.find((f: any) => f.name.includes("[PROFORMA_INVOICE]"));

  const checklistComplete = !!vendorQuotesFile && !!poFile && !!piFile;
  const completedCount = [!!vendorQuotesFile, !!poFile, !!piFile].filter(Boolean).length;
  const totalItems = 3;

  const handleFileUpload = async (tag: string, e: React.ChangeEvent<HTMLInputElement>, existingFileId: string | null = null) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingTag(tag);
    try {
      const renamedFile = new File([file], `[${tag}] ${file.name}`, { type: file.type });
      await uploadFiles(project.id, [renamedFile], "PROCUREMENT" as any, existingFileId, (savedFiles) => {
        let updatedFiles;
        if (existingFileId) {
          updatedFiles = files.map(f => f.id === existingFileId ? savedFiles[0] : f);
        } else {
          updatedFiles = [...files, ...savedFiles];
        }
        setFiles(updatedFiles);
        updateLocalProject(project.id, { projectFiles: updatedFiles });
        toast.success(existingFileId ? `${tag} replaced successfully` : `${tag} verified and attached`);
        refresh();
      });
    } catch (err: any) {
      toast.error(err.message || `Failed to upload ${tag}`);
    } finally {
      setUploadingTag(null);
    }
  };

  const handleDeleteFile = async (fileId: string, tag: string) => {
    if (!confirm(`Are you sure you want to delete the uploaded ${tag} documentation?`)) return;

    const loadingToast = toast.loading(`Deleting ${tag}...`);
    try {
      await deleteProjectFile(fileId, project.id);
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      updateLocalProject(project.id, { projectFiles: updatedFiles });
      toast.success(`${tag} deleted successfully`, { id: loadingToast });
      refresh();
    } catch (e) {
      toast.error(`Failed to delete ${tag}`, { id: loadingToast });
    }
  };

  async function handleHandoff() {
    if (!checklistComplete) {
      toast.error("Please upload all required Purchase Order documents first");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading("Marking POs Issued...");
    try {
      const formData = new FormData();
      formData.append("projectId", project.id);
      formData.append("nextStage", "MATERIAL_PROCUREMENT");
      formData.append("comment", "Purchase Orders Issued");
      await forwardProject(formData);
      toast.success("POs Issued! Project ready for Dispatch", { id: toastId });
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to process handoff", { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  }

  const DropSlot = ({ label, tag, fileObject, fileCount }: { label: string, tag: string, fileObject?: any, fileCount?: number }) => {
    const isComplete = !!fileObject;
    const count = fileCount || (isComplete ? 1 : 0);
    return (
      <div className={cn(
        "relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all min-h-24 group/slot cursor-pointer",
        isComplete ? "bg-emerald-50 border-emerald-200 text-emerald-700 hover:border-emerald-400" : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-[#1C3384]/50 text-slate-500"
      )}>
        {uploadingTag === tag ? (
          <>
            <Settings size={24} className="mb-2 animate-spin text-[#1C3384]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#1C3384]">Uploading...</p>
          </>
        ) : isComplete ? (
          <>
            <CheckCircle2 size={24} className="mb-2 text-emerald-500" />
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{label} ({count})</p>
            <p className="text-[9px] font-bold text-emerald-500/70 mt-1">TAP TO ADD MORE</p>
          </>
        ) : (
          <>
            <UploadCloud size={24} className="mb-2 text-slate-400 group-hover/slot:text-[#1C3384] transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">{label}</p>
          </>
        )}
        {uploadingTag !== tag && (
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" disabled={uploadingTag !== null} onChange={(e) => handleFileUpload(tag, e)} />
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border border-slate-100 shadow-xl bg-white [contain:paint] will-change-transform group rounded-[2.5rem] transition-all hover:shadow-2xl hover:border-[#1C3384]/20 p-0">
      <div>
        <div className="p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Badge className="bg-blue-100 text-blue-700 font-black px-4 py-1.5 uppercase tracking-[0.15em] text-[9px] border-none rounded-full shrink-0">
                  {project.stage?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 whitespace-nowrap">
                  REF: <span className="text-slate-900 font-black">{project.name.split(' ')[0]}</span>
                  {files.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 italic">
                      {files.length} Assets
                    </span>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h2 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase">
              {project.name.replace(/\[.*?\]\s*/, '')}
            </h2>
          </div>

          <div className="flex items-center gap-2 mb-8 border-b border-slate-100 pb-4">
            <ShoppingCart size={16} className="text-[#1C3384]" />
            <span className="text-xs font-black uppercase tracking-[0.2em] text-[#1C3384]">Purchase Orders Checklist</span>
            <div className="ml-auto text-xs font-black flex items-center gap-2">
              <span className={cn(checklistComplete ? "text-emerald-500" : "text-amber-500")}>
                {completedCount}/{totalItems} Verified
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
             <DropSlot label="1. Vendor Quotes" tag="VENDOR_QUOTES" fileObject={vendorQuotesFile} />
             <DropSlot label="2. Issued PO" tag="PURCHASE_ORDER" fileObject={poFile} />
             <DropSlot label="3. Proforma Invoice" tag="PROFORMA_INVOICE" fileObject={piFile} />
          </div>
        </div>

        <div className="bg-[#F8FAFC] border-t border-slate-100 p-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 w-full lg:w-1/3">
              <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0 flex flex-col items-center">
                <span className="text-slate-800 text-xs">
                   {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                </span>
                UPDATED
              </div>
              <div className="flex-1 flex gap-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                {Array.from({ length: totalItems }).map((_, i) => (
                  <div key={i} className={cn("h-full flex-1 transition-colors duration-500", i < completedCount ? "bg-emerald-500" : "bg-transparent")} />
                ))}
              </div>
            </div>
            
            <Button
              disabled={!checklistComplete || isProcessing}
              onClick={handleHandoff}
              className={cn("h-12 px-8 rounded-xl font-black tracking-widest uppercase transition-all shadow-lg text-xs w-full lg:w-auto", checklistComplete ? "bg-[#1C3384] text-white hover:bg-blue-900 shadow-blue-900/20 hover:scale-105" : "bg-slate-200 text-slate-400")}
            >
              Mark POs Issued & Forward to Dispatch
              <ArrowRight size={14} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}
