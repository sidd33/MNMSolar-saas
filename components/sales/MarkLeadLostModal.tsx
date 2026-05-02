"use client";

import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { markLeadLost } from "@/lib/actions/sales";
import { 
  Users, 
  Wallet, 
  XCircle, 
  FileWarning, 
  ShieldAlert, 
  Ghost, 
  HelpCircle,
  Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MarkLeadLostModalProps {
  lead: { id: string; name: string };
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const REASONS = [
  { value: 'COMPETITOR', label: 'Went with Competitor', icon: Users, color: 'text-blue-500 bg-blue-50' },
  { value: 'BUDGET', label: 'Budget Constraints', icon: Wallet, color: 'text-amber-500 bg-amber-50' },
  { value: 'CANCELLED', label: 'Project Cancelled', icon: XCircle, color: 'text-slate-500 bg-slate-50' },
  { value: 'APPROVALS', label: 'Approval Issues', icon: FileWarning, color: 'text-purple-500 bg-purple-50' },
  { value: 'TECHNICAL', label: 'Technical Issues', icon: ShieldAlert, color: 'text-orange-500 bg-orange-50' },
  { value: 'NO_RESPONSE', label: 'No Response', icon: Ghost, color: 'text-rose-500 bg-rose-50' },
  { value: 'OTHER', label: 'Other', icon: HelpCircle, color: 'text-slate-500 bg-slate-50' },
];

export function MarkLeadLostModal({ lead, isOpen, onClose, onSuccess }: MarkLeadLostModalProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    try {
      await markLeadLost(lead.id, selectedReason, note);
      toast.success("Lead marked as lost.");
      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to mark lead as lost");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isSubmitting && onClose()}>
      <DialogContent className="max-w-xl p-0 overflow-hidden border-none rounded-[2.5rem] shadow-2xl">
        <DialogHeader className="p-10 pb-6 bg-slate-50/80">
          <DialogTitle className="text-2xl font-black text-slate-900 uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
            Mark Lead as Lost
          </DialogTitle>
          <DialogDescription className="text-slate-500 font-medium">
            Help us understand why the deal for <span className="text-slate-900 font-bold">{lead.name}</span> didn't close.
          </DialogDescription>
        </DialogHeader>

        <div className="p-10 space-y-8 bg-white">
          <div className="space-y-4">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Primary Reason</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {REASONS.map((reason) => {
                const Icon = reason.icon;
                const isSelected = selectedReason === reason.value;
                return (
                  <button
                    key={reason.value}
                    onClick={() => setSelectedReason(reason.value)}
                    className={cn(
                      "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left group",
                      isSelected 
                        ? "border-[#1C3384] bg-blue-50/30 shadow-lg shadow-blue-900/5" 
                        : "border-slate-100 hover:border-slate-200 hover:bg-slate-50"
                    )}
                  >
                    <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110", reason.color)}>
                      <Icon size={20} />
                    </div>
                    <span className={cn("text-xs font-black uppercase tracking-tight", isSelected ? "text-[#1C3384]" : "text-slate-600")}>
                      {reason.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Additional notes (optional)</Label>
            <Textarea
              placeholder="Any extra context about why this was lost..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="bg-slate-50 border-none rounded-2xl min-h-[100px] focus:ring-2 focus:ring-[#1C3384]/10 transition-all font-medium text-slate-700 p-4"
            />
          </div>
        </div>

        <DialogFooter className="p-10 pt-0 bg-white flex flex-col sm:flex-row gap-3 sm:gap-0">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isSubmitting}
            className="flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedReason || isSubmitting}
            className={cn(
              "flex-1 h-14 rounded-2xl font-black uppercase tracking-widest gap-2 shadow-xl transition-all",
              "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/20 active:scale-95"
            )}
          >
            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : "Confirm — Mark as Lost"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
