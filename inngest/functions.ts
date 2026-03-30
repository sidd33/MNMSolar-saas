import { inngest } from "./client";
import { prisma } from "@/lib/prisma";

export const ghostingPreventionNudge = inngest.createFunction(
  { id: "ghosting-prevention-nudge" },
  { event: "app/task.created" },
  async ({ event, step }) => {
    // Wait for 3 days
    await step.sleep("wait-3-days", "3d");

    // Check if the task is still in "TODO" status
    const taskStatus = await step.run("check-task-status", async () => {
      const task = await prisma.task.findUnique({
        where: { id: event.data.taskId }
      });
      return task?.status;
    });

    if (taskStatus === "TODO") {
      await step.run("send-nudge-email", async () => {
        // Here we would integrate with Resend or Sendgrid
        console.log(`[Automated Nudge] Task ${event.data.taskId} has been in TODO for 3 days.`);
      });
    }
  }
);

export const mondayWeeklyDigest = inngest.createFunction(
  { id: "weekly-manager-digest" },
  { cron: "0 8 * * 1" }, // Every Monday at 8:00 AM
  async ({ step }) => {
    await step.run("aggregate-and-send", async () => {
      console.log("[Weekly Digest] Aggregating overdue tasks...");
      // Logic to fetch overdue tasks and email Department Heads
      // Implementation omitted for brevity
    });
  }
);
