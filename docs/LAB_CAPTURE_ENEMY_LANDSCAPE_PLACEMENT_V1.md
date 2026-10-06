# Capture Enemy Landscape Placement V1

Date : 2026-10-06

## Base

Base exacte :

`bf05f7f42b45675ba0ce33bf0c95d17e53968a2e`

Checkpoint de départ :

`checkpoint/lab-start-capture-enemy-landscape-placement-v1-2026-10-06`

Branche :

`work/lab-capture-enemy-landscape-placement-v1-2026-10-06`

## Décision produit

Le gameplay Monster Capture sur smartphone utilise désormais le paysage comme mode de référence définitif.

Dans le laboratoire Combat :
- le contrôle paysage reste présent comme indicateur ;
- il est `checked` et `disabled` ;
- le libellé n'indique plus "Test provisoire" ;
- il affiche "Mode de jeu Capture".

Le fallback "Tourne ton téléphone" reste nécessaire lorsque l'environnement ne peut pas verrouiller l'orientation.

## Placement adversaire

Le changement est limité au layout Capture paysage :

### opponent-1

Avant :
- X = 74 % ;
- Y = 36 %.

Paysage Capture V1 :
- X = 77 % ;
- Y = 33 %.

### opponent-2

Avant :
- X = 31 % ;
- Y = 37 %.

Paysage Capture V1 :
- X = 34 % ;
- Y = 34 %.

Soit un déplacement léger :
- +3 points vers la droite ;
- -3 points vers le haut.

## Autorité

Le déplacement est implémenté dans :

`examples/dom-demo/capture-editor-v2.css`

et scoped sous :

`capture-preview-shell[data-landscape-required="true"]`.

Aucun offset n'est ajouté :
- au projectile ;
- au renderer FX ;
- à la collision ;
- aux sockets ;
- aux données Creature Presentation.

La géométrie collision / projectile / FX continue donc de mesurer la position réellement rendue du slot.

## Scales protégés

Aucun changement de :
- width acteur ;
- `displayScale` auteur ;
- `--creature-display-scale` ;
- transform scale.

## TDD RED

HEAD RED :

`9c272636385da97b984ec76612ceadf237a80811`

CI :

`37498712822`

Résultat :
- 1170 tests ;
- 1168 PASS ;
- 2 FAIL ciblés :
  1. paysage encore présenté comme provisoire ;
  2. nouveaux offsets de slots absents.

## GREEN intermédiaire

Après implémentation, le comportement produit était correct mais une sentinelle détectait le mot `displayScale` dans un commentaire CSS.

Ce n'était pas une modification de scale.

La sentinelle a été corrigée pour contrôler uniquement de vraies déclarations CSS :
- width ;
- transform scale ;
- variable `--creature-display-scale`.

Aucune exigence n'a été relâchée.

## GREEN fonctionnel

HEAD fonctionnel :

`a78a10b8d5d4132dcb52d343edcdd8b6960c54ac`

CI :

`37499050948`

Résultat :
- 1170 / 1170 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

- `examples/dom-demo/capture-editor-v2.html`
- `examples/dom-demo/capture-editor-v2.css`
- `tests/unit/capture-enemy-landscape-placement-v1.test.mjs`

## Domaines protégés / inchangés

Aucune modification de :
- Combat Runtime ;
- Combat Session ;
- Action Resolver ;
- collision ;
- projectile ;
- FX renderer ;
- sockets ;
- Creature Presentation scales auteur ;
- Human Editor gameplay contracts ;
- Tempête de flammes ;
- Roster Session.

## Test utilisateur attendu

Sur smartphone paysage :
1. ouvrir la preview Capture ;
2. tester un combat 1v1 puis 2v2 ;
3. vérifier que les adversaires semblent mieux assis dans le décor :
   - légèrement plus haut ;
   - légèrement plus à droite ;
4. vérifier que projectiles, impacts, zones, ombres et collisions restent attachés à la créature réellement affichée.

Le réglage est volontairement léger pour éviter de casser la perspective déjà validée.
