import { useCallback, useEffect, useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import demo from "./data/demo.json";
import {
  chatWouldShrug,
  decodeMask,
  faultClass,
  faultClassLabel,
  gateB,
  ketOf,
  refuseReceiptText,
  shrugTrapClaimed,
  shrugTrapInterior,
  vectorSum,
  type GateDecision,
} from "./lib/residualGates";
import "./index.css";

type Fixture = (typeof demo.fixtures)[number];

type LocalDecision = {
  id: string;
  claimed: number[];
  interior: number[];
  decision: GateDecision;
  receiptUrl: string;
  lineItems: string[];
  subject: string;
  from: string;
  aiLine?: string;
};

const LINE_ITEMS = demo.lineItems as string[];
const hasConvex = Boolean(import.meta.env.VITE_CONVEX_URL);
const SHORT = ((demo as { shipShortlist?: string[] }).shipShortlist ?? []).filter(Boolean);
const SHIP_FIXTURES: Fixture[] = (SHORT.length
  ? demo.fixtures.filter((f) => SHORT.includes(f.id))
  : demo.fixtures
).slice(0, 4);

function money(n: number) {
  if (!Number.isFinite(n)) return String(n);
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function capitalize(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
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
    return `${capitalize(name)} is ${money(c - n)} over the receipt (${money(c)} claimed vs ${money(n)} on the source).`;
  });
}

function runFixture(f: Fixture): LocalDecision {
  return {
    id: f.id,
    claimed: f.claimed,
    interior: f.interior,
    decision: gateB(f.interior, f.claimed),
    receiptUrl: f.email.receiptUrl,
    lineItems: (f as { lineItems?: string[] }).lineItems?.length
      ? (f as { lineItems: string[] }).lineItems
      : LINE_ITEMS,
    subject: f.email.subject,
    from: f.email.from,
  };
}

function pickByExpect(status: "grant" | "refuse"): Fixture | undefined {
  return SHIP_FIXTURES.find((f) => gateB(f.interior, f.claimed).status === status);
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<LocalDecision[]>([]);
  const liveRows = useQuery(api.claims.listDecisions, hasConvex ? { limit: 12 } : "skip");

  const runOne = useCallback((f: Fixture) => {
    const d = runFixture(f);
    setResults((prev) => [d, ...prev.filter((r) => r.id !== d.id)]);
    setSelectedId(d.id);
  }, []);

  const selected = results.find((r) => r.id === selectedId) ?? results[0] ?? null;
  const plain = selected
    ? plainFailures(selected.lineItems, selected.claimed, selected.interior, selected.decision.failedIndices)
    : [];

  return (
    <div className="shell board">
      <header className="hero">
        <p className="eyebrow">Expense check</p>
        <h1>CeilingGate</h1>
        <p className="lede everyday">
          Send a claim and a public receipt. Every line is compared.
          Under or equal is a <strong>GRANT</strong>. Over is a <strong>REFUSE</strong>.
        </p>
        <p className="stakes-line">
          Sorting machine · one law <strong>C ≤ S</strong> (claimed ≤ source) componentwise —
          buckets <strong>GRANT</strong> / <strong>REFUSE</strong>. Never chat yes/no.
        </p>
        <ul className="stack-tags" aria-label="Stack">
          <li>Convex</li>
          <li>Firecrawl</li>
          <li>AgentMail</li>
          <li>OpenAI</li>
        </ul>
        <p className="muted small originality-line">
          Receipt GRANT/over honesty + Forge spawn — not an inbox yes/no clone
          (Block / NoticeProof / Attest).
        </p>
      </header>

      <section className="try-now" aria-label="Try it">
        <p className="try-label">Try it · C ≤ S → GRANT / REFUSE</p>
        <div className="oneclick">
          <button type="button" className="grant-btn" onClick={() => {
            const f = pickByExpect("grant");
            if (f) runOne(f);
            window.requestAnimationFrame(() => {
              document.getElementById("verdict-live")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
          }}>Demo GRANT</button>
          <button type="button" className="refuse-btn" onClick={() => {
            const f = pickByExpect("refuse");
            if (f) runOne(f);
            window.requestAnimationFrame(() => {
              document.getElementById("verdict-live")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
            });
          }}>Demo REFUSE</button>
        </div>
      </section>

      <ol className="steps" id="sorting-line" aria-label="Sorting machine line">
        <li><strong>Intake</strong> — claim + public receipt to <code>ceilinggate-claims@agentmail.to</code></li>
        <li><strong>Filter</strong> — real object only (kill vibes / costumes)</li>
        <li><strong>Evidence</strong> — Firecrawl scrape → line ledger (not chat)</li>
        <li><strong>Verdict</strong> — ResidualGates <strong>C ≤ S</strong>; OpenAI narrates after numbers (does not decide)</li>
        <li><strong>Store</strong> — bucket <strong>GRANT</strong> or <strong>REFUSE</strong> on the live board</li>
      </ol>

      <section className="panel sort-first" id="sorting-machine-first" aria-label="Sorting machine">
        <p className="eyebrow">Sorting machine</p>
        <h2>C ≤ S</h2>
        <p className="muted small">
          One law: claimed ≤ source on every line → bucket <strong>GRANT</strong> or{" "}
          <strong>REFUSE</strong>.{" "}
          <a href="/forge/sorting-machine/" target="_blank" rel="noreferrer">
            Open styled forge page
          </a>
          .
        </p>
        <SortingMachinePanel />
      </section>

      <section className="panel prize-honesty" id="prize-honesty" aria-label="Prize honesty">
        <p className="eyebrow">Judge cash honesty</p>
        <h2>All Gas cash (Luma)</h2>
        <table className="cash-table">
          <thead>
            <tr><th>Place</th><th>Cash</th></tr>
          </thead>
          <tbody>
            <tr><td>Overall</td><td>$10,000</td></tr>
            <tr><td>2nd</td><td>$5,000</td></tr>
            <tr><td>3rd</td><td>$1,500</td></tr>
            <tr><td><strong>Pool</strong></td><td><strong>$16,500</strong></td></tr>
          </tbody>
        </table>
        <h3 className="never-h">Never say</h3>
        <table className="never-table">
          <thead>
            <tr><th>Ban</th><th>Why</th></tr>
          </thead>
          <tbody>
            <tr><td>USPTO ~$2,100 Track One is prize cash</td><td>Fee≠prize</td></tr>
            <tr><td>Guaranteed win / payout timing</td><td>Winner ≠ cash-in-hand</td></tr>
            <tr><td>Square / $1k T&amp;E is this prize path</td><td>Commercial hard stop</td></tr>
            <tr><td>Marketing $25k/$45k = bigger cash pool</td><td>Credits ≠ cash</td></tr>
          </tbody>
        </table>
        <p className="muted small">
          Source:{" "}
          <a href="https://luma.com/convex-allgas-hackathon" target="_blank" rel="noreferrer">
            Luma All Gas
          </a>
          {" "}· product language only
        </p>
      </section>

      <div className="board-grid">
        <section className="panel verdict-panel" id="verdict-live">
          <h2>Result</h2>
          {!selected ? (
            <p className="muted empty">Tap Demo GRANT or Demo REFUSE above.</p>
          ) : (
            <VerdictCard selected={selected} plain={plain} />
          )}
        </section>

        <section className="panel">
          <h2>Inbox</h2>
          {hasConvex && liveRows && liveRows.length > 0 && (
            <div className="list">
              {liveRows.map((row) => {
                const c = row.claim;
                const d = row.decision;
                const status = d?.status === "grant" || d?.status === "refuse" ? d.status : "wait";
                return (
                  <button
                    key={c._id}
                    type="button"
                    className={"row docket" + (status === "grant" ? " edge-grant" : "") + (status === "refuse" ? " edge-refuse" : "")}
                    onClick={() => {
                      const interior = c.interior ?? [];
                      const claimed = c.claimed ?? [];
                      const decision =
                        d?.status === "grant" || d?.status === "refuse"
                          ? { status: d.status as "grant" | "refuse", mask: d.mask ?? 0, failedIndices: d.failedIndices ?? [] }
                          : gateB(interior, claimed);
                      const mapped: LocalDecision = {
                        id: c._id,
                        claimed,
                        interior,
                        decision,
                        receiptUrl: c.sourceUrl ?? "",
                        lineItems: LINE_ITEMS,
                        subject: c.subject ?? "(no subject)",
                        from: c.from ?? "",
                        aiLine: d?.oneLine ?? (c as { aiLine?: string }).aiLine,
                      };
                      setResults((prev) => [mapped, ...prev.filter((r) => r.id !== mapped.id)]);
                      setSelectedId(mapped.id);
                    }}
                  >
                    <span className="subj">{c.subject ?? "(no subject)"}</span>
                    <span className="meta">{c.from ?? "inbound"}</span>
                    <StatusPill status={status} />
                  </button>
                );
              })}
            </div>
          )}
          <div className="list">
            {SHIP_FIXTURES.map((f) => {
              const expect = gateB(f.interior, f.claimed);
              return (
                <button
                  key={f.id}
                  type="button"
                  className={"row docket" + (selectedId === f.id ? " on" : "") + (expect.status === "grant" ? " edge-grant" : " edge-refuse")}
                  onClick={() => runOne(f)}
                >
                  <span className="subj">{f.email.subject}</span>
                  <span className="meta">{f.email.from}</span>
                  <StatusPill status={expect.status} />
                </button>
              );
            })}
          </div>
        </section>
      </div>

      <section className="panel forge-panel" id="live-child-gates">
        <h2>Live child gates</h2>
        <p className="muted small">
          Narrow tools that beat the multi-line board on clarity: Tip Jar (2 money fields) and
          Line Delta (paste arrays → line table). Not inbox chat — claimed ≤ on-receipt only.
        </p>
        <ol className="pass-bar muted small">
          <li>Hard refresh / Reset — empty (no pre-filled GRANT)</li>
          <li>Edit inputs yourself — Demo flips are practice, not the proof</li>
          <li>Run → live GRANT/REFUSE · keep demos under 180s</li>
        </ol>
        <TipJarHonestyPanel />
        <ReceiptLineCheckPanel />
        <LineDeltaKitPanel />
        <MaskChipLitePanel />
        <UrlReceiptGatePanel />
        <DualOracleDisagreePanel />
        <FaultTaxonomyPanel />
        <ChatShrugTrapPanel />
      </section>

      <section className="panel forge-panel" id="forge-open-live" aria-label="Open live Forge apps">
        <h2>Open live Forge apps</h2>
        <p className="muted small">
          Judge-visible spawn targets — each is a real click→gate micro-app on this Convex site
          (better than parent on its narrow claim).
        </p>
        <table className="forge-live-table">
          <thead>
            <tr>
              <th>Child</th>
              <th>Narrow claim</th>
              <th>Open</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Tip Jar Honesty</td>
              <td>tip ≤ receipt total</td>
              <td>
                <a href="/forge/tip-jar-honesty/" target="_blank" rel="noreferrer">
                  /forge/tip-jar-honesty/
                </a>
              </td>
            </tr>
            <tr>
              <td>Line Delta Kit</td>
              <td>claimed[] vs interior[]</td>
              <td>
                <a href="/forge/line-delta-kit/" target="_blank" rel="noreferrer">
                  /forge/line-delta-kit/
                </a>
              </td>
            </tr>
            <tr>
              <td>Mask Chip Lite</td>
              <td>interactive failed-line bits</td>
              <td>
                <a href="/forge/mask-chip-lite/" target="_blank" rel="noreferrer">
                  /forge/mask-chip-lite/
                </a>
              </td>
            </tr>
            <tr>
              <td>Receipt Line Check</td>
              <td>one labeled line + Δ</td>
              <td>
                <a href="/forge/receipt-line-check/" target="_blank" rel="noreferrer">
                  /forge/receipt-line-check/
                </a>
              </td>
            </tr>
            <tr>
              <td>URL Receipt Gate</td>
              <td>public URL → fetch → forensic ledger</td>
              <td>
                <a href="/forge/url-receipt-gate/" target="_blank" rel="noreferrer">
                  /forge/url-receipt-gate/
                </a>
              </td>
            </tr>
            <tr>
              <td>Chat Shrug Trap</td>
              <td>totals OK · one line OVER → REFUSE (Block/GIW foil)</td>
              <td>
                <a href="/forge/chat-shrug-trap/" target="_blank" rel="noreferrer">
                  /forge/chat-shrug-trap/
                </a>
              </td>
            </tr>
            <tr>
              <td>Sorting Machine</td>
              <td>C ≤ S pipeline → GRANT/REFUSE bucket</td>
              <td>
                <a href="/forge/sorting-machine/" target="_blank" rel="noreferrer">
                  /forge/sorting-machine/
                </a>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  );
}

function VerdictCard({ selected }: { selected: LocalDecision; plain: string[] }) {
  const [claimed, setClaimed] = useState(selected.claimed);
  const [interior, setInterior] = useState(selected.interior);

  useEffect(() => {
    setClaimed(selected.claimed);
    setInterior(selected.interior);
  }, [selected.id, selected.claimed, selected.interior]);

  const decision = gateB(interior, claimed);
  const ok = decision.status === "grant";
  const plain = plainFailures(selected.lineItems, claimed, interior, decision.failedIndices);
  const shrug = chatWouldShrug(interior, claimed, decision);

  return (
    <div className={ok ? "card grant big" : "card refuse big"}>
      <p className="eyebrow">{ok ? "All lines clear" : "Over the receipt"}</p>
      <h3><span className="verdict-stamp">{ok ? "GRANT" : "REFUSE"}</span></h3>
      <div className="mask-row">
        <span className="mask-chip">
          mask {decision.mask}
          {ok
            ? " · GRANT ⇔ mask==0"
            : decodeMask(decision.mask, selected.lineItems).length
              ? ` · ${decodeMask(decision.mask, selected.lineItems).join(" · ")}`
              : decision.failedIndices.length
                ? ` · failed [${decision.failedIndices.join(",")}]`
                : " · nonzero mask"}
        </span>
        <span className="mask-chip">
          {faultClassLabel(faultClass(interior, claimed, decision))}
        </span>
        <span className="mask-chip" title="F L M X product bits">
          {ketOf(decision.mask)} · fuel cannot flip lodging
        </span>
      </div>
      {selected.aiLine ? <p className="ai-line"><strong>In one line.</strong> {selected.aiLine}</p> : null}
      {plain.length > 0 ? (
        <ul className="plain-fail">{plain.map((line) => <li key={line}>{line}</li>)}</ul>
      ) : (
        <p className="ok-line">Every line is at or under the receipt.</p>
      )}
      {ok ? (
        <p className="muted small">Change lodging to 51. Surplus on fuel cannot cover it.</p>
      ) : null}
      <div className="paper-slips" aria-label="receipt ceiling">
        {selected.lineItems.map((name, i) => {
          const c = claimed[i] ?? 0;
          const n = interior[i] ?? 0;
          const fail = decision.failedIndices.includes(i);
          const fill = n > 0 ? Math.min(100, (c / n) * 100) : c > 0 ? 100 : 0;
          return (
            <div className="paper-slip" key={`slip-${name}-${i}`}>
              <span className="paper-slip-name">{capitalize(name)}</span>
              <div className="paper-slip-track">
                <div className={"paper-slip-fill" + (fail ? " over" : "")} style={{ width: `${fill}%` }} />
                <div className="paper-slip-ceiling" />
              </div>
              {fail ? <span className="paper-slip-tab">+{money(c - n)}</span> : <span className="paper-slip-tab empty" />}
            </div>
          );
        })}
        <p className="paper-slip-legend">Dashed edge is the receipt. A tab past it is the overclaim.</p>
      </div>
      <table className="ledger">
        <thead><tr><th>LINE</th><th>CLAIMED (C)</th><th>SOURCE (S)</th><th>C≤S</th></tr></thead>
        <tbody>
          {selected.lineItems.map((name, i) => {
            const fail = decision.failedIndices.includes(i);
            return (
              <tr key={`${name}-${i}`} className={fail ? "fail" : ""}>
                <td>{capitalize(name)}</td>
                <td>
                  <input
                    inputMode="decimal"
                    aria-label={`Claimed ${name}`}
                    className="ledger-input"
                    value={Number.isFinite(claimed[i]) ? String(claimed[i]) : ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setClaimed((prev) => prev.map((x, idx) => (idx === i ? n : x)));
                    }}
                  />
                </td>
                <td>
                  <input
                    inputMode="decimal"
                    aria-label={`Receipt ${name}`}
                    className="ledger-input"
                    value={Number.isFinite(interior[i]) ? String(interior[i]) : ""}
                    onChange={(e) => {
                      const n = Number(e.target.value);
                      setInterior((prev) => prev.map((x, idx) => (idx === i ? n : x)));
                    }}
                  />
                </td>
                <td><span className={"status-chip " + (fail ? "over" : "clear")}>{fail ? "C > S" : "C ≤ S"}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {ok ? (
        <p className="conjunctive-line ok">
          ADMIT: every line claimed ≤ on-receipt (componentwise) — no total-only offset.
        </p>
      ) : (
        <p className="conjunctive-line">
          Surplus on one line cannot cover a deficit on another — ADMIT only if claimed ≤
          on-receipt on every line.
        </p>
      )}
      {shrug ? (
        <p className="conjunctive-line" data-testid="chat-shrug-callout">
          Chat shrug foil: SUM claimed {vectorSum(claimed)} ≤ SUM on-receipt{" "}
          {vectorSum(interior)} — Block/GIW would say totals look fine. Gate still{" "}
          <strong>REFUSE</strong> on the OVER line(s).
        </p>
      ) : null}
      {!ok ? (
        <div className="row" style={{ marginTop: "0.65rem" }}>
          <button
            type="button"
            className="ghost"
            onClick={() => {
              const text = refuseReceiptText(
                interior,
                claimed,
                decision,
                selected.lineItems,
              );
              void navigator.clipboard?.writeText(text);
            }}
          >
            Copy refuse receipt
          </button>
        </div>
      ) : null}
      {selected.receiptUrl ? (
        <div className="evidence"><p><strong>Receipt</strong> {selected.receiptUrl}</p></div>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: "grant" | "refuse" | "wait" }) {
  if (status === "grant") return <span className="pill grant">GRANT</span>;
  if (status === "wait") return <span className="pill wait">…</span>;
  return <span className="pill refuse">REFUSE</span>;
}


function GateLedgerTable({
  lines,
}: {
  lines: { line: string; claimed: number; interior: number; over: boolean }[];
}) {
  const anyOver = lines.some((r) => r.over);
  return (
    <>
      <table className="ledger delta-table">
        <thead>
          <tr>
            <th>LINE</th>
            <th>CLAIMED (C)</th>
            <th>SOURCE (S)</th>
            <th>C≤S</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((row, i) => (
            <tr key={`${row.line}-${i}`} className={row.over ? "fail" : ""}>
              <td>{row.line}</td>
              <td>{money(row.claimed)}</td>
              <td>{money(row.interior)}</td>
              <td className={row.over ? "bad" : "ok"}><span className={"status-chip " + (row.over ? "over" : "clear")}>{row.over ? "C > S" : "C ≤ S"}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
      {anyOver ? (
        <p className="conjunctive-line">
          Surplus on one line cannot cover a deficit on another — ADMIT only if claimed ≤
          on-receipt on every line.
        </p>
      ) : (
        <p className="conjunctive-line ok">
          ADMIT: every line claimed ≤ on-receipt (componentwise) — no total-only offset.
        </p>
      )}
    </>
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

function ReceiptLineCheckPanel() {
  const [label, setLabel] = useState("Fuel");
  const [claimed, setClaimed] = useState("51.00");
  const [interior, setInterior] = useState("50.00");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  useEffect(() => {
    setDecision(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setDecision(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const run = useCallback(() => {
    const c = Number(claimed);
    const n = Number(interior);
    setDecision(gateB([n], [c]));
  }, [claimed, interior]);

  return (
    <div className="forge-child" data-testid="receipt-line-check-live">
      <h3 className="forge-sub">Receipt Line Check — LIVE</h3>
      <p className="muted small">
        Narrower than Tip Jar: one labeled line claimed vs on-receipt + Δ. Empty on load.
      </p>
      <label className="forge-label">
        Line label
        <input className="forge-input" value={label} onChange={(e) => setLabel(e.target.value)} />
      </label>
      <div className="forge-row">
        <label className="forge-label">
          Claimed $
          <input
            className="forge-input"
            type="number"
            step="0.01"
            value={claimed}
            onChange={(e) => setClaimed(e.target.value)}
          />
        </label>
        <label className="forge-label">
          On-receipt $
          <input
            className="forge-input"
            type="number"
            step="0.01"
            value={interior}
            onChange={(e) => setInterior(e.target.value)}
          />
        </label>
      </div>
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimed("49.00");
            setInterior("50.00");
            setDecision(gateB([50], [49]));
          }}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimed("51.00");
            setInterior("50.00");
            setDecision(gateB([50], [51]));
          }}
        >
          Demo REFUSE
        </button>
        <button type="button" className="ghost" onClick={() => setDecision(null)}>
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run line gate
        </button>
      </div>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status === "grant" ? "GRANT" : "REFUSE"}</strong>
          <GateLedgerTable
            lines={[
              {
                line: label || "Line",
                claimed: Number(claimed),
                interior: Number(interior),
                over: decision.status === "refuse",
              },
            ]}
          />
        </div>
      ) : null}
      <p className="muted small">
        Also{" "}
        <a href="/forge/receipt-line-check/" target="_blank" rel="noreferrer">
          /forge/receipt-line-check/
        </a>
      </p>
    </div>
  );
}

function TipJarHonestyPanel() {
  const [claimedTip, setClaimedTip] = useState("5.00");
  const [receiptTotal, setReceiptTotal] = useState("42.50");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  // Sticky reset: hard refresh / bfcache restore starts empty (Streamer click→result)
  useEffect(() => {
    setDecision(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setDecision(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const run = useCallback(() => {
    const tip = Number(claimedTip);
    const total = Number(receiptTotal);
    if (!Number.isFinite(tip) || !Number.isFinite(total)) {
      setDecision({ status: "refuse", mask: 1, failedIndices: [0] });
      return;
    }
    // Narrow claim: tip alone vs receipt total
    setDecision(gateB([total], [tip]));
  }, [claimedTip, receiptTotal]);


  return (
    <div className="forge-child" data-testid="tip-jar-honesty-live">
      <h3 className="forge-sub">Tip Jar Honesty — LIVE</h3>
      <p className="muted small">
        Two money fields — claimed tip vs receipt total. Live GRANT/REFUSE with a clear delta.
      </p>
      <div className="forge-row">
        <label className="forge-label">
          Claimed tip ($)
          <input
            className="forge-input"
            type="number"
            step="0.01"
            value={claimedTip}
            onChange={(e) => {
              setClaimedTip(e.target.value);
            }}
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
      <div className="actions">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedTip("5.00");
            setReceiptTotal("42.50");
            setDecision(gateB([42.5], [5]));
          }}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedTip("50.00");
            setReceiptTotal("42.50");
            setDecision(gateB([42.5], [50]));
          }}
        >
          Demo REFUSE
        </button>
        <button type="button" className="ghost" onClick={() => setDecision(null)}>
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run Tip Jar gate
        </button>
      </div>
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
          <GateLedgerTable
            lines={[
              {
                line: "Tip",
                claimed: Number(claimedTip),
                interior: Number(receiptTotal),
                over: decision.status === "refuse",
              },
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

function LineDeltaKitPanel() {
  const [claimedStr, setClaimedStr] = useState("98, 51, 25, 11");
  const [interiorStr, setInteriorStr] = useState("100, 50, 25, 10");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  // Sticky reset: hard refresh / bfcache restore starts empty (Streamer click→result)
  useEffect(() => {
    setDecision(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setDecision(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const run = useCallback(() => {
    const claimed = parseNumList(claimedStr);
    const interior = parseNumList(interiorStr);
    setDecision(gateB(interior, claimed));
  }, [claimedStr, interiorStr]);


  return (
    <div className="forge-child" data-testid="line-delta-kit-live">
      <h3 className="forge-sub">Line Delta Kit — LIVE</h3>
      <p className="muted small">
        Paste claimed and on-receipt line amounts, then run the gate for a GRANT/REFUSE with mask and failed indices.
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
      <div className="actions">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 49, 25, 9");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 49, 25, 9]));
          }}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 51, 25, 11");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 51, 25, 11]));
          }}
        >
          Demo REFUSE
        </button>
        <button type="button" className="ghost" onClick={() => setDecision(null)}>
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run Line Delta gate
        </button>
      </div>
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
          <table className="delta-table">
            <thead>
              <tr>
                <th>LINE</th>
                <th>CLAIMED (C)</th>
                <th>SOURCE (S)</th>
                <th>C≤S</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({
                length: Math.max(
                  parseNumList(claimedStr).length,
                  parseNumList(interiorStr).length,
                ),
              }).map((_, i) => {
                const c = parseNumList(claimedStr)[i];
                const n = parseNumList(interiorStr)[i];
                const ok =
                  Number.isFinite(c) && Number.isFinite(n) && (c as number) <= (n as number);
                return (
                  <tr key={i}>
                    <td>{i}</td>
                    <td>{money(c ?? 0)}</td>
                    <td>{money(n ?? 0)}</td>
                    <td className={ok ? "ok" : "bad"}>
                      {ok ? "CLEAR" : `OVER ${money((c ?? 0) - (n ?? 0))}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {decision.failedIndices.length > 0 ? (
            <>
              <p className="muted small">
                {decision.failedIndices.length} line{decision.failedIndices.length === 1 ? "" : "s"} over
                on-receipt amounts — REFUSE with mask {decision.mask}.
              </p>
              <p className="conjunctive-line">
                Surplus on one line cannot cover a deficit on another — ADMIT only if claimed ≤
                on-receipt on every line.
              </p>
            </>
          ) : (
            <p className="conjunctive-line ok">
              ADMIT: every line claimed ≤ on-receipt (componentwise) — no total-only offset.
            </p>
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
    const claimed = parseNumList(claimedStr);
    const interior = parseNumList(interiorStr);
    setDecision(gateB(interior, claimed));
  }, [claimedStr, interiorStr]);

  useEffect(() => {
    setDecision(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setDecision(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const n = Math.max(parseNumList(claimedStr).length, parseNumList(interiorStr).length);

  return (
    <div className="forge-child" data-testid="mask-chip-lite-live">
      <h3 className="forge-sub">Mask Chip Lite — LIVE</h3>
      <p className="muted small">
        Better than parent: interactive bit chips (b0=1 means line 0 over). Empty on load.
      </p>
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
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 49, 25, 9");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 49, 25, 9]));
          }}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 51, 25, 11");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 51, 25, 11]));
          }}
        >
          Demo REFUSE
        </button>
        <button type="button" className="ghost" onClick={() => setDecision(null)}>
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run Mask Chip
        </button>
      </div>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status === "grant" ? "GRANT" : "REFUSE"}</strong>
          <div className="bits">
            {Array.from({ length: n }).map((_, i) => {
              const on = decision.failedIndices.includes(i);
              return (
                <span key={i} className={"bit " + (on ? "on" : "off")} title={"bit " + i}>
                  b{i}={on ? "1" : "0"}
                </span>
              );
            })}
          </div>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.failedIndices.length
                ? ` · failed [${decision.failedIndices.join(",")}]`
                : " · clear"}
            </span>
          </div>
          <GateLedgerTable
            lines={Array.from({ length: n }).map((_, i) => {
              const c = parseNumList(claimedStr)[i] ?? 0;
              const inn = parseNumList(interiorStr)[i] ?? 0;
              return {
                line: String(i),
                claimed: c,
                interior: inn,
                over: decision.failedIndices.includes(i),
              };
            })}
          />
        </div>
      ) : null}
    </div>
  );
}




function parseInteriorText(text: string): number[] {
  const tagged = text.match(/INTERIOR:\s*([0-9.,\s]+)/i);
  if (tagged?.[1]) return parseNumList(tagged[1]);
  const dollars = [...text.matchAll(/\$([0-9]+(?:\.[0-9]+)?)/g)].map((m) => Number(m[1]));
  return dollars;
}


/** Gate A = ResidualGates (claimed ≤ on-receipt). Gate B = enclosure caps (independent). */
function gateEnclosure(caps: number[], claimed: number[]): GateDecision {
  return gateB(caps, claimed);
}


function FaultTaxonomyPanel() {
  const [claimedStr, setClaimedStr] = useState("98, 51, 25, 11");
  const [interiorStr, setInteriorStr] = useState("100, 50, 25, 10");
  const [decision, setDecision] = useState<GateDecision | null>(null);

  useEffect(() => {
    setDecision(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setDecision(null);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const run = useCallback(() => {
    setDecision(gateB(parseNumList(interiorStr), parseNumList(claimedStr)));
  }, [claimedStr, interiorStr]);

  const claimed = parseNumList(claimedStr);
  const interior = parseNumList(interiorStr);
  const fc = decision ? faultClass(interior, claimed, decision) : null;

  return (
    <div className="forge-child" id="fault-taxonomy-live" data-testid="fault-taxonomy-live">
      <h3 className="forge-sub">Fault taxonomy — LIVE</h3>
      <p className="muted small">
        Two refuse stories, one ResidualGates: <strong>residual over</strong> (numbers too high)
        vs <strong>length mismatch</strong> (claim shape ≠ receipt lines). Not chat yes/no.
      </p>
      <label className="forge-label">
        Claimed
        <input className="forge-input" value={claimedStr} onChange={(e) => setClaimedStr(e.target.value)} />
      </label>
      <label className="forge-label">
        On-receipt
        <input className="forge-input" value={interiorStr} onChange={(e) => setInteriorStr(e.target.value)} />
      </label>
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 51, 25, 11");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 51, 25, 11]));
          }}
        >
          Demo residual over
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 51, 25");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 51, 25]));
          }}
        >
          Demo length mismatch
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 49, 25, 9");
            setInteriorStr("100, 50, 25, 10");
            setDecision(gateB([100, 50, 25, 10], [98, 49, 25, 9]));
          }}
        >
          Demo GRANT mask==0
        </button>
        <button type="button" className="ghost" onClick={() => setDecision(null)}>
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run taxonomy
        </button>
      </div>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status.toUpperCase()}</strong>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.mask === 0 ? " · GRANT ⇔ mask==0" : ` · bits → lines [${decision.failedIndices.join(",")}]`}
            </span>
            {fc ? <span className="mask-chip">{faultClassLabel(fc)}</span> : null}
          </div>
          <GateLedgerTable
            lines={Array.from({
              length: Math.max(claimed.length, interior.length),
            }).map((_, i) => ({
              line: String(i),
              claimed: claimed[i] ?? 0,
              interior: interior[i] ?? 0,
              over:
                Number.isFinite(claimed[i]) &&
                Number.isFinite(interior[i]) &&
                (claimed[i] as number) > (interior[i] as number),
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}



function SortingMachinePanel() {
  const [claimedStr, setClaimedStr] = useState("");
  const [sourceStr, setSourceStr] = useState("");
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [stage, setStage] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  useEffect(() => {
    setDecision(null);
    setStage(0);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setDecision(null);
        setStage(0);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const claimed = parseNumList(claimedStr);
  const source = parseNumList(sourceStr);

  const run = useCallback(() => {
    const c = parseNumList(claimedStr);
    const s = parseNumList(sourceStr);
    setStage(3);
    const d = gateB(s, c);
    setDecision(d);
    setStage(5);
  }, [claimedStr, sourceStr]);

  const loadGrant = () => {
    setClaimedStr("98, 49, 25, 9");
    setSourceStr("100, 50, 25, 10");
    setStage(1);
    setDecision(null);
  };
  const loadRefuse = () => {
    setClaimedStr("90, 60, 20, 10");
    setSourceStr("100, 50, 25, 10");
    setStage(1);
    setDecision(null);
  };

  const stages = ["Intake", "Filter", "Evidence", "Verdict", "Store"] as const;

  return (
    <div className="forge-child" id="sorting-machine-live" data-testid="sorting-machine-live">
      <h3 className="forge-sub">Sorting machine — LIVE</h3>
      <p className="muted small">
        One law: <strong>C ≤ S</strong> (claimed ≤ source) on every line. Output is a bucket —{" "}
        <strong>GRANT</strong> or <strong>REFUSE</strong> — never a chat shrug.
      </p>
      <ol className="pass-bar muted small" aria-label="Sort stages">
        {stages.map((name, i) => (
          <li key={name}>
            <strong className={stage > i ? "ok" : undefined}>
              {i + 1}. {name}
            </strong>
            {stage > i ? " ✓" : ""}
          </li>
        ))}
      </ol>
      <label className="forge-label">
        Claimed (C)
        <input
          className="forge-input"
          value={claimedStr}
          onChange={(e) => {
            setClaimedStr(e.target.value);
            setStage(1);
            setDecision(null);
          }}
          placeholder="90, 60, 20, 10"
        />
      </label>
      <label className="forge-label">
        Source / on-receipt (S)
        <input
          className="forge-input"
          value={sourceStr}
          onChange={(e) => {
            setSourceStr(e.target.value);
            setStage(2);
            setDecision(null);
          }}
          placeholder="100, 50, 25, 10"
        />
      </label>
      <div className="row">
        <button type="button" className="ghost" onClick={loadGrant}>
          Load GRANT sort
        </button>
        <button type="button" className="ghost" onClick={loadRefuse}>
          Load REFUSE sort (C&gt;S on a line)
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("");
            setSourceStr("");
            setDecision(null);
            setStage(0);
          }}
        >
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Sort C ≤ S
        </button>
      </div>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <p className="eyebrow">Bucket</p>
          <h3>
            <span className="verdict-stamp">
              {decision.status === "grant" && decision.mask === 0 ? "GRANT" : "REFUSE"}
            </span>
          </h3>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.mask === 0
                ? " · all lines C ≤ S"
                : ` · fail lines [${decision.failedIndices.join(",")}]`}
            </span>
          </div>
          <GateLedgerTable
            lines={Array.from({
              length: Math.max(claimed.length, source.length),
            }).map((_, i) => ({
              line: String(i),
              claimed: claimed[i] ?? 0,
              interior: source[i] ?? 0,
              over:
                Number.isFinite(claimed[i]) &&
                Number.isFinite(source[i]) &&
                (claimed[i] as number) > (source[i] as number),
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}


function ChatShrugTrapPanel() {
  const [claimedStr, setClaimedStr] = useState(shrugTrapClaimed.join(", "));
  const [interiorStr, setInteriorStr] = useState(shrugTrapInterior.join(", "));
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setDecision(null);
    setCopied(false);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setDecision(null);
        setCopied(false);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const claimed = parseNumList(claimedStr);
  const interior = parseNumList(interiorStr);

  const run = useCallback(() => {
    setCopied(false);
    setDecision(gateB(parseNumList(interiorStr), parseNumList(claimedStr)));
  }, [claimedStr, interiorStr]);

  const loadTrap = () => {
    setClaimedStr(shrugTrapClaimed.join(", "));
    setInteriorStr(shrugTrapInterior.join(", "));
    setDecision(gateB(shrugTrapInterior, shrugTrapClaimed));
    setCopied(false);
  };

  const shrug = decision ? chatWouldShrug(interior, claimed, decision) : false;
  const receipt = decision ? refuseReceiptText(interior, claimed, decision) : "";

  return (
    <div className="forge-child" id="chat-shrug-trap" data-testid="chat-shrug-trap">
      <h3 className="forge-sub">Chat shrug trap — LIVE</h3>
      <p className="muted small">
        Block / GIW chat can shrug &quot;totals look fine.&quot; ResidualGates cannot:{" "}
        <strong>claimed ≤ on-receipt on every line</strong>. This fixture keeps the sum under
        budget and still <strong>REFUSE</strong>s the OVER line.
      </p>
      <label className="forge-label">
        Claimed
        <input
          className="forge-input"
          value={claimedStr}
          onChange={(e) => setClaimedStr(e.target.value)}
        />
      </label>
      <label className="forge-label">
        On-receipt
        <input
          className="forge-input"
          value={interiorStr}
          onChange={(e) => setInteriorStr(e.target.value)}
        />
      </label>
      <div className="row">
        <button type="button" className="ghost" onClick={loadTrap}>
          Load shrug trap
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setDecision(null);
            setCopied(false);
          }}
        >
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run gate
        </button>
      </div>
      {decision ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status.toUpperCase()}</strong>
          <div className="mask-row">
            <span className="mask-chip">
              mask {decision.mask}
              {decision.mask === 0
                ? " · GRANT ⇔ mask==0"
                : ` · failed [${decision.failedIndices.join(",")}]`}
            </span>
            <span className="mask-chip">
              SUM claimed {vectorSum(claimed)} · SUM on-receipt {vectorSum(interior)}
            </span>
          </div>
          {shrug ? (
            <p className="conjunctive-line">
              Chat would shrug: totals OK ({vectorSum(claimed)} ≤ {vectorSum(interior)}). Gate:{" "}
              <strong>REFUSE</strong> — surplus on a clear line cannot cover the OVER line.
            </p>
          ) : decision.status === "refuse" ? (
            <p className="conjunctive-line">
              Totals also over (or shape bad) — still line-ledger REFUSE, not chat yes/no.
            </p>
          ) : (
            <p className="conjunctive-line ok">
              ADMIT: every line claimed ≤ on-receipt (componentwise).
            </p>
          )}
          <GateLedgerTable
            lines={Array.from({
              length: Math.max(claimed.length, interior.length),
            }).map((_, i) => ({
              line: String(i),
              claimed: claimed[i] ?? 0,
              interior: interior[i] ?? 0,
              over:
                Number.isFinite(claimed[i]) &&
                Number.isFinite(interior[i]) &&
                (claimed[i] as number) > (interior[i] as number),
            }))}
          />
          <div className="row" style={{ marginTop: "0.65rem" }}>
            <button
              type="button"
              className="ghost"
              onClick={() => {
                void navigator.clipboard?.writeText(receipt).then(() => {
                  setCopied(true);
                });
              }}
            >
              {copied ? "Copied refuse receipt" : "Copy refuse receipt"}
            </button>
          </div>
          <pre className="muted small" style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>
            {receipt}
          </pre>
        </div>
      ) : null}
    </div>
  );
}


function DualOracleDisagreePanel() {
  const [claimedStr, setClaimedStr] = useState("98, 49, 25, 9");
  const [interiorStr, setInteriorStr] = useState("100, 50, 25, 10");
  const [capsStr, setCapsStr] = useState("100, 50, 20, 10");
  const [verdictA, setVerdictA] = useState<GateDecision | null>(null);
  const [verdictB, setVerdictB] = useState<GateDecision | null>(null);
  const [mode, setMode] = useState<string | null>(null);

  useEffect(() => {
    setVerdictA(null);
    setVerdictB(null);
    setMode(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setVerdictA(null);
        setVerdictB(null);
        setMode(null);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const run = useCallback(() => {
    const claimed = parseNumList(claimedStr);
    const interior = parseNumList(interiorStr);
    const caps = parseNumList(capsStr);
    setVerdictA(gateB(interior, claimed));
    setVerdictB(gateEnclosure(caps, claimed));
    setMode("run");
  }, [claimedStr, interiorStr, capsStr]);

  const split =
    verdictA && verdictB ? verdictA.status !== verdictB.status : false;

  const ledgerLines = (
    claimed: number[],
    ceiling: number[],
    decision: GateDecision,
  ) =>
    Array.from({ length: Math.max(claimed.length, ceiling.length) }).map((_, i) => ({
      line: String(i),
      claimed: claimed[i] ?? 0,
      interior: ceiling[i] ?? 0,
      over: decision.failedIndices.includes(i),
    }));

  return (
    <div className="forge-child" id="dual-oracle-disagree-live" data-testid="dual-oracle-disagree-live">
      <h3 className="forge-sub">Dual-oracle disagree — LIVE</h3>
      <p className="muted small">
        Two independent checks on the same claim — not one chat yes/no. Gate A =
        ResidualGates (claimed ≤ on-receipt). Gate B = enclosure caps (separate
        ceiling). When they split, both verdicts stay visible.
      </p>
      <label className="forge-label">
        Claimed
        <input className="forge-input" value={claimedStr} onChange={(e) => setClaimedStr(e.target.value)} />
      </label>
      <label className="forge-label">
        On-receipt (Gate A)
        <input className="forge-input" value={interiorStr} onChange={(e) => setInteriorStr(e.target.value)} />
      </label>
      <label className="forge-label">
        Enclosure caps (Gate B)
        <input className="forge-input" value={capsStr} onChange={(e) => setCapsStr(e.target.value)} />
      </label>
      <div className="row">
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 49, 25, 9");
            setInteriorStr("100, 50, 25, 10");
            setCapsStr("100, 50, 20, 10");
            const claimed = [98, 49, 25, 9];
            const a = gateB([100, 50, 25, 10], claimed);
            const b = gateEnclosure([100, 50, 20, 10], claimed);
            setVerdictA(a);
            setVerdictB(b);
            setMode("A GRANT · B REFUSE");
          }}
        >
          Demo A GRANT · B REFUSE
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setClaimedStr("98, 51, 25, 11");
            setInteriorStr("100, 50, 25, 10");
            setCapsStr("200, 200, 200, 200");
            const claimed = [98, 51, 25, 11];
            const a = gateB([100, 50, 25, 10], claimed);
            const b = gateEnclosure([200, 200, 200, 200], claimed);
            setVerdictA(a);
            setVerdictB(b);
            setMode("A REFUSE · B GRANT");
          }}
        >
          Demo A REFUSE · B GRANT
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            // Fee≠prize: claim Track One ~$2100 as "prize cash" vs Luma interior 0
            setClaimedStr("2100");
            setInteriorStr("0");
            setCapsStr("0");
            const a = gateB([0], [2100]);
            const b = gateEnclosure([0], [2100]);
            setVerdictA(a);
            setVerdictB(b);
            setMode("Fee≠prize");
          }}
        >
          Demo Fee≠prize REFUSE
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setVerdictA(null);
            setVerdictB(null);
            setMode(null);
          }}
        >
          Reset
        </button>
        <button type="button" className="primary" onClick={run}>
          Run A + B
        </button>
      </div>
      {verdictA && verdictB ? (
        <div className={"dual-oracle-grid" + (split ? " split" : "")}>
          {split ? (
            <p className="conjunctive-line">
              Split — Gate A and Gate B disagree. Both stay on the board (not a single
              yes/no).
            </p>
          ) : (
            <p className="conjunctive-line ok">
              Agree — both gates {verdictA.status.toUpperCase()}.
            </p>
          )}
          {mode === "Fee≠prize" ? (
            <p className="muted small">
              Fee≠prize: USPTO Track One ~$2,100 is a fee fixture, not All Gas prize cash
              ($10k / $5k / $1.5k only).
            </p>
          ) : null}
          <div className={"card " + (verdictA.status === "grant" ? "grant" : "refuse")}>
            <strong>Gate A · Residual · {verdictA.status.toUpperCase()}</strong>
            <div className="mask-row">
              <span className="mask-chip">
                mask {verdictA.mask}
                {verdictA.mask === 0 ? " · GRANT ⇔ mask==0" : ` · failed [${verdictA.failedIndices.join(",")}]`}
              </span>
            </div>
            <GateLedgerTable
              lines={ledgerLines(parseNumList(claimedStr), parseNumList(interiorStr), verdictA)}
            />
          </div>
          <div className={"card " + (verdictB.status === "grant" ? "grant" : "refuse")}>
            <strong>Gate B · Enclosure · {verdictB.status.toUpperCase()}</strong>
            <div className="mask-row">
              <span className="mask-chip">
                mask {verdictB.mask}
                {verdictB.failedIndices.length
                  ? ` · failed [${verdictB.failedIndices.join(",")}]`
                  : " · clear"}
              </span>
            </div>
            <GateLedgerTable
              lines={ledgerLines(parseNumList(claimedStr), parseNumList(capsStr), verdictB)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function UrlReceiptGatePanel() {
  const scrapeUrl = useAction(api.firecrawl.scrapeUrl);
  const [url, setUrl] = useState("/receipts/fuel-grant.html");
  const [claimedStr, setClaimedStr] = useState("98, 49, 25, 9");
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [interior, setInterior] = useState<number[] | null>(null);
  const [receiptShown, setReceiptShown] = useState("");
  const [source, setSource] = useState<"site-fetch" | "firecrawl" | "fixture" | "blocked" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDecision(null);
    setInterior(null);
    setErr(null);
    setSource(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setDecision(null);
        setInterior(null);
        setErr(null);
        setSource(null);
      }
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  const resolveUrl = (raw: string) => {
    const u = raw.trim();
    if (!u) return "";
    if (u.startsWith("http")) return u;
    if (u.startsWith("/")) return `${window.location.origin}${u}`;
    return u;
  };

  const isSameOriginReceipt = (resolved: string) => {
    try {
      const u = new URL(resolved);
      return u.origin === window.location.origin && u.pathname.startsWith("/receipts/");
    } catch {
      return false;
    }
  };

  const applyGate = (inn: number[], claimed: number[], resolved: string, src: typeof source) => {
    if (!inn.length) throw new Error("no INTERIOR / $ lines on page");
    setInterior(inn);
    setReceiptShown(resolved);
    setSource(src);
    setDecision(gateB(inn, claimed));
  };

  const run = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const resolved = resolveUrl(url);
      if (!resolved) throw new Error("Pick a public receipt URL");
      const claimed = parseNumList(claimedStr);

      // Same-origin public receipts: real fetch (demo path, always interactive)
      if (isSameOriginReceipt(resolved)) {
        const res = await fetch(resolved, { credentials: "omit" });
        if (!res.ok) throw new Error(`fetch ${res.status}`);
        const text = await res.text();
        applyGate(parseInteriorText(text), claimed, resolved, "site-fetch");
        return;
      }

      // External URL: real Firecrawl path via Convex when wired
      if (!hasConvex) {
        throw new Error("Convex not configured — use /receipts/* demo URLs");
      }
      const scraped = await scrapeUrl({ url: resolved });
      if (scraped.note?.includes("Judgment blocked") || scraped.text.startsWith("NO_INTERIOR")) {
        setDecision(null);
        setInterior(null);
        setSource("blocked");
        setReceiptShown(resolved);
        throw new Error(scraped.note ?? "Firecrawl required for external URL judgment");
      }
      const inn = parseInteriorText(scraped.text);
      applyGate(inn, claimed, resolved, scraped.source === "firecrawl" ? "firecrawl" : "fixture");
    } catch (e) {
      setDecision(null);
      setInterior(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [url, claimedStr, scrapeUrl]);

  const demoSameOrigin = async (path: string, claimed: number[]) => {
    setUrl(path);
    setClaimedStr(claimed.join(", "));
    setBusy(true);
    setErr(null);
    try {
      const resolved = `${window.location.origin}${path}`;
      const res = await fetch(resolved);
      const text = await res.text();
      applyGate(parseInteriorText(text), claimed, resolved, "site-fetch");
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="forge-child" data-testid="url-receipt-gate-live">
      <h3 className="forge-sub">URL Receipt Gate — LIVE</h3>
      <p className="muted small">
        Beats Attest/NoticeProof/Block: public receipt → scrape/fetch → claimed ≤ on-receipt.
        Same-origin /receipts/* use site fetch; external URLs use Firecrawl via Convex. Empty on load.
      </p>
      <label className="forge-label">
        Public receipt URL
        <select
          className="forge-input"
          value={url.startsWith("/receipts/") ? url : ""}
          onChange={(e) => {
            if (e.target.value) setUrl(e.target.value);
          }}
        >
          <option value="">Custom / external…</option>
          <option value="/receipts/fuel-grant.html">/receipts/fuel-grant.html</option>
          <option value="/receipts/fuel-refuse.html">/receipts/fuel-refuse.html</option>
        </select>
      </label>
      <label className="forge-label">
        Or type URL
        <input className="forge-input" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="forge-label">
        Claimed lines
        <input
          className="forge-input"
          value={claimedStr}
          onChange={(e) => setClaimedStr(e.target.value)}
        />
      </label>
      <div className="row">
        <button
          type="button"
          className="ghost"
          disabled={busy}
          onClick={() => void demoSameOrigin("/receipts/fuel-grant.html", [98, 49, 25, 9])}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="ghost"
          disabled={busy}
          onClick={() => void demoSameOrigin("/receipts/fuel-refuse.html", [98, 51, 25, 11])}
        >
          Demo REFUSE
        </button>
        <button
          type="button"
          className="ghost"
          onClick={() => {
            setDecision(null);
            setInterior(null);
            setErr(null);
            setSource(null);
          }}
        >
          Reset
        </button>
        <button type="button" className="primary" disabled={busy} onClick={() => void run()}>
          {busy ? "Fetching…" : "Fetch + Run gate"}
        </button>
      </div>
      {err ? (
        <div className="card refuse">
          <strong>REFUSE</strong>
          <p className="muted small">Could not read receipt: {err}</p>
        </div>
      ) : null}
      {decision && interior ? (
        <div className={"card " + (decision.status === "grant" ? "grant" : "refuse")}>
          <strong>{decision.status === "grant" ? "GRANT" : "REFUSE"}</strong>
          {source ? (
            <div className="mask-row">
              <span className="mask-chip">source {source}</span>
            </div>
          ) : null}
          <p className="muted small">
            <strong>Receipt</strong> {receiptShown}
          </p>
          {decision.failedIndices.length > 0 ? (
            <ul className="plain-fail">
              {decision.failedIndices.map((i) => {
                const c = parseNumList(claimedStr)[i] ?? 0;
                const n = interior[i] ?? 0;
                return (
                  <li key={i}>
                    Line {i} claimed {money(c)} over on-receipt {money(n)} by {money(c - n)}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="ok-line">Every line clears — claimed ≤ on-receipt.</p>
          )}
          <table className="delta-table">
            <thead>
              <tr>
                <th>LINE</th>
                <th>CLAIMED (C)</th>
                <th>SOURCE (S)</th>
                <th>C≤S</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: Math.max(parseNumList(claimedStr).length, interior.length) }).map(
                (_, i) => {
                  const c = parseNumList(claimedStr)[i];
                  const n = interior[i];
                  const ok =
                    Number.isFinite(c) && Number.isFinite(n) && (c as number) <= (n as number);
                  return (
                    <tr key={i}>
                      <td>{i}</td>
                      <td>{money(c ?? 0)}</td>
                      <td>{money(n ?? 0)}</td>
                      <td className={ok ? "ok" : "bad"}>
                        {ok ? "CLEAR" : `OVER ${money((c ?? 0) - (n ?? 0))}`}
                      </td>
                    </tr>
                  );
                },
              )}
            </tbody>
          </table>
          {decision.failedIndices.length > 0 ? (
            <p className="conjunctive-line">
              Surplus on one line cannot cover a deficit on another — ADMIT only if claimed ≤
              on-receipt on every line.
            </p>
          ) : (
            <p className="conjunctive-line ok">
              ADMIT: every line claimed ≤ on-receipt (componentwise) — no total-only offset.
            </p>
          )}
        </div>
      ) : null}
      <p className="muted small">
        Also open{" "}
        <a href="/forge/url-receipt-gate/" target="_blank" rel="noreferrer">
          /forge/url-receipt-gate/
        </a>
      </p>
    </div>
  );
}

