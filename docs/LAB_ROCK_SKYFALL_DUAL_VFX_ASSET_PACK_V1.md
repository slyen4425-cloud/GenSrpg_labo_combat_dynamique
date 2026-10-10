# Pack roche — chute du ciel 20f + impact ascendant 16f

Date : 2026-10-10.

## Mission
D'après deux planches originales fournies/générées dans cette conversation, livrer deux assets visuels distincts sans changer le gameplay, le moteur de projectile skyfall ni les capacités des 103 créatures.

## Autorité et branches
- Source médias et catalogue : `global-assets`, base `23d978a46b6ec7b4c1529d09fc231b312957567c`.
- Checkpoint de départ exact : `checkpoint/global-assets-before-rock-skyfall-dual-vfx-v1-2026-10-10`.
- Branche de travail : `work/global-assets-rock-skyfall-dual-vfx-v1-2026-10-10`.
- Aucun changement `main`, `Zombicide-40k`, Exploration ou capacités.

## Ressources
1. `pack:capture:sprite-falling-rock-skyfall-01` — rôle `travel`, 20 phases 512×512 WebP avec alpha, ordre 01..20, 70 ms/phase, `once`. Atlas optimisé 7680×384.
2. `pack:capture:sprite-rock-impact-upward-01` — rôle `impact`, 16 phases 512×512 WebP avec alpha, ordre 01..16, 75 ms/phase, `once`. Atlas optimisé 6144×384.

La source chute mesure 1402×1122 px en grille 5×4 (~280 px par cellule). La source impact mesure 1254×1254 px en grille 4×4 (~313 px par cellule). Chaque frame 512 est **redimensionnée**, et non une génération native en 512. Les PNG sources et exports 512 sont fournis dans l'archive locale ; les médias runtime sont en WebP pour limiter le poids.

## Layout et compatibilité
- `assets/library/capture/sprites/skills/falling_rock_skyfall/` et `.../rock_impact_upward/` : `frames/`, `atlases/`, manifestes JSON, `provenance.csv`, README.
- Catalogue global unique : `data/assets/catalog/global-visual-assets.v1.json`, deux nouveaux `assetId`, 121 assets / 68 sprites au lieu de 119 / 66.
- Les nouvelles entrées `sprite` sont filtrables dans le sélecteur Capture par catégories `travel` et `impact`, tags `earth/rock/skyfall/impact`.
- La trajectoire `skyfall` existe déjà dans SkillPresentationBindingV10 et `DomSkillFxRenderer` ; aucun moteur alternatif n'a été créé.
- Les images n'entraînent aucun dégât, et n'imposent aucun réglage à `cap_earth_atk_4` : l'auteur peut les choisir par `assetId` dans les slots projectile/impact.

## Sentinelles
`tests/unit/capture-rock-skyfall-impact-assets-v1.test.mjs` vérifie les 36 images WebP et leur alpha, dimensions de frames et atlas, manifestes et chemins, deux IDs uniques, total du catalogue et conservation d'IDs historiques soin/carapaçe/Jet.

CI media+catalogue SHA `166631c3e2b0affc41dee6dc74f74ae1752d3208`, run `38080497789` **SUCCESS**.

## Clôture exigée
Vérifier la CI du SHA documentaire final et la comparaison du diff, checkpoint GREEN exact, promotion `global-assets` par fast-forward (sans force) sur HEAD observé, puis second lot distinct `gh-pages` pour actualiser uniquement la révision du catalogue (sans modifier `main`). Tester le chargement réel depuis le site ; la vérification visuelle Android reste à faire.
