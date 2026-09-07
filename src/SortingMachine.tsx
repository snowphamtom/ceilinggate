/**
 * CeilingGate — continuous GATHER→SORT machine (LOOM FLIP 2026-09-07).
 * NOT organize-in-place. NOT old forge/main costume board.
 * Evidence processRing = fleet-gerbil-682 ONLY — never quirky / never avid-gnu.
 */
import { useCallback, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import demo from "./data/demo.json";
import driveBuckets from "./data/driveBuckets.json";
import { gateB, type GateDecision } from "./lib/residualGates";
import {
  formatCt,
  formatSyncedAgo,
  useOrganizerLane,
} from "./lib/evidenceLive";
import { KlausOrganizer } from "./components/KlausOrganizer";
import { DemoGate, type LineRow } from "./components/DemoGate";
import { LiveFeeds } from "./components/LiveFeeds";
import { SortingMachineStages } from "./components/SortingMachine";
import { CascadeLane } from "./components/CascadeLane";
import "./sorting-machine.css";

const LINE_NAMES = (demo.lineItems as string[]) ?? [
  "fuel",
  "lodging",
  "meals",
  "misc",
];

const GRANT_FIXTURE = demo.fixtures.find((f) => f.id === "te-grant")!;
const REFUSE_FIXTURE = demo.fixtures.find((f) => f.id === "te-refuse")!;

const BUCKET_KEYS = ["KEEP", "WATCH", "NOISE", "HOLD"] as const;

function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function cap(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}
function rowsFromFixture(f: typeof GRANT_FIXTURE): LineRow[] {
  const names =
    (f as { lineItems?: string[] }).lineItems?.length
      ? (f as { lineItems: string[] }).lineItems
      : LINE_NAMES;
  return names.map((name, i) => ({
    name,
    claimed: f.claimed[i] ?? 0,
    source: f.interior[i] ?? 0,
  }));
}
function decisionFromRows(rows: LineRow[]): GateDecision {
  return gateB(
    rows.map((r) => r.source),
    rows.map((r) => r.claimed),
  );
}
function plainFails(rows: LineRow[], d: GateDecision): string[] {
  return d.failedIndices.map((i) => {
    const r = rows[i];
    if (!r) return `Line ${i + 1} over.`;
    return `${cap(r.name)} is ${money(r.claimed - r.source)} over the receipt (${money(r.claimed)} claimed vs ${money(r.source)} on source).`;
  });
}

const hasConvex = Boolean(import.meta.env.VITE_CONVEX_URL);

export default function SortingMachine() {
  const { lane, tick, loading } = useOrganizerLane();
  const liveRows = useQuery(
    api.claims.listDecisions,
    hasConvex ? { limit: 8 } : "skip",
  );

  const [rows, setRows] = useState<LineRow[]>(() =>
    rowsFromFixture(GRANT_FIXTURE),
  );
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [activePipe, setActivePipe] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [subject, setSubject] = useState(GRANT_FIXTURE.email.subject);
  const [now, setNow] = useState(() => Date.now());
  const [bucketFocus, setBucketFocus] =
    useState<(typeof BUCKET_KEYS)[number]>("KEEP");
  const [runCount, setRunCount] = useState(0);

  useEffect(() => {
    // first paint: real GRANT ledger (never empty costume)
    const boot = rowsFromFixture(GRANT_FIXTURE);
    setRows(boot);
    setSubject(GRANT_FIXTURE.email.subject);
    setDecision(decisionFromRows(boot));
    setActivePipe(4);
    setRunCount(1);
  }, []);

  // Continuous GATHER→SORT: advance pipe + alternate live sorts
  useEffect(() => {
    let tick = 0;
    const id = window.setInterval(() => {
      setNow(Date.now());
      setPulse((p) => p + 1);
      setActivePipe((p) => (p + 1) % 5);
      tick += 1;
      if (tick % 5 === 0) {
        const refuse = tick % 10 === 0;
        const f = refuse ? REFUSE_FIXTURE : GRANT_FIXTURE;
        const next = rowsFromFixture(f);
        setRows(next);
        setSubject(f.email.subject);
        setDecision(decisionFromRows(next));
        setBucketFocus(refuse ? "WATCH" : "KEEP");
        setRunCount((n) => n + 1);
      }
    }, 2200);
    return () => window.clearInterval(id);
  }, []);

  const runSort = useCallback((nextRows: LineRow[], subj: string) => {
    setRows(nextRows);
    setSubject(subj);
    setActivePipe(2);
    const d = decisionFromRows(nextRows);
    window.setTimeout(() => {
      setActivePipe(3);
      setDecision(d);
      setRunCount((n) => n + 1);
      window.setTimeout(() => setActivePipe(4), 320);
    }, 180);
  }, []);

  const demoGrant = useCallback(() => {
    runSort(rowsFromFixture(GRANT_FIXTURE), GRANT_FIXTURE.email.subject);
  }, [runSort]);

  const demoRefuse = useCallback(() => {
    runSort(rowsFromFixture(REFUSE_FIXTURE), REFUSE_FIXTURE.email.subject);
  }, [runSort]);

  const onClaimEdit = (idx: number, value: string) => {
    const n = Number(value);
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === idx
          ? { ...r, claimed: Number.isFinite(n) ? n : r.claimed }
          : r,
      );
      setDecision(decisionFromRows(next));
      setActivePipe(3);
      setRunCount((c) => c + 1);
      return next;
    });
  };

  const onSourceEdit = (idx: number, value: string) => {
    const n = Number(value);
    setRows((prev) => {
      const next = prev.map((r, i) =>
        i === idx
          ? { ...r, source: Number.isFinite(n) ? n : r.source }
          : r,
      );
      setDecision(decisionFromRows(next));
      setActivePipe(3);
      setRunCount((c) => c + 1);
      return next;
    });
  };

  const d = decision ?? decisionFromRows(rows);
  const fails = plainFails(rows, d);

  const bucketCounts = driveBuckets.counts as Record<
    (typeof BUCKET_KEYS)[number],
    number
  >;
  const bucketSamples = driveBuckets.samples as Record<
    (typeof BUCKET_KEYS)[number],
    { title: string; why: string }[]
  >;

  const syncAgo = formatSyncedAgo(lane.lastSyncedAt, now);
  const syncCt = formatCt(lane.lastSyncedAt);

  return (
    <div className="sm-shell sm-scratch" data-testid="ceilinggate-sorting-machine">
      <header className="sm-hero">
        <div className="sm-hero-top">
          <p className="sm-eyebrow">CeilingGate · GATHER → SORT</p>
          <span className="sm-live-pill" title="Continuous sync">
            <span className="sm-pulse-dot" data-pulse={pulse % 2} />
            LIVE · {lane.source === "convex" ? "Evidence" : "snap"} · {syncAgo}
          </span>
        </div>
        <h1>Receipt-line gather → sort</h1>
        <p className="sm-lede">
          Differentiator vs page-promise rivals: every{" "}
          <strong>receipt line</strong> is gated <strong>C ≤ S</strong>{" "}
          (claimed ≤ on-receipt) → <strong>GRANT</strong> or{" "}
          <strong>REFUSE</strong>. Continuous gather → sort — not
          organize-in-place, not a chat shrug, not a whole-page promise.
        </p>
        <p className="sm-rival-beat" role="note">
          <span className="sm-rival-label">vs WATCH rivals</span>
          <span>
            <code>get-it-in-writing</code> page-promise ≠ line residuals ·{" "}
            <code>might</code> ≠ spend gates — we sort{" "}
            <strong>receipt lines</strong> continuously.
          </span>
        </p>
        <p className="sm-sync-stamp">
          process:getLive · <code>{lane.stampLabel}</code>
          {lane.lastSyncedAt ? (
            <>
              {" "}
              · <span>{syncCt}</span>
            </>
          ) : null}
          {" · "}
          tick {tick}
          {loading ? " · connecting…" : ""}
          {" · "}
          sorts {runCount}
        </p>
      </header>

      <SortingMachineStages
        activePipe={activePipe}
        hasDecision={decision != null}
      />

      <div className="sm-grid">
        <KlausOrganizer lane={lane} />

        <DemoGate
          rows={rows}
          decision={d}
          subject={subject}
          onDemoGrant={demoGrant}
          onDemoRefuse={demoRefuse}
          onResort={() => {
            setDecision(decisionFromRows(rows));
            setActivePipe(4);
            setRunCount((n) => n + 1);
          }}
          onClaimEdit={onClaimEdit}
          onSourceEdit={onSourceEdit}
          fails={fails}
          showAwait={decision == null}
        />

        <CascadeLane />

        <section className="sm-panel" aria-label="Drive buckets">
          <div className="sm-panel-head">
            <h2>Drive sort buckets</h2>
            <span className="sm-chip">
              {driveBuckets.measured_at_ct ?? "snap"}
            </span>
          </div>
          <div className="sm-buckets">
            {BUCKET_KEYS.map((k) => (
              <button
                key={k}
                type="button"
                className={
                  "sm-bucket" + (bucketFocus === k ? " on" : "") + " b-" + k
                }
                onClick={() => setBucketFocus(k)}
              >
                <span className="sm-bucket-name">{k}</span>
                <span className="sm-bucket-n">{bucketCounts[k] ?? 0}</span>
              </button>
            ))}
          </div>
          <ul className="sm-bucket-samples">
            {(bucketSamples[bucketFocus] ?? []).slice(0, 4).map((s) => (
              <li key={s.title}>
                <strong>{s.title}</strong>
                <span>{s.why}</span>
              </li>
            ))}
          </ul>
        </section>

        <LiveFeeds
          hasConvex={hasConvex}
          liveRows={liveRows as any}
          lineNames={LINE_NAMES}
          onLoadClaim={runSort}
        />
      </div>

      <footer className="sm-foot">
        <span>GATHER→SORT · CASCADE · NIX/DRIFT · Klaus feed · C≤S</span>
        <span>Evidence: fleet-gerbil-682 · Site: quirky-rhinoceros-204</span>
        <a
          href="https://github.com/snowphamtom/ceilinggate"
          target="_blank"
          rel="noreferrer"
        >
          Repo
        </a>
      </footer>
    </div>
  );
}
