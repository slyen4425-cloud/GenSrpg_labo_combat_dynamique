# Loup volcanique — Course et attaque FACE, 12 frames (2026-10-21)

## Objectif et validation

Deux animations de la **vue adversaire / face** approuvées visuellement par l'auteur, réalisées à partir de son modèle original :

| Action | Frames | PNG source | Atlas runtime | Vitesse | Lecture |
|---|---:|---|---|---:|---|
| `movement` | 12 | 512x512 RGBA | 4608x384 WebP RGBA (12x384) | 80 ms/frame | `loop` |
| `attack` | 12 | 512x512 RGBA | 4608x384 WebP RGBA (12x384) | 99 ms/frame | `once` |

La preview GIF et les images individuelles restent disponibles dans chaque dossier :
`assets/library/capture/creatures/loup_volcanique/animations/{movement,attack}/face/{frames,atlases,previews}/`.

## Provenance et intégrité

- Source unique déposée par l'auteur : `_incoming/LOUP_VOLCANIQUE_COURSE_ATTAQUE_FACE_12_FRAMES_GITHUB.zip`.
- SHA256 de l'archive : `68286ad0546f5a129637b7338e079fe54d6607aa4a5c4b0417bd083bafc40951`.
- Source distincte par action préservée dans le champ `sourceArchive` du manifeste, avec les SHA256 de ses PNG et de son atlas.
- Import sur branche `work/global-assets-loup-volcanique-face12-2026-10-21` par `scripts/import_loup_volcanique_face12.py` et workflow d'import.
- 24 PNG vrais, distincts et conservés, deux atlas WebP de 12 cases, deux aperçus GIF, deux manifestes.
- Reste visuel à noter : plusieurs frames de course ont de la transparence à marge droite nulle ou faible. Ce lot ne doit pas être présenté comme une réparation artistique ou un nouveau cadrage.

## Asset Catalog

Deux nouveaux identifiants ajoutés au catalogue unique :

- `pack:capture:creature-loup-volcanique-movement-face-12-v1`
- `pack:capture:creature-loup-volcanique-attack-face-12-v1`

Le champ `resource.format` vaut `sprite-strip` et référence l'atlas WebP de l'action. Les autres visuels officiels (`runtime/loup_volcanique_{opponent,player,icon}.webp`) ne sont pas remplacés.

## Protection, tests et raccord

- **Vérifications** : CRC et SHA archive, SHA de chaque PNG/atlas, dimensions et transparence, catalogue et manifests, unicité des identifiants.
- **Sentinelle permanente** : `tests/unit/volcanic-wolf-face12-assets.test.mjs`.
- **CI** : `npm run ci` via `Laboratory CI` après les médias et la sentinelle.
- **Aucune modification des moteurs** `Combat Rules`, `Animation Core`, `Render Adapter`, ni des fiches de créatures ou compétences.
- Le catalogage rend ces deux séquences disponibles dans la bibliothèque pour un futur choix dans l'éditeur ; il ne prouve pas qu'elles soient automatiquement assignées à la fiche du loup ou visibles en combat sans configuration.
- Les versions joueur/dos restent à créer et valider distinctement.

## Gouvernance

- Base `global-assets` : `79d60fc49baa91cba25b129ec0de922ede9c8979`.
- Checkpoint début : `checkpoint/global-assets-start-loup-volcanique-face12-2026-10-21`.
- Branche de lot : `work/global-assets-loup-volcanique-face12-2026-10-21`.
- Promotion `global-assets` et checkpoint GREEN **uniquement après succès des sentinelles et de la CI sur le dernier commit de lot**.
