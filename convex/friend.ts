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

        // Get all conversation memberships
        const conversationMemberships = await ctx.db
            .query("conversationMembers")
            .withIndex("by_conversationId", (q) => q.eq("conversationId", args.conversationId))
            .collect();

        console.log(`Found ${conversationMemberships.length} members in conversation ${args.conversationId}`);

        // Find the other member in the conversation
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

        // Delete only the specific friendship between these two users
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

        // Delete both friendship records for this specific friendship
        if (friendship) {
            await ctx.db.delete(friendship._id);
            console.log(`Deleted friendship ${friendship._id}`);
        }

        if (reverseFriendship) {
            await ctx.db.delete(reverseFriendship._id);
            console.log(`Deleted reverse friendship ${reverseFriendship._id}`);
        }

        // Delete only this specific conversation and its memberships
        for (const membership of conversationMemberships) {
            await ctx.db.delete(membership._id);
            console.log(`Deleted conversation membership ${membership._id}`);
        }

        await ctx.db.delete(args.conversationId);
        console.log(`Deleted conversation ${args.conversationId}`);

        // Check remaining friendships for this user
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

        // Get all friendships where the current user is userId1
        const friendships1 = await ctx.db
            .query("friendships")
            .withIndex("by_status_userId1", (q) =>
                q.eq("status", "accepted").eq("userId1", currentUser._id)
            )
            .collect();

        // Get all friendships where the current user is userId2
        const friendships2 = await ctx.db
            .query("friendships")
            .withIndex("by_status_userId2", (q) =>
                q.eq("status", "accepted").eq("userId2", currentUser._id)
            )
            .collect();

        // Combine the results and get the friend details
        const friendsPromises = [
            ...friendships1.map(async (friendship) => {
                return await ctx.db.get(friendship.userId2);
            }),
            ...friendships2.map(async (friendship) => {
                return await ctx.db.get(friendship.userId1);
            })
        ];

        const friends = await Promise.all(friendsPromises);

        // Filter out null values and return
        return friends.filter(friend => friend !== null);
    }
});
