# Onde régénérante — 5 PV immédiats + régénération de 5 PV / 3 s pendant 20 s

2026-10-09 — laboratoire `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Source de la modification

Instruction directe et explicite de l'utilisateur : reprendre la capacité `lib_aqua_heal` qu'il avait exportée, y configurer `+5 PV` au déclenchement et `+5 PV` toutes les trois secondes pendant vingt secondes, sans modifier ses autres paramètres. Ceci remplace **uniquement** les effets de soin vides de l'export précédent. La précédente empreinte auteur du fichier sans soin, `05e90de6436a45288b33ce172f65ad3a94f8a77726abb3e821bb6f0b055af13a`, reste documentée dans l'historique ; elle ne décrit plus la fiche modifiée conformément à sa demande.

## Protocole

- Base `gh-pages` GREEN SHA `de6ec3eb1caf524475ef9c8256b6bd085bacee72` (audit HoT export réussi).
- Checkpoint départ : `checkpoint/lab-start-aqua-heal-five-plus-hot-v1-2026-10-09`.
- Branche : `work/lab-aqua-heal-five-plus-hot-v1-2026-10-09`.
- Unique autorité `configuredSkills`, initialisée par le transfert `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json` déjà déclaré dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`.
- Aucune capacité doublonnée, aucun nouveau catalogue ; aucun code moteur modifié.
- Toutes les autres valeurs auteur conservées : ID, nom, description, niveau 15, `form=self`, `targetRelations=["self"]`, cooldown 30 s, coût 8, préparation 2,5 s, slot standard, distances, éléments, `presentation=null`.
- La catégorie `heal` est utilisée avec `effect.heal=0` (champ legacy), et deux effets **tactiques** canoniques :
  1. `{kind:"heal",targetScope:"self",amount:5}`.
  2. `{kind:"apply_status",targetScope:"self",status:{id:"lib_aqua_heal_regeneration",kind:"heal_over_time",polarity:"beneficial",durationModel:"time_ms",durationMs:20000,stacking:"refresh",maxStacks:1,tags:[],amount:5,tickIntervalMs:3000}}`.

## Conséquence gameplay exacte

Au terme de la préparation (2,5 s préexistantes), +5 PV immédiats dans la limite des PV maximum. Le même acteur reçoit la régénération pendant 20 s à partir de la résolution. Chaque tick de 5 PV intervient à +3, +6, +9, +12, +15 et +18 s ; la régénération s'éteint à +20 s. Six ticks de 5 PV = +30 PV au maximum ; gain global **jusqu'à 35 PV** si suffisamment de PV manquent. Aucun soin supplémentaire à la 20e seconde. L'effet refresh remplace/réinitialise le statut existant selon le propriétaire des statuts; aucune mécanique spéciale par ID ajoutée.

## Contrôles

- RED démontré sur ancien transfert source sans soin : `37921315324`, CI en échec pour nouvelle sentinelle voulant 5 PV immédiats et 5 PV périodiques.
- Tests dédiés `tests/unit/capture-aqua-heal-five-plus-hot-v1.test.mjs` : valeurs exactes, round-trip JSON, résultat réel `createCombatSession.useSkill` et `advanceMs` à toutes les échéances jusqu'à expiration, stabilité du ciblage/formulaire.
- Mise à jour des sentinelles `tests/unit/capture-aqua-heal-author-preset-v1.test.mjs` pour refléter la modification expressément demandée ; sentinelle indépendante d'avertissement d'export sans soin `tests/unit/capture-heal-export-warning-v1.test.mjs` conservée via brouillon inachevé synthétique.
- Navigateur `tests/browser/capture-creature-library-smoke.mjs` : vérification que l'éditeur recharge une première ligne de soin direct 5 PV et une seconde ligne de soin périodique 5 PV / 3 s / 20 s, puis édite/ajoute/exporte une troisième ligne de test à 7 PV / 1,5 s / 6 s, sans perdre les deux précédentes. Vérification supplémentaire de 103 créatures et de Jet pressurisé.
- GREEN technique uniquement après succès CI complète (Node + vrai Chromium) du SHA final, revue diff, checkpoint, publication `gh-pages` sous lease et Pages SUCCESS. Validation utilisateur smartphone distincte.

## Limites voulues

L'effet est **self only**, selon ton précédent réglage ; pour soigner d'autres alliés, la cible devra être modifiée ultérieurement explicitement. Aucun sprite, son ou icône inventé : l'aspect reste à configurer par l'utilisateur. Aucun loadout de créature édité ; la capacité doit déjà être équipée (et le niveau requis atteint) pour apparaître en combat sur cette créature.
