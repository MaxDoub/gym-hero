/* Gym Hero — Corps humain interactif (SVG vectoriel, face + dos)
   Chaque muscle est un tracé anatomique portant data-m="<muscleId>", coloré
   selon une heatmap { muscleId: 0→1 }. Les muscles latéraux sont dessinés une
   seule fois (moitié gauche, axe x=120) puis clonés en miroir : les deux côtés
   restent cliquables. Tout est découpé par la silhouette, rien ne déborde.   */

const BODY_W = 240;
const BODY_VIEWBOX = '0 0 240 520';
const BODY_OUTLINE = 'M120,10C136,10 144,24 144,44C144,62 136,74 128,80L130,92C138,96 152,102 166,112C182,120 192,134 192,152C193,175 194,196 192,215C191,228 193,240 195,252C198,272 202,296 200,312C204,326 210,344 206,356C202,364 196,354 194,344C191,352 186,348 186,338L183,320C179,300 175,278 173,262C171,230 167,190 166,168C163,162 156,175 153,192C150,210 148,226 146,242C150,252 155,258 156,266C160,290 162,330 160,366C159,382 158,392 157,402C155,420 151,442 149,462C147,478 146,486 147,496C151,504 157,516 147,518L129,518C125,514 127,504 129,496C129,478 130,460 129,444C128,420 126,402 125,386C124,352 123,310 122,278L120,266L118,278C117,310 116,352 115,386C114,402 112,420 111,444C110,460 111,478 111,496C113,504 115,514 111,518L93,518C83,516 89,504 93,496C94,486 93,478 91,462C89,442 85,420 83,402C82,392 81,382 80,366C78,330 80,290 84,266C85,258 90,252 94,242C92,226 90,210 87,192C84,175 77,162 74,168C73,190 69,230 67,262C65,278 61,300 57,320L54,338C54,348 49,352 46,344C44,354 38,364 34,356C30,344 36,326 40,312C38,296 42,272 45,252C47,240 49,228 48,215C46,196 47,175 48,152C48,134 58,120 74,112C88,102 102,96 110,92L112,80C104,74 96,62 96,44C96,24 104,10 120,10Z';

/* ---------------- Muscles, vue de face ---------------- */
const MUSCLES_FRONT_HALF = [
  { m:'traps',       d:'M112,88C102,92 88,98 72,114C86,108 100,104 112,104Z' },
  { m:'neck',        d:'M114,80C110,88 106,96 104,102C109,105 115,100 118,90Z' },
  { m:'side_delts',  d:'M58,120C50,128 46,142 47,158C52,166 58,164 61,156C62,142 61,128 58,120Z' },
  { m:'front_delts', d:'M74,112C60,120 50,134 50,154C52,168 60,177 69,179C78,179 84,168 85,152C84,134 82,120 74,112Z' },
  { m:'chest',       d:'M118,107C107,107 95,114 88,126C83,138 84,154 90,166C100,174 111,171 117,164C118,150 119,126 118,107Z' },
  { m:'biceps',      d:'M58,186C52,200 50,218 52,236C56,246 64,248 70,240C74,224 74,202 70,188C66,182 60,181 58,186Z' },
  { m:'forearms',    d:'M52,252C46,272 42,292 42,310C44,322 52,324 58,316C62,298 64,274 64,256C60,248 54,246 52,252Z' },
  { m:'obliques',    d:'M92,198C86,214 84,236 86,256C92,266 100,264 104,254C106,232 106,212 104,196C100,190 94,190 92,198Z' },
  { m:'abductors',   d:'M84,252C78,260 76,272 80,282C88,286 96,280 98,270C98,260 92,250 84,252Z' },
  { m:'quads',       d:['M80,272C74,296 74,330 78,362C84,376 92,374 96,360C98,328 96,296 92,272Z',
                        'M96,274C92,300 92,334 96,364C102,374 108,370 110,356C112,326 110,298 108,272Z',
                        'M110,290C108,314 108,342 112,364C118,374 120,368 120,354C120,330 118,306 116,288Z'] },
  { m:'adductors',   d:'M112,262C116,278 118,300 116,322C112,332 108,330 107,318C107,296 109,276 109,262Z' },
  { m:'calves',      d:'M88,412C84,432 84,458 88,476C94,484 100,478 100,466C100,442 96,422 94,410Z' }
];
/* Abdominaux : huit blocs distincts, centrés sur l'axe. */
const MUSCLES_FRONT_CENTER = [
  { m:'abs', r:[[106,176,12,21,4],[122,176,12,21,4],
                [106,200,12,21,4],[122,200,12,21,4],
                [106,224,12,21,4],[122,224,12,21,4],
                [107,248,11,22,4],[122,248,11,22,4]] }
];

/* ---------------- Muscles, vue de dos ---------------- */
const MUSCLES_BACK_HALF = [
  { m:'traps',       d:'M118,82C102,86 86,98 72,114C88,118 100,130 107,148C112,164 116,178 118,192Z' },
  { m:'neck',        d:'M114,80C110,88 108,96 108,102C113,104 118,98 119,90Z' },
  { m:'side_delts',  d:'M58,122C50,130 46,144 47,160C52,168 58,166 61,158C62,144 61,130 58,122Z' },
  { m:'rear_delts',  d:'M72,114C58,122 50,136 50,156C52,170 60,179 70,181C81,181 89,170 90,154C89,136 82,120 72,114Z' },
  { m:'lats',        d:'M116,150C100,145 83,153 77,172C75,197 82,223 96,241C108,253 116,257 119,259C119,223 118,180 116,150Z' },
  { m:'mid_back',    d:'M113,150C105,147 98,152 96,162C98,175 103,186 111,193C114,183 114,162 113,150Z' },
  { m:'lower_back',  d:'M115,210C111,228 109,250 111,268C115,276 120,274 120,264L120,208Z' },
  { m:'triceps',     d:'M56,186C50,200 48,220 50,238C54,248 62,250 68,242C72,224 72,202 68,188C64,182 58,181 56,186Z' },
  { m:'forearms',    d:'M52,252C46,272 42,292 42,310C44,322 52,324 58,316C62,298 64,274 64,256C60,248 54,246 52,252Z' },
  { m:'glutes',      d:'M119,266C105,264 91,274 85,288C83,306 89,320 101,327C111,332 119,328 119,318Z' },
  { m:'abductors',   d:'M82,272C76,280 73,293 77,303C85,308 93,302 95,291C95,281 90,270 82,272Z' },
  { m:'hamstrings',  d:['M84,336C78,356 78,384 82,404C88,414 96,410 98,398C100,372 98,348 94,334Z',
                        'M100,332C98,354 98,382 102,404C108,414 116,410 116,398C118,372 114,348 112,330Z'] },
  { m:'adductors',   d:'M114,334C118,350 120,370 118,386C114,394 110,390 110,380C110,360 112,344 112,332Z' },
  { m:'calves',      d:['M86,418C80,436 80,460 84,476C90,484 96,478 96,466C96,446 94,428 92,416Z',
                        'M98,416C96,438 96,462 100,478C106,486 112,480 112,468C112,446 108,426 106,414Z'] }
];
const MUSCLES_BACK_CENTER = [];

/* ---------------- Traits de détail (non colorés) ---------------- */
const DETAIL_FRONT_HALF = [
  'M112,100C100,103 88,109 78,117',                 // clavicule
  'M82,168l9,5', 'M80,180l10,5', 'M80,192l10,5',    // dentelé antérieur
  'M64,152C68,162 70,171 70,180',                   // strie du deltoïde
  'M82,392C90,398 100,398 108,392',                 // rotule
  'M96,274C94,302 94,332 96,362'                    // séparation des quadriceps
];
const DETAIL_FRONT_CENTER = ['M120,104L120,166', 'M120,172L120,270',
  'M99,40C106,26 134,26 141,40', 'M104,60C110,72 130,72 136,60'];

const DETAIL_BACK_HALF = [
  'M112,154C102,156 96,162 94,170',                 // bord de l'omoplate
  'M64,152C68,162 70,171 70,180',
  'M82,392C90,397 100,397 108,392',                 // creux poplité
  'M85,288C97,295 109,301 119,303'                  // pli fessier
];
const DETAIL_BACK_CENTER = ['M120,86L120,306', 'M100,42C107,28 133,28 140,42'];

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

/** Les deux vues côte à côte. */
function renderBodyPair(container, heat, opts = {}) {
  container.innerHTML = '';
  ['front', 'back'].forEach(v => {
    const wrap = document.createElement('div');
    wrap.className = 'body-wrap';
    wrap.appendChild(buildBody(v, heat, { ...opts, uid: (opts.uid || 'p') + '-' + v }));
    const cap = document.createElement('div');
    cap.className = 'body-cap';
    cap.textContent = v === 'front' ? 'Face' : 'Dos';
    wrap.appendChild(cap);
    container.appendChild(wrap);
  });
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
