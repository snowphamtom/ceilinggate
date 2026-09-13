type Lit = {
  firecrawl?: boolean;
  agentmail?: boolean;
  openai?: boolean;
};

/** Real sponsor work on the live path — chips light when that path runs. */
export function SponsorChips({ lit = {} }: { lit?: Lit }) {
  return (
    <div className="sm-sponsor-strip" data-testid="sponsor-receipts">
      <p className="sm-sponsor-kicker">Sponsor trinity · lights on real path</p>
      <ul className="sm-sponsors" aria-label="Sponsor stack on the live path">
        <li className={lit.firecrawl ? "is-lit" : undefined} data-lit={lit.firecrawl ? "1" : "0"}>
          <strong>Firecrawl</strong>
          <span>scrape public receipt URL → S numbers</span>
        </li>
        <li className={lit.agentmail ? "is-lit" : undefined} data-lit={lit.agentmail ? "1" : "0"}>
          <strong>AgentMail</strong>
          <span>claim arrives in inbox → webhook</span>
        </li>
        <li className={lit.openai ? "is-lit" : undefined} data-lit={lit.openai ? "1" : "0"}>
          <strong>OpenAI</strong>
          <span>one-line after the numbers (does not decide)</span>
        </li>
      </ul>
    </div>
  );
}
