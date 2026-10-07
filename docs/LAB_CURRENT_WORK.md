# Micro-lot actif — Cendre aveuglante Author Export V3 — 2026-10-07

Branche : `work/lab-cendre-author-export-v3-2026-10-07`

Checkpoint de départ : `checkpoint/lab-start-cendre-author-export-v3-2026-10-07`
Base exacte : `75da9f9ff87a4953dd0e972be02dbc429bc67f1c`

## Source de vérité

Export utilisateur reçu : `gensrpg-capture-skill-cap_fire_special_1.json`.
ID stable : `cap_fire_special_1`.

La charte §33 impose le remplacement complet de la fiche par ID stable, sans reconstruction ni merge champ par champ.

## Différences auteur principales

Le nouvel export apporte notamment :
- SkillPresentation V9 ;
- cast `pack:capture:sprite-ash-smoke-cast-01`, socket `mouth`, X 30/Y 0, miroir X ;
- travel `pack:capture:sprite-ash-smoke-projectile-01` ;
- impact `pack:capture:sprite-ash-smoke-impact-01`, 500 ms ;
- aura de statut `pack:capture:sprite-ash-smoke-status-aura-01` ;
- nouveaux sons cast/travel/impact ;
- `targetLocations:[active]`, `hitPresenceStates:null`, `dodgeable:true` ;
- couleurs FX cendre.

## Vérifications préalables

Les 4 assetIds cendre sont présents dans le catalogue visuel global actif.
Les 3 assetIds audio sont présents dans le catalogue audio privé actif.

## Protégé

Aucun changement au Runtime, Damage/Status, collision, renderer, audio engine, Dodge, Roster, autres presets Showcase, main, GenSrpG principal ou dépôt Exploration.

## TDD

1. RED sur les valeurs V3 attendues ;
2. remplacement atomique du preset Showcase par l'export utilisateur ;
3. vrai chemin `import -> plan replace -> apply configuredSkills` ;
4. nombre de capacités inchangé / aucune duplication ;
5. CI complète ;
6. checkpoint GREEN + preview.

## Critère de fin

La fiche active `cap_fire_special_1` correspond au nouvel export utilisateur et reste remplaçable/rechargeable via le pipeline canonique.
