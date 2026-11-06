# Phase 3 — mechanical feel and motion

Implemented on the Phase 2.1 cabinet. No RNG, reel distribution, paylines, payout mathematics, economy, progression, or version 1 persistence code changed. Nothing was committed or published.

## Interaction and presentation

- Navigation says **BACK TO LOUNGE**. The corner paragraph is removed; automatic-credit context appears beside the revealed payout. The nameplate has a narrow inset edge and a restrained engraving highlight.
- Reel movement uses Phaser tweens with the integral of a smoothstep velocity: 180 ms acceleration, 500 ms cruise, 420 ms braking, with 120 ms additional cruise per subsequent reel. Each reel meets a 2 px detent and settles over 100 ms. Normal nominal completion spans 1200–1680 ms. Interstitial symbols approaching the stop follow the configured strip around the predetermined stop; no outcome-dependent near-miss sequence is introduced.
- Pointer and keyboard presses depress the existing switch immediately; release uses the existing short transition. Disabled/spinning and skip states remain distinct. The state guard and key-repeat protection remain in place. Across five deterministic browser spins, all five stop cues fired once per spin; adjacent cue intervals measured 101.9–141.0 ms around the 120 ms target, with frame scheduling quantization. **Skip motion** reveals the saved result without another wager. Lounge navigation stays disabled during moving reels and works during celebration/counting.
- The saved settlement remains immediate. Only presentation withholds the payout while showing the debit at spin start. Payout begins after the final settle. Gross, returned, and net share one 320 ms cubic-out counter; net equals returned minus stake at each display update. Balance uses the same duration/ease and can retarget from its current display value. Corrected CSS ordering preserves actual tabular numerals after font shorthand declarations.
- Winning line numbers remain visible and the existing line catalog supplies every path. The strongest line retains its restrained outline. Ordinary losses and break-even results receive no profit celebration. The slot no longer plays the lounge cheer.
- Machine voices share damped wood/metal resonances: switch press, reel detents, individual stops, and short win strikes. Reel gain/rate accelerate and reduce as reels stop. No continuous room ambience plays inside the slot. Music/room and effects gains are independent, perceptually mapped, session-only controls; master mute remains saved. No new save fields or dependency were added.

## Lifecycle and accessibility

Reel cancellation resolves pending promises once and kills both travel/settle tweens. Generation guards prevent old spin continuations from affecting a new scene. Visibility changes silence audio and reveal the recorded grid; returning does not replay the spin or win. OS or in-game reduced motion removes reel travel and numerical counting. Reduced-motion result lines remain static. Scene shutdown disposes reel effects, counter RAFs, sound objects, DOM and window listeners. Presentation timers now use the scene clock.

The full static result is separate from animated figures. Only the final outcome live region announces the result, once per spin; the visible counting nodes are hidden from assistive technology. Reload exposes the saved summary without a fresh result announcement. Keyboard focus and native controls remain in place. Automated DOM checks establish mutations and semantics, not actual spoken output.

## Recordings and review

- [Phase 2.1 baseline recording](../evidence/phase3/before.mp4)
- [Final Phase 3 recording](../evidence/phase3/after-final.mp4)
- [Independent recording review and final addendum](2026-11-05-phase3-independent.md)

These are real-time browser captures, approximately 30 fps, 1280×800. They contain no audio track. Both use the same three deterministic stop sequences. The review sampled consecutive frames from recordings rather than using source inspection to infer motion. It found ordered stops and stable final grids. Its first counter-coherence finding was corrected and independently rechecked in the final recording. It cannot resolve the exact 120 ms intervals or assess the 2 px settle, perceived button feel, or sound quality with confidence.

## Input latency observations

In the warmed hardware preview, three synthetic Space gestures completed the synchronous input handler in **1.0–2.0 ms**. The next RAF occurred **1.9–4.7 ms** after dispatch, with the pressed class already applied. The preserved baseline measured **1.0–1.2 ms** in the handler and **1.5–5.6 ms** to the next RAF. These short samples show no animation wait before feedback. They do not measure physical key/mouse latency, scanout, acoustic onset, or input-to-photon time. Automated pointer tests separately verify immediate 3 px depression and held-key/duplicate-input behavior.

## Performance

Hardware and software measurements are separate. The shared Electron 44 / Chromium 152 preview reports **AMD Radeon RX 6800 XT, ANGLE/radeonsi** and an approximately 165 Hz RAF cadence at 1280×800. The local Chromium 156 container uses **SwiftShader**, on Ryzen 7 5800X3D, at 1600×900. Do not compare their absolute rates as a speedup.

The baseline is the preserved Phase 2.1 release artifact. Hardware cases use three identical deterministic spins at 5 lines × 1. Software cases use 40 lines × 5 and the exact 13055 maximum payout, with 12 scene round trips. The software probe now counts each distinct RAF timestamp once, avoiding duplicate counter RAFs being mistaken for extra display frames. Each frame is categorized as idle, spin (<850 ms after input), stopping, or win; these buckets are timing observations, not GPU markers.

### Hardware preview — frame interval distributions (ms)

| Phase    | Before n | Before p50 / p95 / p99 / max | After n | After p50 / p95 / p99 / max |
| -------- | -------: | ---------------------------- | ------: | --------------------------- |
| Idle     |     1313 | 6.1 / 6.1 / 6.2 / 6.2        |    1228 | 6.1 / 6.1 / 6.2 / 6.2       |
| Spinning |      420 | 6.1 / 6.1 / 6.2 / 6.2        |     422 | 6.1 / 6.1 / 6.2 / 6.2       |
| Stopping |      372 | 6.1 / 6.1 / 6.2 / 6.2        |     412 | 6.1 / 6.1 / 6.2 / 6.2       |
| Win      |      596 | 6.1 / 6.1 / 6.2 / 6.2        |     595 | 6.1 / 6.1 / 6.2 / 6.2       |

The warmed samples exclude recording-start overhead and contain zero estimated missed RAF slots at the observed ~165 Hz cadence. This is scheduling evidence, not proof that every refresh was presented or a measurement of GPU frame time. Separate recording-inclusive samples contained idle/tool-start stalls and one 18.1 ms spin interval; they are not silently included in the warmed comparison.

### SwiftShader — frame interval distributions (ms)

| Phase    | Before n | Before p50 / p95 / p99 / max | After n | After p50 / p95 / p99 / max |
| -------- | -------: | ---------------------------- | ------: | --------------------------- |
| Idle     |       66 | 16.7 / 33.4 / 33.4 / 33.4    |      66 | 16.7 / 33.4 / 33.4 / 33.4   |
| Spinning |       29 | 33.3 / 50.1 / 50.1 / 50.1    |      28 | 33.3 / 33.4 / 66.8 / 66.8   |
| Stopping |       32 | 16.8 / 49.9 / 50.0 / 50.0    |      40 | 16.7 / 33.4 / 33.4 / 33.4   |
| Win      |      141 | 16.7 / 33.4 / 50.1 / 50.1    |     143 | 16.7 / 33.4 / 50.0 / 50.0   |

Overall mean interval: 25.06 → 24.43 ms; p95: 33.4 → 33.4 ms. Intervals above 25 ms: 123/268 → 123/277. Estimated missed 60 Hz slots: 135 → 129, calculated by rounding each interval to refresh slots, not by compositor dropped-frame telemetry. Callback-duration p95 stayed 0.7 ms. The samples do not establish a speed improvement. One isolated 66.8 ms spin interval is worse than the baseline maximum; its cause has not been attributed, and no speculative optimization was made. No sustained regression appears in these distributions or the hardware sample.

### Memory

The final lifecycle test forces GC before and after 12 scene round trips. DOM nodes/listeners stay constant; heap and backing-store values are in [checks.json](../evidence/phase3/checks.json). The final run measured 271 nodes and 108 listeners before/after, retained JS heap 7.27 → 7.51 MB, and unchanged 21.51 MB backing storage. Small heap differences are not a leak proof. The performance-only probe likewise has stable nodes/listeners across its 12 trips. The cabinet still uploads only at initial allocation/paint. Hardware-preview `performance.memory` grows across repeated loads/recordings and was not GC-controlled; it is retained as raw evidence, not used for a leak comparison.

Raw measurements: [hardware](../evidence/phase3/hardware-performance.json), [software before](../evidence/phase3/software-before.json), [software after](../evidence/phase3/software-after.json), [chart](../evidence/phase3/performance.html).

## Verification

- `npm test`: 54 tests across 15 files pass, including exact game math, save compatibility, interruption-safe number display, reel clipping/cancellation, and new smoothstep-motion and audio lifecycle/mix tests.
- `npm run check`, `npm run typecheck`, `npm run build`, `npm run check:offline`, and `git diff --check` pass. Standalone output embeds all 22 runtime assets and no developer controls.
- `scripts/browser-phase3.mjs`: all 15 bet/line combinations; predetermined losses/partial/break-even/small/big wins; debit before reveal; synchronized gross/returned/net; repeated input; held Space; exact final saved accounting; final announcement once; rendered final-grid comparison with reload; motion skip; both motion preferences changed during a spin; simulated hidden/resume; mid-spin reload; navigation during count-up; independent volume controls; one audio context and no active slot sources at rest; teardown counts.
- `scripts/browser-phase21.mjs`: four desktop sizes (1280×800, 1366×768, 1600×900, 1920×1080), preserved layout and physical control states, cash-out/navigation accounting, reduced-motion variants and final announcement behavior.
- `scripts/browser-reel-clipping.mjs`: moving symbol pixels stay inside the aperture.

The game-feel, audio-design, phaser-core, performance-optimization and Impeccable skills informed this work. No new animation library was introduced.

## Remaining limits

Human speaker/headphone listening, human real-time motion approval, actual screen-reader speech, Firefox/Safari, physical input-to-photon latency and GPU timestamp/presentation telemetry are not checked. Hidden-tab behavior is exercised by a visibility-event simulation; OS suspension/resume remains a device check. The recordings are silent, the independent review used timed recording frames, volume levels last only for the session, and software-renderer tail stalls remain possible. Evidence files are local ignored artifacts under `docs/evidence/`; preserve them separately when sharing the work. Gameplay-economy redesign is outside this phase.
