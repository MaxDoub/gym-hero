/* Gym Hero — Référentiel des muscles
   Chaque id correspond à une zone du SVG anatomique (js/anatomy.js). */

const MUSCLES = {
  neck:       { fr: 'Cou',                 group: 'Haut du corps', view: 'both'  },
  traps:      { fr: 'Trapèzes',            group: 'Dos',           view: 'back'  },
  front_delts:{ fr: 'Épaules (avant)',     group: 'Épaules',       view: 'front' },
  side_delts: { fr: 'Épaules (latéral)',   group: 'Épaules',       view: 'both'  },
  rear_delts: { fr: 'Épaules (arrière)',   group: 'Épaules',       view: 'back'  },
  chest:      { fr: 'Pectoraux',           group: 'Poitrine',      view: 'front' },
  lats:       { fr: 'Grand dorsal',        group: 'Dos',           view: 'back'  },
  mid_back:   { fr: 'Milieu du dos',       group: 'Dos',           view: 'back'  },
  lower_back: { fr: 'Lombaires',           group: 'Dos',           view: 'back'  },
  biceps:     { fr: 'Biceps',              group: 'Bras',          view: 'front' },
  triceps:    { fr: 'Triceps',             group: 'Bras',          view: 'back'  },
  forearms:   { fr: 'Avant-bras',          group: 'Bras',          view: 'both'  },
  abs:        { fr: 'Abdominaux',          group: 'Tronc',         view: 'front' },
  obliques:   { fr: 'Obliques',            group: 'Tronc',         view: 'front' },
  glutes:     { fr: 'Fessiers',            group: 'Jambes',        view: 'back'  },
  quads:      { fr: 'Quadriceps',          group: 'Jambes',        view: 'front' },
  hamstrings: { fr: 'Ischio-jambiers',     group: 'Jambes',        view: 'back'  },
  adductors:  { fr: 'Adducteurs',          group: 'Jambes',        view: 'front' },
  abductors:  { fr: 'Abducteurs',          group: 'Jambes',        view: 'both'  },
  calves:     { fr: 'Mollets',             group: 'Jambes',        view: 'back'  },
  cardio:     { fr: 'Cardio',              group: 'Cardio',        view: 'none'  }
};

const MUSCLE_IDS = Object.keys(MUSCLES);

/** Groupes affichés dans les filtres et les stats. */
const MUSCLE_GROUPS = ['Poitrine', 'Dos', 'Épaules', 'Bras', 'Jambes', 'Tronc', 'Cardio'];

function muscleName(id) { return MUSCLES[id] ? MUSCLES[id].fr : id; }
function muscleGroup(id) { return MUSCLES[id] ? MUSCLES[id].group : 'Autre'; }
