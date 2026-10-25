# Capture — Venombre : Ultime Fléau primordial et icône Tempête de venin (25 octobre 2026)

## Demande et propriétaire
- Trois exports auteur fournis ensemble ; **aucune valeur modifiée ou inventée**.
- Base : `gh-pages@48a6bc1113759364dee49bc4a9d4b659298fe8d9`.
- START : `checkpoint/lab-start-venombre-ultimate-and-poison-visuals-2026-10-25`.
- Branche : `work/lab-venombre-ultimate-and-poison-visuals-2026-10-25`.
- Autorité unique : `data/capture/showcase/` et registres existants `configuredCreatures` / `configuredSkills`. Une seule entrée `cap_poison_atk_7` dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`; aucun clone dans un catalogue natif.

## Exports exacts et historique conservé
1. Venombre `crea_tox_2` : 4570 octets SHA256 `9160546cccfeede4cfcdca3aaa86a72114528225dd11f3c5f86fcd1dec1d4172`, archive `data/capture/source-exports/crea_tox_2.author-export-2026-10-25-v2.json`.
2. Fléau primordial `cap_poison_atk_7` : 5345 octets SHA256 `5632ddd70f6c6b082dd66187f1c9fba71c215fda0b1063fba2d5fa01a67f861e`, archive `data/capture/source-exports/cap_poison_atk_7.author-export-2026-10-25.json`.
3. Tempête de venin `cap_poison_atk_6` : 3615 octets SHA256 `9941f0e30069fbb3acd39a826987dda52a62bc61ef197706f9ba299225a0f76f`, archive `data/capture/source-exports/cap_poison_atk_6.author-export-2026-10-25-v2.json`.
- **Anciens exports archivés conservés** (Venombre 2026-10-23 et 2026-10-24, Tempête de venin 2026-10-25 V1), tests historiques révisés uniquement lorsque leur comparaison portait à tort sur la version active en lieu et place de l'archive inerte.

## Différences comparées à la production
- Venombre : **seul** `loadout.slot-ultimate.skillId` change de `null` à `cap_poison_atk_7`. Force, stats, éléments, résistances, profil bipède, échelles FACE/DOS, sockets, audio et quatre autres capacités sont rigoureusement identiques.
- Tempête de venin : **seul** `presentation.visual.icon.assetId` ajouté `pack:capture:icon-skill-poison-corrosif-01`. Définition et impact précédents inchangés : consommation de tous marqueurs, 5 dégâts Poison par charge, Stun 2 s, 2 s de préparation et 60 s de recharge.
- Fléau primordial : capacité `ultimate` requérant niveau configuré 20, 8 énergie, cast 1500 ms, trajet 900 ms, **une utilisation par combat**, 6 charges de marqueur Poison (durée 25 s, 30 stacks max, périodicité 5 dégâts physiques par 5 s). Les sprites et l'icône auteur, feedback, échelles, caméra, etc. sont strictement conservés.
- Les descriptions textuelles historiques « niveau 46 » (Ultime) et « niveau 34 » (Tempête de venin) sont conservées **comme exportées** malgré la différence avec `requiredLevel` (20 / 15), conformément à la charte §33.1. Ce lot n'est pas une retouche de textes.

## Contrôles
- Import/export Capture, stabilité des ID, manifeste unique, remplacement en place, droits du `loadout`, mécanique des six stacks native, assets résolus via `global-assets`.
- Sentinelles `tests/integration/capture-fleau-primordial-venombre-2026-10-25.test.mjs`, `tests/integration/capture-tempete-venin-author-2026-10-25.test.mjs`, `tests/unit/capture-author-venombre-transfer-2026-10-24.test.mjs`, `tests/unit/capture-author-evening-export-2026-10-23.test.mjs`, sans changement d'implémentation du moteur.
- CI fondation + 4 navigateurs au SHA du lot ; publication après GREEN et revue. Validation visuelle Android finale par l'auteur.
