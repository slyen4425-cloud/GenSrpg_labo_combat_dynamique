# Lumilo — publication de la classification Attaque (DOS, joueur) dans l'éditeur (2026-11-04)

## Origine
- Les 12 frames de vol ondulant du Renard magique doré/Lumilo, créées pour le déplacement, ne sont pas utiles comme déplacement pour sa configuration actuelle.
- PR média `global-assets` #233 : SHA de fusion `ebd854dbe8d993c51705ad700db9151da3de8191`, ID ancien mais stable `pack:capture:creature-renard-magique-dore-movement-player-12-v1`.
- Source officielle unique conservée : 12 images RGBA 512², atlas WebP 6144×512, 120 ms/frame, boucle, pixels/provenance et chemin inchangés. Son tag catalogue est désormais `attack`, non `movement`. Aucun sprite d'attaque FACE/adversaire n'est créé.

## Scope client
- BASE `gh-pages@7088ed939655d8e52c1ac2ec9e76ed5fadc47eb2`; START `checkpoint/lab-start-lumilo-attack-client-2026-11-04`; WORK `work/lab-lumilo-attack-client-2026-11-04`.
- Le véritable éditeur utilise déjà `captureEditorCreatureVisualKindV1` et `captureEditorAssetMatchesRoleV1` pour trier les animations de créatures. Il ne doit pas recevoir une deuxième règle, une liste spéciale Lumilo, ou un sprite synthétique.
- Seule modification fonctionnelle : révision du cache officiel `src/assets/global-visual-library.js` de v54 à `2026-11-04-v55-lumilo-player-attack-role`. Les cache URLs d'asset et de catalogue sont synchronisées. La chaîne ESM native d'éditeur (`capture-editor-v2.html` → `capture-editor-v2.js` → `capture-editor-human-v2.js` → `global-visual-library.js`) possède des URL versionnées persistantes : elles reçoivent le suffixe `lumilo-attack-role-20261104` sans changement de fonction, afin qu'aucun ancien module mis en cache n'utilise v54.
- Tests : nouveau test natif des filtres Attaque vs Déplacement et révision v55 ; adaptation des sentinelles historiques **Renard et Gorice** (unit + Chromium) qui épinglaient l'ancienne révision v54, sans modifier les médias Gorice, et Chromium servant le **vrai WebP et vrai catalogue distant**. Il refuse un asset encore classé movement, vérifie 12 images, l'orientation et l'absence d'invention de version adversaire.
- Aucun auto-équipement sur les capacités, aucun changement de données auteur / Lumilo / Charge solaire, ni changement de la vue adverse. Le joueur devra sélectionner l'animation DOS dans l'éditeur ; l'animation côté adversaire reste à réaliser séparément.

## Portes de publication
- Tests Foundation + quatre navigateurs Chromium de la CI Labo sur SHA final, checkpoint GREEN exact, PR `gh-pages` et CI/Pages postfusion avant de déclarer la livraison. Validation Android/paysage de l'auteur distincte.
