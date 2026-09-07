/** Evidence backend — fleet-gerbil-682 ONLY. Never quirky, never avid-gnu-388. */
const DEFAULT_EVIDENCE = "https://fleet-gerbil-682.convex.cloud";

function envOr(key: string, fallback: string): string {
  const v = (import.meta.env as Record<string, string | undefined>)[key];
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function isBad(url: string): boolean {
  return (
    !url ||
    url.includes("evidence.invalid") ||
    url.includes("YOUR_DEPLOYMENT") ||
    url.includes("avid-gnu") ||
    url.includes("quirky-rhinoceros")
  );
}

const resolved = envOr("VITE_EVIDENCE_CONVEX_URL", DEFAULT_EVIDENCE);

export const EVIDENCE = {
  url: isBad(resolved) ? DEFAULT_EVIDENCE : resolved,
  configured: true,
  label: "fleet-gerbil-682",
} as const;

export const EVIDENCE_CONVEX_URL = EVIDENCE.url;
