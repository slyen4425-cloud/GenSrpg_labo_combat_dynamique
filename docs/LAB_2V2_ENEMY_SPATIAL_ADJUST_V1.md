# Capture — Ajustement spatial léger des deux adversaires 2v2 V1

Date : 13 octobre 2026.

## Demande et périmètre
- Après validation du 1v1 et satisfaction générale sur les deux interfaces 2v2 (solo et allié IA), l'auteur souhaite **encore un petit décalage des deux créatures ennemies vers la droite** et **abaisser la créature adverse la plus à droite**, qui paraît flotter.
- **1v1 strictement gelé**, y compris la position de l'adversaire et le raccourci « Réserves adverses ».
- Base LIVE de départ `gh-pages@249097c31dc4042e10dcdd26b610c869c61a0b2f` (CI `38428722812`, Pages `38428721945` SUCCESS).
- Checkpoint de départ : `checkpoint/lab-start-2v2-enemy-spatial-adjust-v1-2026-10-13`; branche de travail : `work/lab-2v2-enemy-spatial-adjust-v1-2026-10-13`.

## Cause et propriétaire
- La scène porte une classe partagée `.arena--coop-2v2` pour 1v1 et 2v2. Le vrai `BattleFormat` expose `data-combat-active-count` sur l'arène ; les ajustements passent **seulement** par `.arena--coop-2v2[data-combat-active-count="2"]`.
- Owner unique de la présentation spatiale : `examples/dom-demo/capture-editor-v2.css` ; modification de **trois valeurs seulement** dans le bloc `Capture landscape 2v2 depth V2` :
  - adversaire `opponent-1` (le plus à droite) : X **63 % → 68 %**, Y **26 % → 30 %** ;
  - adversaire `opponent-2` : X **41 % → 46 %**, Y maintenu à **28 %**.
- Largeurs des slots `24dvh / 23dvh`, tailles auteurs, animation, profondeur de calque, points d'ancrage, moteur de collision et des FX **inchangés**. Le même slot géométrique DOM est lu par les capteurs existants, aucun transform supplémentaire.

## Invariants
- 1v1 : positions historiques paysage `X 77 % / Y 33 %` (et valeurs secondaires `X 34 % / Y 34 %`) strictement inchangées et isolées par la condition de format.
- 2v2 avec IA, 2v2 solo, HUD compact partagé, switch A↔B, cartes adverses, portraits, Réserves adverses, Esquive, Rappel, PV et capacités : aucun code ni style de ces fonctions modifié.
- Aucun changement sur `main`, `global-assets`, Combat Rules/Session/Runtime, 103 créatures, médias, GenSrpG principal et labo Exploration.

## Tests et publication
- Sentinelle TDD dédiée `tests/unit/capture-2v2-enemy-spatial-adjust-v1.test.mjs` créée **avant** la correction, avec exigences exactes 1v1/2v2, absence de `transform` et d'override de scale auteur.
- Les quatre sentinelles historiques qui imposaient les anciennes coordonnées 2v2 ont été mises à jour uniquement sur ces valeurs ; leurs exigences concernant le 1v1 et les propriétaires de la présentation sont conservées.
- CI Foundation et deux Chromium sur le SHA final requis ; checkpoint GREEN sur le même SHA, contrôle de la branche de production et publication fast-forward protégée sous lease, CI et Pages post-publication.
- Le repositionnement est **GREEN technique seulement** tant que l'auteur n'a pas confirmé le ressenti visuel en paysage sur Android.
