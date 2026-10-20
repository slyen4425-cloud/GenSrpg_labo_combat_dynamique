# Labo combat — Réglages lumière et ombres dans l'onglet Combat
Date : 20 octobre 2026.

## Contexte
Après validation technique de PR #41 (ancrage de l'ombre projetée au contact des pattes), l'utilisateur veut effectuer les réglages de l'arène depuis **Éditeur → Combat**, plutôt que depuis un volet flottant sur le terrain de jeu. Le rendu alpha 2.5D existant, ses trois modes et la projection sur les créatures volantes restent inchangés.

## Source et autorité uniques
- L'éditeur Capture comporte désormais une unique carte **Éclairage et ombres de l'arène** dans l'onglet Combat, avec six entrées : silhouette/contact/douce, direction, hauteur de lumière, douceur, intensité et hauteur de vol. Elles concernent une seule lumière partagée.
- Le pont UI `examples/dom-demo/capture-editor-v2.js` ne lit ces champs que lorsque l'auteur lance un test ; ils ne sont pas ajoutés à `editor.validate()`, `nativeCombatSource`, aux fiches de créature ou à l'export des capacités.
- `mountCaptureCombatPreviewV1` transmet ces valeurs optionnelles au `mountCombatDemo` existant sous `initialArenaLight`. Il n'ajoute aucun calcul de projection ni un nouvel owner.
- Dans le Capture, le template de combat ne contient plus de console flottante. L'état `arenaLight` et son calculateur pur `normalizeArenaShadowLightV1` demeurent au même endroit dans `demo-app.js`.
- Un intégrateur utilisant encore le laboratoire autonome avec ses anciens `[data-shadow-light-controls]` conserve son fonctionnement en direct ; cette console reste supportée pour la fixture et la rétrocompatibilité, sans réintroduire le volet flottant dans Capture.
- Les valeurs restent dans la session de l'éditeur : après retour, modifier une valeur et relancer le test recharge le nouvel éclairage. Pas de persistance d'arène/export à ce stade.

## Périmètre et invariants
Sources : `examples/dom-demo/capture-editor-v2.html`, `examples/dom-demo/capture-editor-v2.js`, `src/ui/capture-combat-preview-v1.js`, `src/ui/demo-app.js`.
Tests : `tests/unit/combat-shadow-editor-settings-2026-10-20.test.mjs`, `tests/browser/shadow-light-fixture.html` et son lanceur déjà existant `tests/browser/shadow-light-real-render-smoke.mjs` ; journal `docs/LAB_CURRENT_WORK.md`.
Aucune nouvelle couche CSS, timer, image chargée, écriture dans l'export, duplication des calculs ou modification de `main`/`global-assets`. Propriétaires du masque, rendu, animation, gameplay et collisions inchangés.

## Vérification
- Tests unitaires : champs uniquement dans Combat, valeurs et mode normalisés, transfert par le pont réel (avec et sans option), ordre de destruction des propriétaires, compatibilité rétroactive.
- Vrai Chromium : premier montage avec ancienne console tactile et projection réversible, second montage sans console en passant le réglage par `mountCaptureCombatPreviewV1`, vérification des deux acteurs dont le volant, sans nouveau serveur de test.
- CI cinq jobs et PR avant checkpoint GREEN ; validation artistique et ergonomique sur Android paysage à effectuer par l'utilisateur après publication.
