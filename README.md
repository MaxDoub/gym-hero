# 🏋️ Gym Hero — v1.0

Suivi de musculation **100 % hors ligne**, sans compte ni serveur : tout reste sur ton téléphone.
HTML/CSS/JavaScript vanilla + Chart.js, installable comme une app native sur iPhone (PWA).

---

## Installer sur l'iPhone

1. Publier le dossier sur un hébergement statique en **HTTPS** (GitHub Pages, Netlify, Cloudflare Pages…).
2. Ouvrir l'adresse dans **Safari** (pas Chrome : seul Safari sait installer une PWA sur iOS).
3. Bouton **Partager** ▸ **Sur l'écran d'accueil**.

L'app s'ouvre alors en plein écran, avec ton icône, et **fonctionne sans réseau** —
pratique dans les sous-sols de salle de sport.

### Publier sur GitHub Pages

```bash
git init && git add . && git commit -m "Gym Hero v1"
git branch -M main
git remote add origin https://github.com/<ton-compte>/gym-hero.git
git push -u origin main
```

Puis dans le dépôt : **Settings ▸ Pages ▸ Source : branche `main`, dossier `/root`**.
L'adresse sera `https://<ton-compte>.github.io/gym-hero/`.

### Tester en local

```bash
python3 -m http.server 8777
```

Puis <http://127.0.0.1:8777>. (Ouvrir `index.html` par double-clic ne suffit pas :
le mode hors ligne exige un vrai serveur.)

---

## Comment fonctionne le corps interactif

Les deux planches `assets/body-front.png` et `assets/body-back.png` ont un fond
transparent. L'app les empile en deux couches :

1. les zones musculaires colorées (`js/anatomy.js`), **découpées par la planche
   elle-même** grâce à un masque CSS : rien ne peut déborder du corps ;
2. la planche par-dessus, inversée et fusionnée en `screen`, ce qui transforme
   ses traits noirs en traits blancs lisibles sur le thème sombre.

Pour déplacer une zone, ouvre `tools/calibrate.html` : il affiche la planche
avec une grille de coordonnées, dans le même repère que `js/anatomy.js`
(720 × 1080, axe de symétrie à x = 360). Les zones latérales ne sont définies
qu'une fois, pour la moitié gauche : l'autre côté est un reflet automatique.

Si tu remplaces les planches, garde le même cadrage, sinon toutes les zones
sont à recaler.

---

## Mettre à jour l'app publiée

Les fichiers sont appelés avec un numéro de version (`js/app.js?v=4`). À chaque
publication, incrémente ce numéro **dans `index.html` et dans `sw.js`**, ainsi
que `CACHE` dans `sw.js` : sans ça, navigateurs et téléphones déjà installés
continuent de servir l'ancienne version depuis leur cache.

---

## Mettre ton vrai logo

L'icône d'origine est en place, en 8 tailles dans `icons/`, et s'affiche à droite
de l'en-tête ainsi que dans les Paramètres.

Pour en changer : `tools/icons.html` régénère toutes les tailles à partir d'un
PNG carré (1024×1024 de préférence), à replacer dans `icons/`. Incrémente ensuite
`CACHE` dans `sw.js`.

---

## Ce que fait l'app

| Onglet | Contenu |
|---|---|
| **Accueil** | Séances (total / semaine / mois / année), objectif hebdo, dernière activité, volume total, records, muscles des 7 derniers jours |
| **Programmes** | Séances types réutilisables (Jambes, Push, Pull…), édition des séries/reps/charges, aperçu des muscles ciblés |
| **Séance** | Exécution guidée : cases à cocher, chrono de repos, ajout/retrait d'exercice à la volée, détection de record en direct |
| **Progrès** | Courbes de charge et de 1RM estimé, volume par séance, volume par groupe musculaire, tous les records |
| **Anatomie** | Planche anatomique face **ou** dos (bascule par onglet), muscles colorés selon le volume travaillé (7 j / 30 j / tout), muscles négligés |
| **Régularité** | Calendrier mensuel, 6 derniers mois en damier, séries de semaines consécutives, historique. **Touche un jour pour y noter une séance après coup, ou corriger une séance passée** |
| **Paramètres** | Objectif hebdo, repos par défaut, progression auto, son/vibration, export/import JSON |

### Noter une séance après coup

Onglet **Régularité** ▸ touche le jour concerné ▸ *Noter une séance ce jour-là*.
Tu choisis le programme, tu ajustes charges et répétitions, puis **Enregistrer**.
La date et la durée restent modifiables en haut de l'écran.

Dans ce mode, **toutes les séries sont cochées d'avance** : tu déclares une séance
déjà faite, tu décoches seulement ce que tu n'as pas fait. Seuls les exercices
ayant au moins une série cochée sont enregistrés — l'app prévient avant de laisser
un exercice de côté.

Depuis l'historique, *Corriger cette séance* recharge une séance déjà enregistrée :
elle est remplacée à l'identique (même date, même place), pas dupliquée.
Les charges du programme ne sont ajustées que si la séance modifiée est bien la
plus récente — corriger une vieille séance ne dérègle donc pas ta progression.

### Démonstrations des exercices

Chaque fiche d'exercice montre **deux photos** (position de départ et position
finale) et la marche à suivre en français, avec un point de vigilance.

Les textes sont dans `js/howto.js`. Les photos viennent de
[free-exercise-db](https://github.com/yuhonas/free-exercise-db) — 876 exercices
sous licence **Unlicense**, c'est-à-dire domaine public — et sont servies par
jsDelivr plutôt qu'embarquées : 132 photos pèsent 8,5 Mo, ce qui triplerait le
poids du dépôt.

Le service worker les met en cache au fil des consultations, dans un cache
séparé (`gym-hero-demos`) qui **survit aux mises à jour de l'app**. Une photo
déjà vue reste donc consultable hors ligne. Pour tout avoir d'avance :
**Paramètres ▸ Précharger toutes les démonstrations**.

### Séries dégressives et séries à l'échec

Un **dégressif** n'est pas une série de plus : c'est la même série qui continue
avec une charge allégée, sans repos. Le bouton **↓ Dégressif** ajoute donc une
ligne rattachée à la précédente par un crochet orange, numérotée `↓` au lieu de
`4`. Concrètement :

| Série | Reps | Charge |
|---|---|---|
| 1 | 12 | 8 kg |
| 2 | 12 | 8 kg |
| 3 | max | 8 kg |
| ↓ | max | 6 kg |

Conséquences : le compteur annonce 3 séries et non 4, le chrono de repos ne se
déclenche **pas** entre une série et son dégressif (mais bien après le dernier
segment), et le volume additionne tout normalement. La charge proposée pour un
dégressif est celle de la ligne du dessus allégée d'un quart, à ajuster.

**Série à l'échec** : laisse le champ Reps **vide**, il affiche `max`. Ces séries
sont exclues du calcul de progression automatique — sans objectif de répétitions,
il n'y a rien à comparer — mais leur charge est bien mémorisée. Pendant la séance,
tu notes le nombre réellement atteint.

### Le cardio

Tapis, vélo, elliptique, rameur, escalier et corde à sauter comptent comme
**cardio** : un cœur s'allume au centre du torse sur la vue de face, et les
minutes apparaissent en tête du classement de l'onglet Anatomie, dans l'objectif
de la semaine et dans le résumé de fin de séance.

Le cardio a sa propre échelle — 30 minutes remplissent la jauge — parce que
comparer des minutes à des kilos soulevés n'aurait aucun sens. Le cœur reste
invisible tant qu'aucun cardio n'a été fait. Les muscles secondaires de ces
exercices (quadriceps, mollets…) continuent d'être comptés normalement.

### Définir toi-même les muscles d'un exercice

Sur la fiche d'un exercice (ou en touchant la ligne des muscles pendant une
séance), bouton **Modifier** : touche une zone du corps pour la passer en
**principal**, puis en **secondaire**, puis l'éteindre. Bascule Face / Dos pour
atteindre le dos. Ton choix remplace le mapping d'origine et se répercute
partout — anatomie, volumes par groupe, muscles négligés, résumé de séance.
*Par défaut* rétablit le mapping fourni.

### Progression automatique des charges

À la fin d'une séance, l'app **réécrit le programme avec les charges réellement utilisées**.
Si toutes les séries ont atteint l'objectif de répétitions, elle ajoute automatiquement
+2,5 kg (haut du corps) ou +5 kg (bas du corps) — réglable, et désactivable, dans Paramètres.
La séance suivante démarre donc déjà pré-remplie avec les bons poids.

### Sauvegarde

Les données vivent dans le `localStorage` de Safari. Effacer les données du site
ou désinstaller l'app les supprime : **exporter un JSON de temps en temps**
(Paramètres ▸ Exporter). L'import restaure tout à l'identique.

---

## Structure

```
index.html              coquille de l'app + navigation
manifest.webmanifest    déclaration PWA (nom, icônes, couleurs)
sw.js                   service worker : cache hors ligne
css/style.css           thème dérivé des couleurs du logo
js/muscles.js           référentiel des muscles (FR)
js/exercises.js         catalogue de 66 exercices + mapping musculaire
js/anatomy.js           zones musculaires + heatmap posées sur les planches
assets/body-*.png       planches anatomiques face et dos (fond transparent)
tools/calibrate.html    grille pour recaler les zones sur les planches
js/store.js             données, statistiques, records, progression
js/ui.js                formatage, toasts, feuilles modales
js/programs.js          gestion et édition des programmes
js/session.js           séance en cours, chrono de repos
js/app.js               routeur et vues restantes
tools/icons.html        générateur d'icônes iOS/Android
assets/vendor/          Chart.js (embarqué pour le hors ligne)
```

---

## Pistes pour les versions suivantes

**V2 — confort en salle**
- Séries d'échauffement distinguées des séries de travail
- RPE / RIR par série (ressenti de difficulté)
- Superset et circuits
- Minuteur pour les exercices au temps (gainage)
- Notes et photos de progression

**V3 — analyse**
- Charge d'entraînement hebdomadaire et détection de surcharge
- Fraîcheur musculaire : le corps se « refroidit » avec les jours de repos
- Comparaison de deux périodes
- Suivi du poids de corps et des mensurations
- Objectifs par exercice avec date cible

**V4 — au-delà**
- Sauvegarde chiffrée dans iCloud Drive (fichier, toujours sans serveur)
- Partage d'un programme par lien ou QR code
- Widget iOS et raccourcis Siri (via l'app Raccourcis)
- Import depuis Strong / Hevy / Apple Santé

---

Fait pour la salle, pas pour le cloud. 💪
