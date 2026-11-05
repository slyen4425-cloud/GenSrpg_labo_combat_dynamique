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

## Résultats de vérification (05-11-2026)
- RED sur le nouveau test avant implémentation : commit `01fb66d7c1732a4036ba969635e31a85536c7d2d`, CI #42033560546 : masque sprite adversaire sans filtre élémentaire ; quatre autres jobs verts.
- Correction fonctionnelle et cache ESM : commits `c395b0b639fa145998556a406d6995c94b3229c0` et `6db2afb6302aac9dd6fd254e8f67b38f8d80fa69`.
- CI #42034149723, tentative 2 sur `6db2afb6302aac9dd6fd254e8f67b38f8d80fa69` : **5/5 jobs verts**, incluant le test de référence 1440/920/390, les statuts FACE/DOS, et la fondation.
- Tentative 1 : unique échec du test de rendu d'ombre 2.5D (aucune modification du module de collision), corrigé par simple relance du même SHA sans altérer la logique ni le test. À surveiller en cas de récidive, sans le déclarer « corrigé ».
- Publication uniquement par PR vers `gh-pages` et contrôle Pages ; test tactile sur appareil réel reste à faire par l'auteur.
