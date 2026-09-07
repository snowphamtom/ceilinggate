const PIPE_STAGES = [
  { id: "gather", label: "Gather", hint: "mail · web · drive" },
  { id: "triage", label: "Triage", hint: "real objects only" },
  { id: "evidence", label: "Evidence", hint: "Firecrawl ledger" },
  { id: "sort", label: "Sort", hint: "receipt-line C ≤ S" },
  { id: "bucket", label: "Bucket", hint: "GRANT / REFUSE" },
] as const;

type Props = {
  activePipe: number;
  hasDecision: boolean;
};

/** Continuous GATHER→SORT machine — not organize-in-place */
export function SortingMachineStages({ activePipe, hasDecision }: Props) {
  return (
    <section className="sm-pipeline" aria-label="Gather to sort stages">
      <div className="sm-pipe-track">
        {PIPE_STAGES.map((s, i) => {
          const lit = i === activePipe || hasDecision;
          const done = hasDecision && i <= 4;
          return (
            <div
              key={s.id}
              className={
                "sm-pipe-stage" +
                (i === activePipe ? " is-active" : "") +
                (done ? " is-done" : "") +
                (lit ? " is-lit" : "")
              }
            >
              <div className="sm-pipe-node">
                <span className="sm-pipe-idx">{i + 1}</span>
              </div>
              <div className="sm-pipe-label">{s.label}</div>
              <div className="sm-pipe-hint">{s.hint}</div>
              {i < PIPE_STAGES.length - 1 ? (
                <div className="sm-pipe-flow" aria-hidden />
              ) : null}
            </div>
          );
        })}
      </div>
      <p className="sm-law">
        Machine law: <span className="sm-law-chip">GATHER → SORT</span> ·{" "}
        <span className="sm-law-chip">receipt-line C ≤ S</span> — beats page-promise,
        not organize-in-place
      </p>
    </section>
  );
}

export { PIPE_STAGES };
