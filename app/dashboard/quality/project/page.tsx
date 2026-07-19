"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useDashboardNexus } from "@/components/dashboard/DashboardNexusProvider";
import { useState, useEffect } from "react";
import { HardHat } from "lucide-react";
import { getBulkProjectDetails } from "@/lib/actions/engineering";
import { QualityProjectManager } from "@/components/workspace/QualityProjectManager";
import { QualitySection } from "@/components/workspace/QualityProjectSidebar";

export default function QualityProjectPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data } = useDashboardNexus();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [isSyncing, setIsSyncing] = useState(false);

  // Sync searchQuery when URL changes
  useEffect(() => {
    setSearchQuery(searchParams.get("search") || "");
  }, [searchParams]);

  // Which section is active based on a query parameter (or default to QUALITY_SNAGS)
  const tabSlug = searchParams.get("tab") || "quality_snags";
  
  const slugMap: Record<string, QualitySection> = {
    quality_snags: "QUALITY_SNAGS",
    field_gallery: "FIELD_GALLERY",
    docs_vault: "DOCS_VAULT"
  };

  const activeSection = slugMap[tabSlug] || "QUALITY_SNAGS";

  const baseProjects = data?.projects?.filter((p: any) => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // Batch loading details
  useEffect(() => {
    if (baseProjects.length === 0 || isSyncing) return;
    
    const uncachedIds = baseProjects
      .filter((p: any) => !detailCache[p.id])
      .map((p: any) => p.id);

    if (uncachedIds.length === 0) return;

    setIsSyncing(true);

    getBulkProjectDetails(uncachedIds)
      .then((results) => {
        setDetailCache(prev => {
          const updated = { ...prev };
          results.forEach((detail: any) => {
            if (detail) updated[detail.id] = detail;
          });
          return updated;
        });
      })
      .finally(() => {
        setIsSyncing(false);
      });
  }, [baseProjects.length, searchQuery]);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] -mx-6 lg:-mx-8 -my-6 lg:-my-8">
      {baseProjects.length === 0 ? (
        <div className="h-[calc(100vh-64px)] flex flex-col items-center justify-center bg-slate-50/50 text-slate-400 gap-3">
            <HardHat size={48} className="opacity-20" />
            <p className="font-bold uppercase tracking-widest text-[10px]">Project not found</p>
        </div>
      ) : (
        baseProjects.map((project: any) => {
           const detail = detailCache[project.id];
           const mergedProject = detail 
             ? { ...project, ...detail }
             : { ...project, tasks: [], projectFiles: [] };

           return (
              <div key={project.id} className="flex-1 min-h-0 w-full animate-in fade-in duration-500">
                  <QualityProjectManager 
                      project={mergedProject} 
                      forcedSection={activeSection}
                  />
              </div>
           );
        })
      )}
    </div>
  );
}
