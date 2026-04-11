"use server";

import { prisma } from "@/lib/prisma";
import { syncUserAndOrg } from "./sync";

export async function getOwnerDashboardData() {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return { projects: [], heatmap: {}, workload: {}, bottlenecks: [], auditLogs: [] };

  const role = (sync as any).user?.role;
  const userDept = (sync as any).user?.department;
  const isOwner = role === 'OWNER';

  // RBAC: If not OWNER, restrict projects to their department
  let projectWhere: any = { organizationId: sync.orgId };
  if (!isOwner) {
    if (userDept) {
      projectWhere.currentDepartment = { equals: userDept, mode: 'insensitive' };
    } else {
      return { projects: [], heatmap: {}, workload: {}, bottlenecks: [], auditLogs: [] };
    }
  }

  const projects = await prisma.project.findMany({
    where: projectWhere,
    include: {
      tasks: true,
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
    }
  });

  const auditLogs = await prisma.auditLog.findMany({
    where: { organizationId: sync.orgId },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      user: true,
      task: true,
    }
  });

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

  // Bottlenecks (> 72 hours without update)
  const seventyTwoHoursAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);
  const bottlenecks = projects.filter(p => (p as any).updatedAt < seventyTwoHoursAgo);

  return {
    projects,
    heatmap,
    workload,
    bottlenecks,
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
    include: {
      tasks: {
        include: {
          assignee: true
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
    } as any,
    orderBy: { updatedAt: 'desc' } as any
  });
}

export async function getSidebarStats() {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return null;

  const departments = ["SALES", "ENGINEERING", "EXECUTION", "ACCOUNTS"];
  const stats: Record<string, number> = {};

  for (const dept of departments) {
    stats[dept] = await (prisma.project as any).count({
      where: {
        organizationId: sync.orgId,
        currentDepartment: {
          equals: dept,
          mode: 'insensitive'
        }
      }
    });
  }

  return stats;
}
