import { defineApp } from "convex/server";
import agentmail from "@agentmail/convex/convex.config";

/** Firecrawl component deferred until FIRECRAWL_API_KEY is set in Convex env. */
const app = defineApp();
app.use(agentmail);
export default app;
