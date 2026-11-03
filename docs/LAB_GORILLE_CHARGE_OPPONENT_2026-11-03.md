# Gorille des glaces — charge/canalisation, vue adversaire (2026-11-03)

## Périmètre du chantier
- Base globale **global-assets@0042455482b9b1b4f6c9c040a5b4be3293b334f1**.
- START `checkpoint/lab-start-gorille-glaces-charge-opponent-2026-11-03`.
- Travail `work/lab-gorille-glaces-charge-opponent-2026-11-03`.
- Propriétaire : bibliothèque de médias Capture; aucune modification du moteur, éditeur, compétences, autre créature, modèle runtime ou animation joueur.
- Objectif : une seule animation **adversaire** 12 poses, orientations vers la gauche, attaque chargée/canalisée, maintien frame 12 par le moteur.
- Asset ID canonique : `pack:capture:creature-gorille-des-glaces-attack-opponent-12-charge-v1`.
- Bibliothèque cible : `assets/library/capture/creatures/gorille_des_glaces/animations/attack/opponent/`.
- Source GitHub existante : `_incoming/gorille_des_glaces_adversaire_charge_12f.zip` (Git blob `75ecdfd79c47e748d25a720d40f2bb884bdd847b`), **REJETÉE pour découpe technique**, avec plusieurs sprites touchant les frontières.
- Source recoupée importée : `_incoming/Gorille_Glaces_Adversaire_12F.zip`, SHA256 attendu `487b1cc772c4dcf1f4daa541ec99f6c04eaaf88bc8e27d19e6c3db201e2d84ba`. Même planche artistique approuvée, recadrages sûrs sans redessiner les poses.
- Source corrigée téléversée directement sur cette branche : Git blob `73dfb24b904103a5278f533bea21b73c19c20ba4` (7 707 640 octets), SHA256 ci-dessus.
- Import validé par GitHub Actions `41558245884` : 12 frames, atlas WebP lossless, manifeste et catalogue, commit `81ff592ddb2bb5b40131e1b6529c679d27ec2d4d`.
- Test sentinelle actif : `tests/unit/gorille-glaces-charge-opponent-12-assets.test.mjs`. 
- Tests : ZIP SHA/CRC, 12 frames RGBA 512, 12 poses distinctes, alpha et bords min 30 px, atlas WebP 6144x512 identique sur pixels visibles, WebP 12 images, catalogue/ID uniques, `npm run ci` et CI GitHub.
- Publication : branch work -> checkpoint GREEN uniquement si tests/CI verts -> PR vers global-assets -> cache sélecteur gh-pages actualisé/test navigateur -> validation utilisateur.
- Aucun double catalogue, aucune affectation automatique à Gorice ou à une capacité.

## État
Sources vérifiées et importées sur branche work. Publication vers global-assets et rafraîchissement cache gh-pages restent soumis aux CI du SHA final; aucune modification de main ni affectation automatique.
