"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

export function Header() {
  const [mounted, setMounted] = useState(false);
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = (user?.publicMetadata as any)?.role;
  const metadataDept = (user?.publicMetadata as any)?.department?.toUpperCase();
  
  let effectiveRole = metadataDept || "MNM AGENT";
  if (role === "OWNER") {
    effectiveRole = "OWNER";
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-end px-6 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="flex items-center gap-4">
        {/* User Info & Badge */}
        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
          <div className="flex flex-col items-end">
            <span className="text-sm font-black text-[#0F172A] leading-tight tracking-tight uppercase">
              {user?.fullName || user?.username || user?.emailAddresses[0]?.emailAddress?.split('@')[0]}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={cn(
                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1 shadow-sm",
                effectiveRole === "OWNER" 
                   ? "bg-[#1C3384] text-white" 
                   : "bg-slate-100 text-[#0F172A]/60 border border-slate-200"
              )}>
                {effectiveRole === "OWNER" && <ShieldCheck size={9} className="text-[#64748B]" />}
                {effectiveRole}
              </span>
            </div>
          </div>
        </div>

        {/* User Button */}
        {mounted && (
          <UserButton 
            appearance={{
              elements: {
                userButtonAvatarBox: "h-9 w-9 border-2 border-slate-200 hover:border-slate-400 transition-all shadow-md"
              }
            }}
          />
        )}
      </div>
    </header>
  );
}
