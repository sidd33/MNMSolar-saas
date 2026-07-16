"use client";

import { Flag, FileText, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HandoverModule({ project }: { project: any }) {
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

            <div className="bg-[#1C3384] rounded-[2.5rem] p-10 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-700 text-white">
                    <Flag size={160} />
                </div>
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10">
                    <div className="space-y-6">
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

                    <div className="bg-white/10 backdrop-blur-xl rounded-[2rem] border border-white/10 p-8 flex flex-col justify-center">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-full bg-emerald-400 text-[#1C3384] flex items-center justify-center">
                                <CheckCircle2 size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Site Status</p>
                                <p className="text-lg font-black text-white uppercase">Ready for Sign-off</p>
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
