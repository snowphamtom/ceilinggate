/** Prefer-live Claim Check HUD — HLS/progressive yt3 audio primary. Tip Jar YT held (secondary). */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachAbr,
  type AbrHandle,
  RUNG_HIGH,
  HLS_MASTER,
} from "../lib/attachAbr";
import "./DemoReel.css";

/** HOLD — Tip Jar O-ID. Do NOT flip until Taylor tips new Public ID. */
const YT_ID = "2KsMO90LpdE";
const YT_URL = `https://www.youtube.com/watch?v=${YT_ID}`;
const POSTER = "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-yt3/poster-grant.png";

/**
 * LIVE tag: allgas-demo-yt3 (audio masterpiece).
 * HOLD Tip Jar YT O-ID 2KsMO90LpdE until Taylor tips new Public ID.
 */
export function DemoReel() {
  const shellRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const handleRef = useRef<AbrHandle | null>(null);
  const [armed, setArmed] = useState(false);
  const [label, setLabel] = useState("Claim Check HUD");

  const arm = useCallback(() => setArmed(true), []);

  useEffect(() => {
    const node = shellRef.current;
    if (!node || armed) return;
    if (typeof IntersectionObserver === "undefined") {
      setArmed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.25)) {
          setArmed(true);
          io.disconnect();
        }
      },
      { rootMargin: "100px 0px", threshold: [0, 0.25, 1] },
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
    <section
      ref={shellRef}
      className="sm-panel sm-demo-reel sm-glass"
      aria-label="Claim Check demo video"
    >
      <div className="sm-panel-head">
        <h2>Watch the demo</h2>
        <span className="sm-chip">{label}</span>
      </div>
      <div className="sm-demo-frame">
        <video
          ref={videoRef}
          className="sm-demo-video"
          controls
          playsInline
          preload="none"
          poster={POSTER}
          controlsList="nodownload"
          disablePictureInPicture
          onPlay={arm}
        />
        {!armed ? (
          <button type="button" className="sm-demo-play" onClick={onPlayClick}>
            Play Claim Check
          </button>
        ) : null}
      </div>
      <p className="sm-demo-links">
        <a href={RUNG_HIGH} target="_blank" rel="noreferrer">
          Download MP4
        </a>
        <span>·</span>
        <a href={HLS_MASTER} target="_blank" rel="noreferrer">
          HLS
        </a>
        <span>·</span>
        <a href="/watch.html">On-site player</a>
        <span>·</span>
        <a
          href={YT_URL}
          target="_blank"
          rel="noreferrer"
          className="sm-demo-yt-secondary"
          title="Tip Jar hold — matching HUD is the player above"
        >
          YouTube (Tip Jar)
        </a>
      </p>
    </section>
  );
}
