"use client";

import { useState } from "react";
import { FileText, Edit, Trash2, Loader2, ChevronRight, MapPin, Users } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuGroup,
    DropdownMenuSeparator, 
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useEffect, useTransition } from "react";
import { getEngineeringTeamMembers } from "@/lib/actions/engineering";
import { initiatePreliminarySurvey } from "@/lib/actions/sales";
import { toast } from "sonner";

interface SalesLeadActionsProps {
    leadId: string;
    leadName: string;
    status: string;
    onActionComplete?: () => void;
    onMarkLost?: () => void;
}

export function SalesLeadActions({ leadId, leadName, status, onActionComplete, onMarkLost }: SalesLeadActionsProps) {
    const [engineeringTeam, setEngineeringTeam] = useState<{ id: string; email: string }[]>([]);
    const [isLoadingTeam, setIsLoadingTeam] = useState(false);
    const [isPending, setIsPending] = useState(false);
    const router = useRouter();

    const handleOpenChange = (open: boolean) => {
        if (open && engineeringTeam.length === 0) {
            setIsLoadingTeam(true);
            getEngineeringTeamMembers()
                .then(setEngineeringTeam)
                .catch(err => {
                    console.error("Failed to load team:", err);
                    toast.error("Failed to load engineering roster");
                })
                .finally(() => setIsLoadingTeam(false));
        }
    };

    const [processingId, setProcessingId] = useState<string | null>(null);

    const handleInitiate = async (engineerIds: string[]) => {
        const id = engineerIds.length > 0 ? engineerIds[0] : "unassigned";
        
        setProcessingId(id);
        setIsPending(true);
        
        try {
            const res = await initiatePreliminarySurvey(leadId, engineerIds);
            toast.success(`Survey initiated for ${leadName}`);
            
            setTimeout(() => {
                onActionComplete?.();
            }, 500);
        } catch (error: any) {
            console.error("[CLIENT] Error in handleInitiate:", error);
            toast.error(error.message || "Failed to initiate survey");
        } finally {
            setIsPending(false);
            setProcessingId(null);
        }
    };

    return (
        <DropdownMenu onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-xl hover:bg-white hover:shadow-md transition-all group/btn")}>
                <ChevronRight size={18} className="text-slate-400 group-hover/btn:text-[#1C3384]" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2 rounded-2xl shadow-2xl border-slate-100">
                <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">
                        Lead Management
                    </DropdownMenuLabel>
                    
                    <DropdownMenuSub>
                        <DropdownMenuSubTrigger 
                            disabled={status === 'SITE_VISIT_SCHEDULED' || status === 'CONVERTED' || status === 'LOST' || isPending}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-blue-50 focus:text-[#1C3384] group"
                        >
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-focus:bg-blue-100 transition-colors">
                                {isPending ? <Loader2 size={16} className="animate-spin" /> : <MapPin size={16} />}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">Initiate Survey</span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-tighter font-medium">Request Engineering Check</span>
                            </div>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuSubContent className="w-56 p-2 rounded-xl shadow-xl border-slate-100 bg-white z-[100]">
                            <DropdownMenuLabel className="text-[9px] font-bold uppercase tracking-tight text-slate-400 px-2 py-1">Assign to Engineer</DropdownMenuLabel>
                            
                            {isLoadingTeam ? (
                                <div className="p-4 text-center">
                                    <Loader2 size={16} className="animate-spin mx-auto text-slate-300" />
                                </div>
                            ) : engineeringTeam.length === 0 ? (
                                <DropdownMenuItem disabled className="text-[10px] text-slate-400 text-center py-4">
                                    No engineers found
                                </DropdownMenuItem>
                            ) : (
                                engineeringTeam.map((eng) => (
                                    <DropdownMenuItem 
                                        key={eng.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleInitiate([eng.id]);
                                        }}
                                        disabled={isPending}
                                        className="flex items-center justify-between gap-2 p-2 rounded-lg cursor-pointer focus:bg-blue-50 focus:text-[#1C3384]"
                                    >
                                        <div className="flex flex-col items-start gap-0.5">
                                            <span className="text-xs font-bold">{eng.email.split('@')[0]}</span>
                                            <span className="text-[9px] text-slate-400 font-medium truncate w-32">{eng.email}</span>
                                        </div>
                                        {processingId === eng.id && <Loader2 size={12} className="animate-spin text-blue-600" />}
                                    </DropdownMenuItem>
                                ))
                            )}
                            
                            <DropdownMenuSeparator className="my-2" />
                            <DropdownMenuItem 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInitiate([]);
                                }}
                                disabled={isPending}
                                className="flex items-center justify-between p-2 rounded-lg cursor-pointer font-bold text-[#1C3384] focus:bg-blue-50 transition-colors"
                            >
                                <div className="flex items-center gap-2">
                                    <Users size={14} />
                                    <span className="text-xs">Dispatch (Unassigned)</span>
                                </div>
                                {processingId === "unassigned" && <Loader2 size={12} className="animate-spin" />}
                            </DropdownMenuItem>
                        </DropdownMenuSubContent>
                    </DropdownMenuSub>

                    <DropdownMenuItem 
                        disabled={status === 'LOST'}
                        onSelect={() => router.push(`/dashboard/sales/quotes/new?leadId=${leadId}`)}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-amber-50 focus:text-amber-700 group mt-1"
                    >
                        <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center group-focus:bg-amber-100 transition-colors">
                            <FileText size={16} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold">Generate Quote</span>
                            <span className="text-[9px] text-amber-500 uppercase tracking-tighter font-medium">Draft technical proposal</span>
                        </div>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
                
                <DropdownMenuSeparator className="my-2 bg-slate-50" />
                
                <DropdownMenuGroup>
                    <DropdownMenuItem 
                        disabled={status === 'LOST' || status === 'CONVERTED'}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer text-slate-600 hover:bg-slate-50"
                    >
                        <Edit size={16} />
                        <span className="text-xs font-medium">Edit Lead Details</span>
                    </DropdownMenuItem>

                    <DropdownMenuItem 
                        disabled={status === 'LOST' || status === 'CONVERTED'}
                        onSelect={(e) => {
                            e.preventDefault();
                            onMarkLost?.();
                        }}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mt-1 text-rose-600 focus:bg-rose-50 focus:text-rose-600"
                    >
                        <Trash2 size={16} />
                        <span className="text-xs font-medium">Mark as Lost</span>
                    </DropdownMenuItem>
                </DropdownMenuGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
