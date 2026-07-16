"use client";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { IndianRupee, Clock, CheckCircle2, ChevronRight, Activity, ArrowUpRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { verifyPaymentAction } from "@/lib/actions/accounts";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function AccountsDashboardPage() {
  const { data, refresh, isLoading } = useDashboardNexus();
  const [activeTab, setActiveTab] = useState<'ADVANCE' | 'MATERIAL' | 'FINAL'>('ADVANCE');
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const stats = data?.stats || { totalRevenue: 0, collectedRevenue: 0, pendingAdvances: 0 };
  const queues = data?.queues || { advances: [], materials: [], finals: [] };

  const getQueueData = () => {
    switch (activeTab) {
      case 'ADVANCE': return queues.advances;
      case 'MATERIAL': return queues.materials;
      case 'FINAL': return queues.finals;
      default: return [];
    }
  };

  const handleVerify = async (projectId: string) => {
    try {
      setVerifyingId(projectId);
      
      // We could prompt for an amount here, but for now we'll do a simple verification 
      // without updating the amountCollected, or we can prompt using window.prompt
      const amountStr = window.prompt("Enter amount collected (leave blank or 0 if N/A):");
      const amount = parseFloat(amountStr || "0");
      const note = window.prompt("Enter verification note (optional):") || "";

      await verifyPaymentAction(projectId, activeTab, isNaN(amount) ? 0 : amount, note);
      await refresh();
      toast.success(`${activeTab} payment verified successfully`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setVerifyingId(null);
    }
  };

  if (isLoading) {
    return <div className="p-8 animate-pulse flex space-x-4"><div className="flex-1 space-y-6 py-1"><div className="h-4 bg-slate-200 rounded w-1/4"></div><div className="h-32 bg-slate-200 rounded"></div></div></div>;
  }

  const activeQueue = getQueueData();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Accounts Command Center</h1>
          <p className="text-slate-500 mt-1 font-medium">Financial operations and payment verifications.</p>
        </div>
      </div>

      {/* TOP METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <IndianRupee size={24} />
            </div>
            <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-100 border-none font-bold">Pipeline Value</Badge>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Expected Revenue</p>
          <h3 className="text-4xl font-black text-slate-900">₹{stats.totalRevenue.toLocaleString()}</h3>
        </div>

        <div className="group bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-3xl shadow-lg text-white hover:-translate-y-1 transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-sm">
              <CheckCircle2 size={24} />
            </div>
            <Badge className="bg-white/20 text-white hover:bg-white/30 border-none font-bold">Realized</Badge>
          </div>
          <p className="text-sm font-bold text-emerald-100 uppercase tracking-wider mb-1">Total Collected</p>
          <h3 className="text-4xl font-black text-white">₹{stats.collectedRevenue.toLocaleString()}</h3>
        </div>

        <div className="group bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300">
          <div className="flex items-start justify-between mb-4">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock size={24} />
            </div>
            <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-100 border-none font-bold">Action Needed</Badge>
          </div>
          <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Pending Advances</p>
          <h3 className="text-4xl font-black text-slate-900">{stats.pendingAdvances} <span className="text-lg text-slate-400 font-medium">projects</span></h3>
        </div>
      </div>

      {/* QUEUE TABS */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex items-center border-b border-slate-100 px-2 pt-2 overflow-x-auto scrollbar-none">
          <TabButton 
            active={activeTab === 'ADVANCE'} 
            onClick={() => setActiveTab('ADVANCE')} 
            label="Pending Advances" 
            count={queues.advances.length} 
            color="amber"
          />
          <TabButton 
            active={activeTab === 'MATERIAL'} 
            onClick={() => setActiveTab('MATERIAL')} 
            label="Material Clearances" 
            count={queues.materials.length} 
            color="blue"
          />
          <TabButton 
            active={activeTab === 'FINAL'} 
            onClick={() => setActiveTab('FINAL')} 
            label="Final Settlements" 
            count={queues.finals.length} 
            color="emerald"
          />
        </div>

        {/* QUEUE CONTENT */}
        <div className="p-6">
          {activeQueue.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 size={32} className="text-slate-300" />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">Queue Clear</h3>
              <p className="text-slate-500">There are no projects pending {activeTab.toLowerCase()} verification right now.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeQueue.map((project: any) => (
                <div key={project.id} className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl border border-slate-100 bg-slate-50 hover:bg-white hover:shadow-md hover:border-slate-200 transition-all">
                  <div className="flex items-start gap-4 mb-4 md:mb-0">
                    <div className="h-10 w-10 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                      <Activity size={18} className="text-slate-500" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900">{project.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="outline" className="text-[10px] bg-white">Stage: {project.stage}</Badge>
                        <span className="text-xs font-medium text-slate-500">
                           Updated {formatDistanceToNow(new Date(project.updatedAt), { addSuffix: true })}
                        </span>
                      </div>
                      {project.lead && (
                         <div className="text-xs text-slate-500 mt-2 font-medium">
                           Expected Value: ₹{project.lead.estimatedValue?.toLocaleString() || 'N/A'}
                         </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <Button 
                      onClick={() => handleVerify(project.id)}
                      disabled={verifyingId === project.id}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm"
                    >
                      {verifyingId === project.id ? (
                        "Verifying..."
                      ) : (
                        <>
                           Verify {activeTab}
                           <Check size={16} className="ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, label, count, color }: any) {
  const colorMap: Record<string, string> = {
    amber: "text-amber-600 bg-amber-50 border-amber-200",
    blue: "text-blue-600 bg-blue-50 border-blue-200",
    emerald: "text-emerald-600 bg-emerald-50 border-emerald-200"
  };

  const activeClass = colorMap[color] || "text-slate-900 bg-slate-100 border-slate-200";

  return (
    <button
      onClick={onClick}
      className={`relative px-6 py-4 text-sm font-bold transition-all border-b-2 flex items-center gap-3 ${
        active 
          ? `border-[${color}] ${activeClass.split(' ')[0]}` 
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      {label}
      <Badge className={`${active ? activeClass : 'bg-slate-100 text-slate-600 border-none'} rounded-full px-2`}>
        {count}
      </Badge>
    </button>
  );
}
