# Prairie fleurie au sol — VFX Capture

- `assetId`: `pack:capture:sprite-flowering-meadow-ground-01`.
- Nature : visuel pur de zone au sol, forme ovale, germination puis éclosion de fleurs.
- 20 frames en 512×512 PNG RGBA, et 20 WebP RGBA équivalentes.
- Atlas runtime WebP horizontal optimisé 7680×384, 20 cellules de 384×384.
- Durée indicative : 80 ms/frame, séquence de pousse jouée une fois ; pour une zone persistante, le système d'animation existant peut conserver la dernière frame selon les réglages de statut/zone.
- Source 1402×1122 (5 colonnes × 4 rangées, environ 280×280 par case) : les frames 512 sont agrandies, **pas générées nativement en 512**.
- Les lignes de grille ont été exclues du recadrage, sans supprimer les fleurs blanches.
- Ne contient ni dégâts, ni règles de combat, ni comportement de collision.
- `catalog-entry.json` est la proposition pour le catalogue global unique, **pas un second catalogue runtime**.

La mise en place sur GitHub nécessite l'insertion de ces médias dans `global-assets`, l'ajout de l'entrée ci-dessus à `data/assets/catalog/global-visual-assets.v1.json`, les tests et l'actualisation de `gh-pages`. Ne pas faire croire qu'un simple upload de ces fichiers dans un dossier les rend sélectionnables par l'éditeur.
