import type { LineRow } from "./DemoGate";

type Props = {
  rows: LineRow[];
  failedIndices: number[];
};

/** Claimed vs On receipt bar chart. */
export function ResidualCaliper({ rows, failedIndices }: Props) {
  const max = Math.max(
    1,
    ...rows.flatMap((r) => [r.claimed, r.source]),
  );
  return (
    <div className="sm-caliper sm-caliper-jewel" data-testid="residual-caliper" aria-label="Claimed vs On receipt">
      <div className="sm-caliper-head">
        <span>Claimed vs On receipt</span>
        <span className="sm-caliper-legend">
          <i className="c" /> Claimed (C) · <i className="s" /> On receipt (S)
        </span>
      </div>
      <ul>
        {rows.map((r, i) => {
          const fail = failedIndices.includes(i);
          const cPct = Math.min(100, (r.claimed / max) * 100);
          const sPct = Math.min(100, (r.source / max) * 100);
          return (
            <li key={r.name + i} className={fail ? "is-over" : "is-clear"}>
              <span className="sm-caliper-name">{r.name}</span>
              <div className="sm-caliper-track">
                <span className="sm-caliper-bar s" style={{ width: `${sPct}%` }} />
                <span className="sm-caliper-bar c" style={{ width: `${cPct}%` }} />
                <span
                  className="sm-caliper-mark"
                  style={{ left: `${sPct}%` }}
                  title="On receipt amount"
                />
              </div>
              <span className={"sm-caliper-delta " + (fail ? "over" : "clear")}>
                {fail ? `+$${(r.claimed - r.source).toFixed(0)}` : "C≤S"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
