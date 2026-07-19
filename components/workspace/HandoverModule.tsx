"use client";

import { useState } from "react";
import { Flag, FileText, CheckCircle2, Plus, Trash2, ShieldAlert, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import { updateExecutionMetadata } from "@/lib/actions/execution";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";

export function HandoverModule({ project }: { project: any }) {
    const { refresh } = useDashboardNexus();
    const [isSaving, setIsSaving] = useState(false);
    const [newPunch, setNewPunch] = useState("");

    const punchPoints = (project?.executionMetadata?.punchPoints || []) as any[];

    const handleAddPunch = async () => {
        if (!newPunch.trim()) return;
        setIsSaving(true);
        const toastId = toast.loading("Adding punch point...");
        try {
            const updated = [...punchPoints, { id: crypto.randomUUID(), text: newPunch, isResolved: false }];
            await updateExecutionMetadata(project.id, 'punchPoints', updated);
            setNewPunch("");
            toast.success("Punch point added", { id: toastId });
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Failed to add", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleResolve = async (id: string, currentStatus: boolean) => {
        setIsSaving(true);
        const toastId = toast.loading("Updating status...");
        try {
            const updated = punchPoints.map(p => p.id === id ? { ...p, isResolved: !currentStatus } : p);
            await updateExecutionMetadata(project.id, 'punchPoints', updated);
            toast.success("Status updated", { id: toastId });
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Failed to update", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        setIsSaving(true);
        const toastId = toast.loading("Deleting...");
        try {
            const updated = punchPoints.filter(p => p.id !== id);
            await updateExecutionMetadata(project.id, 'punchPoints', updated);
            toast.success("Deleted", { id: toastId });
            refresh();
        } catch (e: any) {
            toast.error(e.message || "Failed to delete", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    const allResolved = punchPoints.length > 0 && punchPoints.every(p => p.isResolved);
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="h-12 w-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
                    <Flag size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Final Handover Desk</h2>
                    <p className="text-xs text-slate-500 font-medium">Clearance certificates and stage advancement</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Punch Points */}
                <Card className="p-8 rounded-[2rem] border-slate-200 shadow-sm flex flex-col h-[500px]">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                <ShieldAlert size={16} /> Punch Points
                            </h3>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Issues to resolve before handover</p>
                        </div>
                        <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                            {punchPoints.filter(p => !p.isResolved).length} Pending
                        </span>
                    </div>

                    <div className="flex gap-2 mb-6">
                        <Input 
                            value={newPunch} 
                            onChange={e => setNewPunch(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleAddPunch()}
                            placeholder="e.g. Scratches on inverter cover" 
                            className="bg-slate-50 border-slate-200 h-10" 
                        />
                        <Button 
                            onClick={handleAddPunch} 
                            disabled={isSaving || !newPunch.trim()} 
                            size="icon" 
                            className="h-10 w-10 shrink-0 rounded-xl bg-blue-600 hover:bg-blue-700"
                        >
                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        </Button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2 pr-2 scrollbar-none">
                        {punchPoints.length === 0 ? (
                            <div className="text-center py-10 opacity-50">
                                <ShieldAlert size={32} className="mx-auto mb-2 text-slate-400" />
                                <p className="text-xs font-bold uppercase tracking-widest text-slate-500">No punch points added</p>
                            </div>
                        ) : (
                            punchPoints.map(punch => (
                                <div key={punch.id} className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-slate-300 transition-colors">
                                    <button 
                                        onClick={() => handleToggleResolve(punch.id, punch.isResolved)}
                                        disabled={isSaving}
                                        className="shrink-0"
                                    >
                                        <CheckCircle2 size={20} className={punch.isResolved ? "text-emerald-500" : "text-slate-300"} />
                                    </button>
                                    <span className={`flex-1 text-sm font-medium ${punch.isResolved ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                        {punch.text}
                                    </span>
                                    <button 
                                        onClick={() => handleDelete(punch.id)}
                                        disabled={isSaving}
                                        className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition-all p-1"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </Card>

                {/* Handover Card */}
                <div className="bg-[#1C3384] rounded-[2.5rem] p-10 relative overflow-hidden group h-[500px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                        <Flag size={160} />
                    </div>
                    <div className="relative z-10 space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight font-[family-name:var(--font-montserrat)]">Handover Vault</h3>
                            <p className="text-blue-100/60 font-medium text-sm mt-2">Generate certificates after site clearance.</p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Button disabled className="bg-white/10 text-white/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-6">
                                <FileText size={16} className="mr-2" /> Installation Cert
                            </Button>
                            <Button disabled className="bg-white/10 text-white/40 border border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest h-11 px-6">
                                <FileText size={16} className="mr-2" /> Warranty Cert
                            </Button>
                        </div>
                    </div>

                    <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col justify-center relative z-10">
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${allResolved || punchPoints.length === 0 ? 'bg-emerald-400 text-[#1C3384]' : 'bg-amber-400 text-amber-900'}`}>
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Site Status</p>
                                <p className="text-lg font-black text-white uppercase">
                                    {allResolved || punchPoints.length === 0 ? "Ready for Sign-off" : "Pending Punch Points"}
                                </p>
                            </div>
                        </div>
                        <Button 
                            disabled={!allResolved && punchPoints.length > 0} 
                            className="w-full h-12 bg-[#FFC800] text-[#1C3384] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-yellow-400 disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
                        >
                            Request Handover Approval
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
