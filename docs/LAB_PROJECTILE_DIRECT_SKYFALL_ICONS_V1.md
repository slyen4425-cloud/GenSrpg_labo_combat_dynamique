# Labo Combat — Tir direct vs impact fixe et deux icônes Capture

**Date :** 11 octobre 2026. **Dépôt :** `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Diagnostic

Le lot `moving-target-projectile-evasion-v1` esquivait tout `form=projectile` pendant un déplacement actif de la cible. La destination fixe au lancement concerne les projectiles célestes `trajectoryMode=skyfall`, mais la règle s'appliquait à Boule de feu directe. Ce comportement est erroné.

## Source de vérité et correction

- Le contrat métier `SkillDefinition.projectileTargeting` reçoit `direct` (valeur par défaut compatible) ou `fixed_point` ; valeur inconnue refusée.
- Au seul adaptateur Capture, le `visual.travel.trajectoryMode=skyfall` autorisé par le binding auteur est projeté sur `fixed_point`, et les autres projectiles sur `direct` ; Combat Rules ne dépend pas du renderer ni des ressources média.
- ActionResolver ne considère automatiquement `moving_target` que pour les projectiles offensifs `fixed_point` et pendant le trajet actif. Esquive volontaire, réactions, portée de présence, burrow et effets non-projectiles conservent les règles précédentes.

## Associations des icônes (autorisation utilisateur explicite)

- `cap_fire_special_1`, Cendre aveuglante : `pack:capture:icon-skill-blinding-ash-01`.
- `lib_flame_bite`, Morsure brûlante : `pack:capture:icon-skill-burning-bite-01`.

Les deux médias sont déjà catalogués dans `global-assets` SHA `0c78b519588baa3535654beae6f185046beb3499`. Aucun média ajouté, modifié ou recopié. Chaque transfert ne voit changer que le champ `draft.presentation.visual.icon.assetId`. Le test SHA historique pour Cendre reconstitue strictement l'ancienne valeur de l'icône afin de vérifier la conservation de tous les autres octets de l'export.

## Gouvernance / vérifications

- Point de départ : `gh-pages` SHA `026cd22a2c0021c2de10f624f941cc36ad430ba5`, CI et Pages SUCCESS ; checkpoint `checkpoint/lab-start-projectile-direct-skyfall-icons-v1-2026-10-11`.
- Branche : `work/lab-projectile-direct-skyfall-icons-v1-2026-10-11`. Tests RED au commit `8653ab433e47d0633ab8c886b10fe14af2fd1183`.
- Chemin vrai de tests : `CombatRuntime` + ActionResolver, `adaptCaptureSkillToSkillDefinition` + présentation auteur, tests d'icônes et tests historiques de sauvegarde.
- Critère GREEN : CI complète et smokes navigateur réussis au SHA final, checkpoint exact, publication non forcée sous lease. Validation Android paysage de l'utilisateur en supplément ; aucune revendication de test tactile automatisé.
