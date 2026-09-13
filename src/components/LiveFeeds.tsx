import { AGENTMAIL_INBOX_EMAIL } from "../config/agentmail";

/** AgentMail intake — claim email CTA */
export function LiveFeeds() {
  return (
    <section className="sm-panel sm-intake sm-glass" aria-label="AgentMail intake">
      <div className="sm-panel-head">
        <h2>Email a claim</h2>
        <span className="sm-chip">AgentMail</span>
      </div>
      <p className="sm-muted">
        Send a money claim plus a public receipt link. We read the receipt, compare
        each line, and stamp GRANT or REFUSE.
      </p>
      <p className="sm-inbox">
        <a href={`mailto:${AGENTMAIL_INBOX_EMAIL}?subject=claim`}>
          <code>{AGENTMAIL_INBOX_EMAIL}</code>
        </a>
      </p>
    </section>
  );
}
