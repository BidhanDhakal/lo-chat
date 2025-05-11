import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

export const updateProfile = internalMutation({
    args: {
        userId: v.id("users"),
        username: v.string(),
        imageUrl: v.string(),
        email: v.string(),
    },
    handler: async (ctx, args) => {

        const currentUser = await ctx.db.get(args.userId);
        if (!currentUser) {
            console.error(`User ${args.userId} not found during profile update`);
            return;
        }


        let processedUsername = args.username.trim();


        if (processedUsername.length > 0) {

            processedUsername = processedUsername.charAt(0).toUpperCase() + processedUsername.slice(1);
            console.log(`Capitalized username first letter: ${processedUsername}`);
        }


        const hasVerificationBadge = currentUser.username.includes("🛡️");


        const updates: {
            username: string;
            imageUrl: string;
            email: string;
        } = {
            imageUrl: args.imageUrl,
            email: args.email,
            username: processedUsername
        };


        if (hasVerificationBadge) {

            const cleanUsername = processedUsername.replace(/🛡️/g, "").trim();
            updates.username = `${cleanUsername}🛡️`;
            console.log(`Preserving verification badge for ${args.userId}, new username: ${updates.username}`);
        }


        await ctx.db.patch(args.userId, updates);

        console.log(`Updated user ${args.userId} with new profile data`);
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


