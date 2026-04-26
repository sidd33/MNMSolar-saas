"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { syncUserAndOrg } from "./sync";

export async function getMyPriorities() {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return [];

  const { userId, orgId } = sync;

  // Fetch tasks due in next 48 hours for this user in this org
  const date48HoursFromNow = new Date();
  date48HoursFromNow.setHours(date48HoursFromNow.getHours() + 48);

  const tasks = await prisma.task.findMany({
    where: {
      project: {
        organizationId: orgId,
      },
      assigneeId: userId,
      dueDate: {
        lte: date48HoursFromNow,
        gte: new Date(),
      },
      status: {
        notIn: ["DONE"]
      }
    },
    select: {
      id: true,
      title: true,
      dueDate: true,
      status: true,
      priority: true,
      project: {
        select: {
          id: true,
          name: true
        }
      }
    },
    orderBy: {
      dueDate: "asc", 
    }
  });

  return tasks;
}

export async function getTeamPulse() {
  const sync = await syncUserAndOrg();
  if (!sync?.orgId) return [];

  const { userId, orgId } = sync;

  // Fetch recently completed tasks in this org
  const pulse = await prisma.auditLog.findMany({
    where: {
      action: "CHANGED_STATUS",
      newValue: "DONE",
      task: {
        project: {
          organizationId: orgId,
        }
      }
    },
    select: {
      id: true,
      action: true,
      newValue: true,
      createdAt: true,
      user: {
        select: {
          id: true,
          email: true,
          role: true
        }
      },
      task: {
        select: {
          id: true,
          title: true,
          project: {
            select: {
              id: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 10
  });

  return pulse;
}
