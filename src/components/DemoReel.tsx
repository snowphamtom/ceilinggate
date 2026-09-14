/** Prefer-live Claim Check HUD — same-origin /hls yt7 primary. Public YT secondary. */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  attachAbr,
  type AbrHandle,
  HLS_MASTER,
  POSTER,
} from "../lib/attachAbr";
import "./DemoReel.css";

/** Public YT O-ID — */
const YT_ID = "Jh-txwsIxuk";
const YT_URL = `https://www.youtube.com/watch?v=${YT_ID}`;
/**
 * LIVE: prefer-live same-origin /hls yt7 (primary).
 * Public YT secondary: Jh-txwsIxuk.
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
        <div className="sm-meta-chips">
          <span className="sm-meta-chip">prefer-live</span>
          <span className="sm-chip">{label}</span>
        </div>
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
        <a href={HLS_MASTER} target="_blank" rel="noreferrer">
          HLS
        </a>
        <span>·</span>
        <a href={`${import.meta.env.BASE_URL}watch.html`}>On-site player</a>
        <span>·</span>
        <a
          href={YT_URL}
          target="_blank"
          rel="noreferrer"
          className="sm-demo-yt-secondary"
          title="Public YT Jh-txwsIxuk — matching HUD is the player above"
        >
          YouTube · on-request
        </a>
      </p>
    </section>
  );
}
