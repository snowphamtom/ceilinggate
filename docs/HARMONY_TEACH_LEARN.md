# Harmony — teach & learn (Taylor 2026-09-06)

Taylor: everyone teach and learn in harmony.

## Rules
1. **One win path** — CeilingGate / All Gas. No side hustles, no tip-spam, no false DONE.
2. **Report only to MANAGER** — silent to Taylor. MANAGER cascades lessons.
3. **Teach up** — when you learn something real (FAIL mode, fix, listing fact, mail diagnosis), send MANAGER one short lesson line + evidence path. Not chatter.
4. **Learn down** — when MANAGER shares a lesson, apply it on your next action without re-asking.
5. **Cross-teach via MANAGER only** — do not DM Taylor; do not fan-out the same tip to every bot; MANAGER routes who needs it.
6. **Better than parent** — each artifact you ship must beat what it replaced on its narrow job.
7. **No costumes** — live clicks → live state only.

## Current shared lessons (MANAGER board)
- Tip Jar/Line Delta must start empty; Demo buttons ≠ win-proof; edit-input→Run is the PASS bar.
- Gates demo for vibeapps must be **<180s** continuous click→result.
- Official All Gas submit = vibeapps card (https://vibeapps.dev/s/ceilinggate). Wayne mail ≠ filing.
- No duplicate vibeapps FILE — UPDATE listing only.
- GROK ADMIN under fences — see STANDING_ACCESS.md.

## Roles
| Bot | Teach / learn focus |
|-----|---------------------|
| Create | Ship fixes; teach code/CI lessons up |
| Streamer | Teach demo FAIL modes; learn PASS bar |
| Eve | Teach NEW mail/Drive facts; no historical re-confirm |
| Bob | Teach prize honesty / submit fields; HOLD duplicate FILE |
| MANAGER | Route lessons; videoReview; vibeapps UPDATE |

## Streamer lesson (2026-09-06)
1. Pre-populated GRANT before Run = FAIL (Reset/empty-on-load).
2. Demo flips ≠ win-proof; only edit-input→Run click→result.
3. Accidental preliminary Run before PASS bar = FAIL.
4. Continuous cut >180s = All Gas FAIL; head/tail trim only.
PASS: Reset/empty → tip50 REFUSE → tip5 GRANT → clear GRANT → over REFUSE; <180s; videoReview before DONE.
Evidence: REJECTED2-gates-5cdecfce · PASS md5 9b7ef5024c0953358c6460c7dec9e334

## Create lesson (2026-09-06)
- Root cause of sticky Tip Jar/Line Delta: parent SPA `useEffect→run` on mount auto-filled verdict after hard refresh.
- Fix tip `ca2a54c`: start `decision=null`, pageshow clear, Reset button.
- CI: `lesson-card.yml` noise ≠ ship gate; treat `convex-deploy` green as ship gate.
Evidence: src/App.tsx · live site · shot 08-forge-gates.png

## Bob lesson (2026-09-06) — cash as table; bans as never-say

### Cash (Luma only)
| Place | Cash |
|-------|------|
| Overall | $10,000 |
| 2nd | $5,000 |
| 3rd | $1,500 |
| **Pool** | **$16,500** |

Marketing “$25k/$45k” = cash **plus** credits — not a bigger cash pool.

### Never say
| Ban | Why |
|-----|-----|
| USPTO Track One / ~$2,100 is prize cash | Fee≠prize (`cip-track-one-2100`) |
| We already won / guaranteed payout timing | Winner announced ≠ cash-in-hand |
| Square / $1k T&E is the All Gas prize path | HARD STOP commercial in submit |
| Duplicate FILE on vibeapps | UPDATE live card only |
| Demo ≥180s / Demo flips = win-proof | Clip <180s; edit→Run is the proof |
| Access slogans / buried prose cash | Product language; cash = table |

Evidence: `docs/PRIZE_HONESTY.md` · VIBEAPPS_UPDATE_PASTE.md · ELIGIBILITY_ONEPAGER.md

## Eve lesson (rivals · 2026-09-06)
### Stack tags (listing + site)
| Tag | Role |
|-----|------|
| Convex | Claims, scrapes, decisions, `*.convex.site` |
| Firecrawl | Public receipt scrape |
| AgentMail | Inbox + webhook |
| OpenAI | One sentence after numbers — does **not** decide GRANT/REFUSE |

### Originality vs Block / NoticeProof / Attest
| Beat them on | How we do it |
|--------------|--------------|
| Receipt GRANT / over honesty | Line ledger claimed ≤ interior; REFUSE names $ overage |
| Forge spawn | Live `/forge/{slug}/` micro-apps — not a chat clone |

Never: inbox yes/no rebrand · docs-search chat · Magpie/Square pitch.
Evidence: live `#` stack-tags · `docs/ORIGINALITY.md` · `/forge/url-receipt-gate/`

## Streamer lesson (encode · 2026-09-06)
| Do | Don't |
|----|-------|
| SHOW-OFF: **CBR ~5M + noise filler**, ≥30fps, yuv420p | CRF-only on static SPA (bitrate collapses) |
| `bin/encode-show-off.sh` default MODE=cbr | Listing encode with `-crf 20` alone |

| Capture: `echo $DISPLAY` / list `/tmp/.X11-unix` first | Assume `DISPLAY=:6` (HQ used `:7.0`) |

Evidence: `streamer/SHOW_OFF_ENCODE.md` · `bin/encode-show-off.sh` · `bin/capture-box-desktop.sh`

