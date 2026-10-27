# Fire Bubble Expansion — raccord du sélecteur d'assets (15 octobre 2026)

## Symptôme utilisateur
L'auteur ne trouve pas la sphère de feu dans l'éditeur du laboratoire Combat.

## Preuves côté GitHub
- Sur `global-assets@2ad4bc4ff401a4700f939ed9b0760edf4957ae73`, ID
  `pack:capture:sprite-fire-bubble-expansion-01`, 20 frames WebP 512×512,
  atlas WebP, catalogue `data/assets/catalog/global-visual-assets.v1.json`.
- Le lot Expanding Sphere Wave est déjà présent en production `gh-pages@47b0e89173688c67b354c7cb41dd7e1a07d428b7`.
- L'éditeur utilisait encore la révision de catalogue du 13 octobre.
- Dans `captureEditorAssetMatchesRoleV1`, `role="travel"` excluait
  tout asset de catégorie autre que `travel`. Le nouveau sprite est
  `category="skill"` avec `tags=["expanding",...]`.

## Périmètre, propriétaires et garde-fous
- Source de vérité de l'image et du catalogue : `global-assets`, **inchangé**.
- Source de vérité de la sélection : `captureEditorAssetMatchesRoleV1`,
  aucune deuxième liste.
- Ancien comportement conservé pour les sprites `travel`, les effets ordinaires
  `skill` et les sprites de créatures.
- Version du catalogue actualisée en un point dans `global-visual-library.js`.
- Aucun changement de Gameplay/Runtime/Collision/Power/SkillDefinition,
  de `main`, GenSrpG ou Exploration.

## Branche et preuve attendue
- Base `gh-pages@47b0e89173688c67b354c7cb41dd7e1a07d428b7`.
- Checkpoint `checkpoint/lab-start-fire-bubble-selector-refresh-2026-10-15`.
- Branche `work/lab-fire-bubble-selector-refresh-2026-10-15`.
- Test dédié `tests/unit/capture-fire-bubble-selector-refresh-v1.test.mjs` :
  échantillon exact du catalogue réel, filtres positifs/négatifs, révision,
  URL atlas, vrai sélecteur HTML.
- Gates obligatoires : CI Foundation + deux suites browser Chromium,
  checkpoint GREEN sur SHA exact, publication fast-forward avec lease si
  `gh-pages` est resté sur la base ; vérification Pages et test Android.

**Statut :** correctif soumis aux vérifications ; aucune validation smartphone annoncée.

### Ajustement de sentinelle historique (CI)
La première CI du lot a exécuté 1827 tests : 1826 réussites, seul le test des **huit icônes anciennes** exigeait une égalité stricte avec la révision de cache du 13 octobre. On conserve les contrôles des huit IDs et des URL réelles, mais leur test accepte une révision de catalogue ultérieure, au lieu d'interdire toute nouvelle intégration d'asset.
