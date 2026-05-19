import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { OwnerDashboardContent } from "@/components/dashboard/OwnerDashboardContent";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function OwnerDashboard() {
  return (
    <DashboardShell 
      title="SaaS Command Center" 
      subtitle="Operational intelligence and pipeline oversight for MNMSOLAR."
      headerActions={
        <Link 
          href="/dashboard/workspace" 
          className="bg-[#38A169] hover:bg-[#2F855A] text-white rounded-xl h-11 px-6 font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all text-sm"
        >
          <Plus size={18} strokeWidth={3} />
          New Project
        </Link>
      }
    >
      <OwnerDashboardContent />
    </DashboardShell>
  );
}
