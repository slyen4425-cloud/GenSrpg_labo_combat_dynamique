# Dodge Default 250ms V1 — 2026-10-08

## Validation utilisateur précédente
La bibliothèque de créatures de 103 entrées a été validée sur Android. Cette fonction reste sentinelle protégée.

## Périmètre
Base exacte : `f4d92445071bc82204dc9ea5c6f10bd76e369f39`. Checkpoint : `checkpoint/lab-start-dodge-default-250ms-v1-2026-10-08`. Branche : `work/lab-dodge-default-250ms-v1-2026-10-08`.

## Changements
- `CaptureGameOptionsV1` fournit dorénavant 250 ms comme **valeur par défaut**, sans modifier les valeurs explicitement sauvegardées (exemple historique 500 ms préservé).
- L'éditeur Human affiche 0,25 seconde, pas de 0,05 et minimum 0,05. Conversion UI secondes vers moteur millisecondes reste unique.
- Aucun timer de jeu parallèle, aucun nouveau propriétaire des charges/esquive.
- Le sprite d'esquive est **déjà existant** dans Créature > Apparence : `data-creature-dodge-fx` + taille + X/Y et rôle d'import personnel `dodge`. L'asset suit `CreaturePresentationBindingV3` vers le rendu; aucune duplication de ce système.
- Aucun fichier de combat, FX, sauvegarde de créatures, charge, cooldown ou sprite changé.

## TDD
- RED sur anciens défauts 500 ms : CI `37757607774`, `37757621431`, `37757666184`.
- GREEN candidat : commit `53fecc90e96243e42ad385d48f513496d277549f`, CI `37757822001` — SUCCESS : tests complets et vrai Chromium (103 créatures).
- Ancienne configuration `activeWindowMs: 500` explicitement déclarée reste 500. Configuration legacy sans champ reçoit nouveau défaut 250 ms sans migration.
- Finalisation : CI documentaire, checkpoint technique, branche preview et validation smartphone.

## Protégé
`main`, `Zombicide-40k`, Exploration, `configuredCreatures`, Combat Runtime/Rules, Creature Presentation V3.
