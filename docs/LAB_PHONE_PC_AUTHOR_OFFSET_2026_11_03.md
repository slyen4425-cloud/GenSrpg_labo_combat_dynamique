# 2026-11-03 — Décalages X/Y auteur téléphone vs PC, source unique

## Départ
- Base `gh-pages@5dd7fe0b539d9bdc86d6d9ff638b11f6f0b18215`.
- START `checkpoint/lab-start-phone-pc-author-offset-2026-11-03`, WORK `work/lab-phone-pc-author-offset-2026-11-03`.
- Charte, roadmap, architecture et checkpoint policy LIVE contrôlés. `main`, global-assets, Exploration et GenSrpg hors périmètre.

## Source de vérité / cause / périmètre
- Auteur a fourni deux captures du même Loup volcanique sur PC et téléphone (mais capacités en cours différentes). Le rendu téléphone est la référence visuelle.
- Source réelle `data/capture/showcase/crea-loup.capture-creature-transfer-v1.json` : `presentation.viewOverrides.opponent.position.y=60`, `player.position.y=0`, `opponent.displayScale=0.8`. **Ne modifier ni exporter ni écraser ces données**.
- `src/ui/demo-app.js` passe le +60 directement à `normalizeVisualActor` et `src/adapters/renderer/dom-keyframes.js` le rend en `translate3d(0px,60px,0)`, quelle que soit la hauteur du champ 16:9. Le téléphone a une hauteur CSS d'environ 400px, le PC beaucoup plus. La différence visible de l'adversaire est précisément une erreur de changement d'unité (offset px auteur non rapporté à l'arène).
- Correction de cause : **un seul** facteur de présentation `arena.height / 400`, appliqué uniquement dans le mode combat Capture paysage (le téléphone d'origine ~400px est référence), à tous les offsets auteur X/Y dans les transformations du **même** DOM Actor Renderer et Shadow Renderer, sans changer données ni toucher à l'échelle visuelle `displayScale`, aux translations transitoires de combat ou aux calculs de dégâts.
- `ResizeObserver` (propriétaire du vrai élément `[data-combat-arena]`) met à jour ce facteur en fonction de la scène 16:9 réelle, pas du `window.innerHeight`. Le mécanisme doit être inerte dans les démos qui ne sont pas le combat Capture.
- Le capteur de contact et les FX lisent la vraie géométrie DOM transformée. Les helpers de position de repos doivent utiliser la même projection et jamais le 60px brut si le rendu projette différemment.

## Limites et protections
- Autorisé : `src/ui/demo-app.js`, `src/adapters/renderer/dom-keyframes.js`, cache ESM canonique de `src/ui/capture-combat-preview-v1.js` et entrée de l'éditeur si nécessaire, tests du vrai renderer et navigateur, `.github/workflows/ci.yml`, ces docs.
- Interdit : changer la fiche du Loup, sprites, ombres source alpha, taille/cadrage de l'arène, CSS 16:9, positions des slots, animation gameplay, dégâts, noyau Combat, éditions mobiles déjà validées, génération de double autorité.
- Tests RED : source Y60 réelle; composition actor+shadow ne projette pas encore ce Y60 de manière adaptative; 1v1/2v2 et retour au repos.
- GREEN : navigateur Chromium avec **vrai export Loup** + moteur visuel, phone reference (~400px) et PC (~900px) et redimensionnement de l'arène, coordonnées de pieds/socles normalisées identiques. Sentinelles d'animations/shadows intactes. Foundation + 4 Chromium, SHA exact, GREEN checkpoint et PR gh-pages après preuves. Validation photo téléphone utilisateur reste distincte.

## Résultats
À renseigner après RED / CI.
