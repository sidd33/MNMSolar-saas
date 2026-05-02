"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { addFollowUp, completeFollowUp, getLeadFollowUps } from "@/lib/actions/sales";
import { format } from "date-fns";
import { Phone, Home, Mail, MessageSquare, Users, MoreHorizontal, CheckCircle2, Clock, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FollowUpLogProps {
  leadId: string;
}

const TYPES = [
  { value: 'CALL', label: 'Call', icon: Phone },
  { value: 'SITE_VISIT', label: 'Site Visit', icon: Home },
  { value: 'EMAIL', label: 'Email', icon: Mail },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageSquare },
  { value: 'MEETING', label: 'Meeting', icon: Users },
  { value: 'OTHER', label: 'Other', icon: MoreHorizontal },
];

export function FollowUpLog({ leadId }: FollowUpLogProps) {
  const [followUps, setFollowUps] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedType, setSelectedType] = useState('CALL');
  const [note, setNote] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const fetchFollowUps = async () => {
    try {
      const data = await getLeadFollowUps(leadId);
      setFollowUps(data);
    } catch (error: any) {
      toast.error("Failed to load follow-ups");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, [leadId]);

  const handleSubmit = async () => {
    if (!note.trim()) return;

    setIsSubmitting(true);
    try {
      await addFollowUp(leadId, selectedType, note, followUpDate);
      toast.success("Follow-up logged.");
      setNote('');
      setFollowUpDate('');
      fetchFollowUps();
    } catch (error: any) {
      toast.error(error.message || "Failed to log follow-up");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkDone = async (id: string) => {
    try {
      await completeFollowUp(id);
      toast.success("Task marked as done.");
      fetchFollowUps();
    } catch (error: any) {
      toast.error("Failed to update status");
    }
  };

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'CALL': return "bg-blue-50 text-blue-600 border-blue-100";
      case 'SITE_VISIT': return "bg-emerald-50 text-emerald-600 border-emerald-100";
      case 'EMAIL': return "bg-purple-50 text-purple-600 border-purple-100";
      case 'WHATSAPP': return "bg-teal-50 text-teal-600 border-teal-100";
      case 'MEETING': return "bg-amber-50 text-amber-600 border-amber-100";
      default: return "bg-slate-50 text-slate-600 border-slate-100";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* SECTION A — Add new follow-up */}
      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 space-y-6">
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Activity Type</Label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const isActive = selectedType === t.value;
              return (
                <button
                  key={t.value}
                  onClick={() => setSelectedType(t.value)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border",
                    isActive 
                      ? "bg-[#1C3384] text-white border-[#1C3384] shadow-lg shadow-blue-900/10 scale-105" 
                      : "bg-white text-slate-500 border-slate-200 hover:border-[#1C3384]/30 hover:text-[#1C3384]"
                  )}
                >
                  <Icon size={14} strokeWidth={isActive ? 3 : 2} />
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Interaction Note</Label>
          <Textarea
            placeholder="What happened? What was discussed?"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="bg-white border-slate-200 rounded-2xl min-h-[100px] focus:ring-2 focus:ring-[#1C3384]/10 transition-all font-medium text-slate-700 p-4"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Schedule follow-up for:</Label>
            <Input
              type="datetime-local"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              className="bg-white border-slate-200 rounded-xl h-12 focus:ring-1 focus:ring-[#1C3384] transition-all font-medium"
            />
          </div>
          <div className="flex items-end">
            <Button
              onClick={handleSubmit}
              disabled={!note.trim() || isSubmitting}
              className="w-full bg-[#1C3384] hover:bg-blue-900 text-white rounded-xl h-12 font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-900/10 active:scale-95 transition-all"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : "Log Follow-up"}
            </Button>
          </div>
        </div>
      </div>

      {/* SECTION B — Follow-up history */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-px bg-slate-100 flex-1" />
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-300">Activity Timeline</p>
          <div className="h-px bg-slate-100 flex-1" />
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 opacity-30">
            <Loader2 className="animate-spin text-[#1C3384]" size={32} />
            <p className="text-[10px] font-black uppercase tracking-widest">Retrieving Logbook...</p>
          </div>
        ) : followUps.length === 0 ? (
          <div className="bg-slate-50/30 rounded-[2rem] border border-dashed border-slate-200 p-12 text-center">
             <Clock className="mx-auto text-slate-200 mb-4" size={48} />
             <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">No activity logged yet. Log your first follow-up above.</p>
          </div>
        ) : (
          <div className="relative space-y-4">
            {/* Timeline track */}
            <div className="absolute left-[21px] top-4 bottom-4 w-px bg-slate-100 hidden sm:block" />
            
            {followUps.map((log) => (
              <div key={log.id} className="relative pl-0 sm:pl-12 group">
                {/* Timeline dot */}
                <div className="absolute left-[14px] top-1.5 h-4 w-4 rounded-full border-2 border-white bg-slate-200 group-hover:bg-[#1C3384] transition-colors z-10 hidden sm:block shadow-sm" />
                
                <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm group-hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={cn("rounded-lg px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border", getTypeStyles(log.type))}>
                        {log.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        {log.user.email.split('@')[0]}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase">
                      {format(new Date(log.createdAt), 'MMM dd, yyyy • hh:mm a')}
                    </span>
                  </div>
                  
                  <p className="text-sm font-medium text-slate-700 leading-relaxed whitespace-pre-wrap mb-4">
                    {log.note}
                  </p>

                  {log.followUpDate && (
                    <div className={cn(
                      "flex items-center justify-between p-3 rounded-xl border",
                      log.isCompleted ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-amber-50 border-amber-100 text-amber-700"
                    )}>
                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
                        {log.isCompleted ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                        {log.isCompleted ? "Completed" : `Follow up on ${format(new Date(log.followUpDate), 'MMM dd, yyyy')}`}
                      </div>
                      {!log.isCompleted && (
                        <Button 
                          size="sm" 
                          onClick={() => handleMarkDone(log.id)}
                          className="h-7 px-3 bg-white hover:bg-[#1C3384] hover:text-white text-amber-700 border border-amber-200 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-none"
                        >
                          Mark Done
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
