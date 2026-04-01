"use client";

import { useState } from "react";
import { format } from "date-fns";
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  User, 
  Zap, 
  ArrowRight, 
  Download,
  Eye,
  CheckCircle2,
  Clock,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  History
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
import Link from "next/link";
import { ProjectIntakeDialog } from "@/components/dashboard/ProjectIntakeDialog";

interface QuotesClientProps {
  quotes: any[];
}

export function QuotesClient({ quotes }: QuotesClientProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredQuotes = quotes.filter(q => 
    q.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
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
        <Link href="/dashboard/sales/quotes/new">
          <Button className="bg-[#1C3384] hover:bg-indigo-900 text-white rounded-2xl h-12 px-6 font-black uppercase tracking-widest gap-2 shadow-xl shadow-blue-900/10 active:scale-95 transition-all">
            <Plus size={18} />
            New Quotation
          </Button>
        </Link>
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
            {filteredQuotes.length} ARCHIVED
          </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden min-h-[500px]">
        <Table>
          <TableHeader className="bg-slate-50/30">
            <TableRow className="hover:bg-transparent border-slate-50">
              <TableHead className="w-[300px] text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16 px-8">Proposal / Project</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Engagement</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Metrics</TableHead>
              <TableHead className="text-[10px] font-black uppercase tracking-widest text-[#64748B] h-16">Status</TableHead>
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
                <TableRow key={quote.id} className="hover:bg-slate-50/40 border-slate-50/50 transition-colors group h-24">
                  <TableCell className="px-8 py-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-[1rem] bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-xl shadow-inner group-hover:bg-[#1C3384] group-hover:text-white transition-all duration-300">
                        <FileText size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="font-black text-slate-900 leading-tight uppercase tracking-tight group-hover:text-[#1C3384] transition-colors">{quote.projectName}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} />
                            {format(new Date(quote.createdAt), 'MMM dd, yyyy')}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 group/user cursor-default">
                      <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover/user:bg-blue-100 group-hover/user:text-blue-600 transition-colors">
                        <User size={14} />
                      </div>
                      <p className="text-xs font-bold text-slate-600 group-hover/user:text-slate-900 transition-colors">{quote.clientName}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                            <Zap size={12} className="text-amber-500 fill-amber-500" />
                            <span className="text-[10px] font-black text-slate-800">{quote.capacityKw} KWp</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <TrendingUp size={12} className="text-emerald-500" />
                            <span className="text-[11px] font-black text-[#1C3384]">₹{quote.quotedValue?.toLocaleString()}</span>
                        </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`
                      rounded-xl px-3 py-1 text-[10px] font-black uppercase tracking-widest border-none
                      ${quote.status === 'DRAFT' ? 'bg-slate-100 text-slate-500' : 
                        quote.status === 'SENT' ? 'bg-blue-50 text-blue-600' : 
                        quote.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 
                        quote.status === 'REJECTED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}
                    `}>
                        <div className="h-1 w-1 rounded-full bg-current mr-2 animate-pulse" />
                        {quote.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-8 text-right">
                    <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      {quote.fileUrl && (
                        <a href={quote.fileUrl} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" size="sm" className="h-9 w-9 p-0 rounded-xl border-slate-200 hover:bg-[#1C3384] hover:text-white transition-all">
                            <Eye size={14} />
                          </Button>
                        </a>
                      )}
                      
                      {quote.status === 'APPROVED' ? (
                        <ProjectIntakeDialog 
                          projectName={quote.projectName}
                          clientName={quote.clientName}
                          capacityKw={quote.capacityKw}
                          quotedValue={quote.quotedValue}
                          trigger={
                            <Button size="sm" className="bg-[#38A169] hover:bg-[#2F855A] text-white rounded-xl h-9 px-4 font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all">
                              <Zap size={14} fill="currentColor" />
                              Launch OS
                            </Button>
                          }
                        />
                      ) : (
                        <Button variant="ghost" size="sm" className="h-9 px-4 rounded-xl text-slate-400 hover:text-[#1C3384] font-black uppercase tracking-widest text-[10px] gap-2">
                           <History size={14} />
                           Update
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
