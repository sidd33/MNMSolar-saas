"use client";

import { PackageSearch, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MaterialRequestModule({ project }: { project: any }) {
    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-100 pb-6">
                <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                        <PackageSearch size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black uppercase tracking-tight text-slate-800">Material Requisition</h2>
                        <p className="text-xs text-slate-500 font-medium">Indent short materials directly to procurement</p>
                    </div>
                </div>
                <Button className="bg-[#1C3384] text-white font-bold uppercase tracking-widest text-[10px] rounded-xl">
                    <Plus size={16} className="mr-2" /> New Request
                </Button>
            </div>

            <div className="flex items-center justify-center p-20 text-center">
                <div className="opacity-50">
                    <PackageSearch size={64} className="mx-auto mb-4 text-slate-400" />
                    <h4 className="text-lg font-black uppercase tracking-widest text-slate-500">No active requests</h4>
                </div>
            </div>
        </div>
    );
}
