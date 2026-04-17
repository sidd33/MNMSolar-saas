"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Shield, FastForward, ArrowRight, ListTodo, Clock, Eye, DownloadCloud, Settings, Split, CheckCircle2, UploadCloud, AlertCircle, FileText, Receipt, Trash2, Edit3, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { forwardProject, updateSanctionedLoad, deleteProjectFile } from "@/app/actions/project";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tooltip } from "@/components/ui/tooltip";
import { Project360Modal } from "../dashboard/Project360Modal";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";

interface EngineeringHandoffCardProps {
  project: any;
  dept: string;
  initialFiles: any[];
}

export function EngineeringHandoffCard({ project, dept, initialFiles }: EngineeringHandoffCardProps) {
  const { refresh, updateLocalProject } = useDashboardNexus();
  const [files, setFiles] = useState(initialFiles);
  const [modalOpen, setModalOpen] = useState(false);
  const [sanctionedInput, setSanctionedInput] = useState(project.sanctionedLoad?.replace(" kW", "") || "");
  const [isSavingLoad, setIsSavingLoad] = useState(false);

  const { uploadFiles, isUploading } = useProjectFileUpload();
  const [uploadingTag, setUploadingTag] = useState<string | null>(null);
  const [uploadCategory, setUploadCategory] = useState<"TECHNICAL" | "LIAISONING">("TECHNICAL");

  // Sync state with props for lazy loading - with safety check to prevent wipes
  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
        setFiles(initialFiles);
    } else if (files.length === 0 && initialFiles) {
        setFiles(initialFiles);
    }
  }, [initialFiles]);

  useEffect(() => {
    setSanctionedInput(project.sanctionedLoad?.replace(" kW", "") || "");
  }, [project.sanctionedLoad]);

  const salesHandover = files.find((f: any) => f.category === "HANDOVER_SHEET");

  // Category counts
  const technicalCount = files.filter((f: any) => f.category === "TECHNICAL").length;
  const liaisoningCount = files.filter((f: any) => f.category === "LIAISONING").length;

  // Detect stage type
  const isSiteSurveyStage = ["SITE_SURVEY", "PRELIMINARY_QUOTE"].includes(project.stage);

  // Survey Report file - Lenient Detection
  const surveyReportFile = files.find((f: any) => f.name.includes("[SURVEY_REPORT]") || f.name.toUpperCase().includes("SURVEY"));

  // 1. Technical Files - Lenient Detection (Brackets OR Keywords)
  const sldFile = files.find(f => f.name.includes("[SLD]") || f.name.toUpperCase().includes("SLD"));
  const layoutFile = files.find(f => f.name.includes("[LAYOUT]") || f.name.toUpperCase().includes("LAYOUT"));
  const structuralFile = files.find(f => f.name.includes("[STRUCTURAL]") || f.name.toUpperCase().includes("STRUCTURAL"));
  const bomFile = files.find(f => f.name.includes("[BOM]") || f.name.toUpperCase().includes("BOM"));
  const surveyVerified = !!project.sanctionedLoad && project.sanctionedLoad !== " kW" && project.sanctionedLoad !== "";

  // 2. Liaisoning Files - Lenient Detection
  const agreementFile = files.find(f => f.name.includes("[AGREEMENT]") || f.name.toUpperCase().includes("AGREEMENT"));
  const testRecordFile = files.find(f => f.name.includes("[TEST_RECORD]") || f.name.toUpperCase().includes("TEST_RECORD") || f.name.toUpperCase().includes("TEST_RECORDS"));
  const earthTestFile = files.find(f => f.name.includes("[EARTH_TEST]") || f.name.toUpperCase().includes("EARTH_TEST"));
  const workCompFile = files.find(f => f.name.includes("[WORK_COMP]") || f.name.toUpperCase().includes("WORK_COMP") || f.name.toUpperCase().includes("WORK COMPLETION"));

  // 3. Annexure Logic - Check name keyword even if category is mismatched
  const annexureFiles = files.filter(f => f.name.toLowerCase().includes("annexure"));
  const annexureCount = annexureFiles.length;
  const isAnnexuresComplete = annexureCount >= 5;

  // 4. Completion States
  const technicalComplete = surveyVerified && !!sldFile && !!layoutFile && !!structuralFile && !!bomFile;
  const liaisoningComplete = !!agreementFile && !!testRecordFile && !!earthTestFile && !!workCompFile && isAnnexuresComplete;

  const checklistComplete = isSiteSurveyStage
    ? !!surveyReportFile
    : (technicalComplete && liaisoningComplete);

  const completedCount = [surveyVerified, !!sldFile, !!layoutFile, !!structuralFile, !!bomFile].filter(Boolean).length;
  const liaisoningCompletedCount = [!!agreementFile, !!testRecordFile, !!earthTestFile, !!workCompFile].filter(Boolean).length + annexureCount;

  const handleSaveLoad = async () => {
    if (!sanctionedInput) return;
    setIsSavingLoad(true);
    try {
      const formatted = `${sanctionedInput.replace(/[^\d.]/g, '')} kW`;
      await updateSanctionedLoad(project.id, formatted);
      updateLocalProject(project.id, { sanctionedLoad: formatted });
      toast.success("Sanctioned load verified");
      refresh();
    } catch {
      toast.error("Failed to update load");
    } finally {
      setIsSavingLoad(false);
    }
  };

  async function handleHandoff(formData: FormData) {
    if (!checklistComplete) {
      toast.error(isSiteSurveyStage ? "Upload the site survey report first" : "Engineering checklist incomplete");
      return;
    }
    await forwardProject(formData);
    toast.success("Project dispatched successfully");
    refresh();
  }

  const handleFileUpload = async (tag: string, event: React.ChangeEvent<HTMLInputElement>, existingFileId: string | null = null) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploadingTag(tag);
    
    // Custom Naming for Annexures
    let finalName = file.name;
    if (tag === "ANNEXURE") {
        finalName = `Annexure_${annexureCount + 1}_${project.name}.pdf`;
    }

    const taggedFile = new File([file], `[${tag}]_${finalName}`, { type: file.type });

    try {
      const dbCategory = tag === "ANNEXURE" ? "LIAISONING" : (uploadCategory as any);
      
      await uploadFiles(project.id, [taggedFile], dbCategory, existingFileId, (savedFiles) => {
        // If it was a replacement, we need to remove the old one from state
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
    } catch (e) {
      toast.error(`Failed to upload ${tag}`);
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

  const DropSlot = ({ label, tag, fileObject }: { label: string, tag: string, fileObject?: any }) => {
    const isComplete = !!fileObject;
    
    return (
        <div className={cn(
            "relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all min-h-24 group/slot",
            isComplete ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-[#1C3384]/50 cursor-pointer text-slate-500"
        )}>
            {isComplete ? (
                <>
                    <CheckCircle2 size={24} className="mb-2 text-emerald-500" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-700">{label} DONE</p>
                    
                    {/* Utility Overlay for Replacement/Deletion - Adjusted for visibility */}
                    <div className="absolute top-2 right-2 flex items-center gap-1.5">
                        <div className="relative">
                            <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full bg-white text-blue-600 shadow-md border border-blue-100 hover:scale-110 transition-transform">
                                <Edit3 size={12} />
                            </Button>
                            <input 
                                type="file" 
                                className="absolute inset-0 opacity-0 cursor-pointer" 
                                onChange={(e) => handleFileUpload(tag, e, fileObject.id)}
                            />
                        </div>
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDeleteFile(fileObject.id, tag)}
                            className="h-7 w-7 rounded-full bg-white text-rose-600 shadow-md border border-rose-100 hover:scale-110 transition-transform"
                        >
                            <Trash2 size={12} />
                        </Button>
                    </div>
                </>
            ) : uploadingTag === tag ? (
                <>
                    <Settings size={24} className="mb-2 animate-spin text-[#1C3384]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C3384]">Uploading...</p>
                </>
            ) : (
                <>
                    <UploadCloud size={24} className="mb-2 text-slate-400 group-hover:text-[#1C3384] transition-colors" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#0F172A]">{label}</p>
                </>
            )}
            {!isComplete && uploadingTag !== tag && (
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
    <Card className="overflow-hidden border border-slate-100 shadow-xl bg-white [contain:paint] will-change-transform group rounded-[2.5rem] transition-all hover:shadow-2xl hover:border-[#1C3384]/20">
      <div className="grid grid-cols-1 lg:grid-cols-3">
        {/* Left Section: Project Details & Checklist */}
        <div className="lg:col-span-2 p-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <Badge className="bg-[#1C3384]/5 text-[#1C3384] font-black px-4 py-1.5 uppercase tracking-[0.15em] text-[9px] border-none rounded-full">
                {project.stage?.replace(/_/g, ' ')}
              </Badge>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                REF: <span className="text-slate-900 font-black">{project.name.split(' ')[0]}</span>
                {files.length > 0 && (
                    <span className="ml-2 px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md border border-blue-100 italic">
                        {files.length} Assets Linked
                    </span>
                )}
              </span>
            </div>
            <Button
              variant="ghost"
              onClick={() => setModalOpen(true)}
              className="h-9 px-4 rounded-full bg-slate-50 hover:bg-[#1C3384] hover:text-white text-slate-500 font-black text-[9px] uppercase tracking-widest transition-all gap-2"
            >
              <Eye size={14} /> Inspect Data
            </Button>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
            <h3 className="text-3xl font-black tracking-tight group-hover:text-[#1C3384] transition-colors text-[#0F172A] font-[family-name:var(--font-montserrat)] uppercase">
              {project.name}
            </h3>

            <div className="flex flex-col gap-2 shrink-0">
              {salesHandover && (
                <a
                  href={salesHandover.fileUrl || `/api/files/proxy?url=${encodeURIComponent(salesHandover.content)}`}
                  target="_blank" rel="noreferrer"
                  className="bg-[#1C3384]/10 hover:bg-[#1C3384]/20 text-[#1C3384] px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-[#1C3384]/10"
                >
                  <DownloadCloud size={14} /> Sales Handover XML
                </a>
              )}
            </div>
          </div>

          <div className="space-y-6">
            {isSiteSurveyStage ? (
              /* ── SITE SURVEY: Single Report Upload ── */
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#1C3384]" />
                    <span className="font-black uppercase tracking-[0.2em] text-[#1C3384] text-xs">Site Survey Report</span>
                  </div>
                  {surveyReportFile && (
                    <div className="flex items-center gap-1.5 text-emerald-600">
                      <CheckCircle2 size={14} />
                      <span className="font-black text-[10px] uppercase tracking-widest">Uploaded</span>
                    </div>
                  )}
                </div>

                {surveyReportFile ? (
                  /* Green confirmed state with replacement option */
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-5 flex items-center justify-between group/survey relative">
                    <div className="flex items-center gap-3 min-w-0">
                      <CheckCircle2 size={24} className="text-emerald-500 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-black text-emerald-800 truncate">{surveyReportFile.name}</p>
                        <p className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-widest mt-0.5">Survey Report Confirmed</p>
                      </div>
                    </div>
                    <div className="relative shrink-0 flex items-center gap-2">
                      <div className="relative">
                        <Button variant="outline" size="sm" className="h-8 px-3 rounded-lg text-[9px] font-black uppercase tracking-widest border-emerald-300 text-emerald-700 hover:bg-emerald-100 bg-white/50">
                          Replace
                        </Button>
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload("SURVEY_REPORT", e, surveyReportFile.id)} />
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteFile(surveyReportFile.id, "SURVEY_REPORT")} className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg bg-white/50 border border-rose-100">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ) : uploadingTag === "SURVEY_REPORT" ? (
                  <div className="border-2 border-dashed border-[#1C3384]/30 bg-[#1C3384]/5 rounded-xl p-6 flex flex-col items-center justify-center gap-2">
                    <Settings size={28} className="animate-spin text-[#1C3384]" />
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#1C3384]">Uploading Report...</p>
                  </div>
                ) : (
                  <div className="relative border-2 border-dashed border-slate-200 hover:border-[#1C3384]/50 bg-slate-50 hover:bg-slate-100 rounded-xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer group">
                    <UploadCloud size={32} className="text-slate-400 group-hover:text-[#1C3384] transition-colors" />
                    <p className="text-xs font-black uppercase tracking-widest text-slate-600 group-hover:text-[#1C3384] transition-colors">Upload Site Survey Report</p>
                    <p className="text-[10px] text-slate-400 font-medium">PDF, Image, or Document</p>
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={(e) => handleFileUpload("SURVEY_REPORT", e)} />
                  </div>
                )}
              </>
            ) : (
              /* ── DETAILED ENGINEERING: Full Multi-item Checklist ── */
              <>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <Shield size={16} className="text-[#1C3384]" />
                    <span className="font-black uppercase tracking-[0.2em] text-[#1C3384] text-xs">Engineering Gated Checklist</span>
                  </div>
                  <div className={cn("flex items-center gap-2 font-black text-sm", (uploadCategory === "TECHNICAL" ? technicalComplete : liaisoningComplete) ? "text-emerald-500" : "text-yellow-500")}>
                    <span className="tabular-nums">
                      {uploadCategory === "TECHNICAL" ? `${completedCount}/5` : `${liaisoningCompletedCount}/9`}
                    </span> Verified
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-1.5 rounded-2xl flex items-center gap-2 relative">
                  <button onClick={() => setUploadCategory("TECHNICAL")} className={cn("flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10", uploadCategory === "TECHNICAL" ? "text-white" : "text-slate-400 hover:text-slate-600")}>
                    <FileText size={14} /> Technical ({technicalCount})
                  </button>
                  <button onClick={() => setUploadCategory("LIAISONING")} className={cn("flex-1 flex items-center justify-center gap-2 h-11 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all relative z-10", uploadCategory === "LIAISONING" ? "text-[#1C3384]" : "text-slate-400 hover:text-slate-600")}>
                    <Receipt size={14} /> Liaisoning ({liaisoningCount})
                  </button>
                  <motion.div layoutId="activeTab" className={cn("absolute top-1.5 bottom-1.5 rounded-xl shadow-lg z-0", uploadCategory === "TECHNICAL" ? "bg-[#1C3384] left-1.5 w-[calc(50%-0.5rem)]" : "bg-[#FFC800] left-[calc(50%+0.25rem)] w-[calc(50%-0.5rem)]")} transition={{ type: "spring", stiffness: 400, damping: 30 }} />
                </div>

                <AnimatePresence mode="wait">
                  <motion.div key={uploadCategory} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -10, opacity: 0 }} transition={{ duration: 0.15 }} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {uploadCategory === "TECHNICAL" ? (
                      <>
                        <div className={cn("border rounded-xl p-4 transition-all min-h-24 flex flex-col justify-center", surveyVerified ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-200")}>
                          <div className="flex items-center justify-between mb-3">
                            <Label className={cn("text-[10px] font-black uppercase tracking-widest", surveyVerified ? "text-emerald-700" : "text-slate-500")}>1. System Capacity</Label>
                            {surveyVerified && <CheckCircle2 size={16} className="text-emerald-500" />}
                          </div>
                          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-inner h-11">
                            <Input value={sanctionedInput} onChange={(e) => setSanctionedInput(e.target.value)} placeholder="Enter Load" className="h-full text-xs font-bold border-none bg-transparent focus-visible:ring-0 px-2" />
                            <span className="text-[10px] font-bold text-slate-400">kW</span>
                            <Button onClick={handleSaveLoad} disabled={isSavingLoad || surveyVerified} size="sm" variant={surveyVerified ? "secondary" : "default"} className={cn("h-7 px-3 rounded-lg font-black text-[9px] uppercase tracking-wider", surveyVerified ? "bg-slate-100 text-slate-400" : "bg-[#38A169] hover:bg-[#2F855A] text-white")}>
                              {isSavingLoad ? <Settings size={12} className="animate-spin" /> : surveyVerified ? "LOCKED" : "VERIFY"}
                            </Button>
                          </div>
                        </div>
                        <DropSlot label="2. Single Line Diag." tag="SLD" fileObject={sldFile} />
                        <DropSlot label="3. Structure Layout" tag="LAYOUT" fileObject={layoutFile} />
                        <DropSlot label="4. Structural Val." tag="STRUCTURAL" fileObject={structuralFile} />
                        <DropSlot label="5. BoM Release" tag="BOM" fileObject={bomFile} />
                      </>
                    ) : (
                      <>
                        <DropSlot label="1. Agreement" tag="AGREEMENT" fileObject={agreementFile} />
                        <DropSlot label="2. Test Record" tag="TEST_RECORD" fileObject={testRecordFile} />
                        <DropSlot label="3. Earth Test" tag="EARTH_TEST" fileObject={earthTestFile} />
                        <DropSlot label="4. Work Completion" tag="WORK_COMP" fileObject={workCompFile} />

                        <div className="md:col-span-2 space-y-3">
                            <div className="flex items-center justify-between px-1">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Section B: Annexures ({annexureCount}/5)</span>
                                {isAnnexuresComplete && <CheckCircle2 size={14} className="text-emerald-500" />}
                            </div>
                            
                            {annexureCount < 5 ? (
                                <DropSlot label={`Drop Annexure ${annexureCount + 1} here`} tag="ANNEXURE" />
                            ) : (
                                <div className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-6 flex flex-col items-center justify-center gap-2 transition-all">
                                    <CheckCircle2 size={32} className="text-emerald-500" />
                                    <p className="text-xs font-black uppercase tracking-widest text-emerald-700">All Annexures Uploaded</p>
                                </div>
                            )}

                            {annexureCount > 0 && (
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {annexureFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-100 p-2 px-3 rounded-lg group/annexure">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
                                                <span className="text-[10px] font-bold text-slate-600 truncate uppercase tracking-tighter">
                                                    Annexure {idx + 1} ✅
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="relative">
                                                    <Edit3 size={12} className="text-blue-500 hover:text-blue-700 cursor-pointer transition-colors" />
                                                    <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload("ANNEXURE", e, file.id)} />
                                                </div>
                                                <Trash2 size={12} className="text-rose-500 hover:text-rose-700 cursor-pointer transition-colors" onClick={() => handleDeleteFile(file.id, `Annexure ${idx + 1}`)} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                      </>
                    )}
                  </motion.div>
                </AnimatePresence>
              </>
            )}

            <div className="flex items-center gap-6 pt-6 -mt-2">
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-400">
                <Clock size={12} className="text-slate-300" />
                {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Handoff Protocol */}
        <div className="bg-[#1C3384] p-10 text-white relative flex flex-col justify-center border-l-4" style={{ borderColor: checklistComplete ? "#10B981" : "transparent" }}>
          <div className="absolute -right-8 -top-8 opacity-10 pointer-events-none text-white scale-150">
            <FastForward size={140} />
          </div>

          <h4 className="font-black flex items-center gap-3 mb-8 text-[11px] uppercase tracking-[0.25em] text-[#FFC800] font-[family-name:var(--font-montserrat)] relative z-10">
            <div className="h-5 w-5 rounded-full bg-[#FFC800]/20 flex items-center justify-center">
              <FastForward size={12} />
            </div>
            Execute Transfer
          </h4>

          <div className="mb-8 p-5 bg-white/10 rounded-2xl border border-white/10 relative z-10">
            <div className="flex items-center gap-2 mb-3 text-[#FFC800]">
              <Split size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">Dual-Track Active</span>
            </div>
            <p className="text-[11px] font-medium text-blue-100 leading-relaxed">
              Engineering completion automatically provisions the project across <strong className="text-white bg-white/20 px-1 py-0.5 rounded">EXECUTION</strong> and <strong className="text-white bg-white/20 px-1 py-0.5 rounded">LIAISONING</strong> simultaneously.
            </p>
          </div>

          <form action={handleHandoff} className="space-y-6 relative z-10">
            <input type="hidden" name="projectId" value={project.id} />
            <div className="space-y-2">
              <Label htmlFor="comment" className="text-[9px] font-black uppercase tracking-widest text-blue-200 opacity-80">Final Observations</Label>
              <Textarea name="comment" id="comment" placeholder="Log final engineering directives..." className="text-xs bg-white/10 border-white/10 text-white h-24 rounded-[1.5rem] resize-none focus:ring-0 placeholder:text-white/30 transition-all font-medium leading-relaxed" required />
            </div>

            <Tooltip content={isSiteSurveyStage ? "Upload the site survey report before dispatching." : "Upload all technical documents before dispatching."} enabled={!checklistComplete}>
              <div className="relative">
                <Button type="submit" disabled={!checklistComplete} className={cn("w-full h-14 font-black rounded-2xl flex items-center justify-center gap-3 shadow-xl transition-all", checklistComplete ? "bg-[#10B981] hover:bg-[#059669] text-white active:scale-95 group" : "bg-white/5 text-white/20 disabled:opacity-100 border border-white/10")}>
                  {checklistComplete ? "CERTIFY & DISPATCH" : (isSiteSurveyStage ? "REPORT MISSING" : "CHECKLIST INCOMPLETE")}
                  {checklistComplete ? <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /> : <AlertCircle size={18} className="opacity-40" />}
                </Button>
              </div>
            </Tooltip>
          </form>
        </div>
      </div>
      <Project360Modal projectId={project.id} open={modalOpen} onOpenChange={setModalOpen} initialData={project} />
    </Card>
  );
}
