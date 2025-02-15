import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

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

    const requestAlreadySent = await ctx.db
      .query("request")
      .withIndex("by_receiver_sender", (q) => q.eq("receiver", receiver._id).eq("sender", currentUser._id))
      .unique();
    if (requestAlreadySent) throw new ConvexError("Request already sent");

    const requestAlreadyReceived = await ctx.db
      .query("request")
      .withIndex("by_receiver_sender", (q) => q.eq("receiver", currentUser._id).eq("sender", receiver._id))
      .unique();
    if (requestAlreadyReceived) { throw new ConvexError("This user has already sent you a request");
    }

    const friends1 = await ctx.db.query("friends")
    .withIndex("by_user1", (q) => q.eq("user1", currentUser._id))
    .collect();

    const friends2 = await ctx.db.query("friends")
    .withIndex("by_user2", (q) => q.eq("user2", currentUser._id))
    .collect();

    if (friends1.some((friend) => friend.user2 === receiver._id) || 
    friends2.some((friend) => friend.user1 === receiver._id)) {
      throw new ConvexError
      ("You are already friends with this user");
    }
    
    const request = await ctx.db.insert("request", {
        sender: currentUser._id,
        receiver: receiver._id,
      });
      return request;
    },
  });




  export const deny = mutation({
    args: { id: v.id("request") },
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
      if (!identity) throw new ConvexError("Unauthorized");
  
      const currentUser = await getUserByClerkId(ctx, identity.subject);
      if (!currentUser) throw new ConvexError("User not found");
  
      const request = await ctx.db.get(args.id);
      if (!request) throw new ConvexError("Request not found");

      const typedRequest = request as { receiver: typeof currentUser._id };
      if (typedRequest.receiver !== currentUser._id) {
        throw new ConvexError("Request not found");
      }

      await ctx.db.delete(args.id);
      },
    });
  
    export const accept = mutation({
      args: { id: v.id("request") },
      handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) throw new ConvexError("Unauthorized");
    
        const currentUser = await getUserByClerkId(ctx, identity.subject);
        if (!currentUser) throw new ConvexError("User not found");
    
        const request = await ctx.db.get(args.id);
        if (!request || request.receiver !== currentUser._id) throw new ConvexError("There was an error accepting this request");

        const conversationId = await ctx.db.insert("conversations", {
          isGroup: false,
        });
        await ctx.db.insert("friends", {
          user1: currentUser._id,
          user2: request.sender,
          conversationId,
        });
        await ctx.db.insert("conversationMembers", {
          memberId: currentUser._id,
          conversationId
      });

      await ctx.db.insert("conversationMembers", {
        memberId: request.sender,
        conversationId
    });
    await ctx.db.delete(request._id);
      },
    })