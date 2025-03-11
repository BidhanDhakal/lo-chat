import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";

export const crate = internalMutation({
    args: {
        username: v.string(),
        imageUrl: v.string(),
        clerkId: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("users", args);
    },
});

export const get = internalQuery({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return ctx.db
            .query("users")
            .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
            .unique();
    },
});

// Look for any functions that might be affecting all friendships
// I need to see if there's something that could be deleting all friendships
