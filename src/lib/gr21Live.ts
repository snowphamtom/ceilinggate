import { ConvexHttpClient } from "convex/browser";
import { makeFunctionReference } from "convex/server";
import { useEffect, useState } from "react";
import { EVIDENCE } from "./evidenceConfig";

/** Last GR-21 residual row from fleet-gerbil-682 gr21:getLastResidual */
export type LastResidual = {
  residualCommitment: string;
  historicAnchor: string;
  variance: number;
  cLeS: boolean;
  residual: number[];
  cycle: number;
  nodeId?: string | null;
  createdAt: number;
  sortRunId?: string | null;
  evidenceId?: string | null;
};

export const getLastResidualRef = makeFunctionReference<
  "query",
  Record<string, never>,
  LastResidual | null
>("gr21:getLastResidual");

let client: ConvexHttpClient | null = null;

function getClient(): ConvexHttpClient | null {
  if (!EVIDENCE.configured) return null;
  if (!client) client = new ConvexHttpClient(EVIDENCE.url);
  return client;
}

export async function fetchLastResidual(): Promise<LastResidual | null> {
  const c = getClient();
  if (!c) return null;
  try {
    return await c.query(getLastResidualRef, {});
  } catch {
    return null;
  }
}

/** Poll Evidence Convex for last residual commitment (Sorting Machine stamps). */
export function useLastResidual(pollMs = 6000) {
  const [live, setLive] = useState<LastResidual | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      const row = await fetchLastResidual();
      if (cancelled) return;
      setLive(row);
      setLoading(false);
      setTick((t) => t + 1);
    };
    void pull();
    const id = window.setInterval(pull, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [pollMs]);

  return { live, loading, tick, source: live ? ("convex" as const) : ("local" as const) };
}
