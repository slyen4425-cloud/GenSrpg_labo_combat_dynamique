# Canalisation — Éditeur auteur V1 (1 novembre 2026)

## Contexte et autorités
- Source: `gh-pages@2afe898b20b9a5061fa8687eaf5d2f679bfe4ff2`, CI 5/5 + Pages success sur ce SHA.
- START: `checkpoint/lab-start-channeling-editor-2026-11-01`, travail: `work/lab-channeling-editor-2026-11-01`.
- Contrat déjà livré: `src/contracts/channeling-v1.js`, `SkillDefinition.channeling`. **Ne pas inventer un second contrat.** Combat Runtime est seul propriétaire de l'horloge, Combat Session seul propriétaire de l'énergie/ticks.
- Lot: rendre `channeling` auteur dans l'éditeur capture (intervalle, durée, maximum ticks, coût par tick, interruption sur dégâts/stun/silence, effets répétés), sauvegarde/chargement/export/import; bestiaire avec description explicite. Effets uniquement `damage`, `heal`, `apply_status`, `apply_marker` et scopes `target`/`self`, exactement comme le contrat.
- Fichiers éditables: `src/ui/capture-editor-human-v2.js`, `src/ui/capture-skill-explanation-v1.js`, `examples/dom-demo/capture-editor-v2.html`, tests unitaires et navigateur ciblés, docs, plus révisions d'imports publics si indispensables au déploiement.
- Protégés: `src/core/**`, `src/contracts/**`, Combat FX/Runtime, données créatures, compétences actuelles, `main`, `global-assets`, GenSrpg, Exploration.
- Incompatibilités: `channeling` ne se combine pas avec `contactHold`, `chargedAttack`, `chargedEffects`, projectile. Les effets d'impact immédiat doivent rester indépendants et vides ; aucun contournement d'un garde contractuel.
- TDD: sentinelles RED avant implémentation, aller-retour du draft et du visuel/description, refus des options invalides, préservation de la bibliothèque existante, vrai navigateur Chromium ; CI 5/5 sur SHA docs final puis checkpoint GREEN, PR gh-pages, CI+Pages après fusion.
- Hors lot: réémission FX et audio à chaque tick, raccord du test combat réel, familiers et nouvelles collisions, à traiter séparément. Ne pas annoncer ces usages comme finis.
