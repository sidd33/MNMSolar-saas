"use client";

import { useState, useEffect, Suspense } from "react";
import { createQuote, getMyLeads } from "@/lib/actions/sales";
import { FileText, User, Zap, ArrowLeft, ChevronRight, ShieldCheck, CheckCircle2, TrendingUp, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function NewQuotePageContent() {
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState<any[]>([]);
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillLeadId = searchParams.get("leadId");

  useEffect(() => {
    async function fetchLeads() {
      const data = await getMyLeads();
      setLeads(data);
    }
    fetchLeads();
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const data = {
        leadId: formData.get("leadId") || null,
        projectName: formData.get("projectName") as string,
        clientName: formData.get("clientName") as string,
        capacityKw: parseFloat(formData.get("capacityKw") as string) || null,
        quotedValue: parseFloat(formData.get("quotedValue") as string) || null,
        fileUrl: formData.get("fileUrl") as string,
        notes: formData.get("notes") as string,
      };

      await createQuote(data);
      toast.success("Proposal archived and encrypted.");
      router.push("/dashboard/sales/quotes");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create quote");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
        <Link href="/dashboard/sales" className="hover:text-[#1C3384] transition-colors">Sales</Link>
        <ChevronRight size={10} />
        <Link href="/dashboard/sales/quotes" className="hover:text-[#1C3384] transition-colors">Vault</Link>
        <ChevronRight size={10} />
        <span className="text-slate-900">Engineering Proposal</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase italic">
            New Proposal
          </h1>
          <p className="text-slate-500 font-medium">Create a technical-commercial benchmark for closing.</p>
        </div>
        <Link href="/dashboard/sales/quotes">
          <Button variant="ghost" className="rounded-2xl h-12 uppercase tracking-widest font-black text-xs gap-2 hover:bg-slate-50">
            <ArrowLeft size={16} />
            Back to Vault
          </Button>
        </Link>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Context */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <FileText size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1C3384]">Project Context</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="leadId" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Source Lead (Optional)</Label>
              <Select name="leadId" defaultValue={prefillLeadId || undefined}>
                <SelectTrigger className="h-14 rounded-2xl bg-white border-slate-100 font-bold focus:ring-[#1C3384]">
                  <SelectValue placeholder="Select existing lead..." />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-slate-100 shadow-xl p-2">
                  {leads.map((l) => (
                    <SelectItem key={l.id} value={l.id} className="rounded-xl h-10 font-bold text-slate-700">
                      {l.name}
                    </SelectItem>
                  ))}
                  {leads.length === 0 && <p className="p-4 text-xs font-medium text-slate-400">No leads found in nexus.</p>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Project Identifier</Label>
              <Input 
                id="projectName" 
                name="projectName" 
                placeholder="e.g., 100KW Rooftop Solar Proposal" 
                className="h-14 rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm transition-all font-bold"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientName" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Client / Stakeholder</Label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <Input 
                  id="clientName" 
                  name="clientName" 
                  placeholder="e.g., Reliance Industries" 
                  className="h-14 pl-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm transition-all font-bold"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section 2: Metrics */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                    <TrendingUp size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-amber-700">Benchmark Metrics</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="capacityKw" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Quoted Capacity (KW)</Label>
                <div className="relative">
                    <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input id="capacityKw" name="capacityKw" type="number" step="0.1" placeholder="e.g., 50.5" className="h-14 pl-11 rounded-2xl bg-white border-slate-100 font-bold" />
                </div>
               </div>
               <div className="space-y-2">
                <Label htmlFor="quotedValue" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Quoted Value (₹)</Label>
                <div className="relative">
                    <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input id="quotedValue" name="quotedValue" type="number" placeholder="e.g., 3400000" className="h-14 pl-11 rounded-2xl bg-white border-slate-100 font-bold" />
                </div>
               </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fileUrl" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Proposal PDF Link (e.g. Google Drive/Dropbox)</Label>
              <div className="relative">
                <Link2 size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />

                <Input 
                  id="fileUrl" 
                  name="fileUrl" 
                  placeholder="https://..." 
                  className="h-14 pl-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm transition-all font-bold"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Strategic Constraints / Proposal Details</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Include payment terms or technical deviations..." 
                className="min-h-[100px] rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm p-4 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-50">
            <div className="flex items-center gap-3 opacity-60">
                <CheckCircle2 size={24} className="text-[#1C3384]" />
                <p className="text-[10px] text-slate-500 font-bold tracking-widest uppercase">Proposal will be locked and archived.</p>
            </div>
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto h-16 px-12 bg-[#1C3384] hover:bg-[#1C3384]/90 text-white rounded-3xl text-lg font-black uppercase tracking-widest shadow-2xl shadow-blue-900/20 active:scale-95 transition-all gap-3"
            >
                {loading ? "Encrypting..." : "Launch Proposal"}
                <Zap size={20} fill="currentColor" />
            </Button>
        </div>
      </form>
    </div>
  );
}

export default function NewQuotePage() {
  return (
    <Suspense fallback={
       <div className="p-8 max-w-4xl mx-auto flex items-center justify-center h-64">
           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1C3384]"></div>
       </div>
    }>
      <NewQuotePageContent />
    </Suspense>
  );
}
