/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as agentmail from "../agentmail.js";
import type * as claims from "../claims.js";
import type * as config from "../config.js";
import type * as firecrawl from "../firecrawl.js";
import type * as fixtures from "../fixtures.js";
import type * as forge from "../forge.js";
import type * as gateLogic from "../gateLogic.js";
import type * as http from "../http.js";
import type * as inboxes from "../inboxes.js";
import type * as lib_gates from "../lib/gates.js";
import type * as parse from "../parse.js";
import type * as pipeline from "../pipeline.js";
import type * as site from "../site.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  agentmail: typeof agentmail;
  claims: typeof claims;
  config: typeof config;
  firecrawl: typeof firecrawl;
  fixtures: typeof fixtures;
  forge: typeof forge;
  gateLogic: typeof gateLogic;
  http: typeof http;
  inboxes: typeof inboxes;
  "lib/gates": typeof lib_gates;
  parse: typeof parse;
  pipeline: typeof pipeline;
  site: typeof site;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  agentmail: import("@agentmail/convex/_generated/component.js").ComponentApi<"agentmail">;
  firecrawl: import("@firecrawl/firecrawl-convex/_generated/component.js").ComponentApi<"firecrawl">;
};
