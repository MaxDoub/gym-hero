/* Gym Hero — Corps humain interactif (SVG vectoriel, face + dos)
   Chaque muscle est un tracé anatomique portant data-m="<muscleId>", coloré
   selon une heatmap { muscleId: 0→1 }. Les muscles latéraux sont dessinés une
   seule fois (moitié gauche, axe x=120) puis clonés en miroir : les deux côtés
   restent cliquables. Tout est découpé par la silhouette, rien ne déborde.   */

const BODY_W = 240;
const BODY_VIEWBOX = '0 0 240 520';
const BODY_OUTLINE = 'M120,10C134,10 141,24 141,44C141,62 134,73 128,79L132,86C140,90 154,96 168,106C182,114 192,128 192,150C193,170 193,190 191,210C190,224 192,236 194,248C197,266 201,290 199,306C203,320 209,338 205,350C201,358 195,348 193,338C190,346 185,342 185,332L182,314C178,294 174,272 172,256C170,234 166,192 164,168C165,175 166,186 166,198C164,214 161,231 158,247C161,256 167,262 169,271C173,296 175,332 172,366C170,382 169,392 167,402C166,420 166,440 162,462C159,478 156,488 155,497C159,505 165,517 155,518L133,518C129,514 130,504 131,497C131,478 132,458 132,438C132,418 131,401 130,385C129,351 128,309 126,277L120,265L114,277C112,309 111,351 110,385C109,401 108,418 108,438C108,458 109,478 109,497C110,504 111,514 107,518L85,518C75,517 81,505 85,497C84,488 81,478 78,462C74,440 74,420 73,402C71,392 70,382 68,366C65,332 67,296 71,271C73,262 79,256 82,247C79,231 76,214 74,198C74,186 75,175 76,168C74,192 70,234 68,256C66,272 62,294 58,314L55,332C55,342 50,346 47,338C45,348 39,358 35,350C31,338 37,320 41,306C39,290 43,266 46,248C48,236 50,224 49,210C47,190 47,170 48,150C48,128 58,114 72,106C86,96 100,90 108,86L112,79C106,73 99,62 99,44C99,24 106,10 120,10Z';

/* ---------------- Muscles, vue de face ---------------- */
const MUSCLES_FRONT_HALF = [
  { m:'traps',       d:'M111,84C101,88 86,94 70,108C85,102 99,98 111,98Z' },
  { m:'neck',        d:'M112,79C108,87 105,95 103,101C108,104 114,99 117,89Z' },
  { m:'side_delts',  d:'M58,116C50,124 46,138 47,154C52,162 58,160 61,152C62,138 61,124 58,116Z' },
  { m:'front_delts', d:'M72,108C58,116 50,130 50,152C52,166 60,175 69,177C78,177 84,166 85,150C84,132 82,116 72,108Z' },
  { m:'chest',       d:'M118,108C106,107 92,114 84,127C79,140 80,158 87,170C99,178 111,175 117,167C118,152 119,128 118,108Z' },
  { m:'biceps',      d:'M60,188C54,202 52,220 54,238C58,248 66,250 72,242C76,226 76,204 72,190C68,184 62,183 60,188Z' },
  { m:'forearms',    d:'M54,256C48,276 44,296 44,312C46,324 54,326 60,318C64,300 66,278 66,260C62,252 56,250 54,256Z' },
  { m:'obliques',    d:'M88,202C82,218 80,240 82,258C88,268 96,266 100,256C102,234 102,214 100,200C96,194 90,194 88,202Z' },
  { m:'abductors',   d:'M77,256C71,264 69,277 73,288C81,292 90,286 92,275C92,265 85,254 77,256Z' },
  { m:'quads',       d:['M72,276C66,302 66,336 70,368C77,382 86,380 90,366C92,332 90,300 86,276Z',
                        'M90,278C86,304 86,338 90,370C96,380 103,376 105,362C107,330 105,302 103,276Z',
                        'M107,296C105,320 105,348 109,370C115,380 118,374 118,360C118,336 116,312 113,294Z'] },
  { m:'adductors',   d:'M110,266C114,284 117,308 115,330C111,340 106,338 105,326C105,302 107,282 107,266Z' },
  { m:'calves',      d:'M80,412C76,434 77,462 82,482C89,490 96,484 96,470C96,446 91,422 88,410Z' }
];
/* Abdominaux : huit blocs distincts, centrés sur l'axe. */
const MUSCLES_FRONT_CENTER = [
  { m:'abs', r:[[104,178,14,21,4],[122,178,14,21,4],
                [104,202,14,21,4],[122,202,14,21,4],
                [104,226,14,21,4],[122,226,14,21,4],
                [105,250,13,22,4],[122,250,13,22,4]] }
];

/* ---------------- Muscles, vue de dos ---------------- */
const MUSCLES_BACK_HALF = [
  /* Ordre = ordre de tracé : le dorsal passe sous le trapèze, comme en anatomie. */
  { m:'lats',        d:'M118,172C104,160 86,158 76,172C72,197 80,227 94,247C106,259 116,263 119,265C119,231 119,197 118,172Z' },
  { m:'mid_back',    d:'M114,150C105,147 98,152 96,163C98,176 103,188 111,195C115,185 115,162 114,150Z' },
  { m:'traps',       d:'M118,80C102,84 84,96 70,108C86,113 99,128 106,148C112,165 116,180 118,196Z' },
  { m:'side_delts',  d:'M58,118C50,126 46,140 47,156C52,164 58,162 61,154C62,140 61,126 58,118Z' },
  { m:'rear_delts',  d:'M72,110C58,118 50,132 50,154C52,168 60,177 69,179C78,179 84,168 85,152C84,134 82,118 72,110Z' },
  { m:'lower_back',  d:'M115,212C111,230 109,252 111,270C115,278 120,276 120,266L120,210Z' },
  { m:'triceps',     d:'M58,188C52,202 50,222 52,240C56,250 64,252 70,244C74,226 74,204 70,190C66,184 60,183 58,188Z' },
  { m:'forearms',    d:'M54,256C48,276 44,296 44,312C46,324 54,326 60,318C64,300 66,278 66,260C62,252 56,250 54,256Z' },
  { m:'glutes',      d:'M119,266C104,264 88,274 81,290C79,308 85,324 98,332C109,338 119,334 119,324Z' },
  { m:'abductors',   d:'M77,274C71,282 68,295 72,305C80,310 89,304 91,293C91,283 85,272 77,274Z' },
  { m:'hamstrings',  d:['M78,338C72,360 72,388 77,408C84,418 92,414 94,402C96,376 94,352 89,336Z',
                        'M96,334C94,358 94,386 99,408C106,418 113,414 113,402C115,376 111,352 108,332Z'] },
  { m:'adductors',   d:'M111,336C115,352 117,372 115,388C111,396 107,392 107,382C107,362 109,346 109,334Z'},
  { m:'calves',      d:['M79,416C74,436 74,462 79,480C86,488 92,482 92,470C92,450 89,430 86,414Z',
                        'M95,414C93,438 93,464 98,480C105,488 111,482 111,470C111,448 106,426 103,412Z'] }
];
const MUSCLES_BACK_CENTER = [
  { m:'neck', d:'M109,78C106,88 105,98 107,106C113,110 127,110 133,106C135,98 134,88 131,78Z' }
];

/* ---------------- Traits de détail (non colorés) ---------------- */
const DETAIL_FRONT_HALF = [
  'M110,98C99,101 87,106 77,114',                 // clavicule
  'M84,172l9,5', 'M82,184l10,5', 'M82,196l10,5',    // dentelé antérieur
  'M64,152C68,162 70,171 70,180',                   // strie du deltoïde
  'M77,392C87,398 98,398 107,392',                 // rotule
  'M90,278C88,306 88,338 90,368',                   // séparation des quadriceps
  'M88,132C98,138 108,144 117,151',                // fibres du pectoral
  'M87,148C97,152 106,158 115,164',
  'M57,134C61,145 63,156 63,168',                   // faisceaux du deltoïde
  'M63,192C65,208 65,224 63,238',                   // chefs du biceps
  'M55,264C57,281 57,296 55,310',                   // avant-bras
  'M88,424C90,444 90,462 88,476',                   // jambier antérieur
  'M99,364C101,373 102,381 102,389'                 // tendon rotulien
];
const DETAIL_FRONT_CENTER = ['M120,108L120,172', 'M120,178L120,272',
  'M101,40C107,27 133,27 139,40', 'M105,60C111,71 129,71 135,60'];

const DETAIL_BACK_HALF = [
  'M112,154C102,156 96,162 94,170',                 // bord de l'omoplate
  'M64,152C68,162 70,171 70,180',
  'M77,392C87,397 98,397 107,392',                 // creux poplité
  'M81,294C94,301 107,306 119,308',                 // pli fessier
  'M110,98C112,114 114,131 116,149',                // fibres du trapèze
  'M95,108C103,120 109,133 113,147',
  'M84,180C95,195 106,210 117,223',                 // fibres du grand dorsal
  'M82,202C93,214 104,225 117,237',
  'M61,192C63,208 63,224 61,238',                   // chefs du triceps
  'M99,280C103,294 105,308 103,322',               // grand fessier
  'M95,340C97,364 97,388 95,407',                 // ischio-jambiers
  'M94,418C96,440 96,462 94,478'                    // jumeaux
];
const DETAIL_BACK_CENTER = ['M120,86L120,306', 'M101,42C107,29 133,29 139,42'];

/* ---------------- Échelle de chaleur (couleurs du logo) ---------------- */
const HEAT_STOPS = [
  [0.00, '#26314F'],
  [0.18, '#2B6BFF'],
  [0.42, '#22D3EE'],
  [0.62, '#FFC531'],
  [0.82, '#FF7A18'],
  [1.00, '#FF2D8A']
];

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

/** Un muscle = un ou plusieurs tracés (faisceaux) réunis dans un groupe. */
function muscleShape(def) {
  const g = svgEl('g', { 'data-m': def.m, class: 'muscle' });
  const shapes = [];
  if (def.d) (Array.isArray(def.d) ? def.d : [def.d]).forEach(d => shapes.push(svgEl('path', { d })));
  if (def.r) def.r.forEach(([x, y, w, h, rx]) => shapes.push(svgEl('rect', { x, y, width: w, height: h, rx })));
  shapes.forEach(s => g.appendChild(s));
  const t = svgEl('title', {});
  t.textContent = muscleName(def.m);
  g.appendChild(t);
  return g;
}

function mirrored(node) {
  const clone = node.cloneNode(true);
  clone.setAttribute('transform', `translate(${BODY_W},0) scale(-1,1)`);
  return clone;
}

/**
 * Dessine un corps.
 * @param {'front'|'back'} view
 * @param {Object} heat  { muscleId: 0..1 }
 * @param {Object} opts  { uid, interactive, onPick }
 */
function buildBody(view, heat, opts = {}) {
  const uid = opts.uid || ('b' + Math.random().toString(36).slice(2, 8));
  const front = view !== 'back';
  const halves      = front ? MUSCLES_FRONT_HALF   : MUSCLES_BACK_HALF;
  const centers     = front ? MUSCLES_FRONT_CENTER : MUSCLES_BACK_CENTER;
  const detailHalf  = front ? DETAIL_FRONT_HALF    : DETAIL_BACK_HALF;
  const detailMid   = front ? DETAIL_FRONT_CENTER  : DETAIL_BACK_CENTER;

  const svg = svgEl('svg', { viewBox: BODY_VIEWBOX, class: 'body-svg',
    'aria-label': front ? 'Vue de face' : 'Vue de dos' });

  const defs = svgEl('defs', {});
  const clip = svgEl('clipPath', { id: uid + '-clip' });
  clip.appendChild(svgEl('path', { d: BODY_OUTLINE }));
  defs.appendChild(clip);
  svg.appendChild(defs);

  svg.appendChild(svgEl('path', { d: BODY_OUTLINE, class: 'body-fill' }));

  const gm = svgEl('g', { 'clip-path': `url(#${uid}-clip)`, class: 'muscles' });
  const half = svgEl('g', {});
  halves.forEach(def => half.appendChild(muscleShape(def)));
  gm.appendChild(half);
  gm.appendChild(mirrored(half));
  centers.forEach(def => gm.appendChild(muscleShape(def)));
  svg.appendChild(gm);

  const gd = svgEl('g', { class: 'body-detail', 'clip-path': `url(#${uid}-clip)` });
  const dHalf = svgEl('g', {});
  detailHalf.forEach(d => dHalf.appendChild(svgEl('path', { d })));
  gd.appendChild(dHalf);
  gd.appendChild(mirrored(dHalf));
  detailMid.forEach(d => gd.appendChild(svgEl('path', { d })));
  svg.appendChild(gd);

  // Galbe : ombre sur les flancs, simulant un éclairage frontal
  const shade = svgEl('linearGradient', { id: uid + '-shade', x1: '0', y1: '0', x2: '1', y2: '0' });
  [['0','.5'],['0.30','0'],['0.70','0'],['1','.5']].forEach(([o, op]) => {
    shade.appendChild(svgEl('stop', { offset: o, 'stop-color': '#000', 'stop-opacity': op }));
  });
  defs.appendChild(shade);
  const vol = svgEl('path', { d: BODY_OUTLINE, fill: `url(#${uid}-shade)`, class: 'body-volume' });
  svg.appendChild(vol);

  svg.appendChild(svgEl('path', { d: BODY_OUTLINE, class: 'body-stroke' }));

  paintBody(svg, heat || {});

  if (opts.interactive) {
    svg.classList.add('is-interactive');
    svg.addEventListener('click', e => {
      const t = e.target.closest('[data-m]');
      if (t && opts.onPick) opts.onPick(t.getAttribute('data-m'));
    });
  }
  return svg;
}

/** Applique/rafraîchit la heatmap sur un SVG déjà construit. */
function paintBody(svg, heat) {
  svg.querySelectorAll('.muscle').forEach(el => {
    const v = heat[el.getAttribute('data-m')] || 0;
    el.style.fill = heatColor(v);
    el.classList.toggle('is-active', v > 0);
  });
}

/** Une seule vue à la fois, avec bascule Face / Dos : le corps occupe
    toute la largeur, donc beaucoup plus de détail lisible. */
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
    stage.appendChild(buildBody(state.view, heat, { ...opts, uid: (opts.uid || 'b') + '-' + state.view }));
    [...tabs.children].forEach(b => b.classList.toggle('on', b.dataset.v === state.view));
  };
  [...tabs.children].forEach(b => b.onclick = () => { state.view = b.dataset.v; draw(); });

  container.appendChild(tabs);
  container.appendChild(stage);
  draw();
  return { redraw: (h) => { heat = h; draw(); } };
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
