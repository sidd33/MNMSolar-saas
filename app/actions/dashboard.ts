"use server";

import { prisma } from "@/lib/prisma";
import { syncUserAndOrg } from "./sync";

export async function getOwnerDashboardData() {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return { projects: [], heatmap: {}, workload: {}, bottlenecks: [], auditLogs: [] };

  const role = (sync as any).user?.role;
  const userDept = (sync as any).user?.department;
  const isOwner = role === 'OWNER' || role === 'SUPER_ADMIN';

  // RBAC: If not OWNER, restrict projects to their department
  let projectWhere: any = { organizationId: sync.orgId };
  if (!isOwner) {
    if (userDept) {
      projectWhere.currentDepartment = { equals: userDept, mode: 'insensitive' };
    } else {
      return { projects: [], heatmap: {}, workload: {}, bottlenecks: [], auditLogs: [] };
    }
  }

  // SELECTIVE FETCHING: Parallelize all operational streams
  const [projects, auditLogs, leads, quotes] = await Promise.all([
    prisma.project.findMany({
      where: projectWhere,
      take: 100,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        stage: true,
        currentDepartment: true,
        updatedAt: true,
        clientName: true,
        isBottlenecked: true,
        createdByUserId: true,
      }
    }),
    prisma.auditLog.findMany({
      where: { organizationId: sync.orgId },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        action: true,
        newValue: true,
        createdAt: true,
        user: { select: { email: true } },
        task: {
          select: {
            project: { select: { name: true } }
          }
        }
      }
    }),
    prisma.lead.findMany({
      where: { organizationId: sync.orgId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        name: true,
        status: true,
        capacityKw: true,
        updatedAt: true,
        assignedToId: true,
      }
    }),
    prisma.quote.findMany({
      where: { organizationId: sync.orgId },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      select: {
        id: true,
        clientName: true,
        projectName: true,
        status: true,
        quotedValue: true,
        updatedAt: true,
        assignedToId: true,
      }
    })
  ]);

  // Pipeline Heatmap
  const heatmap: Record<string, number> = {};
  projects.forEach(p => {
    heatmap[(p as any).stage] = (heatmap[(p as any).stage] || 0) + 1;
  });

  // Department Workload - Use Standardized Uppercase Keys
  const workload: Record<string, number> = {
    "SALES": 0,
    "ENGINEERING": 0,
    "EXECUTION": 0,
    "ACCOUNTS": 0
  };

  projects.forEach(p => {
    const dept = (p as any).currentDepartment?.toUpperCase() || "UNASSIGNED";
    if (workload[dept] !== undefined) {
      workload[dept]++;
    } else if (dept !== "UNASSIGNED") {
      workload[dept] = 1;
    }
  });

  // Bottlenecks are now derived on the client from projects.filter(p => p.isBottlenecked)
  // No duplicate payload needed.

  return {
    projects,
    leads,
    quotes,
    stats: {
        heatmap,
        workload
    },
    auditLogs
  };
}

export async function getDepartmentalProjects(department: string) {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) throw new Error("Unauthorized");

  const { orgId } = sync;
  const role = (sync as any).user?.role;
  const userDept = (sync as any).user?.department;
  const isOwner = role === 'OWNER';

  // Safety Check: Organization Membership
  if (!orgId) {
     return { error: "NO_ORG" };
  }

  // RBAC: Standard employees can only see their department
  if (role === 'EMPLOYEE' && department.toUpperCase() !== userDept?.toUpperCase()) {
    return []; // Return empty if trying to access another dept
  }

  let whereClause: any = { 
    organizationId: orgId,
  };

  // Case-Insensitive Matching for Departments
  if (department === "OVERALL" && isOwner) {
    // No department filter
  } else {
    // Standard departmental match
    whereClause.currentDepartment = {
      equals: department,
      mode: 'insensitive'
    };
  }

  return await (prisma.project as any).findMany({
    where: whereClause,
    take: 100,
    orderBy: { updatedAt: 'desc' } as any,
    select: {
      id: true,
      name: true,
      stage: true,
      clientName: true,
      currentDepartment: true,
      updatedAt: true,
      createdAt: true,
      isBottlenecked: true,
      sanctionedLoad: true,
      tasks: {
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          assignee: { select: { email: true } }
        },
        orderBy: { createdAt: 'desc' } as any
      },
      projectFiles: {
        select: {
          id: true,
          name: true,
          category: true,
          fileUrl: true,
          utFileKey: true,
          isArchived: true,
          uploadedAtStage: true,
          createdAt: true
        }
      }
    } as any
  });
}

/**
 * getSidebarStats — REMOVED.
 * Sidebar counts are now derived locally from the Nexus project list.
 * This eliminates 4 sequential COUNT(*) queries that ran every 60 seconds.
 * See: GlobalUIProvider.tsx → useEffect that reads from DashboardNexus.
 */
