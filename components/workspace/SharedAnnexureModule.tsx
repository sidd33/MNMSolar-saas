"use client";

import { useState } from "react";
import { CheckCircle2, DownloadCloud, FileText, Settings, UploadCloud } from "lucide-react";
import { cn } from "@/lib/utils";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { toast } from "sonner";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";

interface SharedAnnexureModuleProps {
  projectId: string;
  projectFiles: any[];
  projectName: string;
}

export function SharedAnnexureModule({ projectId, projectFiles, projectName }: SharedAnnexureModuleProps) {
  const { uploadFiles, isUploading } = useProjectFileUpload();
  const { refresh, updateLocalProject } = useDashboardNexus();
  const [uploadingTag, setUploadingTag] = useState<string | null>(null);

  // Filter for Liaisoning files
  const liaisoningFiles = projectFiles.filter(f => f.category === "LIAISONING");
  
  // Basic Requirements
  const agreementFile = liaisoningFiles.find(f => f.name.includes("[AGREEMENT]") || f.name.toUpperCase().includes("AGREEMENT"));
  const testRecordFile = liaisoningFiles.find(f => f.name.includes("[TEST_RECORD]") || f.name.toUpperCase().includes("TEST_RECORD") || f.name.toUpperCase().includes("TEST_RECORDS"));
  const earthTestFile = liaisoningFiles.find(f => f.name.includes("[EARTH_TEST]") || f.name.toUpperCase().includes("EARTH_TEST"));
  const workCompFile = liaisoningFiles.find(f => f.name.includes("[WORK_COMP]") || f.name.toUpperCase().includes("WORK_COMP") || f.name.toUpperCase().includes("WORK COMPLETION"));

  // Annexures
  const annexureFiles = liaisoningFiles.filter(f => f.name.toLowerCase().includes("annexure"));
  const annexureCount = annexureFiles.length;

  const handleFileUpload = async (tag: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTag(tag);
    
    let finalName = file.name;
    if (tag === "ANNEXURE") {
        finalName = `Annexure_${annexureCount + 1}_${projectName}.pdf`;
    }

    const taggedFile = new File([file], `[${tag}]_${finalName}`, { type: file.type });

    try {
      await uploadFiles(projectId, [taggedFile], "LIAISONING", null, (savedFiles) => {
        const updatedFiles = [...projectFiles, ...savedFiles];
        updateLocalProject(projectId, { projectFiles: updatedFiles });
        toast.success(`${tag} uploaded successfully`);
        refresh();
      });
    } catch (e) {
      toast.error(`Failed to upload ${tag}`);
    } finally {
      setUploadingTag(null);
    }
  };

  const SharedDocSlot = ({ label, fileObject }: { label: string, fileObject?: any }) => {
    return (
        <div className={cn(
            "relative border border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center transition-all h-24",
            fileObject ? "bg-[#1C3384]/5 border-[#1C3384]/20" : "bg-slate-50 opacity-60"
        )}>
            {fileObject ? (
                <>
                    <CheckCircle2 size={24} className="mb-2 text-[#1C3384]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C3384] truncate w-full text-center px-2">{label}</p>
                    <a 
                      href={fileObject.fileUrl || `/api/files/proxy?url=${encodeURIComponent(fileObject.content)}`}
                      target="_blank" rel="noreferrer"
                      className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 opacity-0 hover:opacity-100 transition-opacity rounded-xl cursor-pointer"
                    >
                      <DownloadCloud size={20} className="text-[#1C3384] mb-1" />
                      <span className="text-[9px] font-bold text-[#1C3384] uppercase">Download Shared Doc</span>
                    </a>
                </>
            ) : (
                <>
                    <FileText size={24} className="mb-2 text-slate-300" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
                    <p className="text-[8px] mt-1 text-rose-500 font-bold uppercase tracking-widest bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 absolute top-2 right-2">Missing</p>
                </>
            )}
        </div>
    );
  };

  const DropSlot = ({ label, tag }: { label: string, tag: string }) => {
    return (
        <div className="relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all min-h-24 bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-emerald-500/50 cursor-pointer group">
            {uploadingTag === tag ? (
                <>
                    <Settings size={24} className="mb-2 animate-spin text-emerald-600" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">Uploading...</p>
                </>
            ) : (
                <>
                    <UploadCloud size={24} className="mb-2 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-emerald-600">{label}</p>
                </>
            )}
            {uploadingTag !== tag && (
                <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={uploadingTag !== null}
                    onChange={(e) => handleFileUpload(tag, e)}
                />
            )}
        </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h3 className="text-lg font-black uppercase tracking-tight text-[#1C3384] font-[family-name:var(--font-montserrat)]">Liaisoning Synchronization</h3>
          <p className="text-xs text-slate-500 font-medium">Shared documents from the Engineering Department</p>
        </div>
        <div className="bg-[#1C3384]/10 text-[#1C3384] px-3 py-1 rounded-full text-[10px] font-black tracking-widest uppercase">
          {liaisoningFiles.length} Authorized Files
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <SharedDocSlot label="Agreement" fileObject={agreementFile} />
        <SharedDocSlot label="Test Record" fileObject={testRecordFile} />
        <SharedDocSlot label="Earth Test" fileObject={earthTestFile} />
        <SharedDocSlot label="Work Completion" fileObject={workCompFile} />
      </div>

      <div className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-500">Annexure Sub-Track</h4>
          <span className="text-[10px] font-bold text-slate-400">{annexureCount}/5 Uploaded</span>
        </div>

        {annexureCount > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {annexureFiles.map((file, idx) => (
              <a 
                key={file.id} 
                href={file.fileUrl || `/api/files/proxy?url=${encodeURIComponent(file.content)}`}
                target="_blank" rel="noreferrer"
                className="flex items-center gap-2 bg-[#1C3384]/5 border border-[#1C3384]/10 p-2.5 rounded-lg group hover:bg-[#1C3384]/10 transition-colors"
              >
                <DownloadCloud size={14} className="text-[#1C3384]" />
                <span className="text-[10px] font-bold text-[#1C3384] truncate uppercase tracking-tighter">
                  Annexure {idx + 1}
                </span>
              </a>
            ))}
          </div>
        )}

        {annexureCount < 5 ? (
          <div className="mt-4">
            <DropSlot label={`Upload Missing Annexure ${annexureCount + 1}`} tag="ANNEXURE" />
          </div>
        ) : (
           <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2">
              <CheckCircle2 size={24} className="text-emerald-500" />
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">All Annexures Synchronized</p>
           </div>
        )}
      </div>
    </div>
  );
}
