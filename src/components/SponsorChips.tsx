type Lit = {
  firecrawl?: boolean;
  agentmail?: boolean;
  openai?: boolean;
};

/** Sponsor chips — light when that path runs. */
export function SponsorChips({ lit = {} }: { lit?: Lit }) {
  return (
    <div className="sm-sponsor-strip" data-testid="sponsor-receipts">
      <p className="sm-sponsor-kicker">Sponsors</p>
      <ul className="sm-sponsors" aria-label="Sponsors on the live path">
        <li className={lit.firecrawl ? "is-lit" : undefined} data-lit={lit.firecrawl ? "1" : "0"}>
          <strong>Firecrawl</strong>
          <span>Reads the public receipt page</span>
        </li>
        <li className={lit.agentmail ? "is-lit" : undefined} data-lit={lit.agentmail ? "1" : "0"}>
          <strong>AgentMail</strong>
          <span>Inbox for emailed claims</span>
        </li>
        <li className={lit.openai ? "is-lit" : undefined} data-lit={lit.openai ? "1" : "0"}>
          <strong>OpenAI</strong>
          <span>Writes a summary — does not decide</span>
        </li>
      </ul>
    </div>
  );
}
