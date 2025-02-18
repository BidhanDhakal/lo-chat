import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const remove = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }
        const currentUser = await getUserByClerkId(ctx, identity.subject);

        if (!currentUser) {
            throw new ConvexError("User not found");
        }

        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation) {
            throw new ConvexError("Conversation not found");
        }


        const membership = await ctx.db.query("conversationMembers")
        .withIndex("by_memberId_conversationId", q => q.eq("memberId", currentUser._id))
        .collect();


        if(!membership || membership.length === 2) {
            throw new ConvexError("you aren't a member of this conversation");
        }

        const friendship = await ctx.db.query("friends")
        .withIndex("by_conversationId", (q) => { return q.eq("conversationId", args.conversationId)})
        .unique();

        if(!friendship){
            throw new ConvexError("Friendship not found");
        }

        const messages = await ctx.db.query("messages")
        .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
        .collect();

        await ctx.db.delete(args.conversationId);

        await ctx.db.delete(friendship._id);

        await Promise.all(membership.map(async (membership) => {
            await ctx.db.delete(membership._id);
        }));

        await Promise.all(messages.map(async (message) => {
            await ctx.db.delete(message._id);
        }));

        }
    });
