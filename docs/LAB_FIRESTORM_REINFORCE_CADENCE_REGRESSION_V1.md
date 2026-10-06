# Tempête de flammes — Régression cadence de renforcement V1

Date : 2026-10-06

## Base

Base exacte :

`bfcfd65d04615fcf6695594e44d1e39eeec96e87`

Checkpoint de départ :

`checkpoint/lab-start-firestorm-reinforce-cadence-regression-v1-2026-10-06`

Branche :

`work/lab-firestorm-reinforce-cadence-regression-v1-2026-10-06`

## Pourquoi ce lot a été ouvert

L'audit LIVE demandé à la reprise a confirmé que `sequence-regression` était techniquement GREEN, mais qu'il divergeait de l'ancienne branche `firestorm-action-cadence-v1`.

Aucun merge ni cherry-pick n'a été effectué.

Le comportement manquant a été recherché directement sur le HEAD retenu.

## Faute moteur démontrée

Dans `src/core/combat/persistent-zone-runtime-v1.js`, toute réactivation reconstruisait encore :

`nextTickAtMs = atMs + tickIntervalMs`

y compris pour `reactivation = reinforce`.

Conséquence :

- un tick déjà programmé pouvait être repoussé au moment d'un renforcement ;
- l'agrandissement short → medium → long pouvait donc introduire un trou de cadence ;
- cela pouvait donner l'impression qu'une action ou un renforcement avait interrompu les ticks.

Exemple RED :

- zone active : prochain tick = 1000 ms ;
- renforcement à 600 ms ;
- attendu : prochain tick reste 1000 ms ;
- réel : prochain tick devenait 1600 ms.

## TDD RED

Commit sentinelle :

`ecfd69975464ec3fe3ea48c1bb96f136d2b50ec8`

CI :

`37466929197`

Résultat :

- 1124 tests ;
- 1123 PASS ;
- 1 FAIL ciblé ;
- attendu `nextTickAtMs = 1000` ;
- réel `nextTickAtMs = 1600`.

Le reste de la suite était vert.

## Correction

Le Persistent Zone Runtime distingue désormais explicitement les deux sémantiques existantes :

### reinforce

Une zone déjà active :

- augmente ses activations / son rayon ;
- prolonge sa durée depuis la nouvelle activation ;
- conserve le `nextTickAtMs` déjà planifié.

### refresh

Le mode `refresh` reste volontairement distinct :

- réapplique l'origine temporelle ;
- recalcule `nextTickAtMs = atMs + tickIntervalMs`.

Aucun second timer et aucune seconde autorité n'ont été ajoutés.

Le Combat Runtime reste propriétaire de l'horloge combat.

## Vraie séquence Runtime protégée

La sentinelle `firestorm-real-runtime-sequence-v1` a été alignée sur le contrat corrigé.

Elle continue de vérifier :

- vraie fiche Showcase Tempête ;
- préparation auteur 2000 ms ;
- short → medium → long ;
- même node de zone ;
- projection renderer ;
- timestamps de résolution absolus ;
- `persistentZoneOnly`.

Elle vérifie maintenant également qu'un renforcement ne redémarre pas la phase de tick.

## CI GREEN fonctionnelle

HEAD testé :

`6b719a7dfccc0850a621c33aeac6ed2bac6dec7a`

CI :

`37467275885`

Résultat :

- 1125 tests ;
- 1125 PASS ;
- 0 FAIL.

Sentinelles clés :

- `real Tempête runtime reaches short medium long and renderer follows the same node` — PASS ;
- `Firestorm reinforce preserves the already scheduled persistent-zone tick` — PASS ;
- `persistent-zone refresh remains the explicit mode that resets tick origin` — PASS.

## Fichiers fonctionnels modifiés

Moteur :

- `src/core/combat/persistent-zone-runtime-v1.js`

Tests :

- `tests/unit/firestorm-real-runtime-sequence-v1.test.mjs`
- `tests/unit/firestorm-reinforce-cadence-regression-v1.test.mjs`

Documentation :

- `docs/LAB_CURRENT_WORK.md`
- ce rapport.

## Domaines volontairement protégés

Aucune modification de :

- `cap_fire_atk_6` ;
- dégâts = 5 ;
- tick = 1000 ms ;
- durée = 7000 ms ;
- `preparationMs = 2000` ;
- `cooldownMs = 3500` ;
- progression short / medium / long ;
- règle long autoritaire ;
- géométrie visible ;
- collision ;
- renderer projectile ;
- trail ;
- smoke ;
- assets ;
- scales / offsets auteur ;
- `persistentZoneOnly` ;
- suppression du faux impact / recul ;
- Health Delta ;
- autres capacités.

## Validation smartphone requise

Le lot est GREEN technique uniquement tant que Sylvain n'a pas validé la preview.

À tester :

1. première activation → short après les 2 s de préparation ;
2. deuxième activation → medium après résolution ;
3. troisième activation → long après résolution ;
4. les `-5` restent réguliers pendant les préparations, attaques et renforcements ;
5. aucun tick déjà attendu ne doit être repoussé après un renforcement ;
6. aucun modèle ne doit disparaître ;
7. aucun projectile invisible ;
8. aucun faux impact / recul au moment de l'activation de la zone ;
9. les vrais `-5` Health Delta restent visibles ;
10. une vraie attaque projectile testée juste après doit conserver son impact, trail, fumée et collision normaux.

État : GREEN technique après CI fonctionnelle ; checkpoint final, preview et validation smartphone à poser sur le HEAD documentaire final.
