# 2026-10-31 — Corriger le départ de l'attaque chargée (indépendance temporelle)

## Charte, checkpoint et périmètre
- Base stable : `gh-pages@c44082a9a8e88acfef7f0957526481cc9de4d30d`.
- START : `checkpoint/lab-start-charged-release-window-2026-10-31`.
- Travail : `work/lab-charged-release-window-2026-10-31`. TDD RED : `772531901f4a87adc5d6a7b2d63dc2a19d9c8a4c`.
- Un seul propriétaire gameplay : Combat Runtime, définition native `chargedAttack`. Aucun double délai métier, timer UI, impact artificiel ni duplication d'autorité.
- `main` et les consommateurs GenSrpg / Exploration restent hors périmètre.

## Cause racine et correction
Le contrat imposait `reactivationWindowMs <= preparationMs` alors que l'action libérait inconditionnellement le projectile à `releaseAtMs=preparationMs`. L'auteur ne pouvait pas choisir une préparation courte et un temps de réactivation humainement praticable.

Nouvelle sémantique :
- `preparationMs` = durée minimale avant le départ (peut être plus courte que la fenêtre de réactivation, voire 0).
- `reactivationWindowMs` = durée maximale pendant laquelle une nouvelle activation du même bouton prolonge le cast, mesurée depuis **le dernier appui accepté** (pas un cooldown payé en plus).
- À la première activation, départ prévu à `max(preparationMs, reactivationWindowMs)`. À chaque réactivation avant l'échéance, départ reporté à `max(preparationMs, elapsedFromFirstTap+reactivationWindowMs)`.
- À la dernière activation possible (`maxCharges`), départ avancé à `max(preparationMs, elapsedFromFirstTap)` : charge maximale immédiatement libérée après la préparation minimum.
- Sans réactivation, le tir de base part à l'expiration de la première fenêtre (il n'attend pas éternellement).
- Un seul coût énergie / cooldown / marqueur, dégâts appliqués une fois à l'impact, mêmes esquive, collision, défense, interruption, son et cible.
- Le cast reste le même sprite et sa timeline s'allonge en place ; les nouveaux appuis agrandissent le cast et le projectile du même coefficient.
- L'éditeur ne modifie plus silencieusement la préparation ; les libellés de l'effet et le bestiaire expliquent les deux durées indépendantes.

Exemple : préparation 100 ms, fenêtre 500 ms, 4 activations maximum. Appuis t=0, 200, 600 ms : départ t=1100 ms ; puissance 5+5+5=15, taille ×1,2. Avec 4e appui t=800 ms, le tir part immédiatement à puissance 20, taille ×1,3.

## Validation attendue
- Test de régression RED `tests/unit/capture-charge-release-window-2026-10-31.test.mjs` : fenêtre plus longue que préparation, extension du départ, max charges, défaut sans réactivation, remboursement interdit, explicabilité auteur.
- Sentinelles existantes de l'attaque chargée, FX, 1v1, 2v2, bestiaire, autres compétences et navigateur réel.
- CI 5/5 jobs sur SHA exact + checkpoint GREEN avant publier sur gh-pages ; pas de main sans validation auteur.
