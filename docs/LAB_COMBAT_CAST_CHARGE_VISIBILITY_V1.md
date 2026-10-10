# Combat Capture — Barre de préparation V1 (2026-10-10)

## Constat et origine

Le `progress[data-combat-actor-charge]` existant recevait déjà `chargeProgress` du runtime, mais ne mesurait que 0,38 rem (0,56 rem sur le joueur). Aucun pourcentage explicite n'était visible ; le temps se perdait dans le petit message d'action.

## Architecture et changement

Le propriétaire des durées, phases et interruptions reste `Combat Runtime`. Son callback `onProgress` fournit `chargeProgress`, `remainingPreparationMs` et `actionName`. Le module `src/adapters/renderer/combat-cast-charge-presentation-v1.js` projette ces données sans chrono supplémentaire :
- barre native plus visible (0,64 rem ; joueur local 0,8 rem), dorée et contrastée, compatible Chromium/WebKit/Firefox ;
- pourcentage et secondes restantes, immédiatement masqués hors préparation ;
- accessibilité sur `progress` (`aria-label` et `aria-valuetext`) ;
- un seul libellé DOM réutilisé pour toute la session, reset au lancement/interruption/échange ;
- `prefers-reduced-motion` sans transition.
- Tous les acteurs (joueur, allié, adversaires) utilisent le même chemin UI, 1v1/2v2.

Pas de changement des cooldowns, des compétences configurées, du Core, des règles, du roster ou des orbes d'énergie.

## TDD et régression

Test RED `84345eabf85f9cd2c8939d16827d83a6175f7984` (module volontairement absent).
Tests : projection 0..100%, fractions, bar montée/descente, libellé et reset sans doublon. Sentinelle `coop-2v2.test.mjs` actualisée uniquement pour les hauteurs demandées et contrôle des 4 acteurs ; aucune ancienne vérification de présence 1v1/2v2 supprimée.

Le statut GREEN ne peut être annoncé qu'après CI de cette documentation finale, tests Node, navigateur réel bibliothèque (103 créatures) et Firestorm, checkpoint au SHA exact, puis publication sur `gh-pages` à base inchangée. La vérification tactile physique reste nécessaire pour validation utilisateur.
