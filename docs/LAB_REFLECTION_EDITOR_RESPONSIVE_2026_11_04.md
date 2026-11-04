# Labo Combat — mise en page Renvoi de dégâts / Armure de pointes (2026-11-04)

## Symptôme reproduit depuis la capture auteur
- Sur grand écran PC, la configuration d'une compétence `Buff / Debuff / Statut → Renvoi de dégâts` empile d'énormes carrés gris et des libellés superposés : catégories « corps à corps », « rayon », « zone », valeurs et explication ne s'alignent pas.
- Le champ « Déclencher des effets à un seuil de stacks » hérite du même style de checkbox. Les symptômes peuvent aussi toucher une largeur mobile variable.

## Cause racine DOM + CSS
- `appendReflectionAuthorControlsV1` dans `src/ui/capture-editor-human-v2.js` produit un groupe `skill-status-config__specific` **dans** la section `skill-status-config__specific` parent, toutes deux rendues en trois colonnes fixes (`repeat(3,minmax(130px,1fr))`). Le groupe de renvoi se retrouvait dans la largeur d'une unique cellule ; son propre sélecteur de catégories ouvrait encore trois colonnes, trop larges.
- `capture-editor-v2.css` applique à **tous** les `input` `width:100%`, `min-height:2.55rem`, `padding`, et à tous les `label` `display:grid`. Les `label.check` de Renvoi de dégâts et de Stacks n'avaient aucun reset compatible ; les checkboxes devenaient de gros champs et les textes perdaient leur alignement.

## Correction minimale, sans deuxième autorité
- Styles propriétaires uniquement dans `examples/dom-demo/capture-editor-v2.css` : label-checkbox de statuts alignés horizontalement, taille native compacte (1.125rem), no padding, marges nulles, texte renvoyé à la ligne.
- La sous-section Renvoi des dégâts reprend la pleine largeur (`grid-column:1/-1`), et possède sa propre grille interne **une colonne**; les catégories se répartissent dynamiquement selon l'espace avec `auto-fit/minmax`. Une limite de largeur pour les pourcentages et dégâts fixes, et les notes ont une largeur et un retour de ligne lisibles.
- Invalidation du seul cache CSS existant dans `examples/dom-demo/capture-editor-v2.html`. Aucune modification de JS, calcul de dégâts, statuts, seuil, modèle, sauvegarde, IDs, sprites ou moteur.

## Tests et validation
- TDD : `tests/browser/capture-reflection-editor-responsive-smoke.mjs` inspecte le **vrai éditeur** à 1440x900, 920x520 et 390x844. Il vérifie que `apply_status/damage_reflection` est affiché, que le groupe interne prend sa largeur, taille/alignment de chaque checkbox (Renvoi et Stacks), absence de débordement des catégories et de l'aide, sélection des catégories, bascule toutes sources, et saisie de % et riposte fixe.
- CI : ajouter cette sentinelle dans le job Chromium `creature-library-browser` sans désactiver les tests existants. Les cinq jobs attendus sont Foundation et quatre Chromium. Captures esthétiques/validation physique Android restent distinctes.
- Base immuable : `gh-pages@fe46821d091a4d9605f92b344f064377c092dcdc` ; START `checkpoint/lab-start-reflection-editor-layout-2026-11-04` ; WORK `work/lab-reflection-editor-layout-2026-11-04`. GREEN et fusion uniquement après CI sur SHA exact, checkpoint, PR et publication Pages.

## Première exécution des sentinelles
- PR #239 : première passe CI `41867317156` confirme Foundation, Firestorm et 2v2. La sentinelle navigateur mesurait des cases à `0×0` : elle interrogeait les catégories avant de décocher « Toutes les attaques », **et surtout conservait l'onglet Créature** au lieu d'ouvrir Capacités. Les formulaires hors onglet restent naturellement invisibles, sans dimensions à tester. La deuxième passe `41867974464` a corrigé l'ordre des catégories, mais a mis en évidence que l'onglet restait fermé.
- Correction **du test uniquement** : la première tentative d'activation manuelle ne suffisait pas, car `editor.ready.then(applyCaptureAuthorTabFromUrlV1)` peut réappliquer l'onglet choisi une fois la bibliothèque distante chargée. Le smoke utilise désormais le **deep-link natif** `?tab=skills` déjà implémenté et retente le clic utilisateur jusqu'à ce que le vrai panneau soit visible (attente bornée de l'initialisation asynchrone), avec diagnostic explicite de `panelHidden` et largeur réelle; les catégories sont révélées via leur contrôle natif. Aucun contournement `hidden` CSS, aucune activation forcée, aucun changement de domaine. CI cinq jobs sur SHA final impérative avant checkpoint GREEN.
