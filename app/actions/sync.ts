import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
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
  
  const userOrgIdFromMetadata = metadata?.orgId || metadata?.organizationId || metadata?.organization_id || null;
  const userEmail = user.emailAddresses[0].emailAddress;

  // Layer 0: Membership Autodiscover
  // If no orgId in session/metadata, reach out to Clerk Backend to find their memberships
  let resolvedOrgId = orgId || userOrgIdFromMetadata;
  
  if (!resolvedOrgId) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const memberships = await clerk.users.getOrganizationMembershipList({
        userId: userId,
        limit: 1,
      });
      
      if (memberships.data.length > 0) {
        resolvedOrgId = memberships.data[0].organization.id;
      }
    } catch (e) {
      console.error("Clerk SDK discovery failed:", e);
    }
  }
  
  if (!resolvedOrgId) {
    // If we still don't have an Org ID from Clerk, check our own DB
    const existingUser = await prisma.user.findUnique({ where: { id: userId }, select: { organizationId: true } });
    resolvedOrgId = existingUser?.organizationId || null;
  }

  // 1. Ensure Org exists if we finally found an ID
  if (!resolvedOrgId) {
    // Return the user so metadata like role/dept can still be read by the dashboard logic
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    return { userId, orgId: null, user: existingUser };
  }

  await prisma.organization.upsert({
    where: { id: resolvedOrgId },
    update: { name: orgName },
    create: { id: resolvedOrgId, name: orgName },
  });

  // 2. Ensure User exists and is synced with latest metadata/org
  const dbUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      id: userId,
      role: userRole,
      department: userDept,
      organizationId: resolvedOrgId
    },
    create: {
      id: userId,
      email: userEmail,
      role: userRole,
      department: userDept,
      organizationId: resolvedOrgId
    },
  });

  return { userId, orgId: resolvedOrgId, user: dbUser };
}
