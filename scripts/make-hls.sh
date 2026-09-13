#!/usr/bin/env bash
# Build two-rung fMP4 HLS into public/hls from the GitHub release demo.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hls"
SRC="${1:-}"
if [[ -z "$SRC" ]]; then
  echo "usage: scripts/make-hls.sh path/to/CeilingGate-AllGas-demo.mp4" >&2
  exit 1
fi
mkdir -p "$OUT/v360" "$OUT/v800"
ffmpeg -y -i "$SRC" -an -c:v libx264 -profile:v baseline -pix_fmt yuv420p \
  -vf "scale=640:400:force_original_aspect_ratio=decrease,pad=640:400:(ow-iw)/2:(oh-ih)/2" \
  -r 4 -g 8 -keyint_min 8 -sc_threshold 0 -b:v 45k -maxrate 60k -bufsize 90k -preset veryfast \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4 \
  -hls_segment_filename "$OUT/v360/seg_%03d.m4s" "$OUT/v360/stream.m3u8"
ffmpeg -y -i "$SRC" -an -c:v libx264 -profile:v main -pix_fmt yuv420p \
  -vf "scale=1280:800:force_original_aspect_ratio=decrease,pad=1280:800:(ow-iw)/2:(oh-ih)/2" \
  -r 4 -g 8 -keyint_min 8 -sc_threshold 0 -b:v 90k -maxrate 120k -bufsize 180k -preset veryfast \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4 \
  -hls_segment_filename "$OUT/v800/seg_%03d.m4s" "$OUT/v800/stream.m3u8"
cat > "$OUT/master.m3u8" <<'EOF'
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=70000,AVERAGE-BANDWIDTH=50000,RESOLUTION=640x400,FRAME-RATE=4,CODECS="avc1.42c01e"
v360/stream.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=140000,AVERAGE-BANDWIDTH=95000,RESOLUTION=1280x800,FRAME-RATE=4,CODECS="avc1.4d4028"
v800/stream.m3u8
EOF
echo "wrote $OUT/master.m3u8"
