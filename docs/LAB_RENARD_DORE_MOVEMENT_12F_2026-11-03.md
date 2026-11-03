# Renard magique doré — mouvement ondulant / joueur, 12 frames (2026-11-03)

## Origine et autorité
- Modèle existant dans `assets/library/capture/creatures/renard_magique_dore/`. Pas de remplacement des modèles maître joueur/adversaire/icône, ni d'animation adversaire inventée.
- La prévisualisation du **mouvement joueur 12 poses** a été approuvée par l'auteur le 3 novembre : vol léger avec ondulation du corps et des queues, orientation droite conservée.
- Archive **réellement déposée** dans `global-assets/_incoming/RENARD_MAGIQUE_DORE_DEPLACEMENT_JOUEUR_12F_VALIDE (1).zip` (suffixe `(1)` exact), taille `4 840 282` octets, SHA256 `58f2869f7bfde8faea1f339d998eae8d2833a88d3bd89e9ca94e65adb1542d8a`, Git blob `88fe0398f9856580fa63f2aa96a4ed12703904b2`.
- Base immuable : `global-assets@d4b106cfab32469421d97b9e952dffb55828567a`. START `checkpoint/lab-start-renard-dore-movement-12f-2026-11-03`, WORK `work/lab-renard-dore-movement-12f-2026-11-03`. La charte principale et la charte d'animation s'appliquent.

## Responsabilités et périmètre
- Autorité media : l'**unique catalogue** `data/assets/catalog/global-visual-assets.v1.json`. Nouvel asset stable `pack:capture:creature-renard-magique-dore-movement-player-12-v1`, 1 seul objet, catégorie `creature`, type `sprite`, `format=sprite-strip`, `frameCount=12`, `frameMs=120`, `playbackMode=loop`.
- Fichiers : `assets/library/capture/creatures/renard_magique_dore/animations/movement/player/` : 12 PNG RGBA, 1 atlas WebP horizontal 6144×512, 1 GIF 12 images, 1 WebP animé 12 images, contact-sheet et manifeste.
- Les **octets originaux des 12 PNG et de l'atlas sont préservés**, aucune rotation / réorientation miroir / retouche du dessin. Plus petite marge : 77 px, au-dessus de la politique 42 px. Comparaison alpha complète et RGBA des pixels visibles de toutes les cases atlas contre PNG réel.
- Le mouvement est accessible pour **sélection native** via le catalogue du Labo Combat. Il ne doit pas remplacer les données de créature ni lui attribuer automatiquement un mouvement : le slot et les options sont contrôlés par l'éditeur existant.
- **Limite documentée** : la frame 01 n'a pas été prouvée pixel-identique au modèle maître `renard_magique_dore_player.webp` (dimensions du maître 320×320, artwork validé auparavant). La validation artistique de l'animation n'autorise pas de prétendre cette identité technique. La frame 01 ne modifie pas le modèle maître.

## Validation et livraison
- Importeur strict `scripts/import_renard_dore_movement_player_12_2026_11_03.py`, GitHub Actions `import-renard-dore-movement-12f-2026-11-03.yml`, sentinelle d'assets `tests/unit/renard-magique-dore-movement-player-12-assets.test.mjs`. TDD RED : deux fichiers et ID absents avant import ; ne jamais appeler GREEN sur cette étape.
- Conditions : intégrité ZIP et Git blob, whitelist/CRC, 12 PNG 512×512 RGBA, alpha et marges réelles, 12 images distinctes, décodage de l'atlas lossless, transparence, previews 12 frames, manifeste contrôlé, catalogue unique avec counts synchronisés, `npm run ci` sur fichiers générés et SHA final de branche. Checkpoint GREEN après preuve et CI, puis PR vers `global-assets` et CI post-fusion.
- Lot **client `gh-pages` séparé** : incrément révision cache et Chromium réel sur le nouvel asset officiel. Aucune modification de `main`, GensRPG ou Exploration, ni d'animations adversaire, combat, FX, collision ou règles dans le lot média.
- Une validation esthétique sur smartphone en paysage reste distincte des contrôles automatiques ; aucun statut de test humain fictif.
