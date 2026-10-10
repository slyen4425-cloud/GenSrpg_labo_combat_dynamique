# Combat — esquive souterraine implicite V1

Date : 11 octobre 2026.

## Défaut reproduit
La présence `underground` était correctement calculée par `combatPresenceForActionContextV1` pendant la phase `burrow`, mais une attaque offensive sans `hitPresenceStates` recevait `reachable=true` (absence de restriction explicite) dans `skillPresenceReachV1`, puis `presenceEvasionFor` ignorait la présence non configurée. Les projectiles classiques touchaient donc une cible cachée sous terre.

## Contrat et comportement
Le contrat existant `hitPresenceStates` conserve son sens pour les capacités qui déclarent leur portée : `["surface"]` rate sous terre ; `["surface","underground"]` touche sous terre. Pour les **attaques offensives historiques sans liste**, la présence `underground` est désormais réputée non atteignable par défaut, uniquement pendant la phase souterraine. Le même Resolver émet `evaded` / reason `presence`. La présence `surface` et l'ancienne esquive aérienne ne changent pas ; soins et buffs restent libres si leur portée n'est pas configurée.

## Gouvernance
Base `gh-pages` : `bead0d0c70ed03dd5fe5f3dcf9cec916255ca1cf`.
- checkpoint départ : `checkpoint/lab-start-burrow-implicit-surface-evasion-v1-2026-10-11` ;
- branche : `work/lab-burrow-implicit-surface-evasion-v1-2026-10-11` ;
- RED `dfba799a13a3e68cb93c083b97e0a69372dba481` / Laboratory CI `38093650607` FAILURE attendu ;
- correctif Core : `src/core/combat/combat-presence-v1.js` + `src/core/combat/action-resolver.js` ;
- test : `tests/integration/combat-presence-reach-v1.test.mjs`, vrai `CombatRuntime.startSkill` → `CombatSession` → résolution et HP ;
- CI code `835cc520c4cef19130b6147b37d44178ec9a6b71` / run `38093662102` SUCCESS, Foundation et navigateurs inclus.

## Frontières
Rendu souterrain, trajectoires FX, statuts, skills auteur, `main`, `global-assets`, GenSrpG principal et Exploration non modifiés. Ce lot ne corrige pas le point d'impact fixe des projectiles skyfall contre une cible se déplaçant ; chantier distinct.

## Livraison
Checkpoint GREEN uniquement après CI sur SHA final documentaire, publication Pages fast-forward lease et vérification CI/Pages publics. Validation visuelle Android distincte.
