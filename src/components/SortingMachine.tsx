const PIPE_STAGES = [
  { id: "intake", label: "Intake", hint: "AgentMail / claim" },
  { id: "filter", label: "Filter", hint: "real object only" },
  { id: "evidence", label: "Evidence", hint: "Firecrawl ledger" },
  { id: "verdict", label: "Verdict", hint: "C ≤ S gates" },
  { id: "store", label: "Store", hint: "GRANT / REFUSE" },
] as const;

type Props = {
  activePipe: number;
  hasDecision: boolean;
};

/** Continuous organizing stages: intake → filter → evidence → verdict → store */
export function SortingMachineStages({ activePipe, hasDecision }: Props) {
  return (
    <section className="sm-pipeline" aria-label="Sorting machine stages">
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
        Law <span className="sm-law-chip">C ≤ S</span> componentwise · leftover on
        one line cannot cover a hole on another
      </p>
    </section>
  );
}

export { PIPE_STAGES };
