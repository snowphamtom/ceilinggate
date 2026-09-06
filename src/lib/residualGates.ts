/**
 * ResidualGates runtime port (TypeScript / Vite UI).
 * GRANT iff claimed ≤ interior componentwise; else REFUSE + bitmask.
 * Matches Lean ResidualGatesMathlib samples.
 */
export type GateStatus = "grant" | "refuse";

export type GateDecision = {
  status: GateStatus;
  mask: number;
  failedIndices: number[];
};

/** granted = grant && mask === 0 */
export function granted(d: GateDecision): boolean {
  return d.status === "grant" && d.mask === 0;
}

/** Componentwise claimed ≤ interior on equal-length lists; else false. */
export function enclosedR(interior: number[], claimed: number[]): boolean {
  if (interior.length !== claimed.length) return false;
  for (let i = 0; i < interior.length; i++) {
    if (!(claimed[i]! <= interior[i]!)) return false;
  }
  return true;
}

/**
 * Indices (from `idx`) where interior < claimed.
 * Matches Lean: walks while both lists have heads; unequal tails yield no extra indices.
 */
export function breachesR(
  interior: number[],
  claimed: number[],
  idx = 0,
): number[] {
  if (interior.length === 0 || claimed.length === 0) return [];
  const rest = breachesR(interior.slice(1), claimed.slice(1), idx + 1);
  return interior[0]! < claimed[0]! ? [idx, ...rest] : rest;
}

/** Bitmask: bit idx set iff idx is in failed. */
export function maskOf(failed: number[]): number {
  return failed.reduce((acc, i) => acc | (1 << i), 0);
}

export const EXPENSE_LINES = ["fuel", "lodging", "meals", "misc"] as const;

/** Bit idx set iff that expense line is over the receipt. Not an 8-bit ATEC jacket. */
export function decodeMask(
  mask: number,
  lineItems: readonly string[] = EXPENSE_LINES,
): string[] {
  return lineItems.filter((_, i) => (mask & (1 << i)) !== 0);
}

/** Computational-basis ket of the four expense bits. GRANT is |0000⟩. Lines do not entangle. */
export function ketOf(mask: number, bits = 4): string {
  let s = "";
  for (let i = 0; i < bits; i++) s += (mask & (1 << i)) !== 0 ? "1" : "0";
  return `|${s}⟩`;
}

/** gateB → { status: 'grant'|'refuse', mask, failedIndices } */
export function gateB(interior: number[], claimed: number[]): GateDecision {
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

/** Lean samples — must match ResidualGatesMathlib */
export const sampleInterior = [100, 50, 25, 10];
export const sampleValid = [98, 49, 25, 9];
export const sampleInvalid = [98, 51, 25, 11];

/** Refuse taxonomy — residual honesty (Eve unique fuel #3). */
export type FaultClass = "clear" | "residual_over" | "length_mismatch";

export function faultClass(
  interior: number[],
  claimed: number[],
  d: GateDecision,
): FaultClass {
  if (d.status === "grant" && d.mask === 0) return "clear";
  if (interior.length !== claimed.length) return "length_mismatch";
  if (d.failedIndices.length > 0) return "residual_over";
  return "length_mismatch";
}

export function faultClassLabel(fc: FaultClass): string {
  switch (fc) {
    case "clear":
      return "Clear — GRANT ⇔ mask==0";
    case "residual_over":
      return "Residual over — claimed > on-receipt on named lines";
    case "length_mismatch":
      return "Length mismatch — claim vector ≠ receipt lines (corrupt shape)";
  }
}


/** Sum of finite numbers (chat-style total). */
export function vectorSum(xs: number[]): number {
  return xs.reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);
}

/**
 * Classic Block/GIW shrug: totals look fine (sum claimed ≤ sum on-receipt)
 * but at least one line is over — ResidualGates must REFUSE.
 */
export function chatWouldShrug(interior: number[], claimed: number[], d: GateDecision): boolean {
  if (d.status !== "refuse") return false;
  if (interior.length !== claimed.length) return false;
  return vectorSum(claimed) <= vectorSum(interior);
}

/** Fixture: sum claimed 180 ≤ sum receipt 185, but line 1 OVER (60 > 50). */
export const shrugTrapInterior = [100, 50, 25, 10];
export const shrugTrapClaimed = [90, 60, 20, 10];

/** Plain-text refuse receipt — math Block/GIW chat cannot rewrite. */
export function refuseReceiptText(
  interior: number[],
  claimed: number[],
  d: GateDecision,
  lineNames?: string[],
): string {
  const lines: string[] = [];
  lines.push(`STATUS ${d.status.toUpperCase()} · mask ${d.mask}`);
  lines.push(
    `SUM claimed ${vectorSum(claimed)} · SUM on-receipt ${vectorSum(interior)}` +
      (chatWouldShrug(interior, claimed, d)
        ? " · chat would shrug (totals OK)"
        : ""),
  );
  const n = Math.max(interior.length, claimed.length);
  for (let i = 0; i < n; i++) {
    const name = lineNames?.[i] ?? `line ${i}`;
    const c = claimed[i];
    const inn = interior[i];
    const cOk = Number.isFinite(c);
    const iOk = Number.isFinite(inn);
    if (!cOk || !iOk) {
      lines.push(`LINE ${name} · CLAIMED ${cOk ? c : "—"} · ON RECEIPT ${iOk ? inn : "—"} · STATUS SHAPE`);
      continue;
    }
    const over = (c as number) > (inn as number);
    const residual = (c as number) - (inn as number);
    lines.push(
      `LINE ${name} · CLAIMED ${c} · ON RECEIPT ${inn} · residual ${residual}${
        over ? " > 0 → OVER" : " ≤ 0 → CLEAR"
      }`,
    );
  }
  if (d.status === "refuse") {
    lines.push(
      "ADMIT only if claimed ≤ on-receipt on every line — surplus on one line cannot cover a deficit on another.",
    );
  } else {
    lines.push("ADMIT: every line claimed ≤ on-receipt (componentwise).");
  }
  return lines.join("\n");
}
