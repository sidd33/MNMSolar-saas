"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, FastForward, ArrowRight, Clock, Eye, DownloadCloud, Settings, Split, CheckCircle2, UploadCloud, AlertCircle, Trash2, Edit3, Camera, Map, Zap, Layout } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { forwardProject, deleteProjectFile } from "@/app/actions/project";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
const Project360Modal = dynamic(() => import("@/components/dashboard/Project360Modal").then(mod => mod.Project360Modal), { ssr: false });
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import { useUser } from "@clerk/nextjs";
import { claimProject, unclaimProject } from "@/lib/actions/engineering";
import { ProjectCommentBox } from "@/components/engineering/ProjectCommentBox";
import { MessageSquare, ChevronDown, ChevronUp } from "lucide-react";

interface SurveyHandoffCardProps {
  project: any;
  dept: string;
  initialFiles: any[];
}

export function SurveyHandoffCard({ project, dept, initialFiles }: SurveyHandoffCardProps) {
  const { refresh, updateLocalProject } = useDashboardNexus();
  const [files, setFiles] = useState(initialFiles);
  const [modalOpen, setModalOpen] = useState(false);
  const [commentsExpanded, setCommentsExpanded] = useState(false);

  const { uploadFiles, isUploading } = useProjectFileUpload();
  const [uploadingTag, setUploadingTag] = useState<string | null>(null);

  const { user } = useUser();
  const role = user?.publicMetadata?.role as string;
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';

  useEffect(() => {
    if (initialFiles) {
      setFiles(initialFiles);
    }
  }, [initialFiles]);

  // Detection logic for survey files
  const sarFile = files.find(f => f.name.includes("[SAR]") || f.name.toUpperCase().includes("AUDIT_REPORT"));
  const roofDimFile = files.find(f => f.name.includes("[ROOF_DIM]") || f.name.toUpperCase().includes("ROOF_DIMENSIONS"));
  const ePanelFile = files.find(f => f.name.includes("[E_PANEL]") || f.name.toUpperCase().includes("ELECTRICAL_PANEL"));
  const shadowFile = files.find(f => f.name.includes("[SHADOW]") || f.name.toUpperCase().includes("SHADOW_ANALYSIS") || f.name.toUpperCase().includes("SUNPATH"));
  const photoGallery = files.filter(f => f.name.includes("[SITE_PHOTO]") || f.name.toUpperCase().includes("PHOTO"));

  const isSurveyComplete = !!sarFile && !!roofDimFile && !!ePanelFile && !!shadowFile && photoGallery.length > 0;
  const completedCount = [!!sarFile, !!roofDimFile, !!ePanelFile, !!shadowFile, photoGallery.length > 0].filter(Boolean).length;

  const handleClaim = async () => {
    const toastId = toast.loading("Processing claim...");
    try {
      await claimProject(project.id);
      toast.success("Project claimed successfully", { id: toastId });
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to claim project", { id: toastId });
    }
  };

  const handleUnclaim = async () => {
    const toastId = toast.loading("Releasing claim...");
    try {
      await unclaimProject(project.id);
      toast.success("Project released", { id: toastId });
      refresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to release claim", { id: toastId });
    }
  };

  async function handleHandoff(formData: FormData) {
    if (!isSurveyComplete) {
      toast.error("Raw field data incomplete.");
      return;
    }

    formData.append("nextStage", "DETAILED_ENGG");
    formData.append("department", "Engineering");
    formData.append("currentStage", project.stage);

    try {
      await forwardProject(formData);
      toast.success(`Survey data dispatched to Detailed Engineering`);
      refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to dispatch survey data");
    }
  }

  const handleFileUpload = async (tag: string, event: React.ChangeEvent<HTMLInputElement>, existingFileId: string | null = null) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingTag(tag);
    const taggedFile = new File([file], `[${tag}]_${file.name}`, { type: file.type });
    try {
      await uploadFiles(project.id, [taggedFile], "TECHNICAL", existingFileId, (savedFiles) => {
        let updatedFiles = existingFileId ? files.map(f => f.id === existingFileId ? savedFiles[0] : f) : [...files, ...savedFiles];
        setFiles(updatedFiles);
        updateLocalProject(project.id, { projectFiles: updatedFiles });
        toast.success(`${tag} uploaded`);
        refresh();
      });
    } catch (e) {
      toast.error(`Upload failed`);
    } finally {
      setUploadingTag(null);
    }
  };

  const handleDeleteFile = async (fileId: string, tag: string) => {
    if (!confirm(`Delete this ${tag}?`)) return;
    try {
      await deleteProjectFile(fileId, project.id);
      const updatedFiles = files.filter(f => f.id !== fileId);
      setFiles(updatedFiles);
      updateLocalProject(project.id, { projectFiles: updatedFiles });
      toast.success(`${tag} removed`);
      refresh();
    } catch (e) {
      toast.error(`Delete failed`);
    }
  };

  const DropSlot = ({ label, tag, fileObject, index }: { label: string, tag: string, fileObject?: any, index: number }) => {
    const isComplete = !!fileObject;

    return (
      <div className={cn(
        "relative border-2 border-dashed rounded-[1.25rem] p-4 flex flex-col items-center justify-center transition-all min-h-[110px] group/slot",
        isComplete ? "bg-[#F0FFF4] border-[#C6F6D5] text-[#2F855A]" : "bg-white border-[#E2E8F0] hover:bg-slate-50 hover:border-[#1C3384]/30 cursor-pointer text-slate-500"
      )}>
        {isComplete ? (
          <>
            <CheckCircle2 size={20} className="mb-1 text-[#48BB78]" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center px-2">{index}. {label}</p>
            
            <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover/slot:opacity-100 transition-opacity">
              <div className="relative">
                <Button size="icon" variant="ghost" className="h-6 w-6 rounded-full bg-white shadow-sm border border-slate-100 hover:text-blue-600 transition-all">
                  <Edit3 size={10} />
                </Button>
                <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(tag, e, fileObject.id)} />
              </div>
              <Button size="icon" variant="ghost" onClick={() => handleDeleteFile(fileObject.id, tag)} className="h-6 w-6 rounded-full bg-white shadow-sm border border-slate-100 hover:text-rose-600 transition-all">
                <Trash2 size={10} />
              </Button>
            </div>
          </>
        ) : uploadingTag === tag ? (
          <Settings size={20} className="animate-spin text-[#1C3384]" />
        ) : (
          <>
            <UploadCloud size={24} className="mb-1 text-[#CBD5E0] group-hover/slot:text-[#1C3384] transition-colors" />
            <p className="text-[10px] font-black uppercase tracking-widest text-center px-2">{index}. {label}</p>
          </>
        )}
        {!isComplete && uploadingTag !== tag && (
          <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(tag, e)} />
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-none shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] bg-white rounded-[2.5rem] transition-all hover:shadow-[0_30px_50px_-20px_rgba(0,0,0,0.12)] p-0">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Left Section (White) */}
        <div className="lg:col-span-8 p-8 lg:p-10 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Badge className="bg-[#EDF2F7] text-[#4A5568] font-black px-3 py-1 uppercase tracking-widest text-[8px] border-none rounded-full">
                  {project.stage?.replace(/_/g, ' ')}
                </Badge>
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0]">
                  REF: <span className="text-[#1A202C] font-black">[{project.name.split(' ')[0]}]</span>
                </span>
              </div>
              {project.assignedAt && (
                <span className="text-[7px] font-bold text-slate-300 uppercase mt-2 ml-1">
                  Team Assigned {formatDistanceToNow(new Date(project.assignedAt), { addSuffix: true })}
                </span>
              )}
            </div>
            <div className="flex items-center gap-6 ml-auto">
               {project.assignedEngineers?.length > 0 && (
                  <div className="flex items-center gap-3">
                     <div className="flex -space-x-2">
                        {project.assignedEngineers.map((eng: any) => (
                           <Badge key={eng.id} className={cn(
                              "font-black px-2.5 py-1 uppercase tracking-wider text-[8px] rounded-full border-2 border-white shadow-sm",
                              eng.id === user?.id ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-400"
                           )}>
                              {eng.email.split('@')[0].toUpperCase()}
                           </Badge>
                        ))}
                     </div>
                  </div>
               )}

               <Button
                 size="icon"
                 variant="ghost"
                 onClick={() => setModalOpen(true)}
                 className="h-9 w-9 rounded-full bg-slate-50 hover:bg-[#1C3384] hover:text-white text-slate-400 transition-all border border-slate-100"
               >
                 <Eye size={16} />
               </Button>
            </div>
          </div>

          <div className="mb-8">
            <h3 className="text-2xl font-black leading-none tracking-tighter text-[#1C3384] font-[family-name:var(--font-montserrat)] uppercase mb-3">
              {project.name}
            </h3>
            <div className="flex items-center gap-2">
                <Shield size={14} className="text-[#1C3384]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#1C3384]">ENGINEERING GATED CHECKLIST</span>
                <div className="ml-auto flex items-center gap-2">
                    <span className="text-[10px] font-black text-[#FFC800]">{completedCount}/5 Verified</span>
                </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
             <DropSlot index={1} label="Site Audit Report (SAR)" tag="SAR" fileObject={sarFile} />
             <DropSlot index={2} label="Roof Dimensions" tag="ROOF_DIM" fileObject={roofDimFile} />
             <DropSlot index={3} label="Electrical Panel Audit" tag="E_PANEL" fileObject={ePanelFile} />
             <DropSlot index={4} label="Sunpath/Shadow Analysis" tag="SHADOW" fileObject={shadowFile} />
             
             {/* Photo Gallery Custom Slot */}
             <div className="md:col-span-2 relative border-2 border-dashed rounded-[1.25rem] p-6 bg-[#F8FAFC] border-[#E2E8F0] flex items-center justify-between group/photos hover:border-[#1C3384]/30 transition-all min-h-[110px]">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 bg-white rounded-xl border border-[#E2E8F0] flex items-center justify-center text-[#CBD5E0] shadow-sm">
                        {uploadingTag === "PHOTOS" ? <Settings size={24} className="animate-spin text-[#1C3384]" /> : <Camera size={24} />}
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-[#1A202C]">5. Site Photo Gallery</p>
                        <p className={cn(
                            "text-[8px] font-bold uppercase tracking-widest mt-0.5 transition-colors",
                            uploadingTag === "PHOTOS" ? "text-[#1C3384] animate-pulse" : "text-[#A0AEC0]"
                        )}>
                            {uploadingTag === "PHOTOS" ? "Uploading intel..." : `${photoGallery.length} Requirement Assets Uploaded`}
                        </p>
                    </div>
                </div>
                <div className="relative">
                    <Button 
                        disabled={uploadingTag === "PHOTOS"}
                        className="h-9 px-5 rounded-xl bg-[#1C3384] hover:bg-blue-800 text-white font-black text-[9px] uppercase tracking-widest gap-2 shadow-lg shadow-blue-900/20 disabled:opacity-50"
                    >
                        {uploadingTag === "PHOTOS" ? <Settings size={14} className="animate-spin" /> : <UploadCloud size={14} />} 
                        {uploadingTag === "PHOTOS" ? "SYNCING..." : "ADD ASSETS"}
                    </Button>
                    <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                        disabled={uploadingTag !== null}
                        onChange={(e) => {
                            const fileList = Array.from(e.target.files || []);
                            if (fileList.length > 0) {
                                setUploadingTag("PHOTOS");
                                uploadFiles(project.id, fileList.map(f => new File([f], `[SITE_PHOTO]_${f.name}`, { type: f.type })), "TECHNICAL", null, (saved) => {
                                    const updated = [...files, ...saved];
                                    setFiles(updated);
                                    updateLocalProject(project.id, { projectFiles: updated });
                                    toast.success(`${saved.length} photos added to gallery`);
                                    setUploadingTag(null);
                                    refresh();
                                });
                            }
                        }} 
                    />
                </div>
             </div>

             {/* Site Photo Metadata List */}
             {photoGallery.length > 0 && (
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-4">
                    {photoGallery.map((file: any) => (
                        <div key={file.id} className="flex items-center justify-between gap-2 bg-[#F8FAFC] border border-[#EDF2F7] p-2 px-3 rounded-xl group/photo transition-all hover:border-[#1C3384]/20">
                            <div className="flex items-center gap-2 min-w-0">
                                <div className="h-6 w-6 rounded-lg bg-[#1C3384]/5 flex items-center justify-center shrink-0">
                                    <Camera size={12} className="text-[#1C3384]" />
                                </div>
                                <span className="text-[10px] font-bold text-slate-600 truncate uppercase tracking-tighter">
                                    {file.name.replace("[SITE_PHOTO]_", "")}
                                </span>
                            </div>
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => handleDeleteFile(file.id, "SITE_PHOTO")}
                                className="h-6 w-6 rounded-md text-slate-300 hover:text-rose-500 hover:bg-rose-50 opacity-0 group-hover/photo:opacity-100 transition-all"
                            >
                                <Trash2 size={12} />
                            </Button>
                        </div>
                    ))}
                </div>
             )}
          </div>

          <div className="mt-8 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#CBD5E0]">
            <Clock size={10} /> ABOUT {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: false }).toUpperCase()} AGO
          </div>
        </div>

        {/* Right Section (Deep Blue) */}
        <div className="lg:col-span-4 bg-[#1C3384] p-8 lg:p-10 flex flex-col justify-center relative overflow-hidden">
            {/* Background Icon Watermark */}
            <div className="absolute top-0 right-0 p-6 opacity-5 scale-[2] pointer-events-none text-white">
                <FastForward size={120} />
            </div>

            <h4 className="font-black flex items-center gap-2 mb-8 text-[10px] uppercase tracking-[0.3em] text-[#FFC800] font-[family-name:var(--font-montserrat)] relative z-10">
                <Zap size={12} fill="#FFC800" /> EXECUTE TRANSFER
            </h4>

            <div className="mb-8 p-5 bg-white/10 backdrop-blur-sm rounded-[1.5rem] border border-white/10 relative z-10">
                <div className="flex items-center gap-2 mb-3 text-[#FFC800]">
                    <Split size={12} />
                    <span className="text-[9px] font-black uppercase tracking-widest">DUAL-TRACK ACTIVE</span>
                </div>
                <p className="text-[10px] font-medium text-blue-100/80 leading-relaxed uppercase tracking-tight">
                    Engineering completion automatically provisions the project across <strong className="text-white font-black">EXECUTION</strong> and <strong className="text-white font-black">LIAISONING</strong> simultaneously.
                </p>
            </div>

            <form action={handleHandoff} className="space-y-6 relative z-10">
                <input type="hidden" name="projectId" value={project.id} />
                <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-200/60 ml-1">FINAL OBSERVATIONS</Label>
                    <Textarea 
                        name="comment" 
                        placeholder="Log final engineering directives..." 
                        className="bg-white/5 border-white/10 text-white text-[11px] font-medium h-24 rounded-[1.25rem] p-4 focus:ring-0 placeholder:text-white/20 resize-none transition-all leading-relaxed" 
                        required 
                    />
                </div>

                <Button 
                    type="submit" 
                    disabled={!isSurveyComplete} 
                    className={cn(
                        "w-full h-14 rounded-[1.25rem] font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2",
                        isSurveyComplete 
                            ? "bg-[#FFC800] text-[#1C3384] hover:bg-yellow-400 shadow-xl shadow-yellow-400/20" 
                            : "bg-white/5 text-white/20 border border-white/10 opacity-100 cursor-not-allowed"
                    )}
                >
                    {isSurveyComplete ? "CERTIFY & DISPATCH" : "CHECKLIST INCOMPLETE"}
                    {isSurveyComplete ? <ArrowRight size={16} /> : <AlertCircle size={18} className="opacity-40" />}
                </Button>
            </form>
        </div>
      </div>

      <Project360Modal projectId={project.id} open={modalOpen} onOpenChange={setModalOpen} initialData={project} />
    </Card>
  );
}
