/**
 * CeilingGate — lean judge Sorting Machine (SENATE EDICT strip).
 * KEEP: hero + stages + prefer-live demo + C≤S Demo + GR-21 + lean intake + lean Klaus.
 * STRIP: Cascade roster, Drive buckets, forge costume, internal vibes chips.
 */
import { useCallback, useEffect, useState } from "react";
import demo from "./data/demo.json";
import { gateB, type GateDecision } from "./lib/residualGates";
import { useOrganizerLane } from "./lib/evidenceLive";
import { KlausOrganizer } from "./components/KlausOrganizer";
import { DemoGate, type LineRow } from "./components/DemoGate";
import { DemoReel } from "./components/DemoReel";
import { LiveFeeds } from "./components/LiveFeeds";
import { SponsorChips } from "./components/SponsorChips";
import { SortingMachineStages } from "./components/SortingMachine";
import { useLastResidual } from "./lib/gr21Live";
import "./sorting-machine.css";

const LINE_NAMES = (demo.lineItems as string[]) ?? [
  "fuel",
  "lodging",
  "meals",
  "misc",
];

const GRANT_FIXTURE = demo.fixtures.find((f) => f.id === "te-grant")!;
const REFUSE_FIXTURE = demo.fixtures.find((f) => f.id === "te-refuse")!;

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
    return `${cap(r.name)} is ${money(r.claimed - r.source)} over the receipt (${money(r.claimed)} claimed vs ${money(r.source)} on receipt).`;
  });
}

export default function SortingMachine() {
  const { lane } = useOrganizerLane();
  const { live: lastResidual } = useLastResidual();

  const [rows, setRows] = useState<LineRow[]>(() =>
    rowsFromFixture(GRANT_FIXTURE),
  );
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [activePipe, setActivePipe] = useState(0);
  const [pulse, setPulse] = useState(0);
  const [subject, setSubject] = useState(GRANT_FIXTURE.email.subject);
  const [pathLit, setPathLit] = useState({
    firecrawl: false,
    agentmail: false,
    openai: false,
  });
  const [breathBusy, setBreathBusy] = useState(false);

  useEffect(() => {
    const boot = rowsFromFixture(GRANT_FIXTURE);
    setRows(boot);
    setSubject(GRANT_FIXTURE.email.subject);
    setDecision(decisionFromRows(boot));
    setActivePipe(4);
  }, []);

  // Soft pipe pulse only — no auto fixture thrash (judges drive Demo GRANT/REFUSE)
  useEffect(() => {
    const id = window.setInterval(() => {
      setPulse((p) => p + 1);
      setActivePipe((p) => (p + 1) % 5);
    }, 2800);
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
      window.setTimeout(() => setActivePipe(4), 280);
    }, 160);
  }, []);

  const demoGrant = useCallback(() => {
    runSort(rowsFromFixture(GRANT_FIXTURE), GRANT_FIXTURE.email.subject);
    // Demo fixture S numbers = receipt scrape stand-in; oneLine after numbers
    setPathLit((p) => ({ ...p, firecrawl: true, openai: true }));
  }, [runSort]);

  const demoRefuse = useCallback(() => {
    runSort(rowsFromFixture(REFUSE_FIXTURE), REFUSE_FIXTURE.email.subject);
    setPathLit((p) => ({ ...p, firecrawl: true, openai: true }));
  }, [runSort]);

  const oneBreath = useCallback(() => {
    if (breathBusy) return;
    setBreathBusy(true);
    setPathLit((p) => ({ ...p, firecrawl: true }));
    runSort(rowsFromFixture(REFUSE_FIXTURE), REFUSE_FIXTURE.email.subject);
    setPathLit((p) => ({ ...p, firecrawl: true, openai: true }));
    window.setTimeout(() => {
      runSort(rowsFromFixture(GRANT_FIXTURE), GRANT_FIXTURE.email.subject);
      setPathLit((p) => ({ ...p, firecrawl: true, openai: true }));
      setBreathBusy(false);
    }, 1400);
  }, [breathBusy, runSort]);

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
      return next;
    });
  };

  const d = decision ?? decisionFromRows(rows);
  const fails = plainFails(rows, d);
  const agentmailLit =
    pathLit.agentmail ||
    Boolean(lastResidual) ||
    (lane.vince?.pending?.length ?? 0) > 0 ||
    (lane.cole?.proposeRows ?? 0) > 0;

  return (
    <div className="sm-shell sm-scratch sm-lean" data-testid="ceilinggate-sorting-machine">
      <header className="sm-hero">
        <div className="sm-hero-top">
          <p className="sm-eyebrow">CeilingGate · Sorting Machine</p>
          <span className="sm-live-pill" title="Live">
            <span className="sm-pulse-dot" data-pulse={pulse % 2} />
            LIVE · C ≤ S
          </span>
        </div>
        <h1>Not a chat that guesses.</h1>
        <p className="sm-aha">A machine that sorts money claims.</p>
        <p className="sm-lede">
          Email a claim + public receipt URL. Each line: claimed ≤ on-receipt →{" "}
          <strong>GRANT</strong>. Over by dollars → <strong>REFUSE</strong>.
        </p>
        <p className="sm-law">
          Law: numbers first · leftover on one line cannot cover a hole on
          another · <span className="sm-law-chip">C ≤ S</span> per line.
        </p>
        <SponsorChips
          lit={{
            firecrawl: pathLit.firecrawl,
            agentmail: agentmailLit,
            openai: pathLit.openai && decision != null,
          }}
        />
      </header>

      <SortingMachineStages
        activePipe={activePipe}
        hasDecision={decision != null}
      />

      {/* Fold punch: proof (REFUSE/GRANT + ledger stamp) before video/Klaus */}
      <div className="sm-proof-fold" data-testid="proof-above-fold">
        <DemoGate
          rows={rows}
          decision={d}
          subject={subject}
          onDemoGrant={demoGrant}
          onDemoRefuse={demoRefuse}
          onOneBreath={oneBreath}
          breathBusy={breathBusy}
          onResort={() => {
            setDecision(decisionFromRows(rows));
            setActivePipe(4);
          }}
          onClaimEdit={onClaimEdit}
          onSourceEdit={onSourceEdit}
          fails={fails}
          showAwait={decision == null}
          liveResidual={lastResidual}
        />
      </div>

      <div className="sm-below-fold sm-grid sm-grid-lean">
        <DemoReel />
        <div className="sm-side">
          <LiveFeeds />
          <KlausOrganizer lane={lane} />
        </div>
      </div>

      <footer className="sm-foot">
        <span>Receipt-line C ≤ S · GR-21 residual · prefer-live demo</span>
        <a
          href="https://github.com/snowphamtom/ceilinggate"
          target="_blank"
          rel="noreferrer"
        >
          Repo
        </a>
        <a
          href="https://vibeapps.dev/s/ceilinggate-1"
          target="_blank"
          rel="noreferrer"
        >
          Listing
        </a>
      </footer>
    </div>
  );
}
