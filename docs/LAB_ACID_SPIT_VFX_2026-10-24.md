# Crachat acide — import des FX Capture — 24 octobre 2026

## Périmètre
- Objectif : intégrer **quatre archives auteur originales** comme animations accessibles par assetId dans le catalogue global, au moyen de la chaîne existante de sprites animés.
- Branche : `work/global-assets-acid-spit-fx-2026-10-24` ; départ : `checkpoint/global-assets-before-acid-spit-import-2026-10-24` à `86a7d513092a25952348a8ebdd8fab5f7109518d`. Base stable `global-assets@19d68f29dbd9c36456fdddbd352db20d171056a0`.
- Autorité unique : `global-assets` et `data/assets/catalog/global-visual-assets.v1.json`, aucune nouvelle autorité runtime.
- Inputs : 4 ZIP dans `_incoming/crachat-acide/` (cast, projectile, impact, aura de débuff).
- Autorisé : importer dédié, workflow dédié, dossier `assets/library/capture/sprites/skills/acid_spit/`, catalogue, sentinelle, documentation.
- Protégé : graphismes hors de ce lot, personnages, compétences et export utilisateur, noyau/éditeur, `gh-pages`, `main`, dépôt GenSrpG, Exploration et bibliothèque audio.

## Vérifications obligatoires
1. Archives réelles présentes, décompression sûre, CRC et absence de chemins dangereux.
2. Vingt images PNG RGBA transparentes distinctes par rôle, dimensions et séquence conformes ; aucune frame inventée.
3. Quatre atlas WebP vérifiés, manifestes de séquence, provenance SHA-256, quatre assetId uniques compatibles combat/editor.
4. Sentinelle sur les vrais fichiers, `npm run ci`, revue diff ciblée et CI Github finale.
5. Checkpoint GREEN sur commit réellement validé, puis seulement publication fast-forward de `global-assets`.

L'affectation automatique à la capacité auteur « Jet acide » n'est **pas** autorisée dans ce lot d'assets : un raccord visuel de la capacité exportée relève de `configuredSkills` et fera l'objet d'un contrôle distinct sans duplication. Validation visuelle smartphone distincte de la validation technique.

## Réalisation vérifiée — import média sur branche de travail

- Réception : quatre ZIP authentifiés par SHA-256 (aucun ZIP altéré), CRC ZIP OK, 26 fichiers par archive dont exactement 20 PNG RGBA 512×512, un atlas WebP 5120×256, une planche PNG source, aperçu PNG/GIF et manifeste original.
- Workflow d'import `40128186934` : SUCCESS, le 24/10/2026 ; vérification des 80 PNG, quatre atlas et leurs opacités, du catalogue, et de la CI `npm run ci` avant commit.
- Commit contenant les médias physiques originaux : `1cabb4b6fd976b539b482195f2254cf5dd189ff9`. Le stockage est `assets/library/capture/sprites/skills/acid_spit/{cast,projectile,impact,aura}/` ; manifestes et provenance inclus.
- Quatre IDs auteur conservés : `pack:capture:sprite-crachat-acide-{cast,projectile,impact,aura}-01`. Catalogue passé de 227 à 231 médias, de 126 à 130 sprites. Rôles respectifs : `release`, `travel`, `impact`, `skill`. Vitesses 70/60/65/85 ms, boucles cast/impact OFF et projectile/aura ON.
- Les sélecteurs de l'éditeur `gh-pages` consomment directement le catalogue `global-assets` et acceptent ces catégories ; aucune modification du moteur d'édition ou de gameplay n'est requise pour la sélection manuelle.
- Publication sur branche canonique, CI de l'état final et validation en jeu à vérifier séparément. Aucun paramètre de `cap_poison_atk_3` (« Jet acide ») n'est modifié.
