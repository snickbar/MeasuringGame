// Public discovery uses CORS-enabled raw GitHub; ZIP downloads run natively.
export const UPDATE_SOURCES = [
  'https://raw.githubusercontent.com/snickbar/MeasuringGame/app-updates/version.json',
  'https://size-em-up.web.app/live/version.json',
];

const FILE_HOST = 'https://github.com/snickbar/MeasuringGame/releases/download/';
const MANIFEST_PREFIXES = ['https://raw.githubusercontent.com/snickbar/MeasuringGame/app-updates/', 'https://size-em-up.web.app/live/'];

// The file list for a partial update: every file the phone needs, each with a SHA-256 and where to get it.
export function validateManifest(value, version) {
  const files = value?.files;
  if (value?.version !== version || !Array.isArray(files) || !files.length || files.length > 8000) throw Error('Invalid file list');
  const seen = new Set();
  for (const f of files) {
    const name = f?.file_name;
    if (typeof name !== 'string' || !name || name.length > 300 || name.startsWith('/') || name.includes('\\') ||
        name.split('/').some(part => !part || part === '.' || part === '..') || name.endsWith('.br') || seen.has(name) ||
        !/^[a-f0-9]{64}$/i.test(f.file_hash || '') || typeof f.download_url !== 'string' || !f.download_url.startsWith(FILE_HOST) ||
        f.download_url.length > 400) throw Error('Invalid file list entry');
    seen.add(name);
  }
  if (!seen.has('index.html')) throw Error('File list has no index.html');
  return files.map(f => ({ file_name:f.file_name, file_hash:f.file_hash.toLowerCase(), download_url:f.download_url }));
}

export function validateUpdate(value) {
  if (!value || !/^1\.0\.\d{12,14}-[a-zA-Z0-9]+$/.test(value.version || '') ||
      !/^[a-f0-9]{64}$/i.test(value.checksum || '')) throw Error('Invalid update manifest');
  const url = new URL(value.url);
  if (url.protocol !== 'https:' || url.username || url.password ||
      !(url.href.startsWith('https://github.com/snickbar/MeasuringGame/releases/download/') ||
        url.href.startsWith('https://size-em-up.web.app/live/'))) throw Error('Invalid update download address');
  if (value.manifestUrl != null) {
    const m = new URL(value.manifestUrl);
    if (m.protocol !== 'https:' || m.username || m.password || !MANIFEST_PREFIXES.some(p => m.href.startsWith(p))) throw Error('Invalid file list address');
  }
  return value;
}

export function createLiveUpdater({ updater, fetchManifest = fetch, sources = UPDATE_SOURCES, timeoutMs = 8000 }) {
  let inFlight;
  // Partial update first (only changed files travel); any problem at all falls back to the full ZIP.
  async function downloadBundle(remote) {
    if (remote.manifestUrl) {
      try {
        const abort = new AbortController(), timer = setTimeout(() => abort.abort(), timeoutMs);
        let files;
        try {
          const response = await fetchManifest(remote.manifestUrl + '?t=' + Date.now(), { cache:'no-store', signal:abort.signal });
          if (!response.ok) throw Error('server said ' + response.status);
          files = validateManifest(await response.json(), remote.version);
        } finally { clearTimeout(timer); }
        const bundle = await updater.download({ url:remote.url, version:remote.version, checksum:remote.checksum, manifest:files });
        if (bundle?.id) return bundle;
      } catch { /* fall through to the full download */ }
    }
    return updater.download({ url:remote.url, version:remote.version, checksum:remote.checksum });
  }
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
        const bundle = waiting || await downloadBundle(remote);
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
