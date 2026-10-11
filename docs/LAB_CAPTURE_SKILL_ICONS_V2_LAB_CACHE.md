# Labo Combat — raccord bibliothèque Capture Skill Icons V2

Date : 2026-10-11.

## Frontières

- Propriétaire des médias, SHA GREEN vérifié : `global-assets` / `0c78b519588baa3535654beae6f185046beb3499` ; 130 assets dont 45 icônes et huit nouveaux IDs de compétences.
- Client : `gh-pages` (éditeur Capture). Base `51a53742209c8505b387271e729c89d0025dc487` ; checkpoint `checkpoint/lab-start-capture-skill-icons-v2-library-cache-2026-10-11` ; branche `work/lab-capture-skill-icons-v2-library-cache-2026-10-11`.
- Uniquement la constante de révision du catalogue `GLOBAL_VISUAL_LIBRARY.revision`, le test V2, la révision des deux sentinelles de cache historiques et la documentation de traçabilité.
- Aucune modification de capacités ou bindings existants, gameplay, rendu, dégâts, GenSrpG, `main` ou Exploration.

## Contrat

La résolution continue par l'unique `src/assets/global-visual-library.js` vers `global-assets`, même pour les huit nouvelles icônes. Révision cache : `2026-10-11-v24-capture-skill-icons-v2` ; chaque icône utilise un ID `pack:capture:icon-skill-…-01`. Les icônes sont disponibles dans le catalogue et ne sont jamais affectées automatiquement à une capacité.

## Non-régression

La première CI a révélé deux tests de lots antérieurs qui exigeaient l'ancienne valeur exacte `v23` : `tests/unit/capture-rock-skyfall-library-refresh-v1.test.mjs` et `tests/unit/stone-carapace-12frame-asset-cache-v1.test.mjs`. La cause est une assertion obsolète, pas un problème des médias. Ces tests continuent à contrôler le propriétaire, les chemins de médias, les URLs et un numéro de révision pas inférieur à V23 ; le nouveau test `tests/unit/capture-skill-icons-global-library-v2.test.mjs` garantit la valeur exacte de V24. Aucune logique de production supplémentaire n'est introduite.

## Critères de sortie

CI complète au SHA exact, checkpoint GREEN, publication fast-forward non forcée de `gh-pages` et validation de déploiement. Vérification visuelle Android à obtenir de l'utilisateur.
