# Lot 2026-11-16 — Créature pourpre (dos), 8 poses de course et d’attaque

- **But** : raccorder les deux ZIP déjà déposés et explicitement validés par l’auteur à la bibliothèque visuelle Capture, sans toucher à la créature violette.
- **Propriétaire** : `global-assets` / catalogue unique `data/assets/catalog/global-visual-assets.v1.json`.
- **Base SHA** : `94a273be34b8b7e77c420dd53dc324e1d60f676b`.
- **Checkpoint de départ** : `checkpoint/lab-start-pourpre-dos-animations-2026-11-16`.
- **Travail** : `work/lab-pourpre-dos-animations-2026-11-16`.
- **Sources déposées** : `_incoming/pourpre_course_dos_8f_corrigee.zip` (Git blob `804f472ea91c8487409d96df8ac141ba6f7b7edc`) ; `_incoming/pourpre_attaque_dos_8f.zip` (Git blob `f1e2fa943e05537d604e17d31166f0afecc083a7`).
- **Animation course** : modèle corrigé par l’auteur, huit PNG RGBA 512 × 512, boucle 83 ms/frame (12 FPS).
- **Animation attaque** : huit poses source 443 × 443, placées **sans redessin ni redimensionnement** avec 34 px de marge de positionnement dans une cellule RGBA 512 × 512 ; attaque jouée une fois, 120 ms/frame.
- **Orientation** : joueur, dos 3/4, diagonale vers haut/droite.
- **Identifiants neufs** : `pack:capture:creature-pourpre-movement-player-8-v1` et `pack:capture:creature-pourpre-attack-player-8-v1`.
- **Répertoire cible** : `assets/library/capture/creatures/creature_pourpre/animations/{movement,attack}/player/`.
- **Fichiers autorisés** : dossier pourpre ci-dessus, les deux entrées additives du catalogue canonique, nouveau script, workflow et test ciblé, cette documentation, entrée journal. Les ZIP source restent dans `_incoming`.
- **Interdictions** : aucun changement au dossier `creature_violette`, aux trois médias statiques pourpre existants, aux fiches configurées, au moteur combat, à `main`, à `gh-pages` ou aux autres dépôts.
- **Validation requise** : SHA ZIP/Git, CRC, huit frames distinctes avec 42 px de marge, WEBP atlas pixel-identique, preview animée, références catalogues sans doublon, `npm run ci`, checkpoint GREEN sur commit final, promotion non forcée sous lease vers `global-assets`.
- **Statut de la présente note** : chantier en cours; la publication doit être confirmée par CI sur le SHA exact et vérification du catalogue après promotion. L’intégration à la bibliothèque ne modifie pas automatiquement les associations visuelles d’une créature configurée.
