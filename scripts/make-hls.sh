#!/usr/bin/env bash
# Build relative same-origin HLS (v0/v1/v2 · AAC) into public/hls from masterpiece source.
# Prefer downloading allgas-demo-yt3 + rewriting to relative URLs when shipping yt3 pack.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hls"
SRC="${1:-}"
if [[ -z "$SRC" || ! -f "$SRC" ]]; then
  echo "usage: scripts/make-hls.sh path/to/ClaimCheck-HUD.mp4" >&2
  exit 1
fi
rm -rf "$OUT"
mkdir -p "$OUT/v0" "$OUT/v1" "$OUT/v2"

encode() {
  local name="$1" vf="$2" crf="$3" maxrate="$4" buf="$5" profile="$6" level="$7" aac="$8"
  local args=(-y -i "$SRC")
  [[ -n "$vf" ]] && args+=(-vf "$vf")
  ffmpeg "${args[@]}" \
    -c:v libx264 -preset fast -crf "$crf" -maxrate "$maxrate" -bufsize "$buf" \
    -profile:v "$profile" -level "$level" -pix_fmt yuv420p \
    -g 60 -keyint_min 60 -sc_threshold 0 \
    -c:a aac -b:a "$aac" -ac 2 -ar 48000 \
    -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
    -hls_segment_type mpegts \
    -hls_segment_filename "$OUT/$name/seg_%03d.ts" "$OUT/$name/prog.m3u8"
}

encode v0 "" 20 4500k 9000k high 4.0 128k
encode v1 "scale=1152:720:force_original_aspect_ratio=decrease,pad=1152:720:(ow-iw)/2:(oh-ih)/2" 22 2500k 5000k high 3.1 128k
encode v2 "scale=768:480:force_original_aspect_ratio=decrease,pad=768:480:(ow-iw)/2:(oh-ih)/2" 24 1200k 2400k main 3.1 96k

cat > "$OUT/master.m3u8" <<'M3U'
#EXTM3U
#EXT-X-VERSION:6
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=5248960,AVERAGE-BANDWIDTH=4674136,RESOLUTION=1280x800,FRAME-RATE=30,CODECS="avc1.640020,mp4a.40.2"
v0/prog.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=2982432,AVERAGE-BANDWIDTH=2653566,RESOLUTION=1152x720,FRAME-RATE=30,CODECS="avc1.64001f,mp4a.40.2"
v1/prog.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1532952,AVERAGE-BANDWIDTH=1337029,RESOLUTION=768x480,FRAME-RATE=30,CODECS="avc1.64001f,mp4a.40.2"
v2/prog.m3u8
M3U
echo "wrote $OUT/master.m3u8 (relative)"
