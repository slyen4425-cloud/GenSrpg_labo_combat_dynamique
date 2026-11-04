# Labo Combat — filtres par élément unifiés et identifiants de capacité générés automatiquement (04-11-2026)

## Constat
- Demande auteur : filtres élémentaires manquants dans certains panneaux qui proposent des créatures ou capacités ; pour créer une nouvelle capacité, l'identifiant doit apparaître automatiquement pendant la saisie du nom, comme dans les marqueurs.
- Ancienne UI : `refreshHumanSkillElementFiltersV1` ne connaissait que `configuredSkills`, et surtout les filtres de bibliothèque et loadout ; les créatures dans la bibliothèque, l'évolution et les équipes de combat n'étaient pas prises en charge. Sur Android, masquer `option.hidden` n'est pas fiable. Le bouton Nouvelle capacité affectait un ID générique `nouvelle-capacite`, puis demandait sa modification manuelle.

## Source unique
- Un propriétaire de présentation DOM `src/ui/capture-reference-element-filter-v1.js`, appelé par `capture-editor-human-v2.js`, construit ses métadonnées à partir **uniquement** de `configuredCreatures` et `configuredSkills`, réutilisant le traducteur d'éléments du code existant. Aucun nouveau catalogue de monstres/skills/éléments.
- Il détecte les menus existants de capacité, slots, bibliothèque créatures, évolution et équipes 1v1/2v2 (plus tout autre select dont les valeurs renvoient sans ambiguïté au registre). Les créatures multi-éléments sont présentes dans chacun de leurs éléments. Le filtre « Sans élément » reste possible.
- Il mémorise les options **en tant que copie de présentation**, les remplace vraiment dans le menu natif lors du filtrage, les restaure sans perte, préserve les sélections équipées même si elles ne correspondent pas au filtre temporaire, et resynchronise après une reconstruction des options par leurs propriétaires existants.
- L'identité : `capture-author-id-v1.js` est l'extraction pure de la transformation de nom qui était propriétaire dans le module marqueurs, avec réexport inchangé `captureMarkerAuthorSlugV1` pour maintenir le contrat. `suggestCaptureSkillDraftIdFromNameV1` applique le même slug à un **nouveau brouillon uniquement** puis le résolveur existant `nextCaptureSkillDraftIdV1` ajoute un suffixe si un ID existe. Les compétences déjà enregistrées/importées gardent leur identité immuable.
- Cache unique des imports ESM actualisé sur toutes les entrées du client Capture ; version de marqueurs et du module de création de capacités actualisée également, sans modifier le catalogue visuel, les skills/creatures publiés ni les autres labos.

## Tests
- `tests/unit/capture-reference-filters-skill-ids-2026-11-04.test.mjs` : accents, caractères spéciaux, identifiants de marqueurs inchangés, unicité collisionnelle et stabilité des IDs sauvegardés.
- `tests/browser/capture-reference-filters-skill-ids-smoke.mjs` : Chromium réel aux formats 1440×900, 920×520 et fenêtre étroite ; bibliothèque capacité Nature/Feu, créature Terre/Lumière, évolution et équipe, conservation des choix, retour sans filtre, Nouveau capacité, édition de l'identifiant depuis le nom et stabilité de l'ID existant. Sentinelle placée en tête de la suite Chromium.
- Vérifier CI complète Foundation + 4 navigateurs sur SHA exact, checkpoint GREEN + PR puis fusion gh-pages. Publication HTTP GitHub Pages / validation tactile Android distinctes. Ne pas désactiver les tests précédents.

## Gouvernance
- Base immuable `gh-pages@90f0c4636af72c5847f95da982f7d3ebc7001b76`.
- START `checkpoint/lab-start-unify-reference-filters-skill-ids-2026-11-04`; WORK `work/lab-unify-reference-filters-skill-ids-2026-11-04`.
- Pas de données auteur modifiées, pas de deuxième autorité sur le registre, pas de changements de combat, de statuts, sprites, assets ou autres projets.
