# Bouclier de lumière — Raccord dans le labo combat / cache catalogue (18 octobre 2026)

## Source canonique (media)
- Propriétaire : `global-assets`, SHA vérifié `df7422758a0149937763c4ffd187dd8aabc75220`.
- Référence de contrôle : `data/assets/catalog/global-visual-assets.v1.json`; deux entrées uniques.
- Répertoire : `assets/library/capture/sprites/skills/light_shield/`.
- 40 vrais PNG transparents RGBA 512×512, deux atlas WebP 20 frames chacun, provenance et manifeste. Le traitement agrandit les cellules sources d'environ 280px, ce n'est pas une résolution 512 native.
- Cast : `pack:capture:sprite-light-shield-cast-01` (release, 20 × 70ms, once).
- Barrière : `pack:capture:sprite-light-shield-barrier-01` (skill, 20 × 80ms, once, holdLastFrame=true au catalogue, frame finale index 19).
- L'importeur a exécuté `npm run ci` avec succès avant son commit GitHub de médias. La présence des octets a été recontrôlée sur GitHub.

## Raccord réel côté éditeur / gh-pages
- Base `gh-pages` : `86be8a555dc05fbef2b65c932253d88a9994a23f`; checkpoint `checkpoint/lab-start-light-shield-runtime-cache-2026-10-18`.
- Branche de travail : `work/lab-light-shield-runtime-cache-2026-10-18`.
- Le chargeur existant `src/assets/global-visual-library.js` lit le catalogue et les atlas depuis `global-assets`.
- Le seul changement du chargeur est la révision de cache `2026-10-18-v34-light-shield-cast-barrier` pour forcer l'actualisation du catalogue et les URLs d'atlas.
- Les deux `assetId` deviennent sélectionnables par les sélecteurs communs de la bibliothèque visuelle dans l'éditeur, sans seconde liste ni nouveau propriétaire.
- `tests/unit/capture-light-shield-global-library-v1.test.mjs` contrôle les deux résolutions et le rattachement au mode `hold-last` déjà en place.
- Pour conserver le dernier bouclier pendant la durée d'un statut : sélectionner le sprite Barrière de lumière dans **Visuel du statut**, puis le mode **Jouer une fois puis garder la dernière image**. Le `holdLastFrame` dans le catalogue décrit l'asset; c'est le réglage de présentation du statut qui gouverne réellement le cycle de vie.
- Aucun changement à la définition des capacités, aux dégâts, aux durées ni au moteur de combat.
- Test navigateur/smartphone réel : à confirmer par l'utilisateur ; ne pas annoncer une validation de combat live sans essai.

## Publication
Le raccord est publiable sur `gh-pages` seulement après CI du commit sur la branche de travail, avec avance rapide sans force et contrôle du SHA concurrent. Puis vérifier le workflow Pages.
