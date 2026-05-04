"use client";

import dynamic from "next/dynamic";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Shield, 
  MapPin,
  Zap,
  User,
  Settings,
  ShieldCheck,
  CheckCircle2, 
  UploadCloud, 
  AlertCircle, 
  Trash2, 
  FileText, 
  Rocket,
  ArrowRight,
  Eye,
  Info
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { forwardProject, deleteProjectFile } from "@/app/actions/project";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
const Project360Modal = dynamic(() => import("@/components/dashboard/Project360Modal").then(mod => mod.Project360Modal), { ssr: false });
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import { useUser } from "@clerk/nextjs";

interface UniversalEngineeringCardProps {
  project: any;
  dept: string;
  initialFiles: any[];
}

export function WorkOrderHandoffCard({ project, dept, initialFiles }: UniversalEngineeringCardProps) {
  const { refresh, updateLocalProject } = useDashboardNexus();
  const [files, setFiles] = useState(initialFiles);
  const [modalOpen, setModalOpen] = useState(false);
  const [scopeReviewed, setScopeReviewed] = useState(false);

  const { uploadFiles, isUploading } = useProjectFileUpload();
  const [uploadingTag, setUploadingTag] = useState<string | null>(null);
  const { user } = useUser();

  useEffect(() => {
    if (initialFiles) setFiles(initialFiles);
  }, [initialFiles]);

  // --- FILE CATEGORIZATION ---
  
  // 1. SURVEY PILLAR
  const surveyFiles = files.filter(f => f.category === "SURVEY" || f.name.includes("[SURVEY]"));
  const sanctionedLoad = project.sanctionedLoad;

  // 2. DESIGN PILLAR
  const sldFile = files.find(f => f.name.includes("[SLD]") || f.name.toUpperCase().includes("SLD"));
  const layoutFile = files.find(f => f.name.includes("[LAYOUT]") || f.name.toUpperCase().includes("LAYOUT"));
  const structuralFile = files.find(f => f.name.includes("[STRUCTURAL]") || f.name.toUpperCase().includes("STRUCTURAL"));
  const bomFile = files.find(f => f.name.includes("[BOM]") || f.name.toUpperCase().includes("BOM"));
  const shadowFile = files.find(f => f.name.includes("[SHADOW]") || f.name.toUpperCase().includes("SHADOW"));

  // 3. LIAISONING PILLAR
  const agreementFile = files.find(f => f.name.includes("[AGREEMENT]") || f.name.toUpperCase().includes("AGREEMENT"));
  const testRecordFile = files.find(f => f.name.includes("[TEST_RECORD]") || f.name.toUpperCase().includes("TEST_RECORD"));
  const earthTestFile = files.find(f => f.name.includes("[EARTH_TEST]") || f.name.toUpperCase().includes("EARTH_TEST"));
  const workCompFile = files.find(f => f.name.includes("[WORK_COMP]") || f.name.toUpperCase().includes("WORK_COMPLETION"));
  const netMeteringFile = files.find(f => f.name.includes("[NET_METERING]") || f.name.toUpperCase().includes("NET_METERING"));
  const annexures = files.filter(f => f.name.toLowerCase().includes("annexure"));

  // --- PROGRESS TRACKING ---
  const surveyDone = !!sanctionedLoad && surveyFiles.length >= 3;
  const designDone = !!sldFile && !!layoutFile && !!structuralFile && !!bomFile && !!shadowFile;
  const liaisoningDone = !!agreementFile && !!testRecordFile && !!earthTestFile && !!workCompFile && annexures.length >= 5 && !!netMeteringFile;

  const totalGates = 14; // (1 Load + 3 Survey) + 5 Design + 5 Liaisoning (Annexure is 1 gate)
  const gatesPassed = [
    !!sanctionedLoad, surveyFiles.length >= 1, surveyFiles.length >= 2, surveyFiles.length >= 3,
    !!sldFile, !!layoutFile, !!structuralFile, !!bomFile, !!shadowFile,
    !!agreementFile, !!testRecordFile, !!earthTestFile, !!workCompFile, !!netMeteringFile, annexures.length >= 5
  ].filter(Boolean).length;

  const canDispatch = designDone && liaisoningDone && scopeReviewed;

  const handleFileUpload = async (tag: string, category: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingTag(tag);
    try {
      await uploadFiles(project.id, [file], category, null, (saved) => {
        const updated = [...files, ...saved];
        setFiles(updated);
        updateLocalProject(project.id, { projectFiles: updated });
        toast.success(`${tag} uploaded`);
        refresh();
      });
    } finally {
      setUploadingTag(null);
    }
  };

  const MiniSlot = ({ label, tag, category, fileObject, locked = false }: any) => {
    const isComplete = !!fileObject;
    return (
      <div className={cn(
        "flex items-center justify-between p-3 rounded-xl border transition-all group/slot",
        isComplete ? "bg-emerald-50/40 border-emerald-100" : "bg-slate-50/50 border-slate-100"
      )}>
        <div className="flex items-center gap-3">
          {isComplete ? (
            <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0">
                <CheckCircle2 size={12} strokeWidth={3} />
            </div>
          ) : (
            <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />
          )}
          <span className={cn(
            "text-[10px] font-black uppercase tracking-wider",
            isComplete ? "text-emerald-700" : "text-slate-400"
          )}>{label}</span>
        </div>

        {isComplete ? (
          <div className="flex items-center gap-2">
             <a href={fileObject.fileUrl} target="_blank" className="text-emerald-600 hover:text-emerald-800 transition-colors">
                <FileText size={14} />
             </a>
             {!locked && (
                <button onClick={() => {
                  deleteProjectFile(fileObject.id).then(() => {
                    setFiles(files.filter(f => f.id !== fileObject.id));
                    refresh();
                  });
                }} className="text-slate-300 hover:text-rose-500 opacity-0 group-hover/slot:opacity-100 transition-all">
                  <Trash2 size={12} />
                </button>
             )}
          </div>
        ) : (
          <div className="relative">
             {uploadingTag === tag ? (
                <Settings size={14} className="animate-spin text-slate-400" />
             ) : (
                <>
                  <UploadCloud size={14} className="text-slate-300 group-hover/slot:text-[#1C3384] transition-colors cursor-pointer" />
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(tag, category, e)} />
                </>
             )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="overflow-hidden border-none shadow-[0_20px_50px_-20px_rgba(0,0,0,0.12)] bg-white rounded-[2.5rem] transition-all p-0">
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* Main Pillar Flow */}
        <div className="lg:col-span-9 p-10 flex flex-col border-r border-slate-50">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex flex-col">
              <div className="flex items-center gap-3">
                <Badge className={cn(
                  "font-black px-4 py-1.5 uppercase tracking-[0.2em] text-[9px] border-none rounded-full shadow-lg",
                  canDispatch ? "bg-emerald-500 text-white" : "bg-[#1C3384] text-white"
                )}>
                  MASTER ENGINEERING FILE
                </Badge>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">
                  REF: <span className="text-slate-900">[{project.id.slice(-6).toUpperCase()}]</span>
                </span>
              </div>
              <h3 className="text-3xl font-black text-[#1C3384] uppercase tracking-tighter mt-4 leading-none">{project.name}</h3>
              <div className="flex items-center gap-2 mt-2">
                <User size={12} className="text-[#1C3384] shrink-0" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#1C3384]">
                  {project.assignedToEngineerId 
                    ? `ASSIGNED TO ${project.assignedEngineers?.[0]?.email?.split('@')[0]?.toUpperCase() || 'ENGINEER'}`
                    : project.claimedByUserId
                    ? `CLAIMED BY ${project.claimedBy?.email?.split('@')[0]?.toUpperCase() || 'ENGINEER'}`
                    : "UNIVERSAL ENGINEERING ENTRY"
                  }
                </span>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
               {project.assignedEngineers?.length > 0 && (
                  <div className="flex items-center gap-2">
                    {project.assignedEngineers.map((eng: any) => (
                      <Badge key={eng.id} className={cn(
                        "font-black px-3 py-1 uppercase tracking-widest text-[9px] rounded-full shrink-0 border-none",
                        eng.id === user?.id ? "bg-[#1C3384] text-white shadow-md shadow-[#1C3384]/20" : "bg-slate-100 text-slate-500"
                      )}>
                        {eng.email.split('@')[0]}
                      </Badge>
                    ))}
                  </div>
               )}

               <Button variant="ghost" onClick={() => setModalOpen(true)} className="h-9 px-4 rounded-full bg-slate-50 hover:bg-[#1C3384] hover:text-white text-slate-400 font-black text-[9px] uppercase tracking-widest gap-2">
                 <Eye size={12} /> INSPECT DATA
               </Button>
            </div>
          </div>

          {/* Pillars Grid */}
          <div className="grid grid-cols-3 gap-8 flex-1">
            {/* Pillar 1: Survey */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", surveyDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                  <MapPin size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">SURVEY</h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Preliminary Gate</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", sanctionedLoad ? "bg-emerald-50/40 border-emerald-100" : "bg-slate-50/50 border-slate-100")}>
                  <div className="flex items-center gap-3">
                    {sanctionedLoad ? <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0"><CheckCircle2 size={12} strokeWidth={3} /></div> : <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />}
                    <span className={cn("text-[10px] font-black uppercase tracking-wider", sanctionedLoad ? "text-emerald-700" : "text-slate-400")}>SANCTIONED LOAD</span>
                  </div>
                  <span className="text-[10px] font-black text-[#1C3384]">{sanctionedLoad || "---"}</span>
                </div>
                <MiniSlot label="SITE IMAGES" tag="SURVEY" category="SURVEY" fileObject={surveyFiles[0]} />
                <MiniSlot label="ROOF CONDITION" tag="SURVEY" category="SURVEY" fileObject={surveyFiles[1]} />
                <MiniSlot label="ELEVATION DATA" tag="SURVEY" category="SURVEY" fileObject={surveyFiles[2]} />
              </div>
            </div>

            {/* Pillar 2: Design */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", designDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                  <Zap size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">DESIGN</h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Detailed Blueprints</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <MiniSlot label="SINGLE LINE DIAG." tag="SLD" category="TECHNICAL" fileObject={sldFile} />
                <MiniSlot label="STRUCTURE LAYOUT" tag="LAYOUT" category="TECHNICAL" fileObject={layoutFile} />
                <MiniSlot label="STRUCTURAL VAL." tag="STRUCTURAL" category="TECHNICAL" fileObject={structuralFile} />
                <MiniSlot label="BOM RELEASE" tag="BOM" category="TECHNICAL" fileObject={bomFile} />
                <MiniSlot label="SHADOW ANALYSIS" tag="SHADOW" category="TECHNICAL" fileObject={shadowFile} />
              </div>
            </div>

            {/* Pillar 3: Liaisoning */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center", liaisoningDone ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400")}>
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900 leading-none">LIAISONING</h4>
                  <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Compliance & QC</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <MiniSlot label="AGREEMENT DOC" tag="AGREEMENT" category="TECHNICAL" fileObject={agreementFile} />
                <MiniSlot label="TEST RECORDS" tag="TEST_RECORD" category="TECHNICAL" fileObject={testRecordFile} />
                <MiniSlot label="WORK COMPLETION" tag="WORK_COMP" category="TECHNICAL" fileObject={workCompFile} />
                <div className={cn("flex items-center justify-between p-3 rounded-xl border transition-all", annexures.length >= 5 ? "bg-emerald-50/40 border-emerald-100" : "bg-slate-50/50 border-slate-100")}>
                   <div className="flex items-center gap-3">
                     {annexures.length >= 5 ? <div className="h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0"><CheckCircle2 size={12} strokeWidth={3} /></div> : <div className="h-5 w-5 rounded-full border-2 border-slate-200 shrink-0" />}
                     <span className={cn("text-[10px] font-black uppercase tracking-wider", annexures.length >= 5 ? "text-emerald-700" : "text-slate-400")}>ANNEXURES ({annexures.length}/5)</span>
                   </div>
                   <div className="relative">
                      <UploadCloud size={14} className="text-slate-300 hover:text-[#1C3384] cursor-pointer" />
                      <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          uploadFiles(project.id, files.map(f => new File([f], `[ANNEXURE]_${f.name}`, { type: f.type })), "TECHNICAL", null, (saved) => {
                              setFiles(prev => [...prev, ...saved]);
                              refresh();
                          });
                      }} />
                   </div>
                </div>
                <MiniSlot label="NET METERING" tag="NET_METERING" category="TECHNICAL" fileObject={netMeteringFile} />
              </div>
            </div>
          </div>
        </div>

        {/* Dispatch Control Side Panel */}
        <div className={cn(
          "lg:col-span-3 p-10 flex flex-col transition-colors duration-500",
          canDispatch ? "bg-emerald-600" : "bg-[#1C3384]"
        )}>
          <div className="flex items-center gap-2 mb-8">
            <Shield size={16} className="text-[#FFC800]" fill="#FFC800" />
            <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#FFC800]">DISPATCH CONTROL</h4>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-6 border border-white/10 mb-8">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-white uppercase tracking-widest">MASTER QC</span>
              <Badge className="bg-white/20 text-white text-[9px] font-black border-none">{gatesPassed}/15 GATES</Badge>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all duration-700" style={{ width: `${(gatesPassed / 15) * 100}%` }} />
            </div>
          </div>

          <div className="space-y-6 flex-1">
            <div className="flex items-start gap-4 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer group" onClick={() => setScopeReviewed(!scopeReviewed)}>
                <Checkbox checked={scopeReviewed} onCheckedChange={(val) => setScopeReviewed(!!val)} className="mt-1 border-white/20 data-[state=checked]:bg-[#FFC800] data-[state=checked]:text-[#1C3384]" />
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-white uppercase tracking-wider group-hover:text-[#FFC800]">SCOPE CERTIFIED</p>
                  <p className="text-[8px] font-medium text-blue-100/50 uppercase tracking-tight leading-tight italic">Design & Margin Review Complete.</p>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase tracking-widest text-blue-200/40 ml-1">FIELD DIRECTIVES</Label>
                <Textarea placeholder="Directives for Execution..." className="bg-white/5 border-white/10 text-white text-[11px] font-medium h-28 rounded-2xl p-4 focus:ring-0 placeholder:text-white/20 resize-none transition-all leading-relaxed" />
            </div>
          </div>

          <div className="mt-8">
             <form action={async (formData) => {
                if (!canDispatch) return;
                formData.append("nextStage", "MATERIAL_PROCUREMENT");
                formData.append("department", "Execution");
                formData.append("projectId", project.id);
                try {
                  await forwardProject(formData);
                  toast.success("Project Dispatched to Execution!");
                  refresh();
                } catch(e: any) { toast.error(e.message); }
             }}>
               <Button type="submit" disabled={!canDispatch} className={cn(
                 "w-full h-16 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl",
                 canDispatch ? "bg-white text-emerald-700 hover:bg-emerald-50" : "bg-white/5 text-white/20 border border-white/10 cursor-not-allowed"
               )}>
                 {canDispatch ? "DISPATCH TO EXECUTION" : "QC INCOMPLETE"}
                 {canDispatch ? <Rocket size={20} className="animate-bounce" /> : <AlertCircle size={20} className="opacity-40" />}
               </Button>
             </form>
          </div>
        </div>
      </div>
      <Project360Modal projectId={project.id} open={modalOpen} onOpenChange={setModalOpen} initialData={project} />
    </Card>
  );
}
