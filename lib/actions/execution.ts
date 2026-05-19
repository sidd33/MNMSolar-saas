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
  const { userId, orgId, sessionClaims } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const metadata = (sessionClaims as any)?.publicMetadata || {};
  let role = (metadata.role as string)?.toUpperCase();
  let department = (metadata.department as string)?.toUpperCase();
  let name = (sessionClaims as any)?.full_name || (sessionClaims as any)?.name;
  const sessionOrgId = orgId || (metadata.orgId as string);

  // HYBRID HARDENING: Fallback to DB if session claims are missing
  if (!role || !department || !name) {
    const sync = await syncUserAndOrg();
    if (sync?.user) {
      role = role || (sync.user.role as string)?.toUpperCase();
      department = department || (sync.user.department as string)?.toUpperCase();
      name = name || sync.user.name || "Employee";
    }
  }

  name = name || "Employee";

  if (role === "OWNER" || role === "SUPER_ADMIN") {
      return { user: { id: userId, name }, orgId: sessionOrgId, isExecution: false, isOwner: true };
  }

  const allowedDepts = ["EXECUTION", "ENGINEERING"];
  const currentDept = department?.toUpperCase() || "";

  if (role !== "EMPLOYEE" || !allowedDepts.includes(currentDept)) {
    throw new Error(`Access Denied: Execution Access Required (Found: ${currentDept || 'None'})`);
  }

  return { user: { id: userId, name }, orgId: sessionOrgId, isExecution: true, isOwner: false };
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
          claimedByUserId: true,
          claimedAt: true,
          claimedBy: { select: { id: true, name: true, email: true } }
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

export async function updateExecutionMetadata(projectId: string, sectionOrData: string | any, data?: any) {
    const { orgId, user } = await validateExecutionAccess();
    if (!orgId) throw new Error("Unauthorized");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: { executionMetadata: true }
    });

    const currentMetadata = (project?.executionMetadata as any) || {};
    let updatedMetadata;

    if (data !== undefined && typeof sectionOrData === 'string') {
        const section = sectionOrData;
        updatedMetadata = {
            ...currentMetadata,
            [section]: {
                ...currentMetadata[section],
                ...data,
                lastUpdatedBy: user.id,
                lastUpdatedAt: new Date().toISOString()
            }
        };
    } else {
        updatedMetadata = {
            ...currentMetadata,
            ...sectionOrData
        };
    }

    const result = await prisma.project.update({
        where: { id: projectId, organizationId: orgId },
        data: { executionMetadata: updatedMetadata },
    });

    revalidatePath(`/dashboard/execution`);
    return result;
}

export async function logChallanReceipt(projectId: string, challanData: { challanNumber: string, items: any[] }) {
    const { orgId, user } = await validateExecutionAccess();
    if (!orgId) throw new Error("Unauthorized");

    return await updateExecutionMetadata(projectId, 'logistics', {
        ...challanData,
        status: 'VERIFIED',
        verifiedBy: user.name,
        verifiedAt: new Date().toISOString()
    });
}

export async function updateSiteReadiness(projectId: string, readinessData: any) {
    return await updateExecutionMetadata(projectId, 'readiness', readinessData);
}

export async function logInspection(projectId: string, type: 'MID' | 'FINAL', result: 'PASS' | 'FAIL', punchPoints: string[]) {
    const { orgId, user } = await validateExecutionAccess();
    if (!orgId) throw new Error("Unauthorized");

    return await updateExecutionMetadata(projectId, 'qc', {
        [`${type.toLowerCase()}Inspection`]: {
            result,
            punchPoints,
            inspector: user.name,
            date: new Date().toISOString()
        }
    });
}

export async function claimProject(projectId: string) {
    const { user, orgId, isOwner } = await validateExecutionAccess();
    if (!orgId) throw new Error("No organization context found");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });

    if (!project) throw new Error("Project not found");

    try {
        await prisma.project.update({
            where: { 
                id: projectId,
                organizationId: orgId,
                OR: [
                    { claimedByUserId: null },
                    { claimedByUserId: user.id }
                ]
            },
            data: {
                claimedByUserId: user.id,
                claimedAt: new Date()
            }
        });
    } catch (error: any) {
        if (error.code === 'P2025') {
            throw new Error("This project has already been claimed by another team member.");
        }
        throw error;
    }

    revalidatePath("/dashboard/department/Execution");
    return { success: true };
}

export async function unclaimProject(projectId: string) {
    const { user, orgId, isOwner } = await validateExecutionAccess();
    if (!orgId) throw new Error("No organization context found");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });

    if (!project) throw new Error("Project not found");

    if (project.claimedByUserId !== user.id && !isOwner) {
        throw new Error("You can only release projects that you have claimed.");
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            claimedByUserId: null,
            claimedAt: null
        }
    });

    revalidatePath("/dashboard/department/Execution");
    return { success: true };
}
