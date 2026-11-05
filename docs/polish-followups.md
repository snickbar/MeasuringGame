# Deferred polish and launch follow-ups

Saved November 5, 2026. These are follow-ups, not authorization to implement them.

- Profile monthly animation performance on another phone, especially April rain (about 300 animations) and August bubbles (about 259). User reports their current phone runs them well; preserve the approved appearance.
- January sparkle replacement remains on hold.
- Refresh the object rotator: its 563-object snapshot omits wishbone from the current 564-object catalog; remove the hardcoded count.
- Consider additional objects: seagull, songbird, puffin, hawk, tropical fish, cheese wedge, whisk, and cooking turner (check overlap with grill spatula).
- Complete phone playtesting mode by mode, including two-device reconnect, pause, sync, reward persistence, and native update installation.
- Recheck long-question readability on small phones following the recent larger writing-area changes.
- Revisit mascots for other modes, collection/cosmetics presentation experiments, and a menu-navigation tutorial only when requested.
- Mayhem and Order Up remain future game concepts.

Spring currently uses the approved rain and flowers. Wispy seed artwork is available; its absence from the effect is not an outstanding defect. Do not replace the current flair work independently.

Completed November 5: monthly level cards identify their reward; each level's results show its actual reward and a route to Awards/Style. Timed question rooms wait for active players' boards to finish before starting their shared guessing clock, with a bounded static fallback.

Also completed: monthly boards, reactions and flairs preload only their own artwork. Shared images stay cached; failed or stalled images do not block unrelated effects and can retry.

Loader recovery completed: stalled monthly metadata requests now time out and retry, including stalled response bodies. Reveal-engine failures and timeouts no longer stay cached as a permanent fallback. Web retries refresh dependency URLs too; native bundled asset paths remain unchanged.
