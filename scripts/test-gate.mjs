/** Offline ResidualGates self-check (Lean samples). */
function enclosedR(interior, claimed) {
  if (interior.length !== claimed.length) return false;
  for (let i = 0; i < interior.length; i++) if (!(claimed[i] <= interior[i])) return false;
  return true;
}
function breachesR(interior, claimed) {
  const failed = [];
  for (let i = 0; i < interior.length; i++) if (interior[i] < claimed[i]) failed.push(i);
  return failed;
}
function maskOf(failed) {
  return failed.reduce((acc, i) => acc | (1 << i), 0);
}
function gateB(interior, claimed) {
  if (enclosedR(interior, claimed)) return { status: "grant", mask: 0, failedIndices: [] };
  const failed = breachesR(interior, claimed);
  const m = maskOf(failed);
  return { status: "refuse", mask: m === 0 ? 1 : m, failedIndices: failed };
}
function granted(d) { return d.status === "grant" && d.mask === 0; }

const interior = [100, 50, 25, 10];
const valid = gateB(interior, [98, 49, 25, 9]);
const invalid = gateB(interior, [98, 51, 25, 11]);
const checks = {
  sample_valid_grant: granted(valid) === true,
  sample_invalid_refuse: invalid.status === "refuse",
  sample_invalid_mask_ten: invalid.mask === 10,
  failed_1_3: JSON.stringify(invalid.failedIndices) === JSON.stringify([1, 3]),
};
const ok = Object.values(checks).every(Boolean);
console.log(JSON.stringify({ ok, checks, valid, invalid }, null, 2));
process.exit(ok ? 0 : 1);
