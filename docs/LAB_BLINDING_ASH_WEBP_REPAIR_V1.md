# Labo Combat / global-assets — Correction de l'icône Cendre aveuglante

Date : 2026-10-11. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Source et cause

Le fichier original `assets/library/capture/icons/skills/icon_skill_blinding_ash_01.webp` (SHA Git blob `1f6fc1d6390771f86c17bb7b5356217b6e02cbc3`) contient 9 679 octets, contre **9 680 octets annoncés** dans son entête RIFF et par la somme de ses chunks `VP8X/ALPH/VP8`.

Le flux de compression de l'unique image 128×128 était donc tronqué d'un octet. Le décodage de la version originale échoue dans un décodeur d'image réel. L'ajout d'un octet final `0x00` restitue un WebP 128×128 lisible. L'image réparée a été inspectée visuellement : elle montre bien la cendre / fumée attendue, sans remplacement de l'illustration ni modification des précédents octets.

L'empreinte `sha256` de provenance publiée auparavant (`5f7b...`) ne correspondait déjà pas au fichier fourni dans `global-assets` (`5524...`). Elle est synchronisée sur le fichier corrigé, avec trace du SHA d'origine.

## Périmètre exact

- **Un seul asset logique** : `pack:capture:icon-skill-blinding-ash-01`.
- **Un seul média binaire remplacé** : `assets/library/capture/icons/skills/icon_skill_blinding_ash_01.webp`, WebP 128×128, 9 680 octets.
- Aucun nouvel asset, aucun autre média reformaté.
- Aucun changement de chemin, catalogue, identifiant, compétence `cap_fire_special_1`, combat/FX, import/export, ou créatures.
- Actualisation de `capture_skill_icons_v1.provenance.json` et test de structure RIFF/chunks sur les six icônes V1.
- Nouvelle empreinte du média : `c3631d0087fb9279c2e8be6fa2317e3e4ac26a13cf0fd0fd8558ce2122c54a97`.

## Contrôles

- Inspection réelle du WebP endommagé et de sa version restaurée : OK.
- Les cinq autres WebP du lot V1 ont été contrôlés et sont complets.
- Test RED volontaire : GitHub Actions `38137601918` FAILED sur ancienne image.
- Tests et CI du commit correctif : à contrôler.
- Checkpoint GREEN, publication `global-assets`, cache consommateur `gh-pages` et validation visuelle smartphone : à contrôler.

Le statut GREEN artistique sur Android doit attendre la validation utilisateur réelle.
