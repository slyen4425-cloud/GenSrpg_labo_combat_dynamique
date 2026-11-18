# Veldra — import isolé des cinq icônes et cinq effets (18 novembre 2026)

## Gouvernance
- **Source** : archives auteur `_incoming/Veldra_ICÔNES_5_competences.zip` et `_incoming/Veldra_SPRITES_EFFETS_5_competences.zip`, déjà présentes sur la branche autoritaire `global-assets`.
- **Base exacte** : `global-assets@2fa8f2ea30aaa7d8c699d6c6b76ebc8ba33cc703` ; checkpoint de départ `checkpoint/lab-start-veldra-skill-media-20261118`.
- **Travail** : `work/lab-veldra-skill-media-20261118`, branche temporaire, avec source d'assets unique `global-assets` et catalogue `data/assets/catalog/global-visual-assets.v1.json`.
- **Aucun changement** aux autres créatures, sprites d'Éphémus, moteur, gameplay, PWA, explorations/donjons, autres branches ni sauvegardes.
- **Fichiers autorisés** : l'importeur `scripts/import_veldra_skill_media_2026_11_18.py`, workflow dédié, ce document, `LAB_CURRENT_WORK.md`, dix vrais médias sous `assets/library/capture/{icons,sprites}/skills/veldra/`, le catalogue canonique et la provenance JSON, ainsi que le test de comptage Éphémus existant (mettre à jour uniquement les compteurs additifs 452/202/218 sans affaiblir ses contrôles d'intégrité).
- **Tests** : empreintes SHA-256 et blobs Git des ZIP originaux, CRC, 80 PNG RGBA et cinq planches pixel-identiques, 5 strips WebP 4096×256 (16 véritables frames) et 5 icônes WebP 128×128, source vs bande WebP (compression tolérée), ids uniques et vrai résolveur, CI et inspection de contenu. Aucun faux GREEN.
- **Raccord gameplay ultérieur séparé** : modifier seulement `draft.presentation.visual` des cinq compétences **déjà publiées** sur `main`; garder intacte l'approche aérienne native de Percée, le faisceau natif de Rayon et le relais de réserve de Relève. CI navigateur du Labo avant `main`.
- **Promotion** : checkpoint GREEN sur SHA testé, avance **non forcée** vers `global-assets` uniquement si CI réussie, revue du diff et origine vérifiée. Source de rendu `main`, pas `gh-pages`.

## Identifiants et présentation
| Niveau | Capacité | Icône ID | Sprite ID | Usage de l'effet |
|---|---|---|---|---|
| 1 | Plume solaire | `pack:capture:icon-skill-veldra-plume-solaire-v1` | `pack:capture:sprite-skill-veldra-plume-solaire-v1` | projectile `travel` |
| 5 | Percée d'aurore | `pack:capture:icon-skill-veldra-percee-aurore-v1` | `pack:capture:sprite-skill-veldra-percee-aurore-v1` | `impact` après approche native |
| 10 | Égide du zénith | `pack:capture:icon-skill-veldra-egide-zenith-v1` | `pack:capture:sprite-skill-veldra-egide-zenith-v1` | `cast` protecteur |
| 15 | Rayon cardinal | `pack:capture:icon-skill-veldra-rayon-cardinal-v1` | `pack:capture:sprite-skill-veldra-rayon-cardinal-v1` | `impact` uniquement, beam préexistant conservé |
| 20 | Relève céleste | `pack:capture:icon-skill-veldra-releve-celeste-v1` | `pack:capture:sprite-skill-veldra-releve-celeste-v1` | `cast` / invocation alliée, sans duplication roster |

## Import effectif (contrôlé)
- Commit d'import des dix WebP: `6ed09f2cbcba9bdb4612ab43096382ec59aa55f1`.
- Résultat du workflow d'import: SUCCESS, incluant contrôles exacts des ZIP, 80 frames, 5 bandes WebP, catalogue et tests Node.
- Catalogue sur branche WORK: 452 assets (202 icônes / 218 sprites); dix nouveaux IDs Veldra sans remplacement.
- **Publication** : toujours NON GREEN jusqu'à CI sur le SHA final du présent lot, checkpoint GREEN, puis avance sûre de `global-assets` et contrôle de lecture.
