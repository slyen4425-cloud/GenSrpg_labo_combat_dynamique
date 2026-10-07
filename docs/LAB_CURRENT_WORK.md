# Point de reprise courant — 2026-10-07

## Correctif techniquement GREEN — validation smartphone ouverte

Creature Library Regression V1

Branche :
`work/lab-creature-library-regression-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-creature-library-regression-v1-2026-10-07`

Base reproduite :
`36e90e6152b079584f1f4f8aafa53494435befda`

## Symptôme

La preview Burrow Visual V1 pouvait afficher une bibliothèque de créatures vide.

## Diagnostic démontré

Le vrai jeu de données n'est pas vidé par le Capture Transfer batch :
- 110 entrées historiques brutes ;
- 102 créatures canoniques après retrait des 8 alias historiques ;
- 103 créatures après Showcase (Loup ajouté, Maraileron et Moussados remplacés par ID stable).

Le défaut était l'initialisation Human Editor :
un `Promise.all` global rendait le remplissage de `configuredCreatures` dépendant de ressources de présentation optionnelles.

Une erreur assets/audio/metadata pouvait donc empêcher le remplissage de la bibliothèque.

## Correctif

Nouveau helper :
`src/ui/capture-editor-startup-v1.js`

Essentiels bloquants :
- capacités natives ;
- catalogue + registre créatures ;
- progression.

Optionnels non bloquants pour la bibliothèque :
- catalogue visuel ;
- audio privé ;
- metadata visuelle.

Les optionnels utilisent `Promise.allSettled`.

`configuredCreatures` reste l'unique owner.

## TDD

RED startup :
- commit `2802725e1533f6f1c8cbe93e53f1bdf061ddae39`.

GREEN :
- helper `6ed012244e20332e1b026f3a727b11542ba38a1c`;
- raccord `7d31a81a7e868d3432bcb7220a41ee978af1dcd5`;
- sentinelle ownership listener `96af0937247ee4bcbb1e9625b63f7af56a8d8166`;
- CI `37666680690`;
- 1237 / 1237 PASS ;
- 0 FAIL ;
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_CREATURE_LIBRARY_REGRESSION_V1.md`

## Domaines protégés

Inchangés :
- données auteur Maraileron / Morsure ;
- Capture Transfer ;
- Combat Runtime / Session / Timing ;
- Burrow Visual / Animation Core ;
- FX ;
- collision ;
- Roster ;
- Dodge ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action

- CI finale documentaire ;
- checkpoint GREEN ;
- preview dédiée ;
- validation smartphone Sylvain.

Ne pas reprendre un autre chantier avant ce test utilisateur.
