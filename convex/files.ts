import { ConvexError, v } from "convex/values";
import { mutation } from "./_generated/server";
import { getUserByClerkId } from "./_utils";


export const generateUploadUrl = mutation({
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


    return await ctx.storage.generateUploadUrl();
  },
});


export const getUrl = mutation({
  args: { storageId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
}); 