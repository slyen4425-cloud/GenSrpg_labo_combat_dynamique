# Combat HUD Dodge Position V2

Date : 2026-10-07

## Base
- base : `f2fae88f8dd89de561e725f24174d99d0b1c8d43`
- checkpoint départ : `checkpoint/lab-start-combat-hud-dodge-position-v2-2026-10-07`
- branche : `work/lab-combat-hud-dodge-position-v2-2026-10-07`

## Retour utilisateur
Le bouton Esquive V1 était un peu trop petit et trop loin du bloc Capacités.

## Correction
Présentation uniquement :
- bouton toujours hors de l'encadré Capacités ;
- ancrage juste à gauche du `.coop-command-stack` en paysage ;
- largeur paysage : `clamp(3.2rem, 7.8vw, 4.5rem)` ;
- taille supérieure à V1, inférieure à l'ancienne version trop grande ;
- grille de 5 capacités inchangée et pleine largeur.

## RED
- HEAD : `8a7dd78db5e2af72d6350857f5fd41702b92f366`
- CI : `37587209369`
- 1196 tests ; 1195 PASS ; 1 FAIL ciblé.

## Ajustement des sentinelles
La première correction a correctement fait échouer deux anciennes assertions V1 qui figeaient le design précédent (centrage 50 % et taille 60 %). Elles ont été remplacées par des invariants durables : bouton hors grille, icônes inchangées. Le nouveau test V2 protège le nouveau placement/taille.

## GREEN
- HEAD fonctionnel : `3981c8e5dc891f003022ed9f5e1daf3c140c9829`
- CI : `37587443908`
- 1196 / 1196 PASS.

## Fichiers
- `examples/dom-demo/capture-editor-v2.css`
- `tests/unit/capture-combat-hud-dodge-position-v2.test.mjs`
- `tests/unit/capture-combat-hud-dodge-layout-v1.test.mjs`

## Protégé
Aucun changement Runtime, Game Options, Rechargeable Action, dégâts, collision, FX, données auteur ou scale d'icône.

Statut : GREEN technique, validation utilisateur requise.
