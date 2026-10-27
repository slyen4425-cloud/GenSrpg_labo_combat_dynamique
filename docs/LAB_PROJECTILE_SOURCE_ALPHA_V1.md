# PROJECTILES — source alpha v1 — 2026-10-03

## Source et détourage

Fichier fourni : `Image ChatGPT 3 oct. 2026, 20_36_51.png`.
Inspection du contenu : **JPEG RGB 1536 × 1024**, malgré le suffixe PNG fourni. Le damier gris/noir est aplati dans les pixels.
L'original est archivé sans conversion dans `assets/library/capture/sprites/source/projectile_elemental_source_01.jpg`.
SHA-256 original : `ad41429d03909e3b7799eedb2d1745ec6a41b7110efc919dc4c95624268b8914`.

Le fond, les cadres, les icônes de titre et les légendes ont été retirés avec **imagegen**, option `transparent_background: true`, en mode background-extraction.
Le prompt intégral et les coordonnées d'extraction sont dans `projectile_elemental_extraction_v1.json`.
Dérivé : `assets/library/capture/sprites/source/projectile_elemental_transparent_01.png`, véritable **PNG RGBA 1536 × 1024**.
SHA-256 dérivé : `46432a8cadff53dbfc19286d567e298f190f72ea679a631f98d8fee5e10ba50a`.

Le résultat du détourage assisté par IA a été comparé à l'original sur fonds clair et sombre : les 64 phases, petits fragments, glows et noyaux noirs/violets de la rangée ombre sont présents.
Le dérivé n'est **pas** présenté comme une copie identique des pixels RGB aplatis de l'original.
La découpe copie ensuite exactement les pixels RGBA du dérivé, sans redimensionnement, peinture, suppression de couleur, seuil alpha ni rotation. Un fin résidu dans la gouttière gauche de la colonne 6 est exclu par la fenêtre de découpe, sans retoucher les pixels du projectile.

## Inventaire réel et mapping

**74 fichiers image** : original JPEG + dérivé PNG RGBA + **64 PNG RGBA 256 × 256** + **8 atlas WebP lossless 2048 × 256**.
Huit phases distinctes par famille, 45 ms par phase. Les marges extérieures sont transparentes.
Chaque WebP a été décodé et comparé octet par octet aux huit PNG RGBA ; aucune perte, y compris dans le canal alpha.
Le JSON de provenance est une trace d'extraction ; seul le catalogue global possède les IDs d'assets.

| Famille | ID conservé | SHA-256 atlas WebP |
| --- | --- | --- |
| Feu | `pack:capture:sprite-projectile-fire-01` | `7dfd0c6f091294c95e9008a3ac7a2a55a5dce264a03896fa0c38388b62c60c4d` |
| Eau | `pack:capture:sprite-projectile-water-01` | `12c01fb9feb8930d89ba78dabf2d313706ea89c92be5ad46343c21429c44de4a` |
| Terre | `pack:capture:sprite-projectile-earth-01` | `508a6112050dab01b635bfdd7aa0f04077bb343ad79bc2b7e5c1046dcaa5868c` |
| Plante | `pack:capture:sprite-projectile-thorn-01` | `4cf995ccdee14ad90005055e2a5aa992558d03bdaa89daa502682e7a8be4de00` |
| Électrique | `pack:capture:sprite-projectile-electric-01` | `90c033fbc1fdbc70e1133100734b912c04c4769624827dd2308e2f44b8dade1f` |
| Glace | `pack:capture:sprite-projectile-ice-01` | `7794b75efffe22a76a576dac49509c9e9b315c59a9806342336e919a3f3c4bde` |
| Lumière | `pack:capture:sprite-projectile-light-01` | `07d166ec946fe8a906cf42d46bea89d832a7273572dcbe020c959b3d5355ef93` |
| Ombre | `pack:capture:sprite-projectile-shadow-01` | `b98e268deda0e9dcc4aa6e2eb163e68be49986cf58c7809b97d62dc20d5e741b` |

Les fichiers sont sous `assets/library/capture/sprites/projectiles/{fire,water,earth,thorn,electric,ice,light,shadow}/` :
- `frames/sprite_projectile_<famille>_01.png` à `_08.png` ;
- `atlases/sprite_projectile_<famille>_atlas_01.webp`.

Les huit IDs existants du catalogue `data/assets/catalog/global-visual-assets.v1.json` restent uniques et de catégorie `travel`.
Seules leurs ressources passent des anciennes séquences SVG aux vrais atlas `sprite-strip`.

## Présentation et éditeur

La planche pointe vers le haut à droite. La direction `headingRad` et l'ancre `coreAnchor` de chaque famille ont été calibrées sur la tête/pointe de la phase 04 et consignées dans le JSON.
Le renderer existant utilise déjà ces champs pour tourner le visuel et placer son cœur sur le centre du shell.
L'ancre est une calibration visuelle statique de la phase principale ; les étincelles et les phases de naissance/dissipation restent décoratives et ne définissent pas la collision.
Aucun moteur, timer, hitbox, contact ou règle de dégâts n'est ajouté ou modifié.

Les mêmes métadonnées sont transmises par `globalCaptureStripAsset` dans `examples/dom-demo/demo-assets.js`.
L'éditeur Capture utilise son catalogue global et son resolver existants ; les huit choix `Projectile/trajet` conservent leurs IDs.
Révision de cache active : `2026-10-03-v10-projectile-source-alpha-v1`.
Les impacts publiés précédemment et les médias dédiés de la vraie Boule de feu sont inchangés.

Fixture `examples/dom-demo/projectile-review.html` : huit animations par le Render Adapter existant, 64 PNG de contrôle, fonds clair/sombre et trajets dans les deux sens.
La taille 2,8 de cette fixture sert à l'inspection ; elle ne change pas la taille native des bindings ni la mécanique du combat.
Les projectiles de la fixture sont annulés par l'API existante après `arrived`, sans timer ajouté.

## Vérifications et état

Base assets publiée : `b235f2b0deee0f79e4e6e1de81f05ba1b9921eec`.
Base laboratoire : `bbfd1baa81d83fb77d13623a7f4be962b082f1bd`.
Branches isolées : `work/global-assets-projectile-source-alpha-v1-2026-10-03` et `work/lab-projectile-source-alpha-v1-2026-10-03`.

RED local puis GitHub Actions run **37151331040** : 198 tests passent, la nouvelle sentinelle échoue sur le média manquant avant implémentation.
Correction du diagnostic de format de l'original dans la sentinelle : vérification de la signature JPEG et du SHA original, au lieu d'inférer PNG depuis le nom.
GREEN local : contenu RGBA des 64 phases, hashes, marges, diversité, catalogue et signatures/dimensions des huit WebP vérifiés.
GREEN local présentation : 8 tests, dont orientation des huit nouveaux projectiles et conservation du binding dédié de Boule de feu.
Publication, CI complète et contrôle du navigateur : voir le relevé ci-dessous et `LAB_CURRENT_WORK.md`.

Un checkpoint CI est intermédiaire. La validation artistique finale de Sylvain sur la preview reste requise avant un checkpoint GREEN final, conformément à §34.
CASTS et STATUS ne sont pas traités par cette planche.


### Contrôle réel après publication

Médias réellement stockés au commit assets `56e1d89477683e2e3327743701b4bf7c470849d8`, publiés par fast-forward de `global-assets`.
GitHub Actions **37152624189 : 199/199** ; GitHub Actions laboratoire **37152677737 : 913/913**, au commit présentation `06fd9f6b94993eee9c84ea63294abc81adc950bd`.
Les huit URLs WebP de `global-assets` répondent 200 ; SHA-256 des réponses égal à l'inventaire, et dimensions décodées 2048 × 256.
Les 80 entrées du catalogue hors ce lot restent identiques ; le catalogue garde ses 88 IDs uniques.

Preview effectivement ouverte dans le navigateur :
https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/06fd9f6b94993eee9c84ea63294abc81adc950bd/examples/dom-demo/projectile-review.html
État : **8 atlas prêts**, **64 PNG chargés en 256 × 256**.
Les huit lectures natives ont été contrôlées de gauche à droite puis de droite à gauche sur fond clair : chaque résultat `arrived`, `activeCount=0` après nettoyage par l'API existante.
Inspection directe des 64 phases et de la planche dérivée sur fonds clair et sombre ; le noyau noir/violet et les fragments d'ombre restent présents.

Éditeur effectivement ouvert :
https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/06fd9f6b94993eee9c84ea63294abc81adc950bd/examples/dom-demo/capture-editor-v2.html
Champ `[data-skill-travel-fx]`, rôle travel : huit choix `pack:capture:sprite-projectile-<famille>-01`, aucun ID changé.
Sélection de contrôle `pack:capture:sprite-projectile-fire-01` acceptée ; l'UI a confirmé « Capacité “Boule de feu” exportée ».
Limite de ce contrôle : le téléchargement automatique de cet export a expiré ; le contenu JSON téléchargé n'est donc pas annoncé relu.
Le lancement de combat après changement non sauvegardé est correctement refusé par l'éditeur existant. Aucun brouillon d'essai n'a été enregistré ; le rechargement restaure le projectile dédié `pack:capture:sprite-fireball-travel-01`.
La preuve de lecture des huit nouveaux médias est la fixture native dédiée, sans fallback, et non ce lancement refusé.

Capture de preview conservée : `GenSrpG_Projectiles_Preview_1791060832153.jpg`.
Les familles CASTS et STATUS gardent leur état antérieur : aucun de leurs anciens médias provisoires n'a été promu dans ce lot.
État du lot : médias réels publiés, raccord éditeur vérifié, CI technique réussie ; validation artistique finale utilisateur encore ouverte. Checkpoints de fin nommés **CI**, jamais GREEN artistique.
