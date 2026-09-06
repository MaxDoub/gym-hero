/* Gym Hero — Corps humain interactif (SVG vectoriel, face + dos)
   Chaque zone porte data-m="<muscleId>" et se colore selon une "heatmap"
   { muscleId: intensité 0→1 }. Les muscles latéraux sont définis une fois
   (moitié gauche) puis clonés en miroir : les deux côtés restent interactifs. */

const BODY_VIEWBOX = '0 0 200 400';

/* Contour fermé du corps (généré symétriquement, sans couture centrale).
   Le même contour sert pour la vue de face et la vue de dos. */
const BODY_OUTLINE = 'M100,8C116,8 122,20 122,34C122,48 114,58 106,62L108,70C116,72 130,76 142,82C154,88 162,98 162,112C164,128 164,146 162,160C162,172 166,190 168,204C171,216 176,232 173,244C169,250 164,240 162,230C159,236 155,232 155,224L153,208C150,192 147,176 145,162C143,146 140,126 140,110C138,104 134,112 132,124C130,136 129,146 128,158C132,166 136,176 137,190C140,208 141,232 139,254C138,268 137,278 136,288C134,302 131,318 129,336C128,350 127,360 128,370C132,376 137,386 128,390L112,390C108,386 110,376 112,370C112,354 113,338 112,324C111,304 109,288 108,274C107,250 106,226 105,206L100,200L95,206C94,226 93,250 92,274C91,288 89,304 88,324C87,338 88,354 88,370C90,376 92,386 88,390L72,390C63,386 68,376 72,370C73,360 72,350 71,336C69,318 66,302 64,288C63,278 62,268 61,254C59,232 60,208 63,190C64,176 68,166 72,158C71,146 70,136 68,124C66,112 62,104 60,110C60,126 57,146 55,162C53,176 50,192 47,208L45,224C45,232 41,236 38,230C36,240 31,250 27,244C24,232 29,216 32,204C34,190 38,172 38,160C36,146 36,128 38,112C38,98 46,88 58,82C70,76 84,72 92,70L94,62C86,58 78,48 78,34C78,20 84,8 100,8Z';

/* Traits de détail (non colorés) : style planche anatomique. */
const DETAIL_FRONT = [
  'M100,128 L100,196',
  'M88,146 L112,146', 'M88,164 L112,164', 'M88,180 L112,180',
  'M100,84 L100,122',
  'M66,286 C74,292 84,292 92,286',
  'M108,286 C116,292 126,292 134,286',
  'M60,110 C68,118 72,128 74,138',
  'M140,110 C132,118 128,128 126,138'
];
const DETAIL_BACK = [
  'M100,66 L100,198',
  'M100,198 C90,206 84,216 82,228',
  'M100,198 C110,206 116,216 118,228',
  'M66,286 C74,291 84,291 92,286',
  'M108,286 C116,291 126,291 134,286',
  'M72,112 L98,138', 'M128,112 L102,138'
];

/* Muscles — moitié gauche (miroir automatique) : [cx, cy, rx, ry, rotation] */
const MUSCLES_FRONT_HALF = [
  { m:'traps',       d:'M96,66 C84,68 70,74 58,84 C72,80 86,78 96,80 Z' },
  { m:'side_delts',  e:[44, 102, 10, 15, -12] },
  { m:'front_delts', e:[52, 105, 13, 17, -18] },
  { m:'chest',       e:[78, 106, 19, 15, -8] },
  { m:'biceps',      e:[46, 140, 9, 22, -3] },
  { m:'forearms',    e:[41, 192, 8.5, 26, -4] },
  { m:'obliques',    e:[72, 158, 9, 22, -3] },
  { m:'abductors',   e:[67, 198, 10, 13, -18] },
  { m:'quads',       e:[77, 238, 17, 37, -2] },
  { m:'adductors',   e:[92, 224, 8, 25, 5] },
  { m:'calves',      e:[74, 318, 10, 27, -2] }
];
const MUSCLES_FRONT_CENTER = [
  { m:'neck',        e:[100, 71, 10, 9, 0] },
  { m:'abs',         e:[100, 158, 17, 33, 0] }
];

const MUSCLES_BACK_HALF = [
  { m:'traps',       d:'M98,64 C84,68 70,76 60,86 C76,90 90,108 98,136 Z' },
  { m:'side_delts',  e:[44, 100, 10, 14, -12] },
  { m:'rear_delts',  e:[52, 103, 13, 16, -18] },
  { m:'lats',        d:'M97,110 C82,108 70,114 66,128 C68,146 78,160 94,168 C98,152 99,130 97,110 Z' },
  { m:'mid_back',    e:[86, 122, 11, 16, 10] },
  { m:'triceps',     e:[45, 140, 9, 23, -3] },
  { m:'forearms',    e:[41, 192, 8.5, 26, -4] },
  { m:'abductors',   e:[66, 198, 10, 13, -18] },
  { m:'glutes',      e:[83, 208, 17, 19, -8] },
  { m:'hamstrings',  e:[78, 254, 16, 34, -2] },
  { m:'adductors',   e:[93, 226, 7, 22, 5] },
  { m:'calves',      e:[75, 315, 11, 28, -2] }
];
const MUSCLES_BACK_CENTER = [
  { m:'neck',        e:[100, 69, 10, 9, 0] },
  { m:'lower_back',  e:[100, 168, 13, 24, 0] }
];

/* Échelle de chaleur, dérivée des couleurs du logo. */
const HEAT_STOPS = [
  [0.00, '#232E4D'],  // au repos
  [0.18, '#2B6BFF'],
  [0.42, '#22D3EE'],
  [0.62, '#FFC531'],
  [0.82, '#FF7A18'],
  [1.00, '#FF2D8A']   // très sollicité
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

function muscleShape(def) {
  let el;
  if (def.d) {
    el = svgEl('path', { d: def.d });
  } else {
    const [cx, cy, rx, ry, rot] = def.e;
    el = svgEl('ellipse', { cx, cy, rx, ry });
    if (rot) el.setAttribute('transform', `rotate(${rot} ${cx} ${cy})`);
  }
  el.setAttribute('data-m', def.m);
  el.setAttribute('class', 'muscle');
  const t = svgEl('title', {});
  t.textContent = muscleName(def.m);
  el.appendChild(t);
  return el;
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
  const halves  = front ? MUSCLES_FRONT_HALF   : MUSCLES_BACK_HALF;
  const centers = front ? MUSCLES_FRONT_CENTER : MUSCLES_BACK_CENTER;
  const details = front ? DETAIL_FRONT : DETAIL_BACK;

  const svg = svgEl('svg', { viewBox: BODY_VIEWBOX, class: 'body-svg',
    'aria-label': front ? 'Vue de face' : 'Vue de dos' });

  const defs = svgEl('defs', {});
  const clip = svgEl('clipPath', { id: uid + '-clip' });
  clip.appendChild(svgEl('path', { d: BODY_OUTLINE }));
  defs.appendChild(clip);
  svg.appendChild(defs);

  // Corps (fond)
  svg.appendChild(svgEl('path', { d: BODY_OUTLINE, class: 'body-fill' }));

  // Muscles, découpés par la silhouette : rien ne peut déborder du corps.
  const gm = svgEl('g', { 'clip-path': `url(#${uid}-clip)`, class: 'muscles' });
  const half = svgEl('g', {});
  halves.forEach(def => half.appendChild(muscleShape(def)));
  gm.appendChild(half);
  const mirror = half.cloneNode(true);
  mirror.setAttribute('transform', 'translate(200,0) scale(-1,1)');
  gm.appendChild(mirror);
  centers.forEach(def => gm.appendChild(muscleShape(def)));
  svg.appendChild(gm);

  // Détails anatomiques
  const gd = svgEl('g', { class: 'body-detail', 'clip-path': `url(#${uid}-clip)` });
  details.forEach(d => gd.appendChild(svgEl('path', { d })));
  svg.appendChild(gd);

  // Contour par-dessus
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
    el.style.fillOpacity = v > 0 ? 0.92 : 1;
    el.classList.toggle('is-active', v > 0);
  });
}

/** Raccourci : les deux vues côte à côte. */
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
