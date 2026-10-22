# Braisombre — 12 frames mouvement de vol + 12 frames attaque FACE — 22/10/2026

## Décision auteur

- **Mouvement / vol** : conserver **exactement les 12 frames déjà découpées de la première planche retenue**, avec mouvement léger de queue. Ne pas reprendre les versions d'ailes plus amples rejetées ensuite.
- **Attaque** : exploiter la planche validée le 22 octobre (preparation / gueule ouverte / attaque / récupération), 12 frames.
- L'auteur demande la découpe et la publication GitHub, pas le remplacement des images officielles runtime, ni des animations dos.
- Priorité artistique : **respect de la teinte du modèle de référence**, sans recoloration arbitraire.

## Provenance réelle

- Pack généré dans la conversation : `BRAISOMBRE_FACE_12_VOL_ATTAQUE_GITHUB_2026-10-22.zip`.
- SHA256 immuable : `108acd0bd2c778070bd877a2f0c8e4062bd2a1510f0cbba9a5275052a5a1a9da`.
- Taille : **15 446 796 octets**, 38 entrées ZIP distinctes, test CRC local OK.
- Source vol : `sources/braisombre_flight_first_tail_source.png`, SHA256 `60d20b3ef8642efc581b3da00bc6b200baeee019306eba3db3c7b7a82083b393`.
- Source attaque : `sources/braisombre_attack_source.png`, voir SHA256 dans `attack/attack.manifest.json`.
- Vol : 12 PNG RGBA **512 × 512 octet-pour-octet identiques** au premier ZIP choisi `BRAISOMBRE_VOL_FACE_12_SPRITES_PREVIEW_2026-10-22.zip` ; 90 ms/frame, lecture en boucle, marge alpha min. 65 px.
- Attaque : découpe non destructive par composantes connexes, évitant les ailes qui débordent des cases 4×3 ; 12 PNG RGBA **512 × 512**, 100 ms/frame, lecture une fois, marge min. 62 px.
- 2 atlas WebP bande de 12 × 384px, 2 GIF, 2 WebP animés, 2 planches de preview, 2 manifestes contenant les hashes de chaque frame.
- Les sources exactes sont incluses dans le ZIP et copiées dans `animations/sources/` pour audit. Les couleurs n'ont pas été recolorées.

## Gouvernance

- Propriétaire : bibliothèque globale `Asset Input`.
- Base : `global-assets@685a8f8f1638393fe5c156d6bb4f4578b0f10067`.
- Checkpoint départ : `checkpoint/global-assets-start-braisombre-face12-2026-10-22`.
- Branche : `work/global-assets-braisombre-face12-2026-10-22`.
- Archive attendue : `_incoming/BRAISOMBRE_FACE_12_VOL_ATTAQUE_GITHUB_2026-10-22.zip` sur la branche **work**.
- Workflow : `.github/workflows/import-braisombre-face12.yml`, déclenché par ajout du ZIP, appelle `scripts/import_braisombre_face12.py` et `npm run ci`.
- Sentinelle générée : `tests/unit/braisombre-face12-assets.test.mjs`.
- Chemins d'import : `assets/library/capture/creatures/braisombre/animations/{movement,attack}/face/**`.
- IDs stables :
  - `pack:capture:creature-braisombre-movement-face-12-v1`
  - `pack:capture:creature-braisombre-attack-face-12-v1`
- Zones protégées : `main`, `Zombicide-40k`, `runtime/` (face/dos/icône), toutes les animations déjà publiées des autres créatures, UI, moteur, et règles.
- État artistique : autorisé à publier dans la bibliothèque ; essai en jeu encore nécessaire. L'ajout catalogue ne prouve pas l'affectation automatique à la fiche combat.

## Checkpoints/Gates avant toute annonce GREEN

1. Le ZIP **réel** est présent physiquement dans GitHub, CRC et SHA exact.
2. Import du vrai contenu : 24 PNG, deux atlas, six previews, manifestes, deux sources ; pas de placeholder, ni recadrage tronquant les ailes.
3. Catalogue unique incrémenté de **2 assets + 2 sprites**, sans supprimer d'ID ni toucher au runtime.
4. Vérifier les hashes des 24 images, les dimensions, les marges et les previews ; sentinelle permanente.
5. CI GitHub finale SUCCESS sur le HEAD **après import**, revue du diff sans modifications hors périmètre.
6. Publier par fast-forward sur `global-assets`, créer un checkpoint GREEN technique après succès ; jamais annoncer une validation du mouvement ou de l'attaque en jeu sans test utilisateur.

**Statut de préparation :** outillage / ZIP local prêts. Les médias ne sont pas déclarés publiés sur GitHub tant que l'archive et son import n'y sont pas physiquement présents.
