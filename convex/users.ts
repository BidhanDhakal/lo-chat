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

// Update user profile data
export const update = mutation({
    args: {
        username: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Unauthorized");
        }

        const currentUser = await getUserByClerkId(ctx, identity.subject);
        if (!currentUser) {
            throw new Error("User not found");
        }

        // Only update the fields that were provided
        const updates: Partial<{
            username: string;
            imageUrl: string;
        }> = {};

        if (args.username !== undefined) {
            // Check if the current username has a verification badge
            const hasVerificationBadge = currentUser.username.includes("🛡️");

            // If verified, preserve the badge by appending it to the new username
            if (hasVerificationBadge) {
                // Remove any existing badge from the new username to avoid duplicates
                const cleanUsername = args.username.replace(/🛡️/g, "").trim();
                updates.username = `${cleanUsername}🛡️`;
                console.log(`Preserving verification badge for ${currentUser._id}, new username: ${updates.username}`);
            } else {
                updates.username = args.username;
            }
        }

        if (args.imageUrl !== undefined) {
            updates.imageUrl = args.imageUrl;
        }

        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
            await ctx.db.patch(currentUser._id, updates);
            console.log(`User ${currentUser._id} updated their profile: ${JSON.stringify(updates)}`);
        }

        return { success: true };
    },
});

export const get = query({
    args: { clerkId: v.string() },
    handler: async (ctx, args) => {
        return await getUserByClerkId(ctx, args.clerkId);
    },
}); 