"use client";

import { useEffect, useState, useCallback } from "react";
import { getMyLeads, getSurveyTrackingLeads } from "@/lib/actions/sales";
import { 
    Plus, 
    Search, 
    Filter, 
    Target, 
    User, 
    Phone, 
    MapPin, 
    Map as MapIcon,
    LayoutGrid,
    ListFilter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { format } from "date-fns";
import { SalesLeadActions } from "@/components/dashboard/SalesLeadActions";

export default function MyLeadsPage() {
  const [activeLeads, setActiveLeads] = useState<any[]>([]);
  const [surveyLeads, setSurveyLeads] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    try {
      const [all, survey] = await Promise.all([
        getMyLeads(),
        getSurveyTrackingLeads()
      ]);
      // Filter out those that are in survey from the 'active' list to avoid duplicates
      const filteredActive = all.filter((l: any) => l.status !== 'SITE_VISIT_SCHEDULED' && l.status !== 'CONVERTED');
      setActiveLeads(filteredActive);
      setSurveyLeads(survey);
    } catch (error) {
      console.error("Failed to load leads:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filterLeads = (list: any[]) => {
    return list.filter(l => 
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (l.contactPerson?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (l.siteAddress?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    );
  };

  return (
    <div className="flex flex-col w-full p-8 max-w-7xl mx-auto min-h-screen">
      {/* 🚀 Row 1: Heading */}
      <div className="flex items-center justify-between w-full">
        <div className="space-y-1 text-left">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Lead Pipeline
          </h1>
          <p className="text-slate-500 font-medium text-sm">Track and convert your project opportunities.</p>
        </div>
        <Link href="/dashboard/sales/leads/new">
          <Button className="bg-[#1C3384] hover:bg-[#1C3384]/90 text-white rounded-xl h-12 px-6 font-black uppercase tracking-widest gap-2 shadow-lg shadow-blue-900/10">
            <Plus size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Add New Lead</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        {/* 🛠 Row 2: Sub-header Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between w-full mt-6 gap-4">
            <TabsList className="bg-slate-100/80 p-1 rounded-xl h-11 w-full md:w-auto flex">
                <TabsTrigger value="pipeline" className="rounded-lg px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#1C3384] data-[state=active]:text-white transition-all h-full gap-2 flex-1 md:flex-none">
                    <LayoutGrid size={14} />
                    Active Pipeline
                </TabsTrigger>
                <TabsTrigger value="survey" className="rounded-lg px-6 font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-[#FFC800] data-[state=active]:text-[#1C3384] transition-all h-full gap-2 flex-1 md:flex-none">
                    <MapIcon size={14} />
                    Survey Tracking
                </TabsTrigger>
            </TabsList>

            <div className="relative w-full md:max-w-xs group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#1C3384] transition-colors" size={16} />
                <Input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search leads..." 
                    className="pl-9 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-1 focus-visible:ring-[#1C3384] transition-all w-full text-sm shadow-sm"
                />
            </div>
        </div>

        {/* 📊 Row 3: Data Table */}
        <div className="w-full mt-4">
            <TabsContent value="pipeline" className="mt-0 w-full focus-visible:outline-none">
                <LeadTable 
                    leads={filterLeads(activeLeads)} 
                    emptyMessage="No proactive leads found in your pipeline." 
                    fetchData={fetchData}
                />
            </TabsContent>

            <TabsContent value="survey" className="mt-0 w-full focus-visible:outline-none">
                <LeadTable 
                    leads={filterLeads(surveyLeads)} 
                    emptyMessage="No leads currently pending Engineering survey." 
                    fetchData={fetchData}
                />
            </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

const LeadTable = ({ 
    leads, 
    emptyMessage, 
    fetchData 
}: { 
    leads: any[], 
    emptyMessage: string, 
    fetchData: (silent?: boolean) => void 
}) => (
  <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px] w-full">
      <Table>
        <TableHeader className="bg-slate-50/50">
          <TableRow className="hover:bg-transparent border-slate-100">
            <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 px-6">Lead / Prospect</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Contact Info</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Location</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Est. Value</TableHead>
            <TableHead className="text-[10px] font-black uppercase tracking-widest text-slate-400 h-14">Status</TableHead>
            <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-slate-400 h-14 px-6">Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {leads.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-64 text-center">
                <div className="flex flex-col items-center justify-center space-y-3 opacity-30">
                  <Target size={48} className="text-slate-300" />
                  <p className="font-bold uppercase tracking-widest text-xs">{emptyMessage}</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            leads.map((lead: any) => (
              <TableRow key={lead.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                <TableCell className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-blue-50 text-[#1C3384] flex items-center justify-center font-bold text-lg shadow-sm border border-blue-100/50">
                      {lead.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 leading-tight uppercase tracking-tight">{lead.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">Added {format(new Date(lead.createdAt), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                      <User size={12} className="text-slate-300" />
                      {lead.contactPerson || "No Contact"}
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-medium">
                      <Phone size={12} className="text-slate-300" />
                      {lead.mobile || "N/A"}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-start gap-2 max-w-[200px]">
                    <MapPin size={12} className="text-slate-300 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-slate-600 line-clamp-1">{lead.siteAddress || "Not specified"}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                      <p className="text-xs font-black text-[#1C3384]">₹{lead.estimatedValue?.toLocaleString() || "0"}</p>
                      <p className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">{lead.capacityKw || "0"} KWp</p>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge className={`
                    rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-widest border-none shadow-none
                    ${lead.status === 'NEW' ? 'bg-blue-50 text-blue-600' : 
                      lead.status === 'SITE_VISIT_SCHEDULED' ? 'bg-[#FFC800]/10 text-[#1C3384]' : 
                      lead.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-600' : 
                      lead.status === 'LOST' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}
                  `}>
                    {lead.status === 'SITE_VISIT_SCHEDULED' ? 'PRELIM SURVEY' : lead.status.replace(/_/g, ' ')}
                  </Badge>
                </TableCell>
                <TableCell className="px-6 text-right">
                  <SalesLeadActions 
                      leadId={lead.id} 
                      leadName={lead.name} 
                      status={lead.status} 
                      onActionComplete={() => fetchData(true)}
                  />
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
);
