import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { Id } from "./_generated/dataModel";

export const remove = mutation({
    args: {
        conversationId: v.id("conversations")
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

        console.log(`Removing friend. Current user: ${currentUser._id}`);

        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation) {
            throw new ConvexError("Conversation not found");
        }

        if (conversation.isGroup) {
            throw new ConvexError("Cannot remove friend from group conversation");
        }


        const conversationMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        console.log(`Found ${conversationMemberships.length} members in conversation ${args.conversationId}`);

        const otherMembership = conversationMemberships.find(
            (membership) => membership.memberId !== currentUser._id
        );

        if (!otherMembership) {
            throw new ConvexError("Other member not found in conversation");
        }

        const otherUser = await ctx.db.get(otherMembership.memberId);

        if (!otherUser) {
            throw new ConvexError("Other user not found");
        }

        console.log(`Removing friendship between ${currentUser._id} and ${otherUser._id}`);


        const friendship = await ctx.db
            .query("friendships")
            .withIndex("by_userIds", (q) =>
                q.eq("userId1", currentUser._id).eq("userId2", otherUser._id)
            )
            .first();

        const reverseFriendship = await ctx.db
            .query("friendships")
            .withIndex("by_userIds", (q) =>
                q.eq("userId1", otherUser._id).eq("userId2", currentUser._id)
            )
            .first();

        console.log(`Found friendship records: ${friendship ? 'Yes' : 'No'}, reverse: ${reverseFriendship ? 'Yes' : 'No'}`);


        if (friendship) {
            await ctx.db.delete(friendship._id);
            console.log(`Deleted friendship ${friendship._id}`);
        }

        if (reverseFriendship) {
            await ctx.db.delete(reverseFriendship._id);
            console.log(`Deleted reverse friendship ${reverseFriendship._id}`);
        }


        const userMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
            .collect();


        const sharedConversationIds = new Set<Id<"conversations">>();


        for (const userMembership of userMemberships) {

            const isOtherUserMember = await ctx.db
                .query("conversationMembers")
                .withIndex("by_memberId_conversationId", (q) =>
                    q.eq("memberId", otherUser._id)
                        .eq("conversationId", userMembership.conversationId))
                .first();

            if (isOtherUserMember) {

                const conv = await ctx.db.get(userMembership.conversationId);
                if (conv && !conv.isGroup) {
                    sharedConversationIds.add(userMembership.conversationId);
                }
            }
        }

        console.log(`Found ${sharedConversationIds.size} shared conversations between users`);


        for (const conversationId of sharedConversationIds) {

            const messages = await ctx.db
                .query("messages")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
                .collect();

            for (const message of messages) {
                await ctx.db.delete(message._id);
            }
            console.log(`Deleted ${messages.length} messages from conversation ${conversationId}`);


            const memberships = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversationId", (q) => q.eq("conversationId", conversationId))
                .collect();

            for (const membership of memberships) {
                await ctx.db.delete(membership._id);
            }
            console.log(`Deleted ${memberships.length} memberships from conversation ${conversationId}`);


            await ctx.db.delete(conversationId);
            console.log(`Deleted conversation ${conversationId}`);
        }


        const remainingFriendships = await ctx.db
            .query("friendships")
            .withIndex("by_status_userId1", (q) =>
                q.eq("status", "accepted").eq("userId1", currentUser._id)
            )
            .collect();

        const remainingReverseFriendships = await ctx.db
            .query("friendships")
            .withIndex("by_status_userId2", (q) =>
                q.eq("status", "accepted").eq("userId2", currentUser._id)
            )
            .collect();

        console.log(`Remaining friendships for user ${currentUser._id}: ${remainingFriendships.length + remainingReverseFriendships.length}`);

        return { success: true };
    }
});

export const getFriends = query({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const currentUser = await getUserByClerkId(ctx, identity.subject);
        if (!currentUser) {
            throw new ConvexError("User not found");
        }


        const friendships1 = await ctx.db
            .query("friendships")
            .withIndex("by_status_userId1", (q) =>
                q.eq("status", "accepted").eq("userId1", currentUser._id)
            )
            .collect();


        const friendships2 = await ctx.db
            .query("friendships")
            .withIndex("by_status_userId2", (q) =>
                q.eq("status", "accepted").eq("userId2", currentUser._id)
            )
            .collect();


        const friendsPromises = [
            ...friendships1.map(async (friendship) => {
                return await ctx.db.get(friendship.userId2);
            }),
            ...friendships2.map(async (friendship) => {
                return await ctx.db.get(friendship.userId1);
            })
        ];

        const friends = await Promise.all(friendsPromises);


        return friends.filter(friend => friend !== null);
    }
});
