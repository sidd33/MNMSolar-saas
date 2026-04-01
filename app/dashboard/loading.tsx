import { Loader2 } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 opacity-50">
      <div className="h-16 w-16 bg-[#1C3384]/10 rounded-3xl flex items-center justify-center animate-pulse shadow-inner">
        <Loader2 className="animate-spin text-[#1C3384]" size={28} />
      </div>
      <p className="text-[#1C3384] font-black uppercase tracking-widest text-[10px] animate-pulse">
        Synchronizing Data Nexus...
      </p>
    </div>
  );
}
