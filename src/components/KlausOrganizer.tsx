import type { OrganizerLane } from "../lib/evidenceLive";

type Props = { lane: OrganizerLane };

/** Klaus strip — counts + up to 2 holds. */
export function KlausOrganizer({ lane }: Props) {
  const holds = lane.vince.pending.slice(0, 2);
  return (
    <section className="sm-panel sm-klaus-lean sm-glass" aria-label="Klaus strip">
      <div className="sm-panel-head">
        <h2>Klaus organizer</h2>
        <span className="sm-chip">Live holds</span>
      </div>
      <div className="sm-klaus-counts">
        <div>
          <strong>{lane.mara.rootFolders}</strong>
          <span>folders</span>
        </div>
        <div>
          <strong>{lane.mara.looseFiles}</strong>
          <span>loose</span>
        </div>
        <div>
          <strong>{lane.cole.proposeRows}</strong>
          <span>propose</span>
        </div>
        <div>
          <strong>{lane.vince.pending.length}</strong>
          <span>holds</span>
        </div>
        <div>
          <strong>{lane.execute.totalMoves}</strong>
          <span>moves</span>
        </div>
      </div>
      {holds.length > 0 ? (
        <ul className="sm-bucket-samples" aria-label="Holds">
          {holds.map((h) => (
            <li key={h.id}>
              <strong>
                {h.kind} · {h.id}
              </strong>
              <span>{h.why}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="sm-muted">No open holds.</p>
      )}
    </section>
  );
}
