# Labo Combat — filtres élémentaires des sprites, statuts et créatures (04-11-2026)

## Retour auteur / reproduction
Les menus de choix de sprites n'ont pas le filtre par élément attendu dans les couches de statuts, buffs/debuffs et sprites associés. Le filtre de l'éditeur créature est signalé comme inefficace. Cette correction continue la PR #244 sans modifier les référentiels des compétences, espèces, assets ou éléments.

## Diagnostic
L'ancien propriétaire `src/ui/capture-reference-element-filter-v1.js` ne connaît que `configuredSkills` et `configuredCreatures`. Il ignore `[data-asset-role]`, les sprites de statuts ajoutés dynamiquement et les pickers de murs/creusement. `populateHumanStatusVisualAssetV1` utilise bien le catalogue visuel officiel mais n'applique aucun filtrage dessus.

## Contrat du correctif
- Le propriétaire de filtre existant continue à retirer/restaurer les options des menus natifs, sans dépendre de `option.hidden` (Android).
- Les assets utilisent uniquement `EDITOR_VISUAL_ASSETS_BY_ROOT` alimenté par `GLOBAL_VISUAL_LIBRARY`. La classification passe par `humanVisualAssetElementV1` déjà utilisée par les groupes du même catalogue. Aucune seconde banque ou association élément↔sprite.
- Couvre créatures FACE/DOS, icônes, esquive, attaque, déplacement, Cast, Trajet, Impact, Zone, mur invoqué et visuels de statut/buff/debuff ; sélection historique conservée.
- Rafraîchissement lors de l'hydratation et de l'import d'assets et lors de la création/édition des rangées d'effets ; pas de scan ou de listener à chaque frame.
- Aucune modification des données des créatures, capacités, moteur ou adaptateurs ; aucun changement de GensRPG/Exploration.

## Gouvernance
- BASE immuable `gh-pages@0b358fbb8b97843deba8b8d8b4e9cde902765211`.
- START `checkpoint/lab-start-visual-element-filters-2026-11-04`.
- WORK `work/lab-visual-element-filters-2026-11-04`.
- Fichiers fonctionnels : `src/ui/capture-reference-element-filter-v1.js`, `src/ui/capture-editor-human-v2.js`; cache entrée ESM de `examples/dom-demo/capture-editor-v2.{html,js}` ; test navigateur dans `tests/browser/capture-reference-filters-skill-ids-smoke.mjs`.
- TDD RED : commit `c872ec663668981d4694cf45c33f2be7e5497a3c`, CI #41902748696, navigateur 1440×900 échoue sur « creature model picker lacks asset element filter »; les quatre autres jobs restent verts. Ce résultat attendu prouve le manque de couverture avant implémentation.
- Critère GREEN : Foundation et 4 jobs navigateur verts sur SHA final, checkpoint exact, PR vers `gh-pages`, fusion et publication Pages. Le test tactile physique Android reste distinct.
