"use client";

import { useState } from "react";
import { usePipelineNexus } from "./DashboardNexusProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Target, FileText, TrendingUp, DollarSign, Calendar, ArrowRight } from "lucide-react";

export function SalesPipelineView() {
  const { leads, quotes, isLoading } = usePipelineNexus();
  const [view, setView] = useState<"leads" | "quotes">("leads");

  // Strict Separation: Leads drop off once they hit the Quote phase
  const activeLeads = leads.filter(l => 
    l.status !== "CONVERTED" && 
    l.status !== "LOST" && 
    l.status !== "QUOTE_SENT" && 
    l.status !== "NEGOTIATING"
  );
  const activeQuotes = quotes.filter(q => q.status !== "CONVERTED");

  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
      <CardHeader className="pb-4 pt-8 px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-50 text-amber-600 p-2.5 rounded-2xl">
              <TrendingUp size={18} strokeWidth={3} />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-[#2D3748] uppercase tracking-tighter font-[family-name:var(--font-montserrat)]">
                Sales Funnel Oversight
              </CardTitle>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#64748B] italic">
                Pre-Execution Pipeline
              </p>
            </div>
          </div>

          {/* Toggle Switch */}
          <div className="flex p-1 bg-slate-100 rounded-2xl w-fit self-start">
            <button
              onClick={() => setView("leads")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === "leads" 
                  ? "bg-white text-[#1C3384] shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <Target size={14} />
              Leads ({activeLeads.length})
            </button>
            <button
              onClick={() => setView("quotes")}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                view === "quotes" 
                  ? "bg-white text-[#1C3384] shadow-sm" 
                  : "text-slate-400 hover:text-slate-600"
              )}
            >
              <FileText size={14} />
              Quotes ({activeQuotes.length})
            </button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="px-8 pb-8">
        {isLoading ? (
          <div className="space-y-4">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {view === "leads" ? (
              activeLeads.length === 0 ? (
                <EmptyState icon={Target} label="No Active Leads" />
              ) : (
                activeLeads.map((lead) => (
                  <LeadItem key={lead.id} lead={lead} />
                ))
              )
            ) : (
              activeQuotes.length === 0 ? (
                <EmptyState icon={FileText} label="No Active Quotes" />
              ) : (
                activeQuotes.map((quote) => (
                  <QuoteItem key={quote.id} quote={quote} />
                ))
              )
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
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
