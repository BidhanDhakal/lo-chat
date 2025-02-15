import { ConvexError } from "convex/values";
import { query } from "./_generated/server";
import { getUserByClerkId } from "./_utils";

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
        const requests = await ctx.db.query("request")
            .withIndex("by_receiver", (q) => q.eq("receiver", currentUser._id))
            .collect();

        const requestsWitSender = await Promise.all(requests.map(async (request) => {
            const sender = await ctx.db.get(request.sender);

            if (!sender) {
                throw new ConvexError("Sender not found");
            }
            return {
                request,
                sender
            };
        }));

        return requestsWitSender;
    }
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
        const requests = await ctx.db.query("request")
            .withIndex("by_receiver", (q) => q.eq("receiver", currentUser._id))
            .collect();

        return requests.length;
    }
});
