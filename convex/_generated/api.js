/* eslint-disable */
/**
 * Stub API surface. Replaced by `npx convex codegen` after login/deploy.
 */
export const api = {
  gates: {
    runGate: "gates:runGate",
    listDecisions: "gates:listDecisions",
    getDecision: "gates:getDecision",
    evaluate: "gates:evaluate",
  },
  claims: {
    createClaim: "claims:createClaim",
    listClaims: "claims:listClaims",
    getClaim: "claims:getClaim",
    markStatus: "claims:markStatus",
  },
  firecrawl: {
    scrapeUrl: "firecrawl:scrapeUrl",
  },
};

export const internal = {
  firecrawl: {
    storeScrape: "firecrawl:storeScrape",
  },
};
