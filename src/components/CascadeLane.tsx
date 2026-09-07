import { useState } from "react";
import roster from "../data/cascadeRoster.json";

type Tier1 = (typeof roster.tier1)[number];
type Tier2 = (typeof roster.tier2)[number];

/** CASCADE gather→sort roster + Tier-2 DRIFT (web/Firecrawl under NIX) */
export function CascadeLane() {
  const [focus, setFocus] = useState<string>("nix");
  const drift = roster.tier2.find((t) => t.id === "drift") as Tier2;
  const active = (roster.tier1 as Tier1[]).find((t) => t.id === focus);

  return (
    <section className="sm-panel sm-cascade" aria-label="Cascade gather to sort">
      <div className="sm-panel-head">
        <h2>CASCADE gather → sort</h2>
        <span className="sm-chip">MANAGER · {roster.stampLabel}</span>
      </div>
      <p className="sm-muted">{roster.law}</p>
      <div className="sm-buckets sm-cascade-roster" role="list">
        {(roster.tier1 as Tier1[]).map((t) => (
          <button
            key={t.id}
            type="button"
            role="listitem"
            className={
              "sm-bucket" +
              (focus === t.id ? " on" : "") +
              (t.id === "nix" ? " b-KEEP" : " b-WATCH")
            }
            onClick={() => setFocus(t.id)}
          >
            <span className="sm-bucket-name">{t.handle}</span>
            <span className="sm-bucket-n">{t.bot}</span>
          </button>
        ))}
      </div>
      {active ? (
        <p className="sm-subj">
          <strong>{active.handle}</strong> · {active.mission}
        </p>
      ) : null}

      <div className="sm-drift" data-testid="tier2-drift">
        <div className="sm-panel-head">
          <h3>Tier-2 · DRIFT</h3>
          <span className="sm-chip refuse">under {drift.parent} · {drift.domain}</span>
        </div>
        <p className="sm-muted">{drift.mission}</p>
        <div className="sm-demo-row">
          {drift.stack.map((s) => (
            <span key={s} className="sm-chip">
              {s}
            </span>
          ))}
        </div>
        <div className="sm-klaus-counts">
          <div>
            <strong>{roster.nixPulse.agentMailNew}</strong>
            <span>NEW mail</span>
          </div>
          <div>
            <strong>{roster.nixPulse.canonicalVibes}</strong>
            <span>{roster.nixPulse.canonicalCard} vibes</span>
          </div>
          <div>
            <strong>{roster.nixPulse.legacySlugVibes}</strong>
            <span>legacy vibes</span>
          </div>
        </div>
        <p className="sm-mask">{roster.nixPulse.note}</p>
        <p className="sm-law" style={{ marginTop: "0.65rem" }}>
          Sort buckets{" "}
          {roster.buckets.map((b) => (
            <span key={b} className="sm-law-chip" style={{ marginRight: 4 }}>
              {b}
            </span>
          ))}
          + ResidualGates <span className="sm-law-chip">GRANT/REFUSE</span>
        </p>
      </div>
    </section>
  );
}
