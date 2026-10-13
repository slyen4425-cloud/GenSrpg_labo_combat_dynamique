# Rayon électrique jaune — Pack préparé (NON publié GitHub)

Les 3 planches sources (Cast / Corps / Impact) sont découpées en **60 PNG RGBA 512 × 512**, soit **20 frames par animation**.

## Comparaison Jet pressurisé et usage prévu

- Jet pressurisé (GitHub) : Cast 20 × 60ms; Beam Start 12 × 45ms; Corps 12 × 45ms; Impact 12 × 45ms.
- Ce pack : Cast 20 × 60ms; Corps 12 × 45ms; Impact 12 × 45ms dans les atlas `*_atlas_01.webp` (compatibilité cadence/format), plus les 20 frames sources de chaque phase et les deux atlas optionnels `*_full20_atlas_01.webp`.
- **Beam Start** est un quatrième visuel distinct chez Jet pressurisé : cette demande ne générait que trois planches. Aucun sprite de départ du rayon n'a été inventé ou copié.

## Contenu

- `sources/` : 3 planches originales 1402 × 1122, grilles 5 × 4.
- `frames/` : 60 PNG RGBA 512 × 512.
- `atlases/` : trois WebP RGBA 512 px/frame en bande horizontale, `cast` 20 images, `beam_body` 12 et `impact` 12 ; deux atlas additionnels 20 frames complets pour body/impact.
- `sprite_skill_electric_beam_sequences_01.json` : config prête pour le catalogue runtime façon Jet pressurisé (20/12/12).
- `sprite_skill_electric_beam_sequences_full20_01.json` : alternative avec les 60 images.
- `manifest.csv` / `provenance.json` : chemins, dimensions, SHA-256, choix de frames, provenance des images.

## Import / GitHub

Racine prévue `assets/library/capture/sprites/skills/electric_beam_yellow/`.
La bibliothèque visuelle et les ID de catalogue appartiennent à `global-assets` ; ne pas publier directement sur `main` ou lier les médias à une compétence sans choix de l'auteur.
`Cast` => `pack:capture:sprite-electric-yellow-beam-cast-01`.
`Corps` => `pack:capture:sprite-electric-yellow-beam-body-01`.
`Impact` => `pack:capture:sprite-electric-yellow-beam-impact-01`.

Ce pack ne modifie aucun réglage de jeu, compétence, ni fichier GitHub.

## Qualité et transparence

Tous les PNG ont un canal alpha et les atlas sont WebP RGBA. Source d'environ 280 px/cellule convertie en 512 px via Lanczos. Les images sources restent archivées sans transformation pour une éventuelle découpe révisée.

**À tester visuellement dans le labo après intégration** : continuité de la jointure Cast/BeamStart/Body/Impact et lisibilité à faible taille / sur Android. Aucun test de combat n'est revendiqué ici.
