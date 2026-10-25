# Zones persistantes — marqueurs à chaque entrée réelle (25 octobre 2026)

## Besoin auteur
Une créature crée une zone qui se déplace avec elle, sans s'étendre, active 20 s, qui applique deux charges d'un marqueur Poison à tout ennemi **entrant** dans la zone ; préparation 2000 ms et recharge 45000 ms. Les charges déjà posées restent après la sortie jusqu'à leur expiration native. Ce lot ajoute le réglage générique ; il ne crée aucun preset ni marqueur nommé Poison à la place de l'auteur.

## Gouvernance et source de vérité
- BASE : `gh-pages@45de90e31c661fca6c7efea2246bb85ab6ec14d1`.
- START : `checkpoint/lab-start-zone-markers-on-entry-2026-10-25`.
- LOT : `work/lab-zone-markers-on-entry-2026-10-25`.
- Contrat unique `SkillEffectV1.persistent_zone.tickEffect` autorise désormais `apply_marker`, **réutilisant** le contrat et le statut natif `CaptureMarkerV1` (aucun nouveau compteur, aucune horloge/timer parallèle).
- Propriétaire de l'occupation et des entrées : `src/core/combat/persistent-zone-runtime-v1.js`. Tous les dégâts/DoT/statuts de zone existants conservent leur logique.
- Bibliothèque partagée de marqueurs : `src/ui/capture-marker-library-v1.js`, dont sélecteurs et définitions restent l'unique autorité lors de l'édition d'une capacité.
- UI : `src/ui/capture-editor-human-v2.js` et `src/ui/capture-marker-effect-fields-v1.js`; option « Ajouter des marqueurs à l’entrée » et quantité, et seulement si l'effet de zone est `apply_marker`.

## Sémantique testée
- Apparition après préparation ; duration et cooldown sont les champs historiques de la capacité et de la zone.
- Le centre de zone suit `sourceActorId` via le renderer et l'occupation `visibleZones`, sans rattachement parallèle ; `reactivation=refresh`, `radiusGrowthSteps=0` pour rester à taille fixe.
- Une nouvelle entrée géométrique déclenche `charges` applications séquentielles de `applyStatusEffectV1(markerStatusDefinitionV1(marker))`. L'immunité aux effets négatifs, le plafond de stacks, les déclencheurs de seuil et la durée du marqueur restent appliqués par le propriétaire natif.
- Pendant une présence continue, zéro charge supplémentaire même si l'horloge avance. Après sortie puis retour, nouvelle série de charges.
- Une sortie, une expiration de zone ou un rappel retire la zone selon les règles existantes sans effacer les marqueurs déjà appliqués. Aucune duplication de fiche de marqueur ou de compétence.
- `targetScope=all_enemies` exclut les alliés ; la sélection reste explicite. Le rayon est au choix de l'auteur.

## Limites et intégration auteur
- La bibliothèque publiée contient `venin-static`, `eclat-spirituel` et `peste` ; il n'existe pas de marqueur intitulé « Poison » au moment du développement. L'auteur choisit un marqueur existant ou le crée dans la bibliothèque avant de l'utiliser.
- La durée de la **zone** (20 s) est indépendante de celle des **marqueurs** : configurer également la durée souhaitée du marqueur.
- Aucun changement de définition des marqueurs existants, aucun ajout d'asset, aucun preset de capacité sans identifiant d'auteur, et aucune modification de `main` ou `Zombicide-40k`.

## Validation
- Sentinelle `tests/unit/capture-zone-marker-on-entry-2026-10-25.test.mjs` : contrat, 2 charges par entrée, non-répétition, deux ennemis/allié, persistance après sortie et expiration, données d'édition.
- Sentinelle Chromium dans `tests/browser/capture-creature-library-smoke.mjs` : sélection de `peste` dans la vraie bibliothèque, sauvegarde, changement de fiche, rechargement puis export vérifiant 2 charges, durée 20s, préparation 2000ms, cooldown 45000ms et absence de croissance.
- Tests globaux Foundation et les quatre jobs navigateurs à vérifier au SHA final avant GREEN. Android utilisateur à valider séparément.
