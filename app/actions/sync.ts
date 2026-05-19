import { auth, currentUser, createClerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function syncUserAndOrg() {
  const { userId, orgId, sessionClaims } = await auth();
  if (!userId) return null;

  // --- ULTRA-FAST PATH (Zero-IO) ---
  const sessionMetadata = (sessionClaims as any)?.publicMetadata || {};
  const sessionRole = sessionMetadata.role;
  const sessionDept = sessionMetadata.department;
  const sessionName = (sessionClaims as any)?.full_name || null;
  const sessionOrgId = orgId || sessionMetadata.orgId;

  if (sessionOrgId && sessionRole && sessionDept && sessionName) {
     return { userId, orgId: sessionOrgId, user: { id: userId, name: sessionName, role: sessionRole, department: sessionDept, organizationId: sessionOrgId } };
  }

  // --- SECONDARY FAST PATH (Read-Only DB) ---
  const existingUser = await prisma.user.findUnique({ 
    where: { id: userId },
    include: { organization: true } 
  });

  if (existingUser && existingUser.organizationId && existingUser.role && existingUser.department && existingUser.name) {
      return { userId, orgId: existingUser.organizationId, user: existingUser };
  }

  // --- HEAVY PATH ---
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
  const fullName = user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.emailAddresses[0].emailAddress.split('@')[0]);
  
  let resolvedOrgId = orgId || metadata?.orgId || null;

  // Layer 0: Membership Autodiscover (Clerk API)
  if (!resolvedOrgId) {
    try {
      const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
      const memberships = await clerk.users.getOrganizationMembershipList({
        userId: userId,
        limit: 1,
      });
      
      if (memberships.data.length > 0) {
        resolvedOrgId = memberships.data[0].organization.id;
        
        // BAKE it into Clerk Metadata
        await clerk.users.updateUserMetadata(userId, {
            publicMetadata: {
                orgId: resolvedOrgId
            }
        });
      }
    } catch (e) {
      console.error("Clerk SDK discovery failed:", e);
    }
  }
  
  // 1. Ensure User exists (Identity Sync) - Do this even if orgId is missing
  const dbUser = await prisma.user.upsert({
    where: { email: userEmail },
    update: {
      id: userId,
      name: fullName,
      role: userRole,
      department: userDept,
      organizationId: resolvedOrgId // May be null
    },
    create: {
      id: userId,
      email: userEmail,
      name: fullName,
      role: userRole,
      department: userDept,
      organizationId: resolvedOrgId
    },
  });

  if (!resolvedOrgId) return { userId, orgId: null, user: dbUser };

  // 2. Ensure Org exists (Org Sync)
  await prisma.organization.upsert({
    where: { id: resolvedOrgId },
    update: { name: orgName },
    create: { id: resolvedOrgId, name: orgName },
  });

  return { userId, orgId: resolvedOrgId, user: dbUser };
}
