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
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-yt";
const HLS_REL =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-hls";
/** True ABR ladder (YT cut) hosted on GH release — not Convex static. */
const HLS_MASTER_FALLBACK = `#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=5117736,AVERAGE-BANDWIDTH=4615845,RESOLUTION=1280x800,FRAME-RATE=30,CODECS="avc1.640020"
${HLS_REL}/v0_prog.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2770368,AVERAGE-BANDWIDTH=2564916,RESOLUTION=1152x720,FRAME-RATE=30,CODECS="avc1.64001f"
${HLS_REL}/v1_prog.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1002040,AVERAGE-BANDWIDTH=590492,RESOLUTION=768x480,FRAME-RATE=30,CODECS="avc1.64001f"
${HLS_REL}/v2_prog.m3u8
`;

const CARD_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>CeilingGate · All Gas card</title>
<style>
body{margin:0;background:#070b14;color:#e8eefc;font-family:system-ui,sans-serif}
main{max-width:40rem;margin:1.5rem auto;padding:0 1rem}
h1{font-size:1.2rem}
.tag{color:#9aa8c2}
a{color:#8ec5ff}
ul{line-height:1.7}
.frame{aspect-ratio:16/9;background:#000;border-radius:8px;overflow:hidden}
video{width:100%;height:100%}
</style>
</head>
<body>
<main>
<h1>CeilingGate</h1>
<p class="tag">Sorting Machine · email a receipt → C ≤ S → GRANT/REFUSE. Listing: vibeapps.dev/s/ceilinggate-1</p>
<div class="frame"><video controls playsinline src="${RELEASE}/CeilingGate-Forge-gates-clip-YT.mp4"></video></div>
<ul>
<li><a href="/">Live app</a></li>
<li><a href="/watch.html">Demo player</a> · <a href="https://www.youtube.com/watch?v=2KsMO90LpdE">YT 2KsMO90LpdE</a></li>
<li><a href="/hls/master.m3u8">HLS playlist</a></li>
<li><a href="https://github.com/snowphamtom/ceilinggate">Repo</a></li>
<li>Inbox: ceilinggate-claims@agentmail.to</li>
</ul>
<p class="tag">1 · Demo REFUSE then 2 · Demo GRANT (above the fold). Firecrawl scrapes. OpenAI one-line after numbers — does not decide. Prefer-live YT 2KsMO90LpdE.</p>
</main>
</body>
</html>`;

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

http.route({
  path: "/card.html",
  method: "GET",
  handler: httpAction(async () =>
    new Response(CARD_HTML, {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=60",
      },
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
        decisions: rows.map((row: any) => ({
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
  if (path.endsWith(".ts")) return "video/mp2t";
  if (path.endsWith(".mp4")) return "video/mp4";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".png")) return "image/png";
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

/** I changed http.ts because /judge.html failed in firewall crawl (asset present, route missing). */
http.route({
  path: "/judge.html",
  method: "GET",
  handler: httpAction(async (ctx) => serveAsset(ctx, "/judge.html")),
});

/** I changed http.ts because /watch failed in firewall crawl (no bare alias). */
http.route({
  path: "/watch",
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
      if (
        text.includes("#EXTM3U") &&
        (text.includes("stream.m3u8") ||
          text.includes("prog.m3u8") ||
          (text.includes("#EXT-X-STREAM-INF") && !text.includes(".mp4")))
      ) {
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

for (const file of ["favicon.svg", "icons.svg", "manifest.webmanifest", "sw.js", "pwa-192.png", "pwa-512.png", "demo-poster.jpg"]) {
  http.route({
    path: `/${file}`,
    method: "GET",
    handler: httpAction(async (ctx) => serveAsset(ctx, `/${file}`)),
  });
}

http.route({
  pathPrefix: "/demo/",
  method: "GET",
  handler: httpAction(async (ctx, req) => {
    const path = new URL(req.url).pathname;
    return serveAsset(ctx, path);
  }),
});

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
