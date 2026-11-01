# 2026-11-01 — Exports Poing givrant / Mur de glace et FX d'interception

## Sources exactes / provenance
- BASE publiée : `gh-pages@7b2b1b6c5db9e380d64367eba34ce8c39a9ee427`.
- START : `checkpoint/lab-start-wall-impact-routing-author-skills-2026-11-01`.
- WORK : `work/lab-wall-impact-routing-author-skills-2026-11-01`.
- Fichier auteur Poing givrant : SHA256 `2e7e7f4a8d59a7c83af73ffed16d92880b03707427b96f5f3e864eddc2e7754f`, copié sans réécriture dans `data/capture/source-exports/gensrpg-capture-skill-poing_givrant-author-2026-11-01-v2.json`, unique actif `data/capture/showcase/poing_givrant.capture-skill-transfer-v1.json`.
- Fichier auteur Mur de glace : SHA256 `48bed1db51ee649e95dcc20ab6aff2c4e46229ac33445bcb1a31508283a05872`, copié sans réécriture dans `data/capture/source-exports/gensrpg-capture-skill-mur_de_glace-author-2026-11-01-v2.json`, unique actif `data/capture/showcase/mur_de_glace.capture-skill-transfer-v1.json`.
- Archives antérieures préservées, aucune duplication d'ID ni entrée catalogue. L'auteur a configuré Mur avec 2 PV par point de Glace, projectiles/rayons/contact, placement libre X47 Y55, échelle générale 4 et X1,5. Poing givrant garde les données auteur dont dégâts directs 15, incoming_effect_modifier négatif 50%, durée 20s et 2 stacks. Les données auteur ne sont pas modifiées pour « corriger » des descriptions éditoriales.

## Cause racine
`action-resolver` émet déjà `combat-entity-hit` lorsqu'une frappe rencontre la vraie barrière ; Combat Damage protège la créature. En revanche `planSkillOutcomeFx` envoyait l'impact visuel au `targetSlot`, et `CombatResolutionPresenter` appelait `outcomeSequence(targetSlot, "hit")` pour tout `outcome:"hit"`. Une barrière non létale ou détruite déclenchait donc encore les FX et l'animation corporelle sur son propriétaire, malgré 0 dégât.

## Correction sans autorité supplémentaire
- Combat Runtime transmet, uniquement pour le visuel des résolutions `combat-entity-hit`, le point **déjà calculé** par le capteur de contact projectile, rayon ou corps. Ne recalcule ni impact logique ni coordonnées métier, ne conserve pas d'état parallèle, ne touche pas à Combat Damage.
- Skill FX Plan crée un plan `impact` rattaché à l'`entityId` frappée et au `barrierImpactPoint`; le Renderer existant affiche le **sprite de la capacité** à ce point. Repli uniquement sur le vrai noeud DOM de ce même mur si le point est absent ; jamais sur le corps protégé si le mur n'est plus affiché.
- Presenter supprime la réaction `hit` / `ko` de la créature protégée pour `combat-entity-hit`. Les vraies blessures, soins, esquives, renvois, clash, zones et attaques non interceptées conservent leur chemin historique.
- Les dégâts/PV du mur conservent leur propriétaire existant; le mur visible dispose déjà de sa réaction de luminosité aux pertes de PV. Même point d'impact 1v1/2v2, même seul Render Adapter.

## Vérifications demandées
- Unitaire `tests/unit/capture-wall-impact-routing-author-skills-2026-11-01.test.mjs` : plan de contact unique, pas de recoil/KO, vrai hit protégé, deux exports exacts.
- Actualisation des anciennes sentinelles d'auteur après import, sans altérer les archives anciennes.
- Chromium `tests/browser/capture-ice-barrier-editor-smoke.mjs` : rendu du sprite d'impact au point réel de collision et absence de faux impact sur une créature si le mur est introuvable.
- TDD RED requis avant implémentation : le test a été poussé sur la branche avant le code ; preuve d'exécution CI indépendante si disponible. CI finale : Foundation + 4 Chromium sur SHA code+docs exact ; checkpoint GREEN seulement si 5/5 et aucune régression ; PR gh-pages puis postmerge CI/Pages avant validation smartphone.

## Périmètre explicitement protégé
`main`, `global-assets`, GenSrpg, Exploration, IA, mouvements, Combat Damage, statuts, règles et IDs. Promotion `main` non automatique. Les tests Android restent distincts.
