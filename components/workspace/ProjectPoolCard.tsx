"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Clock, MapPin, User, ShieldAlert, ArrowRight, CornerDownRight, History, Info, Eye, Zap, Inbox, Lock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { claimProject, unclaimProject } from "@/lib/actions/engineering";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";
import dynamic from "next/dynamic";
const Project360Modal = dynamic(() => import("@/components/dashboard/Project360Modal").then(mod => mod.Project360Modal), { ssr: false });

interface ProjectPoolCardProps {
  project: any;
}

export function ProjectPoolCard({ project }: ProjectPoolCardProps) {
  const { user } = useUser();
  const { refresh } = useDashboardNexus();
  const [note, setNote] = useState("");
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const isClaimedByMe = project.claimedByUserId === user?.id;
  const isClaimedByTeam = project.claimedByUserId && project.claimedByUserId !== user?.id;
  const isUnclaimed = !project.claimedByUserId;

  // Urgency logic: based on updatedAt or isBottlenecked
  const isHighUrgency = project.isBottlenecked || (Date.now() - new Date(project.updatedAt).getTime() > 1000 * 60 * 60 * 48);
  const urgencyColor = isHighUrgency ? "bg-rose-500" : "bg-[#48BB78]";

  const handleClaim = async () => {
    if (!note && !showNoteInput) {
        setShowNoteInput(true);
        return;
    }
    const toastId = toast.loading("Registering claim...");
    setIsActionLoading(true);
    try {
      await claimProject(project.id, note);
      toast.success("Project assigned to your desk", { id: toastId });
      refresh();
      setShowNoteInput(false);
      setNote("");
    } catch (err: any) {
      toast.error(err.message || "Failed to claim", { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleRelease = async () => {
    if (!note && !showNoteInput) {
        setShowNoteInput(true);
        return;
    }
    const toastId = toast.loading("Releasing project...");
    setIsActionLoading(true);
    try {
      await unclaimProject(project.id, note);
      toast.success("Project returned to pool", { id: toastId });
      refresh();
      setShowNoteInput(false);
      setNote("");
    } catch (err: any) {
      toast.error(err.message || "Failed to release", { id: toastId });
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <Card className={cn(
      "overflow-hidden border-none shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all relative rounded-[2rem] bg-white group/card p-0",
      isClaimedByTeam ? "opacity-60 grayscale-[0.5]" : ""
    )}>
      <div className="grid grid-cols-1 lg:grid-cols-12">
        {/* LEFT SECTION (DATA & INTEL) */}
        <div className="lg:col-span-8 p-6 lg:p-8 flex flex-col relative">
          {/* Urgency Pip */}
          <div className={cn("absolute left-0 top-0 bottom-0 w-1.5", urgencyColor)} />
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Badge className="bg-[#EDF2F7] text-[#4A5568] font-black px-3 py-1 uppercase tracking-widest text-[8px] border-none rounded-full">
                {project.stage?.replace(/_/g, ' ')}
              </Badge>
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[#CBD5E0]">
                REF: <span className="text-[#1A202C] font-black">[{project.id.slice(-6).toUpperCase()}]</span>
              </span>
            </div>
            <div className="flex items-center gap-3">
                {project.assignedEngineers?.length > 0 && (
                  <div className="flex -space-x-2">
                    {project.assignedEngineers.map((eng: any) => (
                      <Badge key={eng.id} className={cn(
                        "font-black px-2 py-0.5 uppercase tracking-wider text-[7px] rounded-full shrink-0 border-2 border-white",
                        eng.id === user?.id ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-400"
                      )}>
                        {eng.email.split('@')[0].toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                )}
               <Button
                 variant="ghost"
                 onClick={() => setModalOpen(true)}
                 className="h-8 px-4 rounded-full bg-[#F7FAFC] hover:bg-[#EDF2F7] text-[#718096] font-black text-[8px] uppercase tracking-widest transition-all gap-2 border border-[#E2E8F0]"
               >
                 <Eye size={12} /> INSPECT DATA
               </Button>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-xl font-black leading-none tracking-tight text-[#1C3384] font-[family-name:var(--font-montserrat)] uppercase mb-2">
              {project.name}
            </h3>
            <div className="flex items-center gap-2">
                <User size={12} className={cn("shrink-0", (project.assignedToEngineerId || project.claimedByUserId) ? "text-[#1C3384]" : "text-[#CBD5E0]")} />
                <span className={cn(
                  "text-[9px] font-black uppercase tracking-[0.2em]",
                  (project.assignedToEngineerId || project.claimedByUserId) ? "text-[#1C3384]" : "text-[#A0AEC0]"
                )}>
                  {project.assignedToEngineerId 
                    ? `ASSIGNED TO ${project.assignedEngineers?.[0]?.email?.split('@')[0]?.toUpperCase() || 'ENGINEER'}`
                    : project.claimedByUserId
                    ? `CLAIMED BY ${project.claimedBy?.email?.split('@')[0]?.toUpperCase() || 'ENGINEER'}`
                    : "VERIFICATION PENDING / UNCLAIMED"
                  }
                </span>
            </div>
          </div>

          {/* Historical Intel */}
          {(project.poolClaimNote || project.poolReleaseNote) && (
             <div className="mt-auto bg-[#F8FAFC] rounded-2xl p-4 border border-[#EDF2F7] space-y-3">
                {project.poolClaimNote && (
                    <div className="flex gap-3">
                        <History size={14} className="text-[#1C3384] shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[8px] font-black text-[#1C3384] uppercase tracking-widest mb-1">Claim Intel</p>
                            <p className="text-[11px] font-medium text-[#4A5568] leading-relaxed italic">"{project.poolClaimNote}"</p>
                        </div>
                    </div>
                )}
                {project.poolReleaseNote && (
                    <div className="flex gap-3 pt-2 border-t border-[#EDF2F7]">
                        <ShieldAlert size={14} className="text-rose-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[8px] font-black text-rose-500 uppercase tracking-widest mb-1">Release Directive</p>
                            <p className="text-[11px] font-medium text-[#4A5568] leading-relaxed italic">"{project.poolReleaseNote}"</p>
                        </div>
                    </div>
                )}
             </div>
          )}

          <div className="mt-6 flex items-center gap-2 text-[8px] font-black uppercase tracking-[0.2em] text-[#CBD5E0]">
            <Clock size={10} /> UPDATED {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: false }).toUpperCase()} AGO
          </div>
        </div>

        {/* RIGHT SECTION (ACTIONS) */}
        <div className={cn(
            "lg:col-span-4 p-6 lg:p-8 flex flex-col justify-center relative overflow-hidden transition-colors",
            isClaimedByMe ? "bg-[#38A169]" : "bg-[#1C3384]"
        )}>
            {/* Background Icon Watermark */}
            <div className="absolute top-0 right-0 p-6 opacity-5 scale-[2] pointer-events-none text-white">
                {isClaimedByMe ? <Zap size={120} /> : <Inbox size={120} />}
            </div>

            <h4 className="font-black flex items-center gap-2 mb-6 text-[9px] uppercase tracking-[0.3em] text-[#FFC800] relative z-10">
                {isClaimedByMe ? <Zap size={12} fill="#FFC800" /> : <Inbox size={12} fill="#FFC800" />} 
                {isUnclaimed ? "READY FOR PICKUP" : isClaimedByMe ? "CURRENTLY ASSIGNED" : "LOCKED BY TEAM"}
            </h4>

            {isClaimedByTeam ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/10 relative z-10 text-center">
                    <Lock size={24} className="text-white/40 mx-auto mb-2" />
                    <p className="text-[10px] font-black text-white uppercase tracking-widest">Unavailable</p>
                    <p className="text-[9px] font-bold text-white/60 truncate mt-1">{project.claimedBy?.email}</p>
                </div>
            ) : (
                <div className="space-y-4 relative z-10">
                    {showNoteInput && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-white/50 ml-1">Status Note</Label>
                            <Textarea 
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Log your intention or status..." 
                                className="bg-white/5 border-white/10 text-white text-[11px] font-medium h-20 rounded-xl p-3 focus:ring-0 placeholder:text-white/20 resize-none leading-relaxed" 
                            />
                        </div>
                    )}

                    <div className="flex flex-col gap-2">
                        {isUnclaimed && (
                            <Button 
                                onClick={handleClaim} 
                                disabled={isActionLoading}
                                className="h-12 bg-[#FFC800] text-[#1C3384] hover:bg-yellow-400 font-black rounded-xl text-[10px] uppercase tracking-widest gap-2 shadow-xl shadow-yellow-400/10"
                            >
                                {showNoteInput ? "CONFIRM CLAIM" : "CLAIM PROJECT"}
                                <ArrowRight size={16} />
                            </Button>
                        )}

                        {isClaimedByMe && (
                            <>
                                <Link 
                                    href={`/dashboard/engineering/${project.stage.toLowerCase()}`}
                                    className={cn(
                                        buttonVariants({ variant: "outline", size: "default" }),
                                        "h-12 rounded-xl bg-white border-none text-[#38A169] font-black text-[10px] uppercase tracking-widest hover:bg-emerald-50"
                                    )}
                                >
                                    OPEN WORKSPACE
                                </Link>
                                <Button 
                                    onClick={handleRelease} 
                                    disabled={isActionLoading}
                                    variant="ghost" 
                                    className="h-10 text-white/60 hover:text-white hover:bg-white/10 font-black rounded-xl text-[9px] uppercase tracking-widest gap-2"
                                >
                                    {showNoteInput ? "CONFIRM RELEASE" : "RELEASE BACK TO POOL"}
                                </Button>
                            </>
                        )}
                        
                        {showNoteInput && (
                             <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setShowNoteInput(false)}
                                className="text-white/30 text-[8px] uppercase font-black hover:text-white transition-colors"
                             >
                                 CANCEL ACTION
                             </Button>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
      <Project360Modal projectId={project.id} open={modalOpen} onOpenChange={setModalOpen} initialData={project} />
    </Card>
  );
}
