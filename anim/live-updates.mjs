// Public discovery uses CORS-enabled raw GitHub; ZIP downloads run natively.
export const UPDATE_SOURCES = [
  'https://raw.githubusercontent.com/snickbar/MeasuringGame/app-updates/version.json',
  'https://size-em-up.web.app/live/version.json',
];

export function validateUpdate(value) {
  if (!value || !/^1\.0\.\d{12,14}-[a-zA-Z0-9]+$/.test(value.version || '') ||
      !/^[a-f0-9]{64}$/i.test(value.checksum || '')) throw Error('Invalid update manifest');
  const url = new URL(value.url);
  if (url.protocol !== 'https:' || url.username || url.password ||
      !(url.href.startsWith('https://github.com/snickbar/MeasuringGame/releases/download/') ||
        url.href.startsWith('https://size-em-up.web.app/live/'))) throw Error('Invalid update download address');
  return value;
}

export function createLiveUpdater({ updater, fetchManifest = fetch, sources = UPDATE_SOURCES, timeoutMs = 8000 }) {
  let inFlight;
  async function check(runningVersion, onFound) {
    const errors = [];let newerFound=false;
    for (const source of sources) {
      try {
        const abort = new AbortController(), timer = setTimeout(() => abort.abort(), timeoutMs);
        let remote;
        try {
          const response = await fetchManifest(source + '?t=' + Date.now(), { cache:'no-store', signal:abort.signal });
          if (!response.ok) throw Error('server said ' + response.status);
          remote = validateUpdate(await response.json());
        } finally { clearTimeout(timer); }
        if (!runningVersion) throw Error('Installed version is unavailable');
        if (remote.version <= runningVersion) {
          if(newerFound)throw Error('A newer update could not be downloaded');
          return { state:'current' };
        }
        newerFound=true;
        const waiting = ((await updater.list()).bundles || []).find(b => b.version === remote.version && ['pending','success'].includes(b.status));
        try { onFound?.(!!waiting); } catch { /* UI feedback cannot cancel an update. */ }
        const bundle = waiting || await updater.download({ url:remote.url, version:remote.version, checksum:remote.checksum });
        if (!bundle?.id) throw Error('Download did not return a bundle');
        await updater.next({ id:bundle.id });
        // Cleanup is best effort, after successful queueing. Keep both live versions.
        try {
          const current = await updater.current(), keep = new Set([bundle.id,current?.bundle?.id,'builtin']);
          for (const b of (await updater.list()).bundles || []) if (!keep.has(b.id)) { try { await updater.delete({ id:b.id }); } catch {} }
        } catch {}
        return { state:waiting?'ready':'downloaded', id:bundle.id };
      } catch (error) { errors.push(String(error?.message || error)); }
    }
    return { state:'error', error:errors.join('; ') };
  }
  return {
    check(version, onFound) {
      // Background and Settings checks must never download the same ZIP twice.
      if (!inFlight) inFlight = check(version,onFound).finally(() => { inFlight = null; });
      return inFlight;
    },
  };
}
