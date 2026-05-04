"use client";

import { useState } from "react";
import { FileText, Edit, Trash2, Loader2, ChevronRight, MapPin } from "lucide-react";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuLabel, 
    DropdownMenuGroup,
    DropdownMenuSeparator, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { SurveyAssignmentModal } from "@/components/sales/SurveyAssignmentModal";

interface SalesLeadActionsProps {
    leadId: string;
    leadName: string;
    status: string;
    onActionComplete?: () => void;
    onMarkLost?: () => void;
}

export function SalesLeadActions({ leadId, leadName, status, onActionComplete, onMarkLost }: SalesLeadActionsProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const router = useRouter();

    return (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DropdownMenu>
                <DropdownMenuTrigger className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "rounded-xl hover:bg-white hover:shadow-md transition-all group/btn")}>
                    <ChevronRight size={18} className="text-slate-400 group-hover/btn:text-[#1C3384]" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 p-2 rounded-2xl shadow-2xl border-slate-100">
                    <DropdownMenuGroup>
                        <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-2">
                            Lead Management
                        </DropdownMenuLabel>
                        
                        <DropdownMenuItem 
                            disabled={status === 'SITE_VISIT_SCHEDULED' || status === 'CONVERTED' || status === 'LOST'}
                            onSelect={() => {
                                setIsDialogOpen(true);
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer focus:bg-blue-50 focus:text-[#1C3384] group"
                        >
                            <div className="h-8 w-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-focus:bg-blue-100 transition-colors">
                                <MapPin size={16} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-xs font-bold">Initiate Survey</span>
                                <span className="text-[9px] text-slate-400 uppercase tracking-tighter font-medium">Request Engineering Check</span>
                            </div>
                        </DropdownMenuItem>

                        <DropdownMenuItem 
                            disabled={status === 'LOST'}
                            onClick={() => router.push(`/dashboard/sales/quotes/new?leadId=${leadId}`)}
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
                            variant="destructive" 
                            disabled={status === 'LOST' || status === 'CONVERTED'}
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkLost?.();
                            }}
                            className="flex items-center gap-3 p-3 rounded-xl cursor-pointer mt-1"
                        >
                            <Trash2 size={16} />
                            <span className="text-xs font-medium">Mark as Lost</span>
                        </DropdownMenuItem>
                    </DropdownMenuGroup>
                </DropdownMenuContent>
            </DropdownMenu>

            <SurveyAssignmentModal 
                leadId={leadId}
                leadName={leadName}
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                onSuccess={() => onActionComplete?.()}
            />
        </Dialog>
    );
}
