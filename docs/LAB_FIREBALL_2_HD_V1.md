# LAB — Boule de feu 2 HD V1

## Statut

GREEN technique complet. Validation visuelle utilisateur attendue dans l'éditeur Capture avant checkpoint GREEN utilisateur.

## Base et branches

- Base fonctionnelle : `1068a9f1109fc3030eb1a10879744b2c3a8a8a9b`
- Départ : `checkpoint/lab-start-fireball-2-hd-assets-v1-2026-10-05`
- Travail fonctionnel : `work/lab-fireball-2-hd-assets-v1-2026-10-05`
- Base `global-assets` avant lot : `0217dca50ec4004d5ac3bb25d6f5998ccf9edc4f`
- Checkpoint assets : `checkpoint/lab-global-assets-fireball-2-hd-green-2026-10-05`
- `global-assets` publié : `a56f0e627318865e183a68cae739bbe70454e049`

## Contenu

Nouveau pack séparé : `assets/library/capture/sprites/skills/fireball_2/`.

Trois séquences :
- cast : 12 frames
- projectile : 12 frames
- impact : 12 frames

Chaque frame est un PNG RGBA natif 512×512. Chaque séquence possède un atlas WebP horizontal 6144×512. L'atlas 12×1024 n'a volontairement pas été retenu : 12288 px de large serait moins sûr sur smartphone. Le lot respecte donc le minimum HD demandé tout en gardant un atlas mobile-compatible.

## Asset IDs

- `pack:capture:sprite-fireball-2-cast-01`
- `pack:capture:sprite-fireball-2-projectile-01`
- `pack:capture:sprite-fireball-2-impact-01`

Les anciens IDs Boule de feu restent présents et inchangés.

## Architecture

Le lot ne crée aucune nouvelle autorité. Il utilise le catalogue et le resolver existants :
`assetId -> catalogue -> global-assets -> ressource`.

Aucun changement dans Animation Core, FX Core, Render Adapter, Combat Runtime ou Combat Rules.

Le seul raccord de code est le cache-buster de `src/assets/global-visual-library.js` :
`2026-10-05-v12-fireball-2-hd-v1`.

## Preuves

- Génération/validation assets : workflow `37293482898` SUCCESS.
- CI historique a d'abord bloqué sur un total catalogue figé à 95 : comportement attendu de la sentinelle.
- Sentinelle rendue extensible sans la neutraliser.
- Nouveau test `tests/unit/fireball-2-hd-assets-v1.test.mjs` sur la branche assets : 36 frames, PNG RGBA 512², 3 atlas, 3 IDs, ancienne Boule de feu conservée.
- CI finale assets : `37293795011` SUCCESS au SHA `a56f0e627318865e183a68cae739bbe70454e049`.
- CI fonctionnelle finale : `37294166674` SUCCESS, **1035 / 1035**, au SHA source `eefc1f8868dc99244e071224264e727273426beb`.

## Validation utilisateur attendue

Dans l'éditeur Capture, vérifier que les trois entrées « Boule de feu 2 » sont disponibles pour cast / projectile / impact, puis lancer un combat et vérifier netteté, animation et taille sur PC et smartphone.
