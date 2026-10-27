# Correctif régression 1v1 après présentation 2v2 — 2026-10-13

## Régression confirmée par l'auteur
Le joueur a effectivement constaté sur smartphone que le **mode solo/1v1** a été visuellement dégradé après le lot perspective ennemis/ergonomie 2v2. La CI GREEN précédente ne valide pas le confort visuel : ce retour est une régression réelle.

## Cause exacte
La scène 1v1 réutilise la même balise `class="arena arena--coop-2v2"` que la scène 2v2. La modification CSS du lot `e7366860f8b051d06bf4dabac4bcb3ec5d26167d` appliquait donc aussi au 1v1 `far-y=26%`, `left=58%`, `width=24dvh`. Avant ce lot, les valeurs paysage du 1v1 étaient `far-y=33%`, `left=77%` avec la largeur existante `31dvh` déclarée dans le CSS de base.

## Correction additive strictement scindée
- Base avant régression `1c8720c6a5a9811d7bcb6a815016beb0bc476291` pour récupérer les valeurs exactes.
- Base actuelle `e7366860f8b051d06bf4dabac4bcb3ec5d26167d`.
- `src/ui/combat-2v2-test-ui.js` expose un attribut de présentation `arena.dataset.combatActiveCount` de valeur `1` ou `2`, exclusivement dérivé du `BattleFormat` déjà normalisé par `resolveCombatPreviewFormatV1`. Aucun état Combat / acteur / contrainte gameplay ajouté.
- `examples/dom-demo/capture-editor-v2.css` réinstalle EXACTEMENT la section pré-régression pour toutes les arènes : positions far-y 33% / 34%, X 77% / 34%, taille CSS initiale. Les ajustements récents far-y 26% / 28%, X 58% / 36%, tailles 24/23dvh sont désormais déclarés sous `[data-combat-active-count="2"]`. Le mode 1v1 ne peut plus les recevoir.
- Règles `[data-local-control-mode="solo-dual"]` (switch deux créatures en 2v2) inchangées ; elles ne concernent pas le 1v1.
- Aucune modification Gameplay, IA, 103 créatures, FX, collision, assets, règle Rappel, vrai timer Esquive, main, global-assets, ni autre dépôt.

## Test et portes
- Sentinelle dédiée RED `tests/unit/capture-1v1-visual-regression-scope-v1.test.mjs` exige la source sémantique du format et les **valeurs exactes 1v1** ainsi que les valeurs 2v2 liées au compteur.
- Deux anciennes sentinelles CSS ajustées, sans supprimer leurs gardes, afin d'exiger le scope exact du nouveau placement.
- CI Foundation + Chromium bibliothèque + Chromium Firestorm sur le SHA final requis ; checkpoint GREEN sur le même SHA ; publication fast-forward sur `gh-pages` seulement sous lease sans conflit ; CI et Pages après publication. 
- Validation **manuelle smartphone** du 1v1 à refaire par l'auteur ; jamais présentée comme validée sur la base de la CI.
