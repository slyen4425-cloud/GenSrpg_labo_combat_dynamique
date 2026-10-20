# Capture — Publication du projectile Aile d’acier corrigé (20 octobre 2026)

## Validation et source officielle
- Signalement : traces des séparateurs de la planche d’animation visibles pendant le vol du projectile.
- Nettoyage préparé après inspection réelle des PNG sources (20 frames), du manifeste et de l’atlas existant.
- Auteur : validation visuelle des aperçus (« ça a l'air propre, tu peux remplacer ») ; **test réel en combat sur Android toujours distinct**.
- PR média [#26](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/pull/26), fusionnée sur `global-assets` au SHA `d8ad7ec060efe767b9f62c06314c1ac4f578e4e5` ; CI `global-assets` verte.
- Identifiant canonique inchangé : `pack:capture:sprite-steel-wing-projectile-01`.
- Fichier atlas canonique remplacé au même endroit : `assets/library/capture/sprites/skills/steel_wing_projectile/atlases/sprite_skill_steel_wing_projectile_projectile_atlas_01.webp`.
- 20 PNG RGBA 512×512 nettoyés, atlas 20 × 384×384 reconstruit, manifeste de provenance et SHA alignés, 65 ms/frame.
- Source d’origine conservée et tracée. Les autres FX (notamment impact Aile d’acier), icônes, créatures et règles de combat restent inchangés.

## Raccord de publication
- Base publique `gh-pages@9710e785bb3de25af3ed5a8a046a48476f9f2a1c`.
- Checkpoint départ : `checkpoint/lab-start-steel-wing-media-cache-v38-2026-10-20`.
- Branche isolée : `work/lab-steel-wing-media-cache-v38-2026-10-20`.
- Résolveur actif : `src/assets/global-visual-library.js` avec la même branche média `global-assets`.
- Seule invalidation : révision cache `2026-10-20-v37-four-steel-skill-icons` → `2026-10-20-v38-steel-wing-projectile-border-clean`.
- Cette révision s’applique au chargement catalogue et à l’URL finale du WebP pour forcer le navigateur à demander le média modifié, sans conserver la version en cache.
- Aucune copie du média dans `gh-pages`, aucun deuxième résolveur, aucun changement de gameplay.
- Sentinelle dédiée `tests/unit/capture-steel-wing-media-cache-v38.test.mjs` : rouge sur v37, verte sur v38 ; vérifie ID, URL, 20 frames, intervalle 65 ms et lecture `once`.
- Sentinelle des quatre icônes conservée : exigence de révision minimale v37, non verrouillée au numéro v37 désormais obsolète.

## Validation de fin
- CI du dépôt laboratoire complète et sentinelles de présentation obligatoires.
- Publication de `gh-pages` seulement après CI et revue du diff.
- Vérifier déploiement GitHub Pages du SHA publié puis essai utilisateur sur smartphone en combat avec le même projectile. Ne pas déduire la réussite du test visuel de la seule CI.
