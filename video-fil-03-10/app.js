const scenes = {
  clair: { label: 'Take clair', file: 'img/fil-clair.jpg', width: 402, height: 874, top: 194, bottom: 354, inset: 16, slot: 370, background: '#fff', row: '#fff' },
  sombre: { label: 'Take sombre', file: 'img/fil-sombre.jpg', width: 402, height: 874, top: 194, bottom: 354, inset: 16, slot: 370, background: '#000', row: '#000' },
  anonyme: { label: 'Carte anonyme sombre', file: 'img/take-2928.png', width: 440, height: 956, top: 245, bottom: 749, inset: 18, slot: 404, background: '#fff', row: 'linear-gradient(90deg,#fff 0 6px,#29292b 6px 434px,#fff 434px)' }
};

const startingChoice = { A: 'A3', B: 'B3', C: 'C1', D: 'D1', E: 'E2', F: 'F2', G: 'G1', H: 'H1' };
const base = { width: .65, maxHeight: 460, ratio: 9 / 16, align: 'start', corner: 16, overlay: 'balanced', playback: 'autoplay' };
const axes = {
  A: [
    { id: 'A1', title: 'Pleine largeur', subtitle: '100 % de la zone média', note: 'La présence actuelle, conservée comme point de comparaison.', config: { width: 1, maxHeight: 520, ratio: 4 / 5 } },
    { id: 'A2', title: 'Large, mais respirant', subtitle: '80 % de la zone média', note: 'Le take garde une image forte, avec un peu d’air à droite.', config: { width: .8, maxHeight: 520, ratio: 4 / 5 } },
    { id: 'A3', title: 'Discret comme X', subtitle: '65 % de la zone média', note: 'Environ 240 pt dans le fil Take, proche des 256 pt observés sur X.', config: { width: .65, maxHeight: 520, ratio: 4 / 5 } },
    { id: 'A4', title: 'Très discret', subtitle: '55 % de la zone média', note: 'Le texte et le vote dominent nettement l’image.', config: { width: .55, maxHeight: 520, ratio: 4 / 5 } }
  ],
  B: [
    { id: 'B1', title: 'Compact', subtitle: 'Plafond 320 pt', note: 'Laisse beaucoup de contenu du take visible sans défilement.', config: { width: .8, maxHeight: 320 } },
    { id: 'B2', title: 'Moyen', subtitle: 'Plafond 390 pt', note: 'Un compromis si 460 pt semble encore trop haut.', config: { width: .8, maxHeight: 390 } },
    { id: 'B3', title: 'Portrait borné', subtitle: 'Plafond 460 pt', note: 'La hauteur de l’exemple X reste proche des 455 pt observés.', config: { width: .8, maxHeight: 460 } },
    { id: 'B4', title: 'Portrait entier', subtitle: 'Plafond 530 pt', note: 'Le 9:16 à 80 % tient sans être réduit ; le vote descend.', config: { width: .8, maxHeight: 530 } }
  ],
  C: [
    { id: 'C1', title: 'Ratio du fichier', subtitle: 'Ici 9:16 simulé', note: 'Le vrai fichier garderait son ratio, jusqu’au plafond de hauteur.', config: { ratio: 9 / 16 } },
    { id: 'C2', title: 'Portrait court', subtitle: '4:5', note: 'Montre plus de largeur, comme la fenêtre actuelle de la capture.', config: { ratio: 4 / 5 } },
    { id: 'C3', title: 'Carré', subtitle: '1:1', note: 'Très stable dans le fil, mais coupe les vidéos verticales.', config: { ratio: 1 } },
    { id: 'C4', title: 'Paysage', subtitle: '16:9', note: 'Compact en hauteur ; coupe fortement cet exemple vertical.', config: { ratio: 16 / 9 } }
  ],
  D: [
    { id: 'D1', title: 'Avec le texte', subtitle: 'Bord gauche de la zone média', note: 'L’œil suit l’axe du titre et de la carte, comme sur la capture X.', config: { align: 'start' } },
    { id: 'D2', title: 'Centré', subtitle: 'Dans la zone média', note: 'La vignette devient un objet isolé au milieu de la carte.', config: { align: 'center' } }
  ],
  E: [
    { id: 'E1', title: 'Presque droit', subtitle: 'Rayon 8 pt', note: 'Cadre plus éditorial, plus net sur fond sombre.', config: { corner: 8 } },
    { id: 'E2', title: 'Doux', subtitle: 'Rayon 16 pt', note: 'Proche des cartes média Take et de l’impression laissée par X.', config: { corner: 16 } },
    { id: 'E3', title: 'Très arrondi', subtitle: 'Rayon 28 pt', note: 'Silhouette plus joueuse, un peu plus visible dans le fil.', config: { corner: 28 } }
  ],
  F: [
    { id: 'F1', title: 'Le minimum', subtitle: 'Durée + son', note: 'On sait combien il reste et si le son est coupé.', config: { overlay: 'minimal' } },
    { id: 'F2', title: 'Provenance claire', subtitle: 'Source + durée + son', note: 'La source est lisible sans ouvrir ; les commandes restent petites.', config: { overlay: 'balanced' } },
    { id: 'F3', title: 'Lecture explicite', subtitle: 'Play central + durée + son', note: 'L’appel à toucher prime sur l’image.', config: { overlay: 'play' } },
    { id: 'F4', title: 'Image seule', subtitle: 'Commandes après toucher', note: 'Le filigrane déjà présent dans la vidéo source reste visible.', config: { overlay: 'clean' } }
  ],
  G: [
    { id: 'G1', title: 'Automatique, muet', subtitle: 'Quand la carte entre dans l’écran', note: 'Un toucher ouvre le lecteur ; le son demande une action explicite.', config: { playback: 'autoplay' } },
    { id: 'G2', title: 'Toucher pour lire', subtitle: 'Aucune lecture dans le fil', note: 'Le plus calme, mais chaque vidéo demande une décision.', config: { playback: 'tap' } },
    { id: 'G3', title: 'Wi-Fi seulement', subtitle: 'Sinon toucher pour lire', note: 'Automatique et muet sur Wi-Fi ; manuel sur réseau cellulaire.', config: { playback: 'wifi' } },
    { id: 'G4', title: 'Aperçu de 3 s', subtitle: 'Boucle muette dans le fil', note: 'Suggère le mouvement sans lancer la vidéo entière avant le toucher.', config: { playback: 'preview' } }
  ],
  H: [
    { id: 'H1', title: 'Plein écran', subtitle: 'Vidéo d’abord', note: 'Toute la place pour regarder ; fermer revient au même take.', viewer: 'immersive' },
    { id: 'H2', title: 'Plein écran + contexte', subtitle: 'Question visible au-dessus', note: 'Le lien entre la vidéo et le vote reste présent.', viewer: 'context' },
    { id: 'H3', title: 'Feuille sur le fil', subtitle: 'Le take reste derrière', note: 'Sortie rapide vers le fil, au prix d’une image plus petite.', viewer: 'sheet' }
  ]
};

const query = new URLSearchParams(location.search);
const muteIcon = '<svg aria-hidden="true" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 6m0-6-5 6"/></svg>';
const choice = { ...startingChoice };
for (const axis of Object.keys(axes)) {
  const requested = query.get(axis);
  if (requested && axes[axis].some(item => item.id === requested)) choice[axis] = requested;
}
let theme = Object.hasOwn(scenes, query.get('fond')) ? query.get('fond') : 'clair';

function px(value) { return `${Math.round(value * 100) / 100}px`; }

function cropVars(width, height, prefix) {
  const scale = Math.max(width / 404, height / 505);
  return {
    [`--${prefix}-width`]: px(440 * scale),
    [`--${prefix}-height`]: px(956 * scale),
    [`--${prefix}-x`]: px(width / 2 - 220 * scale),
    [`--${prefix}-y`]: px(height / 2 - 497.5 * scale)
  };
}

function styleText(vars) {
  return Object.entries(vars).map(([key, value]) => `${key}:${value}`).join(';');
}

function screenVars(scene) {
  return {
    '--sw': px(scene.width),
    '--sh': px(scene.height),
    '--scale': String(244 / scene.width),
    '--screenshot': `url(${scene.file})`,
    '--scene-bg': scene.background,
    '--row-bg': scene.row,
    '--top': px(scene.top),
    '--bottom-height': px(scene.height - scene.bottom),
    '--bottom-position': px(-scene.bottom)
  };
}

function overlay(spec) {
  if (spec.overlay === 'clean') return '';
  const source = '<span class="pill source-pill">TikTok · @brutxofficiel</span>';
  const sound = `<span class="round-icon" aria-hidden="true">${muteIcon}</span>`;
  const duration = '<span class="pill">0:12</span>';
  const play = spec.overlay === 'play' || spec.playback === 'tap' ? '<span class="big-play" aria-hidden="true">▶</span>' : '';
  const mode = spec.playback === 'wifi' ? '<span class="mode-badge">Wi-Fi · lecture auto</span>' : spec.playback === 'preview' ? '<span class="mode-badge">Aperçu 3 s ↻</span>' : '';
  const progress = spec.playback === 'autoplay' || spec.playback === 'preview' ? `<span class="progress-track" style="--progress:${spec.playback === 'preview' ? '67%' : '28%'}"></span>` : '';
  const top = spec.overlay === 'balanced' ? `${duration}<span></span>` : spec.overlay === 'play' ? `<span></span>${sound}` : '<span></span>';
  const bottom = spec.overlay === 'balanced' ? `${source}${sound}` : `${duration}${spec.overlay === 'minimal' ? sound : '<span></span>'}`;
  return `<div class="media-overlay"><div class="media-top">${top}</div><div class="media-bottom">${bottom}</div>${play}${mode}${progress}</div>`;
}

function mediaPhone(scene, config = {}) {
  const spec = { ...base, ...config };
  const requestedWidth = scene.slot * spec.width;
  const height = Math.min(requestedWidth / spec.ratio, spec.maxHeight);
  const width = height * spec.ratio;
  const left = spec.align === 'center' ? (scene.width - width) / 2 : scene.inset;
  const vars = {
    ...screenVars(scene),
    '--row-height': px(height),
    '--media-left': px(left),
    '--media-width': px(width),
    '--media-height': px(height),
    '--corner': px(spec.corner),
    ...cropVars(width, height, 'image')
  };
  return `<div class="device" aria-hidden="true"><div class="screen" style="${styleText(vars)}"><div class="slice-top"></div><div class="media-row"><div class="media ${spec.overlay === 'clean' ? 'overlay-clean' : ''}">${overlay(spec)}</div></div><div class="slice-bottom"></div></div></div>`;
}

function viewerPhone(scene, mode) {
  const maxWidth = mode === 'immersive' ? scene.width : mode === 'context' ? scene.width - 50 : scene.width - 100;
  const maxHeight = mode === 'immersive' ? scene.height - 160 : mode === 'context' ? scene.height - 265 : scene.height - 310;
  const width = Math.min(maxWidth, maxHeight * 9 / 16);
  const height = width * 16 / 9;
  const top = mode === 'immersive' ? 91 : mode === 'context' ? 145 : 228;
  const vars = {
    ...screenVars(scene),
    '--viewer-left': px((scene.width - width) / 2),
    '--viewer-top': px(top),
    '--viewer-width': px(width),
    '--viewer-height': px(height),
    '--viewer-radius': mode === 'immersive' ? '0px' : '16px',
    ...cropVars(width, height, 'viewer-image')
  };
  const under = mode === 'sheet' ? 'feed-under sheet-mode' : '';
  const context = mode === 'context' ? '<div class="viewer-context">Est-ce qu’il l’a poussé du balcon ?<small>Take · 4 j</small></div>' : '';
  const sheet = mode === 'sheet' ? '<div class="viewer-sheet"></div>' : '';
  return `<div class="device" aria-hidden="true"><div class="screen" style="${styleText(vars)}"><div class="viewer ${under}"><div class="viewer-status"><span>15:32</span><span>●●● ▰</span></div>${sheet}<div class="viewer-top"><span class="viewer-close">×</span><span class="viewer-sound">${muteIcon}</span></div>${context}<div class="viewer-video"></div><div class="viewer-meta"><b>Est-ce qu’il l’a poussé du balcon ?</b><span>0:12 · TikTok</span></div><div class="viewer-bottom"><i></i></div></div></div></div>`;
}

function renderChoice(axis, item) {
  const selected = choice[axis] === item.id;
  const scene = scenes[theme];
  const visual = item.viewer ? viewerPhone(scene, item.viewer) : mediaPhone(scene, item.config);
  return `<button type="button" class="choice ${selected ? 'is-selected' : ''}" data-choice="${item.id}" aria-pressed="${selected}"><span class="choice-head"><span class="choice-id">${item.id}</span>${selected ? '<span class="choice-tag">Choisi</span>' : ''}</span><h3>${item.title}</h3><span class="choice-subtitle">${item.subtitle}</span>${visual}<span class="choice-note">${item.note}</span></button>`;
}

function chosenConfig() {
  const keys = { A: 'width', B: 'maxHeight', C: 'ratio', D: 'align', E: 'corner', F: 'overlay', G: 'playback' };
  const config = { ...base };
  for (const [axis, key] of Object.entries(keys)) {
    const selected = axes[axis].find(item => item.id === choice[axis]);
    config[key] = selected.config[key];
  }
  return config;
}

function render() {
  const previousScroll = Object.fromEntries([...document.querySelectorAll('.choice-grid')].map(grid => [grid.dataset.axis, grid.scrollLeft]));
  for (const [axis, items] of Object.entries(axes)) {
    document.querySelector(`[data-axis="${axis}"]`).innerHTML = items.map(item => renderChoice(axis, item)).join('');
  }
  for (const grid of document.querySelectorAll('.choice-grid')) grid.scrollLeft = previousScroll[grid.dataset.axis] || 0;
  const config = chosenConfig();
  document.querySelector('#three-scenes').innerHTML = Object.entries(scenes).map(([key, scene]) => `<div class="scene-example"><h3>${scene.label}</h3>${mediaPhone(scene, config)}<p>${key === 'anonyme' ? 'Vraie capture du take anonyme d’Adam.' : 'Vraie capture du fil Take, seule la zone média est remplacée.'}</p></div>`).join('');
  document.querySelector('#preview-description').textContent = `Aperçu combiné : ${choice.A} + ${choice.B} + ${choice.C} + ${choice.D} + ${choice.E} + ${choice.F} + ${choice.G}. Le lecteur agrandi ${choice.H} se choisit plus bas.`;
  document.querySelector('#selection-text').textContent = Object.values(choice).join(' + ');
  document.querySelectorAll('.theme-button').forEach(button => {
    const active = button.dataset.theme === theme;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
}

function updateAddress() {
  const params = new URLSearchParams();
  for (const [axis, value] of Object.entries(choice)) params.set(axis, value);
  params.set('fond', theme);
  history.replaceState(null, '', `${location.pathname}?${params}${location.hash}`);
}

document.addEventListener('click', async event => {
  const option = event.target.closest('[data-choice]');
  if (option) {
    choice[option.dataset.choice[0]] = option.dataset.choice;
    render();
    updateAddress();
    return;
  }
  const themeButton = event.target.closest('[data-theme]');
  if (themeButton) {
    theme = themeButton.dataset.theme;
    render();
    updateAddress();
    return;
  }
  if (event.target.closest('#copy-choice')) {
    const button = document.querySelector('#copy-choice');
    try {
      await navigator.clipboard.writeText(Object.values(choice).join(' + '));
      button.textContent = 'Copié';
    } catch {
      button.textContent = 'Sélectionne le texte';
    }
    setTimeout(() => { button.textContent = 'Copier'; }, 2400);
  }
});

render();
