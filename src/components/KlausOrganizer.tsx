import type { OrganizerLane } from "../lib/evidenceLive";

const KLAUS_ORDER = ["mara", "cole", "rina", "vince", "execute"] as const;

type Props = { lane: OrganizerLane };

/** Klaus gather→sort feed: Mara / Cole / Rina / Vince / Execute — not organize-in-place */
export function KlausOrganizer({ lane }: Props) {
  const byId = new Map(lane.stages.map((s) => [s.id, s]));
  const stages = KLAUS_ORDER.map((id) => {
    const s = byId.get(id);
    return {
      id,
      label: (s?.label ?? id).toUpperCase(),
      status: s?.status ?? "PENDING",
      metric: s?.metric ?? "—",
    };
  });

  return (
    <section className="sm-panel" aria-label="Klaus gather to sort feed">
      <div className="sm-panel-head">
        <h2>Gather → sort feed</h2>
        <span className="sm-chip">Klaus feed · Evidence</span>
      </div>
      <ol className="sm-klaus">
        {stages.map((s) => (
          <li
            key={s.id}
            className={"sm-klaus-stage status-" + s.status.toLowerCase()}
          >
            <span className="sm-klaus-name">{s.label}</span>
            <span className="sm-klaus-metric">{s.metric}</span>
            <span className="sm-klaus-status">{s.status}</span>
          </li>
        ))}
      </ol>
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
      {lane.vince.pending.length > 0 ? (
        <ul className="sm-bucket-samples" aria-label="Pending holds">
          {lane.vince.pending.map((h) => (
            <li key={h.id}>
              <strong>
                {h.kind} · {h.id}
              </strong>
              <span>{h.why}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
