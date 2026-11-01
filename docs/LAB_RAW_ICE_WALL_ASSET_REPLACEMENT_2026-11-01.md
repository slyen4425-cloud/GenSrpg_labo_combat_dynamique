# Mur de glace — remplacement des médias officiels (1er novembre 2026)

## Source de vérité et identité
- Branche média propriétaire : `global-assets`, base `b724f7fbd0c9229a5874a54809546ab64d576e78`.
- ZIP auteur déjà déposé `_incoming/MUR_GLACE_LABO_COMBAT.zip` (3 431 755 octets), SHA256 `7e47f59f6424a7073f11670ac9424dfec5e2435fd4f1aed1e40acfb8ef9a6ad5`, blob Git `c1812d522112dd2b2882a2ed9ca9c315b20da89a`.
- Unique ID conservé : `pack:capture:sprite-mur-glace-arcanique-01`. Compétence existante `mur_de_glace` inchangée. Le nom interne « arcanique » historique reste un ID opaque ; le libellé visible peut désormais préciser l'aspect glace brute naturelle.
- Le modèle est un mur **naturel en blocs cristallins**, 2.5D trois-quarts, pas une architecture de château. Le modèle final est stable après apparition.

## Périmètre effectif
- Uniquement `assets/library/capture/sprites/skills/murs_glace/mur_glace_arcanique/` : `png/` 12 frames, atlas WebP 6144 × 512, GIF 12 vues, manifeste et provenance passive.
- `data/assets/catalog/global-visual-assets.v1.json` : le seul et même objet par ID et chemin, sans seconde autorité, libellé adapté.
- `assets/library/capture/sprites/skills/murs_glace/sequence.json` : provenance de ce modèle mise à jour seulement ; les deux autres murs restent identiques.
- Les PV, dégâts, collisions, positions, capacité, et autres créatures ne sont pas concernés.

## Vérifications automatiques sur les binaires GitHub
- Importeur unique `scripts/replace_mur_glace_raw_2026_11_01.py`, workflow GitHub Actions `replace-mur-glace-raw-2026-11-01.yml`.
- Vérification du contenu réel : archive SHA256 et blob Git stricts, liste blanche de fichiers, CRC et paths sûrs, PNG RGBA 512 × 512, 12 images distinctes, **marges 42 px requises** (minimum constaté **43 px**), GIF 12 frames.
- WebP **sans perte, 6144 × 512** ; comparaison pixel à pixel de **chacune des 12 cases** contre son PNG d'origine. SHA256 d'atlas : `15430cedd8a6993a8256a85b95fd3271a69beee521f974ee738eaea079356496`. SHA256 frame finale : `975e56bc7412ace7ae5950dcd69493cd98804595ba9d12e3a0d979d8e6c2476c`.
- Contrat `frameCount:12`, `frameMs:100`, `playbackMode:once`, `holdLastFrame:true`, `persistentFrameIndex:11`, durée de vie gérée par Combat State/Damage.
- Run d'import `41346975797` : **SUCCESS**, les binaires ont été committés sur la branche de travail après `npm run ci` sur les fichiers réellement produits. La sentinelle exacte des octets est `tests/unit/capture-ice-wall-raw-approved-2026-11-01.test.mjs`.

## Publication restante et contrôle utilisateur
- Valider CI sur le SHA final, créer checkpoint GREEN, fusionner PR vers `global-assets`, puis contrôler post-fusion.
- Déclencher ensuite une branche **distincte** `gh-pages` pour incrémenter la révision du résolveur du catalogue et de l'image, vérifier les dimensions/cadrage 2.5D et la vraie animation persistante, puis déployer après CI/Pages.
- Validation esthétique sur Android paysage distincte des validations techniques.
