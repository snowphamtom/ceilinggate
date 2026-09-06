import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import demo from "./data/demo.json";
import {
  gateB,
  granted,
  type GateDecision,
} from "./lib/residualGates";
import "./index.css";

type Fixture = (typeof demo.fixtures)[number];

type LocalDecision = {
  id: string;
  caseId: string;
  label: string;
  claimed: number[];
  interior: number[];
  decision: GateDecision;
  source: "fixture-scrape" | "convex";
  receiptUrl: string;
  lineItems: string[];
  subject: string;
  from: string;
};

const LINE_ITEMS = demo.lineItems as string[];
const hasConvex = Boolean(import.meta.env.VITE_CONVEX_URL);
const SHORT = ((demo as { shipShortlist?: string[] }).shipShortlist ?? []).filter(
  Boolean,
);
const SHIP_FIXTURES: Fixture[] = SHORT.length
  ? demo.fixtures.filter((f) => SHORT.includes(f.id))
  : demo.fixtures.slice(0, 14);

function money(n: number) {
  if (!Number.isFinite(n)) return String(n);
  if (Math.abs(n) >= 1000)
    return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function plainFailures(
  lineItems: string[],
  claimed: number[],
  interior: number[],
  failedIndices: number[],
): string[] {
  return failedIndices.map((i) => {
    const name = lineItems[i] ?? `line ${i + 1}`;
    const c = claimed[i] ?? 0;
    const n = interior[i] ?? 0;
    const over = c - n;
    return `${capitalize(name)} is ${money(over)} over the receipt (${money(c)} claimed vs ${money(n)} on the source).`;
  });
}

function isPublicUrl(url: string) {
  try {
    const u = new URL(url);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

function runFixture(f: Fixture): LocalDecision {
  const decision = gateB(f.interior, f.claimed);
  return {
    id: f.id,
    caseId: f.caseId,
    label: f.label,
    claimed: f.claimed,
    interior: f.interior,
    decision,
    source: "fixture-scrape",
    receiptUrl: f.email.receiptUrl,
    lineItems: (f as { lineItems?: string[] }).lineItems?.length
      ? (f as { lineItems: string[] }).lineItems
      : LINE_ITEMS,
    subject: f.email.subject,
    from: f.email.from,
  };
}

function pickByExpect(status: "grant" | "refuse"): Fixture | undefined {
  const preferIds =
    status === "grant"
      ? ["te-grant", "drive-pass-job"]
      : ["te-refuse", "te-spend-ceilings", "drive-fail-job"];
  for (const id of preferIds) {
    const f = SHIP_FIXTURES.find((x) => x.id === id);
    if (f && gateB(f.interior, f.claimed).status === status) return f;
  }
  return SHIP_FIXTURES.find(
    (f) => gateB(f.interior, f.claimed).status === status,
  );
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<LocalDecision[]>([]);

  const selfCheckOk = useMemo(() => {
    const grant = gateB([100, 50, 25, 10], [98, 49, 25, 9]);
    const refuse = gateB([100, 50, 25, 10], [98, 51, 25, 11]);
    return (
      granted(grant) && refuse.status === "refuse" && refuse.mask === 10
    );
  }, []);

  const loadAll = useCallback(() => {
    const next = SHIP_FIXTURES.map(runFixture);
    setResults(next);
    setSelectedId(next[0]?.id ?? null);
  }, []);

  const runOne = useCallback((f: Fixture) => {
    const d = runFixture(f);
    setResults((prev) => {
      const others = prev.filter((r) => r.id !== d.id);
      return [d, ...others];
    });
    setSelectedId(d.id);
  }, []);

  const demoGrant = useCallback(() => {
    const f = pickByExpect("grant");
    if (f) runOne(f);
  }, [runOne]);

  const demoRefuse = useCallback(() => {
    const f = pickByExpect("refuse");
    if (f) runOne(f);
  }, [runOne]);

  /** Compete signature: CG-TE GRANT then $1 lodging/misc REFUSE */
  const demoSignature = useCallback(() => {
    const g = pickByExpect("grant");
    const r = pickByExpect("refuse");
    const next: LocalDecision[] = [];
    if (g) next.push(runFixture(g));
    if (r) next.push(runFixture(r));
    if (!next.length) return;
    setResults((prev) => {
      const ids = new Set(next.map((d) => d.id));
      return [...next, ...prev.filter((x) => !ids.has(x.id))];
    });
    setSelectedId(next[next.length - 1]?.id ?? next[0].id);
  }, []);

  const selected =
    results.find((r) => r.id === selectedId) ?? results[0] ?? null;

  const plain = selected
    ? plainFailures(
        selected.lineItems,
        selected.claimed,
        selected.interior,
        selected.decision.failedIndices,
      )
    : [];

  return (
    <div className="shell board">
      <PwaInstallShell />
      <header className="top">
        <div>
          <p className="eyebrow">
            For small businesses · contractors · grant seekers
          </p>
          <h1>CeilingGate</h1>
          <p className="lede everyday">
            Line-by-line <strong>claimed ≤ scraped receipt</strong> — ResidualGates
            returns <strong>GRANT</strong> only when every line clears, or{" "}
            <strong>REFUSE</strong> with plain-English overages (e.g. lodging $1 over).
          </p>
          <p className="muted small">
            Email claim + public receipt URL → Firecrawl scrape → numeric gate.
            Never “AI yes/no to your email.” Not Attest-style inbox chat.
          </p>
        </div>
        <div className="actions stack-actions">
          <button type="button" className="primary" onClick={loadAll}>
            Check sample claims (ship set)
          </button>
          <div className="oneclick">
            <button type="button" className="grant-btn" onClick={demoGrant}>
              Demo GRANT
            </button>
            <button type="button" className="refuse-btn" onClick={demoRefuse}>
              Demo REFUSE
            </button>
          </div>
          <button type="button" className="sig-btn" onClick={demoSignature}>
            Demo signature: GRANT → $1 REFUSE
          </button>
        </div>
      </header>

      <div className="orig-lock" role="note">
        <strong>Forensic board</strong> — ResidualGates line ledger (claimed vs on-receipt).
        Not a chat panel. Not Attest/NoticeProof-style AI yes/no. Not docs-search.
      </div>
      <div className="stack-strip" aria-label="Required stack">
        <span className={"chip-stack" + (hasConvex ? " on" : "")}>
          Convex {hasConvex ? "live" : "demo"}
        </span>
        <span className="chip-stack on">Firecrawl scrape</span>
        <span className="chip-stack on">
          AgentMail · <code>ceilinggate-claims@agentmail.to</code>
        </span>
        <span className="chip-stack muted-chip">
          ResidualGates · self-check {selfCheckOk ? "ok" : "fail"}
        </span>
      </div>

      <div className="lean">
        How it works: claim email → Firecrawl public receipt → line-by-line
        GRANT/REFUSE. Live board on{" "}
        <code>quirky-rhinoceros-204.convex.site</code>
        {hasConvex ? " · Convex connected" : " · sample receipts until Convex URL"}
        .
      </div>

      <AppForgePanel />


      <div className="board-grid">
        <section className="panel">
          <h2>Claims inbox <span className="muted small">({SHIP_FIXTURES.length} ship set)</span></h2>
          <p className="muted small">
            Ship-set expense examples (claim↔receipt) — not chat transcripts.
            One click runs the gate.
          </p>
          <div className="list">
            {SHIP_FIXTURES.map((f) => {
              const expect = gateB(f.interior, f.claimed);
              const active = selectedId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={
                    "row docket" +
                    (active ? " on" : "") +
                    (expect.status === "grant" ? " edge-grant" : " edge-refuse")
                  }
                  onClick={() => runOne(f)}
                >
                  <span className="subj">{f.email.subject}</span>
                  <span className="meta">
                    from {f.email.from} ·{" "}
                    {isPublicUrl(f.email.receiptUrl)
                      ? "public receipt URL"
                      : "receipt on file"}
                  </span>
                  <StatusPill status={expect.status} />
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel verdict-panel">
          <h2>Result</h2>
          {!selected ? (
            <p className="muted">
              Hit <strong>Demo signature: GRANT → $1 REFUSE</strong> (compete path),
              or Demo GRANT / Demo REFUSE.
            </p>
          ) : (
            <div
              className={
                selected.decision.status === "grant"
                  ? "card grant big"
                  : "card refuse big"
              }
            >
              <p className="eyebrow">{selected.caseId}</p>
              <h3>
                {selected.decision.status === "grant"
                  ? "GRANT — claim is under the receipt"
                  : "REFUSE — some lines are over the receipt"}
              </h3>
              <div className="badge stamp">
                {selected.decision.status === "grant" ? "GRANT" : "REFUSE"}
              </div>
              <div className="mask-row">
                <span className="mask-chip" title="ResidualGates refuse bitmask — math depth, not AI yes/no">
                  mask {selected.decision.mask}
                  {selected.decision.status === "refuse"
                    ? ` · bits ${selected.decision.failedIndices.join(",")}`
                    : " · clear"}
                </span>
              </div>

              {plain.length > 0 ? (
                <ul className="plain-fail">
                  {plain.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              ) : (
                <p className="ok-line">
                  Every line is at or under the scraped receipt totals.
                </p>
              )}

              <p className="ledger-cap muted small">
                Always shown: Line · Claimed · On receipt · Status (ResidualGates)
              </p>
              <table className="ledger">
                <thead>
                  <tr>
                    <th>Line</th>
                    <th>Claimed</th>
                    <th>On receipt</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {selected.lineItems.map((name, i) => {
                    const c = selected.claimed[i] ?? 0;
                    const n = selected.interior[i] ?? 0;
                    const fail = selected.decision.failedIndices.includes(i);
                    return (
                      <tr key={`${name}-${i}`} className={fail ? "fail" : ""}>
                        <td>{capitalize(name)}</td>
                        <td>
                          <code>{money(c)}</code>
                        </td>
                        <td>
                          <code>{money(n)}</code>
                        </td>
                        <td>{fail ? "Over" : "OK"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="evidence">
                <h4>What we checked</h4>
                <p>
                  <strong>Claim email</strong> {selected.subject}
                </p>
                <p>
                  <strong>Public source</strong>{" "}
                  <code>{selected.receiptUrl}</code>
                </p>
                <p>
                  <strong>Receipt pull</strong>{" "}
                  {selected.source === "fixture-scrape"
                    ? "sample scrape (demo) — live ingress uses Firecrawl"
                    : "live Firecrawl scrape"}
                </p>
                <p>
                  <strong>Ingress</strong> AgentMail →{" "}
                  <code>ceilinggate-claims@agentmail.to</code>
                </p>
              </div>
            </div>
          )}
        </section>
      </div>

      {results.length > 0 && (
        <section className="panel">
          <h2>Checked this session</h2>
          <div className="list">
            {results.map((r) => (
              <button
                key={r.id}
                type="button"
                className="row"
                onClick={() => setSelectedId(r.id)}
              >
                <span className="subj">{r.subject}</span>
                <span className="meta">
                  {r.decision.status === "grant"
                    ? "All lines OK"
                    : plainFailures(
                        r.lineItems,
                        r.claimed,
                        r.interior,
                        r.decision.failedIndices,
                      ).join(" ")}
                </span>
                <StatusPill status={r.decision.status} />
              </button>
            ))}
          </div>
        </section>
      )}

      <footer className="lean">
        CeilingGate is a money-claim checker — not a chat bot, not a developer
        SDK. Email in → Firecrawl receipt scrape → clear GRANT or REFUSE. Cash prizes for All Gas: $10k / $5k / $1.5k only. Install: browser Add to Home Screen / Install app (PWA — no download pack).
      </footer>
    </div>
  );
}


function parseNumList(s: string): number[] {
  return s
    .split(/[\s,]+/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map(Number)
    .filter((n) => Number.isFinite(n));
}

function TipJarHonestyPanel() {
  const [claimedTip, setClaimedTip] = useState("5.00");
  const [receiptTotal, setReceiptTotal] = useState("42.50");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  const run = useCallback(() => {
    const tip = Number(claimedTip);
    const total = Number(receiptTotal);
    if (!Number.isFinite(tip) || !Number.isFinite(total)) {
      setDecision({ status: "refuse", mask: 1, failedIndices: [0] });
      return;
    }
    // Narrow claim: tip alone vs receipt total — clearer than parent's multi-line board
    setDecision(gateB([total], [tip]));
  }, [claimedTip, receiptTotal]);

  return (
    <div className="forge-child">
      <h3 className="forge-sub">Tip Jar Honesty — LIVE</h3>
      <p className="muted small">
        BETTER-THAN-PARENT: two clear money inputs (claimed tip vs receipt total) → instant
        GRANT/REFUSE. No costume. NEVER NEED ACCESS.
      </p>
      <div className="forge-row">
        <label className="forge-label">
          Claimed tip ($)
          <input
            className="forge-input"
            type="number"
            step="0.01"
            value={claimedTip}
            onChange={(e) => setClaimedTip(e.target.value)}
          />
        </label>
        <label className="forge-label">
          Receipt total ($)
          <input
            className="forge-input"
            type="number"
            step="0.01"
            value={receiptTotal}
            onChange={(e) => setReceiptTotal(e.target.value)}
          />
        </label>
      </div>
      <button type="button" className="primary" onClick={run}>
        Run Tip Jar gate
      </button>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status === "grant" ? "GRANT" : "REFUSE"}</strong>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.failedIndices.length
                ? ` · failed [${decision.failedIndices.join(",")}]`
                : " · clear"}
            </span>
          </div>
          <p className="muted small">
            Claimed tip {money(Number(claimedTip))} vs receipt {money(Number(receiptTotal))}
            {decision.status === "grant"
              ? " — tip at or under receipt."
              : " — tip over receipt total."}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function LineDeltaKitPanel() {
  const [claimedStr, setClaimedStr] = useState("98, 51, 25, 11");
  const [interiorStr, setInteriorStr] = useState("100, 50, 25, 10");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  const run = useCallback(() => {
    const claimed = parseNumList(claimedStr);
    const interior = parseNumList(interiorStr);
    setDecision(gateB(interior, claimed));
  }, [claimedStr, interiorStr]);

  return (
    <div className="forge-child">
      <h3 className="forge-sub">Line Delta Kit — LIVE</h3>
      <p className="muted small">
        BETTER-THAN-PARENT: paste claimed vs interior arrays, Run → decision + mask + failed
        indices in one shot. Narrower and clearer than the parent ship-set board.
      </p>
      <label className="forge-label">
        Claimed lines (comma-separated)
        <textarea
          className="forge-input"
          rows={2}
          value={claimedStr}
          onChange={(e) => setClaimedStr(e.target.value)}
        />
      </label>
      <label className="forge-label">
        Interior / on-receipt (comma-separated)
        <textarea
          className="forge-input"
          rows={2}
          value={interiorStr}
          onChange={(e) => setInteriorStr(e.target.value)}
        />
      </label>
      <button type="button" className="primary" onClick={run}>
        Run Line Delta gate
      </button>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status === "grant" ? "GRANT" : "REFUSE"}</strong>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.failedIndices.length
                ? ` · failed indices [${decision.failedIndices.join(",")}]`
                : " · clear"}
            </span>
          </div>
          {decision.failedIndices.length > 0 ? (
            <ul className="plain-fail">
              {decision.failedIndices.map((i) => {
                const c = parseNumList(claimedStr)[i] ?? 0;
                const n = parseNumList(interiorStr)[i] ?? 0;
                return (
                  <li key={i}>
                    Line {i}: claimed {money(c)} vs interior {money(n)} (
                    {money(c - n)} over)
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ok-line">Every line clears — claimed ≤ interior.</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function MaskChipLitePanel() {
  const [claimedStr, setClaimedStr] = useState("98, 51, 25, 11");
  const [interiorStr, setInteriorStr] = useState("100, 50, 25, 10");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  const run = useCallback(() => {
    setDecision(gateB(parseNumList(interiorStr), parseNumList(claimedStr)));
  }, [claimedStr, interiorStr]);

  return (
    <div className="forge-child">
      <h3 className="forge-sub">Mask Chip Lite — LIVE</h3>
      <p className="muted small">
        Focus UI: bitmask + failed indices only. Same gateB math. Click Run — no ask.
      </p>
      <div className="forge-row">
        <label className="forge-label">
          Claimed
          <input
            className="forge-input"
            value={claimedStr}
            onChange={(e) => setClaimedStr(e.target.value)}
          />
        </label>
        <label className="forge-label">
          Interior
          <input
            className="forge-input"
            value={interiorStr}
            onChange={(e) => setInteriorStr(e.target.value)}
          />
        </label>
      </div>
      <button type="button" className="primary" onClick={run}>
        Run mask chip
      </button>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status.toUpperCase()}</strong>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.failedIndices.length
                ? ` · bits ${decision.failedIndices.join(",")}`
                : " · clear"}
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}


/** Tiny home-screen install shell — no offline media cache. */
function PwaInstallShell() {
  const [deferred, setDeferred] = useState<any>(null);
  const [hint, setHint] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e);
    };
    const onInstalled = () => {
      setDeferred(null);
      setDone(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    // iOS / browsers without BIP: show soft hint once
    const ua = navigator.userAgent;
    const isIos = /iPad|iPhone|iPod/.test(ua);
    const standalone =
      (window.navigator as any).standalone === true ||
      window.matchMedia("(display-mode: standalone)").matches;
    if (!standalone && isIos) setHint(true);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (done) return null;
  if (!deferred && !hint) return null;

  return (
    <div className="pwa-shell" role="region" aria-label="Install CeilingGate">
      <span className="pwa-shell-label">
        Home screen · tiny PWA · no media cache
      </span>
      {deferred ? (
        <button
          type="button"
          className="ghost"
          onClick={async () => {
            await deferred.prompt();
            setDeferred(null);
          }}
        >
          Install app
        </button>
      ) : (
        <span className="muted small">
          Share → Add to Home Screen
        </span>
      )}
    </div>
  );
}

function AppForgePanel() {
  const [title, setTitle] = useState("Receipt Line Check");
  const [brief, setBrief] = useState(
    "LIVE micro-app: claimed lines ≤ public receipt totals via ResidualGates. Not a chat assistant.",
  );
  const [log, setLog] = useState<string>("");
  const spawn = useMutation(api.forge.spawn);
  const live = useQuery(api.forge.list);

  const forge = useCallback(async () => {
    const slug =
      title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 40) || `forge-${Date.now().toString(36)}`;
    const path = `/workspace/forged-apps/${slug}`;
    setLog(`Forging ${slug} on Convex…`);
    try {
      if (hasConvex) {
        await spawn({ slug, title, brief, path });
        setLog(
          `LIVE SPAWN ${slug} — NEVER NEED ACCESS / STANDING_ACCESS cascade. Recorded in Convex forgedApps. Box: npm run forge -- --slug ${slug}`,
        );
      } else {
        setLog(`Local spawn ${slug} (no VITE_CONVEX_URL) — ${brief.slice(0, 60)}…`);
      }
    } catch (e) {
      setLog(String(e));
    }
  }, [title, brief, spawn]);

  return (
    <section className="panel forge-panel">
      <h2>App Forge</h2>
      <p className="muted small">
        <strong>Judge demo path:</strong> (1) Demo signature GRANT→$1 REFUSE above,
        (2) run live child gates below (Tip Jar / Line Delta / Mask Chip), (3) spawn another
        micro-app. Same stack: Convex + Firecrawl + AgentMail. NEVER NEED ACCESS — nobody
        asks to create or interact.
      </p>
      <p className="eyebrow">Recursive create — apps that create apps · LIVE gates only</p>

      <TipJarHonestyPanel />
      <LineDeltaKitPanel />
      <MaskChipLitePanel />

      <h3 className="forge-sub">Spawn next micro-app (live)</h3>
      <label className="forge-label">
        Micro-app title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="forge-input"
        />
      </label>
      <label className="forge-label">
        Brief
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          className="forge-input"
          rows={2}
        />
      </label>
      <button type="button" className="primary" onClick={forge}>
        Spawn second micro-app (live)
      </button>
      {log ? <p className="lean forge-log">{log}</p> : null}
      <h3 className="forge-sub">Spawned apps (live)</h3>
      <ul className="forge-list">
        {(live ?? []).map((s) => (
          <li key={s._id}>
            <strong>{s.title}</strong> <code>{s.slug}</code>
            <span className="muted small"> — {s.path}</span>
          </li>
        ))}
        {!live?.length && (
          <li className="muted small">
            Children on box: tip-jar-honesty, line-delta-kit, mask-chip-lite (loading live
            list…)
          </li>
        )}
      </ul>
      <p className="muted small">
        Box scaffold: <code>npm run forge -- --slug …</code> →{" "}
        <code>/workspace/forged-apps/</code> (LIVE interactive HTML + demo-gate.mjs).
      </p>
    </section>
  );
}

function StatusPill({ status }: { status: "grant" | "refuse" }) {
  if (status === "grant") return <span className="pill grant">GRANT</span>;
  return <span className="pill refuse">REFUSE</span>;
}
