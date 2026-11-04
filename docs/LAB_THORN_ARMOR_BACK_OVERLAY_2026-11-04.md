# Plante carnivore — Armure de ronces DOS / masque seulement (2026-11-04)

## Source et charte
- Entité : plante carnivore, vue **joueur dos**, référence originale `plante_carnivore_dos(1).png`.
- Source autoritative : `global-assets/_incoming/armure_ronces_plante_carnivore_dos_6f.zip` (4 597 874 octets, Git blob `0587d83efb6a1a1f18f822e406065afec552a2d5`, SHA256 `d3cdba93cc9102b760a7fd0e0dc49e0b0f0ad9d6d524a10f6940388f7688a276`).
- Branche immuable START `checkpoint/lab-start-thorn-armor-back-overlay-2026-11-04` à `global-assets@2fb20599155718940c743a72557eb1d5d6d1ec86`.
- WORK `work/lab-thorn-armor-back-overlay-2026-11-04`. Propriétaire : médias `global-assets`; ne pas changer `main` ni `gh-pages` depuis ce lot.

## Contrat de livraison
- Un nouvel asset logique `pack:capture:sprite-armure-ronces-plante-carnivore-back-01`. Ne **pas** renommer/remplacer l'asset face déjà validé `pack:capture:sprite-armure-ronces-plante-carnivore-01`.
- Chemin canonique `assets/library/capture/sprites/skills/armure_ronces_plante_carnivore/back/`.
- 6 PNG RGBA 512×512, orientation joueur/dos, pointes seulement sur fond transparent ; 6 poses distinctes, marge alpha min >=30px ; atlas WebP lossless 3072×512 ; preview du masque et planche ; vraie source ZIP avec manifest. Dernière pose tenue pendant la durée d'un buff/débuff selon la compétence.
- Composité `sur_creature` stocké comme **référence de revue uniquement**, sans être disponible via l'assetId runtime. Aucun modèle complet n'est encodé dans les sprites officiels.
- `resource.playbackMode=once`, `frameCount=6`, `frameMs=138`, `holdLastFrame=true`, `persistentFrameIndex=5`. Les durées par frame véritables restent au manifeste.
- Catégorie `skill`, tags `nature/status/defense/overlay/player/back`, compatibilité éditeur ; aucune affectation automatique à une compétence ou à la créature.
- Interdiction de toucher aux modèles créatures FACE/DOS, à l'ancienne armure de ronces FACE, aux autres assets, aux règles et au runtime.

## Validation
1. TDD : `tests/unit/capture-thorn-armor-back-6f-assets-2026-11-04.test.mjs` refuse un back absent ou incomplet.
2. Import GitHub Actions avec SHA ZIP/Git/CRC, 6 PNG RGBA, marges, 6 poses uniques, WebP identique pixel pour pixel, masque preview séparé, manifeste, registre canonique +1 asset.
3. CI complète sur SHA final, checkpoint GREEN exact, PR `global-assets` et CI post-fusion.
4. Lot client coordonné `gh-pages` sur HEAD publié pour la révision cache et test du sélecteur des effets Nature/statut. Validation téléphone distincte du test GitHub.
5. Pas de GREEN si source, média réel, CI, déploiement ou preview ne sont pas vérifiés.
