# IMPACTS — extraction de la source alpha réelle — 2026-10-03

Source utilisateur : `Planche de sprites d’impacts élémentaires.png`, 1536 × 1024, PNG RGBA.
Original conservé : `assets/library/capture/sprites/source/impact_elemental_source_01.png`.
SHA-256 source : `8a1b0ded3ed0604bd54ee01c9ea50ca5974da28b1ce1692159de481bfbed11e0`.

## Inventaire exact

5 assets logiques, 46 fichiers image : 40 PNG RGBA (400 × 400), 5 atlas WebP lossless RGBA (3200 × 400), 1 source PNG.
Le JSON de provenance est un fichier de traçabilité de découpe, pas un catalogue runtime.
8 phases par impact, 45 ms par phase. Aucun nouvel assetId.

| Planche | Famille canonique | assetId | Préfixe des 8 PNG |
| --- | --- | --- | --- |
| Lame | blade | pack:capture:sprite-impact-blade-01 | sprite_impact_blade_ |
| Coup | physical | pack:capture:sprite-impact-physical-01 | sprite_impact_physical_ |
| Électrique | electric | pack:capture:sprite-impact-electric-01 | sprite_impact_electric_ |
| Eau | water | pack:capture:sprite-impact-water-01 | sprite_impact_water_ |
| Plante | nature | pack:capture:sprite-impact-nature-01 | sprite_impact_nature_ |

PNG : `assets/library/capture/sprites/impacts/<famille>/frames/sprite_impact_<famille>_01.png` à `_08.png`.
Atlas : `assets/library/capture/sprites/impacts/<famille>/atlases/sprite_impact_<famille>_atlas_01.webp`.
Catalogue unique : `data/assets/catalog/global-visual-assets.v1.json`.
Provenance et tous les SHA-256 : `assets/library/capture/sprites/source/impact_elemental_extraction_v1.json`.

## Extraction et contrôle réel

`scripts/extract-impact-sprites-v1.py` reproduit la découpe depuis l'original verrouillé par SHA-256.
Les légendes et rectangles de titres sont exclus ; les autres pixels conservent exactement RGB et alpha.
Les sept séparations de chaque ligne suivent les creux d'alpha, car certaines traînées franchissent les colonnes nominales.
Aucune génération de remplacement, suppression de couleur, resampling, correction gameplay ou perte WebP.

Contrôles réalisés : canal alpha réel de la source ; inspection des 40 phases sur fonds clair et sombre ;
40 PNG décodés ; padding transparent ; diversité des phases et couleurs ; copie exacte des pixels source ;
5 WebP décodés dont les 40 cellules sont identiques aux PNG.
Sentinelle : `tests/unit/impact-source-alpha-v1.test.mjs`.
RED GitHub `a65ac47d720954bfecd9547e55509808390fc7fb`, CI `37147491596` : provenance absente, échec attendu.
La présence d'un fichier ou une CI verte seule ne suffit pas à valider le média.

## Limite connue et état utilisateur

Des titres sont superposés aux premières cellules dans l'original, notamment électrique et plante.
Le graphisme recouvert n'est pas disponible ; ces pixels ne sont pas inventés et restent transparents.
La preview doit rendre cette limite visible. Validation finale utilisateur et checkpoint GREEN final restent en attente.

Seuls ces cinq impacts sont publiables par ce micro-lot. Les 20 atlas casts/projectiles/statuts précédemment
présents sur la branche work ne sont pas validés par ce rapport et ne sont pas promus.
La vraie Boule de feu et ses médias dédiés restent intacts.
Le resolver conserve exclusivement `global-assets` comme autorité de médias.

## Publication contrôlée

Base bibliothèque : `d73ad04dbc6c3f8de492b9a503653c4c6f2e753c`.
Branche de vérification isolée : `work/global-assets-impact-source-release-v1-2026-10-03`.
Elle contient uniquement le micro-lot impact avant promotion fast-forward dans `global-assets`.
Le catalogue conserve les 5 IDs et ne modifie que leurs ressources. Les autres familles attendent leurs sources.


## Contrôle runtime réel — IMPACTS — 2026-10-03

Preview vérifiée : https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/a2069a419b3421e91a6c9d475904a9af0d75a818/examples/dom-demo/impact-review.html
Code de preview contrôlé : laboratoire `a2069a419b3421e91a6c9d475904a9af0d75a818`.
Médias publiés contrôlés : global-assets `b235f2b0deee0f79e4e6e1de81f05ba1b9921eec`.

- Les cinq atlas canoniques chargent depuis global-assets avec leurs dimensions réelles 3200 × 400.
- Les 40 images de phase chargent avec leurs dimensions réelles 400 × 400 ; alpha inspecté sur fonds sombre et clair.
- Le bouton « Jouer les cinq » exécute le Render Adapter existant. Chaque impact atteint l'état `finished`.
- Les cinq nœuds FX utilisent leurs assetIds existants, l'URL WebP global-assets, background-size 800% 100%, durée 360 ms et steps(7).
- Aucun SVG de remplacement, second resolver ou moteur de preview ; le module renderer est inchangé dans ce micro-lot.
- CI assets : 37148371077, 198 tests réussis. CI laboratoire : 37148737483, 912 tests réussis.
- Revue des fichiers modifiés : uniquement source/extraction/impacts, catalogue pour les cinq ressources, documentation, fixture preview et révision de cache avec sa sentinelle.

Statut : intégration et preview techniques vérifiées. La limite des titres superposés de la source reste visible et documentée.
Validation artistique de Sylvain et checkpoint GREEN final restent en attente. Les autres familles ne sont pas validées par ce lot.
Checkpoint intermédiaire de CI prévu : `checkpoint/lab-impact-source-alpha-v1-ci-2026-10-03`.
