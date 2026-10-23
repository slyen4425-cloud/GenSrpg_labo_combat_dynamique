# Intégration auteur — Aura Lunaire + Sacrifice Kitsune (2026-10-23)

## Reprise
Base publiée `gh-pages@2151fbc1ff9b93450a0d1104a2d09b78e862f5c5`. START `checkpoint/lab-start-kitsune-dual-skills-zone-2026-10-23`, travail `work/lab-kitsune-dual-skills-zone-2026-10-23`. Dracendre V9 et la correction de sprite de mouvement aérien sont déjà fusionnés sur gh-pages (#72 puis #73) ; aucun code de créature, FX ou mouvement n'est modifié.

## Sources intactes
- `data/capture/source-exports/gensrpg-capture-skill-aura-lunaire-2026-10-23.json` SHA256 `f43b0f04c2c0072cac281aa5473065fcace38f937a1aa2bf16c4ca41c169d408`.
- `data/capture/source-exports/gensrpg-capture-skill-Sacrifice_kitsune-2026-10-23.json` SHA256 `2f7b3bcc7dfbd5ab05a214d1fdcfcb333f7910fde676a770e8822c60ab1b5e3b`.

Aura Lunaire est ajoutée sans aucune modification de source aux presets actifs. L'original de Sacrifice Kitsune est conservé byte-exact ; seule sa copie **active** est réparée et cette différence est volontairement documentée.

## Cause reproductible
- Original : `knockout:self` d'abord ; une unique zone `persistent_zone:target` applique seulement la régénération d'énergie au *target* encore vivant. Lorsque la cible est Kitsune sacrifié, elle n'est plus éligible ; lorsque la cible est ennemie, la zone peut être appliquée à l'ennemi.
- L'effet `apply_status:all_allies` de soin est immédiat et vise seulement les membres déjà présents au lancement, pas la créature de réserve qui arrive ensuite.
- L'autre `apply_status:target` de +200% dégâts est immédiat également, et n'appartient pas à la zone.
- `maxActivations:1` limite les renforcements, pas le nombre de ticks : ce champ n'est **pas** responsable du problème.
- Le moteur sait déjà conserver une zone de statut lors d'un remplacement, via `persistAfterRecall:true`, propriétaire `Persistent Zone Runtime` et `Roster Session`.

## Correction data-driven
Un seul ultime, un seul K.O., et **trois zones natives superposées**, chacune avec ID distinct :
1. Zone énergie : +100% régénération, effet `energy_regen_modifier`.
2. Zone soin : +10 PV toutes les 2 s, effet natif `heal_over_time`.
3. Zone puissance : +200% dégâts, effet natif `outgoing_damage_modifier`.

Toutes durent 45 s, rayon `short`, `targetScope:all_allies`, `statusBehavior:while_inside`, `persistAfterRecall:true`. La cible de l'ultime est restreinte à `self` pour ne pas poser un bonus chez l'ennemi. Les valeurs numériques, assets, sons, préparation, coût, icône, durée, recharge, portée sont préservés.

La limite actuelle du contrat est un `tickEffect` par zone ; trois zones natives évitent un moteur/timer/statut concurrent. Attention : l'unique présentation visuelle de l'ultime pourrait être répétée trois fois par le renderer actuel, car chaque zone possède une instance visuelle ; test Android requis pour évaluer le rendu et la géométrie commune. Aucune rustine renderer ajoutée dans ce lot.

## Périmètre, tests, protections
Fichiers : deux presets actifs, deux archives nouvelles, catalogue, test `capture-kitsune-sacrifice-2026-10-23.test.mjs`, ce document, `LAB_CURRENT_WORK.md`. Aucun changement de loadout automatique : la créature Kitsune conserve les trois capacités déjà équipées et l'auteur choisira les deux nouvelles depuis l'éditeur.

Tests : hashes bruts, unique IDs, import complet, adaptateur Combat natif, KO réel, `RosterSession.replaceKnockedOut`, persistance et héritage des trois statuts, tick HoT, calcul bonus dégâts, exclusion ennemi, expiration et Aura Lunaire. Contrôles complémentaires CI 5 jobs avant checkpoint GREEN. `main`, `global-assets`, `Zombicide-40k`, labo Exploration, assets, sons, Dracendre, autres créatures, moteur Combat et UI sont protégés.

Validation visuelle smartphone encore à effectuer : après sacrifice, nouvelle créature au même emplacement, statut soin/bonus, transparence éventuelle du sprite de zone en triple rendu.

## Timing de l'expiration
La zone débute après la préparation de 2 s, au moment de l'impact ; le test avance jusqu'après cette échéance réelle. L'implémentation et les valeurs auteur de 45 s restent inchangées.
