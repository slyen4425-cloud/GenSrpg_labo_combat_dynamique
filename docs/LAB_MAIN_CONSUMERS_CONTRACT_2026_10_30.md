# Lot Combat — autorité main pour consommateurs (2026-10-30)

Base GREEN: Combat main@29b57811b5510686bbdc7efbbc58d8657862e841, CI #40862854745 (5 jobs SUCCESS).
START: checkpoint/lab-start-main-consumers-contract-2026-10-30 ; travail: work/lab-main-consumers-contract-2026-10-30.

Cause: Exploration main-only refuse Défense Moussado absente des transferts main. GenSrpg main-only refuse le contrat de scène intégrée native `embeddedBattle` absent de Combat main. La version Combat gh-pages@4fd0821545eaa41ce1d3115e56f3574db6273426 contient les éléments approuvés testés : extrait de réaction Moussado + port visuel intégré, sans seconde CombatSession.

Scope strict: champs réaction de Moussado sans changement de ses autres statistiques, un lifecycle propriétaire Combat, le seam `embeddedBattle` de la véritable UI 1v1/2v2, et sentinelles officielles. Aucun effet force_reserve_switch, aucune copie des autres capacités, aucun import GenSrpg, aucune promotion automatique de gh-pages, aucun asset modifié.

TDD RED: deux tests (réaction exacte + délégation/dispose scène) et tests lifecycle déjà validés ; GREEN nécessite Foundation + 4 navigateurs, contrôles de transfert et PR. Ne pas fusionner dans main avant validation appropriée / autorisation. Après promotion main, refaire CI et déploiement Exploration et GenSrpg contre le même SHA approuvé.
