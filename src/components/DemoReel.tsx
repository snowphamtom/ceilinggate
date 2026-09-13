/** ONE prefer-live demo reel for judges — YT + allgas-demo-yt file. No ABR jargon. */
const YT_ID = "2KsMO90LpdE";
const YT_URL = `https://www.youtube.com/watch?v=${YT_ID}`;
const YT_EMBED = `https://www.youtube.com/embed/${YT_ID}`;
const GH_YT =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-yt/CeilingGate-Forge-gates-clip-YT.mp4";

export function DemoReel() {
  return (
    <section className="sm-panel sm-demo-reel" aria-label="Prefer-live demo">
      <div className="sm-panel-head">
        <h2>Demo</h2>
        <span className="sm-chip">prefer-live</span>
      </div>
      <div className="sm-demo-frame">
        <iframe
          className="sm-demo-video"
          title="CeilingGate prefer-live demo"
          src={YT_EMBED}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <p className="sm-demo-links">
        <a href={YT_URL} target="_blank" rel="noreferrer">
          YouTube silent
        </a>
        <span>·</span>
        <a href={GH_YT} target="_blank" rel="noreferrer">
          allgas-demo-yt file
        </a>
      </p>
    </section>
  );
}
