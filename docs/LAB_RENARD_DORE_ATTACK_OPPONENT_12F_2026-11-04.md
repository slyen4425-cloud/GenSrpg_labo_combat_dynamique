# Renard magique doré — Attaque adversaire spirituelle 12f (2026-11-04)

## Décision et source canonique
- L'auteur valide **la version WebP animée transparente** côté adversaire ; animation initialement proposée en déplacement mais **destinée à l'action ATTAQUE** car ce renard n'a pas besoin d'une animation de marche. Séquence : ondulation/vol/queues lumineuses, vue adversaire/face légèrement 3/4, tête orientée à gauche.
- Source officielle unique : `global-assets/_incoming/RENARD_MAGIQUE_DORE_ATTAQUE_ADVERSAIRE_12F_VALIDE.zip`, 4 358 878 octets, SHA256 `7106cbcdbd2d97a985dd496d79549cf999702bfae6b88aa322bea4f03a436c3b`, Git blob SHA `3355a2f465d03db5a617de284ef1253a602c16ea`.
- WebP exact approuvé `previews/renard_magique_dore_attaque_adversaire_12f_valide.webp`, SHA256 `bb915db0f4ce66059e96f9bb293639f0d674e179d05a8245f064144157b73f57`, 12 images / 512×512. Il doit être conservé octet pour octet, avec les 12 PNG et atlas originaux du ZIP.
- BASE `global-assets@b52d22afe6ff0c635547943c63b0b51aa1553e2f`. START `checkpoint/lab-start-renard-dore-attack-opponent-12f-2026-11-04`. WORK `work/lab-renard-dore-attack-opponent-12f-2026-11-04`.
- La frame 01 **n'est pas certifiée pixel-identique au maître**. Ne pas prétendre le contraire et ne pas modifier la vue face maître / icône / vue joueur. L'auteur a approuvé l'animation WebP, non une substitution du modèle maître.
- L'animation joueur a **déjà été reclassée en attaque** sous son ID historique `pack:capture:creature-renard-magique-dore-movement-player-12-v1` (tags `attack`, action `attack` dans son manifeste). Malgré le chemin historique `movement/player`, elle ne doit pas être réintroduite dans le sélecteur Déplacement, renommée, dupliquée ni écrasée. La nouvelle séquence adversaire est une seconde animation **attaque** indépendante, sans mouvement.

## Contrat de l'asset à importer
- Chemin unique : `assets/library/capture/creatures/renard_magique_dore/animations/attack/opponent/`.
- 12 PNG 512×512 RGBA, transparence réelle, marges >=42 px et minimum effectivement mesuré **66 px**, atlas lossless WebP de 6144×512, WebP animé valide + planche de contrôle et `attack.manifest.json`. Les 12 poses sont distinctes.
- Entrée unique au catalogue officiel `data/assets/catalog/global-visual-assets.v1.json` :
  `pack:capture:creature-renard-magique-dore-attack-opponent-12-v1`
  avec `frameCount=12`, `frameMs=115`, `playbackMode=once` ; pas de loop en combat, pas de maintien final, retour idle. La preview WebP boucle uniquement pour l'inspection.
- Les frames et atlas sont comparés sur tous les pixels alpha et tous les pixels RGBA visibles : seules les valeurs RGB invisibles sous alpha zéro peuvent être normalisées par l'encodeur WebP.
- **Une seule autorité :** le catalogue `global-assets`. Pas de création d'ID dans la configuration créature, ni d'affectation forcée à sa prochaine attaque ; la bibliothèque le propose à l'éditeur en action attack/opponent et l'auteur sélectionne ce visuel.

## Validation requise
- Test RED `tests/unit/renard-dore-attack-opponent-12f-assets-2026-11-04.test.mjs`, puis import strict `scripts/import_renard_dore_attack_opponent_12_2026_11_04.py` via GitHub Actions sur WORK uniquement.

- Le test existant `tests/unit/lumilo-player-attack-reclass-2026-11-04.test.mjs` contenait une interdiction désormais obsolète de toute attaque adversaire ; il est mis à jour pour vérifier **exactement une attaque adversaire approuvée**, tout en protégeant les métadonnées et l'ID de l'attaque joueur, sans désactiver aucune sentinelle.
- ZIP source SHA256 + Git blob + CRC + whitelist + contrôle de manifest + frames + preview ; `npm run ci` sur fichiers réellement importés, SHA exact, checkpoint GREEN, PR vers `global-assets`, CI post-fusion.
- Lot client `gh-pages` **distinct après** média approuvé pour révision de cache, vrai test Chromium officiel et CI/Page ; ne pas modifier `main`, GenSrpG, Exploration, moteur combat, attaques d'autres créatures.
- La validation visuelle humaine sur Android paysage reste distincte de la CI technique ; ne pas affirmer qu'elle a été réalisée.
