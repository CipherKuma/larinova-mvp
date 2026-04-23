import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import { intakeAgent } from "@/lib/agents/intake";
import { dispatcherAgent } from "@/lib/agents/dispatcher";
import { wellnessSendAgent, wellnessReplyAgent } from "@/lib/agents/wellness";
import { narrativeAgent } from "@/lib/agents/narrative";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    intakeAgent,
    dispatcherAgent,
    wellnessSendAgent,
    wellnessReplyAgent,
    narrativeAgent,
  ],
});
