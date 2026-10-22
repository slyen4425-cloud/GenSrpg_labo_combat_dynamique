# Correction export complet Capture — compétence inchangée détectée à tort comme modifiée

Date : 22 octobre 2026. Source : signalement auteur que « Exporter toute la base » oblige à réenregistrer une compétence qu'il n'a pas modifiée. Une première différence accidentelle dans l'export avait transformé Étincelle ardente (`lib_fire_bolt`) d'un `definition.effect.damage:3` en `definition.effects:[{kind:damage,amount:3}]`. **L'auteur a confirmé que ce n'était PAS une modification souhaitée**. La compétence a été exclue du lot précédent et n'est pas publiée en double.

## Cause constatée
- `exportDatabaseButton` dans `src/ui/capture-editor-human-v2.js` refuse correctement l'export lorsque `creatureDirty || currentSkillHasUnsavedChanges()`.
- `captureSkillDraftHasUnsavedChangesV1` utilisait exclusivement `JSON.stringify(currentDraft)!==JSON.stringify(savedDraft)`. Or `humanSkillEditorFieldsFromDraftV1` réhydrate automatiquement des dégâts historiques `effect.damage>0` vers `effects` moderne, et `buildHumanSkillDraftV1` met les dégâts historiques à zéro lorsque `effects` existe.
- Un joueur n'ayant touché aucun champ est donc parfois déclaré « sale » à cause de la représentation interne. Enregistrer la capacité met à jour le snapshot, ce qui libère l'export, mais pollue involontairement sa représentation sérialisée.

## Correctif borné
- Une comparaison strictement identique retourne immédiatement *pas de changement*.
- Dans le **seul cas legacy de dégâts positifs isolés**, sans soin, stun, tags ou interruption anciens, reconstruire en mémoire la représentation éditable via les fonctions *existantes* `humanSkillEditorFieldsFromDraftV1` et `buildHumanSkillDraftV1`, puis comparer intégralement à l'état de l'écran.
- Toute autre différence de dégâts, élément/canal, cible, libellé, présentation, effet secondaire ou un format ambigu reste détectée : le message « enregistrer avant export » conserve son rôle de protection.
- Aucun changement des fichiers de capacité, de la base de données, du moteur de règles, de l'exporteur, du bouton ni des contrats. Aucun enregistrement automatique ou mutation de `configuredSkills`.

## Tests et gouvernance
Base `gh-pages@5abf0577b3e6967406dbe841bb5bafb19966dcf8` ; checkpoint départ `checkpoint/lab-start-capture-export-skill-dirty-2026-10-22` ; branche `work/lab-capture-export-skill-dirty-2026-10-22`.
`tests/unit/capture-full-export-legacy-skill-dirty-2026-10-22.test.mjs` reproduit la migration damage scalar → tactical effect, vérifie l'absence de faux dirty, détecte les vraies modifications, confirme la protection des effets legacy combinés. CI cinq jobs et vrai navigateur avant checkpoint GREEN ; validation Android ensuite.
