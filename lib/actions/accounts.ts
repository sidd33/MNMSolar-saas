"use server";

import { prisma } from "@/lib/prisma";
import { currentUser, auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { syncUserAndOrg } from "@/app/actions/sync";

/* Security Middleware and Authentication*/
async function validateAccountsAccess() {
    const [{ orgId }, user] = await Promise.all([auth(), currentUser()]);

    if (!user) throw new Error("Unauthorized");

    const metadata = user.publicMetadata as any;
    const role = metadata?.role;
    const department = metadata?.department;

    const syncResult = await syncUserAndOrg();
    const finalOrgId = syncResult?.orgId || null;

    if (role === "OWNER" || role === "SUPER_ADMIN") {
        return { user, orgId: finalOrgId, isAccounts: false, isOwner: true };
    }

    if (role !== "EMPLOYEE" || (department !== "ACCOUNTS" && department !== "ENGINEERNG" && department !== "EXECUTION")) {
        throw new Error("Access Denied: Execution Access Required");
    }

    return { user, orgId: finalOrgId, isAccounts: true, isOwner: false };
}

export async function getAccountsQueue(){
    const { orgId } = await validateAccountsAccess();
    if (!orgId) return [];

    return await prisma.project.findMany({
        where: {
            organizationId: orgId,
            stage: {
                in: [
                    "PROSPECT",
                    "FINAL_HANDOVER"
                ]
            }
        }
    })
}
