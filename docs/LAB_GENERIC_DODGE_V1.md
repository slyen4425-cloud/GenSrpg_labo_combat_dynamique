# Esquive générique / dodgeable V1

Date : 2026-10-06

## Base

`55d1b1d5f9c5e4863e4b985d6ab9db5a44e99623`

Checkpoint de départ :

`checkpoint/lab-start-generic-dodge-v1-2026-10-06`

Branche :

`work/lab-generic-dodge-v1-2026-10-06`

## Résultat

SkillDefinition expose désormais :

`dodgeable: boolean`

Compatibilité :
- absent/null -> `true` ;
- `false` explicite -> l'attaque ne peut pas produire le résultat `evaded` via une réaction d'esquive.

## Réutilisation des owners existants

Aucun moteur Dodge supplémentaire.

`resolveReaction` utilisait déjà :
- énergie ;
- préparation ;
- cooldown ;
- limite d'utilisations ;
- horloge de l'action.

Une réaction acceptée commit déjà son cooldown via le même Combat State que toute autre compétence.

## Effets évités

Un résultat `evaded` ne rentre pas dans le chemin `hit`.

Donc une même esquive protège naturellement contre :
- dégâts directs ;
- effets structurés appliqués à l'impact ;
- statuts négatifs / debuffs de cette attaque.

Aucun filtre parallèle n'a été ajouté.

## Non esquivable

Si une réaction essaie uniquement d'esquiver une compétence `dodgeable:false` :

`outcome = not_dodgeable`

et aucun coût n'est engagé :
- pas d'énergie ;
- pas de cooldown ;
- pas d'usage consommé.

Les autres réactions restent indépendantes :
- block ;
- immune ;
- reflected ;
- countered.

Une attaque non esquivable peut donc rester bloquable, immunisable, réfléchissable ou contrable si sa configuration l'autorise.

## TDD RED

Commit :
`bb5d32e28a622f35f88ec332de189b2aa2ac466a`

CI :
`37472932155`

Résultat :
- 1139 tests ;
- 1137 PASS ;
- 2 FAIL ciblés :
  1. contrat dodgeable absent ;
  2. attaque false encore esquivée.

Les tests prouvant dégâts+debuff évités, cooldown natif et réaction block indépendante étaient déjà verts.

## GREEN

HEAD fonctionnel :
`0013194003f17e88ac099b9d96360b5c7567df53`

CI :
`37473126923`

Résultat :
- 1139 / 1139 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

- `src/contracts/skill-definition.js`
- `src/core/combat/action-resolver.js`

Test :
- `tests/unit/generic-dodge-v1.test.mjs`

## Protégé

Aucune modification de :
- Combat Runtime ;
- Combat Session ;
- Combat State cooldown owner ;
- dégâts ;
- status runtime ;
- Presence / Reach ;
- Burrow ;
- renderer / FX ;
- Tempête ;
- roster ;
- éditeur.

## Suite

Human Editor exposera plus tard :
- esquivable oui/non sur la capacité ;
- paramètres de la compétence Dodge, dont son cooldown.

Aucune valeur de cooldown auteur n'a été inventée dans ce lot.
