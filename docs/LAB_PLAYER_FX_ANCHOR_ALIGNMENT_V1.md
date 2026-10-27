# Player FX anchor alignment V1

Date : 2026-10-06

## Base

Base exacte :

`05c1976b58505448aa0c9619361d6d5399dd0786`

Cette base contient déjà le lot GREEN :

- blocs éditeur repliables ;
- panneau sprites/FX rendu plus visible ;
- test combat plein écran paysage configurable.

Checkpoint de départ :

`checkpoint/lab-start-player-fx-anchor-alignment-v1-2026-10-06`

Branche :

`work/lab-player-fx-anchor-alignment-v1-2026-10-06`

## Retour utilisateur

Sur les FX de Cendre aveuglante :

- attaque ennemie : position validée ;
- attaque joueur : glow / projectile / trail trop bas.

## Diagnostic

Le problème n'est pas causé par deux renderers.

Le pipeline est commun :

`SkillPresentationBinding`
→ `capture-skill-presentation-assets-v2`
→ `dom-skill-fx`

La différence de position vient de l'ancre source fournie par la créature selon sa vue.

L'adaptateur autoritaire conserve :

- vue joueur → `socket.back` ;
- vue ennemi → `socket.front`.

La sentinelle existante `capture-native-visual-source-adapter-v1.test.mjs` vérifie déjà cette règle sur le vrai adaptateur.

Cendre aveuglante continue à demander :

`travel.anchor = "mouth"`

La fiche active du Loup fournissait :

- ennemi/front : `{ x: 0.15, y: 0.53 }` ;
- joueur/back : `{ x: 0.82, y: 0.52 }`.

Le retour utilisateur valide explicitement la première et signale uniquement la seconde comme trop basse.

## Correction

Fichier modifié :

`data/capture/showcase/crea-loup.capture-creature-transfer-v1.json`

Un seul nombre fonctionnel a changé :

- `mouth.back.y : 0.52 -> 0.47`

Invariants conservés :

- `mouth.front = { x: 0.15, y: 0.53 }` ;
- `mouth.back.x = 0.82` ;
- ID socket `mouth` ;
- visuels face/dos/icône ;
- Cendre ;
- renderer ;
- trail ;
- glow ;
- collision.

L'ajustement correspond à environ 16 px vers le haut sur le canvas 320 px du visuel dos.

Cette valeur reste à valider visuellement sur smartphone ; elle n'est pas déclarée GREEN utilisateur tant que Sylvain ne l'a pas confirmée.

## TDD

### RED

Commit :

`14f6445ff24e4c2a301fdc054f07146eb1cb9585`

CI :

`37426373404`

Résultat :

- 1104 tests ;
- 1103 PASS ;
- 1 FAIL attendu ;
- seul échec : sentinelle du Y joueur encore à `0.52`.

### Correction minimale

Commit :

`6fbbf48ebdbc017db551b6c754c6ffce5b51ee36`

CI :

`37426434395`

Résultat :

- 1104 / 1104 PASS ;
- 0 FAIL.

## Pourquoi le renderer n'a pas été modifié

Le même renderer produit déjà le résultat correct côté ennemi.

Modifier un offset global, le trail ou le glow pour compenser uniquement la vue joueur aurait créé une correction au mauvais niveau et risqué de dégrader le camp validé.

La correction reste donc dans la donnée de socket qui possède déjà la différence face/dos.

## Validation utilisateur

Dans la preview smartphone :

1. charger le Loup volcanique avec Cendre aveuglante ;
2. lancer Cendre côté joueur ;
3. vérifier que le projectile Ombre / glow / trail partent désormais de la bouche et non trop bas ;
4. observer Cendre utilisée par l'ennemi et confirmer que sa position n'a pas bougé ;
5. si le joueur est encore légèrement trop haut/bas, ne modifier que `mouth.back.y` lors du prochain réglage visuel.
