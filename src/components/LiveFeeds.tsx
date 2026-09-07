import { AGENTMAIL_INBOX_EMAIL } from "../config/agentmail";
import type { LineRow } from "./DemoGate";

type LiveRow = {
  claim: {
    _id: string;
    subject?: string;
    claimed?: number[];
    interior?: number[];
  };
  decision?: { status?: string } | null;
};

type Props = {
  hasConvex: boolean;
  liveRows: LiveRow[] | undefined;
  lineNames: string[];
  onLoadClaim: (rows: LineRow[], subject: string) => void;
};

/** AgentMail claims + Firecrawl receipts on the machine */
export function LiveFeeds({
  hasConvex,
  liveRows,
  lineNames,
  onLoadClaim,
}: Props) {
  return (
    <section className="sm-panel sm-intake" aria-label="AgentMail intake">
      <div className="sm-panel-head">
        <h2>AgentMail intake</h2>
        <span className="sm-chip">Firecrawl</span>
      </div>
      <p className="sm-inbox">
        <code>{AGENTMAIL_INBOX_EMAIL}</code>
      </p>
      <p className="sm-muted">
        Email a claim + public receipt URL. Firecrawl fetches the page.
        ResidualGates sorts line-by-line. OpenAI narrates after numbers — it does
        not decide.
      </p>
      {hasConvex && liveRows && liveRows.length > 0 ? (
        <div className="sm-inbox-list">
          {liveRows.slice(0, 5).map((row) => {
            const c = row.claim;
            const st = row.decision?.status ?? "wait";
            return (
              <button
                key={c._id}
                type="button"
                className={"sm-inbox-row st-" + st}
                onClick={() => {
                  const interior = c.interior ?? [];
                  const claimed = c.claimed ?? [];
                  const next = lineNames.map((name, i) => ({
                    name,
                    claimed: claimed[i] ?? 0,
                    source: interior[i] ?? 0,
                  }));
                  onLoadClaim(next, c.subject ?? "(no subject)");
                }}
              >
                <span>{c.subject ?? "(no subject)"}</span>
                <span className="sm-chip">{String(st).toUpperCase()}</span>
              </button>
            );
          })}
        </div>
      ) : (
        <p className="sm-muted">
          Live board empty — use Demo GRANT / REFUSE, or mail the inbox.
        </p>
      )}
    </section>
  );
}
