"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Layers, FileSignature, Truck, HardHat, FileCheck, Anchor, BatteryCharging, Zap } from "lucide-react";
import { getExecutionFileCounters } from "@/lib/actions/execution";

interface ExecutionSidebarProps {
  projectId: string;
  activeSection: string;
  setActiveSection: (section: string) => void;
}

const SECTIONS = [
  {
    title: "Pre-Execution",
    id: "pre-execution",
    icon: Layers,
    items: [
      { id: "liaisoning-sync", label: "Liaisoning Sync", icon: FileSignature, track: "LIAISONING" },
      { id: "net-metering", label: "Net Metering", icon: Zap, track: "NET_METERING" },
    ]
  },
  {
    title: "Logistics",
    id: "logistics",
    icon: Truck,
    items: [
      { id: "material-inward", label: "Material Challans", icon: FileCheck, track: "CHALLAN" },
      { id: "bom-release", label: "BOM/BOS Verification", icon: Anchor, track: "BOM" },
    ]
  },
  {
    title: "Site Work",
    id: "site-work",
    icon: HardHat,
    items: [
      { id: "structure", label: "Structure & Panels", icon: Layers, track: "STRUCTURE" },
      { id: "terminations", label: "DC/AC Terminations", icon: BatteryCharging, track: "TERMINATION" },
    ]
  },
  {
    title: "Closure",
    id: "closure",
    icon: CheckCircle2,
    items: [
      { id: "punch-points", label: "Punch Points", icon: Circle, track: "PUNCH" },
      { id: "handover", label: "Warranty & Handover", icon: FileCheck, track: "HANDOVER" },
    ]
  }
];

export function ExecutionSidebar({ projectId, activeSection, setActiveSection }: ExecutionSidebarProps) {
  const [counters, setCounters] = useState<Record<string, { count: number, max?: number }>>({});

  useEffect(() => {
    if (!projectId) return;

    // Load lightweight counters
    getExecutionFileCounters(projectId).then(files => {
      // Calculate Liaisoning (Max 9 items: 4 primary + 5 annexures)
      const liaisoningFiles = files.filter(f => f.category === "LIAISONING").length;
      
      // Calculate EXECUTION specific files like Challans
      const challanFiles = files.filter(f => f.category === "EXECUTION" && f.name.toLowerCase().includes("challan")).length;
      const punchFiles = files.filter(f => f.category === "EXECUTION" && f.name.toLowerCase().includes("punch")).length;
      
      setCounters({
        "liaisoning-sync": { count: liaisoningFiles, max: 9 },
        "material-inward": { count: challanFiles },
        "punch-points": { count: punchFiles }
      });
    });
  }, [projectId]);

  return (
    <div className="w-72 border-r border-[#1C3384]/10 bg-slate-50/50 flex flex-col h-full overflow-y-auto font-[family-name:var(--font-montserrat)] text-[#0F172A]">
      <div className="p-6 border-b border-[#1C3384]/10">
        <h3 className="text-xl font-black uppercase tracking-tight text-[#1C3384]">Execution Hub</h3>
        <p className="text-xs font-semibold text-slate-500 mt-1 uppercase tracking-widest">Site Operations Track</p>
      </div>

      <div className="flex-1 py-4 px-3 space-y-6">
        {SECTIONS.map((section) => (
          <div key={section.id} className="space-y-1">
            <h4 className="text-[10px] font-black uppercase tracking-widest text-[#1C3384]/60 px-3 flex items-center gap-2 mb-2">
              <section.icon size={12} className="opacity-70" />
              {section.title}
            </h4>

            <div className="space-y-1">
              {section.items.map(item => {
                const isActive = activeSection === item.id;
                const counter = counters[item.id];

                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all",
                      isActive 
                        ? "bg-[#1C3384] text-white shadow-md shadow-[#1C3384]/20 scale-100" 
                        : "text-slate-600 hover:bg-[#1C3384]/5 hover:text-[#1C3384] scale-[0.98]"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <item.icon size={14} className={cn("opacity-70", isActive && "opacity-100")} />
                      {item.label}
                    </div>

                    {counter && (
                      <div className={cn(
                        "text-[9px] px-2 py-0.5 rounded-full font-black tracking-widest uppercase border",
                        isActive ? "bg-white/20 text-white border-transparent" : "bg-[#1C3384]/5 text-[#1C3384] border-[#1C3384]/10",
                        counter.max && counter.count >= counter.max && "bg-[#10B981]/20 text-[#10B981] border-[#10B981]/30"
                      )}>
                        {counter.max ? `${Math.min(counter.count, counter.max)}/${counter.max}` : `${counter.count} files`}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
