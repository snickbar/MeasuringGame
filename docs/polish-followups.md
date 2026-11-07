# Deferred polish and launch follow-ups

Saved November 5, 2026. These are follow-ups, not authorization to implement them.

- Profile monthly animation performance on another phone, especially April rain (about 300 animations) and August bubbles (about 259). User reports their current phone runs them well; preserve the approved appearance.
- January appearance is satisfactory per the user on November 6; no sparkle replacement remains outstanding.
- Completed November 6: all 105 batch 2 objects are active with approved measurements, orientations and travel styles, production artwork, scenery and Worlds assignments. The catalog contains 681 objects; the separate batch picker preserves the approved choices.
- Completed object gaps: seagull, songbird, puffin, hawk, tropical fish, cheese wedge and whisk are integrated. Cooking turner was declined by the user on November 6; do not add it.
- Complete phone playtesting mode by mode, including two-device reconnect, pause, sync, reward persistence, and native update installation.
- Before launch, revisit whether Classic Party should require a second human. During playtesting the host can start with bots as the only opponents.
- Recheck long-question readability on small phones following the recent larger writing-area changes.
- Revisit mascots for other modes and further collection/cosmetics presentation experiments only when requested.
- Published November 6: optional four-step Home menu tour, Skip on every step, remembered completion/dismissal, and Replay menu tour in Settings. The How to Play practice tutorial's fifth slide lists all 12 game modes individually. Browser checks cover three phone widths.
- Implemented November 6: Style uses one equipped-items set per category. Removed owned-item pin/lock buttons and the separate Equip Random toggle; a horizontally scrollable Equipped items strip shows every selected item. One equipped item stays fixed; multiple items rotate automatically. Reactions fill their available slots from equipped reactions only. Unequip all leaves an explicit empty selection instead of choosing from the entire inventory. Older fixed and random selections are preserved when read; new unlocks are not automatically added to an explicit selection. Reward Equip uses the same set.
- Mayhem and Order Up remain future game concepts.

Spring currently uses the approved rain and flowers. Wispy seed artwork is available; its absence from the effect is not an outstanding defect. Do not replace the current flair work independently.

Completed November 5: monthly level cards identify their reward; each level's results show its actual reward and a route to Awards/Style. Timed question rooms wait for active players' boards to finish before starting their shared guessing clock, with a bounded static fallback.

Also completed: monthly boards, reactions and flairs preload only their own artwork. Shared images stay cached; failed or stalled images do not block unrelated effects and can retry.

Loader recovery completed: stalled monthly metadata requests now time out and retry, including stalled response bodies. Reveal-engine failures and timeouts no longer stay cached as a permanent fallback. Web retries refresh dependency URLs too; native bundled asset paths remain unchanged.

Reveal safety completed: Survival callbacks and delayed Skip actions are scoped to the current run, question and visible reveal. Failed or timed-out object pictures can retry; a late failure for old artwork cannot remove a newer picture from the cache.
