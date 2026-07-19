"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";
import { syncUserAndOrg } from "@/app/actions/sync";

export async function getInventoryItems(organizationId?: string) {
  try {
    let orgId = organizationId;
    if (!orgId) {
      const authData = await auth();
      orgId = authData.orgId || (authData.sessionClaims as any)?.publicMetadata?.orgId;
      if (!orgId) {
         const sync = await syncUserAndOrg();
         orgId = sync?.orgId;
      }
    }
    
    if (!orgId) return { success: false, error: "No organization found" };

    const items = await prisma.inventoryItem.findMany({
      where: { organizationId: orgId },
      orderBy: { name: 'asc' },
    });
    return { success: true, data: items };
  } catch (error: any) {
    console.error("Error fetching inventory items:", error);
    return { success: false, error: error.message };
  }
}

export async function createInventoryItem(data: any) {
  try {
    const { organizationId, name, category, trackingType, unit, sku } = data;
    
    const newItem = await prisma.$transaction(async (tx) => {
      const item = await tx.inventoryItem.create({
        data: {
          organizationId,
          name,
          category,
          trackingType,
          unit,
          sku: sku || undefined,
          quantityInStock: data.quantityInStock ? parseFloat(data.quantityInStock) : 0,
        },
      });

      if (data.quantityInStock && parseFloat(data.quantityInStock) > 0) {
        await tx.inventoryTransaction.create({
          data: {
            itemId: item.id,
            quantity: parseFloat(data.quantityInStock),
            type: "IN",
            notes: "Initial stock entry",
          }
        });
      }

      return item;
    });

    revalidatePath("/dashboard/procurement/inventory");
    return { success: true, data: newItem };
  } catch (error: any) {
    console.error("Error creating inventory item:", error);
    return { success: false, error: error.message };
  }
}

export async function adjustStock(data: any) {
  try {
    const { itemId, quantity, type, notes, referenceId } = data;
    
    if (!itemId || !quantity || !type) {
      throw new Error("Missing required fields");
    }

    const result = await prisma.$transaction(async (tx) => {
      const transaction = await tx.inventoryTransaction.create({
        data: {
          itemId,
          quantity: type === "OUT" ? -Math.abs(quantity) : Math.abs(quantity),
          type,
          notes,
          referenceId,
        },
      });

      const item = await tx.inventoryItem.update({
        where: { id: itemId },
        data: {
          quantityInStock: {
            increment: transaction.quantity,
          },
        },
      });

      return { transaction, item };
    });

    revalidatePath("/dashboard/procurement/inventory");
    return { success: true, data: result };
  } catch (error: any) {
    console.error("Error adjusting stock:", error);
    return { success: false, error: error.message };
  }
}

export async function getAllocations(organizationId: string) {
  try {
    // Get OUT transactions that have a referenceId (project ID)
    const transactions = await prisma.inventoryTransaction.findMany({
      where: {
        type: "OUT",
        referenceId: { not: null },
        item: {
          organizationId: organizationId
        }
      },
      include: {
        item: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    // Extract unique project IDs
    const projectIds = [...new Set(transactions.map(t => t.referenceId).filter(Boolean) as string[])];

    // Fetch those projects
    const projects = await prisma.project.findMany({
      where: { id: { in: projectIds } },
      select: { id: true, name: true, clientName: true }
    });

    const projectMap = projects.reduce((acc, p) => {
      acc[p.id] = p;
      return acc;
    }, {} as Record<string, any>);

    // Combine data
    const allocations = transactions.map(t => ({
      ...t,
      project: projectMap[t.referenceId!] || null
    }));

    return { success: true, data: allocations };
  } catch (error: any) {
    console.error("Error fetching allocations:", error);
    return { success: false, error: error.message };
  }
}
