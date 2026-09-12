/* Gym Hero — Données locales (LocalStorage), statistiques et progression */

const DB_KEY = 'gymhero.v1';

const DEFAULT_SETTINGS = {
  unit: 'kg',
  restDefault: 90,
  autoProgress: true,
  incUpper: 2.5,        // incrément haut du corps
  incLower: 5,          // incrément bas du corps
  goalPerWeek: 3,
  sound: true,
  vibrate: true,
  athlete: ''
};

let DB = null;

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function todayISO(d = new Date()) {
  return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10);
}

function load() {
  try {
    const raw = localStorage.getItem(DB_KEY);
    DB = raw ? JSON.parse(raw) : null;
  } catch (e) { DB = null; }
  if (!DB) DB = seed();
  DB.settings = Object.assign({}, DEFAULT_SETTINGS, DB.settings || {});
  DB.programs = DB.programs || [];
  DB.sessions = DB.sessions || [];
  DB.customExercises = DB.customExercises || [];
  DB.muscleOverrides = DB.muscleOverrides || {};
  return DB;
}
function save() {
  try { localStorage.setItem(DB_KEY, JSON.stringify(DB)); }
  catch (e) { toast('Stockage plein : exporte une sauvegarde.', 'warn'); }
}

/* ---------------- Exercices ---------------- */
/** Muscles redéfinis à la main par l'utilisateur, par exercice. */
function muscleOverride(id) { return (DB.muscleOverrides || {})[id] || null; }

function withOverride(ex) {
  const o = muscleOverride(ex.id);
  return o ? Object.assign({}, ex, { primary: o.primary || [], secondary: o.secondary || [] }) : ex;
}
function allExercises() {
  return EXERCISE_LIBRARY.concat(DB.customExercises).map(withOverride);
}
function getExercise(id) {
  const base = EXERCISE_LIBRARY.concat(DB.customExercises).find(e => e.id === id)
    || { id, name: id, type: 'strength', primary: [], secondary: [], eq: '' };
  return withOverride(base);
}

/** Enregistre (ou efface) les muscles choisis pour un exercice. */
function setMuscleOverride(id, primary, secondary) {
  DB.muscleOverrides = DB.muscleOverrides || {};
  if (!primary.length && !secondary.length) delete DB.muscleOverrides[id];
  else DB.muscleOverrides[id] = { primary, secondary };
  save();
}
function clearMuscleOverride(id) {
  if (DB.muscleOverrides) delete DB.muscleOverrides[id];
  save();
}

/* ---------------- Seed ---------------- */
function sets(n, reps, weight, firstWeight) {
  const out = [];
  for (let i = 0; i < n; i++) out.push({ reps, weight: (i === 0 && firstWeight != null) ? firstWeight : weight });
  return out;
}
function seed() {
  return {
    v: 1,
    settings: Object.assign({}, DEFAULT_SETTINGS),
    customExercises: [],
    muscleOverrides: {},
    sessions: [],
    active: null,
    programs: [
      {
        id: uid(), name: 'Jambes', emoji: '🦵', color: '#FF2D8A',
        note: 'Séance du samedi',
        items: [
          { exId: 'leg_press',     restSec: 120, sets: sets(4, 12, 97, 86) },
          { exId: 'leg_curl',      restSec: 90,  sets: sets(4, 12, 36) },
          { exId: 'leg_extension', restSec: 90,  sets: sets(4, 12, 36) },
          { exId: 'hip_abductor',  restSec: 60,  sets: sets(4, 12, 50, 43) },
          { exId: 'hip_adductor',  restSec: 60,  sets: sets(4, 12, 36, 29) },
          { exId: 'treadmill',     restSec: 0,   cardio: { durationMin: 15, incline: 15, speed: 5 } }
        ]
      },
      {
        id: uid(), name: 'Push', emoji: '💪', color: '#2B6BFF',
        note: 'Pecs / épaules / triceps',
        items: [
          { exId: 'bench_press',      restSec: 120, sets: sets(4, 10, 40) },
          { exId: 'db_incline',       restSec: 90,  sets: sets(3, 12, 16) },
          { exId: 'db_shoulder',      restSec: 90,  sets: sets(3, 12, 14) },
          { exId: 'lateral_raise',    restSec: 60,  sets: sets(3, 15, 8) },
          { exId: 'triceps_pushdown', restSec: 60,  sets: sets(3, 12, 25) }
        ]
      },
      {
        id: uid(), name: 'Pull', emoji: '🪝', color: '#22D3EE',
        note: 'Dos / biceps',
        items: [
          { exId: 'lat_pulldown', restSec: 90, sets: sets(4, 10, 50) },
          { exId: 'seated_row',   restSec: 90, sets: sets(4, 12, 45) },
          { exId: 'face_pull',    restSec: 60, sets: sets(3, 15, 20) },
          { exId: 'db_curl',      restSec: 60, sets: sets(3, 12, 12) },
          { exId: 'hammer_curl',  restSec: 60, sets: sets(3, 12, 12) }
        ]
      }
    ]
  };
}

/* ---------------- Volume ---------------- */
function setVolume(s) { return (Number(s.reps) || 0) * (Number(s.weight) || 0); }

/** Numéro affiché pour chaque série : les segments dégressifs ne comptent pas. */
function setNumbers(sets) {
  let n = 0;
  return (sets || []).map(x => (x.drop ? 0 : ++n));
}
/** Nombre de séries « vraies » (hors segments dégressifs). */
function realSetCount(sets) { return (sets || []).filter(x => !x.drop).length; }
function entryVolume(entry) {
  if (entry.cardio) return 0;
  return (entry.sets || []).filter(s => s.done !== false).reduce((t, s) => t + setVolume(s), 0);
}
function sessionVolume(sess) { return (sess.entries || []).reduce((t, e) => t + entryVolume(e), 0); }

/** Volume réparti par muscle sur une liste de séances. */
function volumeByMuscle(sessions) {
  const out = {};
  sessions.forEach(sess => (sess.entries || []).forEach(entry => {
    const ex = getExercise(entry.exId);
    const w = exerciseMuscleWeights(ex);
    let vol = entryVolume(entry);
    if (entry.cardio) vol = (Number(entry.cardio.durationMin) || 0) * 60; // équivalence cardio
    for (const m in w) {
      if (m === 'cardio') {
        // Le cardio se compte en minutes, pas en kilos.
        out.cardio = (out.cardio || 0) + (entry.cardio ? (Number(entry.cardio.durationMin) || 0) : 2);
      } else {
        out[m] = (out[m] || 0) + vol * w[m];
      }
    }
  }));
  return out;
}
/** Minutes de cardio cumulées sur une liste de séances. */
function cardioMinutes(sessions) {
  return sessions.reduce((t, sess) => t + (sess.entries || [])
    .reduce((x, e) => x + (e.cardio ? (Number(e.cardio.durationMin) || 0) : 0), 0), 0);
}

/** Normalise un dict de volumes en 0→1 pour la heatmap. */
/** 0→1 pour la heatmap. Le cardio a sa propre échelle : 30 min = plein. */
const CARDIO_FULL_MIN = 30;
function normalize(dict) {
  const out = {};
  const others = Object.entries(dict).filter(([k]) => k !== 'cardio');
  const max = Math.max(0, ...others.map(e => e[1]));
  if (max) others.forEach(([k, v]) => { out[k] = Math.pow(v / max, 0.65); }); // racine douce : les petits volumes restent visibles
  if (dict.cardio) out.cardio = Math.min(1, dict.cardio / CARDIO_FULL_MIN);
  return out;
}

/* ---------------- Filtres temporels ---------------- */
function startOfWeek(d = new Date()) {
  const x = new Date(d); const day = (x.getDay() + 6) % 7; // lundi = 0
  x.setHours(0,0,0,0); x.setDate(x.getDate() - day); return x;
}
function sessionsSince(date) { return DB.sessions.filter(s => new Date(s.date + 'T12:00') >= date); }
function sessionsInLastDays(n) {
  const d = new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate() - (n - 1));
  return sessionsSince(d);
}

/* ---------------- Statistiques ---------------- */
function stats() {
  const now = new Date();
  const week = sessionsSince(startOfWeek(now)).length;
  const month = DB.sessions.filter(s => s.date.slice(0, 7) === todayISO(now).slice(0, 7)).length;
  const year = DB.sessions.filter(s => s.date.slice(0, 4) === todayISO(now).slice(0, 4)).length;
  const volume = DB.sessions.reduce((t, s) => t + sessionVolume(s), 0);
  const exSet = new Set();
  DB.sessions.forEach(s => (s.entries || []).forEach(e => exSet.add(e.exId)));
  const last = DB.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : -1))[0] || null;
  const st = weekStreak();
  return { total: DB.sessions.length, week, month, year, volume, exercises: exSet.size, last,
           streak: st.current, bestStreak: st.best,
           cardioWeek: cardioMinutes(sessionsSince(startOfWeek(now))),
           cardioTotal: cardioMinutes(DB.sessions) };
}

/** Séries de semaines consécutives contenant au moins une séance. */
function weekStreak() {
  if (!DB.sessions.length) return { current: 0, best: 0 };
  const keys = new Set(DB.sessions.map(s => weekKey(new Date(s.date + 'T12:00'))));
  const sorted = [...keys].sort();
  let best = 1, run = 1;
  for (let i = 1; i < sorted.length; i++) {
    run = weeksApart(sorted[i - 1], sorted[i]) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
  }
  const thisWeek = weekKey(new Date());
  const lastWeek = weekKey(new Date(Date.now() - 7 * 864e5));
  let current = 0;
  if (keys.has(thisWeek) || keys.has(lastWeek)) {
    let cursor = keys.has(thisWeek) ? thisWeek : lastWeek;
    current = 1;
    while (true) {
      const prev = weekKey(new Date(weekStart(cursor).getTime() - 7 * 864e5));
      if (keys.has(prev)) { current++; cursor = prev; } else break;
    }
  }
  return { current, best };
}
function weekKey(d) { const s = startOfWeek(d); return todayISO(s); }
function weekStart(key) { return new Date(key + 'T12:00'); }
function weeksApart(a, b) { return Math.round((weekStart(b) - weekStart(a)) / (7 * 864e5)); }

/* ---------------- Records personnels ---------------- */
function e1RM(weight, reps) { return (Number(weight) || 0) * (1 + (Number(reps) || 0) / 30); } // Epley

function personalRecords() {
  const map = {};
  DB.sessions.forEach(sess => (sess.entries || []).forEach(entry => {
    if (entry.cardio) return;
    (entry.sets || []).forEach(s => {
      if (s.done === false || !s.weight || !s.reps) return;
      const r = map[entry.exId] || (map[entry.exId] = { exId: entry.exId, weight: 0, reps: 0, e1rm: 0, date: sess.date, volume: 0 });
      const est = e1RM(s.weight, s.reps);
      if (est > r.e1rm) { r.e1rm = est; r.weight = Number(s.weight); r.reps = Number(s.reps); r.date = sess.date; }
    });
    const v = entryVolume(entry);
    const r = map[entry.exId];
    if (r && v > r.volume) r.volume = v;
  }));
  return Object.values(map).sort((a, b) => b.e1rm - a.e1rm);
}
function prFor(exId) { return personalRecords().find(r => r.exId === exId) || null; }

/** Historique d'un exercice, du plus ancien au plus récent. */
function exerciseHistory(exId) {
  const out = [];
  DB.sessions.slice().sort((a, b) => (a.date < b.date ? -1 : 1)).forEach(sess => {
    (sess.entries || []).forEach(entry => {
      if (entry.exId !== exId) return;
      const done = (entry.sets || []).filter(s => s.done !== false && s.weight);
      if (entry.cardio) {
        out.push({ date: sess.date, cardio: entry.cardio, volume: 0 });
      } else if (done.length) {
        const top = done.reduce((m, s) => (e1RM(s.weight, s.reps) > e1RM(m.weight, m.reps) ? s : m), done[0]);
        out.push({
          date: sess.date,
          top: Number(top.weight),
          reps: Number(top.reps),
          e1rm: Math.round(e1RM(top.weight, top.reps) * 10) / 10,
          volume: entryVolume(entry),
          sets: done.length
        });
      }
    });
  });
  return out;
}

/* ---------------- Progression automatique ---------------- */
/** Incrément conseillé selon la zone travaillée. */
function incrementFor(ex) {
  const lower = (ex.primary || []).some(m => ['quads','hamstrings','glutes','adductors','abductors','calves'].includes(m));
  return lower ? DB.settings.incLower : DB.settings.incUpper;
}

/**
 * Après une séance : met à jour les charges du programme avec ce qui a été
 * réellement fait, et propose une hausse si toutes les séries ont été bouclées.
 * @returns {Array} liste des ajustements appliqués (pour l'affichage)
 */
function applyProgression(session) {
  const prog = DB.programs.find(p => p.id === session.programId);
  if (!prog) return [];
  const changes = [];
  session.entries.forEach(entry => {
    const item = prog.items.find(i => i.exId === entry.exId);
    if (!item) return;
    const ex = getExercise(entry.exId);
    if (entry.cardio) { item.cardio = Object.assign({}, entry.cardio); return; }
    const done = (entry.sets || []).filter(s => s.done !== false);
    if (!done.length) return;

    // 1) On mémorise les charges réellement utilisées.
    item.sets = done.map(s => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0,
                                 drop: s.drop || undefined, amrap: s.amrap || undefined }));
    item.superset = !!entry.superset;

    // 2) Toutes les séries au moins à l'objectif de reps → on monte la charge.
    if (DB.settings.autoProgress) {
      // Une série menée à l'échec n'a pas d'objectif de répétitions : on ne s'en sert
      // pas pour décider d'une hausse, et les segments dégressifs suivent leur série.
      const judgeable = done.filter(s => !s.drop && !s.amrap);
      const target = judgeable.length ? Math.max(...judgeable.map(s => Number(s.reps) || 0)) : 0;
      const allHit = judgeable.length && judgeable.every(s => (Number(s.reps) || 0) >= target && Number(s.weight) > 0);
      if (allHit && target > 0) {
        const inc = incrementFor(ex);
        item.sets = item.sets.map(s => ({ reps: s.reps, weight: Math.round((s.weight + inc) * 100) / 100 }));
        changes.push({ exId: entry.exId, name: ex.name, inc });
      }
    }
  });
  save();
  return changes;
}

/* ---------------- Séances ---------------- */
function startSession(programId, dateISO) {
  const prog = DB.programs.find(p => p.id === programId);
  const entries = (prog ? prog.items : []).map(item => {
    const ex = getExercise(item.exId);
    return ex.type === 'cardio'
      ? { exId: item.exId, name: ex.name, cardio: Object.assign({ durationMin: 15, incline: 0, speed: 6 }, item.cardio), note: item.note || '' }
      : { exId: item.exId, name: ex.name, restSec: item.restSec || DB.settings.restDefault,
          superset: !!item.superset,
          sets: (item.sets || []).map(s => ({ reps: s.reps, weight: s.weight, done: !!dateISO,
                                              drop: s.drop || undefined, amrap: s.amrap || undefined })),
          note: item.note || '' };
  });
  const date = dateISO || todayISO();
  DB.active = {
    id: uid(), startedAt: Date.now(), date,
    past: date !== todayISO(),
    programId: prog ? prog.id : null, programName: prog ? prog.name : 'Séance libre',
    emoji: prog ? prog.emoji : '⚡', entries, note: ''
  };
  save();
  return DB.active;
}
function finishSession() {
  const s = DB.active;
  if (!s) return null;
  s.endedAt = Date.now();
  s.durationSec = s.past ? (s.durationSec || 0) : Math.round((s.endedAt - s.startedAt) / 1000);
  s.entries = s.entries.filter(e => e.cardio || (e.sets || []).some(x => x.done));
  s.volume = sessionVolume(s);

  if (s.editingId) {
    const i = DB.sessions.findIndex(x => x.id === s.editingId);
    s.id = s.editingId;
    delete s.editingId;
    if (i >= 0) DB.sessions[i] = s; else DB.sessions.push(s);
  } else {
    DB.sessions.push(s);
  }
  DB.sessions.sort((a, b) => (a.date < b.date ? -1 : 1));
  DB.active = null;

  // Les charges ne sont ajustées que si c'est bien la séance la plus récente
  const isLatest = !DB.sessions.some(x => x.id !== s.id && x.date > s.date);
  const changes = isLatest ? applyProgression(s) : [];
  save();
  return { session: s, changes };
}
function cancelSession() { DB.active = null; save(); }

/** Recharge une séance enregistrée dans l'éditeur pour la corriger. */
function editSession(id) {
  const orig = DB.sessions.find(s => s.id === id);
  if (!orig) return null;
  const copy = JSON.parse(JSON.stringify(orig));
  copy.entries.forEach(e => (e.sets || []).forEach(x => { if (x.done === undefined) x.done = true; }));
  copy.editingId = id;
  copy.past = copy.date !== todayISO();
  copy.startedAt = copy.startedAt || Date.now();
  DB.active = copy;
  save();
  return copy;
}
function deleteSession(id) { DB.sessions = DB.sessions.filter(s => s.id !== id); save(); }

/* ---------------- Sauvegarde ---------------- */
function exportJSON() {
  return JSON.stringify(DB, null, 2);
}
function importJSON(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.sessions)) throw new Error('Fichier invalide');
  DB = data; load(); save();
}
