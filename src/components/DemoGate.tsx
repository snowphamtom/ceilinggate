import type { GateDecision } from "../lib/residualGates";

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
};

function money(n: number) {
  if (!Number.isFinite(n)) return "—";
  return `$${n.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}
function cap(s: string) {
  return s.length ? s[0].toUpperCase() + s.slice(1) : s;
}

/** ONE live C≤S Demo GRANT/REFUSE lane — not costumes */
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
}: Props) {
  const ok = decision.status === "grant" && decision.mask === 0;
  return (
    <section className="sm-panel sm-claim" aria-label="Live claim lane">
      <div className="sm-panel-head">
        <h2>Live claim lane</h2>
        <span className={"sm-chip " + (ok ? "grant" : "refuse")}>
          {ok ? "GRANT" : "REFUSE"}
        </span>
      </div>
      <p className="sm-subj">{subject}</p>
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
            <th>SOURCE (S)</th>
            <th>Δ</th>
            <th></th>
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
      <div className={"sm-verdict " + (ok ? "grant" : "refuse")}>
        <div className="sm-verdict-stamp">{ok ? "GRANT" : "REFUSE"}</div>
        {fails.length ? (
          <ul>
            {fails.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        ) : (
          <p>Every line clears C ≤ S. Mask 0.</p>
        )}
        <p className="sm-mask">
          mask {decision.mask}
          {decision.failedIndices.length
            ? ` · fail [${decision.failedIndices.join(",")}]`
            : " · all clear"}
        </p>
      </div>
    </section>
  );
}
