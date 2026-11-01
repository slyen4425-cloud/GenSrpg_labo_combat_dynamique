# Canalisation — raccord auteur et effets visuels (2026-11-01)

## Départ
- Base officielle GREEN : `gh-pages@2afe898b20b9a5061fa8687eaf5d2f679bfe4ff2`, CI post-merge 5/5, Pages SUCCESS.
- Checkpoint START : `checkpoint/lab-start-channeling-author-fx-2026-11-01`.
- Branche unique : `work/lab-channeling-author-fx-2026-11-01`.

## Objectif et contrats protégés
- Exposer dans l'éditeur officiel `SkillDefinition.channeling` déjà publié : intervalle, durée/nombre de ticks, énergie/tick, interruptions configurables et effets répétés (dégâts, soins, statut, marqueurs) via le même propriétaire de champs tactiques.
- Recharger les exports sans perte, enregistrer une seule compétence par ID stable, expliquer chaque tick dans le bestiaire. Aucun ID manuel, aucun effet ajouté silencieusement aux impacts.
- Rejouer le visuel/son canonique sur chacun des `onChannelTick` du Combat Runtime ; le rendu et l'audio ne possèdent jamais les dégâts, le timing ni les PV.
- Contrats protégés : `contactHold`, charges, rayons et projectiles historiques, effet immédiat, système de statuts, roster, arène, global-assets, main, GenSrpg et Exploration.

## Périmètre physique déclaré
- Entrée officielle `examples/dom-demo/capture-editor-v2.html`.
- Propriétaire éditeur `src/ui/capture-editor-human-v2.js`, explications `src/ui/capture-skill-explanation-v1.js`.
- Présentateurs `src/ui/combat-test-ui.js` et `src/ui/combat-2v2-test-ui.js` seulement après preuve du vrai raccord des FX/audio existants ; aucun renderer bis.
- Sentinelles nouvelles `tests/unit/capture-channeling-author-2026-11-01.test.mjs` et vraie navigation Chromium si l'UI change.
- Ce document et `docs/LAB_CURRENT_WORK.md`.

## Critères de GREEN et limites
- TDD RED / GREEN ; champ auteur visible, validation du contrat, sauvegarde et relecture/import-export exact de la configuration, effet immédiat distinct des pulsations, compteur/timing moteur inchangé, lecteur sprite/audio testé par tick si livré.
- `npm run ci` et les quatre jobs Chromium sur SHA exact ; checkpoint GREEN, PR `gh-pages`, CI et Pages post-fusion. Validation physique Android distincte.
- Aucun lot n'est déclaré publiable si la chaîne d'animation/audio ou l'éditeur demeure partielle.
