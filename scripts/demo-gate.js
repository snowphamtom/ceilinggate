/** Offline ResidualGates demo — no network, no Convex login. */
function enclosedR(interior, claimed) {
  if (interior.length !== claimed.length) return false;
  for (let i = 0; i < interior.length; i++) {
    if (!(claimed[i] <= interior[i])) return false;
  }
  return true;
}
function breachesR(interior, claimed, idx) {
  if (idx === undefined) idx = 0;
  if (interior.length === 0 || claimed.length === 0) return [];
  const rest = breachesR(interior.slice(1), claimed.slice(1), idx + 1);
  return interior[0] < claimed[0] ? [idx].concat(rest) : rest;
}
function maskOf(failed) {
  return failed.reduce(function (acc, i) {
    return acc | (1 << i);
  }, 0);
}
function gateB(interior, claimed) {
  if (enclosedR(interior, claimed)) {
    return { status: "grant", mask: 0, failedIndices: [] };
  }
  const failed = breachesR(interior, claimed, 0);
  const m = maskOf(failed);
  return {
    status: "refuse",
    mask: m === 0 ? 1 : m,
    failedIndices: failed,
  };
}
function granted(d) {
  return d.status === "grant" && d.mask === 0;
}
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("ok:", msg);
}

var sampleInterior = [100, 50, 25, 10];
var sampleValid = [98, 49, 25, 9];
var sampleInvalid = [98, 51, 25, 11];

var grant = gateB(sampleInterior, sampleValid);
assert(grant.status === "grant", "sampleValid → grant");
assert(grant.mask === 0, "sampleValid mask 0");
assert(granted(grant) === true, "granted(sampleValid)");

var refuse = gateB(sampleInterior, sampleInvalid);
assert(refuse.status === "refuse", "sampleInvalid → refuse");
assert(refuse.mask === 10, "sampleInvalid mask 10 (bits 1 and 3)");
assert(
  JSON.stringify(refuse.failedIndices) === JSON.stringify([1, 3]),
  "failedIndices [1,3]",
);
assert(maskOf([1, 3]) === 10, "maskOf([1,3]) === 10");

console.log("\nCeilingGate ResidualGates demo PASSED");
console.log(JSON.stringify({ grant: grant, refuse: refuse }, null, 2));
