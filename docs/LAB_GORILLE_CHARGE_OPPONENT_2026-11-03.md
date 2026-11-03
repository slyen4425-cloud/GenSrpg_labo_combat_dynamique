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
- Source recoupée à importer : `_incoming/gorille_des_glaces_adversaire_charge_12f_RECOUPE.zip`, SHA256 attendu `487b1cc772c4dcf1f4daa541ec99f6c04eaaf88bc8e27d19e6c3db201e2d84ba`. Même planche artistique approuvée, recadrages sûrs sans redessiner les poses.
- Import bloqué tant que cette source recoupée n'est pas fournie sur la branche de travail.
- Tests : ZIP SHA/CRC, 12 frames RGBA 512, 12 poses distinctes, alpha et bords min 30 px, atlas WebP 6144x512 identique sur pixels visibles, WebP 12 images, catalogue/ID uniques, `npm run ci` et CI GitHub.
- Publication : branch work -> checkpoint GREEN uniquement si tests/CI verts -> PR vers global-assets -> cache sélecteur gh-pages actualisé/test navigateur -> validation utilisateur.
- Aucun double catalogue, aucune affectation automatique à Gorice ou à une capacité.

## État
Lot préparé, aucune publication d'asset tant que l'entrée corrigée et les vérifications ne sont pas terminées.
