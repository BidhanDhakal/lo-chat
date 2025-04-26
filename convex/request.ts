import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { Id } from "./_generated/dataModel";

// Define proper types for the request object
type RequestWithSender = {
  _id: Id<"requests">;
  _creationTime: number;
  senderId: Id<"users">;
  receiverId: Id<"users">;
  status: string;
  sender?: {
    _id: Id<"users">;
    username?: string;
    imageUrl?: string;
    [key: string]: any;
  };
};

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Unauthorized");
    }

    const currentUser = await getUserByClerkId(ctx, identity.subject);

    if (!currentUser) {
      throw new ConvexError("User not found");
    }

    const requests = await ctx.db
      .query("requests")
      .withIndex("by_receiverId_status", (q) =>
        q.eq("receiverId", currentUser._id).eq("status", "pending")
      )
      .collect();

    const requestsWithSender: RequestWithSender[] = await Promise.all(
      requests.map(async (request) => {
        const sender = await ctx.db.get(request.senderId);
        return {
          ...request,
          sender: sender || undefined,
        };
      })
    );

    return requestsWithSender;
  },
});

export const create = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    if (args.email === identity.email) throw new ConvexError("Can't send a request to yourself");

    const currentUser = await getUserByClerkId(ctx, identity.subject);
    if (!currentUser) throw new ConvexError("User not found");

    const receiver = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    if (!receiver) throw new ConvexError("User could not be found");

    // Check if a request already exists from current user to receiver
    const requestAlreadySent = await ctx.db
      .query("requests")
      .withIndex("by_senderId_receiverId", (q) =>
        q.eq("senderId", currentUser._id).eq("receiverId", receiver._id))
      .unique();

    if (requestAlreadySent) throw new ConvexError("Request already sent");

    // Check if a request already exists from receiver to current user
    const requestAlreadyReceived = await ctx.db
      .query("requests")
      .withIndex("by_senderId_receiverId", (q) =>
        q.eq("senderId", receiver._id).eq("receiverId", currentUser._id))
      .unique();

    if (requestAlreadyReceived) {
      throw new ConvexError("This user has already sent you a request");
    }

    // Check if they are already friends (either direction)
    const existingFriendship1 = await ctx.db
      .query("friendships")
      .withIndex("by_userIds", (q) =>
        q.eq("userId1", currentUser._id).eq("userId2", receiver._id))
      .unique();

    const existingFriendship2 = await ctx.db
      .query("friendships")
      .withIndex("by_userIds", (q) =>
        q.eq("userId1", receiver._id).eq("userId2", currentUser._id))
      .unique();

    if (existingFriendship1 || existingFriendship2) {
      throw new ConvexError("You are already friends with this user");
    }

    // Create the request
    const request = await ctx.db.insert("requests", {
      senderId: currentUser._id,
      receiverId: receiver._id,
      status: "pending"
    });

    return request;
  },
});

export const deny = mutation({
  args: { id: v.id("requests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const currentUser = await getUserByClerkId(ctx, identity.subject);
    if (!currentUser) throw new ConvexError("User not found");

    const request = await ctx.db.get(args.id);
    if (!request) throw new ConvexError("Request not found");

    if (request.receiverId !== currentUser._id) {
      throw new ConvexError("Request not found");
    }

    await ctx.db.delete(args.id);
  },
});

export const accept = mutation({
  args: { id: v.id("requests") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new ConvexError("Unauthorized");

    const currentUser = await getUserByClerkId(ctx, identity.subject);
    if (!currentUser) throw new ConvexError("User not found");

    const request = await ctx.db.get(args.id);
    if (!request || request.receiverId !== currentUser._id)
      throw new ConvexError("There was an error accepting this request");

    const conversationId = await ctx.db.insert("conversations", {
      isGroup: false,
    });

    // Create the friendship
    await ctx.db.insert("friendships", {
      userId1: currentUser._id,
      userId2: request.senderId,
      status: "accepted"
    });

    // Add both users to the conversation
    await ctx.db.insert("conversationMembers", {
      memberId: currentUser._id,
      conversationId
    });

    await ctx.db.insert("conversationMembers", {
      memberId: request.senderId,
      conversationId
    });

    // Delete the request
    await ctx.db.delete(request._id);

    return { success: true };
  },
})