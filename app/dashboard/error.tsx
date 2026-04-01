"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Dashboard error boundary caught:", error);
  }, [error]);

  return (
    <div className="p-8 max-w-3xl mx-auto my-12">
        <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-[2.5rem] border border-red-100 shadow-xl shadow-red-900/5 relative overflow-hidden">
        {/* Abstract Background pattern */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full blur-3xl opacity-50 -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-amber-50 rounded-full blur-3xl opacity-50 translate-y-1/2 -translate-x-1/3" />

        <div className="h-20 w-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mb-6 shadow-inner relative z-10">
            <AlertTriangle size={32} />
        </div>
        
        <h1 className="text-3xl font-black uppercase tracking-widest text-slate-900 mb-3 relative z-10">System Interruption</h1>
        
        <p className="text-slate-500 font-medium mb-8 max-w-lg relative z-10">
            The workspace encountered an issue attempting to load your data. 
            <span className="block mt-2 text-red-400 text-sm font-bold bg-red-50 p-3 rounded-xl border border-red-100/50">
                {error.message || "Unknown rendering failure. Please retry."}
            </span>
        </p>

        <div className="flex gap-4 relative z-10">
            <Button 
            onClick={reset}
            className="bg-red-600 hover:bg-red-700 text-white rounded-2xl h-14 px-8 font-black uppercase tracking-widest gap-2 shadow-lg shadow-red-600/20 active:scale-95 transition-all text-sm"
            >
            <RefreshCcw size={18} />
            Reboot Interface
            </Button>
        </div>
        </div>
    </div>
  );
}
