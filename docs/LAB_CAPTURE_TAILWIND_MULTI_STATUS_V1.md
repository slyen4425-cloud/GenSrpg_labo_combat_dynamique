# Labo Combat — Vent arrière : statuts indépendants et affichage réel

2026-10-11. Base GREEN `gh-pages` `5993a626d0863db0038b3cb2bb3c79502b382b1d`.
Checkpoint `checkpoint/lab-start-capture-tailwind-multi-status-2026-10-11`; work `work/lab-capture-tailwind-multi-status-2026-10-11`.

## Diagnostic confirmé

L'export utilisateur contient quatre effets appliquant chacun un statut pour 15 secondes, **trois IDs identiques `status`**. Le propriétaire du combat `src/core/combat/status-effect-runtime-v1.js` ne conserve qu'une entrée par statut ID et, pour `stacking=refresh`, renouvelle l'ancienne définition au lieu d'en créer une nouvelle. Le HUD `src/adapters/renderer/dom-status-fx.js` affiche fidèlement le snapshot, mais trois buffs/débuffs s'effacent par collision d'ID. Il s'agit d'une collision de données et non d'une défaillance du renderer.

## Correction de cause, sans rustine moteur

- Le JSON source exact reste dans le commit GREEN précédent `5993a626d0863db0038b3cb2bb3c79502b382b1d`, SHA256 `012c4d275eb33288700008fdb7d0e105d90dfc4e6220044bde4e2769617a6f75`, et en Git blob `b66e3a7a95e1ae2a1691d9ef44b102f80af6f845`.
- Le **preset actif** `data/capture/showcase/lib_tailwind.capture-skill-transfer-v1.json` change uniquement les trois IDs répétés : `lib_tailwind:cooldown`, `lib_tailwind:energy`, `lib_tailwind:defense`. Le premier `lib_tailwind:0` ne bouge pas. SHA256 nouveau `90360500d9dc5cdc93525d178849c206772b5f15cdd70183e6a2210d33a085bb`.
- Le réglage visuel `statusVisuals["status"]` blanc clignotant reste sur le premier statut anciennement nommé `status`, via la nouvelle clé `statusVisuals["lib_tailwind:cooldown"]`. Les autres statuts utilisent le HUD de base (pas trois flashs superposés). Aucune valeur de buff/débuff, durée, scope, cible, présentation de skill, icône, sons ou autres effets n'est modifiée.
- L'éditeur `src/ui/capture-editor-human-v2.js` utilise désormais des IDs libres `status-1`, `status-2`, etc. pour de nouvelles lignes et refuse explicitement deux effets `apply_status` avec le même identifiant lors d'un enregistrement. Aucun ajout d'autorité dans Core/Rules/Renderer.
- `lib_tailwind` possède **3 buffs** (+30 Vitesse, +150% recharge compétences, +100% régénération d'énergie) **et 1 debuff** (-100 Défense), tous 15s. Les scopes restent `self` pour Vitesse et `target` pour les autres comme dans l'export ; une cible self de la compétence les applique au lanceur. Le libellé description d'origine ne correspond pas à tous les effets ; il n'est pas réécrit implicitement.

## Preuves requises

- Test sentinelle `tests/unit/capture-tailwind-multi-status-v1.test.mjs` : IDs distincts, réalité CombatSession avec quatre statuts simultanés, affichage quatre icônes indépendantes dans le renderer partagé, libellés cooldown/régénération, nettoyage/recharge, prévention des doublons à l'export depuis l'éditeur.
- Respect des deux autres presets nouvellement importés, des 103 créatures et des 16 presets skills, de `global-assets`, `main`, GenSrpG et Exploration.
- TDD RED, CI foundation et smokes Chromium, checkpoint GREEN à SHA exact puis fast-forward `gh-pages` sous lease, vérification Pages/CI après publication. Test utilisateur Android ensuite.
