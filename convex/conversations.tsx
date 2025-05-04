import { ConvexError, v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Define types for our data structures
type ConversationWithTimestamp = {
    _id: Id<"conversations">;
    _creationTime: number;
    isGroup: boolean;
    name?: string;
    lastMessageId?: Id<"messages">;
    lastMessageTimestamp: number;
    [key: string]: any; // For any other properties
};

type ConversationDetails = {
    conversation: ConversationWithTimestamp;
    otherMember?: any;
    lastMessage: any;
    groupMembers?: string[];
} | null;

export const get = query({
    args: {},
    handler: async (ctx) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }
            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get all conversation memberships for the current user
            const conversationMemberships = await ctx.db.query("conversationMembers")
                .withIndex("by_memberId", (q) => q.eq("memberId", currentUser._id))
                .collect();

            // Safely map over memberships and handle any errors
            const conversationsPromises = conversationMemberships.map(async (membership) => {
                try {
                    // Check if the membership has a valid conversationId
                    if (!membership.conversationId) {
                        return null;
                    }

                    // Try to get the conversation
                    let conversation;
                    try {
                        conversation = await ctx.db.get(membership.conversationId);
                    } catch (error) {
                        console.error("Error fetching conversation:", error);
                        return null;
                    }

                    // If conversation doesn't exist, return null
                    if (!conversation) {
                        return null;
                    }

                    // Safely get the last message timestamp
                    let lastMessageTimestamp = 0;
                    if (conversation.lastMessageId) {
                        try {
                            const lastMessage = await ctx.db.get(conversation.lastMessageId);
                            if (lastMessage) {
                                lastMessageTimestamp = lastMessage._creationTime;
                            }
                        } catch (error) {
                            console.error("Error fetching last message:", error);
                            // Continue with timestamp = 0
                        }
                    }

                    return {
                        ...conversation,
                        lastMessageTimestamp
                    };
                } catch (error) {
                    console.error("Error processing conversation membership:", error);
                    return null;
                }
            });

            // Wait for all promises to resolve
            let conversations: (ConversationWithTimestamp | null)[] = [];
            try {
                conversations = await Promise.all(conversationsPromises);
            } catch (error) {
                console.error("Error in Promise.all for conversations:", error);
                conversations = [];
            }

            // Filter out null conversations
            const filteredConversations: ConversationWithTimestamp[] = conversations.filter(
                (conversation): conversation is ConversationWithTimestamp => conversation !== null
            );

            // Sort conversations by the actual message timestamp
            // TypeScript now knows these are non-null values
            filteredConversations.sort((a, b) => {
                return b.lastMessageTimestamp - a.lastMessageTimestamp;
            });

            // Safely map over conversations to get details
            const detailsPromises = filteredConversations.map(async (conversation) => {
                try {
                    // Skip if conversation is null (this check is redundant now but kept for safety)
                    if (!conversation) return null;

                    // Get all memberships for this conversation
                    let allconversationMemberships = [];
                    try {
                        allconversationMemberships = await ctx.db.query("conversationMembers")
                            .withIndex("by_conversationId", (q) => q.eq("conversationId", conversation._id))
                            .collect();
                    } catch (error) {
                        console.error("Error fetching conversation memberships:", error);
                        return null;
                    }

                    // Get last message details
                    let lastMessage = null;
                    try {
                        lastMessage = await getLastMessageDetails({ ctx, id: conversation.lastMessageId });
                    } catch (error) {
                        console.error("Error getting last message details:", error);
                        // Continue with lastMessage = null
                    }

                    // Handle group conversations
                    if (conversation.isGroup) {
                        // Get all members' usernames for group chats
                        const memberUsernames = await Promise.all(
                            allconversationMemberships.map(async (membership) => {
                                try {
                                    const member = await ctx.db.get(membership.memberId);
                                    return member?.username || null;
                                } catch (error) {
                                    console.error("Error fetching member:", error);
                                    return null;
                                }
                            })
                        );

                        // Filter out null values and return the conversation with members
                        const groupMembers = memberUsernames.filter((username): username is string => username !== null);
                        return { conversation, lastMessage, groupMembers };
                    }
                    // Handle direct conversations
                    else {
                        // Find the other member in the conversation
                        const otherMemberships = allconversationMemberships.filter(
                            (membership) => membership.memberId !== currentUser._id
                        );

                        // Check if there's another member
                        if (!otherMemberships || otherMemberships.length === 0) {
                            return null;
                        }

                        const otherMembership = otherMemberships[0];

                        // Try to get the other member's details
                        let otherMember = null;
                        try {
                            otherMember = await ctx.db.get(otherMembership.memberId);
                        } catch (error) {
                            console.error("Error fetching other member:", error);
                            return null;
                        }

                        // Check if otherMember exists
                        if (!otherMember) {
                            return null;
                        }

                        return { conversation, otherMember, lastMessage };
                    }
                } catch (error) {
                    console.error("Error fetching conversation details:", error);
                    return null;
                }
            });

            // Wait for all detail promises to resolve
            let conversationsWithDetails: ConversationDetails[] = [];
            try {
                conversationsWithDetails = await Promise.all(detailsPromises);
            } catch (error) {
                console.error("Error in Promise.all for conversation details:", error);
                conversationsWithDetails = [];
            }

            // Filter out null results
            return conversationsWithDetails.filter((item): item is NonNullable<ConversationDetails> => item !== null);

        } catch (error) {
            console.error("Top-level error in conversations.get:", error);
            return [];
        }
    },
});

const getLastMessageDetails = async ({ ctx, id }: { ctx: QueryCtx | MutationCtx; id: Id<"messages"> | undefined }) => {
    if (!id) return null;

    try {
        const messages = await ctx.db.get(id);
        if (!messages) return null;

        let sender = null;
        try {
            sender = await ctx.db.get(messages.senderId);
        } catch (error) {
            console.error("Error fetching message sender:", error);
            return null;
        }

        if (!sender) return null;

        const content = getMessageContent(messages.type, messages.content as unknown as string);

        return {
            content,
            sender: sender.username,
        };
    } catch (error) {
        console.error("Error in getLastMessageDetails:", error);
        return null;
    }
}

const getMessageContent = (type: string, content: string) => {
    switch (type) {
        case "text":
            return content;
        case "image":
            return "has sent an image.";
        default:
            return "has sent a document.";
    }
}

export const createGroup = mutation({
    args: {
        name: v.string(),
        memberIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Create the group conversation with creator ID
            const conversationId = await ctx.db.insert("conversations", {
                isGroup: true,
                name: args.name,
                lastMessageId: undefined, // No messages initially
                creatorId: currentUser._id, // Set the creator ID
            });

            // Add the current user to the conversation
            await ctx.db.insert("conversationMembers", {
                conversationId,
                memberId: currentUser._id,
            });

            // Add all other members to the conversation
            for (const memberId of args.memberIds) {
                await ctx.db.insert("conversationMembers", {
                    conversationId,
                    memberId,
                });
            }

            return conversationId;
        } catch (error) {
            console.error("Error creating group:", error);
            throw new ConvexError("Failed to create group");
        }
    },
});

// Leave group - any member including creator can leave a group
export const leaveGroup = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get conversation
            const conversation = await ctx.db.get(args.conversationId);

            if (!conversation) {
                throw new ConvexError("Conversation not found");
            }

            // Check if it's a group
            if (!conversation.isGroup) {
                throw new ConvexError("This is not a group conversation");
            }

            // Find membership
            const membership = await ctx.db
                .query("conversationMembers")
                .withIndex("by_memberId_conversationId", q =>
                    q.eq("memberId", currentUser._id).eq("conversationId", args.conversationId)
                )
                .unique();

            if (!membership) {
                throw new ConvexError("You are not a member of this group");
            }

            // Check if current user is the creator
            const isCreator = conversation.creatorId?.toString() === currentUser._id.toString();

            if (isCreator) {
                // Get all other members
                const otherMembers = await ctx.db
                    .query("conversationMembers")
                    .withIndex("by_conversationId", q => q.eq("conversationId", args.conversationId))
                    .filter(q => q.neq(q.field("memberId"), currentUser._id))
                    .collect();

                if (otherMembers.length === 0) {
                    // If no other members, delete the group
                    await deleteGroupHandler(ctx, args);
                    return { success: true };
                }

                // Get the new owner's ID
                const newOwnerId = otherMembers[0].memberId;

                // Transfer ownership to the first other member by updating the conversation document
                const conversation = await ctx.db.get(args.conversationId);
                if (conversation) {
                    // Create a new document with updated creatorId
                    await ctx.db.patch(args.conversationId, {
                        creatorId: newOwnerId
                    });
                }
            }

            // Remove the member
            await ctx.db.delete(membership._id);

            return { success: true };
        } catch (error) {
            console.error("Error leaving group:", error);
            throw new ConvexError("Failed to leave group");
        }
    }
});

// Helper function to handle group deletion logic
async function deleteGroupHandler(ctx: MutationCtx, args: { conversationId: Id<"conversations"> }) {
    // Delete all members
    const members = await ctx.db
        .query("conversationMembers")
        .withIndex("by_conversationId", q => q.eq("conversationId", args.conversationId))
        .collect();

    for (const member of members) {
        await ctx.db.delete(member._id);
    }

    // Delete all messages
    const messages = await ctx.db
        .query("messages")
        .withIndex("by_conversationId", q => q.eq("conversationId", args.conversationId))
        .collect();

    for (const message of messages) {
        await ctx.db.delete(message._id);
    }

    // Delete the conversation
    await ctx.db.delete(args.conversationId);

    return { success: true };
}

// Delete group - only the creator can delete the entire group
export const deleteGroup = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get conversation
            const conversation = await ctx.db.get(args.conversationId);

            if (!conversation) {
                throw new ConvexError("Conversation not found");
            }

            // Check if it's a group
            if (!conversation.isGroup) {
                throw new ConvexError("This is not a group conversation");
            }

            // Check if current user is the creator
            if (conversation.creatorId?.toString() !== currentUser._id.toString()) {
                throw new ConvexError("Only the group creator can delete the group");
            }

            return await deleteGroupHandler(ctx, args);
        } catch (error) {
            console.error("Error deleting group:", error);
            throw new ConvexError("Failed to delete group");
        }
    }
});

// Check if user is group creator
export const isGroupCreator = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();

        if (!identity) {
            return false;
        }

        const currentUser = await getUserByClerkId(ctx, identity.subject);

        if (!currentUser) {
            return false;
        }

        const conversation = await ctx.db.get(args.conversationId);

        if (!conversation || !conversation.isGroup) {
            return false;
        }

        return conversation.creatorId?.toString() === currentUser._id.toString();
    }
});

export const createGroupChat = mutation({
    args: {
        name: v.string(),
        memberIds: v.array(v.string()),
        imageUrl: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new ConvexError("Unauthorized");
        }

        const currentUser = await getUserByClerkId(ctx, identity.subject);
        if (!currentUser) {
            throw new ConvexError("User not found");
        }

        // Create the group conversation
        const conversationId = await ctx.db.insert("conversations", {
            isGroup: true,
            name: args.name,
            creatorId: currentUser._id,
            imageUrl: args.imageUrl,
        });

        // Add the current user to the conversation
        await ctx.db.insert("conversationMembers", {
            conversationId,
            memberId: currentUser._id,
        });

        // Add all selected members to the conversation
        for (const memberId of args.memberIds) {
            const member = await ctx.db.get(memberId as Id<"users">);
            if (member) {
                await ctx.db.insert("conversationMembers", {
                    conversationId,
                    memberId: member._id,
                });
            }
        }

        return conversationId;
    },
});

// Update group name - only the group creator can update the name
export const updateGroupName = mutation({
    args: {
        conversationId: v.id("conversations"),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get conversation
            const conversation = await ctx.db.get(args.conversationId);

            if (!conversation) {
                throw new ConvexError("Conversation not found");
            }

            // Check if it's a group
            if (!conversation.isGroup) {
                throw new ConvexError("This is not a group conversation");
            }

            // Check if current user is the creator
            if (conversation.creatorId?.toString() !== currentUser._id.toString()) {
                throw new ConvexError("Only the group creator can update the group name");
            }

            // Update group name
            await ctx.db.patch(args.conversationId, {
                name: args.name
            });

            return { success: true };
        } catch (error) {
            console.error("Error updating group name:", error);
            throw new ConvexError("Failed to update group name");
        }
    }
});

// Update group image - only the group creator can update the image
export const updateGroupImage = mutation({
    args: {
        conversationId: v.id("conversations"),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get conversation
            const conversation = await ctx.db.get(args.conversationId);

            if (!conversation) {
                throw new ConvexError("Conversation not found");
            }

            // Check if it's a group
            if (!conversation.isGroup) {
                throw new ConvexError("This is not a group conversation");
            }

            // Check if current user is the creator
            if (conversation.creatorId?.toString() !== currentUser._id.toString()) {
                throw new ConvexError("Only the group creator can update the group image");
            }

            // Update group image
            await ctx.db.patch(args.conversationId, {
                imageUrl: args.imageUrl
            });

            return { success: true };
        } catch (error) {
            console.error("Error updating group image:", error);
            throw new ConvexError("Failed to update group image");
        }
    }
});

// Add members to group - only the group creator can add members
export const addGroupMembers = mutation({
    args: {
        conversationId: v.id("conversations"),
        memberIds: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get conversation
            const conversation = await ctx.db.get(args.conversationId);

            if (!conversation) {
                throw new ConvexError("Conversation not found");
            }

            // Check if it's a group
            if (!conversation.isGroup) {
                throw new ConvexError("This is not a group conversation");
            }

            // Check if current user is the creator
            if (conversation.creatorId?.toString() !== currentUser._id.toString()) {
                throw new ConvexError("Only the group creator can add members to the group");
            }

            // Get existing members
            const existingMembers = await ctx.db
                .query("conversationMembers")
                .withIndex("by_conversationId", q => q.eq("conversationId", args.conversationId))
                .collect();

            const existingMemberIds = existingMembers.map(member => member.memberId.toString());

            // Add new members
            let addedCount = 0;
            for (const memberId of args.memberIds) {
                const member = await ctx.db.get(memberId as Id<"users">);
                if (member && !existingMemberIds.includes(member._id.toString())) {
                    await ctx.db.insert("conversationMembers", {
                        conversationId: args.conversationId,
                        memberId: member._id,
                    });
                    addedCount++;
                }
            }

            return { success: true, addedCount };
        } catch (error) {
            console.error("Error adding group members:", error);
            throw new ConvexError("Failed to add members to group");
        }
    }
});

// Remove a member from a group - only the group creator can remove other members
export const removeGroupMember = mutation({
    args: {
        conversationId: v.id("conversations"),
        memberId: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            const identity = await ctx.auth.getUserIdentity();

            if (!identity) {
                throw new Error("Unauthorized");
            }

            const currentUser = await getUserByClerkId(ctx, identity.subject);

            if (!currentUser) {
                throw new ConvexError("User not found");
            }

            // Get conversation
            const conversation = await ctx.db.get(args.conversationId);

            if (!conversation) {
                throw new ConvexError("Conversation not found");
            }

            // Check if it's a group
            if (!conversation.isGroup) {
                throw new ConvexError("This is not a group conversation");
            }

            // Check if current user is the creator
            if (conversation.creatorId?.toString() !== currentUser._id.toString()) {
                throw new ConvexError("Only the group creator can remove members from the group");
            }

            // Check if trying to remove creator (which is not allowed)
            const memberToRemove = await ctx.db.get(args.memberId as Id<"users">);
            if (!memberToRemove) {
                throw new ConvexError("Member not found");
            }

            if (memberToRemove._id.toString() === conversation.creatorId?.toString()) {
                throw new ConvexError("Cannot remove the group creator");
            }

            // Find the membership to remove
            const membership = await ctx.db
                .query("conversationMembers")
                .withIndex("by_memberId_conversationId", q =>
                    q.eq("memberId", memberToRemove._id).eq("conversationId", args.conversationId)
                )
                .unique();

            if (!membership) {
                throw new ConvexError("This user is not a member of the group");
            }

            // Remove the member by deleting their membership
            await ctx.db.delete(membership._id);

            return { success: true };
        } catch (error) {
            console.error("Error removing group member:", error);
            throw new ConvexError("Failed to remove member from group");
        }
    }
});