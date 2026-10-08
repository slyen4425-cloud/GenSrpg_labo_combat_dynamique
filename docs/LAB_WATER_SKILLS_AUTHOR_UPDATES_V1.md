# Water Skills Author Updates V1 — 2026-10-08

## Périmètre et sources
Deux imports utilisateur explicites `capture-skill-transfer-v1`, présentation V9, remplacés dans leur propriétaire Showcase existant, SANS créer de nouveaux IDs :

1. `gensrpg-capture-skill-cap_water_atk_1(2).json` → `data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json` (**Goutte vive**).
2. `gensrpg-capture-skill-cap_water_atk_2(1).json` → `data/capture/showcase/cap_water_atk_2.capture-skill-transfer-v1.json` (**Morsure de marée**).

Base : `8f38faadf4d0c64604db5a1287f5cf091f0a8684` ; checkpoint départ `checkpoint/lab-start-water-skills-author-updates-v1-2026-10-08` ; branche de travail `work/lab-water-skills-author-updates-v1-2026-10-08`.

## Changements EXACTS, sans modifier le moteur
### Goutte vive (`cap_water_atk_1`)
- Icône remplacée : `pack:capture:icon-skill-water-drop-01` (anciennement `core:icon-skill-meteor-shower-01`).
- Animation de projectile : lecture `loop` (anciennement `stretch`).
- Son d'impact ajouté : `gensrpg:sound:sanctuary-17b7fa2c` (volume 1, sans boucle).
- Préserve préparation 800 ms, trajet 800 ms, recovery 200 ms, cooldown 15 s, coût 3, projectile d'eau 10 dégâts, cast bouche +30, impact eau durée 650 ms et sons cast/travel.

### Morsure de marée (`cap_water_atk_2`)
- Icône remplacée : `pack:capture:icon-skill-marine-bite-01` (anciennement `core:icon-skill-aqua-dash-01`).
- Cast eau ajouté : `pack:capture:sprite-cast-water-01`, échelle 2,5, `preparation-start`, `stretch`, devant les deux camps.
- Sons ajoutés : cast `gensrpg:sound:xel-48520d94`, impact `gensrpg:sound:effect-df32b429` (volume 1, sans boucle).
- Secousse caméra auteur de 120 px pendant 140 ms, conservée volontairement sans correction silencieuse.
- `castBurst` auteur maintenu tel quel (4, 5 px, durée 3 ms, opacité 0).
- Préserve contact/burrow, préparation 2 s, trajet 650 ms, recovery 300 ms, cooldown 20 s, coût 5, impact physique échelle 2, 20 dégâts eau + drain de 3 énergie.

## Intégrité des données / actifs
- Empreinte SHA-256 du JSON sémantique compact `JSON.stringify(raw)` testée égale aux deux imports utilisateur : 
  - `cap_water_atk_1` : `3ab36b051d390bdb24b37f80a8a6c04ad02877299f1982a473dba499911c7098`.
  - `cap_water_atk_2` : `0a7fba75a4f918e75f39f9be2d9dc09522758a271e8072442eed2be7ea89c791`.
- Toutes les six références visuelles trouvées dans le catalogue `global-assets` et leurs fichiers WebP physiques présents ; quatre sons trouvés dans le catalogue local et leurs fichiers MP3 physiques dans `assets/runtime/audio/private-v1`.
- AUCUN média nouveau commité, aucun placeholder, aucun nouveau lien au catalogue, aucun doublon des deux ID. Les médias existants ne sont PAS remplacés.
- Bibliothèque des 103 créatures, autres capacités, audio et assets sources, moteur, autres laboratoires protégés.

## TDD / tests
- RED : CI https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37782503619 : anciennes capacités non conformes aux fingerprints et réglages attendus.
- GREEN initial : CI https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37782866381 : **1272/1272 tests Node, 0 échec**, plus vrai navigateur Chromium confirmé GREEN.
- `tests/unit/capture-water-author-two-updates-v1.test.mjs` vérifie les deux empreintes auteur, le roundtrip Transfer, les réglages sprites/sons, le catalogue de fichiers unitaire, le remplacement batch atomique via `configuredSkills`, et les **dégâts/énergie infligés dans une vraie Combat Session**.
- L'ancienne sentinelle Maraileron a été mise en conformité avec le nouvel ID d'icône auteur, sans modifier ses données de créature.
- Restent : CI documentaire complète après rapport, checkpoint GREEN exact, preview, déploiement GitHub Pages `gh-pages`, puis **validation sur smartphone** des sons/FX et de la secousse forte.

## Protection / rollback
`main`, `Zombicide-40k`, laboratoire Exploration, `global-assets`, `configuredCreatures` et autres capacités inchangés. La base `8f38faadf4d0c64604db5a1287f5cf091f0a8684` reste le rollback de départ.
