"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef, useMemo } from "react";
import { getOwnerDashboardData } from "@/app/actions/dashboard";
import { getEngineeringNexus } from "@/lib/actions/engineering";
import { toast } from "sonner";
import { RefreshCw, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

/**
 * UNIVERSAL DASHBOARD NEXUS
 * This is the root intelligence of the MNMSOLAR OS. 
 * It ensures data stays 'Locked' during navigation to prevent full resets.
 */

interface PipelineContextType {
  projects: any[];
  stats: any;
  activity?: any[]; // Engineering specific activity
  isLoading: boolean;
  isRefreshing: boolean;
  lastSyncedAt: Date | null;
  refresh: () => Promise<void>;
  updateLocalProject: (projectId: string, updates: any) => void;
  updateLocalData: (updates: any) => void;
  role: string | null;
  department: string | null;
}

interface AuditContextType {
  auditLogs: any[];
  isLoading: boolean;
  isRefreshing: boolean;
}

const PipelineContext = createContext<PipelineContextType | undefined>(undefined);
const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function DashboardNexusProvider({ 
  children, 
  initialData = null, 
  userId = null, 
  role = null, 
  department = null 
}: { 
  children: React.ReactNode; 
  initialData?: any; 
  userId?: string | null; 
  role?: string | null; 
  department?: string | null; 
}) {
  // Split state to allow selective re-renders
  const [pipelineData, setPipelineData] = useState<any>(initialData ? { 
    projects: initialData.projects, 
    stats: initialData.stats,
    activity: initialData.activity
  } : null);
  const [auditData, setAuditData] = useState<any>(initialData ? { 
    auditLogs: initialData.auditLogs 
  } : null);
  
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(initialData ? new Date() : null);

  const lastActivityRef = useRef(Date.now());
  const lastFetchRef = useRef(initialData ? Date.now() : 0);
  const isMounted = useRef(true);
  const hasInitializedRender = useRef(false);

  const fetchData = useCallback(async (isSilent = false) => {
    if (!userId || !isMounted.current) return;
    
    if (!isSilent && !pipelineData) setIsLoading(true);
    if (!isSilent && isMounted.current) setIsRefreshing(true);
    
    try {
      let result: any;
      if (role === 'OWNER' || role === 'SUPER_ADMIN') {
        result = await getOwnerDashboardData();
      } else if (department === 'ENGINEERING') {
        result = await getEngineeringNexus();
      } else {
        result = await getOwnerDashboardData();
      }

      if (result && isMounted.current) {
        setPipelineData({ 
          projects: result.projects || [], 
          stats: result.stats || null,
          activity: result.activity || undefined
        });
        setAuditData({ 
          auditLogs: result.auditLogs || [] 
        });
        
        const now = new Date();
        setLastSyncedAt(now);
        lastFetchRef.current = now.getTime();
      }
    } catch (error) {
      console.error("DashboardNexus: Global Sync Failed", error);
    } finally {
      if (isMounted.current) {
        setIsRefreshing(false);
        setIsLoading(false);
      }
    }
  }, [userId, role, department, pipelineData]);

  // Global Pulse System
  useEffect(() => {
    isMounted.current = true;
    
    if (!hasInitializedRender.current) {
        hasInitializedRender.current = true;
        if (userId && !pipelineData) {
           fetchData();
        }
    }

    const handleFocus = () => {
      const now = Date.now();
      if (userId && now - lastFetchRef.current > 120000) {
        fetchData(true);
      }
    };

    window.addEventListener('focus', handleFocus);

    const syncInterval = setInterval(() => {
        if (document.visibilityState !== 'visible') return;
        const now = Date.now();
        const inactiveTime = now - lastActivityRef.current;
        const staleTime = now - lastFetchRef.current;
        if (userId && inactiveTime < 600000 && !document.hidden && staleTime > 60000) {
          fetchData(true);
        }
    }, 60000);

    return () => {
      isMounted.current = false;
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [fetchData, userId]);

  const updateLocalProject = useCallback((projectId: string, updates: any) => {
    setPipelineData((prev: any) => {
      if (!prev) return prev;
      const projects = prev.projects || [];
      return {
        ...prev,
        projects: projects.map((p: any) => p.id === projectId ? { ...p, ...updates } : p)
      };
    });
  }, []);

  const updateLocalData = useCallback((updates: any) => {
    if (updates.projects) {
        setPipelineData((prev: any) => ({ ...prev, projects: updates.projects }));
    }
    if (updates.auditLogs) {
        setAuditData((prev: any) => ({ ...prev, auditLogs: updates.auditLogs }));
    }
    // Fallback for other generic updates
    if (!updates.projects && !updates.auditLogs) {
        setPipelineData((prev: any) => ({ ...prev, ...updates }));
    }
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
    toast.success("Operational Intel Updated");
  }, [fetchData]);

  const pipelineValue = useMemo(() => ({
    projects: pipelineData?.projects || [],
    stats: pipelineData?.stats || null,
    activity: pipelineData?.activity,
    isLoading,
    isRefreshing,
    lastSyncedAt,
    refresh,
    updateLocalProject,
    updateLocalData,
    role,
    department
  }), [pipelineData, isLoading, isRefreshing, lastSyncedAt, refresh, updateLocalProject, updateLocalData, role, department]);

  const auditValue = useMemo(() => ({
    auditLogs: auditData?.auditLogs || [],
    isLoading,
    isRefreshing
  }), [auditData, isLoading, isRefreshing]);

  return (
    <PipelineContext.Provider value={pipelineValue}>
      <AuditContext.Provider value={auditValue}>
        <div className="relative min-h-screen">
          <GlobalNexusPulse />
          {children}
        </div>
      </AuditContext.Provider>
    </PipelineContext.Provider>
  );
}

function GlobalNexusPulse() {
    const context = useContext(PipelineContext);
    if (!context) return null;
    const { lastSyncedAt, isRefreshing, refresh } = context;

    return (
        <div className="fixed bottom-8 left-8 md:left-auto md:right-8 z-[999] group">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200/50 p-2 pl-4 rounded-full shadow-2xl transition-all">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">MNMSOLAR NEXUS</span>
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5">
                        <Clock size={10} className={cn("transition-colors", isRefreshing ? "text-blue-500" : "text-slate-400")} />
                        {lastSyncedAt ? format(lastSyncedAt, "HH:mm") : "Locking..."}
                    </span>
                </div>
                <button 
                    onClick={refresh}
                    disabled={isRefreshing}
                    className="h-10 w-10 rounded-full bg-[#1C3384] text-white flex items-center justify-center hover:bg-blue-800 active:scale-75 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>
        </div>
    );
}

export function usePipelineNexus() {
  const context = useContext(PipelineContext);
  if (!context) throw new Error("usePipelineNexus must be used within DashboardNexusProvider");
  return context;
}

export function useAuditNexus() {
  const context = useContext(AuditContext);
  if (!context) throw new Error("useAuditNexus must be used within DashboardNexusProvider");
  return context;
}

// Legacy hook for backward compatibility
export function useDashboardNexus() {
  const pipeline = useContext(PipelineContext);
  const audit = useContext(AuditContext);
  
  if (!pipeline || !audit) {
    return {
      data: { projects: [], stats: null, auditLogs: [], activity: [] },
      isLoading: true,
      isRefreshing: false,
      lastSyncedAt: null,
      refresh: async () => {},
      updateLocalProject: (id: string, updates: any) => {},
      updateLocalData: (updates: any) => {},
      role: null,
      department: null
    };
  }

  return {
    data: {
      projects: pipeline.projects,
      stats: pipeline.stats,
      auditLogs: audit.auditLogs,
      activity: pipeline.activity || []
    },
    isLoading: pipeline.isLoading,
    isRefreshing: pipeline.isRefreshing,
    lastSyncedAt: pipeline.lastSyncedAt,
    refresh: pipeline.refresh,
    updateLocalProject: pipeline.updateLocalProject,
    updateLocalData: pipeline.updateLocalData,
    role: pipeline.role,
    department: pipeline.department
  };
}


