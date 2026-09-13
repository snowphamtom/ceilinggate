#!/usr/bin/env bash
# Build two-rung fMP4 HLS (720 + 480) into public/hls from prefer-live source.
# Do NOT swap in the 67s HQ cut — prefer-live is the 174s silent master.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/public/hls"
SRC="${1:-/tmp/yt.mp4}"
if [[ ! -f "$SRC" ]]; then
  echo "usage: scripts/make-hls.sh [path/to/prefer-live.mp4]" >&2
  echo "missing source: $SRC" >&2
  exit 1
fi
mkdir -p "$OUT/720" "$OUT/480"

ffmpeg -y -i "$SRC" -an -c:v libx264 -profile:v high -level 4.0 -pix_fmt yuv420p \
  -preset fast -crf 18 -maxrate 4500k -bufsize 9000k \
  -g 60 -keyint_min 60 -sc_threshold 0 \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4 \
  -hls_segment_filename "$OUT/720/seg_%03d.m4s" "$OUT/720/stream.m3u8"

ffmpeg -y -i "$SRC" -an -c:v libx264 -profile:v main -level 3.1 -pix_fmt yuv420p \
  -vf "scale=768:480:force_original_aspect_ratio=decrease,pad=768:480:(ow-iw)/2:(oh-ih)/2" \
  -preset fast -crf 20 -maxrate 1400k -bufsize 2800k \
  -g 60 -keyint_min 60 -sc_threshold 0 \
  -f hls -hls_time 4 -hls_playlist_type vod -hls_flags independent_segments \
  -hls_segment_type fmp4 -hls_fmp4_init_filename init.mp4 \
  -hls_segment_filename "$OUT/480/seg_%03d.m4s" "$OUT/480/stream.m3u8"

cat > "$OUT/master.m3u8" <<'M3U'
#EXTM3U
#EXT-X-VERSION:7
#EXT-X-INDEPENDENT-SEGMENTS
#EXT-X-STREAM-INF:BANDWIDTH=400000,AVERAGE-BANDWIDTH=231000,RESOLUTION=1280x800,FRAME-RATE=30,CODECS="avc1.640028"
720/stream.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=180000,AVERAGE-BANDWIDTH=107000,RESOLUTION=768x480,FRAME-RATE=30,CODECS="avc1.4d401f"
480/stream.m3u8
M3U
echo "wrote $OUT/master.m3u8"
