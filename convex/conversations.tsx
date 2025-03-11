import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
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
                        lastMessage = await getLastMessageDetails({ctx, id: conversation.lastMessageId});
                    } catch (error) {
                        console.error("Error getting last message details:", error);
                        // Continue with lastMessage = null
                    }

                    // Handle group conversations
                    if (conversation.isGroup) {
                        return {conversation, lastMessage};
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

                        return {conversation, otherMember, lastMessage};
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

const getLastMessageDetails = async ({ctx, id} : {ctx: QueryCtx | MutationCtx; id: Id<"messages"> | undefined}) => {
    if(!id) return null;

    try {
        const messages = await ctx.db.get(id);
        if(!messages) return null;

        let sender = null;
        try {
            sender = await ctx.db.get(messages.senderId);
        } catch (error) {
            console.error("Error fetching message sender:", error);
            return null;
        }

        if(!sender) return null;
        
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
    switch(type){
        case "text":
            return content;
        default:
            return "[Non-text]";
    }
}