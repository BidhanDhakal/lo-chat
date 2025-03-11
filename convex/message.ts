import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const create = mutation({
    args: {
        conversationId: v.id("conversations"),
        type: v.string(),
        content: v.string(),
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

        const membership = await ctx.db.query("conversationMembers")
        .withIndex("by_memberId_conversationId", q => q.eq("memberId", currentUser._id)
        .eq("conversationId", args.conversationId)).unique();

        if(!membership) {
            throw new ConvexError("you aren't a member of this conversation");
        }
        const message = await ctx.db.insert("messages", {
            senderId: currentUser._id,
            isDeleted: false,
            conversationId: args.conversationId,
            type: args.type,
            content: args.content
        });
        await ctx.db.patch(args.conversationId, {lastMessageId: message});

        return message;
    }
})