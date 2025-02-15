import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { ConvexError } from "convex/values";

//{ctx, clerkId} : { ctx: QueryCtx | MutationCtx; clerkId: string }
export const getUserByClerkId = async (ctx: QueryCtx | MutationCtx, clerkId: string) => {
  return await ctx.db
    .query("users")
    .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
    .unique();
};

export const getUserById = async (ctx: QueryCtx | MutationCtx, id: Id<"users">) => {
  return await ctx.db.get(id);
};

export const getCurrentUser = async (ctx: QueryCtx | MutationCtx) => {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new ConvexError("Unauthorized");

  const currentUser = await getUserByClerkId(ctx, identity.subject);
  if (!currentUser) throw new ConvexError("User not found");
  return currentUser;
};