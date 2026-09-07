import { useEffect, useMemo, useState } from "react";
import embeddedSnap from "../data/processSnapshot.json";
import { EVIDENCE, EVIDENCE_CONVEX_URL } from "./evidenceConfig";
import {
  fetchProcessLive,
  formatCt,
  formatSyncedAgo,
  type LiveProcess,
  type StageStatus,
} from "./processLive";

export { EVIDENCE, EVIDENCE_CONVEX_URL, formatCt, formatSyncedAgo };
export type { LiveProcess, StageStatus };

export type OrganizerStage = {
  id: string;
  label: string;
  status: StageStatus | string;
  metric: string;
};

export type OrganizerLane = {
  source: "convex" | "embedded";
  stampLabel: string;
  lastSyncedAt: number | null;
  stages: OrganizerStage[];
  mara: {
    rootFolders: number;
    looseFiles: number;
    status: string;
  };
  cole: {
    proposeRows: number;
    status: string;
  };
  rina: {
    status: string;
    stayOptics: number;
  };
  vince: {
    status: string;
    pending: { id: string; kind: string; target: string; why: string }[];
  };
  execute: {
    status: string;
    totalMoves: number;
  };
};

type Snap = typeof embeddedSnap;

function metricFor(id: string, snap: Snap): string {
  switch (id) {
    case "mara":
      return `${snap.mara.rootFolders} folders · ${snap.mara.looseFiles} loose`;
    case "cole":
      return `${snap.cole.proposeRows} PROPOSE`;
    case "rina":
      return snap.rina.introOutroIntact ? "optics intact" : "optics risk";
    case "vince":
      return `${snap.vince.pending.length} holds`;
    case "execute":
      return `${snap.execute.totalMoves} moves`;
    default:
      return "—";
  }
}

function laneFromSnap(snap: Snap, source: "convex" | "embedded", syncedAt: number | null): OrganizerLane {
  const order = [
    { id: "mara", label: "MAP", status: snap.mara.status },
    { id: "cole", label: "PROPOSE", status: snap.cole.status },
    { id: "rina", label: "PLATES", status: snap.rina.status },
    { id: "vince", label: "HOLDS", status: snap.vince.status },
    { id: "execute", label: "EXECUTED", status: snap.execute.status },
  ] as const;

  return {
    source,
    stampLabel: snap.stampLabel,
    lastSyncedAt: syncedAt,
    stages: order.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      metric: metricFor(s.id, snap),
    })),
    mara: {
      rootFolders: snap.mara.rootFolders,
      looseFiles: snap.mara.looseFiles,
      status: snap.mara.status,
    },
    cole: {
      proposeRows: snap.cole.proposeRows,
      status: snap.cole.status,
    },
    rina: {
      status: snap.rina.status,
      stayOptics: snap.rina.stayOptics,
    },
    vince: {
      status: snap.vince.status,
      pending: snap.vince.pending.map((p) => ({
        id: p.id,
        kind: p.kind,
        target: p.target,
        why: p.why,
      })),
    },
    execute: {
      status: snap.execute.status,
      totalMoves: snap.execute.totalMoves,
    },
  };
}

function laneFromLive(live: LiveProcess, snap: Snap): OrganizerLane {
  const base = laneFromSnap(snap, "convex", live.lastSyncedAt);
  if (live.stages?.length) {
    base.stages = live.stages.map((s) => ({
      id: s.id,
      label: s.label,
      status: s.status,
      metric: s.metric ?? "—",
    }));
  }
  if (live.counts) {
    base.mara.rootFolders = live.counts.rootFolders;
    base.mara.looseFiles = live.counts.looseFiles;
    base.cole.proposeRows = live.counts.proposeRows;
    base.execute.totalMoves = live.counts.movesExecuted;
  }
  if (live.stampLabel) base.stampLabel = live.stampLabel;
  return base;
}

/** Prefer Evidence Convex process.getLive; fall back to embedded Klaus snap. */
export function useOrganizerLane(pollMs = 8000) {
  const embedded = useMemo(
    () => laneFromSnap(embeddedSnap as Snap, "embedded", null),
    [],
  );
  const [lane, setLane] = useState<OrganizerLane>(embedded);
  const [tick, setTick] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const pull = async () => {
      const live = await fetchProcessLive();
      if (cancelled) return;
      if (live) {
        setLane(laneFromLive(live, embeddedSnap as Snap));
      } else {
        setLane(embedded);
      }
      setLoading(false);
      setTick((t) => t + 1);
    };
    void pull();
    const id = window.setInterval(pull, pollMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [embedded, pollMs]);

  return { lane, tick, loading, evidence: EVIDENCE };
}
