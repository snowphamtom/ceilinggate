import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { EVIDENCE } from "./evidenceConfig";

export type StageStatus = "DONE" | "ACTIVE" | "PENDING" | "HOLDING" | "PARTIAL";

/** Lean live row from process.getLive on fleet-gerbil-682 */
export type LiveProcess = {
  stages: { id: string; label: string; status: StageStatus; metric?: string }[];
  counts: {
    rootFolders: number;
    looseFiles: number;
    proposeRows: number;
    movesExecuted: number;
    pendingHolds: number;
  };
  pendingHoldIds: string[];
  lastSyncedAt: number;
  stampLabel: string | null;
  detail: Record<string, unknown> | null;
};

export const getLiveRef = makeFunctionReference<
  "query",
  Record<string, never>,
  LiveProcess | null
>("process:getLive");

let client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient | null {
  if (!EVIDENCE.configured) return null;
  if (!client) client = new ConvexHttpClient(EVIDENCE.url);
  return client;
}

/** One-shot poll of process:getLive from Evidence Convex. */
export async function fetchProcessLive(): Promise<LiveProcess | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.query(getLiveRef, {});
  } catch {
    return null;
  }
}

export function formatSyncedAgo(ts: number | null | undefined, now: number): string {
  if (!ts) return "offline";
  const sec = Math.max(0, Math.floor((now - ts) / 1000));
  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  return `${hr}h ago`;
}

export function formatCt(ts: number | null | undefined): string {
  if (!ts) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(new Date(ts)) + " CT";
  } catch {
    return new Date(ts).toISOString();
  }
}
