# Tempête de venin — intégration exacte de l'export auteur (25 octobre 2026)

## Source et gouvernance
- Fichier : `gensrpg-capture-skill-cap_poison_atk_6.json`, 3520 octets UTF-8, SHA256 `75cfad7bebef9d6d6bf14e0d32a1d6b8d67d41861cfc5c0d0832b04fe732ae60`.
- BASE `gh-pages@18399aa949fc5dc11303e7642640a36ac8fb7f79`, START `checkpoint/lab-start-tempete-venin-author-2026-10-25`, branche `work/lab-tempete-venin-author-2026-10-25`.
- Propriétaire actif : `data/capture/showcase/cap_poison_atk_6.capture-skill-transfer-v1.json` ; source archivée identique en octets `data/capture/source-exports/gensrpg-capture-skill-cap_poison_atk_6-2026-10-25.json` (archive non active).
- Inscription unique dans `src/catalogs/capture-showcase-skill-presets-v1.js`, clé inchangée `cap_poison_atk_6`. Aucune deuxième autorité ; `main`, GenSrpG, moteur et autres fiches intouchés.

## Réglages auteur conservés tels quels
- Nom : **Tempête de venin**, niveau réel `requiredLevel: 15`, description textuelle historique mentionnant niveau 34 (non altérée).
- Forme `projectile`, élément `poison`, cible ennemie active, énergie 0, préparation 2000 ms, trajet 0 ms, recharge 60000 ms, interrompable en préparation.
- Effet `consume_marker` avec `markerId: "*"`, `count: "all"`, `minimum: 1`, `perCharge: true`. Cela cible **tous les types de marqueurs**, et non seulement ceux de poison ; c'est explicitement un paramètre auteur, non une déduction.
- Effets de consommation : dégâts Poison 5 **par charge retirée** (multiplicateur natif) et statut négatif `stun-marqueur` d'une durée de 2000 ms (`stacking: "replace"`, pas 2 s supplémentaires par charge).
- Présentation V9 : sprite `pack:capture:sprite-crachat-acide-impact-01`, opacité 0.8, attache sur cible, lecture unique, aucune autre animation ou icône créée arbitrairement.
- Ressource d'impact retrouvée sur `global-assets`, WebP 20 frames. Tous les autres paramètres de l'export restent inchangés.

## Vérifications et publication
- Sentinelle : `tests/integration/capture-tempete-venin-author-2026-10-25.test.mjs`, contrôle fichier actif et archive SHA exact, unicité du registre, portabilité import/export, chargement depuis `configuredSkills`, consommation de 3 marqueurs natifs de plusieurs types, 15 dégâts Poison, étourdissement 2 s, aucun effet sans marqueur.
- Foundation, 4 suites Chromium, checkpoint GREEN sur SHA exact, PR/fusion `gh-pages`, déploiement GitHub Pages avant de déclarer GREEN technique.
- Test artistique/interaction sur Android par l'auteur distinct.

## Validation de référence
- GitHub Actions Laboratory CI run `40216132023` au commit `45496031af2b4d8361488247c7dffde57f7f8686` : les cinq jobs ont terminé en `success`. Fondation : **2313 PASS / 0 FAIL**.
- La sentinelle vérifie import/export de la vraie fiche et trois marqueurs de deux familles consommés comme une seule attaque infligeant 15 dégâts Poison, avec Stun 2000 ms ; sans marqueurs, aucune consommation ni dégâts.
- La compilation/documentation au SHA final, le checkpoint GREEN et le PR restent requis avant publication ; la validation visuelle Android reste distincte.
