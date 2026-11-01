const LEAD = 300, STEP = 480, COUNT = 200, HOLD = 100;

// Presentation only. The server's awarded total remains authoritative, including team ties.
export function roundScoreFrame(amounts, total, age) {
  total = Math.max(0, Number(total) || 0);
  const values = amounts.map(n => Math.max(0, Number(n) || 0));
  // Large teams still finish within the existing auto-summary dwell/scroll window.
  const stepMs = Math.min(STEP, 1900 / Math.max(1, values.length - 1));
  const countMs = Math.min(COUNT, stepMs * .7);
  const finishAt = LEAD + Math.max(0, values.length - 1) * stepMs + countMs + HOLD;
  let value = 0;
  const steps = values.map((amount, i) => {
    const start = LEAD + i * stepMs;
    const fraction = Math.max(0, Math.min(1, (age - start) / countMs));
    value += amount * fraction;
    return {visible: age >= start, current: age >= start && age < start + stepMs};
  });
  const complete = age >= finishAt;
  return {value: complete ? total : Math.min(total, Math.round(value)), steps, complete, finishAt};
}

export function createRoundScoreReveal({now = () => performance.now(), request = requestAnimationFrame, cancel = cancelAnimationFrame,
  visible = () => true, reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches} = {}) {
  let key, started = 0, raf, rows = [];
  function paint(time, instant = false) {
    let allDone = true;
    rows.forEach((row, i) => {
      const age = instant ? Infinity : time - started - Math.min(i, 3) * 100;
      const state = roundScoreFrame(row.amounts, row.total, age);
      row.steps.forEach((step, j) => {
        const target = step.closest('.team-breakdown-line') || step;
        target.style.opacity = state.steps[j].visible ? '1' : '0';
        target.style.transform = state.steps[j].visible ? 'translateY(0)' : 'translateY(5px)';
        step.classList.toggle('score-current', !instant && state.steps[j].current);
      });
      const text = '+' + state.value;
      if (row.counter.textContent !== text) row.counter.textContent = text;
      const pulse = !instant && row.total > 0 && state.complete && age < state.finishAt + 500;
      if (pulse && !row.counter.classList.contains('score-total-land')) row.counter.style.setProperty('--score-final-age', `${-(age - state.finishAt)}ms`);
      row.counter.classList.toggle('score-total-land', pulse);
      allDone &&= state.complete && age >= state.finishAt + 500;
    });
    return allDone;
  }
  function tick() {
    if (!visible() || rows.some(row => !row.counter.isConnected) || reduced()) { paint(now(), true); return; }
    if (!paint(now())) raf = request(tick);
  }
  return {
    mount(root, nextKey) {
      cancel(raf);
      if (key !== nextKey) { key = nextKey; started = now(); }
      rows = [...root.querySelectorAll('.summary-row')].map((el, i) => {
        el.classList.add('score-reveal');
        el.style.animationDelay = `${-(now() - started - Math.min(i, 3) * 100)}ms`;
        const counter = el.querySelector('.roundpts');
        const steps = [...el.querySelectorAll('.breakdown-chip')];
        for (const step of steps) {
          step.style.animation = 'none'; step.style.opacity = '1';
          (step.closest('.team-breakdown-line') || step).classList.add('score-step');
        }
        if (!counter) return null;
        const total = Number(counter.dataset.scoreTotal) || 0;
        counter.style.animationDelay = '0s'; counter.style.opacity = '1';
        counter.setAttribute('aria-label', `${total} points this round`);
        return {counter, steps, amounts: steps.map(s => Number(s.dataset.scoreAmount)), total};
      }).filter(Boolean);
      paint(now(), reduced());
      if (!reduced()) raf = request(tick);
    },
    stop() { cancel(raf); paint(now(), true); rows = []; }
  };
}
