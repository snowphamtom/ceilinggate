# Streamer SHOW-OFF encode (box)

**Silent to Taylor** — deliver via MANAGER. OFF PHONE (`ceilinggate-demo/out/` + GH release only).

## Delivery spec (hard)
| Field | Required |
|-------|----------|
| Codec | H.264 (`libx264`) |
| Pixel format | `yuv420p` |
| Frame rate | **≥30 fps** |
| Quality | **CRF ≤ 20** |
| Audio | AAC ok (or silent) |
| Web | `+faststart` |

## A — Already have a silent/raw clip
```bash
/workspace/ceilinggate-demo/bin/encode-show-off.sh \
  /workspace/ceilinggate-demo/out/YOUR-RAW.mp4 \
  /workspace/ceilinggate-demo/out/CeilingGate-Forge-gates-clip.mp4
```
Optional: `CRF=18 FPS=60 encode-show-off.sh …`

Script **fails** if CRF>20, FPS<30, or output is not h264/yuv420p.

## B — Capture box desktop/browser (X11)
Box display is typically `DISPLAY=:6` at **1280×800**.

1. Open live site on the box browser (or ask Create/computerUse to stage Tip Jar / Line Delta / URL Receipt Gate empty→Run).
2. Record:
```bash
/workspace/ceilinggate-demo/bin/capture-box-desktop.sh 50 \
  /workspace/ceilinggate-demo/out/raw-forge-capture.mkv
```
3. Encode to SHOW-OFF:
```bash
/workspace/ceilinggate-demo/bin/encode-show-off.sh \
  /workspace/ceilinggate-demo/out/raw-forge-capture.mkv \
  /workspace/ceilinggate-demo/out/CeilingGate-Forge-gates-clip.mp4
```

### One-liner ffmpeg (encode only)
```bash
ffmpeg -y -i raw.mkv \
  -c:v libx264 -preset fast -crf 20 \
  -pix_fmt yuv420p -r 30 \
  -movflags +faststart \
  -c:a aac -b:a 160k \
  out/CeilingGate-show-off.mp4
```

### One-liner ffmpeg (x11grab raw)
```bash
ffmpeg -y -video_size 1280x800 -framerate 30 -f x11grab -i :6.0 \
  -t 45 -c:v libx264rgb -crf 15 -preset ultrafast \
  out/raw-desktop.mkv
```

## C — Captions / 60s / pack
After SHOW-OFF silent lands:
- `bin/reburn-captions.sh` (forensic captions, CRF 20)
- `bin/make-60s.sh` if vibeapps hard-caps ≤60s
- `bin/pack-release.sh` for GH release folder

## Content rules (All Gas)
- Real click → GRANT/REFUSE only (no costumes)
- Empty-on-load → edit → Run (Demo flips ≠ win-proof)
- Keep continuous cut **&lt;180s** (gates clip ~170s PASS already)
- Product language; stack tags Convex+Firecrawl+AgentMail(+OpenAI) if spoken/on-screen

## Verify
```bash
ffprobe -v error -select_streams v:0 \
  -show_entries stream=codec_name,r_frame_rate,pix_fmt -of default "$OUT"
```
Expect: `codec_name=h264`, `pix_fmt=yuv420p`, `r_frame_rate` ≥ 30/1.
