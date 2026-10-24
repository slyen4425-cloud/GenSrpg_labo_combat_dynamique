# Attaque souterraine — liberté des sprites de terrain (24-10-2026)

## Demande
Le créateur doit pouvoir sélectionner une autre animation à la place des trois sprites approuvés du creusement, du sillon et de l'émergence; le sprite de départ paraît invisible lorsque le plongeon est trop court.

## Autorité et périmètre
- **Catalogue / Asset Input**: mêmes assets du catalogue GenSrpG et de la bibliothèque personnelle de la session que les autres effets de l'éditeur. Ne réinstalle aucun sprite ni nouveau registre.
- **Éditeur**: `populateBurrowStageAssetChoicesV1` complète les trois menus avec les assets FX/sprite compatibles, distinguant la bibliothèque GenSrpG et « Mes assets ». La sélection existante est préservée même si son asset ne figure pas temporairement au catalogue. Les champs de taille, position et cadence existants restent inchangés.
- **Contrat**: aucune modification. Le `SkillPresentationBinding V13` conserve une référence par phase `assetId` ; le résolveur existant `createCaptureSkillPresentationAssetsV2` charge l'asset externe en plus des trois valeurs intégrées.
- **Renderer**: l'animation de départ se lit de façon perceptible au-delà du court temps de plongée, avec une limite avant l'émergence. Le mouvement, l'horloge du combat, la présence souterraine, les collisions et les dégâts ne changent pas.
- **Assets personnels**: uniquement ceux importés dans la session via « Mes visuels / Importer », comme le reste de la bibliothèque de l'éditeur. Une animation multi-frame nouvelle doit disposer des bonnes métadonnées de catalogue (sprite-strip, frameCount, frameMs). L'import persistant des médias et l'outil d'édition d'atlas ne font pas partie de ce lot.

## Tests
`tests/unit/burrow-custom-asset-selection-2026-10-24.test.mjs`:
- sélection d'un FX publié et d'un FX personnel pour chacun des trois moments ;
- exclusion des portraits, créatures et icônes ;
- absence d'effacement des choix précédents ;
- résolution d'un sprite alternatif depuis l'ID sauvegardé ;
- visibilité prolongée du départ, terminée avant émergence, sans modification des dégâts ;
- rafraîchissement des menus après import personnel.

Ce lot ne doit pas toucher la production GenSrpG principale. Statut de déploiement uniquement après CI/Pages vert sur le SHA exact.
