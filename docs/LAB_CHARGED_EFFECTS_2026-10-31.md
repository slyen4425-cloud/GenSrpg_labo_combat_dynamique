# Charge des buffs/debuffs et soins — lot natif V1
- Base gh-pages 73da6929a388892737f3bc1a65cd99a6d70e9fef ; checkpoint départ checkpoint/lab-start-charged-effects-2026-10-31 ; branche work/lab-charged-effects-2026-10-31.
- Le contrat chargedEffects amplifie la valeur numérique des effets immédiats : dégâts, soins et statuts numériques. Ne modifie pas les durées, polarités, les immunités, les cadences ni les autres capacités.
- Combat Runtime conserve seul le timing, les appuis et la fenêtre ; Combat Session paie chaque activation ; Status Runtime et Combat Rules appliquent les effets à l'impact une seule fois.
- TDD RED : 4e5301fcdfaf8e1a3ac46effee8c052995beca92. CI complète cinq jobs à confirmer avant GREEN ; Android séparé.
- Aucun changement à main, GenSrpg, Exploration, global-assets, aux données de compétences auteur et à la mécanique originale chargedAttack.

## Extensions prévues — lots séparés
1. CombatEntity invocable : mur PV = coefficient par point de stat Glace (ex. 1 PV/point), stats figées à invocation, cible, collision, durée et destruction ; familiar évoluera depuis le même contrat avec commandes/IA déjà propriétaires, sans seconde CombatSession.
2. Channeling : tickIntervalMs, énergie par tick ou durée, conditions d'arrêt (perte de PV, interruption, rappel, KO, manque énergie), effets SkillEffectV1 par tick, FX à chaque tick. Combat Runtime = unique horloge, Combat Rules = effets, FX = visuel, sans timer UI et sans réutiliser de force le contract contactHold.
