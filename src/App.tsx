import { useCallback, useEffect, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import demo from "./data/demo.json";
import { gateB, type GateDecision } from "./lib/residualGates";
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
        <p className="try-label">Try it</p>
        <div className="oneclick">
          <button type="button" className="grant-btn" onClick={() => { const f = pickByExpect("grant"); if (f) runOne(f); }}>Demo GRANT</button>
          <button type="button" className="refuse-btn" onClick={() => { const f = pickByExpect("refuse"); if (f) runOne(f); }}>Demo REFUSE</button>
        </div>
      </section>

      <ol className="steps">
        <li>Email the claim and a public receipt link to <code>ceilinggate-claims@agentmail.to</code></li>
        <li>Firecrawl reads the receipt page.</li>
        <li>Each line must stay at or under the receipt. OpenAI writes one sentence after the numbers (does not decide GRANT/REFUSE).</li>
      </ol>

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
        <section className="panel verdict-panel">
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
        <LineDeltaKitPanel />
        <MaskChipLitePanel />
        <UrlReceiptGatePanel />
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
          </tbody>
        </table>
      </section>
    </div>
  );
}

function VerdictCard({ selected, plain }: { selected: LocalDecision; plain: string[] }) {
  const ok = selected.decision.status === "grant";
  return (
    <div className={ok ? "card grant big" : "card refuse big"}>
      <p className="eyebrow">{ok ? "All lines clear" : "Over the receipt"}</p>
      <h3>{ok ? "GRANT" : "REFUSE"}</h3>
      {selected.aiLine ? <p className="ai-line"><strong>In one line.</strong> {selected.aiLine}</p> : null}
      {plain.length > 0 ? (
        <ul className="plain-fail">{plain.map((line) => <li key={line}>{line}</li>)}</ul>
      ) : (
        <p className="ok-line">Every line is at or under the receipt.</p>
      )}
      <table className="ledger">
        <thead><tr><th>Line</th><th>Claimed</th><th>On receipt</th><th></th></tr></thead>
        <tbody>
          {selected.lineItems.map((name, i) => {
            const c = selected.claimed[i] ?? 0;
            const n = selected.interior[i] ?? 0;
            const fail = selected.decision.failedIndices.includes(i);
            return (
              <tr key={`${name}-${i}`} className={fail ? "fail" : ""}>
                <td>{capitalize(name)}</td>
                <td>{money(c)}</td>
                <td>{money(n)}</td>
                <td>{fail ? "Over" : "OK"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
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
          <p className="muted small">
            Claimed tip {money(Number(claimedTip))} vs receipt{" "}
            {money(Number(receiptTotal))} · Δ{" "}
            {money(Number(claimedTip) - Number(receiptTotal))}
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
                <th>Line</th>
                <th>Claimed</th>
                <th>Interior</th>
                <th>Status</th>
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
            <p className="muted small">
              {decision.failedIndices.length} line{decision.failedIndices.length === 1 ? "" : "s"} over
              on-receipt amounts — REFUSE with mask {decision.mask}.
            </p>
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

function UrlReceiptGatePanel() {
  const [url, setUrl] = useState("/receipts/fuel-grant.html");
  const [claimedStr, setClaimedStr] = useState("98, 49, 25, 9");
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const [interior, setInterior] = useState<number[] | null>(null);
  const [receiptShown, setReceiptShown] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDecision(null);
    setInterior(null);
    setErr(null);
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        setDecision(null);
        setInterior(null);
        setErr(null);
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

  const run = useCallback(async () => {
    setBusy(true);
    setErr(null);
    try {
      const resolved = resolveUrl(url);
      if (!resolved) throw new Error("Pick a public receipt URL");
      const res = await fetch(resolved, { credentials: "omit" });
      if (!res.ok) throw new Error(`fetch ${res.status}`);
      const text = await res.text();
      const inn = parseInteriorText(text);
      if (!inn.length) throw new Error("no INTERIOR / $ lines on page");
      const claimed = parseNumList(claimedStr);
      setInterior(inn);
      setReceiptShown(resolved);
      setDecision(gateB(inn, claimed));
    } catch (e) {
      setDecision(null);
      setInterior(null);
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }, [url, claimedStr]);

  return (
    <div className="forge-child" data-testid="url-receipt-gate-live">
      <h3 className="forge-sub">URL Receipt Gate — LIVE</h3>
      <p className="muted small">
        Beats Attest/NoticeProof/Block: fetch a public receipt page, compare claimed ≤ on-receipt,
        plain-English overs. Empty on load — not inbox yes/no.
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
          <option value="">Custom…</option>
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
          onClick={() => {
            setUrl("/receipts/fuel-grant.html");
            setClaimedStr("98, 49, 25, 9");
            void (async () => {
              setUrl("/receipts/fuel-grant.html");
              setClaimedStr("98, 49, 25, 9");
              setBusy(true);
              setErr(null);
              try {
                const resolved = `${window.location.origin}/receipts/fuel-grant.html`;
                const res = await fetch(resolved);
                const text = await res.text();
                const inn = parseInteriorText(text);
                setInterior(inn);
                setReceiptShown(resolved);
                setDecision(gateB(inn, [98, 49, 25, 9]));
              } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          Demo GRANT
        </button>
        <button
          type="button"
          className="ghost"
          disabled={busy}
          onClick={() => {
            void (async () => {
              setUrl("/receipts/fuel-refuse.html");
              setClaimedStr("98, 51, 25, 11");
              setBusy(true);
              setErr(null);
              try {
                const resolved = `${window.location.origin}/receipts/fuel-refuse.html`;
                const res = await fetch(resolved);
                const text = await res.text();
                const inn = parseInteriorText(text);
                setInterior(inn);
                setReceiptShown(resolved);
                setDecision(gateB(inn, [98, 51, 25, 11]));
              } catch (e) {
                setErr(e instanceof Error ? e.message : String(e));
              } finally {
                setBusy(false);
              }
            })();
          }}
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
                <th>Line</th>
                <th>Claimed</th>
                <th>On receipt</th>
                <th>Status</th>
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

