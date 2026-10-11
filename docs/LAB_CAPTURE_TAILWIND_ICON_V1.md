# LAB — Vent arrière, icône plume — Capture Skill Icon V1
Date : 2026-10-11.

## Responsabilité
Lot visuel additif **global-assets**, aucun changement de gameplay ni de SkillDefinition. Le seul propriétaire des assets est `data/assets/catalog/global-visual-assets.v1.json`. Base `8633466eae72e320a6cd1c017a8d8f1bc10afcf3` avec CI verte `38163641916`. Checkpoint de départ `checkpoint/lab-start-capture-tailwind-icon-v1-2026-10-11`, branche `work/lab-capture-tailwind-icon-v1-2026-10-11`.

## Média réellement livré
- 1 icône logique, 1 fichier binaire WebP 128×128 RGB (plume blanche/bleue, rafales, cadre doré).
- Source auteur : `plume_enchantée_dans_le_vent_céleste.png`, 1254×1254, SHA256 `cc75b288a3be3e04589c19ba28c875ee038b15fd8c004e41c89a93d8ad1bbda5`. Export original généré dans la conversation, non ajouté au dépôt pour éviter le stockage de PNG 2 Mo dans les ressources runtime.
- Média WebP 5206 octets, SHA256 `85b57236179f89b6313e063f74e41199947dd3485d017901edeee9c359d385f8`. Source visuellement inspectée, miniaturisation inspectée, empreinte Git Blob `4af4b614a7e18fe981724769c1180c2fabc2764e` vérifiée après transfert binaire GitHub.
- Chemin : `assets/library/capture/icons/skills/icon_skill_tailwind_feather_01.webp`.
- Identifiant : `pack:capture:icon-skill-tailwind-feather-01`, nom `Vent arrière`, tags Air / Support / Plume.
- Provenance : `assets/library/capture/icons/skills/tailwind_feather_v1.provenance.json`.

## Validation
Le test `tests/unit/capture-tailwind-icon-v1.test.mjs` vérifie les 135 assets, 46 icônes, unicité du propriétaire, le vrai fichier WebP avec signature RIFF/VP8, dimensions, taille et SHA256. Deux sentinelles historiques figées à 45 icônes et 134 assets sont amendées **uniquement en seuils de conservation**, avec les anciens médias toujours protégés par leurs tests propres. CI complète avant GREEN, checkpoint sur SHA exact et publication FF non forcée sur `global-assets`. Raccord séparé au cache `gh-pages` en maintenant `src/assets/global-visual-library.js`, sans nouvel asset loader.

## Vérification utilisateur
L'icône doit apparaître dans la Bibliothèque GenSrpG de l'éditeur sous « Vent arrière ». Validation de l'affichage Android distincte des tests techniques. L'icône n'est pas auto-affectée à une compétence existante.
