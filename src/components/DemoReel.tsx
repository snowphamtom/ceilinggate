/** Judge demo plate — GitHub release mp4 on the live site. Not YouTube. Not Drive. */
import { useCallback, useEffect, useRef, useState } from "react";
import "./DemoReel.css";

const DEMO_60 =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo-60s.mp4";
const DEMO_FULL =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo.mp4";
const GRANT_SHOT =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/02-grant.png";

type Cut = "60" | "full";

export function DemoReel() {
  const shellRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cut, setCut] = useState<Cut>("60");
  const [armed, setArmed] = useState(false);

  const src = cut === "60" ? DEMO_60 : DEMO_FULL;

  const arm = useCallback(() => {
    setArmed(true);
  }, []);

  useEffect(() => {
    const node = shellRef.current;
    if (!node || armed) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.35)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "80px 0px", threshold: [0, 0.35, 1] },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [armed]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !armed) return;
    if (el.getAttribute("src") !== src) {
      const keepTime = el.currentTime;
      const wasPaused = el.paused;
      el.src = src;
      el.load();
      if (keepTime > 0.25) {
        const onMeta = () => {
          el.currentTime = Math.min(keepTime, el.duration || keepTime);
          if (!wasPaused) void el.play().catch(() => undefined);
          el.removeEventListener("loadedmetadata", onMeta);
        };
        el.addEventListener("loadedmetadata", onMeta);
      }
    }
  }, [armed, src]);

  const onPlayClick = () => {
    arm();
    const el = videoRef.current;
    if (el && el.paused) void el.play().catch(() => undefined);
  };

  return (
    <section
      ref={shellRef}
      className="sm-panel sm-demo-reel"
      aria-label="Judge demo video"
    >
      <div className="sm-panel-head">
        <h2>Demo video</h2>
        <span className="sm-chip">{cut === "60" ? "60s cut" : "~1:08 full"}</span>
      </div>
      <div className="sm-demo-frame">
        <video
          ref={videoRef}
          className="sm-demo-video"
          controls
          playsInline
          preload="none"
          poster={GRANT_SHOT}
          controlsList="nodownload"
          disablePictureInPicture
          onPlay={arm}
        />
        {!armed ? (
          <button type="button" className="sm-demo-play" onClick={onPlayClick}>
            Play demo
          </button>
        ) : null}
      </div>
      <p className="sm-demo-links">
        <button
          type="button"
          className={"sm-demo-cut" + (cut === "60" ? " on" : "")}
          onClick={() => {
            setCut("60");
            arm();
          }}
        >
          60s (fast)
        </button>
        <button
          type="button"
          className={"sm-demo-cut" + (cut === "full" ? " on" : "")}
          onClick={() => {
            setCut("full");
            arm();
          }}
        >
          Full
        </button>
        <a href={DEMO_60} target="_blank" rel="noreferrer">
          60s file
        </a>
        <span>·</span>
        <a href={DEMO_FULL} target="_blank" rel="noreferrer">
          Full file
        </a>
        <span>·</span>
        <a href="/watch.html">/watch.html</a>
      </p>
    </section>
  );
}
