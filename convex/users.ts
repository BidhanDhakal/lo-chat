import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const create = mutation({
    args: {
        clerkId: v.string(),
        username: v.string(),
        imageUrl: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {
        const existingUser = await getUserByClerkId(ctx, args.clerkId);
        if (existingUser) {
            return existingUser._id;
        }

        const userId = await ctx.db.insert("users", {
            clerkId: args.clerkId,
            username: args.username,
            imageUrl: args.imageUrl,
            email: args.email,
        });

        return userId;
    },
});

export const get = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await getUserByClerkId(ctx, args.clerkId);
    },
}); 