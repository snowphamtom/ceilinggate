/* eslint-disable */
/** Stub — replaced by `npx convex codegen` after login. */
export const api = {
  claims: {
    createClaim: "claims:createClaim",
    listClaims: "claims:listClaims",
    listDecisions: "claims:listDecisions",
    getClaim: "claims:getClaim",
    get: "claims:get",
    getDecision: "claims:getDecision",
    getInterior: "claims:getInterior",
    listRecent: "claims:listRecent",
    createManual: "claims:createManual",
  },
  fixtures: {
    listFixtureDefs: "fixtures:listFixtureDefs",
    runFixture: "fixtures:runFixture",
    runAllFixtures: "fixtures:runAllFixtures",
    leanSampleSelfCheck: "fixtures:leanSampleSelfCheck",
  },
  inboxes: {
    list: "inboxes:list",
    upsert: "inboxes:upsert",
  },
  pipeline: {
    scrapeClaimUrl: "pipeline:scrapeClaimUrl",
    ingestManualClaim: "pipeline:ingestManualClaim",
  },
};
export const internal = {
  pipeline: {
    onMessageReceived: "pipeline:onMessageReceived",
    scrapeAndGate: "pipeline:scrapeAndGate",
    gateWithInterior: "pipeline:gateWithInterior",
    markError: "pipeline:markError",
  },
};
export const components = { firecrawl: {}, agentmail: {} };
