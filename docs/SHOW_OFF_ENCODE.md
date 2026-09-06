# Streamer SHOW-OFF encode (box)

**Silent to Taylor** — deliver via MANAGER. OFF PHONE (`ceilinggate-demo/out/` + GH release only).

## Delivery spec (hard)
| Field | Required |
|-------|----------|
| Codec | H.264 (`libx264`) |
| Pixel format | `yuv420p` |
| Frame rate | **≥30 fps** |
| Rate control | **CBR ~5M + filler** (default) |
| Audio | AAC ok (or silent) |
| Web | `+faststart` |

### LESSON (Streamer · 2026-09-06)
**CRF-only on a static SPA collapses bitrate** (long holds on Tip Jar / board look mushy or starve bits).  
Show-off listing encodes need **CBR ≈ 5 Mbps** plus a **tiny noise filler** so static UI frames keep bitrate.

| Mode | When |
|------|------|
| `MODE=cbr` (default) | vibeapps / SHOW-OFF / GH release demos |
| `MODE=crf CRF≤20` | archival only — **not** listing show-off |

## A — Encode raw → SHOW-OFF
```bash
/workspace/ceilinggate-demo/bin/encode-show-off.sh \
  /workspace/ceilinggate-demo/out/YOUR-RAW.mp4 \
  /workspace/ceilinggate-demo/out/CeilingGate-Forge-gates-clip.mp4
```
Optional: `BITRATE=6M FPS=60 encode-show-off.sh …`  
Fails closed if fps&lt;30, not h264/yuv420p, or CBR output bitrate collapsed (&lt;3M).

## B — Capture box desktop/browser (X11)
Box display is typically `DISPLAY=:6` at **1280×800**.

```bash
/workspace/ceilinggate-demo/bin/capture-box-desktop.sh 50 \
  /workspace/ceilinggate-demo/out/raw-forge-capture.mkv
/workspace/ceilinggate-demo/bin/encode-show-off.sh \
  /workspace/ceilinggate-demo/out/raw-forge-capture.mkv \
  /workspace/ceilinggate-demo/out/CeilingGate-Forge-gates-clip.mp4
```

### One-liner ffmpeg (CBR + filler — preferred)
```bash
ffmpeg -y -i raw.mkv \
  -vf "fps=30,noise=alls=1:allf=t,format=yuv420p" \
  -c:v libx264 -preset fast \
  -b:v 5M -minrate 5M -maxrate 5M -bufsize 10M \
  -x264-params nal-hrd=cbr \
  -pix_fmt yuv420p -movflags +faststart \
  -c:a aac -b:a 160k \
  out/CeilingGate-show-off.mp4
```

### Avoid for show-off (CRF-only)
```bash
# BAD for static SPA show-off — bitrate collapses on held UI
ffmpeg -i raw.mkv -c:v libx264 -crf 20 -pix_fmt yuv420p out/bad.mp4
```

## C — Captions / 60s / pack
- `bin/reburn-captions.sh` — prefer running **after** CBR show-off silent
- `bin/make-60s.sh` · `bin/pack-release.sh`

## Content rules
- Real click → GRANT/REFUSE · empty-on-load → edit → Run · &lt;180s continuous
- Product language; stack tags Convex+Firecrawl+AgentMail(+OpenAI) if on-screen

## Verify
```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,r_frame_rate,pix_fmt -of default "$OUT"
ffprobe -v error -show_entries format=bit_rate -of default "$OUT"
```
Expect: `h264`, `yuv420p`, fps ≥ 30, format `bit_rate` near **5M** (not a few hundred kbps).
