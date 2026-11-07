# Mur invocable — profondeur d'affichage et scale X/Y avancé (2026-11-01)

## Base et procédure
Base: `gh-pages@3ad7d636f369dfb552ef10d34a111735d99f7e2c`, START `checkpoint/lab-start-wall-layer-scale-xy-2026-11-01`, WORK `work/lab-wall-layer-scale-xy-2026-11-01`. Aucune modification de `main`, GensRPG, Exploration ou des médias `global-assets`. L'art de glace corrigé par l'auteur n'est pas réécrit.

## Régression et cause
Le mur libre/arène est rendu dans `CombatEntityOverlayV1` à z-index 12, donc couvre Gorice (joueur en z4). L'ennemi est en z3 et doit continuer à rester derrière. Un mur doit avoir un SEUL noeud DOM et un SEUL rectangle de collision ; ne pas lui superposer un faux sprite. Le contrat `summon_entity` limite `visualScale` à 4 et l'éditeur ne propose aucun axe individuel.

## Correction à la source
- Couche du mur arène à z3, peinte APRÈS les ennemis et AVANT les joueurs ; scope CSS seulement pendant la présence d'un mur en mode `arena`, y compris en 2v2 (joueur/allié devant, ennemi derrière) et durant les animations d'approche. Le repère front/behind relatif garde son comportement.
- `visualScale` 0,25–12. Nouveaux multiplicateurs facultatifs `visualScaleX` et `visualScaleY` de 0,25 à 8 chacun. Ancien export sans axes = multiplicateurs 1 ; ne pas introduire une copie de définition.
- Le Combat State et l'éditeur conservent la même SkillEffect normalisée. Les dimensions réelles du DOM sont largeur `70 * scale * scaleX`, hauteur `92 * scale * scaleY`. Le viewport de l'illustration (base 70×70) utilise une hauteur `70 * scale * scaleY` au lieu de forcer un carré quand X/Y diffèrent. Le rectangle de collision reste celui du sprite qui a réellement changé de taille : aucune géométrie ou collision parallèle.
- Les trois entrées de preview 1v1/2v2/éditeur renouvellent leurs références ESM et CSS pour éviter le vieux renderer dans la PWA.

## Preuves prévues et limites
Test RED réel Foundation `41350421694` (nouvelle sentinelle contrat échelle >4 et X/Y absents). Test `tests/unit/capture-wall-layer-scale-xy-2026-11-01.test.mjs` : plages, état natif, transfert auteur, source renderer et éditeur. Le navigateur `capture-ice-barrier-editor-smoke.mjs` contrôle le vrai DOM (couche z3, viewport et hitbox stretchés, éditeur réel). Les anciennes sentinelles >4 ont été actualisées pour refléter le nouveau contrat, sans modifier la logique de défense.

CI complète 5 jobs sur SHA code+docs **à vérifier** ; checkpoint GREEN exact seulement si réussi, PR gh-pages, puis CI+Pages post-fusion avant publication. Validation tactile Android reste distincte.
