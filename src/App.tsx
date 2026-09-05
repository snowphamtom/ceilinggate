import { useCallback, useMemo, useState } from "react";
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
      <header className="top">
        <div>
          <p className="eyebrow">
            For small businesses · contractors · grant seekers
          </p>
          <h1>CeilingGate</h1>
          <p className="lede everyday">
            Email your expense claim with a public receipt link — CeilingGate
            checks each line against the scraped receipt and tells you{" "}
            <strong>GRANT</strong>, or which lines are over (in plain English).
          </p>
          <p className="muted small">
            Not a chat bot. Not a developer toolkit. Claim in → receipt scrape →
            clear result.
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
        </div>
      </header>

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

      <div className="board-grid">
        <section className="panel">
          <h2>Claims inbox</h2>
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
                    from {f.email.from} · receipt on file
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
              Hit <strong>Demo GRANT</strong> or <strong>Demo REFUSE</strong>,
              or pick a claim.
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
        SDK. Email in → Firecrawl receipt scrape → clear GRANT or REFUSE. Cash
        prizes for All Gas: $10k / $5k / $1.5k only.
      </footer>
    </div>
  );
}

function StatusPill({ status }: { status: "grant" | "refuse" }) {
  if (status === "grant") return <span className="pill grant">GRANT</span>;
  return <span className="pill refuse">REFUSE</span>;
}
