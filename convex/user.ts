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
        // Get the current user data to check for verification badge
        const currentUser = await ctx.db.get(args.userId);
        if (!currentUser) {
            console.error(`User ${args.userId} not found during profile update`);
            return;
        }

        // Check if the user has a verification badge in their username
        const hasVerificationBadge = currentUser.username.includes("🛡️");

        // Prepare updates
        const updates: {
            username: string;
            imageUrl: string;
            email: string;
        } = {
            imageUrl: args.imageUrl,
            email: args.email,
            username: args.username // Default value, may be overridden
        };

        // If verified, preserve the badge
        if (hasVerificationBadge) {
            // Remove any existing badge from the new username to avoid duplicates
            const cleanUsername = args.username.replace(/🛡️/g, "").trim();
            updates.username = `${cleanUsername}🛡️`;
            console.log(`Preserving verification badge for ${args.userId}, new username: ${updates.username}`);
        } else {
            updates.username = args.username;
        }

        // Update the user with new profile data from Clerk
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

// Look for any functions that might be affecting all friendships
// I need to see if there's something that could be deleting all friendships
