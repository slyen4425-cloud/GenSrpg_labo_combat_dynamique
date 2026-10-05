# LAB — Creator Visual Import V1

## Statut

GREEN technique. Import personnel de session disponible dans l'éditeur Capture.

## Architecture

Chaîne unique : fichier utilisateur -> ImageSourceManager (validation/Object URL) -> AssetDefinition `user:*` -> catalogue actif de l'éditeur -> Presentation Binding -> adaptateur natif -> renderer existant.

Aucun second loader, aucun chemin fichier utilisateur dans le gameplay, aucun changement Combat Rules/Runtime/Animation/FX/Renderer.

## Périmètre

- PNG / WebP / JPEG ;
- rôles : créature, icône, cast, projectile/travel, impact, zone, statut ;
- import de session uniquement ;
- les Object URLs sont révoquées à la destruction de la session ;
- persistance projet/IndexedDB explicitement reportée à un chantier séparé.

## Preuves

- RED initial : commit `6035d0f5671b2439f86369b1f98f58c43b1d7366` ;
- module Asset Input : `src/assets/creator-visual-asset-session-v1.js` ;
- vrai raccord runtime URL couvert par `tests/unit/capture-native-visual-source-adapter-v1.test.mjs` ;
- CI finale avant documentation : `37330331980` — 1038/1038 PASS ;
- garde structure/indépendance : OK.

## Validation utilisateur

Dans capture-editor-v2.html, section Apparence -> Importer un visuel personnel : choisir rôle, nom et fichier, importer, puis sélectionner l'asset dans la liste correspondante et lancer le combat de test.
