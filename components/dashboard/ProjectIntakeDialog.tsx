"use client";

import { useState, useTransition } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Plus, Zap, Briefcase, User, MapPin, ShieldCheck, Building2, ArrowRight } from "lucide-react";
import { createProject } from "@/app/actions/project";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProjectIntakeDialogProps {
  projectName?: string;
  clientName?: string;
  address?: string;
  capacityKw?: string | number;
  quotedValue?: string | number;
  trigger?: React.ReactNode;
}

import { useDashboardNexus } from "./DashboardNexusProvider";

export function ProjectIntakeDialog({
  projectName = "",
  clientName = "",
  address = "",
  capacityKw = "",
  quotedValue = "",
  trigger
}: ProjectIntakeDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { updateLocalData, data } = useDashboardNexus();

  async function handleCreateProject(formData: FormData) {
    const name = formData.get("name") as string;
    const client = formData.get("clientName") as string;
    const dept = formData.get("department") as string;

    // Optimistic Update
    const optimisticProject = {
      id: "temp-" + Date.now(),
      name,
      clientName: client,
      currentDepartment: dept.toUpperCase(),
      stage: "INTAKE",
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    updateLocalData({
      projects: [optimisticProject, ...data.projects]
    });

    startTransition(async () => {
      try {
        await createProject(formData);
        toast.success("Project launched successfully!");
        setOpen(false);
      } catch (error: any) {
        toast.error(error.message || "Failed to create project");
        // Rollback (Optional: In a full implementation we'd filter out the temp ID)
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          trigger ? (
            trigger as React.ReactElement
          ) : (
            <Button className="bg-[#38A169] hover:bg-[#2F855A] text-white rounded-xl font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-green-600/20 active:scale-95 transition-all">
              <Plus size={18} strokeWidth={3} />
              New Project
            </Button>
          )
        }
      />
      <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none rounded-3xl bg-white shadow-2xl">
        <DialogHeader className="bg-[#1C3384] text-white p-8">
          <div className="flex items-center gap-4 mb-2">
            <div className="h-10 w-10 rounded-xl bg-[#FFC800] flex items-center justify-center shadow-lg shadow-yellow-400/20">
              <Zap size={20} className="text-[#1C3384] fill-[#1C3384]" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black uppercase tracking-tight font-[family-name:var(--font-montserrat)]">
                Project Intake
              </DialogTitle>
              <DialogDescription className="text-white/60 font-medium">
                Configure initial metadata to launch project into the pipeline.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="p-8">
          <form action={handleCreateProject} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Project Name */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                  <Briefcase size={14} className="text-[#FFC800]" />
                  Project Name
                </Label>
                <Input 
                  id="name" 
                  name="name" 
                  defaultValue={projectName}
                  placeholder="e.g., Green Valley Commercial 50KW" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus-visible:ring-[#1C3384] focus-visible:bg-white transition-all font-medium"
                  required 
                />
              </div>

              {/* Client Name */}
              <div className="space-y-2">
                <Label htmlFor="clientName" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                  <User size={14} className="text-[#FFC800]" />
                  Client Name
                </Label>
                <Input 
                  id="clientName" 
                  name="clientName" 
                  defaultValue={clientName}
                  placeholder="e.g., John Doe Enterprises" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus-visible:ring-[#1C3384] focus-visible:bg-white transition-all font-medium"
                  required 
                />
              </div>
            </div>

            {/* Site Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                <MapPin size={14} className="text-[#FFC800]" />
                Site Address
              </Label>
              <Input 
                id="address" 
                name="address" 
                defaultValue={address}
                placeholder="e.g., 123 Solar Way" 
                className="h-12 rounded-xl bg-slate-50 border-slate-100 focus-visible:ring-[#1C3384] focus-visible:bg-white transition-all font-medium"
                required 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* DC Capacity */}
              <div className="space-y-2">
                <Label htmlFor="dcCapacity" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                  <Zap size={14} className="text-[#FFC800]" />
                  DC Capacity
                </Label>
                <Input 
                  id="dcCapacity" 
                  name="dcCapacity" 
                  defaultValue={capacityKw ? `${capacityKw} kWp` : ""}
                  placeholder="e.g., 50 kWp" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus-visible:ring-[#1C3384] focus-visible:bg-white transition-all font-medium"
                />
              </div>

              {/* Order Value */}
              <div className="space-y-2">
                <Label htmlFor="orderValue" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                  <ShieldCheck size={14} className="text-[#FFC800]" />
                  Order Value (₹)
                </Label>
                <Input 
                  id="orderValue" 
                  name="orderValue" 
                  defaultValue={quotedValue}
                  placeholder="e.g., 2500000" 
                  className="h-12 rounded-xl bg-slate-50 border-slate-100 focus-visible:ring-[#1C3384] focus-visible:bg-white transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Initial Department */}
              <div className="space-y-2">
                <Label htmlFor="department" className="text-xs font-black uppercase tracking-widest text-[#64748B] flex items-center gap-2">
                  <Building2 size={14} className="text-[#FFC800]" />
                  Initial Department
                </Label>
                <Select name="department" defaultValue="Sales">
                  <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-slate-100 font-medium">
                    <SelectValue placeholder="Select Department" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100">
                    <SelectItem value="Sales">Sales (Lead Management)</SelectItem>
                    <SelectItem value="Engineering">Engineering (Design Phase)</SelectItem>
                    <SelectItem value="Execution">Execution (Site Phase)</SelectItem>
                    <SelectItem value="Accounts">Accounts (Billing/Final)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Liaisoning Stage (Hidden/Defaulted for now or added if needed) */}
              <input type="hidden" name="liasoningStage" value="NOT_STARTED" />
              <input type="hidden" name="executionStage" value="SURVEY" />
            </div>

            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full h-14 bg-[#38A169] hover:bg-[#2F855A] text-white rounded-2xl text-base font-black uppercase tracking-widest shadow-lg shadow-green-600/20 transition-all hover:scale-[1.01] active:scale-[0.99] gap-3 mt-4"
            >
              {isPending ? "Launching Project..." : "Create MNMSOLAR Project"}
              <ArrowRight size={20} />
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
