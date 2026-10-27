# Side-aware validation regression V1

Date : 2026-10-06

## Base

Base exacte :

`857074284dfc1641b4d68f210fe8f65c9c540f19`

Checkpoint de départ :

`checkpoint/lab-start-side-aware-validation-regression-v1-2026-10-06`

Branche :

`work/lab-side-aware-validation-regression-v1-2026-10-06`

## Retour utilisateur

Après modification des offsets visuels/particules :
- message Validation : `nonNegativeNumber is not defined` ;
- impression que le miroir automatique côté opposant ne s'applique pas.

## Cause réelle

`readHumanGameOptionsV1` appelait :

`nonNegativeNumber(...)`

alors que ce helper n'existe pas dans `capture-editor-human-v2.js`.

La validation globale de l'éditeur lit aussi les Game Options. Toute modification d'une capacité pouvait donc échouer à la validation, y compris une modification d'offset V9 side-aware.

Le binding n'était alors pas reconstruit/enregistré normalement, ce qui pouvait faire croire que `mirror_x` était inactif.

## Correction

Aucun nouveau helper de validation n'a été ajouté.

Le Human Editor convertit uniquement les secondes en millisecondes puis transmet directement la valeur à :

`normalizeCaptureGameOptionsV1`

Le contrat Game Options reste l'unique propriétaire de la validation `rechargeMs >= 0`.

## TDD RED

HEAD :

`4f070b5a5f58b63f6a9344eb231e1bef2d14669d`

CI :

`37518857787`

Résultat :
- 1193 tests ;
- 1191 PASS ;
- 2 FAIL ciblés ;
- les deux échouent sur `nonNegativeNumber is not defined`.

## GREEN

HEAD fonctionnel :

`50256f4ac51595bf2971c54bc258c0fdde3788b3`

CI :

`37518946024`

Résultat :
- 1193 / 1193 PASS ;
- 0 FAIL.

Sentinelles importantes :
- lecture Game Options valide : PASS ;
- recharge négative rejetée par le contrat : PASS ;
- Human Editor round-trip side-aware : PASS ;
- V9 `mirror_x` inverse uniquement X côté opponent : PASS ;
- Impact V9 custom garde le Flash sur le même point : PASS.

## Fichier fonctionnel modifié

- `src/ui/capture-editor-human-v2.js`

Test ajouté :
- `tests/unit/capture-game-dodge-ui-v1.test.mjs`

## Protégé / inchangé

- Combat Runtime ;
- Game Options contract ;
- Rechargeable Action ;
- SkillPresentationBinding V9 ;
- renderer FX ;
- collision ;
- projectile ;
- scales auteur ;
- Showcase.

## Validation utilisateur

À vérifier sur smartphone :
1. modifier un offset Cast X/Y ;
2. laisser `Miroir horizontal automatique` ;
3. vérifier que Validation n'affiche plus d'erreur ;
4. lancer le combat ;
5. vérifier joueur : X auteur ;
6. vérifier opposant : X inversé, Y identique.

Si ce dernier point reste visuellement faux malgré la validation réparée, ouvrir un nouveau RED renderer/UI sur le cas exact.
