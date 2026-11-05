# Phase 3 recording review

Independent review of the captured browser recordings; no source-code inspection was used to assess motion. The before recording is 29.87 s and the after recording is 14.10 s, both 1280×800 H.264 at about 30 fps. Both recordings are silent.

## Findings

- **Pass, with measurement limits — result integrity and alignment.** The sampled post-spin frames (after recording, roughly 10.1–10.8 s and 13.0–13.4 s) show the grid fully settled in the reel windows. At 9.2–10.0 s, symbols travel through the viewport with clipping at its edges; the final rows land inside the fixed wells. No winning-looking near-miss effect was apparent.
- **Pass — movement and reveal.** The after clip shows an initial interval of steady motion and a changing mixed-symbol field, followed by the settled winning grid and a restrained highlight on its contributing positions. The presentation keeps the cabinet still and readable. The frames sampled during the spin do not resolve each reel's stop timing closely enough to independently confirm the 120 ms intervals or judge acceleration and brake curves continuously.
- **Pass, with a clarity note — money.** At the start of the later sampled spin (about 9.2 s), the balance has visibly fallen from 1,319 to 1,314 and the status says “Stake 5 tokens · debited”; the payout remains blank while the reels turn. This makes the saved debit legible before the reveal. During the 320 ms payout count, a sampled intermediate frame around 10.4 s shows gross payout 37 while the settled breakdown reports return 70/net +35. This is expected during the visual count but is briefly non-reconciled. The settled display reconciles at the later sample. Consider counting net alongside gross or revealing the breakdown once both counters finish if that transient mismatch distracts in live play.
- **Pass — cabinet corrections.** The lounge-return label and removed corner note reduce ambiguity and leave the nameplate prominent. The plate's additional edge shading reads as slightly more inset at this scale without extra ornament.
- **Unverified — tactile button, audio, and accessibility announcements.** The recording has no audio stream, and its frame samples do not include a sufficiently clear pointer/key-down interval to judge click feel. It cannot establish perceived sound balance, sound cleanup by listening, screen-reader announcement count, or reduced-motion behavior.

## Limits

This review used consecutive still samples extracted from the provided 30 fps recordings. It did not involve controlled live playback on a named refresh rate, direct controller measurement, headphones or speakers, a screen reader, or manual keyboard/rapid-click trials. It is independent of code inspection but is not a human listening test. No claim about audio quality is made. The captured reel samples support exact settled alignment and visible sequencing, but not a frame-accurate measurement of each reel's stop offset.

## Final recording addendum (counter correction)

A second recording review used `docs/evidence/phase3/after-final.mp4`, sampled at 10 frames per second around the later spin and payout. The earlier clarity note is resolved in this capture: at approximately 9.0–10.0 s, the stake is visibly debited and the gross field remains blank while the reels move. During the payout count around 10.2–10.6 s, the returned and net values advance together with gross; each sampled value reconciles (`net = returned − stake`). The settled display retains the same result. This review found no visible counter mismatch in the final recording.

Sequential reel samples at roughly 0.1 s intervals show early reels settling while later columns continue moving, followed by all five columns on the recorded result grid. The later columns appear to stop in order. The 30 fps recording cadence and 10 fps review samples cannot establish each 120 ms stop offset or resolve the very small 2 px settle. At the sampled frames, no symbol jumps outside the reel window or changes after settling, and no near-miss presentation is apparent.

The cabinet remains stationary and readable through the turn; the nameplate appears slightly more inset. Audio and a press/release interval cannot be assessed from this silent recording. It also cannot establish perceived acceleration, sound quality, real input-to-photon latency, physical GPU frame time, or assistive-technology output. Those remain separate runtime/listening checks.
