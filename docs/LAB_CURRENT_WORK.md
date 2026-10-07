# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Dodge Vanish Visual V1

Branche :
`work/lab-dodge-vanish-visual-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-dodge-vanish-visual-v1-2026-10-07`

Base :
`e87a6acc4c5a2262cb466d2001d698aeb7e9bbd5`

## Résultat

L'Esquive proactive existante possède maintenant une projection visuelle générique :

`HUD -> Runtime -> result.window.remainingMs -> Visual Controller -> CombatVisualEvent dodge -> Animation Core -> DomActorRenderer`

Quand l'activation Runtime réussit :
- la créature disparaît ;
- son ombre disparaît avec elle ;
- elle reste invisible pendant la fenêtre active ;
- elle réapparaît proprement ;
- la durée visuelle totale est exactement celle renvoyée par le Runtime.

Aucun timer gameplay ou état Dodge parallèle n'a été ajouté.

## Propriétaires

- fenêtre/charges/recharge/résolution : Combat Runtime existant ;
- événement : CombatVisualEvent existant ;
- séquence visuelle : Animation Core ;
- rendu : DomActorRenderer existant ;
- UI : déclenchement/projection uniquement.

## TDD

RED :
- commit `e6ff459c0ac1d8b4d81bde5e3f024919a7605b2f` ;
- CI `37649766483` ;
- 1223 / 1226 PASS ;
- 3 FAIL ciblés.

GREEN fonctionnel :
- commit `e99453deaf9e1680e8fecee2910ecbc8c1484878` ;
- CI `37650601948` ;
- 1226 / 1226 PASS ;
- 0 FAIL.

Rapport :
`docs/LAB_DODGE_VANISH_VISUAL_V1.md`

## Fichiers fonctionnels

- `src/core/profiles/dodge-visual-profile-v1.js`
- `src/core/animation/plan-animation.js`
- `src/ui/combat-2v2-test-ui.js`
- `tests/unit/dodge-vanish-visual-v1.test.mjs`
- `tests/unit/contracts-and-planner.test.mjs`

## Domaines protégés

Inchangés :
- Combat Runtime / Session ;
- Rechargeable Action ;
- Damage / Status ;
- collision / projectile ;
- SkillDefinition ;
- Roster ;
- audio ;
- Showcase ;
- main ;
- GenSrpG principal ;
- Exploration.

## Chantiers futurs déjà enregistrés

Le lot `Portable Project Assets Notes V1`, présent dans la lignée de cette base, conserve les décisions suivantes pour l'intégration finale :
- bibliothèque de sons/assets personnelle persistante ;
- son importé réutilisable dans tout slot audio compatible ;
- rôle/catégorie = tag/tri/suggestion, pas une restriction ;
- game partagée transporte/résout ses créatures, sons et médias nécessaires ;
- arènes utilisateur importables par assetId ;
- futur raccord World Builder environnement/zone -> une ou plusieurs arènes.

## Suite après validation de ce lot

Micro-lot séparé possible :
**Dodge Custom Vanish FX V2**
- sprite/FX optionnel de disparition/réapparition ;
- import créateur via Asset Input existant ;
- aucun second moteur FX ;
- aucune modification des règles Dodge.

## Prochaine action protocolaire

- CI finale sur le SHA documenté ;
- checkpoint `checkpoint/lab-dodge-vanish-visual-v1-green-2026-10-07` ;
- preview `preview/lab-dodge-vanish-visual-v1-2026-10-07` ;
- validation smartphone utilisateur avant GREEN utilisateur.
