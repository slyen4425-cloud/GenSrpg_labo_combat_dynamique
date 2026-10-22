# Labo Combat — Sélecteurs Creature Déplacement / Attaque (22 octobre 2026)

## Demande auteur
Trier les visuels des déplacements et attaques FACE/DOS par élément et provenance, sans présenter de modèles fixes comme nouvelles animations. Respecter les anciennes sauvegardes.

## Base et autorité
- Source gh-pages@3fb1d42a594dc5a2062aa4f7a42ed0da9bbfb745, checkpoint checkpoint/lab-start-creature-asset-selector-cleanup-2026-10-22, branche work/lab-creature-asset-selector-cleanup-2026-10-22.
- Source unique des assets : global-assets:data/assets/catalog/global-visual-assets.v1.json (aucun second catalogue). Les menus réels sont bâtis par hydrateAssetCatalog puis populateSelect dans src/ui/capture-editor-human-v2.js.
- Nouveaux choix de rôle movement/attack : uniquement les vrais sprites de créature avec resource.frameCount entier supérieur à 1, rôle correspondant, compatibility editor. Ni images statiques ni FX de sorts.
- Grouper les animations dans la bibliothèque officielle/Mes assets puis par élément issu des tags canoniques, tri alphabétique. Les éléments inconnus restent Autres / non classés.
- Les anciens assetIds déjà sélectionnés restent visibles avec un libellé héritage et ne sont jamais effacés silencieusement. Aucun changement du runtime.

## Renard lunaire : trois assets statiques présents sur GitHub
- FACE : pack:capture:creature-renard-lunaire-opponent-01, 512×512.
- DOS : pack:capture:creature-renard-lunaire-player-01, 512×512.
- ICÔNE : pack:capture:creature-renard-lunaire-icon-01, 384×384, portrait médaillon.
- Ressources : capture/creatures/renard_lunaire/runtime/renard_lunaire_face.webp, renard_lunaire_dos.webp, renard_lunaire_icon.webp. Entrées présentes dans global-assets au commit 685a8f8f1638393fe5c156d6bb4f4578b0f10067. Détails dans docs/LAB_ASSET_RENARD_LUNAIRE_2026-10-22.md (branche global-assets).
- Modèles fixes, sans animations mouvement/attaque ni élément inventé ; compatibles choix d'image de créature (FACE, DOS, icône).
- L'archive ZIP déposée par l'auteur est en supplément sur global-assets ; l'application référence les WebP rangés, jamais ce ZIP.

## Tests
- tests/unit/capture-creature-animation-selector-2026-10-22.test.mjs vérifie sprites multi-frames, exclusion du statique, tri/groupes et ancienne sélection.
- tests/unit/capture-creature-movement-face-back-2026-10-21.test.mjs utilise dorénavant une ressource de test 12 frames réelle.
- CI cinq jobs et navigateur avant checkpoint GREEN technique. Le ressenti tactile Android est à faire valider en situation par l'auteur.
