# LAB — Capture Skill Icons V1

Date : 2026-10-08

## Objet

Rendre disponibles dans le labo combat six nouvelles icônes Capture publiées dans l'autorité unique `global-assets`.

## Autorité médias

- commit `global-assets` : `211401f5b9e1ced4410a03bd0002039dea0a4dba`
- checkpoint : `checkpoint/global-assets-capture-skill-icons-v1-green-2026-10-08`
- CI assets : `37697790834` SUCCESS
- CI checkpoint : `37697834458` SUCCESS
- CI publication : `37697838724` SUCCESS

## Icônes

- Cendre aveuglante — `pack:capture:icon-skill-blinding-ash-01`
- Goutte d’eau — `pack:capture:icon-skill-water-drop-01`
- Morsure marine — `pack:capture:icon-skill-marine-bite-01`
- Carapace de terre — `pack:capture:icon-skill-earth-carapace-01`
- Éclair foudroyant — `pack:capture:icon-skill-lightning-strike-01`
- Trait de givre — `pack:capture:icon-skill-frost-bolt-01`

Les six médias sont des WebP transparents 128×128 optimisés HUD mobile.

## Raccord labo

Le labo ne duplique aucun média et ne crée aucun resolver parallèle.
Il continue à lire `global-assets` via `GLOBAL_VISUAL_LIBRARY`.

Révision cache :
`2026-10-08-v18-capture-skill-icons-v1`.

Aucun `configuredSkill` n'est modifié dans ce lot. Les icônes deviennent seulement disponibles dans le catalogue/éditeur existant et restent à associer explicitement par les données de compétence.

## Domaines protégés

Inchangés :

- SkillDefinition gameplay ;
- configuredSkills ;
- FX Core / Animation Core ;
- Render Adapter ;
- Combat Rules ;
- dégâts, énergie, cooldowns, collisions ;
- main ;
- Zombicide-40k.

## Validation

CI complète labo requise avant checkpoint GREEN.
