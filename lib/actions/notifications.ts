"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

async function validateAccess() {
  const { userId, orgId, sessionClaims } = await auth();
  if (!userId || !orgId) {
      // Fallback for metadata if orgId not in primary session
      const metadata = (sessionClaims as any)?.publicMetadata || {};
      const resolvedOrgId = orgId || metadata.orgId;
      if (!userId || !resolvedOrgId) throw new Error("Unauthorized");
      return { user: { id: userId }, orgId: resolvedOrgId };
  }
  return { user: { id: userId }, orgId };
}

export async function getMyNotifications() {
  const { user, orgId } = await validateAccess();

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id, organizationId: orgId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        projectId: true,
        isRead: true,
        createdAt: true
      }
    }),
    prisma.notification.count({
      where: { userId: user.id, organizationId: orgId, isRead: false }
    })
  ]);

  return { notifications, unreadCount };
}

export async function markNotificationRead(notificationId: string) {
  const { user } = await validateAccess();

  await prisma.notification.update({
    where: { 
        id: notificationId,
        userId: user.id 
    },
    data: { isRead: true }
  });

  revalidatePath("/");
  return { success: true };
}

export async function markAllNotificationsRead() {
  const { user, orgId } = await validateAccess();

  await prisma.notification.updateMany({
    where: { 
        userId: user.id,
        organizationId: orgId,
        isRead: false 
    },
    data: { isRead: true }
  });

  revalidatePath("/");
  return { success: true };
}
