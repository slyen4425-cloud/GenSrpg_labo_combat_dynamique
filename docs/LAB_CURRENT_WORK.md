# Point de reprise courant — 2026-10-08

## Lot actif

Creature Library Browser Startup Regression V1

Branche :
`work/lab-creature-library-browser-startup-regression-v1-2026-10-08`

Checkpoint de départ :
`checkpoint/lab-start-creature-library-browser-startup-regression-v1-2026-10-08`

Base exacte :
`181cada1bf19f919961fcc546b9eee5bebb7c5bc`

Base GREEN précédente :
`checkpoint/lab-creature-dodge-appearance-fx-v1-green-2026-10-07`

## Retour utilisateur autoritaire

Sur la preview smartphone réelle :
- la page s'affiche ;
- la bibliothèque de créatures est de nouveau vide.

La validation utilisateur invalide donc le GREEN fonctionnel précédent sur ce point, malgré la CI.

## Trou dans la sentinelle existante

Le test :
`tests/unit/capture-editor-creature-library-regression-v1.test.mjs`

reconstruit correctement 103 créatures en Node, mais ne couvre pas le graphe de modules chargé par la vraie page :
`examples/dom-demo/capture-editor-v2.js`.

## Diagnostic architectural

Le point d'entrée navigateur charge statiquement des modules uniquement nécessaires à la preview combat, avant même que l'éditeur soit monté :

- `capture-combat-preview-v1.js` -> `demo-app.js` -> nouveau `dom-creature-dodge-fx-v1.js` ;
- `capture-export-to-native-visual-source-v1.js` -> nouveau `creature-presentation-binding.js`.

Une indisponibilité/erreur de ce graphe preview peut donc empêcher tout le module d'entrée de s'évaluer et laisser l'HTML statique avec une bibliothèque vide.

Cela recrée une dépendance de démarrage que le lot Creature Library Regression V1 avait précisément cherché à supprimer pour les ressources optionnelles.

## Correction cible

Séparer le bootstrap essentiel de l'éditeur du runtime optionnel de preview combat :

`Editor bootstrap -> creature library`

doit rester chargeable indépendamment de :

`Preview runtime -> visual adapter -> combat preview -> Dodge FX renderer`

Les modules preview seront chargés dynamiquement après le démarrage essentiel de l'éditeur. Une erreur de preview doit désactiver le test combat et afficher une erreur, sans vider/bloquer la bibliothèque.

## TDD

1. RED structurel sur la vraie entrée navigateur :
   - aucun import statique de `capture-combat-preview-v1.js` ;
   - aucun import statique de `capture-export-to-native-visual-source-v1.js` ;
   - runtime preview chargé dynamiquement.
2. conserver la sentinelle historique 103 créatures ;
3. vérifier l'échec du runtime preview sans casser `editor.ready` ;
4. CI complète ;
5. nouveau checkpoint/preview utilisateur.

## Domaines protégés

Ne pas modifier :
- données créatures ;
- configuredCreatures comme owner ;
- Combat Runtime / Rules ;
- Dodge gameplay ;
- Creature Dodge Appearance FX lui-même ;
- puissance projectile / Fireball / Goutte / Cendre ;
- main ;
- Zombicide-40k ;
- Exploration.
