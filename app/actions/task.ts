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
      projectId: {
        in: (await prisma.project.findMany({
          where: { organizationId: orgId },
          select: { id: true }
        })).map((p: { id: string }) => p.id)
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
    include: {
      project: true,
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
        projectId: {
          in: (await prisma.project.findMany({
            where: { organizationId: orgId },
            select: { id: true }
          })).map((p: { id: string }) => p.id)
        }
      }
    },
    include: {
      user: true,
      task: {
        include: {
          project: true
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
