import type { GateDecision } from "../lib/residualGates";
import { residualCommitment } from "../lib/gr21Residual";
import type { LastResidual } from "../lib/gr21Live";

export type LineRow = { name: string; claimed: number; source: number };

type Props = {
  rows: LineRow[];
  decision: GateDecision;
  subject: string;
  onDemoGrant: () => void;
  onDemoRefuse: () => void;
  onResort: () => void;
  onClaimEdit: (idx: number, value: string) => void;
  onSourceEdit: (idx: number, value: string) => void;
  fails: string[];
  showAwait?: boolean;
  /** Live Evidence gr21:getLastResidual — prefer over local FNV fuel */
  liveResidual?: LastResidual | null;
};

function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function cap(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** ONE live C≤S Demo GRANT/REFUSE lane — GR-21 residual commitment on stamps */
export function DemoGate({
  rows,
  decision,
  subject,
  onDemoGrant,
  onDemoRefuse,
  onResort,
  onClaimEdit,
  onSourceEdit,
  fails,
  showAwait = false,
  liveResidual = null,
}: Props) {
  const ok = decision.status === "grant" && decision.mask === 0;
  const local = residualCommitment(
    rows.map((r) => r.claimed),
    rows.map((r) => r.source),
    subject || "ceilinggate-gr21",
  );
  // Align with Evidence getLastResidual (sha256) when live; local FNV = offline fuel only
  const commitHex =
    liveResidual?.residualCommitment ?? local.commit;
  const historicHex =
    liveResidual?.historicAnchor ?? local.commit;
  const commitShort = commitHex.slice(0, 12);
  const variance = liveResidual?.variance ?? local.variance;
  const projector =
    liveResidual != null
      ? liveResidual.cLeS
        ? "CLEAR"
        : "OVER"
      : local.projector;
  const liveLabel = liveResidual ? "fleet-gerbil · getLastResidual" : "local fuel";

  return (
    <section className="sm-panel sm-claim" aria-label="Live claim lane">
      <div className="sm-panel-head">
        <h2>Receipt-line C ≤ S</h2>
        <span className={"sm-chip " + (ok ? "grant" : "refuse")}>
          {ok ? "GRANT" : "REFUSE"}
        </span>
      </div>
      <p className="sm-subj">{subject}</p>
      <p className="sm-rival-hint">
        LINE · CLAIMED · ON RECEIPT · STATUS
      </p>
      <div className="sm-demo-row">
        <button type="button" className="sm-btn grant" onClick={onDemoGrant}>
          Demo GRANT
        </button>
        <button type="button" className="sm-btn refuse" onClick={onDemoRefuse}>
          Demo REFUSE
        </button>
        <button type="button" className="sm-btn ghost" onClick={onResort}>
          Re-sort C ≤ S
        </button>
      </div>
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
      {showAwait ? (
        <div className="sm-verdict await" aria-live="polite">
          <div>
            <strong>AWAITING RESIDUAL SCAN</strong>
            <p className="sm-await-hint">
              GR-21 projector idle — tap Demo GRANT / REFUSE or edit C / S
            </p>
          </div>
        </div>
      ) : (
        <div className={"sm-verdict " + (ok ? "grant" : "refuse")}>
          <div className="sm-verdict-stamp">{ok ? "GRANT" : "REFUSE"}</div>
          <div
            className="sm-gr21-stamp"
            title={`commit=${commitHex}\nhistoric=${historicHex}`}
            data-testid="gr21-residual-stamp"
          >
            <span className="sm-gr21-kicker">
              GR-21 · {liveLabel}
            </span>
            <span
              className={
                "sm-gr21-proj " + (projector === "CLEAR" ? "clear" : "over")
              }
            >
              C≤S projector {projector}
            </span>
            <code className="sm-gr21-hash">{commitShort}</code>
            <span className="sm-gr21-meta">
              commit {commitShort} · σ² {variance.toExponential(2)}
              {projector === "CLEAR" ? " · residual 0" : ""}
            </span>
          </div>
          {fails.length ? (
            <ul>
              {fails.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          ) : (
            <p>
              Every line clears C ≤ S. Mask 0 · residual commitment binds the
              projector.
            </p>
          )}
          <p className="sm-mask">
            mask {decision.mask}
            {decision.failedIndices.length
              ? ` · fail [${decision.failedIndices.join(",")}]`
              : " · all clear"}
          </p>
        </div>
      )}
    </section>
  );
}
