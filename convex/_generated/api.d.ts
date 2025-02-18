/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as conversation from "../conversation.js";
import type * as conversations from "../conversations.js";
import type * as friend from "../friend.js";
import type * as http from "../http.js";
import type * as message from "../message.js";
import type * as messages from "../messages.js";
import type * as request from "../request.js";
import type * as requests from "../requests.js";
import type * as user from "../user.js";
import type * as _utils from "../_utils.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  conversation: typeof conversation;
  conversations: typeof conversations;
  friend: typeof friend;
  http: typeof http;
  message: typeof message;
  messages: typeof messages;
  request: typeof request;
  requests: typeof requests;
  user: typeof user;
  _utils: typeof _utils;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
