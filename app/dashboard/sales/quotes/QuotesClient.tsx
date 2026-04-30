"use client"; // Updated for inline handover flow

import React, { useState, Fragment } from "react";
import { format } from "date-fns";
import { Search, FileText, User, Zap, Clock, ChevronRight, TrendingUp } from "lucide-react";
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
import Link from "next/link";
import { QuoteDetailPanel } from "@/components/sales/QuoteDetailPanel";
import { HandoverDetailPanel } from "@/components/sales/HandoverDetailPanel";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface QuotesClientProps {
  quotes: any[];
}

export function QuotesClient({ quotes }: QuotesClientProps) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [expansion, setExpansion] = useState<{ id: string | null; type: 'details' | 'handover' }>({ id: null, type: 'details' });

  const filteredQuotes = quotes.filter(q => 
    q.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUpdate = () => {
    router.refresh();
  };

  const toggleExpansion = (id: string, type: 'details' | 'handover') => {
    if (expansion.id === id && expansion.type === type) {
      setExpansion({ id: null, type: 'details' });
    } else {
      setExpansion({ id, type });
    }
  };

  const getOperationalFlow = (status: string) => {
    // Sequence: [Quote PDF] -> [Negotiating] -> [Approved] -> [Launched]
    const steps = ["DRAFT", "NEGOTIATING", "APPROVED", "CONVERTED"];
    const labels: Record<string, string> = {
      DRAFT: "Quote PDF",
      NEGOTIATING: "Negotiating",
      APPROVED: "Approved",
      CONVERTED: "Launched"
    };
    
    // Status normalization for badge consistency
    const currentStatus = status === "SENT" ? "NEGOTIATING" : status;
    const currentIndex = steps.indexOf(currentStatus);
    const displayIndex = currentIndex === -1 ? 1 : currentIndex + 1;
    
    // Color mapping for badge consistency
    const getBadgeStyles = (s: string) => {
      if (s === "DRAFT") return "bg-slate-100 text-slate-500";
      if (s === "NEGOTIATING" || s === "SENT") return "bg-[#FFC800]/10 text-[#1C3384]";
      if (s === "CONVERTED" || s === "APPROVED") return "bg-emerald-50 text-emerald-600";
      return "bg-blue-50 text-blue-600";
    };

    return (
      <div className="flex items-center gap-3 justify-end">
        <div className={cn(
          "flex items-center gap-2 px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
          getBadgeStyles(currentStatus)
        )}>
          <div className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
          {labels[currentStatus] || currentStatus}
        </div>
        <span className="text-[10px] font-black text-slate-300 tracking-tighter">
          {displayIndex} / 4
        </span>
      </div>
    );
  };

  const getStatusBadge = (status: string) => {
    if (status === 'DRAFT') {
      return <Badge className="bg-slate-100 text-slate-500 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none">DRAFT</Badge>;
    }
    if (status === 'NEGOTIATING') {
      return <Badge className="bg-[#FFC800]/10 text-[#1C3384] rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none">NEGOTIATING</Badge>;
    }
    if (status === 'CONVERTED') {
      return <Badge className="bg-emerald-50 text-emerald-600 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none">CONVERTED</Badge>;
    }
    return <Badge className="bg-blue-50 text-blue-600 rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none">{status}</Badge>;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto pb-24">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 select-none">
        <Link href="/dashboard/sales" className="hover:text-[#1C3384] transition-colors">Sales</Link>
        <ChevronRight size={10} />
        <span className="text-slate-900 italic">Technical Quotes</span>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Proposal Vault
          </h1>
          <p className="text-slate-500 font-medium text-sm">Manage technical quotes and closing status.</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
          <Input 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project or client..." 
            className="pl-12 h-12 bg-slate-50/50 border-none rounded-2xl focus-visible:ring-2 focus-visible:ring-[#1C3384]/20 transition-all font-medium"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
           <Badge className="bg-[#1C3384] text-white h-12 px-6 rounded-2xl flex items-center justify-center font-black text-xs tracking-widest min-w-[120px] shadow-lg shadow-blue-900/10">
            {filteredQuotes.length} QUOTES
          </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="w-[28%] text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16 px-8">Proposal / Project</TableHead>
              <TableHead className="w-[18%] text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Engagement</TableHead>
              <TableHead className="w-[18%] text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Metrics</TableHead>
              <TableHead className="w-[12%] text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Status</TableHead>
              <TableHead className="text-right text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16 px-8">Operational Flow</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuotes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center space-y-3 opacity-20">
                    <FileText size={48} className="text-slate-300" />
                    <p className="font-bold uppercase tracking-widest text-xs">No quotes found matching your parameters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredQuotes.map((quote: any) => (
                <Fragment key={quote.id}>
                  <TableRow 
                    className={cn(
                      "cursor-pointer transition-colors group h-24 select-none",
                      expansion.id === quote.id ? "bg-slate-50/80 border-transparent" : "hover:bg-slate-50/40 border-slate-50/50"
                    )}
                    onClick={() => toggleExpansion(quote.id, quote.status === 'NEGOTIATING' || quote.status === 'SENT' ? 'handover' : 'details')}

                  >
                    <TableCell className="px-8 py-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={cn(
                          "h-12 w-12 shrink-0 rounded-[1rem] flex items-center justify-center font-bold text-xl shadow-inner transition-all duration-300",
                          expansion.id === quote.id ? "bg-[#1C3384] text-white" : "bg-indigo-50 text-indigo-600 group-hover:bg-[#1C3384] group-hover:text-white"
                        )}>
                          <FileText size={20} />
                        </div>
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-[#1C3384] transition-colors truncate">
                            {quote.projectName}
                          </p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 truncate">
                              <Clock size={10} className="shrink-0" />
                              {format(new Date(quote.createdAt), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 group/user cursor-default min-w-0">
                        <div className="h-8 w-8 shrink-0 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 transition-colors">
                          <User size={14} />
                        </div>
                        <p className="text-xs font-bold text-slate-600 transition-colors truncate">{quote.clientName}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                              <Zap size={12} className="text-amber-500 fill-amber-500 shrink-0" />
                              <span className="text-[10px] font-black text-slate-800">{quote.capacityKw || "—"} kWp</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                              <TrendingUp size={12} className="text-emerald-500 shrink-0" />
                              <span className="text-[11px] font-black text-[#1C3384] whitespace-nowrap">{quote.quotedValue ? `₹${quote.quotedValue.toLocaleString()}` : "₹ --"}</span>
                          </div>
                      </div>
                    </TableCell>
                    <TableCell className="pointer-events-none">
                      {getStatusBadge(quote.status)}
                    </TableCell>
                    <TableCell className="px-8 text-right">
                      <div className="flex items-center justify-end gap-3 min-w-0 overflow-hidden">
                        {getOperationalFlow(quote.status)}
                      </div>
                    </TableCell>
                  </TableRow>
                  {/* Expanded Detail Panel */}
                  {expansion.id === quote.id && (
                    <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b border-slate-100">
                      <TableCell colSpan={5} className="p-0 border-none">
                        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
                          {expansion.type === 'details' ? (
                            <QuoteDetailPanel 
                              quote={quote} 
                              onUpdate={handleUpdate} 
                              onApproveClick={() => setExpansion({ id: quote.id, type: 'handover' })} 
                            />
                          ) : (
                            <HandoverDetailPanel 
                              quote={quote} 
                              onUpdate={handleUpdate} 
                              onBack={() => setExpansion({ id: quote.id, type: 'details' })} 
                            />
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
