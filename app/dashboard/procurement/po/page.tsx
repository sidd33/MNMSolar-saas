"use client";

import { useState, useEffect } from "react";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { POBuilderModule } from "@/components/workspace/POBuilderModule";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart } from "lucide-react";
import { getPurchaseOrders } from "@/lib/actions/procurement";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useSearchParams } from "next/navigation";

export default function PurchaseOrdersPage() {
  const { data, isLoading, refresh } = useDashboardNexus();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("search") || "";
  
  const [pos, setPos] = useState<any[]>([]);
  const [loadingPOs, setLoadingPOs] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const projects = data?.projects || [];
  
  // Set default selection when projects load, respecting the search query
  useEffect(() => {
     if (projects.length > 0) {
         if (initialSearch) {
             const matched = projects.find((p: any) => p.name === initialSearch || p.name.includes(initialSearch));
             if (matched) {
                 setSelectedProjectId(matched.id);
                 return;
             }
         }
         
         if (!selectedProjectId) {
            setSelectedProjectId(projects[0].id);
         }
     }
  }, [projects, initialSearch, selectedProjectId]);

  const activeProject = projects.find((p: any) => p.id === selectedProjectId) || null;

  useEffect(() => {
    async function fetchPOs() {
      setLoadingPOs(true);
      try {
        const fetched = await getPurchaseOrders();
        setPos(fetched);
      } catch (e) {
        console.error(e);
      } finally {
        setLoadingPOs(false);
      }
    }
    fetchPOs();
  }, []);

  const handleRefresh = async () => {
    refresh();
    const fetched = await getPurchaseOrders();
    setPos(fetched);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-100 pb-8">
        <Link href="/dashboard/procurement">
           <button className="h-10 w-10 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors">
              <ChevronLeft size={20} />
           </button>
        </Link>
        <div className="space-y-1">
          <Badge className="bg-[#1C3384]/10 text-[#1C3384] hover:bg-[#1C3384]/10 font-bold px-3 py-1 rounded-full uppercase tracking-widest text-[10px] mb-2 inline-flex items-center gap-2">
            <ShoppingCart size={12} /> Purchase Orders
          </Badge>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight font-[family-name:var(--font-montserrat)] uppercase">
            PO Lifecycle Management
          </h1>
        </div>
      </div>

      {loadingPOs || isLoading ? (
         <div className="h-[600px] bg-slate-50/50 animate-pulse rounded-[3rem] border border-slate-100" />
      ) : projects.length === 0 ? (
         <div className="p-12 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
           <ShoppingCart size={40} className="mx-auto mb-4 text-slate-300" />
           <h3 className="font-black text-xl uppercase tracking-widest text-slate-400">No Active Projects</h3>
           <p className="text-slate-500 mt-2">You need an active project in the procurement phase to generate a PO.</p>
         </div>
      ) : (
         <div className="space-y-6">
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
               <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Select Project:</span>
               <select 
                  className="flex-1 bg-white border-slate-200 rounded-xl h-10 px-4 text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-[#1C3384]/20"
                  value={selectedProjectId || ""}
                  onChange={e => setSelectedProjectId(e.target.value)}
               >
                  {projects.map((p: any) => (
                     <option key={p.id} value={p.id}>{p.name} ({p.clientName})</option>
                  ))}
               </select>
            </div>
            
            {activeProject && (
               <POBuilderModule 
                  project={activeProject} 
                  existingPOs={pos.filter(p => p.projectId === activeProject.id)} 
                  onRefresh={handleRefresh} 
               />
            )}
         </div>
      )}
    </div>
  );
}
