"use client";

import { useState, useEffect } from "react";
import { getAllLeadsForOrg, getAllQuotesForOrg, getAllSalesEmployees, reassignLead, reassignQuote } from "@/lib/actions/sales";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, ChevronDown, ChevronUp, UserPlus, Phone, TrendingUp, FileText, IndianRupee } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function SalesTeamOverview() {
  const [leads, setLeads] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedUsers, setExpandedUsers] = useState<Set<string>>(new Set());
  const [view, setView] = useState<'LEADS' | 'QUOTES'>('LEADS');

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
      console.error("Failed to load sales overview", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const toggleUser = (userId: string) => {
    const newSet = new Set(expandedUsers);
    if (newSet.has(userId)) newSet.delete(userId);
    else newSet.add(userId);
    setExpandedUsers(newSet);
  };

  const handleReassign = async (id: string, newUserId: string) => {
    const toastId = toast.loading(`Reassigning ${view.toLowerCase()}...`);
    try {
      if (view === 'LEADS') {
        await reassignLead(id, newUserId);
      } else {
        await reassignQuote(id, newUserId);
      }
      const newUser = employees.find(e => e.id === newUserId);
      toast.success(`${view === 'LEADS' ? 'Lead' : 'Quote'} reassigned to ${newUser?.email?.split('@')[0]}`, { id: toastId });
      loadData();
    } catch (err: any) {
      toast.error(err.message || "Failed to reassign", { id: toastId });
    }
  };

  if (isLoading) {
    return <div className="h-48 flex items-center justify-center text-slate-400 font-black uppercase tracking-widest text-xs animate-pulse">Synchronizing Sales Intel...</div>;
  }

  // Group data by employee
  const currentData = view === 'LEADS' ? leads : quotes;
  const groupedData: Record<string, any[]> = {};
  currentData.forEach(item => {
    const userId = item.assignedToId || "UNASSIGNED";
    if (!groupedData[userId]) groupedData[userId] = [];
    groupedData[userId].push(item);
  });

  return (
    <Card className="border-none shadow-2xl bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="p-8 bg-[#1C3384] text-white">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Users className="text-[#FFC800]" size={24} />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tighter">Sales Team Workload</CardTitle>
              <p className="text-blue-200/60 text-xs font-bold uppercase tracking-widest mt-1">Global Pipeline Oversight & Reassignment</p>
            </div>
          </div>
          
          <div className="flex items-center bg-white/10 p-1 rounded-2xl border border-white/10">
            <button 
              onClick={() => setView('LEADS')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === 'LEADS' ? "bg-[#FFC800] text-[#1C3384]" : "text-white/60 hover:text-white"
              )}
            >
              Leads ({leads.length})
            </button>
            <button 
              onClick={() => setView('QUOTES')}
              className={cn(
                "px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === 'QUOTES' ? "bg-[#FFC800] text-[#1C3384]" : "text-white/60 hover:text-white"
              )}
            >
              Quotes ({quotes.length})
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-100">
          {employees.map(emp => {
            const userItems = groupedData[emp.id] || [];
            const isExpanded = expandedUsers.has(emp.id);
            
            return (
              <div key={emp.id} className="transition-all">
                <div 
                  onClick={() => toggleUser(emp.id)}
                  className="p-6 hover:bg-slate-50 cursor-pointer flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-[#1C3384]/10 group-hover:text-[#1C3384] transition-all font-black text-xs">
                      {emp.email[0].toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 uppercase tracking-tight">{emp.email.split('@')[0]}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{emp.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <span className="block text-lg font-black text-[#1C3384] leading-none">{userItems.length}</span>
                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Active {view}</span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-slate-300" /> : <ChevronDown size={20} className="text-slate-300 rotate-[-90deg] transition-transform" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-slate-50/50 p-6 space-y-3 shadow-inner">
                    {userItems.length === 0 ? (
                      <p className="text-center py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 italic">No {view.toLowerCase()} assigned to this employee.</p>
                    ) : (
                      userItems.map(item => (
                        <div key={item.id} className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 group/item">
                          <div className="flex items-center gap-4">
                            <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">
                               {view === 'LEADS' ? <TrendingUp size={16} /> : <FileText size={16} />}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-black text-sm text-slate-900 uppercase tracking-tight">{view === 'LEADS' ? item.name : (item.lead?.name || 'Untitled Quote')}</span>
                                <Badge variant="outline" className="text-[8px] font-black border-slate-200 text-slate-500 uppercase tracking-widest">
                                  {item.status}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                {view === 'LEADS' ? (
                                  <>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                      <Phone size={10} /> {item.mobile || "N/A"}
                                    </span>
                                    <span className="text-[10px] font-bold text-[#1C3384]">
                                      {item.capacityKw ? `${item.capacityKw} kWp` : ""}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-[10px] font-black text-[#38A169] flex items-center gap-1 uppercase tracking-widest">
                                    <IndianRupee size={10} /> {item.quotedValue?.toLocaleString() || "0"}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <Select onValueChange={(val) => handleReassign(item.id, String(val))}>
                              <SelectTrigger className="h-9 w-44 bg-slate-50 border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                <div className="flex items-center gap-2">
                                  <UserPlus size={14} className="text-slate-400" />
                                  <SelectValue placeholder="REASSIGN TO..." />
                                </div>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl border-slate-200 shadow-2xl">
                                {employees.filter(e => e.id !== emp.id).map(e => (
                                  <SelectItem key={e.id} value={e.id} className="text-[10px] font-black uppercase tracking-widest">
                                    {e.email.split('@')[0]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
