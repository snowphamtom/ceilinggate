/** Adaptive bitrate attach for the judge demo.
 * Prefers same-origin HLS (/hls/master.m3u8). Else progressive rungs.
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
  if (n.saveData) return { url: RUNG_LOW, label: "save-data · 60s" };
  if (typeof n.downlink === "number" && n.downlink > 0 && n.downlink < 0.25) {
    return { url: RUNG_LOW, label: `low · ${n.downlink}Mb/s` };
  }
  if (n.effectiveType === "slow-2g" || n.effectiveType === "2g") {
    return { url: RUNG_LOW, label: n.effectiveType };
  }
  return { url: RUNG_HIGH, label: n.downlink ? `high · ${n.downlink}Mb/s` : "high" };
}

async function hlsExists(): Promise<boolean> {
  try {
    const r = await fetch(HLS_MASTER, { method: "GET", cache: "no-store" });
    if (!r.ok) return false;
    const t = await r.text();
    return t.includes("#EXTM3U");
  } catch {
    return false;
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
  const useHls = await hlsExists();
  const nativeHls = el.canPlayType("application/vnd.apple.mpegurl");

  if (useHls && nativeHls) {
    el.src = HLS_MASTER;
    onLabel?.("HLS native · ABR");
    return {
      mode: "hls",
      label: "HLS native",
      destroy: () => {
        el.removeAttribute("src");
        el.load();
      },
    };
  }

  if (useHls) {
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
              ? `HLS ABR · ${lv.height ?? "?"}p · ${Math.round((lv.bitrate ?? 0) / 1000)}kb/s`
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
  onLabel?.(pick.label + " · progressive");
  return {
    mode: "progressive",
    label: pick.label,
    destroy: () => {
      el.removeAttribute("src");
      el.load();
    },
  };
}
