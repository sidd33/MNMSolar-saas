"use client";

import { useState } from "react";
import { createLead } from "@/lib/actions/sales";
import { 
  Plus, 
  Target, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Zap, 
  Briefcase, 
  ArrowLeft,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NewLeadPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const data = {
        name: formData.get("name") as string,
        contactPerson: formData.get("contactPerson") as string,
        mobile: formData.get("mobile") as string,
        email: formData.get("email") as string,
        siteAddress: formData.get("siteAddress") as string,
        capacityKw: parseFloat(formData.get("capacityKw") as string) || null,
        estimatedValue: parseFloat(formData.get("estimatedValue") as string) || null,
        notes: formData.get("notes") as string,
      };

      await createLead(data);
      toast.success("Lead registered successfully!");
      router.push("/dashboard/sales/leads");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Failed to create lead");
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
        <Link href="/dashboard/sales/leads" className="hover:text-[#1C3384] transition-colors">Leads</Link>
        <ChevronRight size={10} />
        <span className="text-slate-900">Acquisition</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase italic">
            New Acquisition
          </h1>
          <p className="text-slate-500 font-medium">Inject a new prospect into the sales nexus.</p>
        </div>
        <Link href="/dashboard/sales/leads">
          <Button variant="ghost" className="rounded-2xl h-12 uppercase tracking-widest font-black text-xs gap-2 hover:bg-slate-50">
            <ArrowLeft size={16} />
            Back to Pipeline
          </Button>
        </Link>
      </div>

      <form action={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Identity */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                    <Target size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#1C3384]">Identity Matrix</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Lead Name / Organization</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder="e.g., Solar Farms India" 
                className="h-14 rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm transition-all font-bold placeholder:font-medium"
                required 
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="contactPerson" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Primary Contact Person</Label>
              <div className="relative">
                <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <Input 
                  id="contactPerson" 
                  name="contactPerson" 
                  placeholder="e.g., Vikram Sharma" 
                  className="h-14 pl-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm transition-all font-bold placeholder:font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="mobile" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Mobile</Label>
                <div className="relative">
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input id="mobile" name="mobile" placeholder="+91..." className="h-14 pl-11 rounded-2xl bg-white border-slate-100 font-bold" />
                </div>
               </div>
               <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Email</Label>
                <div className="relative">
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input id="email" name="email" type="email" placeholder="vikram@..." className="h-14 pl-11 rounded-2xl bg-white border-slate-100 font-bold" />
                </div>
               </div>
            </div>
          </div>

          {/* Section 2: Technicals */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-lg bg-[#FFC800]/10 flex items-center justify-center text-[#92400E]">
                    <Sparkles size={16} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-widest text-[#92400E]">Technical Overview</h3>
            </div>

            <div className="space-y-2">
              <Label htmlFor="siteAddress" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Deployment Location</Label>
              <div className="relative">
                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <Input 
                  id="siteAddress" 
                  name="siteAddress" 
                  placeholder="Street, City, State..." 
                  className="h-14 pl-12 rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm transition-all font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                <Label htmlFor="capacityKw" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Target Capacity (KW)</Label>
                <div className="relative">
                    <Zap size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input id="capacityKw" name="capacityKw" type="number" step="0.1" placeholder="e.g., 50" className="h-14 pl-11 rounded-2xl bg-white border-slate-100 font-bold" />
                </div>
               </div>
               <div className="space-y-2">
                <Label htmlFor="estimatedValue" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Est. Value (₹)</Label>
                <div className="relative">
                    <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                    <Input id="estimatedValue" name="estimatedValue" type="number" placeholder="e.g., 2500000" className="h-14 pl-11 rounded-2xl bg-white border-slate-100 font-bold" />
                </div>
               </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Strategic Intelligence / Notes</Label>
              <Textarea 
                id="notes" 
                name="notes" 
                placeholder="Crucial info about the client..." 
                className="min-h-[140px] rounded-2xl bg-white border-slate-100 focus-visible:ring-[#1C3384] shadow-sm p-4 font-medium"
              />
            </div>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">
                    <CheckCircle2 size={24} />
                </div>
                <div className="space-y-0.5">
                    <p className="text-xs font-black text-slate-700 uppercase tracking-tight">Security Check</p>
                    <p className="text-[10px] text-slate-400 font-medium tracking-wide">Data will be isolated to your Sales profile.</p>
                </div>
            </div>
            <Button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto h-16 px-12 bg-[#1C3384] hover:bg-[#1C3384]/90 text-white rounded-[2rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-blue-900/20 active:scale-95 transition-all gap-3"
            >
                {loading ? "Registering..." : "Inject into Pipeline"}
                <Zap size={20} fill="currentColor" />
            </Button>
        </div>
      </form>
    </div>
  );
}
