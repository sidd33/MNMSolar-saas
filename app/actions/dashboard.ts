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

  // 1. One-Org Self-Healing: Update all projects to the current active organization
  const projectsToSync = await (prisma.project as any).findMany({
    where: {
      NOT: { organizationId: orgId }
    }
  });

  if (projectsToSync.length > 0) {
    console.log(`Master Sync: Aligning ${projectsToSync.length} projects to organization ${orgId}`);
    await Promise.all(
      projectsToSync.map((p: any) => 
        (prisma.project as any).update({
          where: { id: p.id },
          data: { organization: { connect: { id: orgId } } }
        })
      )
    );
  }

  // Standardize "Engineering" variants
  if (department.toUpperCase() === "ENGINEERING") {
    const projectsToFixDept = await (prisma.project as any).findMany({
      where: {
        organizationId: orgId,
        currentDepartment: { in: ["Engineering", "engineering", "engineeing"] }
      }
    });

    if (projectsToFixDept.length > 0) {
      await Promise.all(
        projectsToFixDept.map((p: any) =>
          (prisma.project as any).update({
            where: { id: p.id },
            data: { currentDepartment: "ENGINEERING" }
          })
        )
      );
    }
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
