"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "@/app/actions/sync";

/**
 * Security middleware for Execution actions
 * Verifies authentication, role, and department
 */
async function validateExecutionAccess() {
  const [{ orgId }, user] = await Promise.all([auth(), currentUser()]);
  
  if (!user) throw new Error("Unauthorized");

  const metadata = user.publicMetadata as any;
  const role = metadata?.role;
  const department = metadata?.department;

  // Resilience: Always sync to ensure new users are bootstrapped in the DB
  const syncResult = await syncUserAndOrg();
  const finalOrgId = syncResult?.orgId || null;

  if (role === "OWNER" || role === "SUPER_ADMIN") {
      return { user, orgId: finalOrgId, isExecution: false, isOwner: true };
  }

  // Allow Engineering and Execution for cross-department sync testing
  if (role !== "EMPLOYEE" || (department !== "EXECUTION" && department !== "ENGINEERING")) {
    throw new Error("Access Denied: Execution Access Required");
  }

  return { user, orgId: finalOrgId, isExecution: true, isOwner: false };
}

export async function getExecutionQueue() {
  const { orgId } = await validateExecutionAccess();
  if (!orgId) return [];

  // Only fetch execution-relevant projects, no heavy files!
  return await prisma.project.findMany({
      where: {
          organizationId: orgId,
          stage: {
              in: ['HANDOVER_TO_EXECUTION', 'MATERIAL_PROCUREMENT', 'STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION', 'NET_METERING']
          }
      },
      take: 100,
      orderBy: { updatedAt: 'desc' },
      select: {
          id: true,
          name: true,
          stage: true,
          executionStage: true,
          updatedAt: true,
          clientName: true,
          executionMetadata: true,
      }
  });
}
/**
 * Extremely lightweight file metadata fetcher for sidebar counters
 * Does NOT return the heavy base64 "content" column
 */
export async function getExecutionFileCounters(projectId: string) {
    const { orgId } = await validateExecutionAccess();
    if (!orgId) return [];

    return await prisma.projectFile.findMany({
        where: { projectId, organizationId: orgId },
        select: {
            id: true,
            name: true,
            category: true,
            isArchived: true
        }
    });
}

/**
 * Live Stats for Execution Dashboard
 */
export async function getExecutionDashboardStats(providedOrgId?: string) {
    const orgId = providedOrgId || (await validateExecutionAccess()).orgId;
    if (!orgId) return { setup: 0, logistics: 0, activeSites: 0, ready: 0 };

    const [setupCount, logisticsCount, activeSitesCount, readyCount] = await Promise.all([
        prisma.project.count({ where: { organizationId: orgId, stage: 'HANDOVER_TO_EXECUTION' } }),
        prisma.project.count({ where: { organizationId: orgId, stage: 'MATERIAL_PROCUREMENT' } }),
        prisma.project.count({ where: { organizationId: orgId, stage: { in: ['STRUCTURE_ERECTION', 'PV_PANEL_INSTALLATION', 'AC_DC_INSTALLATION'] } } }),
        prisma.project.count({ where: { organizationId: orgId, stage: 'NET_METERING' } })
    ]);

    return {
        setup: setupCount,
        logistics: logisticsCount,
        activeSites: activeSitesCount,
        ready: readyCount
    };
}

export async function getExecutionNexus() {
    const { orgId } = await validateExecutionAccess();
    if (!orgId) return { stats: { setup: 0, logistics: 0, activeSites: 0, ready: 0 }, projects: [] };

    const [stats, projects] = await Promise.all([
        getExecutionDashboardStats(orgId),
        getExecutionQueue()
    ]);

    return { stats, projects };
}

export async function updateExecutionMetadata(projectId: string, metadata: any) {
    const { orgId } = await validateExecutionAccess();
    if (!orgId) throw new Error("Unauthorized");

    const result = await prisma.project.update({
        where: { id: projectId, organizationId: orgId },
        data: { executionMetadata: metadata },
    });

    revalidatePath(`/dashboard/execution/ops`);
    return result;
}
