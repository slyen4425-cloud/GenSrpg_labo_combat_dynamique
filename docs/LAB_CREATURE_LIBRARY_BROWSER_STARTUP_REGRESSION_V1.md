# Creature Library Browser Startup Regression V1

Date : 2026-10-08

## Retour utilisateur

La preview smartphone affichait de nouveau une bibliothèque de créatures vide.

La CI précédente restait verte.

## Trou de couverture identifié

La sentinelle historique :
`tests/unit/capture-editor-creature-library-regression-v1.test.mjs`

vérifiait correctement la construction de 103 créatures dans le chemin de données, mais pas le graphe de modules réellement chargé par :
`examples/dom-demo/capture-editor-v2.js`.

Le lot Creature Dodge Appearance FX V1 avait ajouté de nouveaux modules de preview :
- `capture-combat-preview-v1.js -> demo-app.js -> dom-creature-dodge-fx-v1.js`
- `capture-export-to-native-visual-source-v1.js -> creature-presentation-binding.js`

Ces modules uniquement nécessaires au combat de test étaient importés statiquement par le point d'entrée de l'éditeur.

Conséquence architecturale :
une indisponibilité ou erreur de chargement dans le runtime de preview pouvait empêcher l'évaluation du point d'entrée avant le montage de l'éditeur, laissant l'HTML visible mais sans bibliothèque hydratée.

## Correction

Nouveau loader :
`src/ui/capture-editor-preview-runtime-loader-v1.js`

Le point d'entrée navigateur ne possède plus d'import statique vers :
- `capture-combat-preview-v1.js`
- `capture-export-to-native-visual-source-v1.js`

Ordre désormais garanti :

`mount editor -> editor.ready -> lazy preview runtime -> enable combat test`

Si le runtime de preview combat échoue à charger :
- l'éditeur et sa bibliothèque restent propriétaires de leur démarrage ;
- le bouton de combat reste indisponible ;
- une erreur de preview est affichée ;
- aucune donnée créature n'est vidée ou remplacée.

## TDD

RED :
- commit `fbcc44937d0c8a2089b30b525790765003f9a476`
- CI `37696130792`
- 1256 / 1257 PASS
- 1 FAIL ciblé : imports preview encore statiques.

Loader :
- `c87c15b0a92bdfeaa8683ce59470e4835524dbac`

Isolation du point d'entrée :
- `06632d74978e37274b22edc8e98f7a105de37a9a`

L'ancienne sentinelle de retry a ensuite été alignée sur le nouveau `previewRuntimePromise` sans enlever ses assertions :
- `0746053d366f608bc1f0e2980a687759d7bea8b9`

GREEN :
- CI `37696439236`
- 1257 / 1257 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Sentinelles simultanées

La nouvelle CI vérifie à la fois :
- vraie entrée navigateur sans dépendance statique au runtime preview ;
- sentinelle historique de bibliothèque active à 103 créatures ;
- conservation de tous les IDs historiques ;
- retry du bouton combat après erreur.

## Domaines protégés

Inchangés :
- données Monster Capture ;
- `configuredCreatures` comme owner ;
- Creature Dodge Appearance FX ;
- Combat Runtime / Rules ;
- Dodge gameplay ;
- Projectile Clash ;
- Fireball / Goutte / Cendre ;
- main ;
- Zombicide-40k ;
- Exploration.

## Statut

GREEN technique.

Validation smartphone utilisateur obligatoire avant GREEN utilisateur.
