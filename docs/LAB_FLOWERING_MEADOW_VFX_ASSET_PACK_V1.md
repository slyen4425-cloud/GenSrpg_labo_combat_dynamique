# Capture — Prairie fleurie au sol (20 frames) — Pack asset V1

Date : 2026-10-11.

## Livrable
Effet visuel de zone au sol, légèrement ovale, montrant l'apparition d'herbe et l'éclosion de petites fleurs au fil de 20 phases. Pas de règles de dégâts, collision, gameplay ni modification du moteur.

## Autorité
Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`. Propriétaire binaire / catalogue : branche `global-assets`, base `268fa5fb09d09ad9f361792e66814f70a13e3310`.
- Checkpoint départ : `checkpoint/global-assets-before-flowering-meadow-vfx-v1-2026-10-11`.
- Travail : `work/global-assets-flowering-meadow-vfx-v1-2026-10-11`.
- Aucun changement `main` ni `Zombicide-40k`.

## Source et formats
- Source générée : `animation_de_prairie_fleurie_magique.png`, 1402×1122 pixels en grille 5×4.
- Retrait des traits de séparation dans chaque cellule, sans supprimer les fleurs claires.
- 20 WebP RGBA individuels **512×512** ; les images sont redimensionnées d'environ 280×280 par case et ne constituent pas une génération native 512.
- Atlas runtime : WebP RGBA 7680×384, 20 frames horizontales de 384×384.
- Séquence visuelle : 80 ms/frame, `once` (germination / floraison), avec possibilité future de conserver la dernière image via le mode de gel du rendu de zone.

## Liaison existante
- `assetId` stable : `pack:capture:sprite-flowering-meadow-ground-01`.
- Chemin canonique : `assets/library/capture/sprites/skills/flowering_meadow/`.
- Unique catalogue : `data/assets/catalog/global-visual-assets.v1.json` ; nouvelle entrée `sprite` classée `skill`, tags `nature/grass/flowers/ground/zone`.
- Sélection via le catalogue partagé dans les champs visuels Capture ; pas d'enregistrement de compétence ou de nouvelle autorité.
- Le moteur de zone existant reste seul responsable de son placement, de sa durée et de ses règles de gameplay. Le sprite ne fait qu'afficher une animation.

## Vérifications
- Test sentinelle : `tests/unit/capture-flowering-meadow-assets-v1.test.mjs` ; intégrité WebP / alpha / dimensions / ordre / atlas / catalogue / unicité.
- Catalogue après ajout : 122 assets, dont 69 sprites.
- Contrôle visuel des frames et des séparations effectué pendant la préparation du pack.
- Les tests automatiques et la validation du chargement via `gh-pages` doivent précéder la déclaration GREEN.

## CI structurelle — GREEN technique
- Commit pack + catalogue + sentinelles : `5774dd26d9d507750dbbb3321a3d95008363e5b5`.
- Workflow `Laboratory CI` : [run 38109312816](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/38109312816), conclusion : **SUCCESS**.
- La validation visuelle sur smartphone et la vérification du sélecteur dans la preview constituent la validation utilisateur restante. Elles ne sont pas prétendues effectuées.
