/** Judge demo plate — ABR when HLS is on-origin, else progressive rungs. */
import { useCallback, useEffect, useRef, useState } from "react";
import { attachAbr, type AbrHandle, RUNG_HIGH, RUNG_LOW } from "../lib/attachAbr";
import "./DemoReel.css";

const GRANT_SHOT =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/02-grant.png";

export function DemoReel() {
  const shellRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleRef = useRef<AbrHandle | null>(null);
  const [armed, setArmed] = useState(false);
  const [label, setLabel] = useState("idle");

  const arm = useCallback(() => setArmed(true), []);

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
    let live = true;
    attachAbr(el, (s) => {
      if (live) setLabel(s);
    }).then((h) => {
      if (!live) {
        h.destroy();
        return;
      }
      handleRef.current = h;
    });
    return () => {
      live = false;
      handleRef.current?.destroy();
      handleRef.current = null;
    };
  }, [armed]);

  const onPlayClick = () => {
    arm();
    const el = videoRef.current;
    if (el && el.paused) void el.play().catch(() => undefined);
  };

  return (
    <section ref={shellRef} className="sm-panel sm-demo-reel" aria-label="Judge demo video">
      <div className="sm-panel-head">
        <h2>Demo video</h2>
        <span className="sm-chip">{label}</span>
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
        <a href={RUNG_LOW} target="_blank" rel="noreferrer">
          60s file
        </a>
        <span>·</span>
        <a href={RUNG_HIGH} target="_blank" rel="noreferrer">
          Full file
        </a>
        <span>·</span>
        <a href="/watch.html">/watch.html</a>
        <span>·</span>
        <a href="/hls/master.m3u8">HLS master</a>
      </p>
    </section>
  );
}
