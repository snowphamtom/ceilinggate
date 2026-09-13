const PIPE_STAGES = [
  { id: "gather", label: "Gather", hint: "Mail · web · files" },
  { id: "triage", label: "Triage", hint: "Claims only" },
  { id: "evidence", label: "Evidence", hint: "GR-21 commit" },
  { id: "sort", label: "Sort", hint: "C ≤ S projector" },
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
        <span className="sm-law-chip">Gather → Sort</span> ·{" "}
        <span className="sm-law-chip">C ≤ S</span> per receipt line → GRANT / REFUSE
      </p>
    </section>
  );
}

export { PIPE_STAGES };
