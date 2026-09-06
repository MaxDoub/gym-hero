/* Gym Hero — Catalogue d'exercices
   primary  : muscles principaux  (poids 1.0 dans le calcul de volume musculaire)
   secondary: muscles secondaires (poids 0.4)
   type     : 'strength' (séries/reps/charge) ou 'cardio' (durée/vitesse/pente)
   region   : sert au filtrage rapide et aux suggestions de programme            */

const EXERCISE_LIBRARY = [
  /* ---------- JAMBES : machines (les tiennes en premier) ---------- */
  { id:'leg_press',      name:'Presse à cuisses',        eq:'Machine',   region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['hamstrings','adductors'] },
  { id:'leg_curl',       name:'Leg curl (assis/allongé)',eq:'Machine',   region:'Jambes', type:'strength', primary:['hamstrings'],                secondary:['calves','glutes'] },
  { id:'leg_extension',  name:'Leg extension',           eq:'Machine',   region:'Jambes', type:'strength', primary:['quads'],                     secondary:[] },
  { id:'hip_abductor',   name:'Hip abductor (écarté)',   eq:'Machine',   region:'Jambes', type:'strength', primary:['abductors','glutes'],        secondary:['lower_back'] },
  { id:'hip_adductor',   name:'Hip adductor (serré)',    eq:'Machine',   region:'Jambes', type:'strength', primary:['adductors'],                 secondary:['quads'] },
  { id:'hack_squat',     name:'Hack squat',              eq:'Machine',   region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['hamstrings'] },
  { id:'calf_raise',     name:'Mollets debout',          eq:'Machine',   region:'Jambes', type:'strength', primary:['calves'],                    secondary:[] },
  { id:'calf_seated',    name:'Mollets assis',           eq:'Machine',   region:'Jambes', type:'strength', primary:['calves'],                    secondary:[] },
  { id:'glute_bridge',   name:'Hip thrust',              eq:'Barre',     region:'Jambes', type:'strength', primary:['glutes'],                    secondary:['hamstrings','lower_back'] },

  /* ---------- JAMBES : poids libres ---------- */
  { id:'squat',          name:'Squat barre',             eq:'Barre',     region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['hamstrings','lower_back','abs','adductors'] },
  { id:'front_squat',    name:'Squat avant',             eq:'Barre',     region:'Jambes', type:'strength', primary:['quads'],                     secondary:['glutes','abs','mid_back'] },
  { id:'deadlift',       name:'Soulevé de terre',        eq:'Barre',     region:'Jambes', type:'strength', primary:['hamstrings','glutes','lower_back'], secondary:['traps','lats','forearms','quads'] },
  { id:'rdl',            name:'Soulevé de terre roumain',eq:'Barre',     region:'Jambes', type:'strength', primary:['hamstrings','glutes'],       secondary:['lower_back','forearms'] },
  { id:'lunge',          name:'Fentes',                  eq:'Haltères',  region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['hamstrings','abductors'], unilateral:true },
  { id:'bulgarian',      name:'Fente bulgare',           eq:'Haltères',  region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['hamstrings','abductors'], unilateral:true },
  { id:'goblet_squat',   name:'Goblet squat',            eq:'Haltère',   region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['abs','adductors'] },
  { id:'step_up',        name:'Montée sur banc',         eq:'Haltères',  region:'Jambes', type:'strength', primary:['quads','glutes'],            secondary:['calves'], unilateral:true },

  /* ---------- POITRINE ---------- */
  { id:'bench_press',    name:'Développé couché',        eq:'Barre',     region:'Poitrine', type:'strength', primary:['chest'],                   secondary:['triceps','front_delts'] },
  { id:'incline_bench',  name:'Développé incliné',       eq:'Barre',     region:'Poitrine', type:'strength', primary:['chest','front_delts'],     secondary:['triceps'] },
  { id:'db_bench',       name:'Développé couché haltères',eq:'Haltères', region:'Poitrine', type:'strength', primary:['chest'],                   secondary:['triceps','front_delts'] },
  { id:'db_incline',     name:'Développé incliné haltères',eq:'Haltères',region:'Poitrine', type:'strength', primary:['chest','front_delts'],     secondary:['triceps'] },
  { id:'chest_press',    name:'Développé machine',       eq:'Machine',   region:'Poitrine', type:'strength', primary:['chest'],                   secondary:['triceps','front_delts'] },
  { id:'pec_deck',       name:'Pec deck / Butterfly',    eq:'Machine',   region:'Poitrine', type:'strength', primary:['chest'],                   secondary:['front_delts'] },
  { id:'cable_fly',      name:'Écarté à la poulie',      eq:'Poulie',    region:'Poitrine', type:'strength', primary:['chest'],                   secondary:['front_delts'] },
  { id:'dips',           name:'Dips',                    eq:'Poids du corps', region:'Poitrine', type:'strength', primary:['chest','triceps'],    secondary:['front_delts'] },
  { id:'pushup',         name:'Pompes',                  eq:'Poids du corps', region:'Poitrine', type:'strength', primary:['chest'],              secondary:['triceps','front_delts','abs'] },

  /* ---------- DOS ---------- */
  { id:'pullup',         name:'Traction',                eq:'Poids du corps', region:'Dos', type:'strength', primary:['lats'],                    secondary:['biceps','mid_back','forearms'] },
  { id:'lat_pulldown',   name:'Tirage vertical',         eq:'Poulie',    region:'Dos', type:'strength', primary:['lats'],                         secondary:['biceps','mid_back','rear_delts'] },
  { id:'seated_row',     name:'Tirage horizontal',       eq:'Poulie',    region:'Dos', type:'strength', primary:['mid_back','lats'],              secondary:['biceps','rear_delts','forearms'] },
  { id:'barbell_row',    name:'Rowing barre',            eq:'Barre',     region:'Dos', type:'strength', primary:['lats','mid_back'],              secondary:['biceps','lower_back','rear_delts'] },
  { id:'db_row',         name:'Rowing haltère',          eq:'Haltère',   region:'Dos', type:'strength', primary:['lats','mid_back'],              secondary:['biceps','rear_delts'], unilateral:true },
  { id:'t_bar_row',      name:'Rowing T-bar',            eq:'Machine',   region:'Dos', type:'strength', primary:['mid_back','lats'],              secondary:['biceps','lower_back'] },
  { id:'machine_row',    name:'Rowing machine',          eq:'Machine',   region:'Dos', type:'strength', primary:['mid_back','lats'],              secondary:['biceps','rear_delts'] },
  { id:'pullover',       name:'Pullover',                eq:'Poulie',    region:'Dos', type:'strength', primary:['lats'],                         secondary:['chest','triceps'] },
  { id:'shrug',          name:'Shrug (haussement)',      eq:'Haltères',  region:'Dos', type:'strength', primary:['traps'],                        secondary:['forearms'] },
  { id:'back_extension', name:'Extension lombaire',      eq:'Machine',   region:'Dos', type:'strength', primary:['lower_back'],                   secondary:['glutes','hamstrings'] },
  { id:'face_pull',      name:'Face pull',               eq:'Poulie',    region:'Dos', type:'strength', primary:['rear_delts','mid_back'],        secondary:['traps'] },

  /* ---------- ÉPAULES ---------- */
  { id:'ohp',            name:'Développé militaire',     eq:'Barre',     region:'Épaules', type:'strength', primary:['front_delts','side_delts'], secondary:['triceps','traps','abs'] },
  { id:'db_shoulder',    name:'Développé épaules haltères',eq:'Haltères',region:'Épaules', type:'strength', primary:['front_delts','side_delts'], secondary:['triceps'] },
  { id:'lateral_raise',  name:'Élévations latérales',    eq:'Haltères',  region:'Épaules', type:'strength', primary:['side_delts'],               secondary:['traps'] },
  { id:'front_raise',    name:'Élévations frontales',    eq:'Haltères',  region:'Épaules', type:'strength', primary:['front_delts'],              secondary:['chest'] },
  { id:'rear_delt_fly',  name:'Oiseau (rear delts)',     eq:'Haltères',  region:'Épaules', type:'strength', primary:['rear_delts'],               secondary:['mid_back','traps'] },
  { id:'upright_row',    name:'Rowing menton',           eq:'Barre',     region:'Épaules', type:'strength', primary:['side_delts','traps'],       secondary:['biceps'] },

  /* ---------- BRAS ---------- */
  { id:'barbell_curl',   name:'Curl barre',              eq:'Barre',     region:'Bras', type:'strength', primary:['biceps'],                      secondary:['forearms'] },
  { id:'db_curl',        name:'Curl haltères',           eq:'Haltères',  region:'Bras', type:'strength', primary:['biceps'],                      secondary:['forearms'] },
  { id:'hammer_curl',    name:'Curl marteau',            eq:'Haltères',  region:'Bras', type:'strength', primary:['biceps','forearms'],           secondary:[] },
  { id:'preacher_curl',  name:'Curl pupitre',            eq:'Machine',   region:'Bras', type:'strength', primary:['biceps'],                      secondary:['forearms'] },
  { id:'cable_curl',     name:'Curl poulie',             eq:'Poulie',    region:'Bras', type:'strength', primary:['biceps'],                      secondary:['forearms'] },
  { id:'triceps_pushdown',name:'Extension triceps poulie',eq:'Poulie',   region:'Bras', type:'strength', primary:['triceps'],                     secondary:[] },
  { id:'skull_crusher',  name:'Barre au front',          eq:'Barre',     region:'Bras', type:'strength', primary:['triceps'],                     secondary:['front_delts'] },
  { id:'overhead_ext',   name:'Extension triceps nuque', eq:'Haltère',   region:'Bras', type:'strength', primary:['triceps'],                     secondary:[] },
  { id:'close_grip',     name:'Développé prise serrée',  eq:'Barre',     region:'Bras', type:'strength', primary:['triceps','chest'],             secondary:['front_delts'] },
  { id:'wrist_curl',     name:'Curl poignets',           eq:'Haltères',  region:'Bras', type:'strength', primary:['forearms'],                    secondary:[] },

  /* ---------- TRONC ---------- */
  { id:'plank',          name:'Gainage (planche)',       eq:'Poids du corps', region:'Tronc', type:'strength', primary:['abs'],                   secondary:['obliques','lower_back'], timed:true },
  { id:'crunch',         name:'Crunch',                  eq:'Poids du corps', region:'Tronc', type:'strength', primary:['abs'],                   secondary:['obliques'] },
  { id:'cable_crunch',   name:'Crunch poulie',           eq:'Poulie',    region:'Tronc', type:'strength', primary:['abs'],                        secondary:['obliques'] },
  { id:'leg_raise',      name:'Relevé de jambes',        eq:'Poids du corps', region:'Tronc', type:'strength', primary:['abs'],                   secondary:['obliques','quads'] },
  { id:'russian_twist',  name:'Russian twist',           eq:'Haltère',   region:'Tronc', type:'strength', primary:['obliques'],                   secondary:['abs'] },
  { id:'ab_machine',     name:'Machine abdos',           eq:'Machine',   region:'Tronc', type:'strength', primary:['abs'],                        secondary:['obliques'] },
  { id:'side_plank',     name:'Gainage latéral',         eq:'Poids du corps', region:'Tronc', type:'strength', primary:['obliques'],              secondary:['abs'], timed:true },

  /* ---------- CARDIO ---------- */
  { id:'treadmill',      name:'Tapis de course',         eq:'Cardio',    region:'Cardio', type:'cardio', primary:['cardio'],                      secondary:['quads','calves','hamstrings'] },
  { id:'bike',           name:'Vélo',                    eq:'Cardio',    region:'Cardio', type:'cardio', primary:['cardio'],                      secondary:['quads','calves'] },
  { id:'elliptical',     name:'Elliptique',              eq:'Cardio',    region:'Cardio', type:'cardio', primary:['cardio'],                      secondary:['quads','glutes','calves'] },
  { id:'rower',          name:'Rameur',                  eq:'Cardio',    region:'Cardio', type:'cardio', primary:['cardio'],                      secondary:['lats','mid_back','quads','biceps'] },
  { id:'stairmaster',    name:'Escalier / Stairmaster',  eq:'Cardio',    region:'Cardio', type:'cardio', primary:['cardio'],                      secondary:['glutes','quads','calves'] },
  { id:'jump_rope',      name:'Corde à sauter',          eq:'Cardio',    region:'Cardio', type:'cardio', primary:['cardio'],                      secondary:['calves'] }
];

const SECONDARY_WEIGHT = 0.4;

/** Muscles d'un exercice pondérés : { muscleId: poids } */
function exerciseMuscleWeights(ex) {
  const out = {};
  (ex.primary || []).forEach(m => { out[m] = 1; });
  (ex.secondary || []).forEach(m => { if (!out[m]) out[m] = SECONDARY_WEIGHT; });
  return out;
}
