# Labo Combat — raccord des deux mouvements Gorice validés (2026-11-03)

## Source et objectifs
- Source de vérité unique : `global-assets`, PR #219 fusionnée sur `4a97057cc6a290258bf6ef202795ffec7481d164`, CI post-merge SUCCESS run `41633767813`. Les 24 PNG et deux WebP ont été validés, leurs identifiants sont désormais :
  - `pack:capture:creature-gorille-des-glaces-movement-player-12-v1`
  - `pack:capture:creature-gorille-des-glaces-movement-opponent-12-v1`
- Base client `gh-pages@cd8759f2dee440fc39dca646d9636d8fc15f4740` ; START `checkpoint/lab-start-gorice-movement-client-refresh-2026-11-03`; WORK `work/lab-gorice-movement-client-refresh-2026-11-03`.
- Changement minimal : `GlobalVisualLibrary` passe de la révision `2026-11-03-v52-gorille-glaces-charge-opponent12` à `2026-11-03-v53-gorice-movement-24f` pour éviter un catalogue et des URLs de WebP restés en cache après déploiement.
- L'éditeur, la sélection d'animation, le rendu et les dégâts continuent à utiliser les mécanismes **existants**. Aucun second chargement ni nouveau registre. Aucun changement des données de créature, modèles maîtres, attaques, compétences, effets ou timings du moteur.

## Preuves exigées
- Unités : révision v53 ; URL de la source canonique ; deux IDs distincts ; `frameCount=12`, `playbackMode=loop` et `frameMs` player 130/opponent 110 ; le resolver natif ne génère aucun miroir artificiel.
- Chromium réel `tests/browser/capture-gorice-movement-media-smoke.mjs` : récupère le catalogue et les deux WebP réels du dépôt propriétaire ; IDs sans doublon ; contrat de média ; chargement réel, 6144×512, visibilité des frames 1/6/12, boucle côté présentation sans modification du moteur.
- Vrai chemin déjà servi : `GlobalVisualLibrary` -> `createGlobalPresentationAssetResolverV1` -> `assetForId` / UI native (un seul catalogue).
- CI Foundation et quatre Chromium sur SHA final ; checkpoint GREEN ; PR -> `gh-pages` ; CI et Pages postmerge.
- **Restriction conservée** : validation artistique des deux animations par l'auteur, mais la frame 01 côté joueur n'est pas certifiée pixel-identique au fichier maître. Ne pas créer de fausse preuve. Pas de remplacement automatique de la configuration auteur, ni d'association forcée au nom « Gorice ».
- Validation tactile Android et visualisation dans le combat réel par l'auteur distinctes de la preuve technique Chromium.

## Périmètre exact
- `src/assets/global-visual-library.js`
- `tests/unit/capture-gorice-movement-global-assets-2026-11-03.test.mjs`
- `tests/browser/capture-gorice-movement-media-smoke.mjs`
- `.github/workflows/ci.yml` ajout du test navigateur uniquement
- `docs/LAB_GORICE_MOVEMENT_CLIENT_REFRESH_2026-11-03.md` et `docs/LAB_CURRENT_WORK.md`
- Aucun changement `global-assets`, `main`, GenSrpG ou Exploration dans ce lot client.
