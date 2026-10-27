# Burrow gameplay V1

Date : 2026-10-06

## Base

Base exacte :

`abdd822f48c297b64071c03bec7ade3be971259a`

Checkpoint de départ :

`checkpoint/lab-start-burrow-gameplay-v1-2026-10-06`

Branche :

`work/lab-burrow-gameplay-v1-2026-10-06`

## But

Ajouter une approche souterraine générique sans faire du renderer ou de la collision une nouvelle autorité gameplay.

## Contrat

`SKILL_APPROACH_MODES` accepte désormais :

- none
- ground
- aerial
- teleport
- burrow

Le contrat de présence introduit au lot précédent dérive déjà :

`approachMode = burrow` pendant le travel
→ `targetPresence = underground`.

## Résolution

Le comportement est data-driven :

- une compétence `hitPresenceStates: ["surface"]` rate une cible souterraine ;
- une compétence `hitPresenceStates: ["surface", "underground"]` peut la toucher.

Aucune condition par nom de capacité.

## Impact / contact

`burrow` n'est volontairement PAS ajouté à `CombatRuntime.reportActionContact()`.

Le déplacement souterrain n'a pas de contact visible autoritaire pendant son trajet.

Conséquence :

- aucun watcher DOM souterrain ;
- aucune collision invisible ;
- aucun second calcul d'impact ;
- l'impact reste fixé par l'action et l'horloge Combat Runtime existantes.

Le futur rendu d'émergence devra se caler sur cet impact, jamais le piloter.

## Timing

Le statut existant `approach_time_modifier` agit maintenant sur :

- ground
- aerial
- burrow

via le même `effectiveApproachTimingMs`.

Aucun système de vitesse souterraine séparé.

## TDD RED

Commit :

`fea5c3f18398340d1b7c2bc10755e36cd540e90b`

CI :

`37471825343`

Résultat :

- 1134 tests ;
- 1129 PASS ;
- 5 FAIL ciblés.

Les cinq échecs correspondaient exactement à :
- burrow non reconnu ;
- modifier de temps non appliqué ;
- scénarios underground bloqués à la normalisation.

## GREEN

HEAD fonctionnel :

`02ce3d624d006c1727eb2dd735d3fe7c40fee584`

CI :

`37471953028`

Résultat :

- 1134 / 1134 PASS ;
- 0 FAIL.

Sentinelles :
- SkillDefinition accepte burrow ;
- même owner de timing ;
- surface-only rate underground ;
- underground-capable touche underground ;
- visible-contact reporting reste non autoritaire.

## Fichiers fonctionnels modifiés

- `src/contracts/skill-definition.js`
- `src/core/combat/combat-timing.js`

Test :
- `tests/integration/burrow-gameplay-v1.test.mjs`

## Domaines protégés

Aucune modification de :
- Combat Runtime ;
- Combat Session ;
- Action Resolver ;
- reportActionContact ;
- renderer ;
- Animation Core ;
- collision ;
- données compétences historiques ;
- Tempête ;
- dégâts ;
- status ;
- roster ;
- éditeur.

## Suite

Le rendu visuel souterrain fera l'objet d'un lot séparé après stabilisation des contrats gameplay.

Le lot fonctionnel suivant est l'esquive générique :
- cooldown existant ;
- `dodgeable` explicite ;
- réutilisation du système de réaction existant ;
- aucun moteur d'esquive parallèle.
