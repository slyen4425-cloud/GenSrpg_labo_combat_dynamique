# Combat HUD Dodge Height V3

Date : 2026-10-07

Base : `d35e783c08b1231e781ee4702edbb4b37d5f6826`

## Retour utilisateur
Bouton Esquive à agrandir en hauteur et à remonter légèrement.

## Correction
- largeur V2 conservée ;
- position latérale V2 conservée ;
- hauteur paysage : `min-height: clamp(2.6rem, 8.5dvh, 3.4rem)` ;
- padding vertical porté à `0.28rem` ;
- bottom paysage porté de `0.45rem` à `0.8rem` via surcharge paysage ;
- tailles d'icônes capacités inchangées.

## TDD
RED : commit `84ecc85871174b814cf30ab83aa2d147e59056bc`
CI `37602292175` : 1206 tests, 1205 PASS, 1 FAIL ciblé.

GREEN fonctionnel : commit `bf3458f47103e937fe8898cc4ac6dd8d8915b2f9`
CI `37602379188` : 1206 / 1206 PASS.

## Protégé
Aucun changement Runtime, Rechargeable Action, Game Options, collision, dégâts, FX, données auteur ou icônes.

Statut : GREEN technique, validation utilisateur requise.
