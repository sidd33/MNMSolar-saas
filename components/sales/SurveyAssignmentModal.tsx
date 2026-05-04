"use client";

import { useState, useEffect, useTransition } from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogDescription, 
    DialogFooter, 
    DialogHeader, 
    DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, Check, X, Rocket, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { getEngineeringTeamMembers } from "@/lib/actions/engineering";
import { initiatePreliminarySurvey } from "@/lib/actions/sales";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SurveyAssignmentModalProps {
    leadId: string;
    leadName: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function SurveyAssignmentModal({ leadId, leadName, isOpen, onClose, onSuccess }: SurveyAssignmentModalProps) {
    const [isPending, startTransition] = useTransition();
    const [engineeringTeam, setEngineeringTeam] = useState<{ id: string; email: string }[]>([]);
    const [selectedEngineerIds, setSelectedEngineerIds] = useState<string[]>([]);

    useEffect(() => {
        if (isOpen) {
            getEngineeringTeamMembers().then(setEngineeringTeam).catch(err => {
                console.error("Failed to fetch team:", err);
                toast.error("Failed to load engineering team.");
            });
        }
    }, [isOpen]);

    const toggleEngineer = (id: string) => {
        setSelectedEngineerIds(prev => 
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const handleInitiate = () => {
        startTransition(async () => {
            try {
                await initiatePreliminarySurvey(leadId, selectedEngineerIds);
                toast.success(`Preliminary survey initiated for ${leadName}`);
                onSuccess();
                onClose();
            } catch (error: any) {
                toast.error(error.message || "Failed to initiate survey");
                console.error(error);
            }
        });
    };

    return (
        <DialogContent className="max-w-md p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
            <div className="bg-[#1C3384] p-8 text-white">
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                    <Users size={24} />
                </div>
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black tracking-tight font-[family-name:var(--font-montserrat)] uppercase">Assign Survey Team</DialogTitle>
                    <DialogDescription className="text-blue-100/60 font-medium">
                        Select engineers to dispatch for the preliminary site survey of {leadName}.
                    </DialogDescription>
                </DialogHeader>
            </div>

            <div className="p-8 space-y-6 bg-white">
                <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Engineering Roster</label>
                    <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {engineeringTeam.length === 0 ? (
                            <div className="py-8 text-center text-slate-300 font-bold uppercase tracking-widest text-[10px] border-2 border-dashed border-slate-100 rounded-2xl">
                                Loading Team...
                            </div>
                        ) : (
                            engineeringTeam.map((eng) => (
                                <div 
                                    key={eng.id}
                                    onClick={() => toggleEngineer(eng.id)}
                                    className={cn(
                                        "group flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer",
                                        selectedEngineerIds.includes(eng.id)
                                            ? "bg-blue-50 border-blue-200 shadow-sm"
                                            : "bg-white border-slate-100 hover:border-slate-300"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-full flex items-center justify-center text-[10px] font-black text-white",
                                            selectedEngineerIds.includes(eng.id) ? "bg-[#1C3384]" : "bg-slate-200"
                                        )}>
                                            {eng.email.slice(0, 1).toUpperCase()}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-800">{eng.email.split('@')[0]}</span>
                                            <span className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">{eng.email}</span>
                                        </div>
                                    </div>
                                    {selectedEngineerIds.includes(eng.id) && (
                                        <div className="h-6 w-6 rounded-full bg-[#1C3384] flex items-center justify-center text-white">
                                            <Check size={12} strokeWidth={3} />
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {selectedEngineerIds.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {selectedEngineerIds.map(id => {
                            const eng = engineeringTeam.find(e => e.id === id);
                            return (
                                <Badge key={id} className="bg-blue-50 text-[#1C3384] hover:bg-blue-50 border-none px-3 py-1 rounded-lg flex items-center gap-2 group">
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{eng?.email.split('@')[0]}</span>
                                    <X size={10} className="cursor-pointer opacity-40 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); toggleEngineer(id); }} />
                                </Badge>
                            );
                        })}
                    </div>
                )}
            </div>

            <DialogFooter className="p-8 pt-0 bg-white">
                <Button 
                    onClick={handleInitiate}
                    disabled={isPending}
                    className="w-full h-14 bg-[#1C3384] hover:bg-[#16296a] text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-blue-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                >
                    {isPending ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : (
                        <>
                            <Rocket size={18} />
                            Dispatch Survey Team
                        </>
                    )}
                </Button>
            </DialogFooter>
        </DialogContent>
    );
}
