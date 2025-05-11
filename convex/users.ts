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


        const updates: Partial<{
            username: string;
            imageUrl: string;
        }> = {};

        if (args.username !== undefined) {

            let processedUsername = args.username.trim();


            if (processedUsername.length > 0) {

                processedUsername = processedUsername.charAt(0).toUpperCase() + processedUsername.slice(1);
            }


            const hasVerificationBadge = currentUser.username.includes("🛡️");


            if (hasVerificationBadge) {

                const cleanUsername = processedUsername.replace(/🛡️/g, "").trim();
                updates.username = `${cleanUsername}🛡️`;
                console.log(`Preserving verification badge for ${currentUser._id}, new username: ${updates.username}`);
            } else {
                updates.username = processedUsername;
            }
        }

        if (args.imageUrl !== undefined) {
            updates.imageUrl = args.imageUrl;
        }


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