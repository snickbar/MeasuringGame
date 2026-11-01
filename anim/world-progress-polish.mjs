// Remember only improvements earned this session. Never animate existing stars on every visit.
export function createWorldProgressPolish({owner = () => '', reduced = () => false, now = () => performance.now()} = {}) {
  const events = new Map();
  function record({world, level, from, to, best, run, nextWorldIndex = null}) {
    if (to <= from && !best) return;
    events.set(`${owner()}:${world}:${level}`, {owner:owner(), world, level, from, to, best, run, nextWorldIndex});
  }
  function apply(root, world) {
    for (const event of events.values()) {
      if (event.owner !== owner()) continue;
      if (world == null && event.nextWorldIndex != null) {
        const card = root.querySelector(`#wl-world-${event.nextWorldIndex}:not(:disabled)`);
        if (!card || event.listDone) continue;
        event.listDone = true;
        if (!reduced()) card.classList.add('world-level-open');
        continue;
      }
      if (event.world !== world) continue;
      const card = root.querySelector(`#wl-level-${event.level}`);
      const stars = [...(card?.querySelectorAll('.wl-stars>span') || [])];
      if (!card || stars.filter(s=>!s.classList.contains('off')).length < event.to) continue;
      event.started ??= now();
      const age = now() - event.started;
      if (reduced() || age > 2600) continue;
      for (let i=event.from; i<event.to; i++) {
        stars[i]?.classList.add('world-star-land');
        stars[i]?.style.setProperty('--world-delay', `${i * 180 - age}ms`);
      }
      if (event.best) {
        const note = card.querySelector('.cs-note');
        note?.classList.add('world-best-updated'); note?.style.setProperty('--world-delay', `${500 - age}ms`);
      }
      if (event.from === 0 && event.to > 0) {
        const next = root.querySelector(`#wl-level-${event.level+1}:not(:disabled)`);
        next?.classList.add('world-level-open'); next?.style.setProperty('--world-delay', `${850 - age}ms`);
      }
    }
  }
  return {record, apply};
}
