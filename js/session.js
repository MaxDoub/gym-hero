/* Gym Hero — Séance en cours */

let restTimer = null, restEnd = 0, restTotal = 0;
let sessionTick = null;

function launchSession(programId) {
  if (DB.active && DB.active.entries.some(e => (e.sets || []).some(s => s.done))) {
    return confirmSheet('Séance en cours', 'Une séance est déjà commencée. La remplacer ?', 'Remplacer', () => {
      startSession(programId); go('session');
    }, true);
  }
  startSession(programId);
  go('session');
  toast('C\'est parti 🔥', 'ok');
}

function renderSession() {
  const v = $('#view-session');
  const s = DB.active;

  if (!s) {
    v.innerHTML = `
      <div class="section-title">Démarrer une séance</div>
      ${DB.programs.map(p => `
        <div class="card" style="border-left:4px solid ${p.color || 'var(--blue)'}">
          <div class="row between">
            <div class="row" style="min-width:0">
              <div class="emoji" style="width:42px;height:42px;border-radius:13px;display:grid;place-items:center;font-size:21px;background:var(--card2)">${p.emoji || '🏋️'}</div>
              <div style="min-width:0">
                <b>${esc(p.name)}</b>
                <div class="tiny muted">${programSummary(p).exercises} exercices · ${esc(programTopMuscles(p, 2).join(', '))}</div>
              </div>
            </div>
            <button class="btn sm primary" data-start="${p.id}">▶︎</button>
          </div>
        </div>`).join('')}
      <button class="btn ghost block" id="freeSession">⚡ Séance libre (sans programme)</button>
      <p class="tiny muted center" style="margin-top:14px">Tes charges du dernier passage sont pré-remplies automatiquement.</p>`;
    $$('[data-start]', v).forEach(b => b.onclick = () => launchSession(b.dataset.start));
    $('#freeSession', v).onclick = () => { startSession(null); go('session'); };
    return;
  }

  const elapsed = Math.round((Date.now() - s.startedAt) / 1000);
  const doneSets = s.entries.reduce((t, e) => t + (e.sets || []).filter(x => x.done).length, 0);
  const allSets = s.entries.reduce((t, e) => t + (e.sets || []).length, 0);
  const vol = sessionVolume(s);

  const past = !!(s.past || s.editingId);

  v.innerHTML = `
    <div class="hero">
      <div class="row between">
        <div><h2>${s.emoji || '⚡'} ${esc(s.programName)}</h2>
          <p>${past ? (s.editingId ? 'Correction · ' : 'Saisie a posteriori · ') + fmtDate(s.date, true)
                    : fmtDate(s.date, true) + ' · <span id="sessClock">' + fmtDur(elapsed) + '</span>'}</p></div>
        <div style="text-align:right">
          <b style="font-size:22px">${doneSets}/${allSets}</b>
          <div class="tiny" style="opacity:.85">séries</div>
        </div>
      </div>
      ${past ? `
        <div class="row" style="gap:8px;margin-bottom:10px">
          <input type="date" id="sessDate" value="${s.date}" style="flex:2;background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff">
          <input type="number" id="sessDur" placeholder="min" value="${Math.round((s.durationSec || 0) / 60) || ''}" style="flex:1;background:rgba(255,255,255,.16);border-color:rgba(255,255,255,.3);color:#fff;text-align:center">
        </div>` : ''}
      <div class="row" style="gap:8px">
        <button class="btn solid grow" id="sessFinish" style="flex:1">${past ? '💾 Enregistrer' : '✅ Terminer'}</button>
        <button class="btn" id="sessAdd">➕ Exercice</button>
        <button class="btn" id="sessCancel">✕</button>
      </div>
      <div class="tiny" style="opacity:.85;margin-top:10px">Volume : <b>${fmtVolume(vol)}</b></div>
    </div>
    <div id="sessList"></div>
    <div class="card">
      <label class="tiny muted">Note de séance</label>
      <textarea id="sessNote" rows="2" placeholder="Sensations, douleurs, remarques…">${esc(s.note || '')}</textarea>
    </div>
    <div class="section-title">Muscles de cette séance</div>
    <div class="bodies" id="sessBodies"></div>`;

  drawSessionList();
  renderBodyView($('#sessBodies', v), normalize(volumeByMuscle([s])), { uid: 'ss' });

  $('#sessFinish', v).onclick = finishSessionFlow;
  $('#sessCancel', v).onclick = () => confirmSheet(
    past ? 'Abandonner les modifications ?' : 'Abandonner ?',
    past ? 'La séance enregistrée restera telle quelle.' : 'La séance en cours sera perdue.',
    'Abandonner', () => { cancelSession(); renderAll(); go(past ? 'calendar' : 'home'); toast('Modifications abandonnées'); }, true);
  $('#sessAdd', v).onclick = () => pickExercise(exId => {
    const ex = getExercise(exId);
    DB.active.entries.push(ex.type === 'cardio'
      ? { exId, name: ex.name, cardio: { durationMin: 15, incline: 0, speed: 6 } }
      : { exId, name: ex.name, restSec: DB.settings.restDefault, sets: sets(3, 12, 20).map(x => ({ ...x, done: false })) });
    save(); renderSession();
  });
  $('#sessNote', v).onchange = e => { DB.active.note = e.target.value; save(); };
  if (past) {
    $('#sessDate', v).onchange = e => {
      DB.active.date = e.target.value || DB.active.date;
      DB.active.past = DB.active.date !== todayISO();
      save(); renderSession();
    };
    $('#sessDur', v).onchange = e => {
      DB.active.durationSec = (Number(e.target.value) || 0) * 60; save();
    };
  }

  clearInterval(sessionTick);
  if (past) return;
  sessionTick = setInterval(() => {
    const el = $('#sessClock');
    if (!el || !DB.active) return clearInterval(sessionTick);
    el.textContent = fmtDur(Math.round((Date.now() - DB.active.startedAt) / 1000));
  }, 1000);
}

function drawSessionList() {
  const box = $('#sessList');
  if (!box) return;
  const s = DB.active;

  box.innerHTML = s.entries.map((entry, ei) => {
    const ex = getExercise(entry.exId);
    const pr = prFor(entry.exId);
    if (entry.cardio) return `
      <div class="ex-card">
        <div class="ex-head">
          <div class="emoji">🏃</div>
          <div class="grow"><b>${esc(ex.name)}</b><div class="muscles">Cardio · ${esc((ex.secondary||[]).map(muscleName).join(', '))}</div></div>
          <button class="btn xs danger" data-rme="${ei}">✕</button>
        </div>
        <div class="ex-body">
          <div class="grid g3">
            <div><label class="tiny muted">Durée (min)</label><input type="number" inputmode="decimal" data-cardio="durationMin" data-e="${ei}" value="${entry.cardio.durationMin}"></div>
            <div><label class="tiny muted">Pente (%)</label><input type="number" inputmode="decimal" data-cardio="incline" data-e="${ei}" value="${entry.cardio.incline}"></div>
            <div><label class="tiny muted">Vitesse (km/h)</label><input type="number" inputmode="decimal" data-cardio="speed" data-e="${ei}" value="${entry.cardio.speed}"></div>
          </div>
        </div>
      </div>`;

    const done = (entry.sets || []).filter(x => x.done).length;
    return `
      <div class="ex-card">
        <div class="ex-head">
          <div class="emoji">${done === entry.sets.length ? '✅' : '🏋️'}</div>
          <div class="grow">
            <b>${esc(ex.name)}</b>
            <div class="muscles is-editable" data-muscles="${entry.exId}">${esc(muscleLine(ex))} ✏️</div>
          </div>
          <button class="btn xs" data-info="${entry.exId}">👁</button>
          <button class="btn xs danger" data-rme="${ei}">✕</button>
        </div>
        <div class="ex-body">
          ${pr ? `<div class="tiny muted" style="margin-bottom:8px">Record : <b class="pr-flag">${fmtWeight(pr.weight)} × ${pr.reps}</b> · ${fmtDate(pr.date)}</div>` : ''}
          <div class="set-head"><span>Série</span><span>Reps</span><span>Charge (${DB.settings.unit})</span><span>✓</span></div>
          ${entry.sets.map((st, si) => `
            <div class="set-row ${st.done ? 'done' : ''}">
              <div class="n">${si + 1}</div>
              <input type="number" inputmode="numeric" data-f="reps" data-e="${ei}" data-si="${si}" value="${st.reps}">
              <input type="number" inputmode="decimal" step="0.5" data-f="weight" data-e="${ei}" data-si="${si}" value="${st.weight}">
              <button class="check ${st.done ? 'on' : ''}" data-check="${ei}" data-si="${si}">✓</button>
            </div>`).join('')}
          <div class="row" style="gap:8px;margin-top:8px">
            <button class="btn xs" data-addset="${ei}">＋ Série</button>
            <button class="btn xs" data-rmset="${ei}">− Série</button>
            <div class="grow"></div>
            <span class="tiny muted">Repos ${entry.restSec || DB.settings.restDefault}s</span>
          </div>
        </div>
      </div>`;
  }).join('');

  $$('[data-check]', box).forEach(b => b.onclick = () => {
    const e = s.entries[+b.dataset.check], st = e.sets[+b.dataset.si];
    st.done = !st.done;
    save();
    if (st.done) {
      buzz(25);
      checkPR(e, st);
      startRest(e.restSec || DB.settings.restDefault);
    }
    drawSessionList();
    refreshSessionHeader();
  });
  $$('[data-f]', box).forEach(inp => {
    inp.onchange = () => {
      const e = s.entries[+inp.dataset.e];
      e.sets[+inp.dataset.si][inp.dataset.f] = Number(inp.value) || 0;
      save(); refreshSessionHeader();
    };
    inp.onfocus = () => inp.select();
  });
  $$('[data-cardio]', box).forEach(inp => inp.onchange = () => {
    s.entries[+inp.dataset.e].cardio[inp.dataset.cardio] = Number(inp.value) || 0;
    save();
  });
  $$('[data-addset]', box).forEach(b => b.onclick = () => {
    const e = s.entries[+b.dataset.addset];
    const last = e.sets[e.sets.length - 1] || { reps: 12, weight: 20 };
    e.sets.push({ reps: last.reps, weight: last.weight, done: false });
    save(); drawSessionList();
  });
  $$('[data-rmset]', box).forEach(b => b.onclick = () => {
    const e = s.entries[+b.dataset.rmset];
    if (e.sets.length > 1) e.sets.pop();
    save(); drawSessionList();
  });
  $$('[data-rme]', box).forEach(b => b.onclick = () => {
    s.entries.splice(+b.dataset.rme, 1); save(); renderSession();
  });
  $$('[data-info]', box).forEach(b => b.onclick = () => exerciseSheet(b.dataset.info));
  $$('[data-muscles]', box).forEach(el => el.onclick = () => muscleEditorSheet(el.dataset.muscles));
}

function refreshSessionHeader() {
  const s = DB.active; if (!s) return;
  const doneSets = s.entries.reduce((t, e) => t + (e.sets || []).filter(x => x.done).length, 0);
  const allSets = s.entries.reduce((t, e) => t + (e.sets || []).length, 0);
  const hero = $('#view-session .hero');
  if (hero) {
    const b = hero.querySelector('div[style*="right"] b');
    if (b) b.textContent = `${doneSets}/${allSets}`;
    const vt = hero.querySelector('.tiny b');
    if (vt) vt.textContent = fmtVolume(sessionVolume(s));
  }
  const bodies = $('#sessBodies');
  if (bodies) renderBodyView(bodies, normalize(volumeByMuscle([s])), { uid: 'ss' });
}

/* ---------------- Records en direct ---------------- */
function checkPR(entry, st) {
  if (!st.weight || !st.reps) return;
  const before = prFor(entry.exId);        // records issus des séances terminées
  const est = e1RM(st.weight, st.reps);
  if (!before) return;
  if (est > before.e1rm + 0.01) {
    toast(`🏆 Record sur ${esc(getExercise(entry.exId).name)} !<br><span class="tiny">${fmtWeight(st.weight)} × ${st.reps}</span>`, 'pr');
    buzz([30, 60, 30, 60, 80]); beep(1046, 120); setTimeout(() => beep(1318, 220), 130);
  }
}

/* ---------------- Chrono de repos ---------------- */
function startRest(sec) {
  if (!sec) return;
  restTotal = sec; restEnd = Date.now() + sec * 1000;
  clearInterval(restTimer);
  drawRest();
  restTimer = setInterval(drawRest, 250);
}
function stopRest() {
  clearInterval(restTimer); restTimer = null;
  const bar = $('.rest-bar'); if (bar) bar.remove();
}
function drawRest() {
  const left = (restEnd - Date.now()) / 1000;
  let bar = $('.rest-bar');
  if (left <= 0) {
    stopRest();
    beep(760, 180); setTimeout(() => beep(980, 260), 200);
    buzz([120, 80, 120]);
    toast('Repos terminé — série suivante 💪', 'ok');
    return;
  }
  if (!bar) {
    bar = document.createElement('div');
    bar.className = 'rest-bar';
    bar.innerHTML = `<span>⏱</span><span class="time"></span><span class="grow tiny">Repos</span>
      <button data-r="30">+30s</button><button data-r="skip">Passer</button>`;
    document.body.appendChild(bar);
    bar.querySelector('[data-r="30"]').onclick = () => { restEnd += 30000; drawRest(); };
    bar.querySelector('[data-r="skip"]').onclick = stopRest;
  }
  bar.querySelector('.time').textContent = clock(left);
}

/* ---------------- Fin de séance ---------------- */
function finishSessionFlow() {
  const s = DB.active;
  const done = s.entries.reduce((t, e) => t + (e.sets || []).filter(x => x.done).length, 0);
  const hasCardio = s.entries.some(e => e.cardio);
  if (!done && !hasCardio) {
    return confirmSheet('Séance vide', 'Aucune série validée. Terminer quand même ?', 'Terminer', () => {
      cancelSession(); renderAll(); go('home');
    }, true);
  }
  stopRest();
  const wasPast = !!(s.past || s.editingId);
  const res = finishSession();
  renderAll();
  go(wasPast ? 'calendar' : 'home');
  showSessionSummary(res.session, res.changes);
}

function showSessionSummary(sess, changes) {
  const byMuscle = normalize(volumeByMuscle([sess]));
  const top = Object.entries(volumeByMuscle([sess]))
    .filter(([m]) => m !== 'cardio')
    .sort((a, b) => b[1] - a[1]).slice(0, 4).map(([m]) => muscleName(m));
  openSheet(sess.date === todayISO() ? 'Séance terminée 🎉' : `Séance du ${fmtDate(sess.date)} enregistrée ✅`, `
    <div class="grid g3" style="margin-bottom:14px">
      <div class="stat accent"><b>${sess.durationSec ? fmtDur(sess.durationSec) : '—'}</b><span>durée</span></div>
      <div class="stat"><b>${sess.entries.length}</b><span>exercices</span></div>
      <div class="stat warm"><b>${fmtVolume(sess.volume)}</b><span>volume</span></div>
    </div>
    <p class="tiny muted">Muscles principaux : ${esc(top.join(', ') || '—')}</p>
    ${cardioMinutes([sess]) ? `<div class="row wrap" style="gap:6px;margin-bottom:10px"><span class="chip pink">❤️ ${cardioMinutes([sess])} min de cardio</span></div>` : ''}
    <div class="bodies" id="sumBodies"></div>
    ${changes.length ? `
      <div class="section-title" style="margin-top:16px">Charges ajustées pour la prochaine fois</div>
      <div class="card flush">${changes.map(c => `
        <div class="list-item"><div class="emoji">⬆️</div>
          <div class="grow"><b>${esc(c.name)}</b><span>+${c.inc} ${DB.settings.unit} la prochaine séance</span></div>
        </div>`).join('')}</div>`
      : `<p class="tiny muted" style="margin-top:14px">Charges mémorisées : tu retrouveras les mêmes au prochain passage.</p>`}
    <button class="btn primary block" style="margin-top:16px" onclick="closeSheet()">Parfait 💪</button>
  `, body => renderBodyView($('#sumBodies', body), byMuscle, { uid: 'sum' }));
}
