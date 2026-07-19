"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClipboardList, Activity, Save, Loader2, CheckCircle2, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { updateExecutionMetadata } from "@/lib/actions/execution";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";

export function TechnicalChecklistModule({ project }: { project: any }) {
    const { refresh } = useDashboardNexus();
    const [isSaving, setIsSaving] = useState(false);
    
    const existingTesting = project?.executionMetadata?.testing || {};

    const [testingData, setTestingData] = useState({
        meggerTest: existingTesting.meggerTest || "",
        earthResistance: existingTesting.earthResistance || "",
        stringVoc: existingTesting.stringVoc || "",
        acWiringChecked: existingTesting.acWiringChecked || false,
        dcWiringChecked: existingTesting.dcWiringChecked || false,
    });

    const handleSave = async () => {
        setIsSaving(true);
        const toastId = toast.loading("Saving technical testing data...");
        
        try {
            await updateExecutionMetadata(project.id, 'testing', testingData);
            toast.success("Testing data saved successfully", { id: toastId });
            refresh();
        } catch (error: any) {
            toast.error(error.message || "Failed to save data", { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-6">
                <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <ClipboardList size={24} />
                </div>
                <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Technical Commissioning</h2>
                    <p className="text-xs text-slate-500 font-medium">Pre-handover testing and checklists</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Testing Form */}
                <Card className="p-8 rounded-[2rem] border-slate-200 shadow-sm space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Megger Test Value (MΩ)</label>
                            <Input 
                                placeholder="e.g. >100 MΩ" 
                                value={testingData.meggerTest}
                                onChange={e => setTestingData(prev => ({ ...prev, meggerTest: e.target.value }))}
                                className="h-12 bg-slate-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Earth Resistance (Ω)</label>
                            <Input 
                                placeholder="e.g. <3 Ω" 
                                value={testingData.earthResistance}
                                onChange={e => setTestingData(prev => ({ ...prev, earthResistance: e.target.value }))}
                                className="h-12 bg-slate-50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">String Voc (Average V)</label>
                            <Input 
                                placeholder="e.g. 780V" 
                                value={testingData.stringVoc}
                                onChange={e => setTestingData(prev => ({ ...prev, stringVoc: e.target.value }))}
                                className="h-12 bg-slate-50"
                            />
                        </div>
                        
                        <div className="pt-4 border-t border-slate-100 space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all"
                                    checked={testingData.acWiringChecked}
                                    onChange={e => setTestingData(prev => ({ ...prev, acWiringChecked: e.target.checked }))}
                                />
                                <span className="text-sm font-bold text-slate-700 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">AC Wiring & Breakers Checked</span>
                            </label>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <input 
                                    type="checkbox" 
                                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all"
                                    checked={testingData.dcWiringChecked}
                                    onChange={e => setTestingData(prev => ({ ...prev, dcWiringChecked: e.target.checked }))}
                                />
                                <span className="text-sm font-bold text-slate-700 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">DC Wiring & Polarities Verified</span>
                            </label>
                        </div>
                    </div>

                    <Button 
                        onClick={handleSave} 
                        disabled={isSaving} 
                        className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 mt-4 group"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : (
                            <>
                                <Save size={18} className="mr-2" />
                                Save Testing Data
                            </>
                        )}
                    </Button>
                </Card>

                {/* Status Indicator */}
                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                        <Activity size={16} /> Readiness Status
                    </h3>

                    {testingData.acWiringChecked && testingData.dcWiringChecked && testingData.meggerTest && testingData.earthResistance ? (
                        <div className="p-8 border border-emerald-200 bg-emerald-50 rounded-[2rem] text-center">
                            <CheckCircle2 size={48} className="mx-auto mb-4 text-emerald-500" />
                            <h4 className="text-xl font-black uppercase tracking-tight text-emerald-900">System Ready</h4>
                            <p className="text-sm text-emerald-700 mt-2 font-medium">All technical parameters verified. Ready for net-metering and handover.</p>
                        </div>
                    ) : (
                        <div className="p-8 border border-amber-200 bg-amber-50 rounded-[2rem] text-center">
                            <ShieldAlert size={48} className="mx-auto mb-4 text-amber-500" />
                            <h4 className="text-xl font-black uppercase tracking-tight text-amber-900">Testing Pending</h4>
                            <p className="text-sm text-amber-700 mt-2 font-medium">Please complete all testing fields and checklists above to clear this stage.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
