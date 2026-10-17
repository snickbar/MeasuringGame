export const STARTER_AWARDS = [
  { id: 'welcome-size-em-up', cat: 'Getting started', name: 'Welcome to Size Em Up!', desc: 'Open the game and establish your player profile.', reward: 100 },
  { id: 'account-connected', cat: 'Getting started', name: 'Account Connected', desc: 'Connect your Google account for the first time.', reward: 50 },
];

// Coin credit and durable award receipts always share one profile transaction.
export function starterAwardProfile(profile, { connected = false } = {}) {
  if (!profile) return;
  const fresh = STARTER_AWARDS.filter(a => (a.id !== 'account-connected' || connected) && !profile.achClaimed?.[a.id]);
  if (!fresh.length) return;
  const achClaimed = { ...profile.achClaimed };
  for (const award of fresh) achClaimed[award.id] = true;
  return { ...profile, coins: (profile.coins || 0) + fresh.reduce((sum, a) => sum + a.reward, 0), achClaimed };
}

// A resumable upgrade, rather than cloning a spendable guest wallet. Existing
// account progress remains authoritative, matching the game's prior policy.
export async function upgradeGuestProfile({ sourceId, accountId, transaction, defaults }) {
  if (sourceId === accountId) return;
  const claim = await transaction(sourceId, current => {
    if (current?.accountUpgrade) return;
    return { ...(current || defaults()), accountUpgrade: { accountId, completed: false } };
  });
  const source = claim.snapshot.val();
  const transfer = source?.accountUpgrade?.accountId === accountId && !source.accountUpgrade.completed;
  const welcomePaid = !!source?.achClaimed?.['welcome-size-em-up'];
  const guest = transfer ? { ...source } : null;
  if (guest) { delete guest.accountUpgrade; delete guest.archivedGuest; }
  const target = await transaction(accountId, current => {
    if (current?.guestUpgrades?.[sourceId]) return;
    const profile = current || guest || defaults();
    // Carry the guest's Welcome receipt even when an existing account wins:
    // connecting the same player must never trigger another Welcome grant.
    return { ...profile, achClaimed: { ...profile.achClaimed, ...(welcomePaid ? { 'welcome-size-em-up': true } : {}) },
      guestUpgrades: { ...profile.guestUpgrades, [sourceId]: true } };
  });
  if (!target.snapshot.val()?.guestUpgrades?.[sourceId]) throw Error('Account upgrade could not be saved');
  let retired = source;
  if (transfer) {
    const archived = await transaction(sourceId, current => {
      if (current?.accountUpgrade?.accountId !== accountId || current.accountUpgrade.completed) return;
      // Keep a recoverable backup, but retire the guest's spendable copy. On
      // sign-out, guest play resumes without another Welcome reward.
      const archivedGuest = { ...current }; delete archivedGuest.accountUpgrade; delete archivedGuest.archivedGuest;
      return { ...defaults(), achClaimed: { 'welcome-size-em-up': true },
        accountUpgrade: { accountId, completed: true }, archivedGuest };
    });
    retired = archived.snapshot.val();
  }
  return { account: target.snapshot.val(), guest: retired };
}
