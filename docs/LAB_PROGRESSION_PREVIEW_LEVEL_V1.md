# Progression cinq capacités et combat de test niveau 20 — V1

Date : 2026-10-09. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande

La règle par défaut de Capture doit déverrouiller successivement 1, 2, 3, 4 et 5 capacités aux niveaux 1, 5, 10, 15 et 20. Les combats lancés dans l'éditeur doivent pouvoir essayer des créatures au niveau 20 sans changer le niveau de leurs fiches exportées pour jouer, ni celui d'une nouvelle créature (niveau 1).

## Base et frontières

- Base publiée : `ac418d9a92ee3e53434bafebd9584830e191487a` (opacité des sprites GREEN).
- Checkpoint départ : `checkpoint/lab-start-progression-preview-level-v1-2026-10-09`.
- Branche isolée : `work/lab-progression-preview-level-v1-2026-10-09`.
- Les propriétaires sont `capture-progression-rules-v1`, `capture-planned-loadout-to-combat-v1`, et `buildCaptureEditorCombatTestV1`. Pas de second stockage des niveaux, aucune migration de créatures.
- Ne pas modifier `main`, `Zombicide-40k`, Exploration, les 103 créatures, les 112 capacités, leurs équipements ou les assets.

## Implémentation

1. Le seul fichier de règles par défaut `data/capture/monster-capture-progression-rules.v1.json` contient `maxActiveSkills:5` et les cinq paliers exacts `1:1, 5:2, 10:3, 15:4, 20:5`.
2. Le loadout canonique contient déjà quatre emplacements `standard` et le cinquième `slot-ultimate`. Le projecteur de loadout déverrouille le slot ultime au cinquième palier uniquement pour une règle à 5 places ; les anciens mondes à 4 places conservent leur comportement historique. Le `requiredLevel` propre à la capacité reste applicable.
3. La surface de progression de l'éditeur accepte et affiche les cinq paliers (max 5) ; le résumé explique les quatre capacités standards et l'ultime.
4. `buildCaptureEditorCombatTestV1` prend `previewLevel = 20` par défaut (réglable sur 1..100 dans le bloc de test). Il crée de nouveaux drafts **éphémères** `{...record.draft, level:previewLevel}` au moment de l'export Combat, sans affecter `configuredCreatures`, leur level, leurs statValues, leur loadout, ou la base d'export des parties. Les membres actifs et réserves sont projetés via le même chemin central.
5. Les nouvelles créatures restent de niveau 1 dans les données auteur ; les créatures existantes gardent le niveau qu'elles ont enregistré. Seul le scénario de test demande niveau 20 automatiquement.

## Vérification

- Test RED `tests/unit/capture-default-progression-preview-level-v1.test.mjs` sur le calendrier des cinq paliers, le cinquième slot Ultime, la projection des deux côtés au niveau 20, le test à niveau 1 et l'absence de mutation des drafts/loadouts d'origine.
- Tests sentinelles historiques de progression et affichage mis à jour pour le calendrier par défaut ; conservation des règles personnalisées à quatre places.
- CI de code et vrai navigateur Chromium sur `69ecdf6d37dbe04e1c95c31edfaedaf8c1b4b65b` : **1324/1324 Node PASS (0 FAIL)** et **Chromium SUCCESS**. Scénario navigateur : cinq paliers visibles et combat de test niveau 20 présent. Vérification annexe : 103 créatures, 112 capacités, Onde régénérante, HoT et Jet pressurisé.
- Publication conditionnée à la CI du SHA documentaire final, checkpoint GREEN, revue de diff, preview et Pages SUCCESS. Validation tactile smartphone distincte.

## Fichier Onde régénérante fourni durant ce lot

Le second export utilisateur porte le même ID `lib_aqua_heal` avec soin immédiat `5`, soin périodique `3` toutes les `3 s` pendant `20 s`, un sprite de statut `pack:capture:sprite-status-healing-aura-01`, scale `1.7`, opacity `0.45`, et l'icône `core:icon-skill-recall-01`. C'est différent de l'instruction précédente `5 PV/tick`. Ne pas remplacer la capacité en silence dans le lot de progression ; préserver le preset publié actuel, et demander une validation distincte du changement d'effet lors de l'intégration de cet export.
