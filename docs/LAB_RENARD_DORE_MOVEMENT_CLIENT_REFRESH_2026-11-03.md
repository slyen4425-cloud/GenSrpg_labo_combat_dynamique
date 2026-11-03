# Labo Combat — exposition du Renard magique doré mouvement 12f (2026-11-03)

## Source de vérité et périmètre
- Deux lots séparés sans double autorité : `global-assets` reçoit les 12 frames joueur validées (PR #227), puis le client `gh-pages` ne fait que rafraîchir sa version de cache pour exposer leur media dans le sélecteur existant. La PR média ne doit pas être confondue avec ce lot d'éditeur.
- Base client immuable : `gh-pages@a75a93163aa9d33c76b349be0cf6d384faf6d4a4`, START `checkpoint/lab-start-renard-dore-movement-client-2026-11-03`, WORK `work/lab-renard-dore-movement-client-2026-11-03`.
- Autorité unique du catalogue : `GlobalVisualLibrary` référence `global-assets`; pas de registre ou de chargement alternatif. Révision `2026-11-03-v53-gorice-movement-24f` → `2026-11-03-v54-renard-dore-movement-12f`. Le resolver natif convertit les mêmes `assetId` et `resource`.
- ID attendu : `pack:capture:creature-renard-magique-dore-movement-player-12-v1`, resource atlas `capture/creatures/renard_magique_dore/animations/movement/player/atlases/renard_magique_dore_mouvement_joueur_12f.webp`, `frameCount=12`, `frameMs=120`, `playbackMode=loop`.
- Aucune modification de créature, vue adversaire, orientation, animation Gorice, compétence, gameplay, mouvement natif, combat, matériel PWA, main, GenSrpG ou Exploration. L'auteur sélectionne la nouvelle animation dans l'éditeur; aucun équipement automatique. Le modèle maître n'est pas modifié. La première frame n'est pas certifiée pixel-identique au modèle maître.

## Preuves
- Test RED : `tests/unit/capture-renard-dore-movement-global-assets-2026-11-03.test.mjs` refuse v53 et exige le nouvel ID et URL unique. Mise à jour des deux sentinelles Gorilla (unit + Chromium), car elles épinglaient la révision v53 ; restent actives et valident les animations Gorice sans changement de leur média.
- Chromium réel : `tests/browser/capture-renard-dore-movement-media-smoke.mjs`, sert l'éditeur Capture actuel, lit le catalogue réel de `global-assets`, vérifie l'unicité de l'asset, la résolution native, lit le WebP officiel 6144×512, examine 3 positions non vides, alpha, et vérifie la boucle.
- Jobs : Foundation + 4 Chromium sur le SHA final, puis checkpoint GREEN, PR vers `gh-pages`, CI + Pages post-fusion. Pas de GREEN avant l'import et la publication de PR #227.
- Validation esthétique Android/paysage distincte, non déclarée faite.
