"use client";

import { useState } from "react";
import { usePipelineNexus } from "./DashboardNexusProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Target, FileText, TrendingUp, DollarSign, Calendar, ArrowRight, Loader2, ChevronRight, CheckCircle2, Zap, IndianRupee } from "lucide-react";

import { getAllSalesEmployees } from "@/lib/actions/sales";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useEffect } from "react";

export function SalesPipelineView() {
  const { projects, leads, quotes, isLoading: nexusLoading } = usePipelineNexus();
  const [employees, setEmployees] = useState<any[]>([]);
  const [isEmployeesLoading, setIsEmployeesLoading] = useState(true);
  
  const [viewType, setViewType] = useState<'ALL' | 'INDIVIDUAL'>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'leads' | 'quotes' | 'converted'>('leads');

  useEffect(() => {
    async function loadEmployees() {
      try {
        const data = await getAllSalesEmployees();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to load employees", err);
      } finally {
        setIsEmployeesLoading(false);
      }
    }
    loadEmployees();
  }, []);

  // Auto-select first employee when switching to INDIVIDUAL
  useEffect(() => {
    if (viewType === 'INDIVIDUAL' && !selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [viewType, employees, selectedEmployeeId]);

  const isLoading = nexusLoading || isEmployeesLoading;

  // Filter Data
  const filteredLeads = leads.filter(l => {
    const matchesUser = viewType === 'ALL' || l.assignedToId === selectedEmployeeId;
    return matchesUser && l.status !== "CONVERTED" && l.status !== "LOST";
  });
  
  const filteredQuotes = quotes.filter(q => {
    const matchesUser = viewType === 'ALL' || q.assignedToId === selectedEmployeeId;
    return matchesUser && q.status !== "CONVERTED";
  });

  const convertedProjects = projects.filter((p: any) => {
    const matchesUser = viewType === 'ALL' || p.createdByUserId === selectedEmployeeId;
    return matchesUser && (p.stage !== 'INTAKE' || p.currentDepartment !== 'SALES');
  });

  const currentData = activeTab === 'leads' ? filteredLeads : 
                      activeTab === 'quotes' ? filteredQuotes : 
                      convertedProjects;

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden flex flex-col min-h-[600px] border border-slate-100">
      <CardHeader className="pb-6 pt-8 px-8 bg-slate-50/30 border-b border-slate-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-[#1C3384] flex items-center justify-center shadow-lg shadow-blue-900/10">
              <TrendingUp size={20} strokeWidth={3} className="text-[#FFC800]" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase tracking-tighter font-[family-name:var(--font-montserrat)] text-[#0F172A]">
                Sales Pipeline
              </CardTitle>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] italic">Operational Intelligence</p>
                {isLoading && <Loader2 size={10} className="animate-spin text-blue-500" />}
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
             {/* View Toggle */}
             <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setViewType('ALL')}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                    viewType === 'ALL' ? "bg-white text-[#1C3384] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  All Teams
                </button>
                <button
                  onClick={() => setViewType('INDIVIDUAL')}
                  className={cn(
                    "px-4 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                    viewType === 'INDIVIDUAL' ? "bg-white text-[#1C3384] shadow-sm" : "text-slate-400 hover:text-slate-600"
                  )}
                >
                  Individual
                </button>
             </div>

             {/* Individual Selector */}
             {viewType === 'INDIVIDUAL' && (
                <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId || ""}>
                  <SelectTrigger className="h-9 w-44 rounded-xl border-slate-100 bg-white text-[9px] font-black uppercase tracking-widest focus:ring-[#1C3384]">
                    <SelectValue placeholder="Select Employee" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-2xl">
                    {employees.map(emp => (
                      <SelectItem key={emp.id} value={emp.id} className="text-[9px] font-black uppercase tracking-widest">
                        {emp.email.split('@')[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
             )}
          </div>
        </div>

        {/* Segregated Tabs - Compact Style */}
        <div className="flex gap-3 mt-8">
          {[
            { id: 'leads', label: 'Leads', icon: Target, color: 'text-blue-500', count: filteredLeads.length },
            { id: 'quotes', label: 'Quotes', icon: FileText, color: 'text-amber-500', count: filteredQuotes.length },
            { id: 'converted', label: 'Converted', icon: CheckCircle2, color: 'text-emerald-500', count: convertedProjects.length }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex-1 flex flex-col items-center gap-1.5 p-3 rounded-[1.5rem] border-2 transition-all relative",
                activeTab === tab.id 
                  ? "border-[#1C3384] bg-white shadow-md scale-105 z-10" 
                  : "border-transparent bg-slate-100/50 hover:bg-slate-200/50 grayscale opacity-40"
              )}
            >
              <tab.icon size={16} className={cn(activeTab === tab.id ? tab.color : "text-slate-400")} strokeWidth={3} />
              <div className="flex flex-col items-center">
                <span className="text-[8px] font-black uppercase tracking-widest text-[#2D3748]">{tab.label}</span>
                <span className={cn("text-xs font-black", activeTab === tab.id ? "text-[#1C3384]" : "text-slate-400")}>{tab.count}</span>
              </div>
            </button>
          ))}
        </div>
      </CardHeader>
      
      <CardContent className="px-8 py-8 flex-1 bg-white">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {currentData.length === 0 ? (
              <div className="col-span-full py-20 text-center">
                <div className="h-16 w-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-200">
                  <TrendingUp size={32} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">No matching pipeline data found</p>
              </div>
            ) : (
              currentData.map((item: any) => (
                <div key={item.id} className="group p-4 rounded-[1.5rem] border border-slate-50 bg-slate-50/30 hover:bg-white hover:border-slate-200 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full">
                  <div className="flex items-start justify-between mb-3">
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      activeTab === 'leads' ? "bg-blue-50 text-blue-600" :
                      activeTab === 'quotes' ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {activeTab === 'leads' ? <Target size={14} /> : 
                       activeTab === 'quotes' ? <FileText size={14} /> : 
                       <CheckCircle2 size={14} />}
                    </div>
                    <Badge variant="outline" className="text-[7px] font-black uppercase tracking-widest border-slate-100 bg-white">
                      {activeTab === 'converted' ? item.stage : item.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-[11px] font-black text-[#0F172A] uppercase tracking-tight line-clamp-1 group-hover:text-[#1C3384] transition-colors">
                      {activeTab === 'leads' ? item.name : 
                       activeTab === 'quotes' ? (item.lead?.name || item.projectName) : 
                       item.name}
                    </h4>
                    
                    <div className="flex items-center justify-between mt-2">
                       {activeTab === 'quotes' ? (
                         <span className="text-[10px] font-black text-emerald-600 flex items-center">
                           <IndianRupee size={10} className="mr-0.5" /> {item.quotedValue?.toLocaleString()}
                         </span>
                       ) : activeTab === 'leads' ? (
                         <span className="text-[9px] font-black text-blue-600 uppercase">
                           {item.capacityKw} KWp
                         </span>
                       ) : (
                         <span className="text-[9px] font-black text-emerald-600 uppercase italic">
                           {item.currentDepartment}
                         </span>
                       )}
                       <ChevronRight size={14} className="text-slate-200 group-hover:text-[#1C3384] group-hover:translate-x-1 transition-all" />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConvertedItem({ project }: { project: any }) {
  return null; // Integrated into main grid
}





function LeadItem({ lead }: { lead: any }) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 border border-blue-100">
          <Target size={18} />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{lead.name}</h4>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
              {lead.capacityKw} kWp Potential
            </span>
            <span className="h-1 w-1 rounded-full bg-slate-300" />
            <span className="text-[9px] font-bold text-blue-600/60 flex items-center gap-1">
              <Calendar size={8} />
              Updated {new Date(lead.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>
      <Badge className={cn(
        "bg-white border-none shadow-sm text-[9px] font-black uppercase tracking-widest px-2 py-1",
        lead.status === "NEW" ? "text-blue-600" : "text-amber-600"
      )}>
        {lead.status.replace(/_/g, ' ')}
      </Badge>
    </div>
  );
}

function QuoteItem({ quote }: { quote: any }) {
  return (
    <div className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50/50 border border-transparent hover:border-slate-200 hover:bg-white transition-all shadow-sm hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
          <FileText size={18} />
        </div>
        <div>
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-tight">{quote.clientName}</h4>
          <p className="text-[9px] font-bold text-slate-500 mt-0.5">{quote.projectName}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              ₹{Number(quote.quotedValue).toLocaleString()}
            </span>
            <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1 italic">
              <ArrowRight size={8} />
              {quote.status}
            </span>
          </div>
        </div>
      </div>
      <div className="text-right">
        <span className="text-[9px] font-black text-slate-300 uppercase tracking-tighter block">
          ID: {quote.id.split('-')[0]}
        </span>
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any, label: string }) {
  return (
    <div className="py-12 flex flex-col items-center justify-center text-center opacity-30">
      <Icon size={32} className="text-slate-400 mb-2" />
      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</p>
    </div>
  );
}
