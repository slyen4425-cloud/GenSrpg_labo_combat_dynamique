# LAB — Capture Skill Icons V1 — Assets

Date : 2026-10-08

## Objet

Publier six nouvelles icônes de capacités Capture dans l'autorité unique `global-assets`, sans modifier automatiquement les compétences existantes.

## Base / branches

- base assets : `e5a32bcdc33f564b3d42892eeda6d5f67e792a86`
- checkpoint départ : `checkpoint/global-assets-before-capture-skill-icons-v1-2026-10-08`
- branche : `work/global-assets-capture-skill-icons-v1-2026-10-08`

## Contenu

Six WebP transparents 128×128, optimisés pour HUD mobile :

- Cendre aveuglante — `pack:capture:icon-skill-blinding-ash-01`
- Goutte d’eau — `pack:capture:icon-skill-water-drop-01`
- Morsure marine — `pack:capture:icon-skill-marine-bite-01`
- Carapace de terre — `pack:capture:icon-skill-earth-carapace-01`
- Éclair foudroyant — `pack:capture:icon-skill-lightning-strike-01`
- Trait de givre — `pack:capture:icon-skill-frost-bolt-01`

## Ownership

- médias : `global-assets`
- catalogue unique : `data/assets/catalog/global-visual-assets.v1.json`
- résolution runtime : `GLOBAL_VISUAL_LIBRARY`

Aucun deuxième catalogue, resolver ou binding spécial n'est créé.

## Portée

Lot purement additif. Il ne modifie pas :

- `configuredSkills` ;
- `SkillDefinition` ;
- FX Core / Animation Core / renderer ;
- Combat Rules ;
- dégâts, énergie, cooldown, collision ;
- aucune ancienne icône ou liaison de compétence.

Les capacités pourront choisir ces icônes explicitement via l'éditeur/binding existant.

## Validation attendue

- 6 IDs uniques ;
- 6 WebP réels ;
- compteurs catalogue cohérents ;
- CI assets verte ;
- publication non forcée de `global-assets` ;
- raccord labo limité au cache du resolver.
