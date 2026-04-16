"use client";

import { useState, useMemo, useEffect } from "react";
import { ShieldCheck, Zap, Receipt, CheckCircle2, Eye, Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProjectFiles } from "@/app/actions/project";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";

interface DocumentationVaultProps {
  projectId: string;
  projectStage?: string;
  initialFiles: any[];
  onFilesChange?: (hasLiaisoning: boolean) => void;
}

export function DocumentationVault({ projectId, projectStage, initialFiles, onFilesChange }: DocumentationVaultProps) {
  const [files, setFiles] = useState(initialFiles);
  const { uploadFiles, isUploading, progress, status } = useProjectFileUpload();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const categories = [
    { id: "LIAISONING", label: "Liaisoning Docs", icon: ShieldCheck, sub: "Feasibility, DISCOM App" },
    { id: "TECHNICAL", label: "Technical Docs", icon: Zap, sub: "Site Survey, SLD Drawings" },
    { id: "COMMERCIAL", label: "Commercial Docs", icon: Receipt, sub: "Agreement, Receipts" },
  ];

  const hasCategory = (cat: string) => files.some(f => f.category === cat && f.uploadedAtStage === projectStage);
  const getFileForCategory = (cat: string) => files.find(f => f.category === cat && f.uploadedAtStage === projectStage);
  const hasLiaisoning = hasCategory("LIAISONING");

  useEffect(() => {
    if (onFilesChange) {
      onFilesChange(hasLiaisoning);
    }
  }, [hasLiaisoning, onFilesChange]);

  const handleUpload = async (category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setActiveCategory(category);
    const existingFile = getFileForCategory(category);
    
    try {
      await uploadFiles(
        projectId, 
        [file], 
        category as any, 
        existingFile?.id || null,
        (savedFiles) => {
          // Update state with the newly saved/updated files
          setFiles(prev => {
            const newFiles = [...prev];
            savedFiles.forEach(saved => {
              const idx = newFiles.findIndex(f => f.category === saved.category);
              if (idx > -1) {
                newFiles[idx] = saved;
              } else {
                newFiles.push(saved);
              }
            });
            return newFiles;
          });
        }
      );
    } catch (error) {
      console.error("Handoff upload error:", error);
    } finally {
      setActiveCategory(null);
    }
  };

  return (
    <div className="space-y-4">
      <h5 className="text-[10px] font-black uppercase tracking-widest text-[#1C3384] font-[family-name:var(--font-montserrat)] mb-2">
        Required Paperwork & File Vault
      </h5>
      
      <div className="grid grid-cols-1 gap-2">
        {categories.map((cat) => {
          const currentIsUploading = isUploading && activeCategory === cat.id;
          const uploaded = hasCategory(cat.id);
          const Icon = cat.icon;

          return (
            <div key={cat.id} className={cn(
              "flex items-center justify-between p-3 rounded-xl border transition-all",
              uploaded ? "bg-green-50/50 border-green-100" : "bg-white border-slate-100"
            )}>
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center shadow-sm",
                  uploaded ? "bg-green-500 text-white" : "bg-slate-50 text-slate-400"
                )}>
                  {uploaded ? <CheckCircle2 size={16} /> : <Icon size={16} />}
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-slate-700 uppercase tracking-tight">{cat.label}</span>
                  <span className="text-[9px] text-slate-400 font-medium">{cat.sub}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {uploaded && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const file = getFileForCategory(cat.id);
                      if (file) {
                        const url = file.fileUrl || (file.content.startsWith('http') ? file.content : `/api/files/proxy?url=${encodeURIComponent(file.content)}`);
                        window.open(url, '_blank');
                      }
                    }}
                    className="h-7 w-7 text-slate-400 hover:text-[#1C3384]"
                  >
                    <Eye size={14} />
                  </Button>
                )}
                
                <label className={cn(
                  "cursor-pointer h-7 px-3 rounded-lg flex items-center gap-1.5 transition-all text-[9px] font-black uppercase",
                  uploaded 
                    ? "bg-slate-100 text-slate-400 hover:bg-slate-200" 
                    : "bg-[#1C3384] text-white hover:opacity-90 shadow-sm"
                )}>
                  {currentIsUploading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Upload size={12} />
                  )}
                  {currentIsUploading ? (status || `${progress}%`) : (uploaded ? "Replace" : "Upload")}
                  <input 
                    type="file" 
                    className="hidden" 
                    onChange={(e) => handleUpload(cat.id, e)}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
          );
        })}
      </div>

      {!hasLiaisoning && (
        <p className="text-[9px] font-bold text-[#FF4D4D] italic animate-pulse">
          * Please upload Liaisoning Docs (Feasibility Approval) to unlock handoff.
        </p>
      )}
    </div>
  );
}
