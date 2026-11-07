# Labo Combat — sprite de statut différent selon la vue (04-11-2026)

## Besoin auteur
L'armure de pointes et les autres masques corporels parfois asymétriques doivent afficher un sprite DOS au joueur et un sprite FACE à l'adversaire. Le créateur ne doit pas renseigner systématiquement deux sprites pour tous les statuts.

## Propriétaires et contrat
- **Choix opt-in de présentation** : le champ de référence canonique `statusVisuals[statusId].sprite.assetId` demeure le sprite unique des deux vues par défaut. Un `opponentAssetId` facultatif remplace uniquement ce média dans la vue adversaire. S'il est absent, aucun changement de comportement ou d'export ancien.
- **Format existant** : `SkillPresentationBindingV3` et descendants ajoutent une propriété facultative validée par `stableAssetId`. Le `version`, les offsets, opacités, modes `loop/once/stretch/hold-last`, couches et durées demeurent ceux de la définition d'origine ; pas de second type de statut.
- **Résolveur unique** : `resolvedStatusPresentation` passe l'ID sélectionné selon `semanticView(context)` à `resolvedVisual`. `Dom Status FX` reste inchangé : un sprite par statut vivant, attaché à la vraie créature, conservé/supprimé par le statut runtime.
- **Éditeur** : une case « Utiliser un sprite différent côté adversaire (facultatif) » inactive par défaut ; le second sélecteur est invisible tant que cette case n'est pas cochée. La liste réutilise exclusivement le catalogue visuel officiel déjà chargé. Sans activation, aucun champ de second asset dans la sauvegarde.
- **Fidélité** : activation sans choix secondaire invalide la sauvegarde avec message clair ; désactivation supprime l'override au prochain enregistrement. Les vieux fichiers/imports n'ont rien à migrer.

## Gouvernance et protections
- BASE immuable : `gh-pages@16c1627e9e11f65bbd8553dba5e4362e22182b60`.
- START : `checkpoint/lab-start-status-sprite-view-assets-2026-11-04`.
- WORK : `work/lab-status-sprite-view-assets-2026-11-04`.
- Test initial RED ajouté sur commit `ae5608226555f731ae1a394f5c34fa58c9785673` pour contrat, sérialisation, vue et UI ; ne pas le qualifier RED CI confirmé sans logs correspondants.
- Fichiers prévus : `skill-presentation-binding-v3.js`, `capture-skill-presentation-assets-v2.js`, `capture-editor-human-v2.js`, chaîne de cache ESM de l'éditeur, tests unitaires et Chromium, workflow et ce rapport.
- Hors scope : règles du statut, dégâts de renvoi, défense, équipe, créatures, médias, moteur Exploration/GenSrpG.
- GREEN seulement après Foundation + 4 Chromium sur SHA exact, checkpoint d'arrivée, PR `gh-pages`, CI et publication contrôlée. Apparence sur vrai mobile à valider par l'auteur.

## Tests requis
1. Roundtrip de `opponentAssetId` via création, export/import et réédition.
2. Absence de `opponentAssetId` dans un ancien statut ; même asset des deux côtés.
3. Asset adversaire invalidé quand ID non stable.
4. Résolution de `assetId`, `url`, cadre et `hold-last` différents selon le côté, sans nouveau renderer.
5. Chromium réel 1440px / paysage 920px / étroit 390px : case décochée, sélecteur masqué, activation, choix, désactivation/réactivation et maintien de la sélection.
