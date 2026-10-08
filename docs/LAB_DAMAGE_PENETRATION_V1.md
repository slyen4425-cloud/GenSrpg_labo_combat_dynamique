# Damage Penetration V1 — Rapport de micro-lot

Date : 2026-10-08

## Objectif
Rendre les attaques Capture paramétrables pour ignorer un pourcentage de résistance élémentaire et/ou de réduction globale des dégâts, **sans nouveau calculateur ni autorité concurrente**.

## Base et protection
- Base exacte : `2586766d8f1261572efdc6dc5834c9913f08dc24` (Dodge 250 ms GREEN).
- Branche : `work/lab-damage-penetration-v1-2026-10-08`.
- Checkpoint départ : `checkpoint/lab-start-damage-penetration-v1-2026-10-08`.
- Protégés : `main`, `Zombicide-40k`, Exploration, Combat Runtime, `configuredCreatures`, assets, esquive/Creature Appearance.

## Contrat unique
`SkillEffectV1`, **uniquement lorsque `kind: "damage"`** :
- `ignoreResistancePct` optionnel, de 0 à 100 : réduit uniquement les résistances positives du canal de l'attaque ; une faiblesse négative reste inchangée.
- `ignoreDamageReductionPct` optionnel, de 0 à 100 : réduit la mitigation globale `damageReductionPct` et sa projection statut sur cet impact.
- Absence de champ = 0 %, aucun changement de forme d'ancien JSON.

Calcul dans `computeCombatDamageV1`, une seule autorité : bonus attaquant → résistance effective (positive uniquement réduite) → réduction globale effective → dégâts. Les résistances et les statuts de la cible **ne sont jamais mutés** par ce calcul. Les boucliers et immunités conservent leur application distincte en aval.

## Vraie chaîne
`Éditeur → buildHumanTacticalSkillEffectsV1 → SkillEffectV1 → normalizeSkillDefinition → Combat Session → Immediate Tactical Effects → computeCombatDamageV1 → applyCombatDamageV1 → PV`.

- Dans chaque ligne `Dégâts` de l’éditeur, deux entrées numériques de 0 à 100 %, pas 5 %, sont visibles et rechargées depuis les données de l'effet.
- Le contrat du moteur est partagé par les effets `damage` normalisés ; l'UI du lot concerne **l'attaque directe**, sans extension de la configuration des zones ni des dégâts périodiques.
- Les champs ne sont ajoutés qu'aux effets `damage`, pas aux soins.
- Aucun second timing, timer ou gestionnaire d'énergie ajouté.

## TDD
- RED test unitaire de contrat/chaîne/UI : CI `37758108754` FAILURE ciblé.
- GREEN initial après raccord : CI `37758255277` SUCCESS.
- GREEN sentinelle navigateur réelle après vérification des inputs montés, en même temps que 103 créatures visibles : `38338f8d5311b93b513366beea740fb1d1fc7244`, CI `37758326580` SUCCESS.
- Cas contrôlés : 0/50/100%, valeurs invalides, résistance négative, défense globale séparée, dégâts effectivement appliqués par la session, champs DOM réels, 103 créatures.

## Statut
GREEN technique après CI documentaire finale et checkpoint sur SHA exact. GREEN utilisateur encore subordonné à un essai sur smartphone.
