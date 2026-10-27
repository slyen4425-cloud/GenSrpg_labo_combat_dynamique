# Labo Combat — Publication de la réparation Cendre aveuglante

Date : 2026-10-11. Autorité visuelle : `global-assets`.

## Rappel incident

L'icône `pack:capture:icon-skill-blinding-ash-01`, associée à `cap_fire_special_1` Cendre aveuglante, avait un fichier WebP tronqué de 1 octet. Cause et contenu inspectés sur l'image réelle. Le média réparé a été publié dans l'autorité unique `global-assets` au SHA `b24364147c5392a79b1eac9b1286fa11e4cd84a5`, CI `38137772675` SUCCESS, checkpoint GREEN `checkpoint/lab-blinding-ash-webp-repair-v1-green-2026-10-11`.

Média unique modifié : `assets/library/capture/icons/skills/icon_skill_blinding_ash_01.webp` (WebP 128×128, 9680 octets) ; `sha256=c3631d0087fb9279c2e8be6fa2317e3e4ac26a13cf0fd0fd8558ce2122c54a97`. Catalogue, autres icônes et compétence inchangés. Rapport asset : `docs/LAB_BLINDING_ASH_WEBP_REPAIR_V1.md` dans la branche `global-assets`.

## Cache navigateur

- Base : `gh-pages` `0f356996578ff92fce75a2c48f762449bc90a1bb`.
- Checkpoint départ : `checkpoint/lab-start-blinding-ash-webp-cache-v1-2026-10-11`.
- Branche : `work/lab-blinding-ash-webp-cache-v1-2026-10-11`.
- Source canonique : `src/assets/global-visual-library.js`.
- Unique modification runtime : `REVISION` = `2026-10-11-v25-blinding-ash-webp-repair`, pour rafraîchir ensemble le catalogue et les URL médias de la bibliothèque `global-assets`.
- Test sentinelle : `tests/unit/capture-skill-icons-global-library-v2.test.mjs` ; le V1 vérifie déjà l'URL de Cendre aveuglante.
- CI RED attendue : `38137867989`, test nouvelle révision refusée ; correctif `fcb0e7be876eb7670078f1bf12c8760825ea9a01` ; CI GREEN `38137905665` SUCCESS (foundation et deux navigateurs).
- Aucune modification aux 103 créatures, aux skills exportés, au gameplay, aux collisions, au renderer, à `main`, au dépôt GenSrpG ou Exploration.

## Statut de livraison

Après CI au SHA documentaire final : créer checkpoint GREEN, publier `gh-pages` par fast-forward contrôlé et vérifier GitHub Pages. La validation visuelle Android paysage par l'utilisateur reste distincte de la CI.
