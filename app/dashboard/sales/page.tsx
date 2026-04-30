import { Suspense } from "react";
import { getSalesDashboardStats, getRecentSalesActivity } from "@/lib/actions/sales";
import { Zap, Target, FileText, Plus, ArrowUpRight, Clock, TrendingUp, CircleArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ProjectIntakeDialog } from "@/components/dashboard/ProjectIntakeDialog";
import { formatDistanceToNow } from "date-fns";

export default async function SalesDashboardPage() {
  const stats = await getSalesDashboardStats();
  const activity = await getRecentSalesActivity();

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px]">
            Sales Nexus
          </Badge>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)]">
            Command Center
          </h1>
          <p className="text-slate-500 font-medium">Manage your pipeline and drive conversions.</p>
        </div>

        <div className="flex items-center gap-3">
           <ProjectIntakeDialog 
            trigger={
                <Button className="bg-[#38A169] hover:bg-[#2F855A] text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest shadow-xl shadow-green-600/20 active:scale-95 transition-all gap-2">
                    <Zap size={18} fill="currentColor" />
                    Launch Project
                </Button>
            }
           />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
              <Target size={24} />
            </div>
            <TrendingUp size={16} className="text-emerald-500" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">My Leads</p>
          <h3 className="text-4xl font-black text-slate-900">{stats.leads}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Potential opportunities tracked</p>
        </div>

        <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
              <FileText size={24} />
            </div>
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">Active Quotes</p>
          <h3 className="text-4xl font-black text-slate-900">{stats.activeQuotes}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Pending client approvals</p>
        </div>

        <div className="group bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
              <Zap size={24} />
            </div>
            <ArrowUpRight size={16} className="text-[#1C3384]" />
          </div>
          <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px] mb-1">My Projects</p>
          <h3 className="text-4xl font-black text-slate-900">{stats.projects}</h3>
          <p className="text-xs text-slate-400 mt-2 font-medium">Successfully converted to OS</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Actions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900">Nexus Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
             <Link href="/dashboard/sales/leads/new">
                <div className="bg-[#1C3384] p-6 rounded-3xl group hover:scale-[1.02] transition-all cursor-pointer shadow-lg shadow-blue-900/10 h-full">
                    <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center text-white mb-4 group-hover:bg-[#FFC800] group-hover:text-[#1C3384] transition-colors">
                        <Plus size={20} />
                    </div>
                    <h3 className="text-white font-bold mb-1">Acquire New Lead</h3>
                    <p className="text-white/60 text-xs font-medium">Register a new prospect in the system.</p>
                </div>
             </Link>

             <Link href="/dashboard/sales/quotes/new">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 group hover:scale-[1.02] transition-all shadow-sm hover:shadow-md cursor-pointer h-full">
                    <div className="h-10 w-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-600 mb-4 group-hover:bg-amber-100 group-hover:text-amber-600 transition-colors">
                        <FileText size={20} />
                    </div>
                    <h3 className="text-slate-900 font-bold mb-1">Generate Quote</h3>
                    <p className="text-slate-500 text-xs font-medium">Create a technical proposal for a client.</p>
                </div>
             </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-50 flex items-center justify-between">
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Clock size={20} className="text-[#1C3384]" />
              Recent Pulse
            </h2>
            <Badge variant="outline" className="text-[9px] font-bold tracking-widest uppercase">Live Activity</Badge>
          </div>
          <div className="flex-1 p-6 space-y-6">
            {activity.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-30">
                    <Clock size={40} className="mb-4" />
                    <p className="font-bold uppercase tracking-widest text-[10px]">No recent activity found</p>
                </div>
            ) : (
                activity.map((act: any) => (
                    <div key={act.id} className="flex gap-4 group">
                        <div className="relative">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shadow-sm ${
                                act.type === 'LEAD' ? 'bg-blue-50 text-blue-600' : 'bg-amber-50 text-amber-600'
                            }`}>
                                {act.type === 'LEAD' ? <Target size={18} /> : <FileText size={18} />}
                            </div>
                            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-white flex items-center justify-center shadow-sm border border-slate-50">
                                <Plus size={10} className="text-slate-400" />
                            </div>
                        </div>
                        <div className="flex-1 space-y-0.5">
                            <div className="flex items-center justify-between">
                                <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#1C3384] transition-colors">{act.name || act.projectName}</h4>
                                <span className="text-[10px] text-slate-400 font-medium">
                                    {formatDistanceToNow(new Date(act.updatedAt), { addSuffix: true })}
                                </span>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-medium italic">
                                    <Badge variant="secondary" className="bg-slate-50 text-slate-400 border-none px-1.5 py-0 rounded text-[9px] font-bold">
                                        {act.type}
                                    </Badge>
                                    <span>Status: {act.status.replace(/_/g, ' ')}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
          <Link href="/dashboard/sales/leads" className="p-4 bg-slate-50/50 hover:bg-slate-50 text-center text-xs font-bold text-[#1C3384] flex items-center justify-center gap-2 transition-colors border-t border-slate-100">
            View Holistic Pipeline
            <CircleArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}
