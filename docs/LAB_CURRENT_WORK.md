# Micro-lot actif — 2026-10-07 — Fireball Author Correction V4

Branche :
`work/lab-fireball-author-correction-v4-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-fireball-author-correction-v4-2026-10-07`

Base :
`9f7bb7e0e10fab9d058d65808047ead24f5961dd`

## Justification

Retour utilisateur explicite sur la fiche Boule de feu intégrée :
- le point de sortie devait être `mouth` et non Centre ;
- le décalage du cast devait être horizontal `30` ;
- le décalage vertical devait être `0`.

La charte §33 autorise une correction volontaire des données auteur lorsqu'elle est fondée sur un retour utilisateur explicite.

## Périmètre

Uniquement :
- `data/capture/showcase/fireball.capture-skill-transfer-v1.json` ;
- sentinelle auteur Fireball ;
- rapport du lot.

Aucun moteur ni contrat n'est modifié.

## Invariant

La capacité garde toutes les autres valeurs du dernier export V3.

Le socket de capacité est commun au cast et au projectile dans le Human Editor ; la correction doit donc conserver `anchor: mouth` sur cast et travel.

## TDD

RED sur :
- cast.anchor = mouth ;
- travel.anchor = mouth ;
- cast.offsetX = 30 ;
- cast.offsetY = 0.

Puis remplacement ciblé des quatre valeurs explicitement corrigées, CI complète, checkpoint GREEN et preview.

