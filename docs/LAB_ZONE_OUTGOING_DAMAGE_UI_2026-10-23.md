# Correctif éditeur — bonus de dégâts des zones (2026-10-23)

## Symptôme
Sur Sacrifice Kitsune, après une modification du visuel uniquement, la validation renvoie « Variation dégâts infligés (%) doit être un nombre ». Le statut natif `outgoing_damage_modifier` est présent dans la 3e zone (200 %), mais l'éditeur ne crée aucun contrôle pour saisir ou afficher sa valeur à l'intérieur d'une zone.

## Cause
Dans `src/ui/capture-editor-human-v2.js`, la fonction `humanTacticalStatusToContractV1` exige `status.modifierPct` pour `outgoing_damage_modifier`, tandis que `appendHumanSkillEffectV1` n'a pas de contrôle `skillZoneStatusOutgoingDamageModifierPct` et `readHumanSkillEffectsV1` ne renseigne pas ce nombre pour les effets de zone. Les buffs simples `apply_status` ont déjà un champ, pas les zones.

## Correctif ciblé
Ajouter un champ numérique « Dégâts infligés, tous types (%) » à la section des propriétés de statut des zones, visible uniquement pour `outgoing_damage_modifier`, initialisé depuis `modifierPct`. Faire lire cette valeur par le même parcours de sauvegarde existant ; aucun défaut artificiel, aucun contournement de la validation, aucun second gestionnaire.

## Périmètre
Base `gh-pages@e4001ee7e6b8052fd3956d3af9a6ce1e02a1170b`, START `checkpoint/lab-start-zone-outgoing-damage-ui-2026-10-23`, work `work/lab-zone-outgoing-damage-ui-2026-10-23`.

Propriétaire : éditeur humain Capture. Fichiers autorisés : `src/ui/capture-editor-human-v2.js`, nouveau test `tests/unit/capture-zone-outgoing-damage-ui-2026-10-23.test.mjs`, cette note et `docs/LAB_CURRENT_WORK.md`. Protégés : JSON Sacrifice/Aura auteur et actifs, Combat/Zone/Roster Runtime, Dracendre, sprites, autres capacités, `main`, `global-assets`, GenSrpG principal, laboratoire Exploration.

## Vérification
Le champ précharge +200 et reste éditable ; la lecture du formulaire le transmet au contrat existant ; retour JSON inchangé après modification purement visuelle ; autres types et zones préservés ; sentinelles Node et CI cinq jobs, checkpoint GREEN uniquement sur SHA validé. Vérification Android de l'affichage réel par l'auteur ensuite.
