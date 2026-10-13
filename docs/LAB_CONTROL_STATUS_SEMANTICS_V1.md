# Capture — Immobilisation et Silence, comportements distincts V1

Date : 13 octobre 2026.

## Demande confirmée
- Stun reste une incapacité complète, interrompant les préparations lorsqu'elles sont interruptibles selon le contrat historique. Aucune modification à Stun dans ce lot.
- Immobilisation empêche le changement volontaire de distance (déjà implémenté), interdit le lancement d'une action avec déplacement d'approche, et annule l'approche en cours au moment où le statut négatif est effectivement appliqué.
- Immobilisation **ne rend pas muet** : les actions sans approche restent possibles.
- Silence empêche seulement les formes offensives/distantes `projectile`, `beam` et `area`; `contact`, `self` et `aura` restent autorisés, y compris lorsque contact signifie approche de mêlée. Silence n'annule pas rétroactivement un projectile déjà lancé.

## Source de vérité et frontières
- Production initiale `gh-pages@674a274fa52917b2f57776a5b1fe4cf27ec83a8d`; CI `38459940916` SUCCESS et Pages `38459939818` SUCCESS.
- Checkpoint avant code : `checkpoint/lab-start-control-status-semantics-v1-2026-10-13`.
- Branche : `work/lab-control-status-semantics-v1-2026-10-13`.
- `src/core/combat/action-resolver.js` : vérifie à la source les catégories de contrôle avant de dépenser énergie, charges et cooldowns, sans nouveau propriétaire d'état. Les compétences à approche non-`none` sont refusées sous immobilize, les formes à distance sous silence, toutes sous stun.
- `src/core/combat/immediate-tactical-effects-v1.js` : seulement après application effective du statut non immunisé, publie un événement natif `movement-interrupt`.
- `src/core/combat/combat-runtime.js` : seul propriétaire des actions en cours, arrête l'action de déplacement active via la routine existante `cancelActionsForActor` et notifie `onInterrupted` pour faire annuler la présentation de combat (1v1/2v2), sans second timer ni nouvelle animation. Les tirs statiques déjà engagés restent actifs.
- `src/adapters/renderer/status-effect-info-v1.js` : affiche clairement le rôle des deux effets.

## Tests
- Nouvelle sentinelle `tests/unit/capture-control-status-semantics-v1.test.mjs` écrite avant le correctif (RED attendue) : six formes de compétences sous Silence, blocage mobilité d'approche (ground, aerial, teleport, burrow), possibilité de tirer sans bouger sous Immobilisation, véritable Runtime/Combat Session interrompant un acteur en déplacement avec absence de contact dommageable tardif, non-interruption des casts statiques déjà commencés.
- Ancienne sentinelle `tests/unit/status-effect-runtime-v1.test.mjs` adaptée à l'interdiction projectile au lieu du contact ; elle conserve le refus sans consommation d'énergie ni cooldown.
- Ancienne phrase attendue dans `tests/unit/status-info-card-v1.test.mjs` actualisée sans suppression de tests.
- Aucun changement sur les données auteur, la bibliothèque des 103 créatures, les FX/skills, les positions, commandes, images, 1v1, 2v2, `main`, `global-assets`, GenSrpG ou Exploration.

## Contrôles avant mise en production
- CI Foundation + Chromium Firestorm + Chromium bibliothèque créatures : tous SUCCESS obligatoires au commit documentaire final.
- Checkpoint GREEN exact ; relire le SHA de production ; publication `gh-pages` uniquement en fast-forward protégée sous lease ; recontrôler CI et Pages du commit publié.
- Essai manuel Android paysage, notamment une morsure stoppée au milieu de sa course par Immobilisation, un tir stationnaire restant fonctionnel, une boule de feu refusée sous Silence et une morsure acceptée sous Silence. Un GREEN CI n'est pas une validation visuelle sur téléphone.
