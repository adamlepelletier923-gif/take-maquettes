// Maquettes interactives de Take : un téléphone de 402 × 874 pt, une version choisie par ?v=, le thème par ?t=clair|sombre.
// Tout reste en mémoire : « Recommencer » recharge la page.
(() => {
  const qs = new URLSearchParams(location.search);
  const theme = qs.get('t') === 'sombre' ? 'sombre' : 'clair';
  document.documentElement.dataset.t = theme;
  const phone = document.querySelector('.phone');
  const proto = document.body.dataset.proto;

  const ICONS = {
    dice: '<svg class="ico dice" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="4.5"/><g fill="currentColor" stroke="none"><circle cx="8" cy="8" r="1.4"/><circle cx="16" cy="8" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="8" cy="16" r="1.4"/><circle cx="16" cy="16" r="1.4"/></g></svg>',
    arrow: '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/></svg>',
    check: '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    link: '<svg class="ico" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10 14a4.5 4.5 0 0 0 6.4 0l3-3a4.5 4.5 0 0 0-6.4-6.4l-1 1"/><path d="M14 10a4.5 4.5 0 0 0-6.4 0l-3 3a4.5 4.5 0 0 0 6.4 6.4l1-1"/></svg>',
  };
  document.querySelectorAll('[data-ico]').forEach((el) => { el.outerHTML = ICONS[el.dataset.ico]; });
  document.querySelectorAll('[data-src]').forEach((img) => { img.src = img.dataset.src.replace('{t}', theme); });

  const sections = [...document.querySelectorAll('section[data-v]')];
  const current = sections.find((s) => s.dataset.v === qs.get('v')) || sections[0];
  sections.forEach((s) => { s.hidden = s !== current; });
  const body = document.querySelector('.layer.body');
  if (body && current.dataset.body) body.style.top = `${current.dataset.body}px`;
  if (body && current.dataset.nobody !== undefined) body.hidden = true;
  phone.style.setProperty('--lift', current.dataset.lift || 0);

  const state = (text) => { try { parent.postMessage({ proto, v: current.dataset.v, state: text }, '*'); } catch {} };
  state(current.dataset.start || 'Rien d’envoyé.');

  const toastEl = document.querySelector('.toast');
  toastEl.innerHTML = `<span class="ok">${ICONS.check}</span><span class="msg"></span>`;
  let toastTimer = 0;
  const toast = (text) => {
    toastEl.querySelector('.msg').textContent = text;
    if (toastEl.classList.contains('on')) return;
    toastEl.classList.add('on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toastEl.classList.remove('on'), 4000);
  };

  const dim = document.querySelector('.dim');
  const openSheet = (sheet) => { sheet.classList.add('on'); dim.classList.add('on'); };
  const closeSheet = () => {
    document.querySelectorAll('.sheet.on').forEach((s) => s.classList.remove('on'));
    dim.classList.remove('on');
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    phone.classList.remove('kb');
  };
  dim.addEventListener('click', () => { closeSheet(); state('Feuille fermée sans rien envoyer.'); });

  const setMode = (sheet, mode) => {
    sheet.dataset.mode = mode;
    sheet.querySelectorAll('[data-show]').forEach((el) => { el.hidden = el.dataset.show !== mode; });
    sheet.querySelectorAll('.seg button').forEach((b) => b.classList.toggle('on', b.dataset.mode === mode));
  };
  document.querySelectorAll('.sheet[data-mode]').forEach((s) => setMode(s, s.dataset.mode));

  const QUESTIONS = ['Ton resto préféré à Lyon ?', 'C’est quoi ton talent caché ?', 'La série que tu conseilles à tout le monde ?',
    'Mer ou montagne ?', 'Ton pire fou rire ?', 'Le son que tu écoutes en boucle ?', 'Ta destination de rêve ?',
    'Le meilleur conseil qu’on t’ait donné ?', 'Ton plat réconfort ?', 'Ce qui te fait rire à tous les coups ?']
    .map((q) => q.replace(/ \?$/, ' ?'));
  let qi = -1;
  const nextQuestion = () => { qi = (qi + 1 + Math.floor(Math.random() * (QUESTIONS.length - 1))) % QUESTIONS.length; return QUESTIONS[qi]; };

  const refresh = (input) => {
    document.querySelectorAll(`[data-send="${input.id}"]`).forEach((b) => { b.disabled = !input.value.trim(); });
  };
  document.addEventListener('input', (e) => { if (e.target.id) refresh(e.target); });

  const spins = new WeakMap();
  const actions = {
    open(b) {
      const sheet = document.getElementById(b.dataset.open);
      if (b.dataset.mode) setMode(sheet, b.dataset.mode);
      openSheet(sheet);
      state(b.dataset.say || (sheet.dataset.mode === 'signed' ? 'Feuille ouverte : question signée.' : 'Feuille ouverte : question anonyme.'));
    },
    mode(b) {
      setMode(b.closest('.sheet'), b.dataset.mode);
      state(b.dataset.mode === 'anon' ? 'Anonyme : Sofia ne saura pas que c’est toi.' : 'Signée : Sofia verra ton nom.');
    },
    rnd(b) {
      const input = document.getElementById(b.dataset.rnd);
      input.value = nextQuestion();
      refresh(input);
      const dice = b.querySelector('.dice');
      if (dice) { const r = (spins.get(dice) || 0) + 360; spins.set(dice, r); dice.style.transform = `rotate(${r}deg)`; }
      state(`Question au hasard : « ${input.value} ». Tu peux l’envoyer, la modifier ou en tirer une autre.`);
    },
    fill(b) {
      const input = document.getElementById(b.dataset.fill);
      input.value = b.textContent.trim();
      refresh(input);
      b.parentElement.querySelectorAll('.pill').forEach((p) => p.classList.toggle('on', p === b));
      state(`Question choisie : « ${input.value} ». Touche la flèche pour l’envoyer.`);
    },
    send(b) {
      const input = document.getElementById(b.dataset.send);
      const text = input.value.trim();
      if (!text) return;
      let anon = b.dataset.anon === '1';
      const sheet = b.closest('.sheet');
      if (sheet && sheet.dataset.mode) anon = sheet.dataset.mode !== 'signed';
      if (b.dataset.mistOf) anon = document.getElementById(b.dataset.mistOf).classList.contains('on');
      input.value = '';
      refresh(input);
      if (sheet) closeSheet(); else { input.blur(); phone.classList.remove('kb'); }
      if ('web' in b.dataset) {
        document.querySelectorAll(`[data-view]`).forEach((v) => { v.hidden = v.dataset.view !== 'done'; });
      } else {
        toast(anon ? 'Question envoyée en anonyme' : 'Question envoyée');
      }
      state(`Envoyée ${anon ? 'en anonyme' : 'avec ton nom'} à Sofia : « ${text} ». Elle la reçoit après la modération.`);
    },
    again() {
      document.querySelectorAll(`[data-view]`).forEach((v) => { v.hidden = v.dataset.view !== 'form'; });
      state('Nouvelle question.');
    },
    mist(b) {
      const field = document.getElementById(b.dataset.mist);
      const on = field.classList.toggle('on');
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
      const input = field.querySelector('input');
      input.placeholder = on ? input.dataset.phOn : input.dataset.phOff;
      state(on ? 'Anonyme activé : le champ passe en brume, Sofia ne saura pas que c’est toi.' : 'Anonyme coupé : Sofia verra ton nom.');
    },
    copy() { toast('Lien copié'); state('Lien copié : take.cc/sofia_rossi.'); },
    story(b) {
      const full = document.getElementById(b.dataset.story);
      full.querySelector('[data-app]').textContent = b.dataset.app;
      full.hidden = false;
      state(`Aperçu de la story ${b.dataset.app} avec ton lien.`);
    },
    publish(b) {
      document.getElementById(b.dataset.publish).hidden = true;
      closeSheet();
      toast('Ton lien est dans ta story');
      state('Story publiée : tes amis touchent le lien et te posent leurs questions en anonyme.');
    },
    back(b) { document.getElementById(b.dataset.back).hidden = true; state('Retour au partage.'); },
    say(b) { state(b.dataset.say); },
  };
  document.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || b.disabled) return;
    for (const key of Object.keys(actions)) {
      if (key in b.dataset) { actions[key](b); return; }
    }
  });

  window.Proto = { theme, v: current.dataset.v, current, toast, state, openSheet, closeSheet, setMode, actions };

  const coarse = matchMedia('(pointer: coarse)').matches;
  const kbd = document.querySelector('.kbd');
  if (kbd && !coarse) {
    const rows = [['a', 'z', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'], ['q', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l', 'm'],
      ['⇧', 'w', 'x', 'c', 'v', 'b', 'n', '’', '⌫'], ['123', '☺', 'espace', 'retour']];
    const cls = { '⇧': 'w', '⌫': 'w', '123': 'w', '☺': 'w', espace: 'space', retour: 'ret' };
    kbd.innerHTML = '<div class="sug"><span>Je</span><span>Tu</span><span>C’est</span></div>'
      + rows.map((r) => `<div class="row">${r.map((k) => `<button class="k ${cls[k] || ''}" data-key="${k}" tabindex="-1">${k}</button>`).join('')}</div>`).join('');
    let shift = false;
    kbd.addEventListener('pointerdown', (e) => {
      const key = e.target.closest('.k');
      e.preventDefault();
      const el = document.activeElement;
      if (!key || !el || !el.matches('input, textarea')) return;
      const k = key.dataset.key;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      if (k === '⌫') { if (start === end && start > 0) el.setRangeText('', start - 1, start, 'end'); else el.setRangeText('', start, end, 'end'); }
      else if (k === '⇧') { shift = !shift; return; }
      else if (k === 'retour') { const send = document.querySelector(`[data-send="${el.id}"]`); if (send && !send.disabled) send.click(); return; }
      else if (k === '123' || k === '☺') return;
      else {
        let ch = k === 'espace' ? ' ' : k;
        if (shift || (!el.value && ch !== ' ')) ch = ch.toUpperCase();
        shift = false;
        el.setRangeText(ch, start, end, 'end');
      }
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    document.addEventListener('focusin', (e) => { if (e.target.matches('input, textarea')) phone.classList.add('kb'); });
    document.addEventListener('focusout', () => {
      setTimeout(() => { const a = document.activeElement; if (!a || !a.matches('input, textarea')) phone.classList.remove('kb'); }, 0);
    });
  }
})();
