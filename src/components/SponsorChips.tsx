/** Real sponsor work on the live path — not costume badges. */
export function SponsorChips() {
  return (
    <ul className="sm-sponsors" aria-label="Sponsor stack on the live path">
      <li>
        <strong>Firecrawl</strong>
        <span>scrape receipt URL → line ledger</span>
      </li>
      <li>
        <strong>AgentMail</strong>
        <span>inbox claim + webhook</span>
      </li>
      <li>
        <strong>OpenAI</strong>
        <span>one-line after numbers (does not decide)</span>
      </li>
    </ul>
  );
}
