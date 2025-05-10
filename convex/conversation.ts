import { ConvexError, v } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

export const get = query({
    args: {
        id: v.id("conversations")
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

        const conversation = await ctx.db.get(args.id);

        if (!conversation) {
            return null;
        }

        const membership = await ctx.db.query("conversationMembers")
            .withIndex("by_memberId_conversationId", q => q.eq("memberId", currentUser._id)
                .eq("conversationId", conversation._id)).unique();

        if (!membership) {
            return null;
        }

        const allConversationMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.id))
            .collect();

        if (!conversation.isGroup) {
            const otherMembership = allConversationMemberships
                .filter(membership => membership.memberId !== currentUser._id)[0];

            const otherMemberDetails = await ctx.db.get(otherMembership.memberId);

            return {
                ...conversation,
                otherMember: {
                    ...otherMemberDetails,
                    lastSeenMessageId: otherMembership.lastSeenMessage
                },
                otherMembers: null,
            };
        }

        return conversation;
    }
});


export const getMembers = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            throw new Error("Unauthorized");
        }

        const memberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", q => q.eq("conversationId", args.conversationId))
            .collect();

        const members = await Promise.all(
            memberships.map(async (membership) => {
                const user = await ctx.db.get(membership.memberId);
                return {
                    userId: user?._id,
                    username: user?.username,
                    imageUrl: user?.imageUrl,
                };
            })
        );

        return members;
    },
});
