"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "@/app/actions/sync";

/**
 * Security middleware for Engineering actions
 * Verifies authentication, role (EMPLOYEE), and department (ENGINEERING)
 */
async function validateEngineeringAccess() {
  const [{ orgId }, user] = await Promise.all([auth(), currentUser()]);
  
  if (!user) throw new Error("Unauthorized");

  const metadata = user.publicMetadata as any;
  const role = metadata?.role;
  const department = metadata?.department;

  // Resilience: Always sync to ensure new users are bootstrapped in the DB
  const syncResult = await syncUserAndOrg();
  const finalOrgId = syncResult?.orgId || null;

  if (role === "OWNER" || role === "SUPER_ADMIN") {
      return { user, orgId: finalOrgId, isEngineering: false, isOwner: true };
  }

  if (role !== "EMPLOYEE" || (department !== "ENGINEERING" && department !== "SALES" && department !== "EXECUTION")) {
    throw new Error("Access Denied: Engineering, Sales, or Execution Access Required");
  }

  return { user, orgId: finalOrgId, isEngineering: true, isOwner: false };
}

export async function getEngineeringDashboardStats(providedOrgId?: string) {
    const orgId = providedOrgId || (await validateEngineeringAccess()).orgId;
    if (!orgId) return { survey: 0, detailed: 0, workOrder: 0, bottlenecks: 0 };

    const [surveyCount, detailedCount, workOrderCount, bottlenecksCount] = await Promise.all([
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: { equals: 'Engineering', mode: 'insensitive' }, stage: 'SITE_SURVEY' } }),
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: { equals: 'Engineering', mode: 'insensitive' }, stage: 'DETAILED_ENGG' } }),
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: { equals: 'Engineering', mode: 'insensitive' }, stage: 'WORK_ORDER' } }),
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: { equals: 'Engineering', mode: 'insensitive' }, isBottlenecked: true } })
    ]);

    return {
        survey: surveyCount,
        detailed: detailedCount,
        workOrder: workOrderCount,
        bottlenecks: bottlenecksCount
    };
}

export async function getEngineeringQueue(stages?: string[], providedOrgId?: string) {
  const orgId = providedOrgId || (await validateEngineeringAccess()).orgId;
  if (!orgId) return [];

  const whereClause: any = {
      organizationId: orgId,
      currentDepartment: { equals: 'Engineering', mode: 'insensitive' }
  };

  if (stages && stages.length > 0) {
      whereClause.stage = { in: stages };
  }

  return await prisma.project.findMany({
      where: whereClause,
      take: 100,
      orderBy: { updatedAt: 'desc' },
      select: {
          id: true,
          name: true,
          stage: true,
          isBottlenecked: true,
          currentDepartment: true,
          updatedAt: true,
          createdAt: true,
          sanctionedLoad: true,
          claimedByUserId: true,
          claimedAt: true,
          claimedBy: { select: { id: true, email: true } }
      }
  });
}

export async function getRecentEngineeringActivity(providedOrgId?: string) {
    const orgId = providedOrgId || (await validateEngineeringAccess()).orgId;
    if (!orgId) return [];

    return await prisma.handoffLog.findMany({
        where: { 
            organizationId: orgId, 
            toDept: { equals: 'Engineering', mode: 'insensitive' } 
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
            id: true,
            createdAt: true,
            fromDept: true,
            toDept: true,
            fromStage: true,
            toStage: true,
            project: {
                select: { id: true, name: true, stage: true }
            },
            user: { select: { email: true } }
        }
    });
}

export async function getEngineeringNexus() {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId) return { stats: { survey: 0, detailed: 0, workOrder: 0, bottlenecks: 0 }, projects: [], activity: [] };

    const [stats, projects, activity] = await Promise.all([
        getEngineeringDashboardStats(orgId),
        getEngineeringQueue(undefined, orgId),
        getRecentEngineeringActivity(orgId)
    ]);

    return { stats, projects, activity };
}

/**
 * On-Demand Detail Loader
 * Fetches heavy data (files, tasks) for a SINGLE project.
 * Used when a user clicks/expands a project card.
 */
export async function getProjectDetail(projectId: string) {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId) return null;

    return await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId },
        select: {
            id: true,
            name: true,
            stage: true,
            currentDepartment: true,
            sanctionedLoad: true,
            updatedAt: true,
            projectFiles: {
                where: {
                    OR: [
                        { organizationId: orgId },
                        { organizationId: { not: "" } } // Fallback for cross-env visibility
                    ]
                },
                select: {
                    id: true,
                    name: true,
                    category: true,
                    fileUrl: true,
                    utFileKey: true,
                    uploadedAtStage: true,
                    createdAt: true
                }
            },
            tasks: {
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    status: true,
                    assignee: { select: { email: true } }
                }
            }
        }
    });
}
/**
 * Bulk Detail Loader
 * Fetches heavy data (files, tasks) for MULTIPLE projects in one query.
 * Replaces N+1 loops in dashboard pages.
 */
export async function getBulkProjectDetails(projectIds: string[]) {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId || projectIds.length === 0) return [];

    return await prisma.project.findMany({
        where: { 
            id: { in: projectIds }, 
            organizationId: orgId 
        },
        select: {
            id: true,
            name: true,
            stage: true,
            currentDepartment: true,
            sanctionedLoad: true,
            updatedAt: true,
            projectFiles: {
                select: {
                    id: true,
                    name: true,
                    category: true,
                    fileUrl: true,
                    utFileKey: true,
                    uploadedAtStage: true,
                    createdAt: true
                }
            },
            tasks: {
                select: {
                    id: true,
                    title: true,
                    priority: true,
                    status: true,
                    assignee: { select: { email: true } }
                }
            }
        }
    });
}

export async function claimProject(projectId: string) {
    const { user, orgId, isOwner } = await validateEngineeringAccess();
    if (!orgId) throw new Error("No organization context found");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });

    if (!project) throw new Error("Project not found");

    if (project.claimedByUserId && project.claimedByUserId !== user.id && !isOwner) {
        throw new Error("This project is already claimed by another team member.");
    }

    await prisma.project.update({
        where: { id: projectId },
        data: {
            claimedByUserId: user.id,
            claimedAt: new Date()
        }
    });

    revalidatePath("/dashboard/department/Engineering");
    return { success: true };
}

export async function unclaimProject(projectId: string) {
    const { user, orgId, isOwner } = await validateEngineeringAccess();
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

    revalidatePath("/dashboard/department/Engineering");
    return { success: true };
}
