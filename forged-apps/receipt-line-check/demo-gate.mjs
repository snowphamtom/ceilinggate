/** LIVE gateB — claimed ≤ interior componentwise */
export function gateB(interior, claimed) {
  if (interior.length !== claimed.length) {
    return { status: "refuse", mask: 1, failedIndices: [] };
  }
  const failed = [];
  for (let i = 0; i < interior.length; i++) {
    if (claimed[i] > interior[i]) failed.push(i);
  }
  const mask = failed.reduce((m, i) => m | (1 << i), 0);
  return failed.length
    ? { status: "refuse", mask: mask || 1, failedIndices: failed }
    : { status: "grant", mask: 0, failedIndices: [] };
}

const g = gateB([100, 50], [98, 49]);
const r = gateB([100, 50], [98, 51]);
console.log(JSON.stringify({ grant: g, refuse: r, app: "receipt-line-check", live: true }, null, 2));
if (g.status !== "grant" || r.status !== "refuse") process.exit(1);
