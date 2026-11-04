# Labo Combat — exposer l'attaque adversaire Renard magique doré 12f (2026-11-04)

## Source et périmètre
- Les médias officiels sont **déjà fusionnés** dans `global-assets` via PR #235, merge `f2ddd3cd9eb5e30907a99f61a59f6f1eb1515def`. Un seul nouveau ID `pack:capture:creature-renard-magique-dore-attack-opponent-12-v1`, action `attack`, vue `opponent`, atlas WebP lossless 6144×512, 12f RGBA 512², 115ms/frame, `playbackMode=once` et retour idle via le contrat de l'Animation Core. Aperçu WebP original conservé à l'identique, marge 66px.
- Le joueur **possède déjà une animation classée en attaque**, enregistrée sous son ID de mouvement historique `pack:capture:creature-renard-magique-dore-movement-player-12-v1` (tags `attack`) ; ne jamais la réintroduire dans le menu déplacement, et ne pas confondre les deux vues.
- Base client `gh-pages@fa33c94cefda63c07a80b9f0eb1b673bf6514322`, START `checkpoint/lab-start-renard-dore-attack-opponent-client-2026-11-04`, WORK `work/lab-renard-dore-attack-opponent-client-2026-11-04`.
- Modification runtime *unique* : `GLOBAL_VISUAL_LIBRARY.revision` v55 → `2026-11-04-v56-lumilo-opponent-attack-12f`. Il n'existe pas de deuxième catalogue ou chargeur ; seul le résolveur officiel est utilisé. Aucun changement de moteur, physique, gameplay, classeur des capacités, roster, données auteur ou modèle maître.

## Contrôles et non-régression
- TDD RED : `tests/unit/capture-renard-dore-attack-opponent-global-assets-2026-11-04.test.mjs` refuse v55, exige l'asset `attack` `opponent`, le role filter natif, le mode `once`, l'absence de mouvement adversaire fictif, la source `global-assets` unique et l'absence d'orientation miroir.
- Les tests antérieurs épinglant v55 (Lumilo joueur, Gorice 2 vues et Renard joueur, navigateur associé) sont **conservés et actualisés v56**, sans supprimer leurs assertions sur les cadres, rôles ou URLs.
- Chromium réel `tests/browser/capture-renard-dore-attack-opponent-media-smoke.mjs` : serve la page véritable de l'éditeur Capture, récupère le vrai catalogue et le WebP de `global-assets`, vérifie l'unicité de l'asset, tag attack/opponent, résolution native, WebP 6144×512, vrais pixels de frames 01/06/12 et `iterations=1` en présentation. Les tests navigateur existants restent actifs.
- CI Foundation + Chromium 5 jobs au SHA exact, checkpoint GREEN, PR vers `gh-pages`, post-merge CI et Pages. La validation visuelle sur smartphone Android paysage reste une tâche humaine distincte.
- La **frame 01 n'est pas certifiée identique** au maître original. Le WebP animé validé par l'auteur est la source artistique, non une prétendue copie maître. Aucun changement de `main`, GenSrpG, Exploration ou `global-assets` dans ce lot client.
