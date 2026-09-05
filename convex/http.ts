import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { AgentMail } from "@agentmail/convex";

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.pipeline.onMessageReceived,
});

const http = httpRouter();

http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) =>
    agentmail.handleWebhook(ctx as any, req),
  ),
});

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () =>
    new Response(JSON.stringify({ ok: true, app: "CeilingGate" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    }),
  ),
});

async function serveAsset(ctx: any, path: string) {
  let asset = await ctx.runQuery(api.site.getAsset, { path });
  if (!asset && !path.includes(".")) {
    asset = await ctx.runQuery(api.site.getAsset, { path: "/index.html" });
  }
  if (!asset?.url) {
    return new Response("Not found", { status: 404 });
  }
  const res = await fetch(asset.url);
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": asset.contentType,
      "cache-control": path.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : "public, max-age=60",
    },
  });
}

http.route({
  path: "/",
  method: "GET",
  handler: httpAction(async (ctx) => serveAsset(ctx, "/index.html")),
});

http.route({
  pathPrefix: "/assets/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    return serveAsset(ctx, path);
  }),
});

http.route({
  pathPrefix: "/fixtures/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    return serveAsset(ctx, path);
  }),
});

http.route({
  pathPrefix: "/receipts/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    return serveAsset(ctx, path);
  }),
});

// SPA fallbacks for common root files
for (const file of ["favicon.svg", "icons.svg"]) {
  http.route({
    path: `/${file}`,
    method: "GET",
    handler: httpAction(async (ctx) => serveAsset(ctx, `/${file}`)),
  });
}

export default http;
