"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { UserButton, useUser, OrganizationSwitcher } from "@clerk/nextjs";
import { LayoutDashboard, Mail, Calendar, Briefcase, Users, ChevronLeft, ChevronRight, ShieldCheck, Menu, X, CreditCard, Crown, MapPin, Hammer, Package, Flag, ShieldAlert, FileText, Truck, ShoppingCart, RefreshCcw, Camera, PackageSearch, FolderOpen, ClipboardList, CheckSquare, CalendarDays } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

const NAV_ITEMS = [
  // --- OWNER / SHARED ITEMS ---
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", ownerOnly: true },
  { label: "Project Workspace", icon: Briefcase, href: "/dashboard/workspace", priority: true, ownerOnly: true },
  { label: "Project Timeline", icon: Calendar, href: "/dashboard/timeline", ownerOnly: true },
  { label: "Overall Queue", icon: Mail, href: "/dashboard/department/OVERALL", adminOnly: true, ownerOnly: true },
  { label: "Sales Pipeline", icon: Users, href: "/dashboard/department/Sales", dept: "SALES", ownerOnly: true },
  { label: "Engineering", icon: Calendar, href: "/dashboard/department/Engineering", dept: "ENGINEERING", ownerOnly: true },
  { label: "Execution", icon: Briefcase, href: "/dashboard/department/Execution", dept: "EXECUTION", ownerOnly: true },
  { label: "Procurement", icon: Package, href: "/dashboard/department/Procurement", dept: "PROCUREMENT", ownerOnly: true },
  { label: "Accounts", icon: CreditCard, href: "/dashboard/department/Accounts", dept: "ACCOUNTS", ownerOnly: true },

  // --- SALES DEPARTMENT EXCLUSIVE ---
  { label: "My Dashboard", icon: LayoutDashboard, href: "/dashboard/sales", salesOnly: true },
  { label: "My Leads", icon: Users, href: "/dashboard/sales/leads", salesOnly: true },
  { label: "My Quotes", icon: Mail, href: "/dashboard/sales/quotes", salesOnly: true },
  { label: "My Projects", icon: Briefcase, href: "/dashboard/sales/projects", salesOnly: true },
  
  // --- ENGINEERING DEPARTMENT EXCLUSIVE ---
  { label: "Technical Hub", icon: LayoutDashboard, href: "/dashboard/engineering", engOnly: true },
  { label: "Project Pool", icon: Package, href: "/dashboard/engineering/pool", engOnly: true },
  { label: "Survey Queue", icon: MapPin, href: "/dashboard/engineering/survey", engOnly: true },
  { label: "Detailed Engg", icon: Briefcase, href: "/dashboard/engineering/detailed", engOnly: true },
  { label: "Work Order Desk", icon: ShieldCheck, href: "/dashboard/engineering/work-order", engOnly: true },

  // --- EXECUTION DEPARTMENT EXCLUSIVE ---
  { label: "Execution Hub", icon: LayoutDashboard, href: "/dashboard/execution", execOnly: true },
  { label: "Labor Calendar", icon: CalendarDays, href: "/dashboard/execution/calendar", execOnly: true },


  // --- ACCOUNTS DEPARTMENT EXCLUSIVE ---
  { label: "Accounts Command", icon: LayoutDashboard, href: "/dashboard/accounts", acctOnly: true, countKey: "ACCOUNTS_PENDING" },

  // --- PROCUREMENT DEPARTMENT EXCLUSIVE ---
  { label: "Procurement Hub", icon: LayoutDashboard, href: "/dashboard/procurement", procOnly: true },
  { label: "Inventory & Returns", icon: PackageSearch, href: "/dashboard/procurement/inventory", procOnly: true },
  { label: "BOM Review", icon: FileText, href: "/dashboard/procurement/bom", procOnly: true },
  { label: "Purchase Orders", icon: ShoppingCart, href: "/dashboard/procurement/purchase-orders", procOnly: true },
  { label: "Dispatch & Logistics", icon: Truck, href: "/dashboard/procurement/dispatch", procOnly: true },
];

import { useGlobalUI } from "@/components/dashboard/GlobalUIProvider";

import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";

interface SidebarProps {}

export function Sidebar({}: SidebarProps) {
  const { stats } = useGlobalUI();
  const { data: nexusData } = useDashboardNexus();
  const projects = nexusData?.projects || [];
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearch = searchParams.get("search") || "";
  const { user, isLoaded } = useUser();
  const role = ((user?.publicMetadata as any)?.role as string)?.toUpperCase();
  const department = ((user?.publicMetadata as any)?.department as string)?.toUpperCase();
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';

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
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 shadow-sm overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
              </div>
              <span className="text-lg font-black tracking-tighter text-white">
                MNM<span className="text-white">SOLAR</span>
              </span>
            </Link>
          )}
          {collapsed && (
             <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white p-2 mx-auto shadow-sm overflow-hidden">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
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

        {!collapsed && mounted && (isOwner) && (
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
        {!isLoaded ? (
            <div className="flex flex-col gap-2 p-4 opacity-50">
                <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
                <div className="h-10 w-full bg-white/5 rounded-xl animate-pulse" />
            </div>
        ) : NAV_ITEMS.map((item, index) => {
          const isSales = role === 'EMPLOYEE' && department === 'SALES';
          const isEngineering = role === 'EMPLOYEE' && department === 'ENGINEERING';
          const isExecution = role === 'EMPLOYEE' && department === 'EXECUTION';
          const isAccounts = role === 'EMPLOYEE' && department === 'ACCOUNTS';
          const isProcurement = role === 'EMPLOYEE' && department === 'PROCUREMENT';

          // --- ACCESS CONTROL LOGIC ---
          
          // 1. Sales Employees strictly only see "salesOnly" items
          if (isSales && !(item as any).salesOnly) {
              return null;
          }

          // 2. Engineering Employees strictly only see "engOnly" items
          if (isEngineering && !(item as any).engOnly) {
              return null;
          }

          // 2.5 Execution Employees strictly only see "execOnly" items
          if (isExecution && !(item as any).execOnly) {
              return null;
          }

          // 2.7 Accounts Employees strictly only see "acctOnly" items
          if (isAccounts && !(item as any).acctOnly) {
              return null;
          }

          // 2.8 Procurement Employees strictly only see "procOnly" items
          if (isProcurement && !(item as any).procOnly) {
              return null;
          }

          // 3. Owner-only items should only be seen by exactly Owners.
          if ((item as any).ownerOnly && !isOwner) {
              return null;
          }

          // 4. Admin-only Link restriction (Overall Queue)
          if ((item as any).adminOnly && !isOwner) {
             return null;
          }

          // 5. If someone isn't strictly Sales, hide Sales-only items (even from Owner)
          if (!isSales && (item as any).salesOnly) {
              return null;
          }

          // 6. If someone isn't strictly Engineering, hide Engineering-only items (even from Owner)
          if (!isEngineering && (item as any).engOnly) {
              return null;
          }

          // 7. If someone isn't strictly Execution, hide Execution-only items
          if (!isExecution && (item as any).execOnly) {
              return null;
          }

          // 8. If someone isn't strictly Accounts, hide Accounts-only items
          if (!isAccounts && (item as any).acctOnly) {
              return null;
          }

          // 9. If someone isn't strictly Procurement, hide Procurement-only items
          if (!isProcurement && (item as any).procOnly) {
              return null;
          }

          const isActive = pathname === item.href || (item.href === "/dashboard" && pathname === "/dashboard/owner");
          const isOwnerLink = index === 0 && isOwner;
          const Icon = isOwnerLink ? Crown : item.icon;
          const label = isOwnerLink ? "Owner Command Center" : item.label;

          const isPriorityLink = (item as any).priority;
          const isExecLink = (item as any).execOnly && item.href !== "/dashboard/execution";

          return (
            <div key={item.href}>
              <Link
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center rounded-xl transition-all duration-200 group relative min-h-[48px]",
                  collapsed ? "justify-center px-0 mx-2" : "gap-3 px-3",
                  "text-sm font-bold",
                  isActive 
                    ? (isOwnerLink ? "bg-red-600 text-white shadow-lg shadow-red-600/20" : "bg-accent text-accent-foreground shadow-lg shadow-yellow-400/20") 
                    : (isOwnerLink ? "text-red-400/70 hover:bg-red-600/5 hover:text-red-400" : isPriorityLink ? "text-[#FFC800] hover:bg-white/5" : "text-white/60 hover:bg-white/5 hover:text-white")
                )}
              >
                <Icon size={collapsed ? 24 : 20} className={cn(
                  "shrink-0 transition-all",
                  isActive ? (isOwnerLink ? "text-white" : "text-[#1A365D]") : (isOwnerLink ? "text-red-500/50 group-hover:text-red-400" : isPriorityLink ? "text-[#FFC800]" : "text-slate-400 group-hover:text-white")
                )} />
                {!collapsed && <span>{item.label}</span>}
                
                {/* Status Pip for Execution items */}
                {!collapsed && isExecLink && (
                  <div className="ml-auto flex items-center gap-1.5">
                     <div className="h-2 w-2 rounded-full bg-slate-500/30" />
                  </div>
                )}

                {!collapsed && item.dept && stats[item.dept] > 0 && (
                  <span className={cn(
                    "ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full",
                    isActive ? "bg-white text-slate-900" : "bg-white/10 text-white group-hover:bg-white/20 group-hover:text-white"
                  )}>
                    {stats[item.dept]}
                  </span>
                )}
                {(item as any).countKey && !collapsed && stats[(item as any).countKey] > 0 && (
                  <Badge className="ml-auto bg-white/10 text-white border-none font-black px-2 py-0.5 text-[9px] rounded-full">
                    {stats[(item as any).countKey]}
                  </Badge>
                )}
                {isActive && !collapsed && (
                  <div className={cn("absolute left-0 w-1.5 h-6 rounded-r-full", isOwnerLink ? "bg-white" : "bg-[#FFC800]")} />
                )}
              </Link>
              
              {/* 🏗️ ENGINEERING DYNAMIC SUBMENUS */}
              {!collapsed && isActive && role === 'EMPLOYEE' && department === 'ENGINEERING' && projects.length > 0 && (
                <>
                  {item.href === "/dashboard/engineering/survey" && (
                    <div className="flex flex-col gap-2 mt-1 mb-2 ml-11 pr-3">
                      {(() => {
                        const engProjects = projects.filter((p: any) => p.claimedByUserId === user?.id || p.assignedEngineers?.some((e: any) => e.id === user?.id));
                        const siteSurvey = engProjects.filter((p: any) => p.stage === "SITE_SURVEY");
                        const detailedSurvey = engProjects.filter((p: any) => p.stage === "DETAILED_ENGG");

                        return (
                          <>
                            {siteSurvey.length > 0 && (
                              <div className="space-y-1">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Site Survey</p>
                                {siteSurvey.map((p: any) => (
                                  <Link key={p.id} href={`/dashboard/engineering/survey?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("block text-xs font-bold truncate transition-colors", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                                    {p.name.replace(/\[.*?\]\s*/, '')}
                                  </Link>
                                ))}
                              </div>
                            )}
                            {detailedSurvey.length > 0 && (
                              <div className="space-y-1 mt-2">
                                <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-1">Detailed Survey</p>
                                {detailedSurvey.map((p: any) => (
                                  <Link key={p.id} href={`/dashboard/engineering/survey?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("block text-xs font-bold truncate transition-colors", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                                    {p.name.replace(/\[.*?\]\s*/, '')}
                                  </Link>
                                ))}
                              </div>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}
                  
                  {item.href === "/dashboard/engineering/detailed" && (
                    <div className="flex flex-col gap-1.5 mt-1 mb-2 ml-11 pr-3">
                      {(() => {
                        const engProjects = projects.filter((p: any) => p.claimedByUserId === user?.id || p.assignedEngineers?.some((e: any) => e.id === user?.id));
                        const detailedEngg = engProjects.filter((p: any) => p.stage === "DETAILED_ENGG");
                        
                        return detailedEngg.map((p: any) => (
                          <Link key={p.id} href={`/dashboard/engineering/detailed?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 text-xs font-bold truncate transition-colors py-0.5", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", currentSearch === p.name ? "bg-[#FFC800]" : "bg-white/20")} />
                            <span className="truncate">{p.name.replace(/\[.*?\]\s*/, '')}</span>
                          </Link>
                        ));
                      })()}
                    </div>
                  )}

                  {item.href === "/dashboard/engineering/work-order" && (
                    <div className="flex flex-col gap-1.5 mt-1 mb-2 ml-11 pr-3">
                      {(() => {
                        const engProjects = projects.filter((p: any) => p.claimedByUserId === user?.id || p.assignedEngineers?.some((e: any) => e.id === user?.id));
                        const workOrder = engProjects.filter((p: any) => p.stage !== "SITE_SURVEY");
                        
                        return workOrder.map((p: any) => (
                          <Link key={p.id} href={`/dashboard/engineering/work-order?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 text-xs font-bold truncate transition-colors py-0.5", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", currentSearch === p.name ? "bg-[#FFC800]" : "bg-white/20")} />
                            <span className="truncate">{p.name.replace(/\[.*?\]\s*/, '')}</span>
                          </Link>
                        ));
                      })()}
                    </div>
                  )}
                </>
              )}

              {/* 📦 PROCUREMENT DYNAMIC SUBMENUS */}
              {!collapsed && isActive && role === 'EMPLOYEE' && department === 'PROCUREMENT' && projects.length > 0 && (
                <>
                  {item.href === "/dashboard/procurement/bom" && (
                    <div className="flex flex-col gap-1.5 mt-1 mb-2 ml-11 pr-3">
                      {(() => {
                        const activeStages = ['HANDOVER_TO_EXECUTION', 'MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING', 'FINAL_HANDOVER'];
                        const bomProjects = projects.filter((p: any) => activeStages.includes(p.stage));
                        return bomProjects.map((p: any) => (
                          <Link key={p.id} href={`/dashboard/procurement/bom?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 text-xs font-bold truncate transition-colors py-0.5", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", currentSearch === p.name ? "bg-[#FFC800]" : "bg-white/20")} />
                            <span className="truncate">{p.name.replace(/\[.*?\]\s*/, '')}</span>
                          </Link>
                        ));
                      })()}
                    </div>
                  )}
                  {item.href === "/dashboard/procurement/purchase-orders" && (
                    <div className="flex flex-col gap-1.5 mt-1 mb-2 ml-11 pr-3">
                      {(() => {
                        const activeStages = ['MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING', 'FINAL_HANDOVER'];
                        const poProjects = projects.filter((p: any) => activeStages.includes(p.stage));
                        return poProjects.map((p: any) => (
                          <Link key={p.id} href={`/dashboard/procurement/purchase-orders?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 text-xs font-bold truncate transition-colors py-0.5", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", currentSearch === p.name ? "bg-[#FFC800]" : "bg-white/20")} />
                            <span className="truncate">{p.name.replace(/\[.*?\]\s*/, '')}</span>
                          </Link>
                        ));
                      })()}
                    </div>
                  )}
                  {item.href === "/dashboard/procurement/dispatch" && (
                    <div className="flex flex-col gap-1.5 mt-1 mb-2 ml-11 pr-3">
                      {(() => {
                        const activeStages = ['MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING', 'FINAL_HANDOVER'];
                        const dispatchProjects = projects.filter((p: any) => activeStages.includes(p.stage));
                        return dispatchProjects.map((p: any) => (
                          <Link key={p.id} href={`/dashboard/procurement/dispatch?search=${encodeURIComponent(p.name)}`} onClick={() => setMobileOpen(false)} className={cn("flex items-center gap-2 text-xs font-bold truncate transition-colors py-0.5", currentSearch === p.name ? "text-[#FFC800]" : "text-white/50 hover:text-white")}>
                            <div className={cn("h-1.5 w-1.5 rounded-full shrink-0", currentSearch === p.name ? "bg-[#FFC800]" : "bg-white/20")} />
                            <span className="truncate">{p.name.replace(/\[.*?\]\s*/, '')}</span>
                          </Link>
                        ));
                      })()}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}

        {/* 🏗️ ACTIVE SITE WORKSPACES (Execution Only) */}
        {!collapsed && role === 'EMPLOYEE' && department === 'EXECUTION' && projects.length > 0 && (
           <div className="mt-8 mb-4 px-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 px-2">Active Site Workspaces</p>
              <div className="space-y-1">
                 {projects.map((p: any) => (
                    <Link
                       key={p.id}
                       href={`/dashboard/execution/fielduploads?search=${encodeURIComponent(p.name)}`}
                       onClick={() => setMobileOpen(false)}
                       className={cn(
                          "flex items-center gap-2 rounded-xl transition-all duration-200 group relative min-h-[40px] px-3 text-xs font-bold",
                          pathname.includes("fielduploads") && pathname.includes(encodeURIComponent(p.name))
                             ? "bg-white/5 text-white" 
                             : "text-white/60 hover:bg-white/5 hover:text-white"
                       )}
                    >
                       <MapPin size={14} className="shrink-0 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                       <span className="truncate">{p.name.replace(/\[.*?\]\s*/, '')}</span> {/* Strip the [PROJ-XXX] for sidebar brevity */}
                    </Link>
                 ))}
              </div>
           </div>
        )}
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
