# Import officiel — effets et icônes d'Éphémus — 18 novembre 2026

## Base et portée
- Branche canonique de départ : \`global-assets@55105d116dbb067333b8abc14ed23655b7a516f6\`.
- Checkpoint START : \`checkpoint/lab-start-ephemus-assets-20261118\`.
- Branche WORK : \`work/lab-ephemus-assets-20261118\`.
- Source immuable : \`_incoming/Ephemus_ICÔNES_5_competences.zip\` (SHA-256 \`619d7cd322f0e5e3a8745902ae426eac73a81b05e20e171daa6fb7d29f27872d\`) et \`_incoming/Ephemus_SPRITES_EFFETS_5_competences.zip\` (SHA-256 \`a32b989be423e1f5db8a9b0812d925f3b8a1b87bd5b26f7294fc9bf7f244dbc2\`).
- Propriétaire : uniquement \`global-assets\`, unique catalogue \`data/assets/catalog/global-visual-assets.v1.json\`. Aucun moteur, créature, sauvegarde, PWA, branche concurrente ni fichier auteur modifié.
- Sortie : cinq icônes WebP 128² et cinq bandes WebP 4096×256 regroupant 16 vrais frames de 256², ajout de dix assetIds stables.
- Portée du raccord gameplay : PR Éphémus #334 sur une branche séparée après validation des assetIds du présent lot.
- Vérifications : empreintes des ZIP, intégrité des 80 frames et des planches sources, images décodables, absence de collision, compte catalogue, \`npm run ci\` et CI exacte sur commit final; checkpoint GREEN puis promotion fast-forward vers \`global-assets\`; ensuite tests navigateur et publication de l'éditeur sur \`main\`.
- Arrêt / revert : ne jamais forcer un ref, remplacer un fichier existant ni déclarer GREEN si un gate échoue.

## Correspondances
| Compétence | Média visuel |
|---|---|
| Poussière d'oubli | \`ephemus-poussiere-oubli\` |
| Battement des limbes | \`ephemus-battement-limbes\` |
| Chrysalide fantôme | \`ephemus-chrysalide-fantome\` |
| Lanterne des âmes | \`ephemus-lanterne-ames\` |
| Danse des mille âmes | \`ephemus-danse-mille-ames\` |
