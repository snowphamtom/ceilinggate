/** Real sponsor work on the live path — not costume badges. */
export function SponsorChips() {
  return (
    <div className="sm-sponsor-strip" data-testid="sponsor-receipts">
      <p className="sm-sponsor-kicker">Sponsor receipts · live path</p>
      <ul className="sm-sponsors" aria-label="Sponsor stack on the live path">
        <li>
          <strong>Firecrawl</strong>
          <span>scrape public receipt URL → S numbers</span>
        </li>
        <li>
          <strong>AgentMail</strong>
          <span>claim arrives in inbox → webhook</span>
        </li>
        <li>
          <strong>OpenAI</strong>
          <span>one-line after the numbers (does not decide)</span>
        </li>
      </ul>
    </div>
  );
}
