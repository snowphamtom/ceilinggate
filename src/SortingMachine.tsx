/**
 * Claim Check — claim-vs-receipt face.
 * KEEP: hero + stages + DemoReel + C≤S Demo + Check ID + intake + Klaus.
 * STRIP: Cascade roster, Drive buckets, forge costume.
 * HUD IA: Claim → edit lines → check → verdict. Dropdowns for secondary chrome.
 * Visual: violet-navy void + cyan/magenta glow (FUI refs).
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import demo from "./data/demo.json";
import { gateB, type GateDecision } from "./lib/residualGates";
import { useOrganizerLane } from "./lib/evidenceLive";
import { KlausOrganizer } from "./components/KlausOrganizer";
import { DemoGate, type LineRow } from "./components/DemoGate";
import { DemoReel } from "./components/DemoReel";
import { LiveFeeds } from "./components/LiveFeeds";
import { SortingMachineStages } from "./components/SortingMachine";
import { CalmDisclosure } from "./components/CalmDisclosure";
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

/**
 * LIVE_SINCE — public go-live of this Claim Check face (Pages).
 * Anchored to git 9b8e37c @ 2026-09-07 19:41:37 UTC — first continuous Sorting Machine
 * ship on this product face; f87e38c @ 19:49 UTC completed SPA scratch.
 * Not scaffold 2026-09-05. ISO documented here for the Live-for ticker.
 */
const LIVE_SINCE_ISO = "2026-09-07T19:41:37.000Z";
const LIVE_SINCE_MS = Date.parse(LIVE_SINCE_ISO);

function formatLiveFor(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const totalSec = Math.floor(ms / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const totalHr = Math.floor(totalMin / 60);
  const h = totalHr % 24;
  const d = Math.floor(totalHr / 24);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d}d ${pad(h)}h ${pad(m)}m ${pad(s)}s`;
}

/** Ticking uptime from LIVE_SINCE — plain professional Live for Dd Hh Mm Ss. */
function LiveForUptime() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const label = useMemo(
    () => formatLiveFor(now - LIVE_SINCE_MS),
    [now],
  );
  return (
    <span
      className="sm-uptime sm-uptime-jewel"
      title={`Live since ${LIVE_SINCE_ISO} (git 9b8e37c)`}
      data-testid="live-for-uptime"
      aria-live="off"
    >
      <span className="sm-uptime-pulse" aria-hidden />
      <span className="sm-uptime-label">Live for</span>
      <time className="sm-uptime-digits" dateTime={LIVE_SINCE_ISO}>
        {label}
      </time>
    </span>
  );
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
  }, [runSort]);

  const demoRefuse = useCallback(() => {
    runSort(rowsFromFixture(REFUSE_FIXTURE), REFUSE_FIXTURE.email.subject);
  }, [runSort]);

  const oneBreath = useCallback(() => {
    if (breathBusy) return;
    setBreathBusy(true);
    runSort(rowsFromFixture(GRANT_FIXTURE), GRANT_FIXTURE.email.subject);
    /* settle: GRANT first, then REFUSE with $1 over lodging/misc (CG-TE) */
    window.setTimeout(() => {
      runSort(rowsFromFixture(REFUSE_FIXTURE), REFUSE_FIXTURE.email.subject);
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

  return (
    <div
      className="sm-shell sm-scratch sm-masterpiece sm-hud"
      data-testid="ceilinggate-sorting-machine"
    >
      <div className="sm-atmosphere" aria-hidden>
        <div className="sm-atm-vignette" />
        <div className="sm-atm-grid" />
        <div className="sm-atm-glow sm-atm-glow-a" />
        <div className="sm-atm-glow sm-atm-glow-b" />
        <div className="sm-atm-glow sm-atm-glow-c" />
      </div>
      <header className="sm-hero sm-enter sm-enter-1">
        <div className="sm-hud-ribbon" aria-hidden>
          <svg viewBox="0 0 1200 80" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="hudRibbon" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff4fd8" stopOpacity="0" />
                <stop offset="18%" stopColor="#ff4fd8" stopOpacity="0.55" />
                <stop offset="48%" stopColor="#c4a0ff" stopOpacity="0.9" />
                <stop offset="72%" stopColor="#4de8ff" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#4de8ff" stopOpacity="0" />
              </linearGradient>
              <filter id="hudBloom" x="-20%" y="-80%" width="140%" height="260%">
                <feGaussianBlur stdDeviation="3.5" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <path
              d="M0 48 C 140 18, 220 62, 360 40 S 560 12, 700 38 S 920 68, 1080 28 S 1160 20, 1200 34"
              fill="none"
              stroke="url(#hudRibbon)"
              strokeWidth="3.2"
              filter="url(#hudBloom)"
            />
            <path
              d="M0 54 C 160 28, 240 70, 380 48 S 580 20, 720 46 S 940 74, 1100 36 S 1165 26, 1200 40"
              fill="none"
              stroke="#4de8ff"
              strokeOpacity="0.28"
              strokeWidth="1.2"
            />
            <g fill="#f0ecff" opacity="0.75">
              <circle cx="180" cy="36" r="1.4" />
              <circle cx="310" cy="44" r="1.1" />
              <circle cx="470" cy="28" r="1.5" />
              <circle cx="640" cy="42" r="1.2" />
              <circle cx="820" cy="52" r="1.3" />
              <circle cx="980" cy="30" r="1.1" />
              <circle cx="250" cy="58" r="0.9" fill="#ff4fd8" />
              <circle cx="560" cy="58" r="0.9" fill="#4de8ff" />
              <circle cx="890" cy="22" r="0.9" fill="#ff4fd8" />
            </g>
          </svg>
        </div>
        <div className="sm-hero-rail" aria-hidden />
        <div className="sm-hero-top">
          <p className="sm-eyebrow">Claim Check · claim vs receipt</p>
          <div className="sm-hero-meta">
            <LiveForUptime />
            <span className="sm-live-pill" title="Live">
              <span className="sm-pulse-dot" data-pulse={pulse % 2} />
              LIVE · C ≤ S
            </span>
          </div>
        </div>
        <h1>Claim Check</h1>
        <p className="sm-desk-kicker">
          ResidualGates · claimed ≤ scraped receipt · line by line — not a chat yes/no
        </p>
        <p className="sm-lede">
          Each line: claimed vs on-receipt. At or under → <strong>GRANT</strong>. Over
          by dollars → <strong>REFUSE</strong>. Rule:{" "}
          <span className="sm-law-chip">C ≤ S</span>
          {" "}· expense residual board (not recall watch, not subscription cancel, not
          terms recovery, not insurance appeals).
        </p>
        <div className="sm-hero-tele" aria-label="Live check metadata">
          <span className="sm-meta-chip">LINE · CLAIMED · ON RECEIPT · STATUS</span>
          <span className="sm-meta-chip sm-meta-chip-dim">C ≤ S · no chat panel</span>
        </div>
      </header>

      {/* Y0 proof: GRANT/REFUSE + Check ID + caliper before pipeline */}
      <div className="sm-proof-fold sm-enter sm-enter-2" data-testid="proof-above-fold">
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

      <div className="sm-secondary sm-enter sm-enter-3">
        <CalmDisclosure
          id="pipeline"
          title="How a check runs"
          summary="Gather → triage → evidence → sort → result"
        >
          <SortingMachineStages
            activePipe={activePipe}
            hasDecision={decision != null}
          />
        </CalmDisclosure>

        <CalmDisclosure
          id="c-le-s"
          title="What C ≤ S means"
          summary="Claim ≤ support · Two-Gate · GRANT or REFUSE"
        >
          <div className="sm-c-le-s" data-testid="c-le-s-body">
            <p>
              <strong>C ≤ S</strong> means the <strong>claim</strong> must not
              exceed the <strong>support</strong> (the receipt).
            </p>
            <ul>
              <li>
                <strong>Gate 1 — Claim:</strong> Is every claimed dollar at or
                under what the receipt shows?
              </li>
              <li>
                <strong>Gate 2 — Receipt:</strong> Is there a clear support line
                for each claim line?
              </li>
            </ul>
            <p>
              Both clear → <strong>GRANT</strong> (seal + Check ID). Any line
              over → <strong>REFUSE</strong> (shows how much over).
            </p>
            <p className="sm-muted">
              Only grant what the receipt can carry — no stretch.
            </p>
          </div>
        </CalmDisclosure>

      </div>

      <div className="sm-below-fold sm-grid sm-grid-lean sm-enter sm-enter-4">
        <DemoReel />
        <div className="sm-side">
          <LiveFeeds />
          <CalmDisclosure
            id="klaus"
            title="Organizer"
            summary="Holds · folders"
          >
            <KlausOrganizer lane={lane} />
          </CalmDisclosure>
        </div>
      </div>

      <footer className="sm-foot">
        <span>C ≤ S · Claim Check · claim vs receipt</span>
        <a
          href="https://github.com/snowphamtom/ceilinggate"
          target="_blank"
          rel="noreferrer"
        >
          Repo
        </a>
        <a
          href="https://vibeapps.dev/s/claim-check"
          target="_blank"
          rel="noreferrer"
        >
          Listing
        </a>
      </footer>
    </div>
  );
}
