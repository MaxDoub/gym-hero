/* Gym Hero — Corps humain interactif
   Rendu en trois couches superposées :
     1. les zones musculaires colorées (SVG), découpées par la silhouette
        grâce à un masque tiré de la planche elle-même ;
     2. la planche anatomique (PNG à fond transparent), inversée et fusionnée
        en « screen » : ses traits noirs deviennent blancs sur le thème sombre ;
   Chaque zone porte data-m="<muscleId>" et se colore selon une heatmap
   { muscleId: 0→1 }. Les zones latérales sont définies une fois (moitié
   gauche, axe x=360) puis reflétées : les deux côtés restent cliquables. */

const BODY_W = 720, BODY_H = 1080;
const BODY_VIEWBOX = `0 0 ${BODY_W} ${BODY_H}`;
const BODY_IMG = { front: 'assets/body-front.png', back: 'assets/body-back.png' };

/* Zones — moitié gauche. e:[cx,cy,rx,ry] pour une ellipse, d:'…' pour un tracé. */
const ZONES_FRONT_HALF = [
  { m:'traps',       d:'M336,176C312,184 278,200 252,228C288,216 316,209 338,207Z' },
  { m:'side_delts',  d:'M232,214C208,226 190,250 188,280C188,302 196,318 210,322C216,300 218,268 224,242C228,226 230,218 232,214Z' },
  { m:'front_delts', d:'M262,214C232,222 202,246 196,278C194,304 208,322 230,324C252,322 266,300 270,272C272,246 268,226 262,214Z' },
  { m:'chest',       d:'M352,202C322,204 288,214 266,236C252,254 250,282 262,298C292,310 332,306 352,300Z' },
  { m:'biceps',      e:[185, 348, 30, 58] },
  { m:'forearms',    e:[148, 472, 30, 68] },
  { m:'obliques',    e:[256, 428, 22, 60] },
  { m:'abductors',   e:[268, 524, 30, 38] },
  { m:'quads',       e:[292, 672, 56, 112] },
  { m:'adductors',   e:[330, 618, 24, 68] },
  { m:'calves',      e:[284, 888, 30, 72] }
];
const ZONES_FRONT_CENTER = [
  { m:'neck', e:[360, 185, 36, 26] },
  /* Le cœur : n'apparaît que si la séance contient du cardio. */
  { m:'cardio', d:'M372,300C346,280 338,256 350,242C360,231 371,236 377,247C383,236 394,232 404,243C416,257 408,280 382,300Z' },
  { m:'abs',  r:[[278,322,76,37,10],[366,322,76,37,10],
                 [278,365,76,37,10],[366,365,76,37,10],
                 [278,408,76,37,10],[366,408,76,37,10],
                 [280,451,74,38,10],[366,451,74,38,10]] }
];

/* Au dos, le dorsal est tracé avant le trapèze, comme en anatomie. */
const ZONES_BACK_HALF = [
  { m:'lats',        d:'M356,312C320,302 280,316 262,346C255,386 268,426 290,456C320,479 348,487 356,489Z' },
  { m:'mid_back',    e:[322, 290, 34, 40] },
  { m:'traps',       d:'M356,148C320,158 280,184 252,220C292,226 322,256 340,302C351,332 356,352 356,360Z' },
  { m:'side_delts',  e:[198, 250, 30, 40] },
  { m:'rear_delts',  e:[222, 256, 44, 52] },
  { m:'lower_back',  e:[338, 448, 25, 44] },
  { m:'triceps',     e:[188, 346, 32, 60] },
  { m:'forearms',    e:[148, 478, 30, 68] },
  { m:'glutes',      e:[310, 552, 48, 56] },
  { m:'abductors',   e:[264, 500, 28, 36] },
  { m:'hamstrings',  e:[300, 695, 52, 92] },
  { m:'adductors',   e:[338, 620, 24, 60] },
  { m:'calves',      e:[300, 862, 30, 88] }
];
const ZONES_BACK_CENTER = [
  { m:'neck', e:[360, 160, 30, 26] }
];

/* Échelle de chaleur, dérivée des couleurs du logo. */
const HEAT_STOPS = [
  [0.00, '#28334F'],  // au repos
  [0.18, '#2B6BFF'],
  [0.42, '#22D3EE'],
  [0.62, '#FFC531'],
  [0.82, '#FF7A18'],
  [1.00, '#FF2D8A']   // très sollicité
];
const BODY_REST = '#28334F';

function hexToRgb(h) {
  return [parseInt(h.slice(1,3),16), parseInt(h.slice(3,5),16), parseInt(h.slice(5,7),16)];
}
function heatColor(v) {
  const x = Math.max(0, Math.min(1, v || 0));
  for (let i = 1; i < HEAT_STOPS.length; i++) {
    if (x <= HEAT_STOPS[i][0]) {
      const [p0, c0] = HEAT_STOPS[i-1], [p1, c1] = HEAT_STOPS[i];
      const t = (x - p0) / (p1 - p0 || 1);
      const a = hexToRgb(c0), b = hexToRgb(c1);
      return `rgb(${Math.round(a[0]+(b[0]-a[0])*t)},${Math.round(a[1]+(b[1]-a[1])*t)},${Math.round(a[2]+(b[2]-a[2])*t)})`;
    }
  }
  return HEAT_STOPS[HEAT_STOPS.length-1][1];
}

const SVGNS = 'http://www.w3.org/2000/svg';
function svgEl(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

/** Une zone = un groupe de formes partageant un muscle. */
function zoneShape(def) {
  const g = svgEl('g', { 'data-m': def.m, class: 'muscle' });
  if (def.d) g.appendChild(svgEl('path', { d: def.d }));
  if (def.e) { const [cx, cy, rx, ry] = def.e; g.appendChild(svgEl('ellipse', { cx, cy, rx, ry })); }
  if (def.r) def.r.forEach(([x, y, w, h, rx]) => g.appendChild(svgEl('rect', { x, y, width: w, height: h, rx })));
  const t = svgEl('title', {});
  t.textContent = muscleName(def.m);
  g.appendChild(t);
  return g;
}

/**
 * Construit une figure complète.
 * @param {'front'|'back'} view
 * @param {Object} heat  { muscleId: 0..1 }
 * @param {Object} opts  { interactive, onPick }
 * @returns {HTMLElement}
 */
function buildBody(view, heat, opts = {}) {
  const front = view !== 'back';
  const halves  = front ? ZONES_FRONT_HALF   : ZONES_BACK_HALF;
  const centers = front ? ZONES_FRONT_CENTER : ZONES_BACK_CENTER;
  const src = front ? BODY_IMG.front : BODY_IMG.back;

  const fig = document.createElement('div');
  fig.className = 'body-fig';

  // Couche 1 : peinture des muscles, découpée par la silhouette de la planche
  const paint = document.createElement('div');
  paint.className = 'body-paint';
  paint.style.webkitMaskImage = `url(${src})`;
  paint.style.maskImage = `url(${src})`;

  const svg = svgEl('svg', { viewBox: BODY_VIEWBOX, preserveAspectRatio: 'xMidYMid meet',
    'aria-label': front ? 'Vue de face' : 'Vue de dos' });
  svg.appendChild(svgEl('rect', { x: 0, y: 0, width: BODY_W, height: BODY_H, fill: BODY_REST }));

  const gm = svgEl('g', { class: 'muscles' });
  const half = svgEl('g', {});
  halves.forEach(def => half.appendChild(zoneShape(def)));
  gm.appendChild(half);
  const mirror = half.cloneNode(true);
  mirror.setAttribute('transform', `translate(${BODY_W},0) scale(-1,1)`);
  gm.appendChild(mirror);
  centers.forEach(def => gm.appendChild(zoneShape(def)));
  svg.appendChild(gm);
  paint.appendChild(svg);
  fig.appendChild(paint);

  // Couche 2 : la planche anatomique, inversée pour ressortir sur fond sombre
  const img = document.createElement('img');
  img.className = 'body-lines';
  img.src = src;
  img.alt = front ? 'Vue de face' : 'Vue de dos';
  img.decoding = 'async';
  fig.appendChild(img);

  paintBody(fig, heat || {});

  if (opts.picker) fig.classList.add('is-picker');
  if (opts.interactive) {
    fig.classList.add('is-interactive');
    fig.addEventListener('click', e => {
      const t = e.target.closest('[data-m]');
      if (t && opts.onPick) opts.onPick(t.getAttribute('data-m'));
    });
  }
  return fig;
}

/** Applique/rafraîchit la heatmap sur une figure déjà construite. */
function paintBody(fig, heat) {
  fig.querySelectorAll('.muscle').forEach(el => {
    const m = el.getAttribute('data-m');
    const v = heat[m] || 0;
    el.style.fill = heatColor(v);
    // Le cœur ne s'affiche que s'il y a eu du cardio (ou en mode édition).
    el.style.fillOpacity = (m === 'cardio' && !v) ? '' : '1';
    el.classList.toggle('is-active', v > 0);
  });
}

/** Une seule vue à la fois, avec bascule Face / Dos. */
function renderBodyView(container, heat, opts = {}) {
  const state = { view: opts.view || 'front' };
  container.innerHTML = '';
  container.classList.add('body-view');

  const tabs = document.createElement('div');
  tabs.className = 'body-tabs';
  tabs.innerHTML = '<button data-v="front">Face</button><button data-v="back">Dos</button>';

  const stage = document.createElement('div');
  stage.className = 'body-stage';

  const draw = () => {
    stage.innerHTML = '';
    stage.appendChild(buildBody(state.view, heat, opts));
    [...tabs.children].forEach(b => b.classList.toggle('on', b.dataset.v === state.view));
  };
  [...tabs.children].forEach(b => b.onclick = () => { state.view = b.dataset.v; draw(); });

  container.appendChild(tabs);
  container.appendChild(stage);
  draw();
  return {
    /** Change les couleurs sans reconstruire la figure (édition fluide). */
    repaint: h => { heat = h; const fig = stage.firstChild; if (fig) paintBody(fig, h); },
    redraw:  h => { heat = h; draw(); },
    view:    () => state.view
  };
}

/* ---------------- Choix des muscles d'un exercice ----------------
   Toucher une zone la fait passer de « rien » à « principal », puis
   « secondaire », puis de nouveau « rien ».                        */
const PICK_PRIMARY = 1, PICK_SECONDARY = 0.45;

function musclePickerHeat(sel) {
  const h = {};
  sel.secondary.forEach(m => { h[m] = PICK_SECONDARY; });
  sel.primary.forEach(m => { h[m] = PICK_PRIMARY; });
  return h;
}

/**
 * Corps éditable : renvoie un contrôleur { selection }.
 * @param {HTMLElement} container
 * @param {Object} sel  { primary:[], secondary:[] } — modifié en place
 * @param {Function} onChange  appelé après chaque touche
 */
function renderMusclePicker(container, sel, onChange) {
  const cycle = m => {
    const iP = sel.primary.indexOf(m), iS = sel.secondary.indexOf(m);
    if (iP >= 0) { sel.primary.splice(iP, 1); sel.secondary.push(m); }
    else if (iS >= 0) { sel.secondary.splice(iS, 1); }
    else { sel.primary.push(m); }
  };
  const ctrl = renderBodyView(container, musclePickerHeat(sel), {
    uid: 'pick', interactive: true, picker: true,
    onPick: m => {
      cycle(m);
      ctrl.repaint(musclePickerHeat(sel));
      if (onChange) onChange(sel);
    }
  });
  return ctrl;
}

/** Heatmap à partir d'une liste d'exercices (aperçu d'un programme). */
function heatFromExercises(exs) {
  const heat = {};
  exs.forEach(ex => {
    const w = exerciseMuscleWeights(ex);
    for (const m in w) heat[m] = Math.min(1, (heat[m] || 0) + w[m] * 0.55);
  });
  return heat;
}
