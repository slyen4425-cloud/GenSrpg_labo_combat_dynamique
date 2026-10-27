# Unified Penetration Editor V1 — 2026-10-08

## Retour utilisateur
La pénétration devait pouvoir traverser toutes les résistances **ordinaires**, qu'elles soient élémentaires ou non, d'un seul geste.

## Audit du moteur existant
Avant le lot, `CombatDamageV1` savait déjà gérer séparément : `ignoreResistancePct` pour les résistances du **canal de dégâts** (Feu, Eau, Physique, etc.) et `ignoreDamageReductionPct` pour la réduction globale de dégâts (Défense). 100 % sur les deux fait passer un coup physique ou élémentaire sans ces deux mitigations. Les résistances négatives demeurent des faiblesses. Les immunités et boucliers ne sont pas des pourcentages de résistance et restent appliqués par leur propriétaire.

## Changement uniquement Human Editor
- Chaque ligne d'effet `damage` présente « Ignorer toutes les résistances (%) » (0–100 %).
- La saisie synchronise les **deux champs historiques** `ignoreResistancePct` et `ignoreDamageReductionPct` déjà utilisés par l'unique moteur de dégâts.
- Un bloc `Réglages avancés` permet de saisir deux valeurs différentes. Si les valeurs sont distinctes dans une ancienne capacité, le bloc s'ouvre et le champ général affiche un état `Personnalisé` vide : aucune modification automatique du contenu auteur.
- Pas de nouveau paramètre dans `SkillEffectV1` ni de seconde autorité, aucun changement au moteur de dégâts, aux zones ou à l'immunité.
- Une future notion de résistance `non-pénétrable` pourra faire l'objet d'un autre contrat validé ultérieurement, pas de comportement implicite maintenant.

## TDD et preuves
- RED : CI `37778021211` avec test du champ général absent ; autres calculs inchangés.
- GREEN : commit `6608361cb615600b34a2c144ecf9f0b07fcce81e`, CI https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37778072897 — SUCCESS (foundation + 103 créatures dans vrai Chromium).
- Tests de dégâts existants et nouveau test : Feu et Physique à 60 % de résistance + 20 % de défense reçoivent 32 dégâts sans pénétration, 100 avec 100 % pour les deux champs.
- Cendre aveuglante : audit séparé `docs/LAB_CENDRE_DEBUFF_DAMAGE_AUDIT_V1.md`, données auteur inchangées.
- Effet visuel d'esquive : micro-lot séparé `docs/LAB_DODGE_SPRITE_VISUAL_DURATION_V1.md`, durée de 700 ms par défaut ou personnalisée, Gameplay Dodge toujours 250 ms.

## Statut
GREEN technique sous réserve de CI documentaire et checkpoint exact. Validation manuelle Android de la présentation/UI attendue. Aucune modification de `main`, `Zombicide-40k` ni Exploration.
