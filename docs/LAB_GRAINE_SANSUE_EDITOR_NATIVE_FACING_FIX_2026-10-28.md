# Labo Combat — réparation réelle de Graine sansue adversaire (28 octobre 2026)

## Reproduction et cause racine
Malgré les précédentes corrections du renderer (PR #118 / #124) et du catalogue global-assets, l'auteur a vérifié sur smartphone que le projectile « Graine sansue » tiré par l'adversaire pointait encore dans le mauvais sens.

Le problème résidait dans le **chemin exécuté par l'éditeur publié**, `examples/dom-demo/capture-editor-v2.js` : la fonction `resolvePreviewPresentationAsset` reconstruisait à la main un objet contenant `assetId`, `url`, `frameCount`, `frameMs` et `playbackMode`, mais **perdait** `resource.headingRad` (et les autres métadonnées futures du résolveur canonique). Le renderer unique ne pouvait donc pas voir que Graine sansue est un sprite directionnel orienté vers la droite à l'origine, puisqu'il ne recevait pas `headingRad:0`. Cette omission causait le rendu faux, même si une autre voie de test Chromium validait l'orientation.

## Correction de cause racine — sans autorité concurrente
- Réutiliser `createGlobalPresentationAssetResolverV1` dans l'entrée réelle de l'éditeur. Ce résolveur est **déjà** le propriétaire pur du mapping du catalogue `global-assets` vers les ressources visuelles.
- Initialiser ce résolveur **une fois** lors du chargement du catalogue dans `loadPreviewVisualContext`, puis le transmettre comme fonction `resolvePresentationAsset` dans le même contexte immuable de prévisualisation.
- Remplacer la reconstruction incomplète de `resolvePreviewPresentationAsset` par la délégation directe à ce résolveur.
- Conserver les priorités préexistantes des médias de démonstration et des imports utilisateur ; les sprites neutres restent neutres.
- Conserver le renderer, les sprites, le catalogue, les chemins de collision, les règles gameplay, les capacités et les statistiques **inchangés**.
- Réviser uniquement l'URL du module d'entrée de l'éditeur pour éviter de réutiliser le JavaScript mis en cache. Ne pas modifier le catalogue v44, son autorité ni les ressources binaires.

## TDD et tests
- TDD RED `tests/integration/capture-editor-preview-direction-metadata-2026-10-28.test.mjs` avant implémentation : détecte le résolveur indépendant et exige la délégation canonique. La CI sur le commit de test seul a échoué comme attendu.
- Test Chromium étendu sur **l'entrée réelle** de l'éditeur : le navigateur charge le vrai `GLOBAL_VISUAL_LIBRARY.catalogUrl`, l'export actif Graine sansue et passe par `resolvePreviewPresentationAsset` / `buildPreviewPresentationAssets` avec vue adverse `opponent-1`. L'assertion exige `headingRad:0` au rendu réel, pas seulement dans le catalogue.
- Tests existants du vrai renderer DOM et des deux miroirs conservés.
- Contrôles de livraison obligatoires : Foundation + quatre suites Chromium SUCCESS au SHA de travail, checkpoint GREEN, PR gh-pages, puis CI/Pages SUCCESS. La validation perceptive sur Android appartient à l'auteur.

## Traçabilité
- BASE `gh-pages@b4bdf5e0e78045fac899e22dc3e2e07c049afd22`.
- START `checkpoint/lab-start-projectile-preview-heading-loss-2026-10-28`.
- WORK `work/lab-projectile-preview-heading-loss-2026-10-28`.
- Médias `global-assets@0233463ad1c5b2304448ff06d4786e4e66eda215` : non modifiés.
