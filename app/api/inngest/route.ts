import { serve } from "inngest/next";
import { inngest } from "../../../inngest/client";
import { ghostingPreventionNudge, mondayWeeklyDigest } from "../../../inngest/functions";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    ghostingPreventionNudge,
    mondayWeeklyDigest
  ],
});
