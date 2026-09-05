import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => await ctx.storage.generateUploadUrl(),
});

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
    return { ok: true as const, count: args.files.length };
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
    const meta = await ctx.db
      .query("siteMeta")
      .withIndex("by_key", (q) => q.eq("key", "current"))
      .unique();
    if (!meta) return null;
    const path = args.path.startsWith("/") ? args.path : `/${args.path}`;
    const asset = await ctx.db
      .query("siteAssets")
      .withIndex("by_deployment_path", (q) =>
        q.eq("deploymentId", meta.deploymentId).eq("path", path),
      )
      .unique();
    if (!asset) return null;
    const url = await ctx.storage.getUrl(asset.storageId);
    return { contentType: asset.contentType, url };
  },
});
