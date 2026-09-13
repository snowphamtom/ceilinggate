/** Adaptive bitrate attach for the judge demo.
 * Segment HLS (/hls/*.m3u8 with stream.m3u8 children) when present.
 * /hls/master.m3u8 may list release mp4 rungs — that is progressive, not hls.js.
 */

export const HLS_MASTER = "/hls/master.m3u8";
export const RUNG_LOW =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo-60s.mp4";
export const RUNG_HIGH =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo.mp4";

const HLS_JS =
  "https://cdn.jsdelivr.net/npm/hls.js@1.5.20/dist/hls.min.js";

type Net = { downlink?: number; effectiveType?: string; saveData?: boolean };

function net(): Net {
  const c = (navigator as Navigator & { connection?: Net }).connection;
  return c ?? {};
}

export function pickProgressive(): { url: string; label: string } {
  const n = net();
  if (n.saveData) return { url: RUNG_LOW, label: "save-data \u00b7 60s" };
  if (typeof n.downlink === "number" && n.downlink > 0 && n.downlink < 0.25) {
    return { url: RUNG_LOW, label: `low \u00b7 ${n.downlink}Mb/s` };
  }
  if (n.effectiveType === "slow-2g" || n.effectiveType === "2g") {
    return { url: RUNG_LOW, label: n.effectiveType };
  }
  return { url: RUNG_HIGH, label: n.downlink ? `high \u00b7 ${n.downlink}Mb/s` : "high" };
}

async function masterKind(): Promise<"segments" | "mp4-rungs" | "none"> {
  try {
    const r = await fetch(HLS_MASTER, { method: "GET", cache: "no-store" });
    if (!r.ok) return "none";
    const t = await r.text();
    if (!t.includes("#EXTM3U")) return "none";
    if (t.includes("stream.m3u8") || t.includes(".m4s")) return "segments";
    if (t.includes(".mp4")) return "mp4-rungs";
    return "none";
  } catch {
    return "none";
  }
}

function loadHlsScript(): Promise<void> {
  const w = window as Window & { Hls?: new (c?: object) => HlsLike };
  if (w.Hls) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = HLS_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("hls.js load failed"));
    document.head.appendChild(s);
  });
}

type HlsLike = {
  loadSource: (u: string) => void;
  attachMedia: (el: HTMLVideoElement) => void;
  on: (ev: string, cb: (...a: unknown[]) => void) => void;
  destroy: () => void;
  currentLevel: number;
  levels: { height?: number; bitrate?: number }[];
};

export type AbrHandle = {
  mode: "hls" | "progressive";
  label: string;
  destroy: () => void;
};

export async function attachAbr(
  el: HTMLVideoElement,
  onLabel?: (s: string) => void,
): Promise<AbrHandle> {
  const kind = await masterKind();
  const nativeHls = el.canPlayType("application/vnd.apple.mpegurl");

  if (kind === "segments" && nativeHls) {
    el.src = HLS_MASTER;
    onLabel?.("HLS native \u00b7 ABR");
    return {
      mode: "hls",
      label: "HLS native",
      destroy: () => {
        el.removeAttribute("src");
        el.load();
      },
    };
  }

  if (kind === "segments") {
    try {
      await loadHlsScript();
      const Hls = (window as Window & { Hls?: { isSupported: () => boolean } & (new (c?: object) => HlsLike) }).Hls;
      if (Hls?.isSupported()) {
        const hls = new Hls({
          capLevelToPlayerSize: true,
          startLevel: -1,
          maxBufferLength: 12,
          maxMaxBufferLength: 24,
        });
        hls.loadSource(HLS_MASTER);
        hls.attachMedia(el);
        const tag = () => {
          const lv = hls.levels[hls.currentLevel];
          onLabel?.(
            lv
              ? `HLS ABR \u00b7 ${lv.height ?? "?"}p \u00b7 ${Math.round((lv.bitrate ?? 0) / 1000)}kb/s`
              : "HLS ABR",
          );
        };
        hls.on("hlsLevelSwitched", tag);
        hls.on("hlsManifestParsed", tag);
        onLabel?.("HLS ABR");
        return { mode: "hls", label: "HLS ABR", destroy: () => hls.destroy() };
      }
    } catch {
      /* fall through */
    }
  }

  const pick = pickProgressive();
  el.src = pick.url;
  onLabel?.(pick.label + (kind === "mp4-rungs" ? " \u00b7 master rungs" : " \u00b7 progressive"));
  return {
    mode: "progressive",
    label: pick.label,
    destroy: () => {
      el.removeAttribute("src");
      el.load();
    },
  };
}
