# Labo Combat — Cendre aveuglante : restauration fidèle de l'icône à partir de la source PNG

Date : 2026-10-11. Référentiel propriétaire : `global-assets`.

## Retour et diagnostic

Après le lot qui ajoutait un octet terminal manquant au WebP existant, l'utilisateur confirme que l'icône en jeu paraît **toujours endommagée**. Une conformité RIFF et un décodage simple ne prouvent pas la fidélité de l'illustration ni la validation Android.

Le fichier original `image-gen-1(20261007-190701).png` a été retrouvé dans les pièces de conversation, puis inspecté visuellement. Il s'agit d'une illustration originale de tourbillon de cendre/fumée, 1254×1254 RGBA. SHA256 source : `e6e0f885a335f66007ac75499502d293e61170a08a70280acd41f80a58fcc4d6`.

## Restauration

- **Un seul asset logique** : `pack:capture:icon-skill-blinding-ash-01`.
- **Un seul média binaire remplacé** : `assets/library/capture/icons/skills/icon_skill_blinding_ash_01.webp`.
- **Format** : WebP 128×128 transparent, nouvel encodage à partir du PNG source (redimensionnement Lanczos, WebP qualité 84 / méthode 6), pas un patch du flux précédemment cassé.
- SHA256 média final : `bb452c0435928f7ac88973bee301c6672ed7c16503628bb98fbf6fa82aa17110`.
- Référence `assetId` et chemin inchangés ; provenance V1 complétée avec source PNG et nouvelle empreinte.
- **Aucun** changement à la compétence, aux effets, à l'export, au catalogue, à la bibliothèque des créatures, au moteur de combat, aux 129 autres médias ou aux autres dépôts.

## Preuves et limites

- Contrôle TDD RED initial du lot : commit `f6ec387514f9f6c6521692045b2dd5cadf2b57f2`, CI `38139641947` FAILED comme attendu.
- Le contrôle par SHA du média et de sa provenance, RIFF et chunks complets, contrat d'icône unique et autres icônes V1 sont couverts par `tests/unit/capture-skill-icons-v1.test.mjs`.
- Commit code+provenance : `39e760d33c3e44b5f9df3775c9e6ff014860a040`; CI `38139853255` SUCCESS.
- Le WebP commité a été récupéré par SHA sur GitHub et son illustration a été inspectée visuellement : tourbillon de cendre/fumée conforme, transparence conservée. Les tests structurels ne remplacent pas la validation réelle dans l'interface Android.
- Aucun « GREEN utilisateur / artistique » n'est revendiqué avant un nouveau test smartphone.

## Publication attendue

Contrôler CI du présent commit documentaire, créer le checkpoint GREEN exact, avancer `global-assets` uniquement par fast-forward avec contrôle de base. Ensuite ouvrir un sous-lot isolé sur `gh-pages` pour rafraîchir le cache de l'unique `GLOBAL_VISUAL_LIBRARY`, refaire la CI navigateur, publier Pages et demander validation Android.
