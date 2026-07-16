"use client";

import { ClipboardList, Activity } from "lucide-react";

export function TechnicalChecklistModule({ project }: { project: any }) {
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

            <div className="flex items-center justify-center p-20 text-center">
                <div className="opacity-50">
                    <Activity size={64} className="mx-auto mb-4 text-slate-400" />
                    <h4 className="text-lg font-black uppercase tracking-widest text-slate-500">Checklist UI pending</h4>
                </div>
            </div>
        </div>
    );
}
