# Kitsune Lunaire — équipement réel et vue adversaire (22/10/2026)

## Différence avec l'import précédent
La base `gensrpg-capture-database-v1(3).json` fournit toujours `kitsune_lunaire`, mais modifie volontairement **trois rubriques** de sa fiche : `draft.skillIds`, `loadout.slots` et `draft.presentation.viewOverrides`. La source R1 du 22/10 avait encore des slots vides. La fusion des deux nouvelles capacités ne suffisait donc pas à équiper la créature.

## Valeurs exactes de la source
- IDs dans `configuredCreatures` inchangés : `kitsune_lunaire`. Source active canonique `data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json`.
- Trois capacités auteur : `teleport-strike`, `Onde Spirituel`, `fleche_spirituel` dans les slots 1, 2 et 3, sans auto-placement, slots 4 et ultime toujours vides.
- Présentation V2 conservée ; `viewOverrides.player.displayScale=1`, position 0/0 ; `viewOverrides.opponent.displayScale=0.7`, position -30/50.
- Les sources exactes images du Renard lunaire, son icône, son socket bouche, tous ses réglages de combat/résistances/statistiques sont conservés ; pas de sprite d'animation ajouté.
- Vieille archive inactive R1 `data/capture/source-exports/gensrpg-capture-creature-kitsune_lunaire-2026-10-22.json` immuable. Nouvelle archive inactive `...kitsune_lunaire-2026-10-22-r2.json` identique au transfert actif.

## Gouvernance
Base `gh-pages@fe92692cc8224b940863c061440ffb675b813cbe`, checkpoint `checkpoint/lab-start-author-kitsune-loadout-2026-10-22`, work `work/lab-author-kitsune-loadout-2026-10-22`. Tests : sentinelle historique mise à jour en conservant la provenance R1 + `capture-author-kitsune-loadout-2026-10-22.test.mjs` pour R2, import réel, slots et références aux skills actifs. CI Foundation + quatre navigateurs avant GREEN ; validation Android auteur après publication.
