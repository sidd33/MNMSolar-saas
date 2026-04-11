"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { getEngineeringNexus } from "@/lib/actions/engineering";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";
import { format } from "date-fns";

/**
 * STRATEGY: 
 * To fix the 'Rendered more hooks' error, we must ensure the Provider's hook signature 
 * is stable and does not rely on complex transitions or conditional logic that affects 
 * the Root layout. We've moved the UI elements to a sub-component.
 */

interface EngineeringNexusContextType {
  data: {
    stats: any;
    projects: any[];
    activity: any[];
  };
  isLoading: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  refresh: () => Promise<void>;
  updateLocalProject: (projectId: string, updates: any) => void;
}

const EngineeringNexusContext = createContext<EngineeringNexusContextType | undefined>(undefined);

export function EngineeringNexusProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<any>({ 
    stats: { survey: 0, detailed: 0, workOrder: 0, bottlenecks: 0 }, 
    projects: [], 
    activity: [] 
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const lastActivityRef = useRef(Date.now());
  const lastFetchRef = useRef(Date.now());

  const fetchData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const result = await getEngineeringNexus();
      if (result) {
        setData(result);
        setLastUpdated(new Date());
        lastFetchRef.current = Date.now();
      }
    } catch (error) {
      console.error("Nexus sync failed:", error);
    } finally {
      setIsRefreshing(false);
      setIsLoading(false);
    }
  }, []);

  // Initial load & Activity Listeners
  useEffect(() => {
    fetchData();

    const handleActivity = () => {
      const now = Date.now();
      if (now - lastActivityRef.current > 5000) {
        lastActivityRef.current = now;
      }
    };

    const handleFocus = () => {
      if (Date.now() - lastFetchRef.current > 120000) {
        fetchData(true);
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('focus', handleFocus);

    let syncInterval = setInterval(() => {
        const now = Date.now();
        const inactiveTime = now - lastActivityRef.current;
        const staleTime = now - lastFetchRef.current;
        
        if (inactiveTime < 120000 && !document.hidden && staleTime > 120000) {
          fetchData(true);
        }
    }, 60000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('focus', handleFocus);
      clearInterval(syncInterval);
    };
  }, [fetchData]);

  const updateLocalProject = (projectId: string, updates: any) => {
    setData((prev: any) => ({
      ...prev,
      projects: prev.projects.map((p: any) => 
        p.id === projectId ? { ...p, ...updates } : p
      )
    }));
  };

  const refresh = async () => {
    await fetchData();
    toast.success("Nexus synchronized");
  };

  return (
    <EngineeringNexusContext.Provider value={{ 
      data, 
      isLoading, 
      isRefreshing, 
      lastUpdated, 
      refresh,
      updateLocalProject
    }}>
      <div className="relative min-h-screen">
        <NexusSyncBubble />
        {children}
      </div>
    </EngineeringNexusContext.Provider>
  );
}

// Separate UI component to keep Provider's main body clean
function NexusSyncBubble() {
    const context = useContext(EngineeringNexusContext);
    if (!context) return null;
    const { lastUpdated, isRefreshing, refresh } = context;

    return (
        <div className="fixed bottom-8 right-8 z-[100] group">
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-slate-200/50 p-2 pl-4 rounded-full shadow-2xl hover:shadow-primary/10 transition-all">
                <div className="flex flex-col items-end">
                    <span className="text-[9px] font-black uppercase tracking-tighter text-slate-400">Engineering Nexus</span>
                    <span className="text-[10px] font-bold text-slate-600">
                        {lastUpdated ? `Sync ${format(lastUpdated, "HH:mm:ss")}` : "Syncing..."}
                    </span>
                </div>
                <button 
                    onClick={refresh}
                    disabled={isRefreshing}
                    className="h-10 w-10 rounded-full bg-[#1C3384] text-white flex items-center justify-center hover:bg-blue-700 active:scale-90 transition-all disabled:opacity-50"
                >
                    <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
                </button>
            </div>
            <div className="absolute bottom-14 right-0 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                Manual Override Refresh
            </div>
        </div>
    );
}

export function useEngineeringNexus() {
  const context = useContext(EngineeringNexusContext);
  
  // SSR-Safe fallback to prevent AppRouter 'Rendered more hooks' error
  if (!context) {
    return {
      data: { stats: { survey: 0, detailed: 0, workOrder: 0, bottlenecks: 0 }, projects: [], activity: [] },
      isLoading: true,
      isRefreshing: false,
      lastUpdated: null,
      refresh: async () => {},
      updateLocalProject: () => {}
    };
  }
  return context;
}
