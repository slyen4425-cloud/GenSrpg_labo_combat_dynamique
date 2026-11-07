# Forcer une réserve ennemie en combat — 2026-10-29
- BASE gh-pages@84c8d76eab5ec03029dc41c7fa0eecba1843a943 ; médias global-assets@4b727fe47693dd083c39e500ea66ace8d073e86d (inchangés).
- START checkpoint/lab-start-force-enemy-reserve-switch-2026-10-29 ; WORK work/lab-force-enemy-reserve-switch-2026-10-29.
- Contrat `force_reserve_switch` réservé à une compétence ciblant uniquement une réserve ennemie vivante, avec effects[] de portée cible. Cible choisie par la liste officielle des réserves du preview 1v1/2v2 ; aucun ID saisi.
- RosterSession propriétaire unique : dépense énergie/cooldown via resolveSkillStart existant, cible de réserve matérialisée transitoirement, applique effets marqueurs via Status Runtime, interruption de l'action de la créature remplacée, snapshot des PV et statuts sortants, remplacement atomique par la créature choisie et états conservés sur l'entrant. Rappel volontaire non bloqué ni rechargé par ce forçage.
- Éditeur : nouveau choix d'effet, `force_reserve_switch` dans effectKinds, paramètre cible, la zone Réserve dans l'éditeur doit être sélectionnée, autres effets apply_marker dans la même capacité. Les effets de compétence de réserve restent immédiats selon l'API existante, pas de simulation d'une nouvelle trajectoire ; le rendu d'une liane utilisera le système de visuels existant ultérieurement.
- Protection : autres compétences, banque, marqueurs, FX, projectile, suivi des HP, Combat Rules, Audio, assets et GenSrpg inchangés. TDD RED f5e5fd6 ; tests Foundation + quatre Chromium obligatoires avant PR/Pages/GREEN.

## Complément ergonomie
- Le choix « Faire entrer la réserve ennemie choisie » bascule les contrôles de cible existants sur « réserve » ; aucune saisie d'ID.
- L'éditeur sérialise cet effet sans champ numérique, et il peut être combiné à « Poser des marqueurs » sur cette même cible.
