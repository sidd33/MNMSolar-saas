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

  // 1. Ensure Org exists if we have an orgId
  if (orgId) {
    await prisma.organization.upsert({
      where: { id: orgId },
      update: { name: orgName },
      create: { id: orgId, name: orgName },
    });
  }

  // 2. Ensure User exists and is synced with latest metadata/org
  const dbUser = await prisma.user.upsert({
    where: { id: userId },
    update: {
      role: userRole,
      department: userDept,
      ...(orgId ? { organizationId: orgId } : {})
    },
    create: {
      id: userId,
      email: userEmail,
      role: userRole,
      department: userDept,
      ...(orgId ? { organizationId: orgId } : {})
    },
  });

  return { userId, orgId, user: dbUser };
}
