import { useEffect, useState } from "react";
import type { GateDecision } from "../lib/residualGates";
import { residualCommitment } from "../lib/gr21Residual";
import type { LastResidual } from "../lib/gr21Live";
import { composeOneLine } from "../lib/oneLine";
import { ResidualCaliper } from "./ResidualCaliper";

export type LineRow = { name: string; claimed: number; source: number };

type Props = {
  rows: LineRow[];
  decision: GateDecision;
  subject: string;
  onDemoGrant: () => void;
  onDemoRefuse: () => void;
  onResort: () => void;
  onOneBreath?: () => void;
  onClaimEdit: (idx: number, value: string) => void;
  onSourceEdit: (idx: number, value: string) => void;
  fails: string[];
  showAwait?: boolean;
  liveResidual?: LastResidual | null;
  breathBusy?: boolean;
};

function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function cap(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** Live C ≤ S Demo GRANT/REFUSE lane with Check ID. */
export function DemoGate({
  rows,
  decision,
  subject,
  onDemoGrant,
  onDemoRefuse,
  onResort,
  onOneBreath,
  onClaimEdit,
  onSourceEdit,
  fails,
  showAwait = false,
  liveResidual = null,
  breathBusy = false,
}: Props) {
  const ok = decision.status === "grant" && decision.mask === 0;
  const local = residualCommitment(
    rows.map((r) => r.claimed),
    rows.map((r) => r.source),
    subject || "ceilinggate-gr21",
  );
  const commitHex = liveResidual?.residualCommitment ?? local.commit;
  const historicHex = liveResidual?.historicAnchor ?? local.commit;
  const commitShort = commitHex.slice(0, 12);
  const variance = liveResidual?.variance ?? local.variance;
  const projector =
    liveResidual != null
      ? liveResidual.cLeS
        ? "CLEAR"
        : "OVER"
      : local.projector;
  const liveLabel = liveResidual ? "Live check" : "Local check";
  const oneLine = composeOneLine({
    status: ok ? "grant" : "refuse",
    claimed: rows.map((r) => r.claimed),
    interior: rows.map((r) => r.source),
    failedIndices: decision.failedIndices,
    lineItems: rows.map((r) => r.name),
  });

  const [slamKey, setSlamKey] = useState(0);
  const [idReveal, setIdReveal] = useState(false);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (showAwait) {
      setTyped("");
      setIdReveal(false);
      return;
    }
    setSlamKey((k) => k + 1);
    setIdReveal(false);
    const t0 = window.setTimeout(() => setIdReveal(true), 220);
    setTyped("");
    let i = 0;
    const id = window.setInterval(() => {
      i += 1;
      setTyped(oneLine.slice(0, i));
      if (i >= oneLine.length) window.clearInterval(id);
    }, 18);
    return () => {
      window.clearTimeout(t0);
      window.clearInterval(id);
    };
  }, [showAwait, oneLine, decision.mask, decision.status]);

  return (
    <section className="sm-panel sm-claim" aria-label="Live claim lane">
      <div className="sm-panel-head">
        <div>
          <p className="sm-section-label">Evidence · verdict</p>
          <h2>Claim Check</h2>
        </div>
        <span className={"sm-chip " + (ok ? "grant" : "refuse")}>
          {ok ? "GRANT" : "REFUSE"}
        </span>
      </div>
      <p className="sm-subj">{subject}</p>
      <p className="sm-rival-hint">
        Line ledger · Claimed (C) · On receipt (S) · Status · S_H
      </p>
      <p className="sm-demo-path">
        Try a <strong>REFUSE</strong> example (amount over receipt), then a{" "}
        <strong>GRANT</strong> example (under or equal). A short summary follows
        the numbers.
      </p>
      <div className="sm-demo-row">
        {onOneBreath ? (
          <button
            type="button"
            className="sm-btn breath"
            onClick={onOneBreath}
            disabled={breathBusy}
          >
            {breathBusy ? "Running…" : "Show REFUSE then GRANT"}
          </button>
        ) : null}
        <button type="button" className="sm-btn refuse" onClick={onDemoRefuse}>
          Demo REFUSE
        </button>
        <button type="button" className="sm-btn grant" onClick={onDemoGrant}>
          Demo GRANT
        </button>
        <button type="button" className="sm-btn ghost" onClick={onResort}>
          Re-sort C ≤ S
        </button>
      </div>

      {showAwait ? (
        <div className="sm-verdict await" aria-live="polite">
          <div>
            <strong>Waiting for a result</strong>
            <p className="sm-await-hint">
              Press Demo REFUSE or Demo GRANT to run the check
            </p>
          </div>
        </div>
      ) : (
        <div
          key={slamKey}
          className={"sm-verdict sm-slam sm-first-breath " + (ok ? "grant" : "refuse")}
          data-testid="verdict-slam"
        >
          <div
            className={
              "sm-verdict-stamp sm-stamp-slam" +
              (ok ? " el-ice el-lightning" : " el-fire")
            }
            data-element={ok ? "ICE+LIGHTNING" : "FIRE"}
          >
            {ok ? "GRANT" : "REFUSE"}
          </div>
          <p className="sm-seal" data-testid="hybrid-seal">
            {ok ? (
              <>
                <strong>S_H = 1</strong> · C ≤ S · commit OK
              </>
            ) : (
              <>
                <strong>S_H = 0</strong> · REFUSE · over amount shown
              </>
            )}
          </p>
          <div
            className={
              "sm-proof-stamp sm-proof-readable" +
              (idReveal ? " is-revealed el-reveal" : " is-sealed")
            }
            data-element={idReveal ? "REVEAL" : "SEALED"}
            title={`commit=${commitHex}\nhistoric=${historicHex}`}
            data-testid="proof-residual-stamp"
          >
            <span className="sm-proof-kicker">Check ID</span>
            <span
              className={
                "sm-proof-proj " + (projector === "CLEAR" ? "clear" : "over")
              }
            >
              C≤S {projector}
            </span>
            <code className="sm-proof-id">
              {idReveal ? commitShort : "············"}
            </code>
            <span className="sm-proof-meta">
              σ² {variance.toExponential(2)}
              {projector === "CLEAR" ? " · balanced" : ""}
              {" · "}
              {liveLabel}
            </span>
          </div>
          <ResidualCaliper rows={rows} failedIndices={decision.failedIndices} />
          <p className="sm-oneline sm-oneline-type" data-testid="openai-oneline">
            <span className="sm-oneline-label">Summary line</span>
            <span className="sm-oneline-text">{typed}</span>
            <span className="sm-caret" aria-hidden>
              ▍
            </span>
          </p>
          {fails.length ? (
            <ul>
              {fails.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : (
            <p>Every line passes C ≤ S.</p>
          )}
          <p className="sm-mask">
            mask {decision.mask}
            {decision.failedIndices.length
              ? ` · fail [${decision.failedIndices.join(",")}]`
              : " · all lines OK"}
          </p>
        </div>
      )}

      <p className="sm-section-label sm-ledger-label">Line ledger · claim vs receipt</p>
      <table className="sm-ledger" aria-label="Line ledger">
        <thead>
          <tr>
            <th>LINE</th>
            <th>CLAIMED (C)</th>
            <th>ON RECEIPT (S)</th>
            <th>Δ</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => {
            const fail = decision.failedIndices.includes(i);
            const delta = r.claimed - r.source;
            return (
              <tr key={r.name + i} className={fail ? "fail" : "ok"}>
                <td>{cap(r.name)}</td>
                <td>
                  <input
                    className="sm-cell"
                    type="number"
                    step="1"
                    value={r.claimed}
                    onChange={(e) => onClaimEdit(i, e.target.value)}
                    aria-label={`${r.name} claimed`}
                  />
                </td>
                <td>
                  <input
                    className="sm-cell"
                    type="number"
                    step="1"
                    value={r.source}
                    onChange={(e) => onSourceEdit(i, e.target.value)}
                    aria-label={`${r.name} source`}
                  />
                </td>
                <td className={fail ? "neg" : "pos"}>
                  {fail ? `+${money(delta)}` : money(Math.max(0, -delta))}
                </td>
                <td>
                  <span className={"sm-line-chip " + (fail ? "over" : "clear")}>
                    {fail ? "OVER" : "CLEAR"}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

    </section>
  );
}
