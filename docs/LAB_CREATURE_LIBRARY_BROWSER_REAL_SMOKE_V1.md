# Creature Library Real Browser Smoke & Optional Startup V1

Date : 2026-10-08

## Incident et diagnostic

Le smartphone a montré plusieurs fois `Aucune créature enregistrée` malgré une CI verte. La base historique n'était pas effacée : les données comptent 110 entrées brutes, 102 IDs canoniques et 103 créatures actives après Showcase.

Deux correctifs préexistants ont été vérifiés depuis la branche du laboratoire :
- `capture-editor-startup-v1.js` : les erreurs des dépendances de présentation ne font plus échouer les données du catalogue ;
- `capture-editor-preview-runtime-loader-v1.js` : les imports du runtime de preview combat sont différés après `editor.ready` pour ne pas empêcher l'éditeur de monter.

Trou de couverture résiduel constaté dans le code réel : l'attente `Promise.allSettled` des ressources optionnelles restait illimitée. Une requête CDN qui ne termine jamais pouvait empêcher l'hydratation, même si le catalogue des créatures était prêt. Il s'agit d'un défaut architectural démontré en test, pas d'une preuve que le CDN a effectivement bloqué sur le téléphone.

## Base et gouvernance

- Dépôt unique : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base SHA : `cbcb081e88661d0b2c09acae40923146d7ccc3bf`.
- Checkpoint de départ : `checkpoint/lab-start-creature-library-browser-real-smoke-v1-2026-10-08`.
- Branche de travail : `work/lab-creature-library-browser-real-smoke-v1-2026-10-08`.
- Propriétaire inchangé : `configuredCreatures`.
- Pas de changement main / Zombicide-40k / Exploration / données créatures / skills / combat / FX.

## Correctif

`src/ui/capture-editor-startup-v1.js` :
- ressources optionnelles de présentation limitées à `CAPTURE_EDITOR_OPTIONAL_PRESENTATION_WAIT_MS_V1 = 6000` ms, paramètre injecté pour les tests ;
- données indispensables (capacité native, catalogue + registre créatures, progression) restent obligatoires et renvoient leurs vraies erreurs ;
- si ressource visuelle / audio / metadata tarde trop ou échoue, la dépendance optionnelle est explicitement signalée indisponible ;
- les options existantes gardent l'unique `configuredCreatures` et n'inventent pas de créatures de substitution ;
- la bibliothèque peut démarrer avec des visuels partiels signalés ; la ressource tardive ne réécrit pas les fiches de créatures.

## Sentinelle réelle navigateur

Nouveau `tests/browser/capture-creature-library-smoke.mjs`, appelé par un job Chromium distinct du workflow `Laboratory CI` :
1. vrai point d'entrée `examples/dom-demo/capture-editor-v2.html`, vrai graphe de modules et vrai sélecteur ;
2. 103 options uniques + présence Maraileron / Moussados / Loup volcanique ;
3. même attente si host visuel indisponible ;
4. même attente si fetch visuel est maintenu perpétuellement en attente (interception réservée au test, sans mock des données créatures).

## TDD / CI

- Base technique initiale : `9aa1379bd7d2f5fd662d0f490b7579c4a3f7d506`, CI `37743851360` SUCCESS (103 créatures en browser normal et host bloqué).
- RED : `653fcc2d28261f0aa17cfd037d35222b2acb1895`, CI `37744006241` FAILURE ciblée (ressource optionnelle jamais résolue bloque le catalogue).
- Correctif : `3366eca53186e5210395673ce6eba6aebc7d00b9`, CI `37744076845` SUCCESS.
- Sentinelle navigateur avec requête en attente : `212fabdf3bc258652839e41844cdd12872e33653`, CI `37744147049` SUCCESS.
- Dernière CI : 1258/1258 tests Node PASS, 0 FAIL ; job Chromium PASS dans les trois scénarios (103 créatures chaque fois).

## Préservation / validation

Les fichiers modifiés depuis la base sont limités à : `docs/LAB_CURRENT_WORK.md`, ce rapport, `.github/workflows/ci.yml`, `src/ui/capture-editor-startup-v1.js`, `tests/unit/capture-editor-optional-startup-stall-v1.test.mjs`, `tests/browser/capture-creature-library-smoke.mjs`.

GREEN technique uniquement après CI documentaire finale et checkpoint sur le SHA exact. GREEN utilisateur réservé à l'ouverture de la preview figée depuis smartphone, confirmation de la bibliothèque et sélection réelle de Maraileron / Moussados / Loup. Ne pas fusionner avec main sans validation.

