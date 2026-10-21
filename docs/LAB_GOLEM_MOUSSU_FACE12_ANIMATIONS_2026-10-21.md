# Golem moussu — Animation face 12 frames, mouvement + attaque (21/10/2026)

## Décision

L'auteur a fourni une image de face du Golem moussu, puis a demandé « pareil » que le Loup volcanique : deux animations 12 frames, transparence, espacement généreux et prévisualisation. Il a ensuite demandé leur publication GitHub.

Le lot concerne **Asset Input / bibliothèque globale uniquement** et ne crée aucun nouveau comportement de combat.

## Source et limites des images

- Modèle officiel existant, à **ne pas remplacer** : `assets/library/capture/creatures/golem_moussu/runtime/golem_moussu_opponent.webp`.
- Pack source approuvé par demande d'enregistrement : `_incoming/GOLEM_MOUSSU_FACE_12_COURSE_ATTAQUE_GITHUB.zip`.
- ZIP SHA256 `ad9f4717721346a99a9c6a5a469a7e1ef81e930353204dc7273fda87e615a42c`, 36 entrées ; archive ZIP contrôlée localement, CRC intact.
- Deux planches générées en 4×3 ; la première découpe présentait un défaut visible : des pattes coupées dans l'attaque. **Recadrage technique réparé depuis les planches d'origine sans régénérer l'art**, en conservant 12 poses distinctes.
- Chaque frame en PNG 512×512 RGBA ; **marge alpha min. 64 px** après préparation.
- Deux atlas WebP lossless sprite-strip de 12 cases 384×384, deux GIF, deux WebP animés et deux planches PNG avec espacement 64 px.
- Mouvement/course : 85 ms/frame, boucle.
- Attaque : 100 ms/frame, lecture unique.

## Gouvernance

- Base `global-assets` : `01345ccd13581e7d93b7d975ae679e87ca2e2985`.
- Checkpoint départ : `checkpoint/global-assets-start-golem-moussu-face12-2026-10-21`.
- Branche isolée : `work/global-assets-golem-moussu-face12-2026-10-21`.
- Script : `scripts/import_golem_moussu_face12.py`.
- Workflow : `.github/workflows/import-golem-moussu-face12.yml`.
- Seul dossier média autorisé : `assets/library/capture/creatures/golem_moussu/animations/{movement,attack}/face/**`.
- Catalogue autorisé : `data/assets/catalog/global-visual-assets.v1.json` (**ajout deux IDs seulement**).
- IDs : `pack:capture:creature-golem-moussu-movement-face-12-v1` et `pack:capture:creature-golem-moussu-attack-face-12-v1`.
- **Zones protégées** : `main`, `Zombicide-40k`, runtime Golem face/dos/icone, toutes les autres créatures, moteur de combat, UI, règles et animations de dos.

## Contrôles

1. Source binaire uploadée sur `_incoming/` de la branche **et SHA256 exact**.
2. CRC ZIP ; 24 PNG RGBA 512×512 vérifiés, empreintes correspondantes aux manifestes, 12 distincts par action, marges >=40 px.
3. Atlas WebP, previews et manifestes, deux IDs uniques.
4. `npm run ci` après import et tests sentinelles complémentaires.
5. Revue des modifications, aucune régression connue, checkpoint GREEN technique seulement après CI sur le commit final.
6. Publication `global-assets` par fast-forward après réussite.

**Aucune publication officielle ni test en combat ne doit être annoncé avant exécution réelle de cette procédure.**
