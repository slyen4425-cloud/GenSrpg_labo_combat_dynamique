# Tempête de flammes — Cadence pendant les actions V1

Date : 2026-10-06

## Base

Base exacte :

`9463b6f3539bc8c7f195e8c9558fb576dd7c820d`

Checkpoint de départ :

`checkpoint/lab-start-firestorm-action-cadence-v1-2026-10-06`

Branche :

`work/lab-firestorm-action-cadence-v1-2026-10-06`

## Symptôme utilisateur

Après les corrections précédentes de portée et de géométrie, certains dégâts de Tempête semblaient encore s’interrompre lorsque le joueur ou l’ennemi effectuait une action.

Le chantier a donc séparé quatre questions :

1. le scheduler Combat Runtime s’arrête-t-il pendant une action ordinaire ?
2. l’activation réelle de Tempête démarre-t-elle son horloge au bon instant ?
3. un renforcement repousse-t-il un tick déjà programmé ?
4. le feedback `-5` accompagne-t-il chaque perte réelle de PV pendant les actions ?

## Résultat de l’audit

### Les actions ordinaires ne suspendaient pas le Runtime

Une reproduction fait agir simultanément les deux combattants pendant qu’une Tempête `long` est active.

Résultat avant même correction de cadence :

- tick 1 : ennemi 100 → 95 ;
- tick 2 : 95 → 90 ;
- tick 3 : 90 → 85 ;
- feedback : `[5, 5, 5]`.

Donc le scheduler Combat Runtime n’était pas stoppé par `startSkill`, `release`, `resolution` ou `recovery`.

### Défaut réel 1 — horloge initiale appliquée deux fois

Tempête possède une préparation réelle de 2000 ms.

Dans le chemin Runtime différé :

1. Combat Runtime avançait déjà `state.elapsedMs` jusqu’à l’impact ;
2. `resolveSkillCompletion` appliquait ensuite la zone à :
   `state.elapsedMs + impactAtMs`.

Pour une activation à 0 ms avec impact à 2000 ms :

- attendu : `appliedAtMs = 2000` ;
- réel avant correction : `4000`.

Conséquence :
- le sprite de zone pouvait déjà être visible ;
- le premier tick gameplay était pourtant retardé ;
- cela donnait l’impression que la zone ne tickait pas régulièrement.

### Correction

Le chemin Runtime transmet désormais explicitement l’instant combat sémantique de résolution :

Combat Runtime
→ Combat Session
→ Action Resolver
→ Persistent Zone.

Le chemin synchrone `session.useSkill()` conserve son comportement historique.

Après correction :

- impact : 2000 ms ;
- `appliedAtMs = 2000` ;
- `nextTickAtMs = 3000` ;
- premier tick : exactement 1000 ms après l’apparition sémantique de la zone.

## Défaut réel 2 — reinforce réinitialisait la phase des ticks

Avant correction, toute réactivation reconstruisait :

`nextTickAtMs = atMs + tickIntervalMs`

Exemple :

- prochain tick déjà prévu : 1000 ms ;
- renforcement à 600 ms ;
- nouveau tick avant correction : 1600 ms.

Le tick de 1000 ms était donc repoussé / perdu visuellement dans la cadence.

### Correction reinforce

`reactivation = "reinforce"` fait maintenant deux choses indépendantes :

- agrandit la zone / incrémente les activations ;
- prolonge sa durée à partir de la nouvelle activation.

Mais il conserve :

`nextTickAtMs`

de la zone déjà active.

Exemple corrigé :

- prochain tick : 1000 ms ;
- reinforce à 600 ms ;
- prochain tick reste 1000 ms ;
- expiration passe de 7000 à 7600 ms.

Cette distinction permet toujours d’atteindre :

short → medium → long

avec le vrai cooldown de Tempête, sans créer de trou dans les dégâts.

### Mode refresh distinct

`reactivation = "refresh"` continue volontairement à remettre à zéro :

- `appliedAtMs` ;
- `expiresAtMs` ;
- `nextTickAtMs`.

Aucun changement de contrat n’a été fait sur `refresh`.

## Reproduction Runtime complète du renforcement

Le test final utilise la vraie préparation de 2000 ms :

1. Tempête #1 impacte à 2000 ms ;
2. prochain tick = 3000 ms ;
3. Tempête #2 commence à 2500 ms ;
4. tick à 3000 ms pendant la préparation → dégâts ;
5. tick à 4000 ms pendant la préparation → dégâts ;
6. renforcement résout à 4500 ms → short devient medium ;
7. prochain tick reste 5000 ms ;
8. tick à 5000 ms → dégâts.

PV :

100 → 95 → 90 → 85

Feedback :

`[5, 5, 5]`.

## TDD

### RED

Commit :

`39714a31637e43a191db2374ecf8f1eb960dc16d`

CI :

`37442127415`

Résultat :

- 1123 tests ;
- 1121 PASS ;
- 2 FAIL ciblés.

Échecs :

1. `appliedAtMs = 4000` au lieu de `2000`;
2. reinforce repoussait `nextTickAtMs = 1600` au lieu de conserver `1000`.

Le test des actions ordinaires était déjà PASS.

### GREEN fonctionnel

CI :

`37442786048`

Résultat :

- 1123 / 1123 PASS.

### GREEN final avec renforcement Runtime réel

Commit test :

`f1713501cab5e7634ff5fdca6ca0cc045801260e`

CI :

`37442904928`

Résultat :

- 1124 tests ;
- 1124 PASS ;
- 0 FAIL.

## Fichiers fonctionnels modifiés

- `src/core/combat/action-resolver.js`
- `src/core/combat/combat-session.js`
- `src/core/combat/combat-runtime.js`
- `src/core/combat/persistent-zone-runtime-v1.js`

Tests :

- `tests/unit/firestorm-action-cadence-v1.test.mjs`

## Domaines protégés

Aucune modification de :

- `cap_fire_atk_6.capture-skill-transfer-v1.json` ;
- dégâts Tempête = 5 ;
- intervalle = 1000 ms ;
- durée configurée = 7000 ms ;
- short / medium / long ;
- renderer FX ;
- texte flottant ;
- sprite / scale / offsets ;
- géométrie visuelle ;
- collision ;
- sockets ;
- IA de combat.

## Validation smartphone

À vérifier sur la preview :

1. activer Tempête ;
2. attendre le premier tick : il doit arriver environ 1 s après apparition effective de la zone ;
3. lancer une autre attaque pendant les ticks : ils doivent continuer ;
4. laisser l’ennemi attaquer pendant les ticks : ils doivent continuer ;
5. renforcer Tempête pendant la cadence : aucun tick ne doit être repoussé ;
6. vérifier short → medium → long ;
7. chaque baisse réelle de 5 PV doit avoir son `-5`.

État : GREEN technique jusqu’à validation smartphone utilisateur.
