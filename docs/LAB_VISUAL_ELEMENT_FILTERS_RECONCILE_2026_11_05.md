# Labo Combat — réconciliation des filtres visuels par élément (05-11-2026)

## Base et périmètre
- Base publiée `gh-pages@22da2abd5536bfb25e37e14b80f4cd539150899c`, incluant Armure de pointe (PR #248).
- START `checkpoint/lab-start-visual-element-filters-reconcile-2026-11-05` ; WORK `work/lab-visual-element-filters-reconcile-2026-11-05`.
- Reprise ciblée du chantier non fusionné `work/lab-visual-element-filters-2026-11-04` sans fusion directe d'une branche retardée.
- Propriétaire unique du filtrage : `src/ui/capture-reference-element-filter-v1.js` ; catalogue unique `EDITOR_VISUAL_ASSETS_BY_ROOT` / `GLOBAL_VISUAL_LIBRARY`, classification `humanVisualAssetElementV1`.
- Couvre capacités, créatures, modèles, Cast/Trajet/Impact, statuts et visuels adversaires facultatifs, murs, icônes, creusement ; menus natifs Android et sélection conservée.
- Aucun changement de données bestiaire/capacités, moteur ou autres dépôts.

## TDD / origine
- Ancien RED démontré : `c872ec663668981d4694cf45c33f2be7e5497a3c`, run #41902748696 : « creature model picker lacks asset element filter ».
- Ancienne CI finale non GREEN : #41903909622 (cohérence ESM cassée et timeout Chromium, malgré les tests spécifiques passants).
- Nouveau test de non-régression : modèles, statuts, sélecteur adversaire facultatif et `armure-de-pointe` déjà publiée.
- Correction racine ciblée : filtrage natif par le même contrôleur, aucun catalogue parallèle, aucun `MutationObserver`, cache ESM cohérent.

## Critères finaux
- RED de la régression puis Foundation + quatre jobs Chromium verts sur SHA final, revue, checkpoint GREEN, PR `gh-pages`, contrôle Pages et test Android physique auteur distinct.
- `main` inchangé.
