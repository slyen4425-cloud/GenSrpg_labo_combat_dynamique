# GenSRPG — raccord des 18 icônes UI sur le Labo Combat `main`

Date : 9 novembre 2026.

## Autorités et sources
- Les 18 médias approuvés sont publiés sur `global-assets` avec 18 ID stables `core:ui-*` et 36 fichiers individuels, plus manifeste de provenance.
- `global-assets` est le propriétaire unique des fichiers et du catalogue `data/assets/catalog/global-visual-assets.v1.json`.
- `main` reste l'unique source de la logique, de l'éditeur, du Bestiaire et de la publication Pages.
- BASE `main@7984aac05a30919422614205013f9962f79542b5`, START `checkpoint/lab-start-ui-icons-runtime-2026-11-09`, WORK `work/lab-ui-icons-runtime-2026-11-09`.

## Périmètre minimal
- Le raccord existant `src/assets/capture-ui-stat-icon-bindings-v1.js` mappe les 16 statistiques authentiques vers les médias du catalogue. Il ne crée aucune nouvelle stat `energy` ni `endurance` ; celles-ci sont uniquement des symboles UI.
- Le sélecteur de l'éditeur et le Bestiaire utilisent déjà le résolveur de médias publiés ; aucun doublon de présentation n'est ajouté.
- Actualiser uniquement le `REVISION` du client canonique `src/assets/global-visual-library.js` vers `2026-11-09-v62-krakenor-icons80-ui18`, et ajuster la sentinelle de révision historique de Krakenor.
- Conserver intactes définitions, gameplay, stats, cartes, créatures, sauvegardes, rendu combat, Explorer et PWA.

## Gates
- CI complète et tests ciblés des résolveurs, liste des changements limitée, checkpoint GREEN et fast-forward de `main` sans force.
- Vérifier ensuite le workflow Pages pour le SHA servi ; essai rendu Android reste explicitement à valider par l'auteur.
