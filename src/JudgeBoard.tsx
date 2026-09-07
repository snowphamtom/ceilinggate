import { useCallback, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import demo from "./data/demo.json";
import { gateB, type GateDecision } from "./lib/residualGates";

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
const SHIP_FIXTURES: Fixture[] = demo.fixtures.filter(
  (f) => f.id === "te-grant" || f.id === "te-refuse",
);

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
    return `${capitalize(name)} is ${money(c - n)} over the receipt.`;
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

export default function JudgeBoard() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<LocalDecision[]>([]);
  const liveRows = useQuery(api.claims.listDecisions, hasConvex ? { limit: 8 } : "skip");

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
          The receipt is the ceiling. Every line is compared.
          At or under — <strong>GRANT</strong>. Over — <strong>REFUSE</strong>, named in dollars.
        </p>
      </header>

      <section className="try-now" aria-label="Try it">
        <p className="try-label">Try it</p>
        <div className="oneclick">
          <button
            type="button"
            className="grant-btn"
            onClick={() => {
              const f = pickByExpect("grant");
              if (f) runOne(f);
            }}
          >
            Demo GRANT
          </button>
          <button
            type="button"
            className="refuse-btn"
            onClick={() => {
              const f = pickByExpect("refuse");
              if (f) runOne(f);
            }}
          >
            Demo REFUSE
          </button>
        </div>
      </section>

      <ol className="steps">
        <li>Email a claim and a public receipt to <code>ceilinggate-claims@agentmail.to</code></li>
        <li>Firecrawl reads the page.</li>
        <li>Numbers decide. One sentence after — it does not pick GRANT or REFUSE.</li>
      </ol>

      <div className="board-grid">
        <section className="panel verdict-panel">
          <h2>Result</h2>
          {!selected ? (
            <p className="muted empty">Tap GRANT or REFUSE.</p>
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
                    className={
                      "row docket" +
                      (status === "grant" ? " edge-grant" : "") +
                      (status === "refuse" ? " edge-refuse" : "")
                    }
                    onClick={() => {
                      const interior = c.interior ?? [];
                      const claimed = c.claimed ?? [];
                      const decision =
                        d?.status === "grant" || d?.status === "refuse"
                          ? {
                              status: d.status as "grant" | "refuse",
                              mask: d.mask ?? 0,
                              failedIndices: d.failedIndices ?? [],
                            }
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
                  className={
                    "row docket" +
                    (selectedId === f.id ? " on" : "") +
                    (expect.status === "grant" ? " edge-grant" : " edge-refuse")
                  }
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
    </div>
  );
}

function VerdictCard({ selected, plain }: { selected: LocalDecision; plain: string[] }) {
  const ok = selected.decision.status === "grant";
  return (
    <div className={ok ? "card grant big" : "card refuse big"}>
      <p className="eyebrow">{ok ? "All lines clear" : "Over the receipt"}</p>
      <h3>
        <span className="verdict-stamp">{ok ? "GRANT" : "REFUSE"}</span>
      </h3>
      {selected.aiLine ? (
        <p className="ai-line">
          <strong>In one line.</strong> {selected.aiLine}
        </p>
      ) : null}
      {plain.length > 0 ? (
        <ul className="plain-fail">
          {plain.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      ) : (
        <p className="ok-line">Every line is at or under the receipt.</p>
      )}
      <table className="ledger">
        <thead>
          <tr>
            <th>LINE</th>
            <th>CLAIMED</th>
            <th>ON RECEIPT</th>
            <th></th>
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
                <td>{money(c)}</td>
                <td>{money(n)}</td>
                <td>
                  <span className={"status-chip " + (fail ? "over" : "clear")}>
                    {fail ? "OVER" : "CLEAR"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className={ok ? "conjunctive-line ok" : "conjunctive-line"}>
        A leftover on one line cannot pay a hole on another.
      </p>
      {selected.receiptUrl ? (
        <div className="evidence">
          <p>
            <strong>Receipt</strong> {selected.receiptUrl}
          </p>
        </div>
      ) : null}
    </div>
  );
}

function StatusPill({ status }: { status: "grant" | "refuse" | "wait" }) {
  if (status === "grant") return <span className="pill grant">GRANT</span>;
  if (status === "wait") return <span className="pill wait">Waiting on a receipt</span>;
  return <span className="pill refuse">REFUSE</span>;
}
