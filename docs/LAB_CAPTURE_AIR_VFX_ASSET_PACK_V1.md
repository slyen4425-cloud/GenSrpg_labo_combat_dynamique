# Monster Capture — Air VFX : 4 animations / 80 frames

Date : 2026-10-11.

## Contrat de pack

Lot visuel additif autonome dans `global-assets`, depuis la base exacte `18b0673a17c12ba9f80f7ff539bb58b4ee20af01`, checkpoint `checkpoint/lab-start-capture-air-vfx-pack-v1-2026-10-11`, branche `work/lab-capture-air-vfx-pack-v1-2026-10-11`.

Quatre VFX au style Monster Capture, 20 frames chacun : charge de vent (`release`), rafale (`travel`), tornade (`travel`), impact de vent (`impact`).

Chaque source image de 1402x1122 en grille 5x4 est montée à 20 frames RGBA 512x512. L'atlas source RGBA 10240x512 est un format de transfert et d'archivage. L'atlas utilisé par le Labo est une bande WebP RGBA de 20×384 = 7680×384, pour préserver la compatibilité mobile. La résolution 512 est agrandie depuis des cellules sources de 280x280, non native. Animation charge 80ms `once`, rafale 65ms `loop`, tornade 70ms `loop`, impact 65ms `once`.

## IDs et propriétaire unique

- Charge de vent : `pack:capture:sprite-air-wind-charge-01`, `capture/sprites/skills/air_wind_charge/atlases/sprite_air_wind_charge_atlas_01.webp`.
- Projectile — Rafale de vent : `pack:capture:sprite-air-wind-bolt-01`, `capture/sprites/skills/air_wind_bolt/atlases/sprite_air_wind_bolt_atlas_01.webp`.
- Projectile — Tornade : `pack:capture:sprite-air-wind-tornado-01`, `capture/sprites/skills/air_wind_tornado/atlases/sprite_air_wind_tornado_atlas_01.webp`.
- Impact de vent : `pack:capture:sprite-air-wind-impact-01`, `capture/sprites/skills/air_wind_impact/atlases/sprite_air_wind_impact_atlas_01.webp`.

- Propriétaire des médias : branche `global-assets`, catalogue unique `data/assets/catalog/global-visual-assets.v1.json`. Aucun chemin `work/` dans les bindings.
- Le présent lot ne change aucune compétence, règle de combat, moteur FX, personnage, `main`, dépôt principal ou Exploration.
- L'éditeur peut sélectionner les nouveaux visuels explicitement ; aucune attribution automatique.
- Provenance et vérifications dans `provenance.csv`, fichiers `sprite_air_*_sequence.json` et scripts d'extraction reproductibles.
- CI requise : 4 IDs uniques, 80 images RGBA 512, 4 atlas WebP 7680×384, sentinelles historiques, absence de régression, checkpoint GREEN exact ; puis FF `global-assets`, ensuite micro-lot cache `gh-pages`.
- Validation visuelle smartphone séparée, jamais inférée d'une CI.

## Médias sources

- wind_charge: SHA256 `2b87e3d35b70d17564de8395be3957005914cbd6fb3e4604fe9501f22caf709a`.
- wind_bolt: SHA256 `82436f328c67acc854d64af6aba14d9e633fafbc5e517d58211acb5977f0fee7`.
- wind_tornado: SHA256 `de9ccc4584c67f81db0fa441e5c3c4586fc8dbf74e3184948927891492c6f273`.
- wind_impact: SHA256 `128a2417bfafa13068325d5b1e86f65a18bb8a68c5babf41fffb88db9ef5a4c4`.
