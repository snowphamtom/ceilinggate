/** One sentence for the board. Keep in sync with convex/lib/oneLine.ts */

const DEFAULT_LINES = ["fuel", "lodging", "meals", "misc"];

export function composeOneLine(args: {
  status: "grant" | "refuse";
  claimed: number[];
  interior: number[];
  failedIndices: number[];
  lineItems?: string[];
}): string {
  const names = args.lineItems?.length ? args.lineItems : DEFAULT_LINES;
  if (args.status === "grant" || args.failedIndices.length === 0) {
    return "GRANT \u2014 every claimed line is at or under the receipt.";
  }
  const i = args.failedIndices[0]!;
  const name = names[i] ?? `line ${i + 1}`;
  const c = args.claimed[i] ?? 0;
  const n = args.interior[i] ?? 0;
  const over = Math.round((c - n) * 100) / 100;
  return `REFUSE \u2014 ${name} is $${over.toFixed(2)} over the receipt.`;
}
