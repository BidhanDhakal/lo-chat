import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    username: v.string(),
    imageUrl: v.string(),
    email: v.string(),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_username", ["username"]),

  friendships: defineTable({
    userId1: v.id("users"),
    userId2: v.id("users"),
    status: v.string(),
  })
    .index("by_userIds", ["userId1", "userId2"])
    .index("by_status_userId1", ["status", "userId1"])
    .index("by_status_userId2", ["status", "userId2"]),

  conversations: defineTable({
    isGroup: v.boolean(),
    name: v.optional(v.string()),
    lastMessageId: v.optional(v.id("messages")),
    creatorId: v.optional(v.id("users")),
    imageUrl: v.optional(v.string()),
  })
    .index("by_creatorId", ["creatorId"]),

  conversationMembers: defineTable({
    conversationId: v.id("conversations"),
    memberId: v.id("users"),
    lastSeenMessage: v.optional(v.id("messages")),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_memberId", ["memberId"])
    .index("by_memberId_conversationId", ["memberId", "conversationId"]),

  messages: defineTable({
    content: v.union(v.string(), v.bytes()),
    type: v.string(),
    senderId: v.id("users"),
    conversationId: v.id("conversations"),
    isDeleted: v.boolean(),
  })
    .index("by_conversationId", ["conversationId"])
    .index("by_senderId", ["senderId"]),

  requests: defineTable({
    senderId: v.id("users"),
    receiverId: v.id("users"),
    status: v.string(),
  })
    .index("by_senderId_receiverId", ["senderId", "receiverId"])
    .index("by_receiverId_status", ["receiverId", "status"]),
});