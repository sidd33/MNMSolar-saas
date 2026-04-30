"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { FileBox, CheckCircle2, Clock, User, ArrowRight, Download, AlertCircle, MapPin, ShieldCheck, FileUp, FileText, Zap, Building2, Circle, Pencil, Check, Eye, ExternalLink, X, Server } from "lucide-react";
import { getProject360Data, uploadProjectFile, updateSanctionedLoad } from "@/app/actions/project";
import { archiveProjectFiles } from "@/lib/actions/archive";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { toast } from "sonner";
import { useProjectFileUpload } from "@/hooks/useProjectFileUpload";

interface Project360ModalProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData?: any;
}

const DEPARTMENT_PIPELINE = [
  { key: "SALES", label: "Sales", color: "bg-violet-500", ring: "ring-violet-200" },
  { key: "ENGINEERING", label: "Engineering", color: "bg-blue-500", ring: "ring-blue-200" },
  { key: "LIAISONING", label: "Liaisoning", color: "bg-indigo-500", ring: "ring-indigo-200" },
  { key: "PROCUREMENT", label: "Procurement", color: "bg-cyan-500", ring: "ring-cyan-200" },
  { key: "EXECUTION", label: "Execution", color: "bg-amber-500", ring: "ring-amber-200" },
  { key: "ACCOUNTS", label: "Accounts", color: "bg-emerald-500", ring: "ring-emerald-200" },
  { key: "HANDOVER", label: "Handover", color: "bg-green-600", ring: "ring-green-200" },
];

export function Project360Modal({ projectId, open, onOpenChange, initialData }: Project360ModalProps) {
  const [project, setProject] = useState<any>(initialData || null);
  const [loading, setLoading] = useState(!initialData);
  const [previewImage, setPreviewImage] = useState<{ name: string, url: string } | null>(null);
  const { user } = useUser();
  const { uploadFiles, isUploading, progress, status } = useProjectFileUpload();

  const [isEditingSanctioned, setIsEditingSanctioned] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [sanctionedInput, setSanctionedInput] = useState("");
  const [updatingSanctioned, setUpdatingSanctioned] = useState(false);

  const role = user?.publicMetadata?.role as string;
  const dept = user?.publicMetadata?.department as string;
  const canEditSanctioned = role === "OWNER" || role === "SUPER_ADMIN" || dept === "LIAISONING";

  const handleFileClick = (file: any) => {
    // If exact field fileUrl is completely empty, and we don't have legacy Base64 content
    if (!file.fileUrl && !file.content) {
      toast.error("File URL not available");
      return;
    }

    // Resolve URL to prioritize actual remote URLs but support legacy base64
    const rawUrl = file.fileUrl || (file.content?.startsWith('http') ? file.content : `data:application/octet-stream;base64,${file.content}`);

    const isBridgeLocal = rawUrl.includes('localhost') || rawUrl.includes(process.env.NEXT_PUBLIC_BRIDGE_AGENT_URL || 'never_match');
    const url = (rawUrl.startsWith('http') && !isBridgeLocal) ? `/api/files/proxy?url=${encodeURIComponent(rawUrl)}` : rawUrl;

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
    const isPdf = ext === 'pdf';

    if (isImage) {
      setPreviewImage({ name: file.name, url });
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';

      if (!isPdf) {
        a.download = file.name;
      }

      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleUpdateSanctioned = async () => {
    setUpdatingSanctioned(true);
    const toastId = toast.loading("Updating sanctioned load...");
    try {
      const val = sanctionedInput.trim() ? `${sanctionedInput.trim()} kW` : null;
      await updateSanctionedLoad(projectId, val);
      setProject({ ...project, sanctionedLoad: val });
      setIsEditingSanctioned(false);
      toast.success("Sanctioned load updated", { id: toastId });
    } catch (err: any) {
      toast.error(err.message || "Failed to update sanctioned load", { id: toastId });
      console.error("Failed to update sanctioned load", err);
    } finally {
      setUpdatingSanctioned(false);
    }
  };

  const handleArchiveFiles = async () => {
    if (!window.confirm("This will move all files to the local server.\nMake sure the bridge agent is running before proceeding.\n\nContinue?")) return;
    
    setIsArchiving(true);
    const toastId = toast.loading("Archiving files to Local Node...");
    try {
      const res = await archiveProjectFiles(projectId);
      if (res.failed > 0) {
        toast.error(`Archived ${res.archived}, Failed ${res.failed} — is the bridge agent running?`, { id: toastId });
      } else {
        toast.success(`${res.archived} files archived successfully`, { id: toastId });
      }
      await fetchData();
    } catch (e) {
      toast.error("Archive failed — is the bridge agent running?", { id: toastId });
    } finally {
      setIsArchiving(false);
    }
  };

  const fetchData = async (isBackground = false) => {
    if (projectId) {
      if (!isBackground) setLoading(true);
      try {
        const data = await getProject360Data(projectId);
        setProject(data);
      } catch (error) {
        console.error("Failed to fetch project 360 data:", error);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    if (open) {
      if (initialData) {
        setProject(initialData);
        setLoading(false);
        fetchData(true); // background update
      } else {
        fetchData();
      }
    }
  }, [open, projectId]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !projectId) return;

    try {
      await uploadFiles(projectId, [file], "TECHNICAL");
      await fetchData();
    } catch (error) {
      console.error("Upload failed", error);
    }
  };

  if (!open) return null;

  // Derive Timeline Data
  const deptLogMap: Record<string, any> = {};
  const visitedDepts = new Set<string>();
  let currentDept: string | null = null;

  if (project?.handoffLogs) {
    project.handoffLogs.forEach((l: any) => {
      // Map: deptKey → the first log entry when that dept was reached. Logs are newest-first.
      // So if we iterate newest-first, we only want to set it if it's not set yet.
      if (!deptLogMap[l.toDept.toUpperCase()]) {
        deptLogMap[l.toDept.toUpperCase()] = l;
      }
      visitedDepts.add(l.fromDept.toUpperCase());
      visitedDepts.add(l.toDept.toUpperCase());
    });
    // Most recent toDept = currently active department
    currentDept = project.handoffLogs[0]?.toDept.toUpperCase() ?? null;
  }

  // If currentDept is not set from logs, default to project's currentDepartment
  if (!currentDept && project?.currentDepartment) {
    currentDept = project.currentDepartment.toUpperCase();
    if (currentDept) {
      visitedDepts.add(currentDept!);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "p-0 overflow-hidden border-none rounded-xl bg-white shadow-2xl outline-none flex flex-col",
          "fixed left-[50%] top-[50%] -translate-x-[50%] -translate-y-[50%]",
          "z-[100]"
        )}
        style={{
          width: '94vw',
          maxWidth: '1180px',
          height: '86vh',
        }}
      >
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full gap-5 bg-white">
            <div className="h-1 shadow-sm w-48 bg-slate-100 rounded-full overflow-hidden">
              <div className="h-full bg-[#1C3384] animate-[shimmer_2s_infinite] w-full" />
            </div>
            <p className="text-[#1C3384] font-bold uppercase tracking-widest text-[10px]">Loading Project Data...</p>
          </div>
        ) : project ? (
          <>
            {/* Header - Shrunk from 112px to 64px */}
            <div className="bg-[#1C3384] h-16 shrink-0 px-6 flex items-center justify-between shadow-sm z-50">
              <div className="flex items-center gap-4">
                <div className="h-8 w-8 rounded-lg bg-[#FFC800] flex items-center justify-center shadow-sm">
                  <Zap size={16} className="text-[#1C3384] fill-[#1C3384]" />
                </div>
                <div>
                  <DialogTitle className="text-sm font-bold text-white leading-tight">
                    {project.name}
                  </DialogTitle>
                  <p className="text-[10px] font-mono text-white/40">
                    CID: {project.id}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <p className="text-[9px] text-white/50 uppercase tracking-widest">Stage</p>
                  <p className="text-xs font-bold text-[#FFC800] capitalize">
                    {project.stage?.replace(/_/g, ' ').toLowerCase()}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  onClick={() => onOpenChange(false)}
                  className="h-8 w-8 rounded-lg text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center p-0 transition-colors"
                >
                  <span className="text-xl leading-none font-light">✕</span>
                </Button>
              </div>
            </div>

            {/* Body layout - 3 columns */}
            <div className="flex-1 flex flex-row overflow-hidden divide-x divide-slate-100 bg-white">

              {/* ZONE 1: PROJECT DNA */}
              <div className="flex flex-col w-64 shrink-0 bg-slate-50/60 overflow-y-auto overscroll-contain [transform:translateZ(0)]">
                <div className="p-5 space-y-6">
                  {/* Executive Summary */}
                  <div>
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Project DNA</h4>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400">Primary Stakeholder</p>
                        <p className="text-sm font-semibold text-slate-800">{project.clientName || "Unknown Entity"}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[10px] text-slate-400">Deployment Location</p>
                        <div className="flex items-start gap-1.5">
                          <MapPin size={14} className="text-[#1C3384] shrink-0 mt-0.5" />
                          <p className="text-xs font-medium text-slate-600 leading-relaxed">{project.address || "Location Data Restricted"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <div className="px-3 py-3 rounded-xl border border-slate-100 bg-white flex flex-col items-center text-center">
                          <p className="text-[9px] text-slate-400 mb-1 font-medium">DC CAPACITY</p>
                          <p className="text-sm font-semibold text-[#1C3384]">{project.dcCapacity || "50 kWp"}</p>
                        </div>
                        <div className="px-3 py-3 rounded-xl border border-slate-100 bg-white flex flex-col items-center text-center relative group min-h-[64px] justify-center">
                          <p className="text-[9px] text-slate-400 mb-1 font-medium leading-none">SANCTIONED</p>

                          {isEditingSanctioned ? (
                            <div className="flex items-center gap-1 w-full mt-1">
                              <input
                                type="number"
                                value={sanctionedInput}
                                onChange={(e) => setSanctionedInput(e.target.value)}
                                className="w-full h-6 text-xs text-center border border-[#1C3384]/20 rounded bg-slate-50 focus:outline-none focus:border-[#1C3384]"
                                autoFocus
                                onKeyDown={(e) => e.key === 'Enter' && handleUpdateSanctioned()}
                              />
                              <button
                                onClick={handleUpdateSanctioned}
                                disabled={updatingSanctioned}
                                className="h-6 w-6 shrink-0 bg-[#38A169] text-white rounded flex items-center justify-center hover:bg-[#2F855A] transition-colors"
                              >
                                <Check size={12} />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 mt-0.5">
                              {project.sanctionedLoad ? (
                                <p className="text-sm font-semibold text-[#1C3384] leading-none">{project.sanctionedLoad}</p>
                              ) : (
                                <p className="text-[11px] font-semibold text-slate-400 italic leading-none px-1">Pending</p>
                              )}
                              {canEditSanctioned && (
                                <button
                                  onClick={() => {
                                    setSanctionedInput(project.sanctionedLoad?.replace(/[^0-9.]/g, '') || "");
                                    setIsEditingSanctioned(true);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-[#1C3384] transition-opacity absolute right-2"
                                >
                                  <Pencil size={12} />
                                </button>
                              )}
                            </div>
                          )}
                        </div>

                        {project.orderValue && (
                          <div className="px-3 py-3 rounded-xl border border-slate-100 bg-white flex flex-col items-center text-center">
                            <p className="text-[9px] text-slate-400 mb-1 font-medium">ORDER VALUE</p>
                            <p className="text-sm font-semibold text-[#1C3384]">
                              ₹ {Number(project.orderValue).toLocaleString('en-IN')}
                            </p>
                          </div>
                        )}

                        {project.projectType && (
                          <div className="px-3 py-3 rounded-xl border border-slate-100 bg-white flex flex-col items-center text-center">
                            <p className="text-[9px] text-slate-400 mb-1 font-medium">TYPE</p>
                            <p className="text-sm font-semibold text-[#1C3384]">{project.projectType}</p>
                          </div>
                        )}
                      </div>

                      {(project.primaryContactName || project.primaryContactMobile) && (
                        <div className="space-y-1 pt-2">
                          <p className="text-[10px] text-slate-400">Primary Contact</p>
                          {project.primaryContactName && (
                            <p className="text-sm font-semibold text-slate-800">{project.primaryContactName}</p>
                          )}
                          {project.primaryContactMobile && (
                            <p className="text-xs font-medium text-slate-500">{project.primaryContactMobile}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Strategic Status */}
                  <div className="pt-4 border-t border-slate-200/60">
                    <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Strategic Matrix</h4>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={14} className="text-[#1C3384]" />
                          <span className="text-[11px] font-medium text-slate-600">Liaisoning</span>
                        </div>
                        <Badge className="bg-[#1C3384]/10 text-[#1C3384] border-none font-bold text-[9px] px-2 shadow-none capitalize">
                          {project.liasoningStage?.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between px-3 py-2.5 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-[#FFC800] fill-[#FFC800]" />
                          <span className="text-[11px] font-medium text-slate-600">Execution</span>
                        </div>
                        <Badge className="bg-[#FFC800]/20 text-[#92400E] border-none font-bold text-[9px] px-2 shadow-none capitalize">
                          {project.executionStage?.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ZONE 2: ACTIVITY LOG (Timeline) */}
              <div className="flex-1 flex flex-col bg-white overflow-hidden min-h-0">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Activity Log</h3>
                    <p className="text-[10px] text-slate-400 mt-0.5">{project.handoffLogs?.length || 0} Handoffs recorded</p>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-100/50 font-semibold text-[10px] px-2 py-0.5 rounded-md flex gap-1 items-center shadow-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live
                  </Badge>
                </div>

                <div className="flex-1 overflow-y-auto overscroll-contain [transform:translateZ(0)] px-6 pt-6 pb-10">
                  {!project.handoffLogs || project.handoffLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-40">
                      <Building2 size={40} className="text-slate-300 mb-4" />
                      <p className="text-xs font-medium text-slate-500">No activity yet</p>
                    </div>
                  ) : (
                    <div className="relative">
                      {/* Spine */}
                      <div className="absolute left-[19px] top-5 bottom-5 w-0.5 bg-slate-100 rounded-full" />

                      <div className="space-y-1">
                        {DEPARTMENT_PIPELINE.map((dept) => {
                          const visited = visitedDepts.has(dept.key);
                          const isCurrent = currentDept === dept.key;
                          const log = deptLogMap[dept.key];

                          return (
                            <div key={dept.key} className={cn("relative flex gap-5 pb-1 group", !visited && !isCurrent && "opacity-35")}>
                              {/* Node */}
                              <div className="relative z-10 shrink-0 mt-3">
                                {isCurrent ? (
                                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-lg ring-4 ring-offset-2", dept.color, dept.ring)}>
                                    <Clock size={16} className="text-white" />
                                  </div>
                                ) : visited ? (
                                  <div className={cn("h-10 w-10 rounded-full flex items-center justify-center shadow-sm", dept.color)}>
                                    <CheckCircle2 size={16} className="text-white" />
                                  </div>
                                ) : (
                                  <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                                    <Circle size={10} className="text-slate-300" />
                                  </div>
                                )}
                              </div>

                              {/* Card */}
                              <div className={cn(
                                "flex-1 rounded-xl border px-4 py-3 mb-4 transition-all relative overflow-hidden",
                                isCurrent ? "bg-[#1C3384]/[0.03] border-[#1C3384]/20 shadow-sm" :
                                  visited ? "bg-white border-slate-100 hover:border-slate-200" :
                                    "bg-slate-50/50 border-slate-100"
                              )}>

                                {/* Header row */}
                                <div className="flex items-center justify-between mb-1">
                                  <div className="flex items-center gap-2">
                                    <p className={cn("text-xs font-bold", isCurrent ? "text-[#1C3384]" : visited ? "text-slate-800" : "text-slate-400")}>
                                      {dept.label}
                                    </p>
                                  </div>
                                  {log && <span className="text-[10px] text-slate-400">{formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}</span>}
                                </div>

                                {/* Stage name */}
                                {log && (
                                  <p className="text-sm font-semibold text-slate-700 capitalize mb-2">
                                    {log.toStage.replace(/_/g, " ").toLowerCase().replace(/^\w/, (c: string) => c.toUpperCase())}
                                  </p>
                                )}

                                {/* Footer: from→to + user */}
                                {log && (
                                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                    <div className="flex items-center gap-1.5">
                                      <span className="text-[10px] text-slate-500 font-medium bg-slate-50 px-2 py-0.5 rounded-md border border-slate-100">{log.fromDept}</span>
                                      <ArrowRight size={10} className="text-slate-300" />
                                      <span className="text-[10px] font-semibold text-[#1C3384] bg-[#1C3384]/5 px-2 py-0.5 rounded-md border border-[#1C3384]/10">{log.toDept}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                      <div className="h-5 w-5 rounded-md bg-slate-100 flex items-center justify-center">
                                        <User size={10} className="text-slate-400" />
                                      </div>
                                      <p className="text-[10px] font-medium text-slate-500">@{log.user?.email?.split("@")[0] || "system"}</p>
                                    </div>
                                  </div>
                                )}

                                {/* Comment */}
                                {log?.comment && (
                                  <div className="mt-3 pt-2 text-[#0F172A] border-t border-slate-100/60">
                                    <span className="text-[11px] font-medium text-slate-800 italic leading-relaxed">"{log.comment}"</span>
                                  </div>
                                )}

                                {/* Pending fallback */}
                                {!visited && !isCurrent && <p className="text-[10px] text-slate-400">Not yet reached</p>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* ZONE 3: DOCUMENT VAULT */}
              <div className="flex flex-col w-60 shrink-0 bg-slate-50/60 overflow-hidden min-h-0">
                <div className="p-5 flex-1 flex flex-col h-full overflow-hidden">
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200/60 shrink-0">
                    <h4 className="text-[11px] font-bold uppercase tracking-widest text-[#1C3384]">Asset Vault</h4>
                    <Badge className="bg-[#1C3384]/10 text-[#1C3384] border-none font-bold text-[9px] px-2 rounded-md">
                      {project.projectFiles?.length || 0}
                    </Badge>
                  </div>

                  <div className="flex flex-col gap-2 mb-4 shrink-0">
                    <input type="file" id="dossier-upload" className="hidden" onChange={handleFileUpload} />
                    <Button
                      variant="outline"
                      disabled={isUploading}
                      onClick={() => document.getElementById("dossier-upload")?.click()}
                      className="w-full bg-white border-dashed border-slate-300 hover:border-[#1C3384]/30 hover:bg-slate-50 text-slate-600 font-semibold text-xs h-9 rounded-lg gap-2 shadow-none transition-all"
                    >
                      <FileUp size={14} className="text-slate-400" />
                      {isUploading ? (status || `Uploading... ${progress}%`) : "Upload Asset"}
                    </Button>
                    
                    {(role === "OWNER" || role === "SUPER_ADMIN") && project?.projectFiles?.some((f: any) => !f.isArchived && (f.fileUrl || (f.content && f.content.startsWith('http')))) && (
                      <Button
                        variant="outline"
                        disabled={isArchiving}
                        onClick={handleArchiveFiles}
                        className="w-full bg-slate-800 border-none hover:bg-slate-700 text-white font-semibold text-[10px] h-8 rounded-lg gap-2 shadow-none transition-all uppercase tracking-widest"
                      >
                       <Server size={12} className="text-white/60" />
                       {isArchiving ? "Moving..." : "Archive to Local Server"}
                      </Button>
                    )}
                  </div>

                  <div className="flex-1 overflow-y-auto overscroll-contain [transform:translateZ(0)] -mr-3 pr-3 pb-8">
                    <div className="grid grid-cols-1 gap-2">
                      {!project.projectFiles || project.projectFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
                          <FileBox size={30} className="mb-3 text-slate-400" />
                          <p className="text-[10px] text-slate-500">Vault Empty</p>
                        </div>
                      ) : (
                        project.projectFiles.map((file: any) => {
                          const ext = file.name.split('.').pop()?.toLowerCase() || '';
                          const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext);
                          const isPdf = ext === 'pdf';
                          const ActionIcon = isImage ? Eye : (isPdf ? ExternalLink : Download);

                          return (
                            <div
                              key={file.id}
                              onClick={() => handleFileClick(file)}
                              className="bg-white px-3 py-3 rounded-xl border border-slate-100 flex items-center justify-between group hover:border-[#1C3384]/30 hover:bg-[#1C3384]/[0.02] transition-all cursor-pointer"
                            >
                              <div className="flex items-center gap-3 overflow-hidden">
                                <div className={cn(
                                  "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
                                  file.category === "LIAISONING" ? "bg-amber-50 text-amber-600" :
                                    file.category === "TECHNICAL" ? "bg-blue-50 text-blue-600" : "bg-emerald-50 text-emerald-600"
                                )}>
                                  <FileText size={16} />
                                </div>
                                <div className="min-w-0 pr-2">
                                  <h4 className="text-[11px] font-semibold text-slate-700 truncate mb-0.5" title={file.name}>{file.name}</h4>
                                  <div className="flex items-center gap-1.5 mt-0.5">
                                    <p className="text-[9px] text-slate-400 leading-none">
                                      {format(new Date(file.createdAt), 'MMM dd, yyyy')}
                                    </p>
                                    {file.isArchived && (
                                      <Badge title="Stored on local server" className="bg-slate-100 text-slate-500 border-none text-[8px] font-black uppercase tracking-widest px-1.5 py-0 leading-none h-4">
                                        Archived
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <ActionIcon size={14} className="text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity group-hover:text-[#1C3384] shrink-0" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 bg-white">
            <AlertCircle size={32} className="text-red-500" />
            <p className="text-slate-700 font-bold text-sm">Dossier Access Failed</p>
            <Button onClick={() => fetchData(false)} variant="outline" className="rounded-lg h-9 px-4 text-xs font-semibold">Retry connection</Button>
          </div>
        )}

        {previewImage && (
          <div className="absolute inset-0 z-[200] bg-slate-950/95 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setPreviewImage(null)}>
            <div className="absolute top-6 right-6 flex items-center gap-3 shadow-xl z-[210]">
              <Button
                onClick={(e) => {
                  e.stopPropagation();
                  const a = document.createElement('a');
                  a.href = previewImage.url;
                  a.download = previewImage.name;
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                }}
                className="bg-white/10 hover:bg-white/20 text-white rounded-xl h-10 w-10 p-0 transition-colors"
              >
                <Download size={18} />
              </Button>
              <Button
                onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                className="bg-red-500/20 hover:bg-red-500/40 text-red-100 rounded-xl h-10 w-10 p-0 transition-colors"
              >
                <X size={18} />
              </Button>
            </div>
            <img
              src={previewImage.url}
              alt={previewImage.name}
              onClick={(e) => e.stopPropagation()}
              className="max-w-[85vw] max-h-[75vh] object-contain rounded-lg shadow-2xl ring-1 ring-white/10 relative z-[205]"
            />
            <p className="absolute bottom-8 text-white/50 text-[10px] font-bold tracking-widest uppercase">{previewImage.name}</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
