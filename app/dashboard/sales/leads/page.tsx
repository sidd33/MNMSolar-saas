import { getMyLeads } from "@/lib/actions/sales";
import { Plus, Search, Filter, MoreHorizontal, Target, User, Phone, MapPin, Calendar, ArrowRight, Zap } from "lucide-react";
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
import { format } from "date-fns";

export default async function MyLeadsPage() {
  const leads = await getMyLeads();

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            Lead Pipeline
          </h1>
          <p className="text-slate-500 font-medium text-sm">Track and convert your project opportunities.</p>
        </div>
        <Link href="/dashboard/sales/leads/new">
          <Button className="bg-[#1C3384] hover:bg-[#1C3384]/90 text-white rounded-xl h-11 px-6 font-bold uppercase tracking-widest gap-2 shadow-lg shadow-blue-900/10">
            <Plus size={18} />
            Add New Lead
          </Button>
        </Link>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            placeholder="Search leads by name, contact or location..." 
            className="pl-10 h-11 bg-slate-50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-[#1C3384] transition-all"
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" className="rounded-xl h-11 gap-2 border-slate-200 text-slate-600 font-bold uppercase tracking-widest text-[10px] w-full md:w-auto">
            <Filter size={16} />
            Filters
          </Button>
          <Badge className="bg-[#FFC800] text-[#1C3384] h-11 px-4 rounded-xl flex items-center justify-center font-black text-xs min-w-[80px]">
            {leads.length} LEADS
          </Badge>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden min-h-[400px]">
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
                    <p className="font-bold uppercase tracking-widest text-xs">No leads currently in your pipeline</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              leads.map((lead) => (
                <TableRow key={lead.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm border border-blue-100/50">
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
                        lead.status === 'CONVERTED' ? 'bg-emerald-50 text-emerald-600' : 
                        lead.status === 'LOST' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-600'}
                    `}>
                      {lead.status.replace(/_/g, ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 text-right">
                    <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white hover:shadow-md transition-all group/btn">
                      <ArrowRight size={18} className="text-slate-300 group-hover/btn:text-[#1C3384] transition-colors" />
                    </Button>
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
