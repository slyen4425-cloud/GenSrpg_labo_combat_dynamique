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
## Validation technique et mesures réelles
- Export officiel loup `crea-loup` : même source à `Y=+60` côté adverse, `Y=0` côté joueur, échelles `0.8` et `1.2`. Aucun JSON auteur modifié.
- Nouvelle sentinelle `tests/unit/capture-wolf-author-offset-projection-2026-11-03.test.mjs` : la composition du transform Actor + Shadow utilise la même variable CSS d'arène, tandis que les translations de mouvement ne sont pas multipliées et que les démos hors Capture gardent leur comportement historique.
- Nouveau navigateur `tests/browser/capture-wolf-phone-pc-author-offset-smoke.mjs` : extrait le vrai template de combat depuis l'éditeur HTML, lit le vrai export Loup et le profil quadrupède, monte `mountCombatDemo` et compare la géométrie DOM du modèle, le repos, la taille et les pattes, en 1v1 et 2v2, fenêtre « téléphone » 920×490 contre fenêtre PC 1920×1080. Parcours navigateur réussi sur run `41638835388`.
- Résultats réels Chromium : en 1v1, centre Y adverse normalisé **0,49856 téléphone / 0,49811 PC**, base d'image **0,61727 / 0,61702** ; en 2v2, centre Y **0,46334 / 0,46280**, base **0,55523 / 0,55486**. Ces valeurs ne sont pas des prédictions issues de tests CSS statiques : elles proviennent des rectangles réellement rendus.
- L'ancienne preuve « proportions » ne testait pas les offsets auteur; elle n'était pas suffisante pour valider le cas signalé. Cette sentinelle vérifie désormais ce cas précis. Les captures de l'utilisateur montrent également des compétences en cours différentes (PC Boule de feu, téléphone Griffe) : la validation artistique finale nécessite une comparaison à l'arrêt, même créature et même arène.
- Chaîne ESM canonique de l'éditeur mise à jour ; Foundation avait détecté deux décalages de suffixe cache pendant la première passe, corrigés dans les imports (sans affecter catalogue ni gameplay).
- **GREEN final** uniquement après succès Foundation+quatre Chromium sur le SHA final du journal. Puis checkpoint/PR gh-pages, CI et Pages post-fusion. `main` et données auteur protégés.

