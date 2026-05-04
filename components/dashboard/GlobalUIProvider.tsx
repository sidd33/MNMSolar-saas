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

export function GlobalUIProvider({ children, userId }: { children: React.ReactNode; userId: string | null }) {
  const { data, isLoading: nexusLoading, refresh } = useDashboardNexus();

  // Derive sidebar counts from existing Nexus data — ZERO additional DB queries
  const stats = useMemo(() => {
    const projects = data?.projects || [];
    const derived: Record<string, number> = {
      SALES: 0,
      ENGINEERING: 0,
      EXECUTION: 0,
      ACCOUNTS: 0,
      SURVEY_QUEUE: 0,
      DETAILED_ENGG: 0,
      WORK_ORDER: 0,
      MY_ENGINEERING_DESK: 0
    };

    projects.forEach((p: any) => {
      const dept = p.currentDepartment?.toUpperCase() || "UNASSIGNED";
      if (derived[dept] !== undefined) {
        derived[dept]++;
      }

      if (p.stage === "SITE_SURVEY") derived.SURVEY_QUEUE++;
      if (p.stage === "DETAILED_ENGG") derived.DETAILED_ENGG++;
      if (p.stage === "WORK_ORDER") derived.WORK_ORDER++;

      // Personal counter for the Unified Desk (Excluding Preliminary Surveys)
      const isAssigned = (
        p.stage !== "SITE_SURVEY" && (
          p.claimedByUserId === userId || 
          p.assignedToEngineerId === userId ||
          p.assignedEngineers?.some((eng: any) => eng.id === userId)
        )
      );
      if (isAssigned) derived.MY_ENGINEERING_DESK++;
    });

    return derived;
  }, [data?.projects, userId]);

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
