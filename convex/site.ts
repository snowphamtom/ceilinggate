import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

function isCompleteSite(paths: Set<string>) {
  const hasIndex = paths.has("/index.html");
  const hasJs = [...paths].some((p) => p.startsWith("/assets/") && p.endsWith(".js"));
  const hasCss = [...paths].some((p) => p.startsWith("/assets/") && p.endsWith(".css"));
  return hasIndex && hasJs && hasCss;
}

export const publish = mutation({
  args: {
    deploymentId: v.string(),
    files: v.array(
      v.object({
        path: v.string(),
        storageId: v.id("_storage"),
        contentType: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    for (const f of args.files) {
      await ctx.db.insert("siteAssets", {
        path: f.path,
        storageId: f.storageId,
        contentType: f.contentType,
        deploymentId: args.deploymentId,
      });
    }
    const existingRows = await ctx.db
      .query("siteAssets")
      .withIndex("by_deployment", (q) => q.eq("deploymentId", args.deploymentId))
      .collect();
    const paths = new Set(existingRows.map((r) => r.path));
    if (!isCompleteSite(paths)) {
      // Do not flip siteMeta — overlapping/partial publishes must not brick /assets.
      return {
        ok: false as const,
        skippedMeta: true as const,
        count: args.files.length,
        reason: "incomplete-site-set",
      };
    }
    const existing = await ctx.db
      .query("siteMeta")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        deploymentId: args.deploymentId,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("siteMeta", {
        key: "current",
        deploymentId: args.deploymentId,
        updatedAt: Date.now(),
      });
    }
    return { ok: true as const, count: args.files.length, skippedMeta: false as const };
  },
});

export const currentDeployment = query({
  args: {},
  handler: async (ctx) => {
    const meta = await ctx.db
      .query("siteMeta")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .unique();
    return meta?.deploymentId ?? null;
  },
});

export const getAsset = query({
  args: { path: v.string() },
  handler: async (ctx, args) => {
    const path = args.path.startsWith("/") ? args.path : `/${args.path}`;
    const meta = await ctx.db
      .query("siteMeta")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .unique();
    let asset = null as null | {
      contentType: string;
      storageId: any;
    };
    if (meta) {
      asset = await ctx.db
        .query("siteAssets")
        .withIndex("by_deployment_path", (q) =>
          q.eq("deploymentId", meta.deploymentId).eq("path", path),
        )
        .order("desc")
        .first();
    }
    // Race fallback: newest row for this path if current deployment missed it.
    if (!asset) {
      asset = await ctx.db
        .query("siteAssets")
        .withIndex("by_path", (q) => q.eq("path", path))
        .order("desc")
        .first();
    }
    if (!asset) return null;
    const url = await ctx.storage.getUrl(asset.storageId);
    return { contentType: asset.contentType, url };
  },
});
