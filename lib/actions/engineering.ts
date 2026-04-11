"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

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

  if (role === "OWNER" || role === "SUPER_ADMIN") {
      return { user, orgId, isEngineering: false, isOwner: true };
  }

  if (role !== "EMPLOYEE" || (department !== "ENGINEERING" && department !== "SALES")) {
    throw new Error("Access Denied: Engineering or Sales Access Required");
  }

  return { user, orgId, isEngineering: true, isOwner: false };
}

export async function getEngineeringDashboardStats() {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId) return { survey: 0, detailed: 0, workOrder: 0, bottlenecks: 0 };

    const [surveyCount, detailedCount, workOrderCount, bottlenecksCount] = await Promise.all([
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: 'ENGINEERING', stage: { in: ['SITE_SURVEY', 'PRELIMINARY_QUOTE'] } } }),
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: 'ENGINEERING', stage: 'DETAILED_ENGG' } }),
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: 'ENGINEERING', stage: 'WORK_ORDER' } }),
        prisma.project.count({ where: { organizationId: orgId, currentDepartment: 'ENGINEERING', isBottlenecked: true } })
    ]);

    return {
        survey: surveyCount,
        detailed: detailedCount,
        workOrder: workOrderCount,
        bottlenecks: bottlenecksCount
    };
}

export async function getEngineeringQueue(stages?: string[]) {
  const { orgId } = await validateEngineeringAccess();
  if (!orgId) return [];

  const whereClause: any = {
      organizationId: orgId,
      currentDepartment: 'ENGINEERING'
  };

  if (stages && stages.length > 0) {
      whereClause.stage = { in: stages };
  }

  return await prisma.project.findMany({
      where: whereClause,
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
                  assignee: { select: { email: true } }
              }
          }
      }
  });
}

export async function getRecentEngineeringActivity() {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId) return [];

    return await prisma.handoffLog.findMany({
        where: { 
            organizationId: orgId, 
            toDept: 'ENGINEERING' 
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
        getEngineeringDashboardStats(),
        getEngineeringQueue(),
        getRecentEngineeringActivity()
    ]);

    return { stats, projects, activity };
}
