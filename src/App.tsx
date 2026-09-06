import { useCallback, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import demo from "./data/demo.json";
import { gateB, granted, type GateDecision } from "./lib/residualGates";
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
  aiLine?: string;
};

const LINE_ITEMS = demo.lineItems as string[];
const hasConvex = Boolean(import.meta.env.VITE_CONVEX_URL);
const SHORT = ((demo as { shipShortlist?: string[] }).shipShortlist ?? []).filter(Boolean);
const SHIP_FIXTURES: Fixture[] = SHORT.length
  ? demo.fixtures.filter((f) => SHORT.includes(f.id))
  : demo.fixtures.slice(0, 8);

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
  return SHIP_FIXTURES.find((f) => gateB(f.interior, f.claimed).status === status);
}

export default function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [results, setResults] = useState<LocalDecision[]>([]);
  const [showForge, setShowForge] = useState(false);
  const liveRows = useQuery(api.claims.listDecisions, hasConvex ? { limit: 20 } : "skip");

  const selfCheckOk = useMemo(() => {
    const grant = gateB([100, 50, 25, 10], [98, 49, 25, 9]);
    const refuse = gateB([100, 50, 25, 10], [98, 51, 25, 11]);
    return granted(grant) && refuse.status === "refuse" && refuse.mask === 10;
  }, []);

  const runOne = useCallback((f: Fixture) => {
    const d = runFixture(f);
    setResults((prev) => [d, ...prev.filter((r) => r.id !== d.id)]);
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

  const demoBoth = useCallback(() => {
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

  const selected = results.find((r) => r.id === selectedId) ?? results[0] ?? null;
  const plain = selected
    ? plainFailures(selected.lineItems, selected.claimed, selected.interior, selected.decision.failedIndices)
    : [];

  return (
    <div className="shell board">
      <header className="hero">
        <p className="eyebrow">Expense check · not a chat</p>
        <h1>CeilingGate</h1>
        <p className="lede everyday">
          You send a claim and a public receipt. We compare every line.
          If the claim stays at or under the receipt, it is a <strong>GRANT</strong>.
          If any line is over, it is a <strong>REFUSE</strong> — in plain English.
        </p>
      </header>

      <section className="try-now" aria-label="Try it">
        <p className="try-label">Try it in two taps</p>
        <div className="oneclick">
          <button type="button" className="grant-btn" onClick={demoGrant}>Show a GRANT</button>
          <button type="button" className="refuse-btn" onClick={demoRefuse}>Show a REFUSE</button>
        </div>
        <button type="button" className="sig-btn" onClick={demoBoth}>Show both</button>
      </section>

      <ol className="steps">
        <li>Email a claim plus a public receipt link to <code>ceilinggate-claims@agentmail.to</code></li>
        <li>We read the receipt page (Firecrawl).</li>
        <li>Each line is checked: claimed ≤ amount on the receipt.</li>
      </ol>

      <div className="board-grid">
        <section className="panel verdict-panel">
          <h2>Result</h2>
          {!selected ? (
            <p className="muted empty">Tap <strong>Show a GRANT</strong> or <strong>Show a REFUSE</strong> above.</p>
          ) : (
            <VerdictCard selected={selected} plain={plain} />
          )}
        </section>

        <section className="panel">
          <h2>Inbox</h2>
          {hasConvex && liveRows && liveRows.length > 0 && (
            <>
              <p className="muted small">Live mail</p>
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
                          caseId: c._id,
                          label: c.label ?? "live",
                          claimed,
                          interior,
                          decision,
                          source: "convex",
                          receiptUrl: c.sourceUrl ?? "",
                          lineItems: LINE_ITEMS,
                          subject: c.subject ?? "(no subject)",
                          from: c.from ?? "",
                          aiLine: c.aiLine,
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
            </>
          )}
          <p className="muted small">Samples</p>
          <div className="list">
            {SHIP_FIXTURES.map((f) => {
              const expect = gateB(f.interior, f.claimed);
              const active = selectedId === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  className={"row docket" + (active ? " on" : "") + (expect.status === "grant" ? " edge-grant" : " edge-refuse")}
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

      <p className="trust muted small">
        Convex {hasConvex ? "connected" : "demo"} · Firecrawl · AgentMail · ResidualGates {selfCheckOk ? "ready" : "check failed"}
      </p>

      <footer className="foot">
        <button type="button" className="text-link" onClick={() => setShowForge((v) => !v)}>
          {showForge ? "Hide workshop" : "Workshop (optional)"}
        </button>
        {showForge && (<><TipJarHonestyPanel /><LineDeltaKitPanel /><AppForgePanel /></>)}
        <PwaInstallShell />
      </footer>
    </div>
  );
}

function VerdictCard({ selected, plain }: { selected: LocalDecision; plain: string[] }) {
  const ok = selected.decision.status === "grant";
  return (
    <div className={ok ? "card grant big" : "card refuse big"}>
      <p className="eyebrow">{ok ? "All lines clear" : "Over the receipt"}</p>
      <h3>{ok ? "GRANT" : "REFUSE"}</h3>
      {selected.aiLine ? (<p className="ai-line"><strong>In one line.</strong> {selected.aiLine}</p>) : null}
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
      <div className="evidence">
        <p><strong>Email</strong> {selected.subject}</p>
        {selected.receiptUrl ? <p><strong>Receipt</strong> {selected.receiptUrl}</p> : null}
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: "grant" | "refuse" | "wait" }) {
  if (status === "grant") return <span className="pill grant">GRANT</span>;
  if (status === "wait") return <span className="pill wait">…</span>;
  return <span className="pill refuse">REFUSE</span>;
}

function parseNumList(s: string): number[] {
  return s.split(/[\s,]+/).map((x) => x.trim()).filter(Boolean).map(Number).filter((n) => Number.isFinite(n));
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
    setDecision(gateB([total], [tip]));
  }, [claimedTip, receiptTotal]);
  useEffect(() => { run(); }, [run]);
  return (
    <div className="forge-child">
      <h3 className="forge-sub">Tip check</h3>
      <div className="forge-row">
        <label className="forge-label">Claimed tip<input className="forge-input" type="number" step="0.01" value={claimedTip} onChange={(e) => setClaimedTip(e.target.value)} /></label>
        <label className="forge-label">Receipt total<input className="forge-input" type="number" step="0.01" value={receiptTotal} onChange={(e) => setReceiptTotal(e.target.value)} /></label>
      </div>
      {decision ? (
        <p className={decision.status === "grant" ? "ok-line" : "plain-fail"}>
          {decision.status === "grant" ? "GRANT" : "REFUSE"} — tip {money(Number(claimedTip))} vs receipt {money(Number(receiptTotal))}
        </p>
      ) : null}
    </div>
  );
}

function LineDeltaKitPanel() {
  const [claimedStr, setClaimedStr] = useState("98, 51, 25, 11");
  const [interiorStr, setInteriorStr] = useState("100, 50, 25, 10");
  const [decision, setDecision] = useState<GateDecision | null>(null);
  const run = useCallback(() => {
    setDecision(gateB(parseNumList(interiorStr), parseNumList(claimedStr)));
  }, [claimedStr, interiorStr]);
  useEffect(() => { run(); }, [run]);
  return (
    <div className="forge-child">
      <h3 className="forge-sub">Paste line amounts</h3>
      <label className="forge-label">Claimed<input className="forge-input" value={claimedStr} onChange={(e) => setClaimedStr(e.target.value)} /></label>
      <label className="forge-label">On receipt<input className="forge-input" value={interiorStr} onChange={(e) => setInteriorStr(e.target.value)} /></label>
      {decision ? <p><StatusPill status={decision.status} /></p> : null}
    </div>
  );
}

function AppForgePanel() {
  const [title, setTitle] = useState("Receipt Line Check");
  const [brief, setBrief] = useState("Claimed lines vs public receipt.");
  const [log, setLog] = useState("");
  const spawn = useMutation(api.forge.spawn);
  const live = useQuery(api.forge.list);
  return (
    <div className="forge-child">
      <h3 className="forge-sub">Spawn a checker</h3>
      <label className="forge-label">Title<input className="forge-input" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <label className="forge-label">Brief<input className="forge-input" value={brief} onChange={(e) => setBrief(e.target.value)} /></label>
      <button type="button" className="sig-btn" onClick={async () => {
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || `forge-${Date.now().toString(36)}`;
        try {
          if (hasConvex) {
            await spawn({ slug, title, brief, path: `/forge/${slug}/` });
            setLog(`Saved ${slug}`);
          } else setLog("Convex not connected");
        } catch (e) { setLog(String(e)); }
      }}>Save</button>
      {log ? <p className="muted small">{log}</p> : null}
      <ul className="forge-list">{(live ?? []).map((s) => <li key={s._id}><a href={`/forge/${s.slug}/`}>{s.title}</a></li>)}</ul>
    </div>
  );
}

function PwaInstallShell() {
  const [deferred, setDeferred] = useState<{ prompt: () => Promise<void> } | null>(null);
  const isIos = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);
  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as Event & { prompt: () => Promise<void> });
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);
  return (
    <p className="muted small pwa-note">
      {deferred ? (
        <button type="button" className="text-link" onClick={() => deferred.prompt()}>Install app</button>
      ) : isIos ? "Safari → Share → Add to Home Screen" : "Add to Home Screen from the browser menu"}
    </p>
  );
}
