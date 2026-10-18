# Labo Capture — lot de trois créatures (2026-10-18)

## Portée
- Requin (eau/glace), Scarabacier (acier), Venombre (poison).
- 3 fichiers WebP physiques par créature : opponent (face), player (dos), icon.
- Normalisation : 1024x1024 (face/dos) et 384x384 (icône), transparence avec canal alpha.
- Ajout de 3 fichiers de métadonnées et 9 assetIds uniques au catalogue autoritaire.
- Branches : `work/global-assets-three-creatures-2026-10-18` ; base `1f78ef9a71841836391e7d298b27b23e1854e13e` ; checkpoint `checkpoint/global-assets-before-three-creatures-2026-10-18`.
- Domaine propriétaire : Capture Visual Asset Library / Asset Input. Les règles de combat restent hors périmètre.
- Périmètre fichiers : `assets/library/capture/creatures/{requin,scarabacier,venombre}/**` ; `data/assets/catalog/global-visual-assets.v1.json` ; ce document ; `docs/LAB_CURRENT_WORK.md` ; test d'intégrité.
- Hors périmètre : `main`, `Zombicide-40k`, combat runtime, composants UI, créatures préexistantes.

## Traçabilité
Sources : 3 planches créées dans la conversation et approuvées visuellement ; découpe et export WebP à partir des planches réelles, sans placeholder. Les sources PNG maîtres sont conservées dans le livrable local séparé ; ce lot Git contient les images runtime.

## Contrôles
- Chaque fichier WebP doit porter la signature RIFF/WEBP et les dimensions prévues.
- Chaque métadonnée doit pointer vers des fichiers présents ; chaque assetId doit figurer exactement une fois dans le catalogue.
- Inspecter visuellement toutes les vues, confirmer la transparence réelle, puis tester la résolution depuis `global-assets`.
- Ne déclarer GREEN qu'avec les vérifications pertinentes et CI satisfaisante. Le catalogue ne remplace jamais l'examen des médias réels.
