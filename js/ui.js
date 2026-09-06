/* Gym Hero — helpers d'interface : formatage, toasts, feuilles modales */

const $  = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

/* ---------- Formatage ---------- */
const MONTHS = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const DAYS   = ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];

function fmtNum(n) { return (Math.round(n * 10) / 10).toLocaleString('fr-FR'); }
function fmtWeight(n) { return fmtNum(n) + ' ' + (DB.settings.unit || 'kg'); }
function fmtVolume(n) {
  if (n >= 1000) return fmtNum(n / 1000) + ' t';
  return Math.round(n).toLocaleString('fr-FR') + ' kg';
}
function fmtDate(iso, long) {
  const d = new Date(iso + 'T12:00');
  return long
    ? `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`
    : `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}
function relDate(iso) {
  const days = Math.round((new Date(todayISO() + 'T12:00') - new Date(iso + 'T12:00')) / 864e5);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return 'hier';
  if (days < 7)  return `il y a ${days} jours`;
  if (days < 14) return 'la semaine dernière';
  return `il y a ${Math.floor(days / 7)} semaines`;
}
function fmtDur(sec) {
  const m = Math.floor(sec / 60), s = Math.round(sec % 60);
  if (m >= 60) return `${Math.floor(m/60)} h ${String(m%60).padStart(2,'0')}`;
  if (m < 1) return `${s} s`;
  return `${m} min`;
}
function clock(sec) {
  return `${Math.floor(sec/60)}:${String(Math.max(0, Math.round(sec%60))).padStart(2,'0')}`;
}
function muscleLine(ex) {
  const p = (ex.primary || []).map(muscleName);
  const s = (ex.secondary || []).map(muscleName);
  return p.join(', ') + (s.length ? ' · ' + s.join(', ') : '');
}

/* ---------- Retour haptique / sonore ---------- */
function buzz(pattern) {
  if (DB.settings.vibrate && navigator.vibrate) navigator.vibrate(pattern || 18);
}
function beep(freq = 880, ms = 160) {
  if (!DB.settings.sound) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    const ctx = beep.ctx || (beep.ctx = new Ctx());
    if (ctx.state === 'suspended') ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + ms / 1000);
    o.connect(g); g.connect(ctx.destination);
    o.start(); o.stop(ctx.currentTime + ms / 1000 + 0.02);
  } catch (e) { /* audio indisponible */ }
}

/* ---------- Toast ---------- */
let toastTimer = null;
function toast(msg, type = '') {
  const old = $('.toast'); if (old) old.remove();
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = msg;
  document.body.appendChild(el);
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.remove(), type === 'pr' ? 3200 : 2200);
}

/* ---------- Feuille modale ---------- */
function openSheet(title, html, onMount) {
  closeSheet();
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet"><div class="handle"></div>${title ? `<h3>${esc(title)}</h3>` : ''}<div class="sheet-body">${html}</div></div>`;
  bg.addEventListener('click', e => { if (e.target === bg) closeSheet(); });
  document.body.appendChild(bg);
  if (onMount) onMount($('.sheet-body', bg));
  return bg;
}
function closeSheet() { const s = $('.sheet-bg'); if (s) s.remove(); }

function confirmSheet(title, msg, okLabel, onOk, danger) {
  openSheet(title, `
    <p class="muted" style="margin-top:0">${esc(msg)}</p>
    <div class="row" style="gap:8px;margin-top:16px">
      <button class="btn ghost block" data-x="no">Annuler</button>
      <button class="btn ${danger ? 'danger' : 'primary'} block" data-x="yes">${esc(okLabel)}</button>
    </div>`, body => {
    $('[data-x="no"]', body).onclick = closeSheet;
    $('[data-x="yes"]', body).onclick = () => { closeSheet(); onOk(); };
  });
}

/* ---------- Sélecteur d'exercice ---------- */
function pickExercise(onPick, opts = {}) {
  const regions = ['Tous', ...new Set(allExercises().map(e => e.region))];
  openSheet('Ajouter un exercice', `
    <input id="exSearch" placeholder="Rechercher (ex. leg press…)" autocomplete="off">
    <div class="row wrap" style="gap:6px;margin:12px 0" id="exFilters">
      ${regions.map((r, i) => `<button class="chip ${i === 0 ? 'on' : ''}" data-r="${esc(r)}">${esc(r)}</button>`).join('')}
    </div>
    <div id="exList"></div>
    <button class="btn ghost block" id="exCustom" style="margin-top:10px">➕ Créer un exercice perso</button>
  `, body => {
    let region = 'Tous', q = '';
    const list = $('#exList', body);
    const draw = () => {
      const items = allExercises().filter(e =>
        (region === 'Tous' || e.region === region) &&
        (!q || e.name.toLowerCase().includes(q) || (e.eq || '').toLowerCase().includes(q)));
      list.innerHTML = items.length ? `<div class="card flush">${items.map(e => `
        <div class="list-item" data-id="${e.id}">
          <div class="emoji">${e.type === 'cardio' ? '🏃' : '🏋️'}</div>
          <div class="grow"><b>${esc(e.name)}</b><span>${esc(e.eq)} · ${esc(muscleLine(e))}</span></div>
          <span class="chev">＋</span>
        </div>`).join('')}</div>`
        : `<div class="empty">Aucun exercice trouvé.</div>`;
      $$('.list-item', list).forEach(el => el.onclick = () => {
        closeSheet();
        onPick(el.dataset.id);
      });
    };
    $('#exSearch', body).oninput = e => { q = e.target.value.toLowerCase().trim(); draw(); };
    $$('#exFilters .chip', body).forEach(c => c.onclick = () => {
      $$('#exFilters .chip', body).forEach(x => x.classList.remove('on'));
      c.classList.add('on'); region = c.dataset.r; draw();
    });
    $('#exCustom', body).onclick = () => customExerciseSheet(onPick);
    draw();
  });
}

/* ---------- Création d'exercice perso ---------- */
function customExerciseSheet(onDone) {
  openSheet('Nouvel exercice', `
    <div class="field"><label>Nom</label><input id="cxName" placeholder="Ex. Tirage prise neutre"></div>
    <div class="field"><label>Matériel</label><input id="cxEq" placeholder="Machine, Barre, Haltères…"></div>
    <div class="field"><label>Type</label>
      <select id="cxType"><option value="strength">Musculation</option><option value="cardio">Cardio</option></select>
    </div>
    <div class="field"><label>Muscles principaux</label><div class="row wrap" style="gap:6px" id="cxPrim">
      ${MUSCLE_IDS.filter(m => m !== 'cardio').map(m => `<button class="chip" data-m="${m}">${esc(MUSCLES[m].fr)}</button>`).join('')}
    </div></div>
    <div class="field"><label>Muscles secondaires</label><div class="row wrap" style="gap:6px" id="cxSec">
      ${MUSCLE_IDS.filter(m => m !== 'cardio').map(m => `<button class="chip" data-m="${m}">${esc(MUSCLES[m].fr)}</button>`).join('')}
    </div></div>
    <button class="btn primary block" id="cxSave">Créer l'exercice</button>
  `, body => {
    const toggle = sel => $$(sel + ' .chip', body).forEach(c => c.onclick = () => c.classList.toggle('on'));
    toggle('#cxPrim'); toggle('#cxSec');
    $('#cxSave', body).onclick = () => {
      const name = $('#cxName', body).value.trim();
      if (!name) return toast('Il faut un nom 🙂', 'warn');
      const primary = $$('#cxPrim .chip.on', body).map(c => c.dataset.m);
      const type = $('#cxType', body).value;
      if (!primary.length && type !== 'cardio') return toast('Choisis au moins un muscle', 'warn');
      const ex = {
        id: 'cx_' + uid(), name, eq: $('#cxEq', body).value.trim() || 'Autre',
        region: type === 'cardio' ? 'Cardio' : (muscleGroup(primary[0]) || 'Autre'),
        type, custom: true,
        primary: type === 'cardio' ? ['cardio'] : primary,
        secondary: $$('#cxSec .chip.on', body).map(c => c.dataset.m).filter(m => !primary.includes(m))
      };
      DB.customExercises.push(ex); save();
      closeSheet(); toast('Exercice créé 💪', 'ok');
      if (onDone) onDone(ex.id);
    };
  });
}
