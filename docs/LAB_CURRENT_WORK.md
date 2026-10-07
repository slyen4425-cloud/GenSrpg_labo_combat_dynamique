# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Creature Dodge Appearance FX V1

Branche :
`work/lab-creature-dodge-appearance-fx-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-creature-dodge-appearance-fx-v1-2026-10-07`

Base :
`f1ef3c934e6065cfdef0e515a8bc19fa06f1c235`

## Résultat

L'Esquive conserve sa disparition/réapparition générique existante.

Une créature peut désormais posséder un visuel d'Esquive optionnel dans son **Apparence** :

- asset ;
- taille ;
- décalage X ;
- décalage Y.

Exemples possibles :
- éclair ;
- feuilles ;
- poussière ;
- fumée ;
- asset personnel.

Aucun effet n'est déduit automatiquement de l'élément.

## Ownership

Gameplay inchangé :

`HUD -> Combat Runtime -> activeWindowMs -> Visual Event dodge`

Visuel additionnel :

`Creature Presentation -> Combat Export -> Native Visual Source -> Visual Controller -> DOM Dodge FX`

Le Runtime reste seul propriétaire du timing et des règles d'Esquive.

Aucun second timer Dodge.

## Contrat

`CreaturePresentationBinding V3` ajoute uniquement :

`visual.dodge = { assetId, displayScale, offsetX, offsetY }`

Compatibilité :
- V1/V2 restent supportés ;
- sans Dodge FX, une créature reste V2 ;
- aucune migration silencieuse.

## Éditeur

Carte Apparence :
- `Effet visuel d’esquive`
- `Taille de l’effet`
- `Décalage X`
- `Décalage Y`

Import visuel :
- nouveau rôle `Esquive / disparition`
- bibliothèque GenSrpG + Mes assets.

## TDD

RED :
- `35b0c1f2fcd6ddfd66463e8dc0354a5555fad7c0`
- CI `37683689539`
- 1248 / 1252 PASS
- 4 FAIL ciblés.

Premier GREEN complet :
- `fc04b5adf465107661a611b54718750585f0cfdc`
- CI `37684672450`
- 1252 / 1252 PASS.

Renderer + compatibilité V2 :
- `c9bc40a3db5d9b0113b42f4a90f50114d42bb787`
- CI `37684809806`
- 1254 / 1254 PASS.

Vraie chaîne :
- `ec4302bcf09f9ea799caf60c160403530c5759b1`
- CI `37684989902`
- 1255 / 1255 PASS.

GREEN final fonctionnel :
- `70f9de2e36e7127389abfa88fd847c7023b1ff2a`
- CI `37685167740`
- 1255 / 1255 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_CREATURE_DODGE_APPEARANCE_FX_V1.md`

## Correctifs précédents inclus dans cette base

Boule de feu :
- puissance projectile 2 ;
- cast joueur +30 ;
- cast opposant -30.

Cendre aveuglante :
- puissance projectile 1.

Goutte vive :
- puissance projectile 2.

## Domaines protégés

Inchangés :
- Combat Runtime / Rules ;
- charges / recharge / durée Esquive ;
- Skill Contract ;
- dégâts / collision ;
- Projectile Clash ;
- Roster ;
- audio ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action protocolaire

- CI documentaire finale ;
- checkpoint `checkpoint/lab-creature-dodge-appearance-fx-v1-green-2026-10-07` ;
- preview `preview/lab-creature-dodge-appearance-fx-v1-2026-10-07` ;
- validation smartphone utilisateur.


## 2026-10-08 — Capture Skill Icons V1

- Objectif : publier six nouvelles icônes de capacités Capture et les rendre disponibles dans le catalogue visuel global existant.
- Base labo exacte : `181cada1bf19f919961fcc546b9eee5bebb7c5bc`.
- Checkpoint départ : `checkpoint/lab-start-capture-skill-icons-v1-2026-10-08`.
- Branche labo : `work/lab-capture-skill-icons-v1-2026-10-08`.
- Base assets exacte : `e5a32bcdc33f564b3d42892eeda6d5f67e792a86`.
- Checkpoint assets départ : `checkpoint/global-assets-before-capture-skill-icons-v1-2026-10-08`.
- Branche assets : `work/global-assets-capture-skill-icons-v1-2026-10-08`.
- Propriétaire : Asset Catalog / bibliothèque visuelle `global-assets`.
- Icônes ciblées : Cendre aveuglante, Goutte d'eau, Morsure marine, Carapace de terre, Éclair foudroyant, Trait de givre.
- Périmètre autorisé : `assets/library/capture/icons/skills/`, sources/provenance du pack, catalogue global, test dédié, documentation, puis cache-buster `GLOBAL_VISUAL_LIBRARY` côté labo.
- Protégés : SkillDefinition gameplay, configuredSkills, FX Core, Animation Core, Render Adapter, Combat Rules, dégâts, énergie, cooldowns, collisions, autres bindings, `main`, `Zombicide-40k`.
- Règle : les icônes sont additives et ne remplacent aucune icône/binding de compétence sans décision explicite.
- Tests : six IDs uniques dans le catalogue, six ressources image valides, résolveur global, CI assets puis CI labo complète.
- Critère GREEN : publication `global-assets` verte, cache labo avancé, CI complète verte, documentation synchronisée, checkpoint GREEN final.
- Statut : EN COURS.
