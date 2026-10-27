# Carapace minérale — remplacement de l'export auteur HD hold-last (2026-10-10)

## Décision et source
- Source unique : fichier utilisateur `gensrpg-capture-skill-lib_earth_guard(1).json` (`capture-skill-transfer-v1`).
- L'utilisateur a validé sur Android l'atlas corrigé de la carapace ; le fichier d'aura HD n'est pas retravaillé dans ce lot.
- `global-assets` reste le propriétaire exclusif de l'asset `pack:capture:sprite-stone-carapace-aura-01`. HEAD/checkpoint GREEN : `23d978a46b6ec7b4c1529d09fc231b312957567c`; 12 frames natives de 512 × 512 px, atlas 6144 × 512, 90 ms/frame, dernière image n°12 montrant la carapace complète.
- Le `gh-pages` de départ est `5276806ed6c1526d768284543ef1957de7a2b8ff`, CI `38068225543` SUCCESS, Pages `38068225475` SUCCESS.

## Remplacement au seul propriétaire des données
- Fichier : `data/capture/showcase/lib_earth_guard.capture-skill-transfer-v1.json` — remplacement de l'enregistrement existant **par l'ID inchangé** `lib_earth_guard`, sans nouvel enregistrement dans le catalogue.
- Ancien sprite de statut : `pack:capture:sprite-status-stone-shell-01` (8 frames), `opacity=0.6`, pas de `playbackMode` explicite.
- Export auteur actuel : `sprite.assetId=pack:capture:sprite-stone-carapace-aura-01`, `playbackMode=hold-last`, `displayScale=1.6`, `opacity=0.75`.
- Préservés strictement : `#9b59d0`, `tintOpacity=0.35`, icône, toutes données gameplay et autres champs de présentation ; niveau 5, énergie 2, préparation 800 ms, recharge 45 000 ms, buff +200 défense 25 000 ms, refresh.
- Uniquement l'asset canonique déjà existant, pas de nouveaux WebP/PNG. `configuredSkills` demeure l'unique propriétaire actif ; `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` contient déjà exactement une entrée.

## Tests et non-régression
- Test dédié déjà existant `tests/unit/defense-buff-description-author-presets-v1.test.mjs` : verrouille désormais assetId HD, mode hold-last, scale 1.6, opacité 0.75 et teinte. Il vérifie aussi le roundtrip auteur, la projection réelle +200 défense / réduction 40 %, et le remplacement sans duplicata dans `configuredSkills`.
- TDD RED confirmé : commit `8a83a47bbb24715c608d1dc003c9960b6f034c5c`, Laboratory CI `38071060538` FAILURE attendu (test demandait le nouveau sprite alors que l'ancien JSON était toujours présent).
- Le moteur de statut et l'animation `hold-last` ont déjà leurs sentinelles `tests/unit/status-sprite-hold-last-v1.test.mjs`. Aucune modification de cette mécanique ni des durées. Aucun autre skill / créature / loadout modifié.
- GREEN technique final : voir statut Actions du commit publié et le checkpoint à SHA exact ; la confirmation Android du nouvel export chargé reste distincte.

## Sécurité de publication
- Branche isolée `work/lab-earth-guard-hd-hold-last-author-refresh-2026-10-10`.
- Checkpoint départ `checkpoint/lab-start-earth-guard-hd-hold-last-author-refresh-2026-10-10`.
- Promotion de `gh-pages` uniquement après CI réussie, fast-forward sous lease, puis Pages SUCCESS. `main`, `global-assets`, GenSrpG principal et Exploration inchangés.
