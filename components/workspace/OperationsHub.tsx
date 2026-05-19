"use client";

import { useState } from "react";
import { 
    ClipboardCheck, 
    ShieldCheck, 
    AlertTriangle, 
    CheckCircle2, 
    Clock, 
    Camera, 
    FileText,
    Activity,
    MapPin,
    Zap,
    Pipette,
    Check
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { logInspection, updateSiteReadiness } from "@/lib/actions/execution";
import { useDashboardNexus } from "../dashboard/DashboardNexusProvider";

interface OperationsHubProps {
    project: any;
}

export function OperationsHub({ project }: OperationsHubProps) {
    const { refresh } = useDashboardNexus();
    const [isSaving, setIsSaving] = useState(false);
    const metadata = project.executionMetadata || {};
    const qc = metadata.qc || {};
    const readiness = metadata.readiness || {};

    const [siteChecks, setSiteChecks] = useState({
        inverterLocation: readiness.inverterLocation || false,
        cableRoute: readiness.cableRoute || false,
        loadConfirmed: readiness.loadConfirmed || false,
        laPosition: readiness.laPosition || false
    });

    const [punchInput, setPunchInput] = useState("");
    const [currentPunchPoints, setCurrentPunchPoints] = useState<string[]>(qc.finalInspection?.punchPoints || []);

    const handleReadinessToggle = async (key: string) => {
        const updated = { ...siteChecks, [key]: !((siteChecks as any)[key]) };
        setSiteChecks(updated);
        try {
            await updateSiteReadiness(project.id, updated);
            toast.success("Readiness updated");
        } catch (e) {
            toast.error("Failed to sync readiness");
        }
    };

    const handleLogInspection = async (type: 'MID' | 'FINAL', result: 'PASS' | 'FAIL') => {
        setIsSaving(true);
        try {
            await logInspection(project.id, type, result, currentPunchPoints);
            toast.success(`${type} Inspection logged as ${result}`);
            refresh();
        } catch (e) {
            toast.error("Failed to log inspection");
        } finally {
            setIsSaving(false);
        }
    };

    const addPunchPoint = () => {
        if (!punchInput.trim()) return;
        setCurrentPunchPoints([...currentPunchPoints, punchInput]);
        setPunchInput("");
    };

    const readinessProgress = (Object.values(siteChecks).filter(Boolean).length / 4) * 100;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* 🏗️ Site Readiness Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-[#FFC800] text-[#1C3384] flex items-center justify-center">
                            <MapPin size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-[#1C3384]">Site Readiness</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Verification & Pre-Flight</p>
                        </div>
                    </div>

                    <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-200/60 space-y-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-end">
                                <p className="text-[10px] font-black text-[#1C3384] uppercase tracking-widest">Readiness Level</p>
                                <p className="text-xl font-black text-[#1C3384]">{Math.round(readinessProgress)}%</p>
                            </div>
                            <Progress value={readinessProgress} className="h-2 bg-slate-200" />
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            {[
                                { key: 'inverterLocation', label: 'Inverter & ACDB Points Finalized', icon: Zap },
                                { key: 'cableRoute', label: 'Cable Routing Path Cleared', icon: Pipette },
                                { key: 'laPosition', label: 'LA & Earth Pit Locations Marked', icon: ShieldCheck },
                                { key: 'loadConfirmed', label: 'Load Availability Verified', icon: Activity }
                            ].map((item) => (
                                <button
                                    key={item.key}
                                    onClick={() => handleReadinessToggle(item.key)}
                                    className={cn(
                                        "flex items-center justify-between p-4 rounded-2xl border transition-all text-left",
                                        (siteChecks as any)[item.key]
                                            ? "bg-white border-emerald-200 shadow-sm"
                                            : "bg-white/50 border-slate-100 opacity-60 hover:opacity-100"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "h-8 w-8 rounded-lg flex items-center justify-center transition-colors",
                                            (siteChecks as any)[item.key] ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <item.icon size={16} />
                                        </div>
                                        <span className="text-xs font-bold text-slate-700 uppercase tracking-tight">{item.label}</span>
                                    </div>
                                    <div className={cn(
                                        "h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all",
                                        (siteChecks as any)[item.key] ? "bg-emerald-500 border-emerald-500 text-white" : "border-slate-200"
                                    )}>
                                        {(siteChecks as any)[item.key] && <Check size={12} strokeWidth={4} />}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 🛡️ Inspection & QC Section */}
                <div className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h4 className="text-sm font-black uppercase tracking-tight text-rose-600">Inspection Control</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">SFDC Compliance & QC</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden">
                        <div className="p-8 space-y-6">
                            {/* Inspection Toggles */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className={cn(
                                    "p-6 rounded-3xl border transition-all space-y-4",
                                    qc.midInspection ? "bg-emerald-50 border-emerald-100" : "bg-slate-50 border-slate-100"
                                )}>
                                    <div className="flex justify-between items-start">
                                        <Badge className={cn(
                                            "font-black text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-lg",
                                            qc.midInspection ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            Mid-Inspection
                                        </Badge>
                                        {qc.midInspection && <CheckCircle2 size={16} className="text-emerald-500" />}
                                    </div>
                                    {!qc.midInspection ? (
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" onClick={() => handleLogInspection('MID', 'PASS')} className="w-full bg-[#1C3384] text-[9px] font-black uppercase tracking-widest rounded-xl">Pass</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleLogInspection('MID', 'FAIL')} className="w-full text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl">Fail</Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[10px] font-black text-emerald-700 uppercase">{qc.midInspection.result}</p>
                                            <p className="text-[8px] text-emerald-600/60 font-bold uppercase mt-1">{new Date(qc.midInspection.date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>

                                <div className={cn(
                                    "p-6 rounded-3xl border transition-all space-y-4",
                                    qc.finalInspection ? "bg-indigo-50 border-indigo-100" : "bg-slate-50 border-slate-100"
                                )}>
                                    <div className="flex justify-between items-start">
                                        <Badge className={cn(
                                            "font-black text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-lg",
                                            qc.finalInspection ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-500"
                                        )}>
                                            Final-Inspection
                                        </Badge>
                                        {qc.finalInspection && <CheckCircle2 size={16} className="text-indigo-500" />}
                                    </div>
                                    {!qc.finalInspection ? (
                                        <div className="flex flex-col gap-2">
                                            <Button size="sm" onClick={() => handleLogInspection('FINAL', 'PASS')} className="w-full bg-[#1C3384] text-[9px] font-black uppercase tracking-widest rounded-xl">Pass</Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleLogInspection('FINAL', 'FAIL')} className="w-full text-rose-500 text-[9px] font-black uppercase tracking-widest rounded-xl">Fail</Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <p className="text-[10px] font-black text-indigo-700 uppercase">{qc.finalInspection.result}</p>
                                            <p className="text-[8px] text-indigo-600/60 font-bold uppercase mt-1">{new Date(qc.finalInspection.date).toLocaleDateString()}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Punch Point Section */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h5 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                                        <AlertTriangle size={14} className="text-amber-500" />
                                        Punch Points ({currentPunchPoints.length})
                                    </h5>
                                </div>
                                
                                <div className="flex gap-2">
                                    <Input 
                                        value={punchInput}
                                        onChange={(e: any) => setPunchInput(e.target.value)}
                                        placeholder="Add issue (e.g. Loose DC termination)"
                                        className="h-10 bg-slate-50 border-slate-100 text-xs font-medium rounded-xl"
                                    />
                                    <Button onClick={addPunchPoint} className="h-10 px-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase">Add</Button>
                                </div>

                                <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                                    {currentPunchPoints.length === 0 ? (
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center py-4 italic">No pending punch points</p>
                                    ) : (
                                        currentPunchPoints.map((point, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-rose-50/50 rounded-xl border border-rose-100 group">
                                                <span className="text-[11px] font-bold text-rose-700 italic">"{point}"</span>
                                                <button 
                                                    onClick={() => setCurrentPunchPoints(currentPunchPoints.filter((_, idx) => idx !== i))}
                                                    className="opacity-0 group-hover:opacity-100 text-rose-300 hover:text-rose-500 transition-all"
                                                >
                                                    <CheckCircle2 size={14} />
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 📋 Documentation & Closure Section */}
            <div className="bg-[#1C3384] rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                    <ClipboardCheck size={160} />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div>
                            <h3 className="text-2xl font-black text-white uppercase tracking-tight font-[family-name:var(--font-montserrat)]">Final Handover Vault</h3>
                            <p className="text-blue-100/60 font-medium text-sm mt-2">Generate and release certificates only after site clearance and quality approval.</p>
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

                    <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-400 text-[#1C3384] flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Site Status</p>
                                <p className="text-lg font-black text-white uppercase">Operational Approval Pending</p>
                            </div>
                         </div>
                         <Button className="w-full h-12 bg-[#FFC800] text-[#1C3384] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-yellow-400">
                             Request Handover Approval
                         </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
