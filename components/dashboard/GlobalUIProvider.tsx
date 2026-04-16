"use client";

import React, { createContext, useContext, useMemo } from "react";
import { useDashboardNexus } from "./DashboardNexusProvider";

/**
 * STRATEGY: Global UI Nexus (LEAN VERSION)
 * 
 * BEFORE: This provider ran its OWN heartbeat every 60 seconds calling
 * getSidebarStats() which fired 4 sequential COUNT(*) queries to Neon.
 * 
 * AFTER: Zero database calls. Sidebar counts are derived locally from
 * the project list the DashboardNexus already has in memory.
 */

interface GlobalUIContextType {
  stats: Record<string, number>;
  isLoading: boolean;
  refreshStats: () => Promise<void>;
}

const GlobalUIContext = createContext<GlobalUIContextType | undefined>(undefined);

export function GlobalUIProvider({ children }: { children: React.ReactNode }) {
  const { data, isLoading: nexusLoading, refresh } = useDashboardNexus();

  // Derive sidebar counts from existing Nexus data — ZERO additional DB queries
  const stats = useMemo(() => {
    const projects = data?.projects || [];
    const derived: Record<string, number> = {
      SALES: 0,
      ENGINEERING: 0,
      EXECUTION: 0,
      ACCOUNTS: 0
    };

    projects.forEach((p: any) => {
      const dept = p.currentDepartment?.toUpperCase() || "UNASSIGNED";
      if (derived[dept] !== undefined) {
        derived[dept]++;
      }
    });

    return derived;
  }, [data?.projects]);

  const value = useMemo(() => ({
    stats,
    isLoading: nexusLoading,
    refreshStats: refresh
  }), [stats, nexusLoading, refresh]);

  return (
    <GlobalUIContext.Provider value={value}>
      {children}
    </GlobalUIContext.Provider>
  );
}

export function useGlobalUI() {
  const context = useContext(GlobalUIContext);
  if (!context) {
    return {
      stats: {},
      isLoading: true,
      refreshStats: async () => {}
    };
  }
  return context;
}
