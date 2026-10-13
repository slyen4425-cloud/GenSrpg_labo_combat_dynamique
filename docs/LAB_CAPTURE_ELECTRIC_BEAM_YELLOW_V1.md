# Rayon électrique jaune — Raccord bibliothèque Capture (13 octobre 2026)

## Mission
Mettre les 3 ZIP originaux de l'auteur à disposition de l'éditeur du Labo Combat, en conservant le comportement générique des rayons et tous les anciens assets.

## Entrée validée
Les trois archives déposées directement sur la branche isolée ont été extraites avec un workflow éphémère, leurs fichiers vérifiés via le manifeste SHA. La source est constituée de 60 PNG RGBA 512 × 512 (20 Cast, 20 Corps, 20 Impact), 5 atlas WebP (Cast 20, Corps 12/20, Impact 12/20), 3 planches images source, séquences et provenance. Le CSV a été normalisé LF sans modifier de sprite. Les ZIP temporaires et workflow/script d'import sont exclus de la publication.

## Owner et identifiants
Seul catalogue : data/assets/catalog/global-visual-assets.v1.json sur la branche global-assets.
- pack:capture:sprite-electric-yellow-beam-cast-01 : charge 20 images, 60ms, once, slot cast
- pack:capture:sprite-electric-yellow-beam-body-01 : corps continu 12 images, 45ms, loop, slot travel du beam
- pack:capture:sprite-electric-yellow-beam-impact-01 : impact 12 images, 45ms, once, slot impact

Les 20 images source de chaque animation restent disponibles. Trois slots visuels seulement ont été créés sur demande. Le Jet pressurisé préexistant utilise séparément un quatrième asset beamStart : il n'est ni remplacé ni copié. L'auteur pourra définir ou ajouter un départ spécifique du rayon ultérieurement. Le rendu se configure par Style Rayon, pas par nom de capacité.

## Procédure
Base publiée 6f0b006693d672c20a79d93d32582205fa3eed64 ; checkpoint avant import checkpoint/global-assets-before-electric-beam-yellow-v1-2026-10-13 ; work work/global-assets-electric-beam-yellow-v1-2026-10-13. CI complète sur SHA final, checkpoint GREEN, fast-forward protégé global-assets. Puis lot distinct gh-pages pour revision du cache/resolver avec tests et Pages.

## Non-régressions / limites
Aucune modification à Combat Rules, FX Core, UI de skills, 103 créatures, exports auteurs, Jet pressurisé, Zombicide-40k, Exploration ou main. Qualité sur téléphone, taille du rayon et raccord physique Cast/corps/impact requièrent test utilisateur Android avant validation artistique.
