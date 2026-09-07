/* Gym Hero — routeur et vues Accueil / Progression / Anatomie / Régularité / Paramètres */

let currentTab = 'home';
const charts = {};

function go(tab) {
  currentTab = tab;
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + tab));
  $$('#nav button').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
  render(tab);
}

function render(tab) {
  ({
    home: renderHome, programs: renderPrograms, session: renderSession,
    progress: renderProgress, anatomy: renderAnatomy,
    calendar: renderCalendar, settings: renderSettings
  }[tab] || renderHome)();
}
function renderAll() {
  render(currentTab);
  const s = stats();
  $('#brandSub').textContent = DB.active ? 'Séance en cours 🔥'
    : s.total ? `${s.total} séance${s.total > 1 ? 's' : ''} · série de ${s.streak} sem.`
    : 'Prêt à soulever';
  const nb = $('#nav [data-tab="session"]');
  nb.querySelector('.badge')?.remove();
  if (DB.active) { const d = document.createElement('span'); d.className = 'badge'; nb.appendChild(d); }
}

/* ==================== ACCUEIL ==================== */
function renderHome() {
  const v = $('#view-home');
  const s = stats();
  const prs = personalRecords().slice(0, 5);
  const weekVol = sessionsSince(startOfWeek()).reduce((t, x) => t + sessionVolume(x), 0);
  const next = suggestNextProgram();

  v.innerHTML = `
    ${DB.active ? `
      <div class="hero">
        <h2>${DB.active.emoji || '⚡'} ${esc(DB.active.programName)}</h2>
        <p>Séance en cours · ${fmtDur(Math.round((Date.now() - DB.active.startedAt) / 1000))}</p>
        <button class="btn solid block" onclick="go('session')">Reprendre la séance ▸</button>
      </div>`
    : `
      <div class="hero">
        <h2>Prêt, Hugo ?</h2>
        <p>${next ? `Suggestion du jour : ${next.emoji} ${esc(next.name)}` : 'Crée ton premier programme pour commencer.'}</p>
        <div class="row" style="gap:8px">
          ${next ? `<button class="btn solid" style="flex:1" onclick="launchSession('${next.id}')">▶︎ ${esc(next.name)}</button>` : ''}
          <button class="btn" onclick="go('programs')">Programmes</button>
        </div>
      </div>`}

    <div class="grid g4">
      <div class="stat accent"><b>${s.total}</b><span>total</span></div>
      <div class="stat"><b>${s.week}</b><span>semaine</span></div>
      <div class="stat"><b>${s.month}</b><span>ce mois</span></div>
      <div class="stat"><b>${s.year}</b><span>cette année</span></div>
    </div>

    <div class="section-title">Objectif de la semaine</div>
    <div class="card">
      <div class="vbar">
        <div class="lbl"><span>${s.week} / ${DB.settings.goalPerWeek} séances</span><b>${Math.min(100, Math.round(s.week / DB.settings.goalPerWeek * 100))}%</b></div>
        <div class="track"><div class="fill" style="width:${Math.min(100, s.week / DB.settings.goalPerWeek * 100)}%"></div></div>
      </div>
      <div class="row between tiny muted" style="margin-top:10px">
        <span>Volume cette semaine</span><b style="color:var(--txt)">${fmtVolume(weekVol)}</b>
      </div>
      ${s.cardioWeek ? `<div class="row between tiny muted" style="margin-top:4px">
        <span>❤️ Cardio cette semaine</span><b style="color:var(--txt)">${s.cardioWeek} min</b>
      </div>` : ''}
    </div>

    <div class="section-title">Dernière activité</div>
    ${s.last ? `
      <div class="card flush">
        <div class="list-item" data-sess="${s.last.id}">
          <div class="emoji">${s.last.emoji || '🏋️'}</div>
          <div class="grow">
            <b>${esc(s.last.programName)}</b>
            <span>${fmtDate(s.last.date, true)} · ${relDate(s.last.date)} · ${fmtVolume(sessionVolume(s.last))}</span>
          </div>
          <span class="chev">›</span>
        </div>
      </div>`
    : `<div class="empty"><div class="big">🏋️</div><b>Aucune séance</b><p class="tiny">Lance ta première séance depuis l'onglet Séance.</p></div>`}

    <div class="grid g3">
      <div class="stat warm"><b>${fmtVolume(s.volume)}</b><span>volume total</span></div>
      <div class="stat"><b>${s.exercises}</b><span>exercices</span></div>
      <div class="stat accent"><b>${s.bestStreak}</b><span>record régularité</span></div>
    </div>

    <div class="section-title">Records personnels <button class="btn xs" onclick="go('progress')">Tout voir</button></div>
    ${prs.length ? `<div class="card flush">${prs.map(r => `
      <div class="list-item" data-ex="${r.exId}">
        <div class="emoji">🏆</div>
        <div class="grow"><b>${esc(getExercise(r.exId).name)}</b>
          <span>${fmtWeight(r.weight)} × ${r.reps} reps · ${fmtDate(r.date)}</span></div>
        <span class="chip yellow">${fmtNum(r.e1rm)} 1RM</span>
      </div>`).join('')}</div>`
    : `<div class="card tiny muted center">Tes records apparaîtront ici après ta première séance.</div>`}

    <div class="section-title">Muscles des 7 derniers jours</div>
    <div class="bodies" id="homeBodies"></div>
    <div class="heat-legend"><span>Peu</span><div class="bar"></div><span>Beaucoup</span></div>
  `;

  renderBodyView($('#homeBodies', v), normalize(volumeByMuscle(sessionsInLastDays(7))), { uid: 'hm' });
  $$('[data-ex]', v).forEach(el => el.onclick = () => exerciseSheet(el.dataset.ex));
  $$('[data-sess]', v).forEach(el => el.onclick = () => sessionSheet(el.dataset.sess));
}

/** Suggère le programme le moins récemment fait. */
function suggestNextProgram() {
  if (!DB.programs.length) return null;
  const lastByProg = {};
  DB.sessions.forEach(s => { if (s.programId) lastByProg[s.programId] = s.date; });
  return DB.programs.slice().sort((a, b) =>
    (lastByProg[a.id] || '0000').localeCompare(lastByProg[b.id] || '0000'))[0];
}

/* ==================== PROGRESSION ==================== */
let progressExId = null;

function renderProgress() {
  const v = $('#view-progress');
  const usedIds = [...new Set(DB.sessions.flatMap(s => (s.entries || []).map(e => e.exId)))];
  if (!usedIds.length) {
    v.innerHTML = `<div class="empty"><div class="big">📈</div><b>Pas encore de données</b>
      <p class="tiny">Enregistre quelques séances : les courbes arrivent tout de suite après.</p></div>`;
    return;
  }
  if (!progressExId || !usedIds.includes(progressExId)) progressExId = usedIds[0];

  const hist = exerciseHistory(progressExId).filter(h => h.top);
  const prs = personalRecords();

  v.innerHTML = `
    <div class="section-title">Évolution des charges</div>
    <div class="card">
      <select id="progSel">${usedIds.map(id =>
        `<option value="${id}" ${id === progressExId ? 'selected' : ''}>${esc(getExercise(id).name)}</option>`).join('')}</select>
      ${hist.length > 1 ? `<div class="chart-box" style="margin-top:14px"><canvas id="chartWeight"></canvas></div>`
        : `<p class="tiny muted center" style="margin:16px 0 4px">Il faut au moins 2 séances sur cet exercice pour tracer une courbe.</p>`}
      ${hist.length ? (() => {
        const first = hist[0], last = hist[hist.length - 1];
        const diff = last.top - first.top;
        const pct = first.top ? Math.round(diff / first.top * 100) : 0;
        return `<div class="grid g3" style="margin-top:12px">
          <div class="stat"><b>${fmtNum(last.top)}</b><span>charge actuelle</span></div>
          <div class="stat ${diff >= 0 ? 'accent' : ''}"><b>${diff >= 0 ? '+' : ''}${fmtNum(diff)}</b><span>depuis le début</span></div>
          <div class="stat warm"><b>${pct >= 0 ? '+' : ''}${pct}%</b><span>progression</span></div>
        </div>`;
      })() : ''}
    </div>

    <div class="section-title">Volume par séance</div>
    <div class="card"><div class="chart-box sm"><canvas id="chartVolume"></canvas></div></div>

    <div class="section-title">Volume par groupe musculaire (30 j)</div>
    <div class="card" id="volGroups"></div>

    <div class="section-title">Tous les records</div>
    <div class="card flush">${prs.map(r => `
      <div class="list-item" data-ex="${r.exId}">
        <div class="emoji">🏆</div>
        <div class="grow"><b>${esc(getExercise(r.exId).name)}</b>
          <span>${fmtWeight(r.weight)} × ${r.reps} · ${fmtDate(r.date)}</span></div>
        <span class="chip yellow">${fmtNum(r.e1rm)}</span>
      </div>`).join('')}</div>`;

  $('#progSel', v).onchange = e => { progressExId = e.target.value; renderProgress(); };
  $$('[data-ex]', v).forEach(el => el.onclick = () => exerciseSheet(el.dataset.ex));

  if (hist.length > 1) lineChart('chartWeight', hist.map(h => fmtDate(h.date)), [
    { label: 'Charge max', data: hist.map(h => h.top), color: '#2B6BFF' },
    { label: '1RM estimé', data: hist.map(h => h.e1rm), color: '#FF2D8A', dash: true }
  ]);

  const last12 = DB.sessions.slice(-12);
  barChart('chartVolume', last12.map(s => fmtDate(s.date)), last12.map(s => Math.round(sessionVolume(s))), 'Volume (kg)');

  // Volume par groupe
  const byMuscle = volumeByMuscle(sessionsInLastDays(30));
  const byGroup = {};
  for (const m in byMuscle) byGroup[muscleGroup(m)] = (byGroup[muscleGroup(m)] || 0) + byMuscle[m];
  const maxG = Math.max(1, ...Object.values(byGroup));
  $('#volGroups', v).innerHTML = MUSCLE_GROUPS.filter(g => byGroup[g]).map(g => `
    <div class="vbar">
      <div class="lbl"><span>${g}</span><b class="muted">${fmtVolume(byGroup[g])}</b></div>
      <div class="track"><div class="fill" style="width:${byGroup[g] / maxG * 100}%"></div></div>
    </div>`).join('') || '<p class="tiny muted center">Aucune donnée sur 30 jours.</p>';
}

/* ==================== ANATOMIE ==================== */
let anatomyRange = 7;

function renderAnatomy() {
  const v = $('#view-anatomy');
  const sess = anatomyRange === 0 ? DB.sessions : sessionsInLastDays(anatomyRange);
  const raw = volumeByMuscle(sess);
  const heat = normalize(raw);
  const ranked = Object.entries(raw).filter(([m]) => m !== 'cardio').sort((a, b) => b[1] - a[1]);
  const cardioMin = cardioMinutes(sess);
  const worked = new Set(ranked.map(r => r[0]));
  const neglected = MUSCLE_IDS.filter(m => !worked.has(m));

  v.innerHTML = `
    <div class="section-title">Muscles sollicités
      <div class="row" style="gap:5px">
        ${[[7,'7 j'],[30,'30 j'],[0,'Tout']].map(([d, l]) =>
          `<button class="chip ${anatomyRange === d ? 'on' : ''}" data-range="${d}">${l}</button>`).join('')}
      </div>
    </div>
    <div class="card">
      <div class="bodies" id="anaBodies"></div>
      <div class="heat-legend"><span>Repos</span><div class="bar"></div><span>Intense</span></div>
      <p class="tiny muted center" style="margin:10px 0 0">Touche un muscle pour voir ce qui le travaille.</p>
    </div>

    <div class="section-title">Classement (${sess.length} séance${sess.length > 1 ? 's' : ''})</div>
    <div class="card">
      ${cardioMin ? `
        <div class="vbar" data-m="cardio">
          <div class="lbl"><span>❤️ Cardio</span><b class="muted">${cardioMin} min</b></div>
          <div class="track"><div class="fill" style="width:${Math.min(100, cardioMin / 30 * 100)}%;background:var(--grad-warm)"></div></div>
        </div>
        <div class="divider" style="margin:10px 0"></div>` : ''}
      ${ranked.length ? ranked.slice(0, 12).map(([m, val]) => `
      <div class="vbar" data-m="${m}">
        <div class="lbl"><span>${esc(muscleName(m))}</span><b class="muted">${fmtVolume(val)}</b></div>
        <div class="track"><div class="fill" style="width:${val / ranked[0][1] * 100}%"></div></div>
      </div>`).join('') : '<p class="tiny muted center">Aucun exercice de musculation sur cette période.</p>'}</div>

    ${neglected.length ? `
      <div class="section-title">Muscles négligés</div>
      <div class="card">
        <p class="tiny muted" style="margin:0 0 10px">Pas travaillés sur la période — touche pour trouver un exercice.</p>
        <div class="row wrap" style="gap:6px">
          ${neglected.map(m => `<button class="chip pink" data-m="${m}">${esc(muscleName(m))}</button>`).join('')}
        </div>
      </div>` : ''}`;

  renderBodyView($('#anaBodies', v), heat, { uid: 'an', interactive: true, onPick: muscleSheet });
  $$('[data-range]', v).forEach(b => b.onclick = () => { anatomyRange = +b.dataset.range; renderAnatomy(); });
  $$('[data-m]', v).forEach(el => el.onclick = () => muscleSheet(el.dataset.m));
}

function muscleSheet(mId) {
  const exs = allExercises().filter(e => (e.primary || []).includes(mId));
  const secondary = allExercises().filter(e => (e.secondary || []).includes(mId));
  const vol30 = volumeByMuscle(sessionsInLastDays(30))[mId] || 0;
  let lastDate = null;
  DB.sessions.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).some(s =>
    (s.entries || []).some(e => {
      const w = exerciseMuscleWeights(getExercise(e.exId));
      if (w[mId]) { lastDate = s.date; return true; }
      return false;
    }));

  openSheet(muscleName(mId), `
    <div class="grid g2" style="margin-bottom:14px">
      <div class="stat accent"><b>${mId === 'cardio' ? cardioMinutes(sessionsInLastDays(30)) + ' min' : fmtVolume(vol30)}</b><span>${mId === 'cardio' ? 'cardio 30 j' : 'volume 30 j'}</span></div>
      <div class="stat"><b>${lastDate ? relDate(lastDate) : '—'}</b><span>dernière fois</span></div>
    </div>
    <div class="section-title">Exercices principaux</div>
    <div class="card flush">${exs.map(e => `
      <div class="list-item" data-ex="${e.id}">
        <div class="emoji">${e.type === 'cardio' ? '🏃' : '🏋️'}</div>
        <div class="grow"><b>${esc(e.name)}</b><span>${esc(e.eq)}</span></div>
        <span class="chev">›</span>
      </div>`).join('') || '<div class="list-item tiny muted">Aucun</div>'}</div>
    ${secondary.length ? `<div class="section-title">En secondaire</div>
      <div class="row wrap" style="gap:6px">${secondary.map(e => `<span class="chip">${esc(e.name)}</span>`).join('')}</div>` : ''}
  `, body => $$('[data-ex]', body).forEach(el => el.onclick = () => exerciseSheet(el.dataset.ex)));
}

/* ==================== RÉGULARITÉ ==================== */
let calMonth = new Date();

function renderCalendar() {
  const v = $('#view-calendar');
  const s = stats();
  const y = calMonth.getFullYear(), m = calMonth.getMonth();
  const first = new Date(y, m, 1);
  const offset = (first.getDay() + 6) % 7;
  const days = new Date(y, m + 1, 0).getDate();
  const byDate = {};
  DB.sessions.forEach(x => (byDate[x.date] = byDate[x.date] || []).push(x));

  let cells = '';
  for (let i = 0; i < offset; i++) cells += '<div class="day void"></div>';
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    cells += `<div class="day ${byDate[iso] ? 'on' : ''} ${iso === todayISO() ? 'today' : ''}" data-day="${iso}">${d}</div>`;
  }

  // 26 semaines glissantes
  const grid = [];
  for (let i = 181; i >= 0; i--) {
    const d = new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate() - i);
    const iso = todayISO(d);
    const n = (byDate[iso] || []).length;
    grid.push(`<i class="${n ? 'l' + Math.min(4, n + 1) : ''}" title="${iso}"></i>`);
  }

  v.innerHTML = `
    <div class="grid g3">
      <div class="stat accent"><b>${s.streak}</b><span>semaines d'affilée</span></div>
      <div class="stat warm"><b>${s.bestStreak}</b><span>record</span></div>
      <div class="stat"><b>${s.month}</b><span>ce mois-ci</span></div>
    </div>

    <div class="section-title">
      <button class="btn xs" id="calPrev">‹</button>
      ${MONTHS[m]} ${y}
      <button class="btn xs" id="calNext">›</button>
    </div>
    <div class="card">
      <div class="cal">
        ${['L','M','M','J','V','S','D'].map(d => `<div class="dow">${d}</div>`).join('')}
        ${cells}
      </div>
    </div>

    <div class="section-title">6 derniers mois</div>
    <div class="card"><div class="streak-grid">${grid.join('')}</div></div>

    <div class="section-title">Historique</div>
    ${DB.sessions.length ? `<div class="card flush">${DB.sessions.slice().reverse().slice(0, 30).map(x => `
      <div class="list-item" data-sess="${x.id}">
        <div class="emoji">${x.emoji || '🏋️'}</div>
        <div class="grow"><b>${esc(x.programName)}</b>
          <span>${fmtDate(x.date, true)} · ${fmtVolume(sessionVolume(x))} · ${fmtDur(x.durationSec || 0)}</span></div>
        <span class="chev">›</span>
      </div>`).join('')}</div>`
      : '<div class="empty tiny">Aucune séance enregistrée.</div>'}`;

  $('#calPrev', v).onclick = () => { calMonth = new Date(y, m - 1, 1); renderCalendar(); };
  $('#calNext', v).onclick = () => { calMonth = new Date(y, m + 1, 1); renderCalendar(); };
  $$('[data-sess]', v).forEach(el => el.onclick = () => sessionSheet(el.dataset.sess));
  $$('[data-day]', v).forEach(el => el.onclick = () => daySheet(el.dataset.day, byDate[el.dataset.day] || []));
}

/* ==================== FICHES ==================== */
/** Ce qui a été fait un jour donné — et de quoi le compléter après coup. */
function daySheet(dateISO, list) {
  openSheet(fmtDate(dateISO, true), `
    ${list.length ? `<div class="card flush">${list.map(x => `
      <div class="list-item" data-sess="${x.id}">
        <div class="emoji">${x.emoji || '🏋️'}</div>
        <div class="grow"><b>${esc(x.programName)}</b>
          <span>${fmtVolume(sessionVolume(x))} · ${(x.entries || []).length} exercices</span></div>
        <span class="chev">›</span>
      </div>`).join('')}</div>`
      : `<p class="tiny muted" style="margin-top:0">Rien d'enregistré ce jour-là.</p>`}
    <button class="btn primary block" id="dayAdd" style="margin-top:12px">
      ＋ ${list.length ? 'Ajouter une autre séance' : 'Noter une séance ce jour-là'}
    </button>
  `, body => {
    $$('[data-sess]', body).forEach(el => el.onclick = () => sessionSheet(el.dataset.sess));
    $('#dayAdd', body).onclick = () => pickProgramForDate(dateISO);
  });
}

/** Choix du programme pour une séance saisie a posteriori. */
function pickProgramForDate(dateISO) {
  openSheet(`Séance du ${fmtDate(dateISO)}`, `
    <p class="tiny muted" style="margin-top:0">Quel programme as-tu fait ?
    Tu pourras ensuite ajuster les charges, ajouter ou retirer des exercices.</p>
    <div class="card flush">
      ${DB.programs.map(p => `
        <div class="list-item" data-prog="${p.id}">
          <div class="emoji">${p.emoji || '🏋️'}</div>
          <div class="grow"><b>${esc(p.name)}</b><span>${programSummary(p).exercises} exercices</span></div>
          <span class="chev">›</span>
        </div>`).join('')}
      <div class="list-item" data-prog="">
        <div class="emoji">⚡</div>
        <div class="grow"><b>Séance libre</b><span>Je choisis les exercices</span></div>
        <span class="chev">›</span>
      </div>
    </div>
  `, body => {
    $$('[data-prog]', body).forEach(el => el.onclick = () => {
      closeSheet();
      startSession(el.dataset.prog || null, dateISO);
      go('session');
      toast('Complète ta séance, puis enregistre-la', 'ok');
    });
  });
}
function sessionSheet(id) {
  const s = DB.sessions.find(x => x.id === id);
  if (!s) return;
  openSheet(`${s.emoji || '🏋️'} ${s.programName}`, `
    <p class="tiny muted" style="margin-top:0">${fmtDate(s.date, true)} · ${fmtDur(s.durationSec || 0)} · ${fmtVolume(sessionVolume(s))}</p>
    ${(s.entries || []).map(e => {
      const ex = getExercise(e.exId);
      if (e.cardio) return `<div class="card"><b>${esc(ex.name)}</b>
        <div class="tiny muted">${e.cardio.durationMin} min · ${e.cardio.incline}% de pente · ${e.cardio.speed} km/h</div></div>`;
      return `<div class="card"><b>${esc(ex.name)}</b>
        <div class="tiny muted" style="margin:2px 0 8px">${esc(muscleLine(ex))}</div>
        <div class="row wrap" style="gap:6px">${(e.sets || []).filter(x => x.done !== false)
          .map(x => `<span class="chip cyan">${fmtNum(x.weight)} × ${x.reps}</span>`).join('')}</div></div>`;
    }).join('')}
    ${s.note ? `<div class="card tiny">📝 ${esc(s.note)}</div>` : ''}
    <div class="section-title">Muscles travaillés</div>
    <div class="bodies" id="shBodies"></div>
    <div class="row" style="gap:8px;margin-top:16px">
      <button class="btn primary block" id="shEdit">✏️ Corriger cette séance</button>
      <button class="btn danger" id="shDel">🗑</button>
    </div>
  `, body => {
    renderBodyView($('#shBodies', body), normalize(volumeByMuscle([s])), { uid: 'sh' });
    $('#shEdit', body).onclick = () => {
      closeSheet();
      editSession(id);
      go('session');
      toast('Modifie puis enregistre à nouveau', 'ok');
    };
    $('#shDel', body).onclick = () => confirmSheet('Supprimer ?', 'Cette séance sera définitivement effacée.', 'Supprimer', () => {
      deleteSession(id); renderAll(); toast('Séance supprimée');
    }, true);
  });
}

function exerciseSheet(exId) {
  const ex = getExercise(exId);
  const hist = exerciseHistory(exId).filter(h => h.top);
  const pr = prFor(exId);
  openSheet(ex.name, `
    <div class="row wrap" style="gap:6px;margin-bottom:12px">
      <span class="chip">${esc(ex.eq || '—')}</span>
      ${(ex.primary || []).map(m => `<span class="chip on">${esc(muscleName(m))}</span>`).join('')}
      ${(ex.secondary || []).map(m => `<span class="chip">${esc(muscleName(m))}</span>`).join('')}
    </div>
    ${pr ? `<div class="grid g3" style="margin-bottom:12px">
      <div class="stat warm"><b>${fmtNum(pr.weight)}</b><span>record (${DB.settings.unit})</span></div>
      <div class="stat"><b>${pr.reps}</b><span>reps</span></div>
      <div class="stat accent"><b>${fmtNum(pr.e1rm)}</b><span>1RM estimé</span></div>
    </div>` : ''}
    ${hist.length > 1 ? `<div class="chart-box sm"><canvas id="exChart"></canvas></div>` : '<p class="tiny muted center">Pas encore assez d\'historique.</p>'}
    <div class="section-title">Muscles ciblés
      <button class="btn xs" id="exEditMuscles">✏️ Modifier</button>
    </div>
    ${muscleOverride(exId) ? '<p class="tiny muted" style="margin:0 0 8px">Muscles définis par toi.</p>' : ''}
    <div class="bodies" id="exBodies"></div>
    ${hist.length ? `<div class="section-title">Historique</div>
      <div class="card flush">${hist.slice().reverse().slice(0, 10).map(h => `
        <div class="list-item"><div class="emoji">📅</div>
          <div class="grow"><b>${fmtNum(h.top)} ${DB.settings.unit} × ${h.reps}</b>
            <span>${fmtDate(h.date, true)} · ${h.sets} séries · ${fmtVolume(h.volume)}</span></div>
        </div>`).join('')}</div>` : ''}
  `, body => {
    renderBodyView($('#exBodies', body), heatFromExercises([ex]), { uid: 'ex' });
    $('#exEditMuscles', body).onclick = () => muscleEditorSheet(exId);
    if (hist.length > 1) lineChart('exChart', hist.map(h => fmtDate(h.date)),
      [{ label: 'Charge', data: hist.map(h => h.top), color: '#FFC531' }]);
  });
}

/* ---------------- Éditeur des muscles d'un exercice ---------------- */
function muscleEditorSheet(exId) {
  const ex = getExercise(exId);
  const sel = {
    primary: [...(ex.primary || [])].filter(m => m !== 'cardio'),
    secondary: [...(ex.secondary || [])].filter(m => m !== 'cardio')
  };

  openSheet(`Muscles — ${ex.name}`, `
    <p class="tiny muted" style="margin-top:0">
      Touche une zone du corps : elle passe en <b style="color:#FF2D8A">principal</b>,
      puis en <b style="color:#22D3EE">secondaire</b>, puis s'éteint.
      Bascule Face / Dos pour atteindre tous les muscles.
    </p>
    <div class="bodies" id="meBody"></div>
    <div class="row wrap" style="gap:6px;margin-top:12px" id="meList"></div>
    <div class="row" style="gap:8px;margin-top:16px">
      <button class="btn ghost" id="meReset">↺ Par défaut</button>
      <button class="btn primary block" id="meSave">Enregistrer</button>
    </div>
  `, body => {
    const list = $('#meList', body);
    const drawList = () => {
      list.innerHTML = sel.primary.map(m => `<span class="chip pink">${esc(muscleName(m))}</span>`).join('')
        + sel.secondary.map(m => `<span class="chip cyan">${esc(muscleName(m))}</span>`).join('')
        || '<span class="tiny muted">Aucun muscle sélectionné.</span>';
    };
    renderMusclePicker($('#meBody', body), sel, drawList);
    drawList();

    $('#meSave', body).onclick = () => {
      setMuscleOverride(exId, sel.primary, sel.secondary);
      closeSheet(); renderAll();
      toast('Muscles enregistrés 💪', 'ok');
    };
    $('#meReset', body).onclick = () => {
      clearMuscleOverride(exId);
      closeSheet(); renderAll();
      toast('Muscles remis par défaut');
    };
  });
}

/* ==================== PARAMÈTRES ==================== */
function renderSettings() {
  const v = $('#view-settings');
  const st = DB.settings;
  v.innerHTML = `
    <div class="section-title">Entraînement</div>
    <div class="card">
      <div class="field"><label>Objectif de séances par semaine</label>
        <input type="number" id="stGoal" value="${st.goalPerWeek}"></div>
      <div class="field"><label>Repos par défaut (secondes)</label>
        <input type="number" id="stRest" value="${st.restDefault}"></div>
      <div class="row between" style="margin:14px 0">
        <div><b>Progression automatique</b>
          <div class="tiny muted">Monte la charge quand toutes les séries sont bouclées</div></div>
        <div class="switch ${st.autoProgress ? 'on' : ''}" id="stAuto"></div>
      </div>
      <div class="grid g2">
        <div class="field"><label>Incrément haut du corps</label><input type="number" step="0.5" id="stIncU" value="${st.incUpper}"></div>
        <div class="field"><label>Incrément bas du corps</label><input type="number" step="0.5" id="stIncL" value="${st.incLower}"></div>
      </div>
    </div>

    <div class="section-title">Retours</div>
    <div class="card">
      <div class="row between" style="margin-bottom:12px">
        <div><b>Son de fin de repos</b></div><div class="switch ${st.sound ? 'on' : ''}" id="stSound"></div>
      </div>
      <div class="row between">
        <div><b>Vibration</b></div><div class="switch ${st.vibrate ? 'on' : ''}" id="stVib"></div>
      </div>
    </div>

    <div class="section-title">Données</div>
    <div class="card">
      <p class="tiny muted" style="margin-top:0">Tout est stocké sur cet appareil, sans compte ni serveur.
      Pense à exporter une sauvegarde de temps en temps.</p>
      <div class="grid g2">
        <button class="btn" id="stExport">⬇︎ Exporter</button>
        <button class="btn" id="stImport">⬆︎ Importer</button>
      </div>
      <div class="divider"></div>
      <div class="row between tiny muted">
        <span>${DB.sessions.length} séances · ${DB.programs.length} programmes</span>
        <span>${Math.round((localStorage.getItem(DB_KEY) || '').length / 1024)} Ko</span>
      </div>
      <button class="btn danger block" style="margin-top:12px" id="stReset">Tout réinitialiser</button>
    </div>

    <div class="section-title">Installer sur l'iPhone</div>
    <div class="card tiny muted">
      Safari ▸ bouton <b>Partager</b> ▸ <b>Sur l'écran d'accueil</b>.
      L'app s'ouvre alors en plein écran et fonctionne <b>hors ligne</b>, même sans réseau à la salle.
    </div>

    <div class="card center tiny muted">
      <img src="icons/icon-192.png" width="64" height="64" style="border-radius:16px;margin-bottom:8px" alt="">
      <div><b style="color:var(--txt)">Gym Hero</b> · v1.0</div>
      <div>Fait pour la salle, pas pour le cloud.</div>
    </div>`;

  const num = (id, key) => $(id, v).onchange = e => { DB.settings[key] = Number(e.target.value) || 0; save(); };
  num('#stGoal', 'goalPerWeek'); num('#stRest', 'restDefault');
  num('#stIncU', 'incUpper'); num('#stIncL', 'incLower');
  const sw = (id, key) => $(id, v).onclick = e => {
    DB.settings[key] = !DB.settings[key]; save();
    e.currentTarget.classList.toggle('on', DB.settings[key]);
  };
  sw('#stAuto', 'autoProgress'); sw('#stSound', 'sound'); sw('#stVib', 'vibrate');

  $('#stExport', v).onclick = () => {
    const blob = new Blob([exportJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gym-hero-${todayISO()}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    toast('Sauvegarde exportée ✅', 'ok');
  };
  $('#stImport', v).onclick = () => {
    const inp = document.createElement('input');
    inp.type = 'file'; inp.accept = 'application/json,.json';
    inp.onchange = () => {
      const f = inp.files[0]; if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try { importJSON(r.result); renderAll(); toast('Données importées ✅', 'ok'); }
        catch (err) { toast('Fichier illisible', 'warn'); }
      };
      r.readAsText(f);
    };
    inp.click();
  };
  $('#stReset', v).onclick = () => confirmSheet('Tout effacer ?',
    'Séances, programmes et records seront supprimés définitivement. Exporte une sauvegarde avant !', 'Tout effacer', () => {
      localStorage.removeItem(DB_KEY); DB = null; load(); renderAll(); go('home'); toast('Application réinitialisée');
    }, true);
}

/* ==================== GRAPHIQUES ==================== */
function chartBase() {
  Chart.defaults.color = '#8A97B8';
  Chart.defaults.font.family = '-apple-system,system-ui,sans-serif';
  Chart.defaults.font.size = 11;
  return {
    responsive: true, maintainAspectRatio: false,
    interaction: { intersect: false, mode: 'index' },
    plugins: { legend: { display: true, labels: { boxWidth: 10, boxHeight: 10, usePointStyle: true, padding: 14 } } },
    scales: {
      x: { grid: { color: 'rgba(36,46,74,.6)' }, ticks: { maxRotation: 0, autoSkipPadding: 14 } },
      y: { grid: { color: 'rgba(36,46,74,.6)' }, beginAtZero: false }
    }
  };
}
function lineChart(id, labels, series) {
  const el = document.getElementById(id); if (!el) return;
  if (charts[id]) charts[id].destroy();
  charts[id] = new Chart(el, {
    type: 'line',
    data: { labels, datasets: series.map(s => ({
      label: s.label, data: s.data, borderColor: s.color,
      backgroundColor: s.color + '22', fill: !s.dash, tension: 0.32,
      borderDash: s.dash ? [5, 4] : [], pointRadius: 3, pointBackgroundColor: s.color, borderWidth: 2.5
    })) },
    options: chartBase()
  });
}
function barChart(id, labels, data, label) {
  const el = document.getElementById(id); if (!el) return;
  if (charts[id]) charts[id].destroy();
  const opts = chartBase();
  opts.scales.y.beginAtZero = true;
  opts.plugins.legend.display = false;
  charts[id] = new Chart(el, {
    type: 'bar',
    data: { labels, datasets: [{ label, data, backgroundColor: '#2B6BFF', hoverBackgroundColor: '#FF2D8A', borderRadius: 6, maxBarThickness: 34 }] },
    options: opts
  });
}

/* ==================== INIT ==================== */
function init() {
  load();
  $$('#nav button').forEach(b => b.onclick = () => go(b.dataset.tab));
  $('#btnSettings').onclick = () => go('settings');
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeSheet(); });
  go('home');
  renderAll();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
}
document.addEventListener('DOMContentLoaded', init);
