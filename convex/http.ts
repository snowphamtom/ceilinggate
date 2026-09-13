import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { api, components, internal } from "./_generated/api";
import { AgentMail } from "@agentmail/convex";
import { httpGet as opsGet, httpPost as opsPost } from "./opsChannel";

const agentmail = new AgentMail(components.agentmail, {
  onMessageReceived: internal.pipeline.onMessageReceived,
});

const http = httpRouter();

const RELEASE =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905";

const HLS_MASTER_FALLBACK = `#EXTM3U
#EXT-X-VERSION:7
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=70000,AVERAGE-BANDWIDTH=65000,RESOLUTION=1280x800,FRAME-RATE=4,CODECS="avc1.640028"
${RELEASE}/CeilingGate-AllGas-demo-60s.mp4
#EXT-X-STREAM-INF:BANDWIDTH=90000,AVERAGE-BANDWIDTH=78000,RESOLUTION=1280x800,FRAME-RATE=4,CODECS="avc1.640028"
${RELEASE}/CeilingGate-AllGas-demo.mp4
`;

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

http.route({ path: "/api/ops-messages", method: "GET", handler: opsGet });
http.route({ path: "/api/ops-messages", method: "POST", handler: opsPost });
http.route({ path: "/api/ops-messages", method: "OPTIONS", handler: opsGet });

http.route({
  path: "/api/decisions",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const rows = await ctx.runQuery(api.claims.listDecisions, { limit: 12 });
    return new Response(
      JSON.stringify({
        decisions: rows.map((row) => ({
          claim: {
            _id: row.claim._id,
            subject: row.claim.subject,
            from: row.claim.from,
            claimed: row.decision?.claimed ?? row.claim.claimed,
            interior: row.decision?.interior ?? row.claim.interior,
            sourceUrl: row.claim.sourceUrl,
          },
          decision: row.decision
            ? {
                status: row.decision.status,
                mask: row.decision.mask,
                failedIndices: row.decision.failedIndices,
                oneLine: row.decision.oneLine,
                claimed: row.decision.claimed,
                interior: row.decision.interior,
              }
            : null,
        })),
      }),
      {
        status: 200,
        headers: {
          "content-type": "application/json",
          "access-control-allow-origin": "*",
        },
      },
    );
  }),
});

function contentTypeFor(path: string, stored: string) {
  if (path.endsWith(".m3u8")) return "application/vnd.apple.mpegurl";
  if (path.endsWith(".m4s")) return "video/iso.segment";
  if (path.endsWith(".mp4")) return "video/mp4";
  return stored || "application/octet-stream";
}

async function serveAsset(ctx: any, path: string) {
  let asset = await ctx.runQuery(api.site.getAsset, { path });
  if (!asset && !path.includes(".")) {
    asset = await ctx.runQuery(api.site.getAsset, { path: "/index.html" });
  }
  if (!asset?.url) {
    return new Response("Not found", {
      status: 404,
      headers: { "cache-control": "no-store" },
    });
  }
  const res = await fetch(asset.url);
  const body = await res.arrayBuffer();
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": contentTypeFor(path, asset.contentType),
      "cache-control": path.startsWith("/assets/")
        ? "public, max-age=31536000, immutable"
        : path.startsWith("/hls/")
          ? "public, max-age=300"
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
  path: "/watch.html",
  method: "GET",
  handler: httpAction(async (ctx) => serveAsset(ctx, "/watch.html")),
});

http.route({
  path: "/hls/master.m3u8",
  method: "GET",
  handler: httpAction(async (ctx) => {
    const stored = await ctx.runQuery(api.site.getAsset, { path: "/hls/master.m3u8" });
    if (stored?.url) {
      const res = await fetch(stored.url);
      const text = await res.text();
      if (text.includes("#EXTM3U") && text.includes("stream.m3u8")) {
        return new Response(text, {
          status: 200,
          headers: {
            "content-type": "application/vnd.apple.mpegurl",
            "cache-control": "public, max-age=60",
            "access-control-allow-origin": "*",
          },
        });
      }
    }
    return new Response(HLS_MASTER_FALLBACK, {
      status: 200,
      headers: {
        "content-type": "application/vnd.apple.mpegurl",
        "cache-control": "public, max-age=60",
        "access-control-allow-origin": "*",
      },
    });
  }),
});

http.route({
  pathPrefix: "/hls/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    return serveAsset(ctx, path);
  }),
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

for (const file of ["favicon.svg", "icons.svg", "manifest.webmanifest", "sw.js", "pwa-192.png", "pwa-512.png"]) {
  http.route({
    path: `/${file}`,
    method: "GET",
    handler: httpAction(async (ctx) => serveAsset(ctx, `/${file}`)),
  });
}

http.route({
  pathPrefix: "/pwa/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    return serveAsset(ctx, path);
  }),
});

http.route({
  pathPrefix: "/forge/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    const normalized =
      path.endsWith("/") ? path + "index.html" :
      path.split("/").length === 3 ? path + "/index.html" : path;
    return serveAsset(ctx, normalized);
  }),
});

export default http;
