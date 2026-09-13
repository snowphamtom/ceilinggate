import { AGENTMAIL_INBOX_EMAIL } from "../config/agentmail";

/** AgentMail intake — claim email CTA */
export function LiveFeeds() {
  return (
    <section className="sm-panel sm-intake" aria-label="AgentMail intake">
      <div className="sm-panel-head">
        <h2>Email a Claim</h2>
        <span className="sm-chip">AgentMail</span>
      </div>
      <p className="sm-muted">
        Send a money claim with a public receipt URL. Firecrawl reads the page;
        each line is gated Claimed ≤ On receipt (C ≤ S) → GRANT or REFUSE.
      </p>
      <p className="sm-inbox">
        <a href={`mailto:${AGENTMAIL_INBOX_EMAIL}?subject=claim`}>
          <code>{AGENTMAIL_INBOX_EMAIL}</code>
        </a>
      </p>
    </section>
  );
}
