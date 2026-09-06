/* Gym Hero — Programmes réutilisables */

const PROGRAM_EMOJIS = ['🦵','💪','🪝','🔥','⚡','🏋️','🧗','🫀','🦍','🥇','🌀','🧊'];
const PROGRAM_COLORS = ['#FF2D8A','#2B6BFF','#22D3EE','#FFC531','#FF7A18','#7B2BFF'];

function programExercises(prog) { return (prog.items || []).map(i => getExercise(i.exId)); }

/** Les 3 muscles les plus sollicités d'un programme, pour l'étiquette. */
function programTopMuscles(prog, n = 3) {
  const heat = {};
  programExercises(prog).forEach(ex => {
    const w = exerciseMuscleWeights(ex);
    for (const m in w) if (m !== 'cardio') heat[m] = (heat[m] || 0) + w[m];
  });
  return Object.entries(heat).sort((a, b) => b[1] - a[1]).slice(0, n).map(e => muscleName(e[0]));
}

function programSummary(prog) {
  const strength = (prog.items || []).filter(i => getExercise(i.exId).type !== 'cardio');
  const setCount = strength.reduce((t, i) => t + (i.sets || []).length, 0);
  const vol = strength.reduce((t, i) => t + (i.sets || []).reduce((x, s) => x + setVolume(s), 0), 0);
  return { exercises: (prog.items || []).length, sets: setCount, volume: vol };
}

function renderPrograms() {
  const v = $('#view-programs');
  const progs = DB.programs;
  v.innerHTML = `
    <div class="section-title">Mes programmes <button class="btn xs" id="pNew">＋ Nouveau</button></div>
    ${progs.length ? progs.map(p => {
      const s = programSummary(p);
      return `
      <div class="card" style="border-left:4px solid ${p.color || 'var(--blue)'}">
        <div class="row between" style="align-items:flex-start">
          <div class="row" style="min-width:0">
            <div class="emoji" style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center;font-size:22px;background:var(--card2)">${p.emoji || '🏋️'}</div>
            <div style="min-width:0">
              <b style="font-size:16px">${esc(p.name)}</b>
              <div class="tiny muted">${s.exercises} exercices · ${s.sets} séries${s.volume ? ' · ' + fmtVolume(s.volume) : ''}</div>
            </div>
          </div>
          <button class="icon-btn" data-edit="${p.id}" aria-label="Modifier">✏️</button>
        </div>
        <div class="row wrap" style="gap:5px;margin:11px 0 12px">
          ${programTopMuscles(p).map(m => `<span class="chip">${esc(m)}</span>`).join('')}
          ${p.note ? `<span class="chip cyan">${esc(p.note)}</span>` : ''}
        </div>
        <button class="btn primary block" data-start="${p.id}">▶︎ Démarrer cette séance</button>
      </div>`;
    }).join('') : `
      <div class="empty">
        <div class="big">📋</div>
        <b>Aucun programme</b>
        <p class="tiny">Crée ta première séance type (Jambes, Push, Pull…).</p>
      </div>`}
    <button class="btn ghost block" id="pNew2" style="margin-top:6px">➕ Créer un programme</button>
  `;
  const create = () => openProgramEditor(null);
  $('#pNew', v).onclick = create;
  $('#pNew2', v).onclick = create;
  $$('[data-edit]', v).forEach(b => b.onclick = () => openProgramEditor(b.dataset.edit));
  $$('[data-start]', v).forEach(b => b.onclick = () => launchSession(b.dataset.start));
}

/* ---------------- Éditeur ---------------- */
let draft = null;

function openProgramEditor(id) {
  const existing = DB.programs.find(p => p.id === id);
  draft = existing
    ? JSON.parse(JSON.stringify(existing))
    : { id: uid(), name: '', emoji: '🏋️', color: PROGRAM_COLORS[1], note: '', items: [] };

  openSheet(existing ? 'Modifier le programme' : 'Nouveau programme', `
    <div class="field"><label>Nom de la séance</label>
      <input id="pgName" value="${esc(draft.name)}" placeholder="Jambes, Push, Full body…"></div>
    <div class="field"><label>Note (optionnel)</label>
      <input id="pgNote" value="${esc(draft.note || '')}" placeholder="Séance du samedi"></div>
    <div class="field"><label>Icône</label>
      <div class="row wrap" style="gap:6px" id="pgEmoji">
        ${PROGRAM_EMOJIS.map(e => `<button class="chip ${e === draft.emoji ? 'on' : ''}" data-e="${e}" style="font-size:17px;padding:6px 9px">${e}</button>`).join('')}
      </div></div>
    <div class="field"><label>Couleur</label>
      <div class="row wrap" style="gap:8px" id="pgColor">
        ${PROGRAM_COLORS.map(c => `<button data-c="${c}" style="width:30px;height:30px;border-radius:50%;background:${c};border:3px solid ${c === draft.color ? '#fff' : 'transparent'}"></button>`).join('')}
      </div></div>

    <div class="section-title" style="margin-top:18px">Exercices <button class="btn xs" id="pgAdd">＋ Ajouter</button></div>
    <div id="pgItems"></div>

    <div class="section-title" style="margin-top:18px">Muscles travaillés</div>
    <div class="bodies" id="pgBodies"></div>

    <div class="row" style="gap:8px;margin-top:18px">
      ${existing ? '<button class="btn danger" id="pgDel">🗑</button>' : ''}
      <button class="btn primary block" id="pgSave">Enregistrer</button>
    </div>
  `, body => {
    $('#pgName', body).oninput = e => { draft.name = e.target.value; };
    $('#pgNote', body).oninput = e => { draft.note = e.target.value; };
    $$('#pgEmoji .chip', body).forEach(b => b.onclick = () => {
      draft.emoji = b.dataset.e;
      $$('#pgEmoji .chip', body).forEach(x => x.classList.toggle('on', x === b));
    });
    $$('#pgColor button', body).forEach(b => b.onclick = () => {
      draft.color = b.dataset.c;
      $$('#pgColor button', body).forEach(x => x.style.borderColor = x === b ? '#fff' : 'transparent');
    });
    $('#pgAdd', body).onclick = () => pickExercise(exId => {
      const ex = getExercise(exId);
      draft.items.push(ex.type === 'cardio'
        ? { exId, cardio: { durationMin: 15, incline: 0, speed: 6 }, restSec: 0 }
        : { exId, restSec: DB.settings.restDefault, sets: sets(3, 12, 20) });
      reopenEditor(body);
    });
    $('#pgSave', body).onclick = () => {
      if (!draft.name.trim()) return toast('Donne un nom à ta séance 🙂', 'warn');
      if (!draft.items.length) return toast('Ajoute au moins un exercice', 'warn');
      const i = DB.programs.findIndex(p => p.id === draft.id);
      if (i >= 0) DB.programs[i] = draft; else DB.programs.push(draft);
      save(); closeSheet(); renderAll(); toast('Programme enregistré ✅', 'ok');
    };
    if (existing) $('#pgDel', body).onclick = () =>
      confirmSheet('Supprimer ?', `« ${draft.name} » sera supprimé. Tes séances déjà enregistrées sont conservées.`, 'Supprimer', () => {
        DB.programs = DB.programs.filter(p => p.id !== draft.id);
        save(); closeSheet(); renderAll(); toast('Programme supprimé');
      }, true);

    drawEditorItems(body);
  });
}

/** Redessine la liste d'exercices sans perdre la saisie en cours. */
function reopenEditor(body) { drawEditorItems(body); }

function drawEditorItems(body) {
  const box = $('#pgItems', body);
  box.innerHTML = draft.items.length ? draft.items.map((item, idx) => {
    const ex = getExercise(item.exId);
    if (ex.type === 'cardio') return `
      <div class="ex-card">
        <div class="ex-head">
          <div class="emoji" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--card2)">🏃</div>
          <div class="grow"><b>${esc(ex.name)}</b><div class="muscles">Cardio · ${esc((ex.secondary||[]).map(muscleName).join(', '))}</div></div>
          <button class="btn xs" data-up="${idx}">↑</button>
          <button class="btn xs danger" data-rm="${idx}">✕</button>
        </div>
        <div class="ex-body">
          <div class="grid g3">
            <div><label class="tiny muted">Durée (min)</label><input type="number" inputmode="decimal" data-c="durationMin" data-i="${idx}" value="${item.cardio.durationMin}"></div>
            <div><label class="tiny muted">Pente (%)</label><input type="number" inputmode="decimal" data-c="incline" data-i="${idx}" value="${item.cardio.incline}"></div>
            <div><label class="tiny muted">Vitesse (km/h)</label><input type="number" inputmode="decimal" data-c="speed" data-i="${idx}" value="${item.cardio.speed}"></div>
          </div>
        </div>
      </div>`;
    return `
      <div class="ex-card">
        <div class="ex-head">
          <div class="emoji" style="width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:var(--card2)">🏋️</div>
          <div class="grow"><b>${esc(ex.name)}</b><div class="muscles">${esc(muscleLine(ex))}</div></div>
          <button class="btn xs" data-up="${idx}">↑</button>
          <button class="btn xs danger" data-rm="${idx}">✕</button>
        </div>
        <div class="ex-body">
          <div class="set-head"><span>Série</span><span>Reps</span><span>Charge (${DB.settings.unit})</span><span></span></div>
          ${item.sets.map((s, si) => `
            <div class="set-row">
              <div class="n">${si + 1}</div>
              <input type="number" inputmode="numeric" data-s="reps" data-i="${idx}" data-si="${si}" value="${s.reps}">
              <input type="number" inputmode="decimal" step="0.5" data-s="weight" data-i="${idx}" data-si="${si}" value="${s.weight}">
              <button class="check" data-rms="${idx}" data-si="${si}" aria-label="Retirer la série">−</button>
            </div>`).join('')}
          <div class="row wrap" style="gap:8px;margin-top:8px">
            <button class="btn xs" data-adds="${idx}">＋ Série</button>
            <button class="btn xs" data-copy="${idx}">⧉ Uniformiser</button>
            <div class="grow"></div>
            <span class="tiny muted">Repos</span>
            <input type="number" inputmode="numeric" data-rest="${idx}" value="${item.restSec || 90}" style="width:74px;padding:6px 8px;text-align:center">
            <span class="tiny muted">s</span>
          </div>
        </div>
      </div>`;
  }).join('') : `<div class="empty tiny">Aucun exercice. Ajoute-en un ⤴</div>`;

  // Interactions
  $$('[data-rm]', box).forEach(b => b.onclick = () => { draft.items.splice(+b.dataset.rm, 1); drawEditorItems(body); });
  $$('[data-up]', box).forEach(b => b.onclick = () => {
    const i = +b.dataset.up; if (i === 0) return;
    [draft.items[i-1], draft.items[i]] = [draft.items[i], draft.items[i-1]];
    drawEditorItems(body);
  });
  $$('[data-adds]', box).forEach(b => b.onclick = () => {
    const it = draft.items[+b.dataset.adds];
    const last = it.sets[it.sets.length - 1] || { reps: 12, weight: 20 };
    it.sets.push({ reps: last.reps, weight: last.weight });
    drawEditorItems(body);
  });
  $$('[data-rms]', box).forEach(b => b.onclick = () => {
    const it = draft.items[+b.dataset.rms];
    if (it.sets.length > 1) it.sets.splice(+b.dataset.si, 1);
    drawEditorItems(body);
  });
  $$('[data-copy]', box).forEach(b => b.onclick = () => {
    const it = draft.items[+b.dataset.copy];
    const w = it.sets[it.sets.length - 1].weight;
    it.sets = it.sets.map(s => ({ reps: s.reps, weight: w }));
    drawEditorItems(body);
    toast('Charges uniformisées');
  });
  $$('[data-s]', box).forEach(inp => inp.onchange = () => {
    const it = draft.items[+inp.dataset.i];
    it.sets[+inp.dataset.si][inp.dataset.s] = Number(inp.value) || 0;
    drawBodiesPreview(body);
  });
  $$('[data-c]', box).forEach(inp => inp.onchange = () => {
    draft.items[+inp.dataset.i].cardio[inp.dataset.c] = Number(inp.value) || 0;
  });
  $$('[data-rest]', box).forEach(inp => inp.onchange = () => {
    draft.items[+inp.dataset.rest].restSec = Number(inp.value) || 0;
  });
  drawBodiesPreview(body);
}

function drawBodiesPreview(body) {
  const box = $('#pgBodies', body);
  if (!box) return;
  renderBodyPair(box, heatFromExercises(programExercises(draft)), { uid: 'pg' });
}
