# Téléportation contre projectile direct — V1 (13 octobre 2026)

## Gouvernance
- Dépôt exclusif : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Source initiale `gh-pages@9ecda9e80fd5ae5097dc60da480f7cb19e419477`, checkpoint `checkpoint/lab-start-teleport-direct-projectile-evasion-v1-2026-10-13`; travail sur branche séparée `work/lab-teleport-direct-projectile-evasion-v1-2026-10-13`.
- Protection de la publication concurrente : aucune branche stable ni aucun fichier auteur/asset n'est modifié avant CI complète ; la publication ne peut avancer qu'en fast-forward à partir du SHA initial avec lease.
- Domaines/owners inchangés : Action Resolver prend la décision ; Combat Runtime fournit l'action concurrente et l'instant de l'impact, Combat Session applique uniquement le résultat décidé.

## Bug prouvé
La téléportation sans champ `evasion` explicite était traitée comme `surface` sans auto-évasion contre projectile **direct**. Le mouvement implicite existant ne protégeait que contre `projectileTargeting:"fixed_point"`. Une Boule de feu directe atteignant la créature pendant son absence pouvait donc retirer des PV.

Tests TDD RED : commit `3dd0fe8904aeda8d312bc51c142a0780dc07a41b` / Laboratory CI `38379623276` : deux nouveaux scénarios 1v1/2v2 reproduisent le bug (2 échecs attendus, 1642 autres tests verts).

## Réparation minimale
Dans `src/core/combat/action-resolver.js`, `mobilityEvasionFor()` reconnaît dorénavant un cas supplémentaire :
- cible effectuant une action skill `approachMode:"teleport"` ;
- projectile entrant **offensif**, `form:"projectile"`, `projectileTargeting:"direct"` ;
- impact pendant `releaseAtMs <= elapsedMs < impactAtMs` de la téléportation.

Le verdict natif est `outcome:"evaded"`, `evasionReason:"teleport_vanish"`. Pas de nouveau compteur, statut, timeline ni vérification de nom/ID. Avant le release, la cible peut être touchée ; à partir de la réapparition, les protections d'évasion implicites cessent. Aucune immunité permanente.

Non-régressions explicites :
- un projectile direct continue à toucher les déplacements ordinaires ground/aerial sans compétence d'esquive explicitement autorisée ;
- les projectiles `fixed_point` continuent leur ancienne esquive de cible mobile ;
- les AoE non projectiles, les réactions, les téléportations configurées et les ciblages par présence ne sont pas modifiés ;
- KO, PV, 2v2, Collision, Projectiles miroirs et couloirs directs appartiennent toujours aux propriétaires historiques.

## Preuves techniques
- Code ciblé commit `0edbddd67a83764d48a1df62e8b12d567815fb5d`.
- CI `38379737449` : Foundation **1644/1644 PASS**, Firestorm Chromium **SUCCESS**, creature-library-browser Chromium **SUCCESS**.
- Couverture `tests/integration/teleport-direct-projectile-evasion-v1.test.mjs` : 1v1/2v2, fenêtre de disparition sans option d'esquive, pré-cast, après réapparition, ground/aerial, fixed_point et attaque de zone.
- Avant GREEN technique final : contrôler la CI du SHA **avec rapport et journal**, checkpoint GREEN exact, puis FF sous lease seulement si aucun concurrent n'a modifié gh-pages ; CI et Pages de la publication SUCCESS.
- Validation visuelle Android paysage reste à faire par l'auteur. Aucun changement d'asset, de présentation ou de compétences exportées.
