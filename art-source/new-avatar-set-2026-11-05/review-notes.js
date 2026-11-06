(() => {
  'use strict';
  const key = 'new-avatar-review-2026-11-05'; // Preserve notes from the original gallery.
  const cards = [...document.querySelectorAll('article[data-slug]')];
  const slugs = new Set(cards.map(card => card.dataset.slug));
  const status = document.getElementById('save-status');
  let notes = {}, durable = false, savedAt = 0;
  function say(message, warning = false) {
    status.textContent = message;
    status.dataset.warning = String(warning);
  }
  function validate(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw Error('Invalid review notes');
    const cleaned = {};
    for (const [slug, row] of Object.entries(value)) {
      if (!slugs.has(slug) || !row || typeof row !== 'object' || typeof row.change !== 'boolean' || typeof row.note !== 'string' || row.note.length > 20000) throw Error('Invalid review notes');
      cleaned[slug] = { change: row.change, note: row.note };
    }
    return cleaned;
  }
  const candidates = [];
  let storageProblem = false;
  try {
    const raw = localStorage.getItem(key);
    if (raw) candidates.push({ notes: validate(JSON.parse(raw)), savedAt: Number(localStorage.getItem(key + ':savedAt')) || 0, primary: true });
  } catch { storageProblem = true; }
  for (const [storageName, backupKey] of [['localStorage', key + ':backup'], ['sessionStorage', key + ':session']]) {
    try {
      const raw = window[storageName].getItem(backupKey);
      if (raw) { const entry = JSON.parse(raw); candidates.push({ notes: validate(entry.notes), savedAt: Number(entry.savedAt) || 0 }); }
    } catch { /* The other copy may still be available. Never discard an unreadable primary. */ }
  }
  candidates.sort((a, b) => b.savedAt - a.savedAt || Number(!!b.primary) - Number(!!a.primary));
  if (candidates[0]) {
    notes = candidates[0].notes; savedAt = candidates[0].savedAt;
    durable = !!candidates[0].primary;
    say(durable ? 'Loaded your saved notes from this browser.' : 'Recovered a backup. Press Save notes, or download a backup to keep it.', !durable);
  } else say(storageProblem ? 'Browser storage is unavailable or unreadable. Download a backup to keep your notes.' : 'No saved notes here yet. Changes will save automatically in this browser.', storageProblem);
  function show() {
    for (const card of cards) {
      const entry = notes[card.dataset.slug] || {};
      card.querySelector('input').checked = !!entry.change;
      card.querySelector('textarea').value = entry.note || '';
    }
  }
  function snapshot() {
    return Object.fromEntries(cards.map(card => [card.dataset.slug, { change: card.querySelector('input').checked, note: card.querySelector('textarea').value }]));
  }
  function save() {
    notes = snapshot(); savedAt = Date.now(); durable = false;
    const serialized = JSON.stringify(notes), envelope = JSON.stringify({ notes, savedAt });
    let tabSaved = false;
    try { sessionStorage.setItem(key + ':session', envelope); tabSaved = sessionStorage.getItem(key + ':session') === envelope; } catch {}
    // Keep the previous valid disk copy as a backup, without making backup
    // failure prevent the current notes from saving (e.g. near the quota).
    try {
      const previous = localStorage.getItem(key);
      if (previous) localStorage.setItem(key + ':backup', JSON.stringify({ notes: validate(JSON.parse(previous)), savedAt: Number(localStorage.getItem(key + ':savedAt')) || 0 }));
    } catch {}
    try {
      localStorage.setItem(key, serialized);
      durable = localStorage.getItem(key) === serialized;
      if (durable) localStorage.setItem(key + ':savedAt', String(savedAt));
    } catch { /* Report the failure below; retain the live notes for export. */ }
    if (durable) say('Saved in this browser at ' + new Date(savedAt).toLocaleTimeString() + '. Download a backup to keep a portable copy.');
    else say(tabSaved ? 'Saved for this tab only. Download a backup before closing it.' : 'Not saved by this browser. Download a backup before leaving this page.', true);
    return durable;
  }
  show();
  for (const card of cards) {
    card.querySelector('textarea').maxLength = 20000;
    card.querySelector('input').addEventListener('change', save);
    card.querySelector('textarea').addEventListener('input', save);
    card.querySelector('textarea').addEventListener('change', save);
  }
  document.getElementById('save-notes').onclick = save;
  const flush = () => { if (JSON.stringify(snapshot()) !== JSON.stringify(notes)) save(); };
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.hidden) flush(); });
  document.querySelectorAll('[data-bg]').forEach(button => { button.onclick = () => {
    document.body.className = button.dataset.bg;
    document.querySelectorAll('[data-bg]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  }; });
  document.getElementById('export').onclick = () => {
    save();
    const blob = new Blob([JSON.stringify({ type: 'size-em-up-avatar-review', date: '2026-11-05', savedAt, notes }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = 'new-avatar-review.json'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    say((durable ? 'Saved in this browser. ' : '') + 'Backup download requested. Keep the JSON file to restore or share your notes.', !durable);
  };
  const fileInput = document.getElementById('import-file');
  document.getElementById('import').onclick = () => fileInput.click();
  fileInput.onchange = async () => {
    const file = fileInput.files[0]; if (!file) return;
    try {
      const payload = JSON.parse(await file.text());
      if (payload.type !== 'size-em-up-avatar-review') throw Error('Wrong file type');
      const imported = validate(payload.notes);
      notes = { ...snapshot(), ...imported }; show(); save();
    } catch { say('Could not restore that file. Your current notes have been kept.', true); }
    finally { fileInput.value = ''; }
  };
  status.dataset.ready = 'true';
})();
