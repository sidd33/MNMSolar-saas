"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser, OrganizationSwitcher } from "@clerk/nextjs";
import { 
  LayoutDashboard, 
  Mail, 
  Calendar,
  Briefcase,
  Users,
  ChevronLeft, 
  ChevronRight,
  Sun,
  ShieldCheck,
  Menu,
  X,
  CreditCard,
  Crown
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Project Workspace", icon: Briefcase, href: "/dashboard/workspace", priority: true },
  { label: "Project Timeline", icon: Calendar, href: "/dashboard/timeline" },
  { label: "Overall Queue", icon: Mail, href: "/dashboard/department/OVERALL", adminOnly: true },
  { label: "Sales", icon: Users, href: "/dashboard/department/Sales", dept: "SALES" },
  { label: "Engineering", icon: Calendar, href: "/dashboard/department/Engineering", dept: "ENGINEERING" },
  { label: "Execution", icon: Briefcase, href: "/dashboard/department/Execution", dept: "EXECUTION" },
  { label: "Accounts", icon: CreditCard, href: "/dashboard/department/Accounts", dept: "ACCOUNTS" },
];

interface SidebarProps {
  stats?: Record<string, number>;
}

export function Sidebar({ stats = {} }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  useEffect(() => {
    setMounted(true);
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Header & Org Switcher */}
      <div className="flex flex-col gap-4 p-4 shrink-0">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-extrabold shadow-sm italic">
                M
              </div>
              <span className="text-lg font-black tracking-tighter text-white">
                MNM<span className="text-white">SOLAR</span>
              </span>
            </Link>
          )}
          {collapsed && (
             <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-400 text-blue-900 font-extrabold mx-auto shadow-sm">
                M
             </div>
          )}
          <button 
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 text-white/70 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
          <button 
            onClick={() => setMobileOpen(false)}
            className="lg:hidden flex h-8 w-8 items-center justify-center rounded-md hover:bg-white/10 text-white/70"
          >
            <X size={20} />
          </button>
        </div>

        {!collapsed && mounted && (
          <div className="mt-2 border border-white/10 rounded-lg overflow-hidden bg-white/5">
            <OrganizationSwitcher 
              appearance={{
                elements: {
                  rootBox: "w-full",
                  organizationSwitcherTrigger: "w-full px-3 py-2 text-white hover:bg-white/5 transition-colors",
                  organizationPreviewMainIdentifier: "text-white font-bold",
                  organizationPreviewSecondaryIdentifier: "text-white/60",
                  organizationSwitcherTriggerIcon: "text-white/60"
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto scrollbar-none">
        {NAV_ITEMS.map((item, index) => {
          const role = (user?.publicMetadata as any)?.role;
          const isOwner = role === 'OWNER';

          // Admin-only Link restriction (Overall Queue)
          if ((item as any).adminOnly && !isOwner) {
             return null;
          }

          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard/owner");
          const isOwnerLink = index === 0 && isOwner;
          const Icon = isOwnerLink ? Crown : item.icon;
          const label = isOwnerLink ? "Owner Command Center" : item.label;

          const isPriorityLink = (item as any).priority;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition-all duration-200 group relative",
                isActive 
                  ? (isOwnerLink ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-accent text-accent-foreground shadow-lg shadow-yellow-400/20") 
                  : (isOwnerLink ? "text-red-400/70 hover:bg-red-600/5 hover:text-red-400" : isPriorityLink ? "text-[#FFC800] hover:bg-white/5" : "text-[#4A5568] hover:bg-white/5 hover:text-white")
              )}
            >
              <Icon size={20} className={cn(
                "shrink-0",
                isActive ? (isOwnerLink ? "text-white" : "text-[#1A365D]") : (isOwnerLink ? "text-red-500/50 group-hover:text-red-400" : isPriorityLink ? "text-[#FFC800]" : "text-slate-500 group-hover:text-white")
              )} />
              {!collapsed && <span>{label}</span>}
              {!collapsed && item.dept && stats[item.dept] > 0 && (
                <span className={cn(
                  "ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full",
                  isActive ? "bg-white text-slate-900" : "bg-white/10 text-white group-hover:bg-white/20 group-hover:text-white"
                )}>
                  {stats[item.dept]}
                </span>
              )}
              {(isActive || (isPriorityLink && !collapsed)) && (
                <div className={cn("absolute left-0 w-1.5 h-6 rounded-r-full", isOwnerLink ? "bg-white" : "bg-[#FFC800]")} />
              )}
            </Link>
          );
        })}
      </nav>

    </div>
  );

  return (
    <>
      {/* Mobile Toggle */}
      <button 
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-50 h-14 w-14 bg-yellow-400 text-blue-900 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all"
      >
        <Menu size={24} strokeWidth={3} />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Hardware */}
      <aside 
        className={cn(
          "h-screen shrink-0 transition-all duration-300 ease-in-out border-r border-sidebar-border text-sidebar-foreground shadow-2xl overflow-hidden",
          "bg-gradient-to-b from-[#1C3384] to-[#2A48B1] inner-glow-sidebar",
          collapsed ? "w-20" : "w-64",
          "fixed lg:relative z-50",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
