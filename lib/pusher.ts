import Pusher from "pusher";

export const pusherServer = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function triggerPipelineUpdate(orgId: string, message: string = "Pipeline updated") {
  try {
    await pusherServer.trigger(`org-${orgId}`, "pipeline-update", {
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Pusher Trigger Failed:", error);
  }
}
