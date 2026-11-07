# Mur de glace — activation, import et choix automatique (2026-11-01)

## Départ et preuve RED
- Base unique `gh-pages@2afe898b20b9a5061fa8687eaf5d2f679bfe4ff2` ; checkpoint `checkpoint/lab-start-wall-zero-stat-feedback-2026-11-01` ; travail `work/lab-wall-zero-stat-feedback-2026-11-01`.
- Reproduction fondée sur l'export utilisateur `mur_de_glace` : niveau requis 10, catégorie defensive, forme contact, relations self, effet `summon_entity` ciblé self, statId `glace`, 1 PV par point, sprite de pierre provisoire.
- Cause racine 1 : l'invocation native refuse silencieusement de créer une entité quand `source.statValuesById.glace=0`, mais le SkillStart engageait avant cela coût 5, cooldown et action. `no_stat_points` n'était pas visible. Test RED `tests/unit/capture-wall-activation-feedback-2026-11-01.test.mjs`, run `41299470345` avant correction (Foundation FAIL).
- Cause racine 2 : le test 1v1 ciblait systématiquement `opponent`, même pour un sort n'acceptant que `self`. Le correctif utilise le contrat de cible déjà normalisé, sans nouveau propriétaire.
- Cause racine 3 : `mur_de_glace` existe dans le catalogue natif au niveau requis 1. L'export utilisateur est bien niveau 10. L'import par défaut interdit le remplacement d'un ID existant. Le message anglais de conflit pouvait laisser croire que le nouveau niveau avait été appliqué ; un message français donne maintenant niveau existant, niveau entrant et action explicite à effectuer. Pas d'écrasement automatique.

## Corrections et autorités
- `combat-entity-v1` expose la lecture du même calcul natif PV/stat avant invocation : pas d'algorithme dupliqué.
- `action-resolver` vérifie cette capacité avant paiement ; refus `no_stat_points` sans énergie, cooldown, usage ni entité.
- `combat-test-ui` utilise la cible self pour les seules compétences self, et rend l'absence de stat visible. `combat-2v2-test-ui` affiche également le manque de stat sans en modifier la sélection.
- `capture-editor-human-v2` propose « Invoquer un mur destructible » ; le choix ou l'ajout d'un effet mur **isolé** définit catégorie protection, forme sur soi, approche none, cible self, placement actif ; les compétences mixtes restent intactes avec message de vérification. Contrats, statistiques, énergie, visuels restent leurs autorités canoniques.
- Import : aucun ID dupliqué ; le niveau demandé dans l'export est préservé lorsque l'utilisateur autorise explicitement le remplacement de l'ancien preset.

## Portée et vérifications
- Fichiers du lot : `src/core/combat/{combat-entity-v1,action-resolver}.js`, `src/ui/{combat-test-ui,combat-2v2-test-ui,capture-editor-human-v2}.js`, `examples/dom-demo/capture-editor-v2.html`, tests unitaires d'activation et navigateur `capture-ice-barrier-editor-smoke.mjs`, ce rapport, `LAB_CURRENT_WORK`. Entrées ESM publiques versionnées si nécessaire pour forcer les mêmes fichiers, jamais pour masquer une panne.
- Tests : même export LV10, comparaison au preset LV1, non-perte du niveau au roundtrip, refus atomique stat0, mur à PV réels si stat non nulle, cible 1v1, bouton auteur autonome, effet existant non écrasé ; CI Foundation + quatre Chromium et Pages au SHA final pour GREEN.
- **Limites** : si la créature sélectionnée a zéro point de Glace, aucun mur ne doit apparaître ; le champ élément « Glace » ne donne pas des points de statistique. L'activation du sort et son apparition restent distinctes de l'illustration provisoire. Collision de déplacements/familiers hors périmètre.
- `main`, global-assets, GenSrpg, Exploration et les autres branches en cours sont intouchés. Android utilisateur après publication.
