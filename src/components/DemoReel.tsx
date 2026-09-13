/** Judge demo plate — GitHub release mp4 on the live site. Not YouTube. Not Drive. */
import "./DemoReel.css";

const DEMO_SRC =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo.mp4";
const DEMO_60 =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/CeilingGate-AllGas-demo-60s.mp4";
const GRANT_SHOT =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-20260905/02-grant.png";

export function DemoReel() {
  return (
    <section className="sm-panel sm-demo-reel" aria-label="Judge demo video">
      <div className="sm-panel-head">
        <h2>Demo video</h2>
        <span className="sm-chip">GitHub release · ~1:08</span>
      </div>
      <video
        className="sm-demo-video"
        controls
        playsInline
        preload="metadata"
        poster={GRANT_SHOT}
      >
        <source src={DEMO_SRC} type="video/mp4" />
      </video>
      <p className="sm-demo-links">
        <a href={DEMO_SRC} target="_blank" rel="noreferrer">
          Full mp4
        </a>
        <span>·</span>
        <a href={DEMO_60} target="_blank" rel="noreferrer">
          60s cut
        </a>
        <span>·</span>
        <a href="/watch.html" rel="noreferrer">
          /watch.html permalink
        </a>
      </p>
    </section>
  );
}
