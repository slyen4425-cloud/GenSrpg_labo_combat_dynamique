# Armure de ronces — Plante carnivore : masque défensif 6 frames (2026-11-03)

## Provenance et décision
- Travail exclusivement dans le laboratoire Combat, autorité visuelle `global-assets`.
- Source utilisateur validée pour l'import : `global-assets:_incoming/armure_ronces_plante_carnivore_6f.zip`, 4 439 017 octets, Git blob `97750b8ab5cb623c6aa8e8aa6bf3b5c3e241249d`, SHA256 `0ec7c6cd52bc8a3677c214bf9d49a8e45f34a6ce7d285179e811313e95ddfcac`.
- Source de création : image modèle face de la plante carnivore ; l'effet runtime ne contient QUE les pointes sur transparent. Preview compositée = preuve de cadrage artistique, PAS média pour le runtime.
- Base départ `global-assets@dc398a0056e46b267b66cb1f1c753925c86d8517`.
- Checkpoint START `checkpoint/lab-start-thorn-armor-overlay-2026-11-03`.
- Branche de travail `work/lab-thorn-armor-overlay-2026-11-03`.

## Autorités, périmètre et livraison
- Catégorie : `skill`, élément `nature`, rôle de défense / buff / status overlay.
- Nouveau seul `assetId` : `pack:capture:sprite-armure-ronces-plante-carnivore-01`.
- Cible : `assets/library/capture/sprites/skills/armure_ronces_plante_carnivore/`.
- 6 images physiques PNG RGBA 512×512, 6 poses authentiques et distinctes ; atlas horizontal WebP lossless 3072×512 (6 cases 512), une preview animée du masque seul, planche et manifeste. Prévisualisation sur créature conservée seulement comme revue, jamais servie pour l'assetId.
- Animation : `once`, `frameMs=135`, `holdLastFrame=true` index 5, les dégâts/durée sont gérés par la compétence et non par les médias.
- Aucun autre assetId, aucune affectation automatique à la créature, aucune modification de ses modèles FACE/DOS, ni runtime/règles/compétences, ni média déjà approuvé.
- Fichiers autorisés : dossier neuf de l'effet, catalogue officiel, script d'import unique, workflow d'import, test sentinelle et journal de chantier.
- Risques : mauvaise transparence, mauvais axe ancrage et mauvaise vue ; la validation artistique en jeu est distincte de la validation technique. **La source est une vue adversaire ; la réutilisation sur la vue joueur n'est pas validée.**

## Gates
1. Sentinelle RED avant import, puis GREEN vérifiant la source réelle (SHA, CRC, 6 PNG RGBA, bords transparents et marges >=30 px, atlas original identique aux frames, perte nulle sur atlas WebP de production, preview six frames).
2. Vérifier le catalogue single-authority et la CI complète sur le SHA final. Checkpoint GREEN seulement ensuite.
3. PR vers `global-assets` ; CI post-fusion ; second lot coordonné `gh-pages` pour cache et test de chargement dans le sélecteur public.
4. Rapport après tests réels, sans prétendre à une affectation automatique ou un test Android effectué.

## Statut
Préparation du lot ; source trouvée et validée localement, publication non engagée avant résultats CI.
