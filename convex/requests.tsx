import { ConvexError, v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";
import { Id } from "./_generated/dataModel";


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
    email?: string;
    [key: string]: any;
  };
};

export const get = query({
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

export const count = query({
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

    const requests = await ctx.db.query("requests")
      .withIndex("by_receiverId_status", (q) =>
        q.eq("receiverId", currentUser._id).eq("status", "pending"))
      .collect();

    return requests.length;
  }
});
