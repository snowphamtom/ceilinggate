/** Demo reel — YouTube + demo file. */
const YT_ID = "2KsMO90LpdE";
const YT_URL = `https://www.youtube.com/watch?v=${YT_ID}`;
const YT_EMBED = `https://www.youtube.com/embed/${YT_ID}`;
const GH_YT =
  "https://github.com/snowphamtom/ceilinggate/releases/download/allgas-demo-yt2/CeilingGate-ClaimCheck-HUD.mp4";

export function DemoReel() {
  return (
    <section className="sm-panel sm-demo-reel sm-glass" aria-label="Demo">
      <div className="sm-panel-head">
        <h2>Watch the demo</h2>
        <span className="sm-chip">YouTube</span>
      </div>
      <div className="sm-demo-frame">
        <iframe
          className="sm-demo-video"
          title="Claim Check demo"
          src={YT_EMBED}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
      <p className="sm-demo-links">
        <a href={YT_URL} target="_blank" rel="noreferrer">
          YouTube
        </a>
        <span>·</span>
        <a href={GH_YT} target="_blank" rel="noreferrer">
          Download MP4
        </a>
        <span>·</span>
        <a href="/watch.html">On-site player</a>
      </p>
    </section>
  );
}
