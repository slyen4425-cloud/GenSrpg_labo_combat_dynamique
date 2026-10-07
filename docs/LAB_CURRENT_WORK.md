# Point de reprise courant — 2026-10-07

## Lot actif

Creature Dodge Appearance FX V1

Branche :
`work/lab-creature-dodge-appearance-fx-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-creature-dodge-appearance-fx-v1-2026-10-07`

Base exacte :
`f1ef3c934e6065cfdef0e515a8bc19fa06f1c235`

Base GREEN précédente :
`checkpoint/lab-goutte-projectile-power-2-v1-green-2026-10-07`

## Besoin utilisateur

L'Esquive possède déjà sa disparition/réapparition générique.

Ajouter un sprite/FX optionnel d'Esquive, mais le rattacher à **l'apparence de la créature** :
- une créature Foudre peut laisser un éclair ;
- une créature Terre/Nature peut laisser feuilles/poussière ;
- le choix est auteur et par créature ;
- ne pas le déduire automatiquement de l'élément.

## Architecture cible

Source de vérité :
`Creature Presentation`.

Le gameplay Esquive reste :
`HUD -> Combat Runtime -> activeWindowMs -> Visual Event dodge`.

Le nouveau visuel suit :
`Creature Presentation -> Combat Export -> Native Visual Source -> Visual Controller -> DOM Dodge FX`.

Aucune nouvelle minuterie gameplay.
La durée visuelle utilise la durée Runtime déjà transmise dans `metadata.durationMs`.

## Contrat

Étendre la présentation créature de façon versionnée :
- V1/V2 restent compatibles ;
- V3 ajoute `visual.dodge` optionnel ;
- champs V1 :
  - `assetId`
  - `displayScale`
  - `offsetX`
  - `offsetY`

Une créature sans sprite Dodge conserve exactement la disparition générique actuelle.

## Éditeur

Dans `Apparence` :
- sélecteur `Effet visuel d'esquive` ;
- scale ;
- décalage X/Y ;
- option `Esquive / disparition` dans l'import visuel personnel.

Le sélecteur peut utiliser la bibliothèque GenSrpG et `Mes assets`.

## Périmètre autorisé

- contrat Creature Presentation versionné ;
- normalisation Capture Creature Draft V3 ;
- exporter/adapter visuel Capture ;
- Human Editor Apparence ;
- Creator Visual Asset role ;
- renderer DOM dédié Dodge FX ;
- raccord Visual Controller existant ;
- tests/docs.

## Domaines protégés

Ne pas modifier :
- Combat Runtime ;
- règles/charges/recharge de l'Esquive ;
- durée active de l'Esquive ;
- Skill Contract ;
- dégâts / collision ;
- Projectile Clash ;
- Boule de feu ;
- Goutte vive ;
- Cendre aveuglante ;
- audio ;
- Roster ownership ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD

1. RED : contrôle Apparence + rôle import `dodge` ;
2. RED : build créature conserve `visual.dodge` via une présentation versionnée ;
3. RED : export/native visual source conserve le sprite ;
4. RED : Visual Controller joue le FX uniquement sur l'événement `dodge`, avec la durée Runtime ;
5. absence de sprite = comportement V1 inchangé ;
6. CI complète ;
7. checkpoint/preview GREEN.

## Critère de fin

Le joueur peut attribuer un visuel d'esquive à une créature depuis son Apparence.
Ce visuel accompagne la disparition d'Esquive sans posséder ni recréer la règle gameplay.
