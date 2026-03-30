import { auth, currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncUserAndOrg() {
  const { userId, orgId, sessionClaims } = await auth();
  
  if (!userId) return null;

  let user;
  try {
    user = await currentUser();
  } catch (error) {
    console.error("syncUserAndOrg: Failed to fetch currentUser from Clerk", error);
    return null;
  }

  if (!user) return null;

  const orgName = (sessionClaims as any)?.org_name || "My Organization";
  const metadata = user.publicMetadata as any;
  const userRole = metadata?.role || null;
  const userDept = metadata?.department || null;
  const userEmail = user.emailAddresses[0].emailAddress;

  // 1. Ensure User exists in DB
  let dbUser = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!dbUser) {
    if (!orgId) return { userId, orgId: null };

    // Ensure Org exists
    await prisma.organization.upsert({
      where: { id: orgId },
      update: { name: orgName },
      create: { id: orgId, name: orgName },
    });

    dbUser = await prisma.user.create({
      data: {
        id: userId,
        email: userEmail,
        organization: { connect: { id: orgId } },
        role: userRole,
        department: userDept,
      },
    });
  } else if (orgId) {
    // 2. Ensure Org exists and user is linked correctly
    await prisma.organization.upsert({
      where: { id: orgId },
      update: { name: orgName },
      create: { id: orgId, name: orgName },
    });

    if (
      (dbUser as any).organizationId !== orgId || 
      (dbUser as any).role !== userRole ||
      (dbUser as any).department !== userDept
    ) {
      dbUser = await prisma.user.update({
        where: { id: userId },
        data: { 
          organization: { connect: { id: orgId } },
          role: userRole,
          department: userDept,
        },
      });
    }
  }

  return { userId, orgId, user: dbUser };
}
