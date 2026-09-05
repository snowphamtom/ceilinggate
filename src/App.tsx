import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

type Screen = "inbox" | "decision" | "fixtures";

export default function App() {
  const [screen, setScreen] = useState<Screen>("fixtures");
  const [selected, setSelected] = useState<Id<"claims"> | null>(null);
  const rows = useQuery(api.claims.listDecisions, { limit: 40 });
  const fixtureDefs = useQuery(api.fixtures.listFixtureDefs);
  const leanCheck = useQuery(api.fixtures.leanSampleSelfCheck);
  const runFixture = useMutation(api.fixtures.runFixture);
  const runAll = useMutation(api.fixtures.runAllFixtures);

  return (
    <div className="shell">
      <header className="top">
        <div>
          <h1>CeilingGate</h1>
          <p className="muted">
            AgentMail claim → Firecrawl interior → ResidualGates → realtime UI
          </p>
        </div>
        <nav className="tabs">
          {(
            [
              ["inbox", "1 · Inbox"],
              ["decision", "2 · Gate"],
              ["fixtures", "3 · Fixtures"],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              className={screen === id ? "tab on" : "tab"}
              onClick={() => setScreen(id)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {leanCheck && (
        <div className="lean">
          Lean samples: grant={String(leanCheck.sample_valid_grant)} refuse=
          {String(leanCheck.sample_invalid_refuse)} mask10=
          {String(leanCheck.sample_invalid_mask_ten)}
        </div>
      )}

      {screen === "inbox" && (
        <section>
          <h2>Inbox / Claims</h2>
          <div className="list">
            {(rows ?? []).map(({ claim, decision }) => (
              <button
                key={claim._id}
                className="row"
                onClick={() => {
                  setSelected(claim._id);
                  setScreen("decision");
                }}
              >
                <span className="subj">{claim.subject}</span>
                <span className="meta">
                  {claim.status} · claimed [{claim.claimed.join(", ")}]
                </span>
                <StatusPill status={decision?.status} mask={decision?.mask} />
              </button>
            ))}
            {!rows?.length && (
              <p className="muted">No claims yet — run fixtures or send mail.</p>
            )}
          </div>
        </section>
      )}

      {screen === "decision" && (
        <DecisionPanel
          claimId={selected}
          onPick={(id) => setSelected(id)}
          rows={rows}
        />
      )}

      {screen === "fixtures" && (
        <section>
          <h2>Fixture runner (Drive undistorted fuel)</h2>
          <div className="actions">
            <button
              className="primary"
              onClick={() => void runAll()}
            >
              Run all fixtures
            </button>
          </div>
          <div className="grid">
            {(fixtureDefs ?? []).map((f) => (
              <div
                key={f.id}
                className={
                  f.expect.status === "grant" ? "card grant" : "card refuse"
                }
              >
                <h3>{f.label}</h3>
                <p>
                  claimed [{f.claimed.join(", ")}] vs interior [
                  {f.interior.join(", ")}]
                </p>
                <p>
                  expect {f.expect.status.toUpperCase()} · mask {f.expect.mask}
                  {f.expect.failedIndices.length
                    ? ` · failed [${f.expect.failedIndices.join(", ")}]`
                    : ""}
                </p>
                <button
                  onClick={async () => {
                    const r = await runFixture({ fixtureId: f.id });
                    setSelected(r.claimId);
                    setScreen("decision");
                  }}
                >
                  Run {f.id}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function StatusPill({
  status,
  mask,
}: {
  status?: "grant" | "refuse";
  mask?: number;
}) {
  if (!status) return <span className="pill wait">PENDING</span>;
  if (status === "grant")
    return <span className="pill grant">GRANT · {mask ?? 0}</span>;
  return <span className="pill refuse">REFUSE · mask {mask}</span>;
}

function DecisionPanel({
  claimId,
  onPick,
  rows,
}: {
  claimId: Id<"claims"> | null;
  onPick: (id: Id<"claims">) => void;
  rows:
    | {
        claim: { _id: Id<"claims">; subject: string; claimed: number[] };
        decision: {
          status: "grant" | "refuse";
          mask: number;
          failedIndices: number[];
          interior: number[];
          claimed: number[];
        } | null;
      }[]
    | undefined;
}) {
  const claim = useQuery(
    api.claims.get,
    claimId ? { claimId } : "skip",
  );
  const decision = useQuery(
    api.claims.getDecision,
    claimId ? { claimId } : "skip",
  );
  const interior = useQuery(
    api.claims.getInterior,
    claimId ? { claimId } : "skip",
  );

  if (!claimId) {
    return (
      <section>
        <h2>Gate decision</h2>
        <p className="muted">Select a claim from Inbox or run a fixture.</p>
        <div className="list">
          {(rows ?? []).map(({ claim: c, decision: d }) => (
            <button key={c._id} className="row" onClick={() => onPick(c._id)}>
              <span className="subj">{c.subject}</span>
              <StatusPill status={d?.status} mask={d?.mask} />
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2>Gate decision</h2>
      <div
        className={
          decision?.status === "grant"
            ? "card grant big"
            : decision?.status === "refuse"
              ? "card refuse big"
              : "card"
        }
      >
        <h3>{claim?.subject ?? "…"}</h3>
        <div className="badge">
          {decision
            ? `${decision.status.toUpperCase()} · mask ${decision.mask}`
            : claim?.status ?? "loading"}
        </div>
        <div className="cols">
          <div>
            <h4>Claimed</h4>
            <code>[{(decision?.claimed ?? claim?.claimed ?? []).join(", ")}]</code>
          </div>
          <div>
            <h4>Interior</h4>
            <code>
              [
              {(decision?.interior ?? interior?.interior ?? []).join(", ")}]
            </code>
          </div>
        </div>
        {decision?.failedIndices?.length ? (
          <p>
            Failed indices:{" "}
            {decision.failedIndices.map((i) => (
              <span key={i} className="chip">
                {i}
              </span>
            ))}
          </p>
        ) : null}
        {interior?.url ? (
          <p className="muted">Scraped: {interior.url}</p>
        ) : null}
      </div>
    </section>
  );
}
