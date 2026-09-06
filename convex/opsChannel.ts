import { httpAction, mutation, query } from "./_generated/server";
import { api } from "./_generated/api";
import { v } from "convex/values";

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "content-type, authorization",
};

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...CORS },
  });
}

function checkToken(req: Request): { ok: boolean; authed: boolean } {
  const expected = process.env.OPS_TOKEN;
  const hdr = req.headers.get("authorization") ?? "";
  const got = hdr.toLowerCase().startsWith("bearer ")
    ? hdr.slice(7).trim()
    : "";
  if (!expected) return { ok: true, authed: false };
  if (got && got === expected) return { ok: true, authed: true };
  return { ok: false, authed: false };
}

export const list = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const n = Math.min(Math.max(args.limit ?? 100, 1), 200);
    const rows = await ctx.db.query("opsMessages").order("asc").take(n);
    return {
      messages: rows.map((r) => ({
        _id: r._id,
        _creationTime: r._creationTime,
        from: r.from,
        body: r.body,
        createdAt: r.createdAt,
        kind: r.kind,
        authed: r.authed,
      })),
    };
  },
});

export const post = mutation({
  args: {
    from: v.string(),
    body: v.string(),
    kind: v.optional(v.string()),
    authed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const from = args.from.trim().toLowerCase();
    if (from !== "taylor" && from !== "manager") {
      throw new Error("from must be taylor or manager");
    }
    const body = args.body.trim();
    if (!body) throw new Error("Message body is required");
    if (body.length > 8000) throw new Error("body too long");
    const kind = (args.kind ?? "note").slice(0, 32);
    const id = await ctx.db.insert("opsMessages", {
      from,
      body,
      kind,
      authed: args.authed,
      createdAt: Date.now(),
    });
    return { ok: true, id };
  },
});

export const httpGet = httpAction(async (ctx, req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "100");
  const data = await ctx.runQuery(api.opsChannel.list, {
    limit: Number.isFinite(limit) ? limit : 100,
  });
  return json(data);
});

export const httpPost = httpAction(async (ctx, req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: CORS });
  }
  const gate = checkToken(req);
  if (!gate.ok) return json({ error: "unauthorized" }, 401);
  let parsed: { from?: string; body?: string; kind?: string } = {};
  try {
    parsed = await req.json();
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  try {
    const result = await ctx.runMutation(api.opsChannel.post, {
      from: String(parsed.from ?? ""),
      body: String(parsed.body ?? ""),
      kind: parsed.kind ? String(parsed.kind) : undefined,
      authed: gate.authed,
    });
    return json(result);
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "post failed" }, 400);
  }
});
