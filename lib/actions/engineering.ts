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
          claimedBy: { select: { id: true, email: true } },
          assignedToEngineerId: true,
          assignedByUserId: true,
          assignedBy: { select: { id: true, email: true } },
          assignedEngineers: { select: { id: true, email: true } }
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
            claimedByUserId: true,
            claimedBy: { select: { id: true, email: true } },
            assignedToEngineerId: true,
            assignedByUserId: true,
            assignedBy: { select: { id: true, email: true } },
            assignedEngineers: { select: { id: true, email: true } },
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
            claimedByUserId: true,
            claimedBy: { select: { id: true, email: true } },
            assignedToEngineerId: true,
            assignedByUserId: true,
            assignedBy: { select: { id: true, email: true } },
            assignedEngineers: { select: { id: true, email: true } },
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

export async function claimProject(projectId: string, note?: string) {
    const { user, orgId } = await validateEngineeringAccess();
    if (!orgId) throw new Error("No organization context found");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });

    if (!project) throw new Error("Project not found");
    if (project.claimedByUserId) throw new Error("Project already claimed");

    await prisma.project.update({
        where: { id: projectId },
        data: {
            claimedByUserId: user.id,
            claimedAt: new Date(),
            poolClaimNote: note,
            poolNoteAt: new Date(),
            assignedEngineers: {
                connect: { id: user.id }
            }
        }
    });

    revalidatePath('/dashboard/engineering/survey');
    revalidatePath('/dashboard/engineering');
    return { success: true };
}

export async function unclaimProject(projectId: string, note?: string) {
    const { user, orgId } = await validateEngineeringAccess();
    if (!orgId) throw new Error("No organization context found");

    await prisma.project.update({
        where: { id: projectId },
        data: {
            claimedByUserId: null,
            claimedAt: null,
            poolReleaseNote: note,
            poolNoteAt: new Date()
        }
    });

    revalidatePath("/dashboard/engineering/pool");
    revalidatePath("/dashboard/department/Engineering");
    return { success: true };
}

export async function getEngineeringTeamMembers() {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId) return [];

    return await prisma.user.findMany({
        where: {
            organizationId: orgId,
            department: { equals: 'Engineering', mode: 'insensitive' }
        },
        select: { id: true, email: true }
    });
}

export async function assignProjectToEngineer(projectId: string, engineerIds: string[]) {
    const { user: currentUser, orgId, isOwner } = await validateEngineeringAccess();
    if (!orgId) throw new Error("No organization context found");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });

    if (!project) throw new Error("Project not found");

    // Validate all engineers
    const engineers = await prisma.user.findMany({
        where: { 
            id: { in: engineerIds }, 
            organizationId: orgId,
            department: { equals: 'Engineering', mode: 'insensitive' }
        }
    });

    if (engineers.length !== engineerIds.length) {
        throw new Error("Invalid engineer assignment: one or more targets are not valid Engineering members.");
    }

    const now = new Date();
    await prisma.project.update({
        where: { id: projectId },
        data: {
            assignedByUserId: currentUser.id,
            assignedAt: now,
            // For backward compatibility we can set the first one as primary
            assignedToEngineerId: engineerIds[0] || null,
            claimedByUserId: engineerIds[0] || null,
            claimedAt: now,
            assignedEngineers: {
                set: engineerIds.map(id => ({ id }))
            }
        }
    });

    // Create notifications for all assigned engineers
    if (engineerIds.length > 0) {
        await prisma.notification.createMany({
            data: engineerIds.map(id => ({
                userId: id,
                organizationId: orgId,
                type: 'PROJECT_ASSIGNED' as any,
                title: 'Project assigned to you',
                message: `${project.name} has been assigned to you by ${currentUser.emailAddresses[0]?.emailAddress}`,
                projectId: projectId,
                isRead: false
            }))
        });
    }

    revalidatePath('/dashboard/engineering/survey');
    revalidatePath('/dashboard/engineering');
    return { success: true };
}

export async function addProjectComment(
    projectId: string,
    content: string,
    mentionedUserIds: string[],
    isHandoff: boolean,
    handoffToUserId?: string
) {
    const { user: currentUser, orgId } = await validateEngineeringAccess();
    if (!orgId) throw new Error("No organization context found");

    if (!content.trim()) throw new Error("Comment content cannot be empty.");

    const project = await prisma.project.findUnique({
        where: { id: projectId, organizationId: orgId }
    });
    if (!project) throw new Error("Project not found");

    const comment = await prisma.projectComment.create({
        data: {
            projectId,
            userId: currentUser.id,
            content,
            mentionedUserIds: mentionedUserIds as any,
            isHandoff,
            handoffToUserId: handoffToUserId || null,
            organizationId: orgId
        }
    });

    if (isHandoff && handoffToUserId) {
        const handoffToUser = await prisma.user.findUnique({
            where: { id: handoffToUserId }
        });
        if (!handoffToUser) throw new Error("Handoff target user not found");

        await prisma.project.update({
            where: { id: projectId },
            data: {
                claimedByUserId: handoffToUserId,
                claimedAt: new Date(),
                poolClaimNote: `Handed off by ${currentUser.emailAddresses[0]?.emailAddress}: ${content}`,
                poolNoteAt: new Date()
            }
        });

        await prisma.handoffLog.create({
            data: {
                projectId,
                fromDept: 'Engineering',
                toDept: 'Engineering',
                fromStage: project.stage,
                toStage: project.stage,
                userId: currentUser.id,
                comment: `Handoff: ${content}`,
                organizationId: orgId
            }
        });

        // Notify new owner
        await prisma.notification.create({
            data: {
                userId: handoffToUserId,
                organizationId: orgId,
                type: 'PROJECT_HANDOFF' as any,
                title: 'Project handed off to you',
                message: `${currentUser.emailAddresses[0]?.emailAddress} handed off ${project.name} to you. Note: ${content}`,
                projectId: projectId,
                isRead: false
            }
        });

        // Notify old owner (currentUser)
        await prisma.notification.create({
            data: {
                userId: currentUser.id,
                organizationId: orgId,
                type: 'HANDOFF_CONFIRMED' as any,
                title: 'Handoff confirmed',
                message: `You handed off ${project.name} to ${handoffToUser.email}`,
                projectId: projectId,
                isRead: false
            }
        });
    } else if (mentionedUserIds.length > 0) {
        // Create notifications for mentions
        await prisma.notification.createMany({
            data: mentionedUserIds.map(id => ({
                userId: id,
                organizationId: orgId,
                type: 'MENTION' as any,
                title: 'You were mentioned',
                message: `${currentUser.emailAddresses[0]?.emailAddress} mentioned you in ${project.name}: "${content}"`,
                projectId: projectId,
                isRead: false
            }))
        });
    }

    revalidatePath('/dashboard/engineering/survey');
    revalidatePath('/dashboard/engineering/detailed');
    revalidatePath('/dashboard/engineering/work-order');
    return { success: true };
}

export async function getProjectComments(projectId: string) {
    const { orgId } = await validateEngineeringAccess();
    if (!orgId) return [];

    return await prisma.projectComment.findMany({
        where: { projectId, organizationId: orgId },
        orderBy: { createdAt: 'asc' },
        select: {
            id: true,
            content: true,
            isHandoff: true,
            mentionedUserIds: true,
            createdAt: true,
            handoffToUserId: true,
            user: { select: { id: true, email: true } }
        }
    });
}
