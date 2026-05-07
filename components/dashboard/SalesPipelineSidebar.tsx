"use client";

import { useState, useEffect } from "react";
import { getAllLeadsForOrg, getAllQuotesForOrg, getAllSalesEmployees } from "@/lib/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, TrendingUp, FileText, CheckCircle2, User, ChevronRight, Loader2, IndianRupee, Maximize2 } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePipelineNexus } from "./DashboardNexusProvider";

export function SalesPipelineSidebar() {
  const { projects } = usePipelineNexus();
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const [viewType, setViewType] = useState<'ALL' | 'INDIVIDUAL'>('ALL');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'LEADS' | 'QUOTES' | 'CONVERTED'>('LEADS');

  const loadData = async () => {
    try {
      const [leadsData, quotesData, employeesData] = await Promise.all([
        getAllLeadsForOrg(),
        getAllQuotesForOrg(),
        getAllSalesEmployees()
      ]);
      setLeads(leadsData);
      setQuotes(quotesData);
      setEmployees(employeesData);
    } catch (err) {
      console.error("Failed to load sales pipeline sidebar", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Auto-select first employee when switching to INDIVIDUAL
  useEffect(() => {
    if (viewType === 'INDIVIDUAL' && !selectedEmployeeId && employees.length > 0) {
      setSelectedEmployeeId(employees[0].id);
    }
  }, [viewType, employees, selectedEmployeeId]);

  const filteredLeads = leads.filter(l => 
    viewType === 'ALL' || l.assignedToId === selectedEmployeeId
  );
  
  const filteredQuotes = quotes.filter(q => 
    viewType === 'ALL' || q.assignedToId === selectedEmployeeId
  );

  const convertedProjects = projects.filter((p: any) => {
    const matchesUser = viewType === 'ALL' || p.createdByUserId === selectedEmployeeId;
    // Converted means it's a project that originated from Sales
    return matchesUser && (p.stage !== 'INTAKE' || p.currentDepartment !== 'SALES');
  });

  const displayData = activeTab === 'LEADS' ? filteredLeads : 
                      activeTab === 'QUOTES' ? filteredQuotes : 
                      convertedProjects;

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden flex flex-col h-full max-h-[600px]">
      <CardHeader className="pb-4 pt-8 px-6 bg-slate-50/50">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-50 text-indigo-600 p-2.5 rounded-2xl">
                <TrendingUp size={18} strokeWidth={3} />
              </div>
              <CardTitle className="text-sm font-black text-[#2D3748] uppercase tracking-tighter font-[family-name:var(--font-montserrat)]">Sales Pipeline</CardTitle>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 size={12} className="animate-spin text-blue-500" />}
              <Link 
                href="/dashboard/department/Sales" 
                className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-[#1C3384] transition-all shadow-sm hover:shadow-md"
                title="Full Screen View"
              >
                <Maximize2 size={14} strokeWidth={3} />
              </Link>
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setViewType('ALL')}
              className={cn(
                "flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                viewType === 'ALL' ? "bg-white text-[#1C3384] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              All Teams
            </button>
            <button
              onClick={() => setViewType('INDIVIDUAL')}
              className={cn(
                "flex-1 py-1.5 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all",
                viewType === 'INDIVIDUAL' ? "bg-white text-[#1C3384] shadow-sm" : "text-slate-400 hover:text-slate-600"
              )}
            >
              Individual
            </button>
          </div>

          {/* Individual Selector */}
          {viewType === 'INDIVIDUAL' && (
            <Select onValueChange={setSelectedEmployeeId} value={selectedEmployeeId || ""}>
              <SelectTrigger className="h-9 rounded-xl border-slate-100 bg-white text-[10px] font-bold uppercase tracking-widest">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100">
                {employees.map(emp => (
                  <SelectItem key={emp.id} value={emp.id} className="text-[10px] font-bold uppercase tracking-widest">
                    {emp.email.split('@')[0]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Segregated Tabs */}
          <div className="flex gap-2">
            {[
              { id: 'LEADS', label: 'Leads', icon: Users, color: 'text-blue-500' },
              { id: 'QUOTES', label: 'Quotes', icon: FileText, color: 'text-amber-500' },
              { id: 'CONVERTED', label: 'Converted', icon: CheckCircle2, color: 'text-emerald-500' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex-1 flex flex-col items-center gap-1 p-2 rounded-2xl border-2 transition-all",
                  activeTab === tab.id 
                    ? "border-[#1C3384] bg-white shadow-md scale-105" 
                    : "border-transparent bg-slate-50/50 hover:bg-slate-100 grayscale opacity-60"
                )}
              >
                <tab.icon size={14} className={cn(activeTab === tab.id ? tab.color : "text-slate-400")} strokeWidth={3} />
                <span className="text-[8px] font-black uppercase tracking-widest text-[#2D3748]">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-4 pb-6 overflow-y-auto scrollbar-none flex-1 mt-4">
        <div className="space-y-3">
          {isLoading ? (
             Array(4).fill(0).map((_, i) => (
               <div key={i} className="h-16 w-full bg-slate-50 animate-pulse rounded-2xl" />
             ))
          ) : displayData.length === 0 ? (
            <div className="py-10 text-center opacity-20">
               <TrendingUp size={24} className="mx-auto mb-2" />
               <p className="text-[9px] font-black uppercase tracking-widest">No data available</p>
            </div>
          ) : (
            displayData.map((item: any) => (
              <div key={item.id} className="group p-3 rounded-2xl border border-slate-50 bg-white hover:border-slate-200 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110",
                      activeTab === 'LEADS' ? "bg-blue-50 text-blue-600" :
                      activeTab === 'QUOTES' ? "bg-amber-50 text-amber-600" :
                      "bg-emerald-50 text-emerald-600"
                    )}>
                      {activeTab === 'LEADS' ? <User size={14} /> : 
                       activeTab === 'QUOTES' ? <FileText size={14} /> : 
                       <CheckCircle2 size={14} />}
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-black text-[#0F172A] uppercase tracking-tight line-clamp-1">
                        {activeTab === 'LEADS' ? item.name : 
                         activeTab === 'QUOTES' ? (item.lead?.name || item.projectName) : 
                         item.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[7px] py-0 px-1 border-slate-100 text-slate-400 font-bold uppercase tracking-widest">
                          {activeTab === 'CONVERTED' ? item.stage : item.status}
                        </Badge>
                        {activeTab === 'QUOTES' && (
                          <span className="text-[8px] font-black text-emerald-600 flex items-center">
                            <IndianRupee size={8} /> {item.quotedValue?.toLocaleString()}
                          </span>
                        )}
                        {activeTab === 'LEADS' && item.capacityKw && (
                          <span className="text-[8px] font-black text-blue-600 uppercase">
                            {item.capacityKw} KWp
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight size={14} className="text-slate-200 group-hover:text-[#1C3384] transition-colors" />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
