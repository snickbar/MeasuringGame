# Pre-launch list

The game is not live yet (only the owner and a friend or two are testing), so none of this blocks playtesting. Work through it before the public launch.

## Added November 27, 2026

**Firebase plan and limits**
- [ ] Check the Firebase console (Usage and billing). If the project is on the free Spark plan, move it to pay-as-you-go Blaze before launch.
  - Spark allows only **100 simultaneous Realtime Database connections** (about 10 full games), and it cannot be raised. New players are refused once it is full; players already connected keep playing. Blaze allows 200,000 per database.
  - Spark Hosting allows only **360 MB of transfer per day**. A first-time visitor downloads about 7 MB for the home screen alone (measured November 27), plus more as they open other screens, so Spark covers only a few dozen new visitors a day.
  - On Blaze, hosting transfer is $0.15/GB and database downloads $1/GB, so 10,000 new visitors is roughly $10 of hosting.
- [ ] Set a budget alert on the billing account so a spike can never surprise anyone.
- [ ] Check the service worker caches the game's files, so returning visitors cost no hosting transfer.

**Web version (people will find the game through links and streams)**
- [x] Wide screens: the game shows in a phone-shaped column on laptops and desktops (done, `npm run test:desktop-frame`).
- [x] Physical keyboard: digits, Backspace and Enter on the answer keypads, letters and Enter on the name keyboards (done, `npm run test:physical-keyboard`).
- [ ] Look at every mode in a desktop browser (only the home screen has been looked at on a laptop so far). Next up.
- [ ] The Install banner may not appear when the game is framed on desktop (the browser only offers install to the top page). Decide whether that matters.

**Name**
- [ ] Search the name "Size Em Up" before a public or store launch. A small downloadable Windows game called Size Em' Up already exists on itch.io (a different, single-player game). Get a lawyer's view if a trademark is wanted.

## Ads and the Supporter Pass (added November 27, 2026)
- [ ] Real rewarded ads replace the fake ad (it is one function, `showFakeAd`). Decide what happens to a timed Quick Game question while a real ad plays (the fake ad is only 2 seconds, a real one is 15-30), for example pause the timer.
- [ ] Log ads offered and ads watched per player, so the frequency of every ad spot can be tuned from real numbers.

## Already decided to do at launch (from earlier notes)
- [ ] Real billing behind the purchase flow (purchases are fake until launch).
- [ ] Kid-safe ads and a parental gate (the audience is all ages; revive-a-life ads are for solo modes only).
- [ ] Anti-cheat: lock profiles to their owner.
- [ ] Offline reconnect test (Quick Game solo must work offline, including airplane mode).
- [ ] Revisit whether Classic Party should require a second human (see polish-followups.md).
- [ ] Marketing plan: the owner expects marketing to be the roadblock and asked to work on it when the time comes.
- [ ] Interest in copyrighting the game.
