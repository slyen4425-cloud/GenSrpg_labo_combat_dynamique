# Capture — cinq icônes spirituelles — 22 octobre 2026

Cinq icônes approuvées : **Onde spirituelle** (miroir qui renvoie les dégâts), **Flèche spirituelle**, **Charge spirituelle**, **Sangsue**, **Soins spirituels**.

## Gouvernance
- Base : `global-assets@8855ac59541501427fe5c68399df9effe597e5e7`
- Checkpoint départ : `checkpoint/global-assets-before-spiritual-skill-icons-v1-2026-10-22`
- Branche : `work/global-assets-spiritual-skill-icons-v1-2026-10-22`
- Propriétaire : bibliothèque globale `global-assets`, **pas le runtime du gameplay**.
- Périmètre : cinq WebP dans `assets/library/capture/icons/skills/`, cinq entrées du catalogue unique, manifeste, test sentinelle et documentation.
- Protégés : moteur, règles des compétences, éditeur, créatures, animations, autres icônes, `main`, `gh-pages` et `Zombicide-40k`.

## Livraison
- Médias : **5 vrais WebP RGB 128×128 opaques**, issus des cinq PNG RGB 512×512 créés et approuvés par l'auteur dans cette conversation. Aucun placeholder.
- Encodage final : WebP VP8 qualité 40 méthode 6 ; visuels vérifiés à taille réelle et en vignettes.
- Catalogue : `data/assets/catalog/global-visual-assets.v1.json`, 5 IDs `pack:capture:icon-skill-*-01` distincts (noms dans le manifeste).
- Provenance : `assets/library/capture/icons/skills/capture_spiritual_icons_2026_10_22.provenance.json` — empreintes SHA-256 des PNG sources, des WebP livrés, des blobs Git et tailles.
- Tests : `tests/unit/capture-spiritual-icons-2026-10-22.test.mjs` vérifie les cinq vrais fichiers (octets, dimensions, RIFF/VP8, SHA-256 et Git blob), et le catalogue sans collision.
- Publication : après CI GitHub verte, checkpoint GREEN puis fast-forward sur `global-assets`. Mise à jour de `gh-pages` et validation réelle sur téléphone sont distinctes, **non revendiquées** par cette livraison.

## Correspondance de gameplay (aucune modification des compétences)
- Onde : représentation d'un miroir renvoyant les dégâts ; `reflect` est un tag de recherche visuelle et ne programme pas un renvoi.
- Sangsue : représentation du siphonnage ; aucune mécanique de drain ajoutée ici.
