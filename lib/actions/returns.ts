"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function processMaterialReturn(data: {
  projectId: string;
  items: { itemId: string; quantity: number; notes: string }[];
  loggedByUserId: string;
  organizationId: string;
  returnNote: string;
}) {
  try {
    const { projectId, items, loggedByUserId, organizationId, returnNote } = data;

    await prisma.$transaction(async (tx) => {
      // 1. Create a Return Challan to log the return
      const challanCount = await tx.challan.count({ where: { organizationId } });
      const returnNumber = `RET-${new Date().getFullYear()}-${(challanCount + 1).toString().padStart(4, '0')}`;
      
      const challan = await tx.challan.create({
        data: {
          projectId,
          challanNumber: returnNumber,
          type: "RETURN",
          items: items as any,
          loggedByUserId,
          organizationId,
        }
      });

      // 2. Add each returned item back into inventory
      for (const item of items) {
        // Find existing inventory item
        const inventoryItem = await tx.inventoryItem.findUnique({
          where: { id: item.itemId }
        });

        if (inventoryItem) {
          // Increment stock
          await tx.inventoryItem.update({
            where: { id: item.itemId },
            data: {
              quantityInStock: { increment: item.quantity }
            }
          });

          // Log transaction
          await tx.inventoryTransaction.create({
            data: {
              itemId: item.itemId,
              quantity: item.quantity,
              type: "IN",
              referenceId: projectId,
              notes: `Returned from project via ${returnNumber}. Note: ${item.notes || returnNote}`
            }
          });
        }
      }
    });

    revalidatePath("/dashboard/procurement/inventory");
    return { success: true };
  } catch (error: any) {
    console.error("Return error:", error);
    return { success: false, error: error.message };
  }
}

export async function getReturnHistory(organizationId: string) {
  try {
    const returns = await prisma.challan.findMany({
      where: { organizationId, type: "RETURN" },
      include: {
        project: { select: { name: true, clientName: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return { success: true, data: returns };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
