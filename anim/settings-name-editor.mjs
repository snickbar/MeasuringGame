// A draft-only editor. Only the game's keyboard can change the displayed name;
// committing happens once, through Save (or the keyboard's Save key).
export function mountSettingsNameEditor({ screen, input, button, panel, keyboard,
  status, clear, cancel, getName, saveName, validateName, renderKeyboard }) {
  let editing = false;
  input.readOnly = true;
  input.inputMode = 'none';
  const error = () => !input.value.trim() ? 'Please enter a name.' : validateName(input.value.trim());
  function close({ focus = false } = {}) {
    editing = false;
    panel.hidden = true;
    input.value = getName();
    button.textContent = 'Edit';
    button.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-invalid', 'false');
    status.textContent = '';
    if (focus) button.focus({ preventScroll: true });
  }
  function save() {
    if (!editing) return;
    const message = error();
    status.textContent = message || '';
    input.setAttribute('aria-invalid', String(!!message));
    if (message) return;
    saveName(input.value.trim());
    close({ focus: true });
  }
  button.addEventListener('click', () => {
    if (editing) { save(); return; }
    input.value = getName();
    editing = true;
    panel.hidden = false;
    button.textContent = 'Save';
    button.setAttribute('aria-expanded', 'true');
    keyboard.querySelector('button:not(:disabled)')?.focus({ preventScroll: true });
  });
  // Readonly blocks native editing; these also block paste/drop/IME and physical
  // typing without interfering with Tab navigation to the game keyboard keys.
  for (const type of ['beforeinput', 'paste', 'drop']) input.addEventListener(type, e => e.preventDefault());
  input.addEventListener('keydown', e => { if (e.key !== 'Tab') e.preventDefault(); });
  input.addEventListener('focus', () => input.blur());
  input.addEventListener('input', () => {
    if (!editing) { input.value = getName(); return; }
    const message = error();
    status.textContent = message || '';
    input.setAttribute('aria-invalid', String(!!message));
  });
  clear.addEventListener('click', () => {
    if (!editing) return;
    input.value = '';
    status.textContent = '';
    input.setAttribute('aria-invalid', 'false');
  });
  cancel.addEventListener('click', () => close({ focus: true }));
  renderKeyboard(keyboard, input, { maxLength: 12, onDone: save });
  const done = keyboard.querySelector('[data-action="done"]');
  done.textContent = 'Save';
  const space = keyboard.ownerDocument.createElement('button');
  space.type = 'button';
  space.className = 'kbd-key kbd-key-space';
  space.textContent = 'Space';
  space.setAttribute('aria-label', 'Space');
  space.addEventListener('click', () => {
    if (!editing || input.value.length >= 12) return;
    input.value += ' ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  done.before(space);
  new MutationObserver(() => {
    if (editing && !screen.classList.contains('active')) close();
  }).observe(screen, { attributes: true, attributeFilter: ['class'] });
  close();
  return { cancel: close };
}
