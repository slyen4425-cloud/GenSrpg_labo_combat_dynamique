# CAST / STATUS / OMBRE V1 — livraison du 2026-10-04

Les deux dernières planches fournies par Sylvain sont intégrées au catalogue et au runtime : **12 animations logiques**, cinq charges existantes remplacées et sept auras/statuts ajoutés, **96 phases PNG RGBA** et **12 atlas WebP sans perte**. L’ombre est pilotée par le même plan et le même renderer que la créature.

État : contenu réel inspecté, médias déposés/catalogués/raccordés et preview navigateur vérifiée. Validation artistique finale par Sylvain sur smartphone encore ouverte ; les checkpoints de ce lot sont techniques, aucun GREEN utilisateur ni merge main.

## Sources et transparence

Les fichiers reçus portent une extension .png mais leurs octets sont des **JPEG RGB 1536 × 1024 aplatis**. Les originaux restent archivés byte pour byte. Le fond noir/damier et les libellés ont été retirés avec imagegen dans deux dérivés PNG RGBA ; aucune imitation de transparence par damier.

| Source | Fichier archivé dans global-assets | SHA-256 |
| --- | --- | --- |
| Image ChatGPT 3 oct. 2026, 20_36_44.png — CAST/CHARGE | `assets/library/capture/sprites/source/cast_charge_source_01.jpg` | `aac01479c103250ff2fd7cb459f7131364c089d6586d64d813b4da7c59706b69` |
| Dérivé CAST transparent | `assets/library/capture/sprites/source/cast_charge_transparent_01.png` | `96880c963b818d980fdd5cce82ef1c9b6618a94bfb5477837a2b8fa5544ea5de` |
| Image ChatGPT 3 oct. 2026, 20_37_03.png — AURA/STATUS | `assets/library/capture/sprites/source/status_aura_source_01.jpg` | `bcc082152b0b5c83b34b51c890dc43bc48267751120740ad478801fcb8f19904` |
| Dérivé AURA/STATUS transparent | `assets/library/capture/sprites/source/status_aura_transparent_01.png` | `d6cbc9891a4cb7188725f2529ec5de6cd06cbf8cfe111694b46e303371c53b7d` |

La récupération d’alpha est assistée par IA : les dérivés ne prétendent pas être pixel-identiques au RGB original. La dernière passe CAST isole les huit amas Nature en les réduisant dans leurs cellules à environ 75 % de leur taille précédente ; les originaux ne sont pas retouchés. Cette correction évite de découper des feuilles appartenant à une phase voisine. Les glows et les noyaux noirs intentionnels de Malédiction ont été inspectés sur fonds clair et sombre.

La découpe par script copie exactement les rectangles RGBA documentés, puis ajoute du padding transparent dans des canvases 256 × 256. Pas de resampling, color-key, seuil d’alpha, rotation, recentrage individuel ni peinture par code. L’atlas 2048 × 256 conserve exactement les huit PNG décodés, alpha compris.

## Comptage physique exact

| Élément du lot | Nombre | Format |
| --- | ---: | --- |
| Frames de charges | 40 | PNG RGBA 256 × 256 |
| Frames d’auras/statuts | 56 | PNG RGBA 256 × 256 |
| Atlas runtime | 12 | WebP VP8L sans perte 2048 × 256 |
| Originaux inchangés | 2 | JPEG RGB 1536 × 1024 |
| Planches dérivées transparentes | 2 | PNG RGBA 1536 × 1024 |
| **Total images ajoutées** | **112** | **98 PNG + 12 WebP + 2 JPEG** |
| Séquences | 12 | JSON, 5 remplacées + 7 nouvelles |
| Manifestes de provenance/découpe | 2 | JSON |
| Catalogue modifié | 1 | JSON |
| Script d’extraction | 1 | Python |

Le payload écrit **128 chemins**, soit 112 images + 16 fichiers non image, total **14 768 372 octets**. Ce comptage exclut les tests et journaux ajoutés séparément. Les **40 anciens SVG de frames CAST sont supprimés**, les cinq IDs logiques sont conservés. Les impacts, projectiles et ressources Fireball dédiées ne changent pas.

Catalogue après import : **95 assets logiques au total**, dont 48 sprites ; ce lot concerne 12 IDs (5 réutilisés + 7 nouveaux). Les fichiers physiques ne sont pas comptés comme autant d’assets logiques.

## IDs, chemins actifs et SHA Git des atlas

Racine physique : `assets/library/` sur la branche **global-assets** de `slyen4425-cloud/GenSrpg_labo_combat_dynamique`. Le Resource.file du catalogue omet uniquement cette racine ; aucune branche work/checkpoint n’est utilisée pour résoudre un média runtime.

| Animation | assetId | Chemin Git exact | SHA Git du blob |
| --- | --- | --- | --- |
| Lame | `pack:capture:sprite-cast-blade-01` | `assets/library/capture/sprites/casts/blade/atlases/sprite_cast_blade_atlas_01.webp` | `0695adc9d37dc3d8b648742180c296ab822826fc` |
| Physique | `pack:capture:sprite-cast-physical-01` | `assets/library/capture/sprites/casts/physical/atlases/sprite_cast_physical_atlas_01.webp` | `32fb2547f3f6561bbd1ecb1f819cf079892450d1` |
| Électrique | `pack:capture:sprite-cast-electric-01` | `assets/library/capture/sprites/casts/electric/atlases/sprite_cast_electric_atlas_01.webp` | `d937ea7f6d0d479150adca8a6aef29c0ce0bdc00` |
| Eau | `pack:capture:sprite-cast-water-01` | `assets/library/capture/sprites/casts/water/atlases/sprite_cast_water_atlas_01.webp` | `068e09a14bb3d9f862653dac4683e78a011705fd` |
| Nature | `pack:capture:sprite-cast-nature-01` | `assets/library/capture/sprites/casts/nature/atlases/sprite_cast_nature_atlas_01.webp` | `3676e0f1d59a7148513aa6b8d22786bf85d3ea34` |
| Aura de soins | `pack:capture:sprite-status-healing-aura-01` | `assets/library/capture/sprites/statuses/healing_aura/atlases/sprite_status_healing_aura_atlas_01.webp` | `d3ef75e14925d207edf73882a342240a0cf82135` |
| Bouclier d’énergie | `pack:capture:sprite-status-energy-shield-01` | `assets/library/capture/sprites/statuses/energy_shield/atlases/sprite_status_energy_shield_atlas_01.webp` | `30cce413a22e90c02a65b96a22eb480ef14386bd` |
| Carapace | `pack:capture:sprite-status-stone-shell-01` | `assets/library/capture/sprites/statuses/stone_shell/atlases/sprite_status_stone_shell_atlas_01.webp` | `14fe9c1115f74d01fcd7902572dc5ff0473140a5` |
| Poison | `pack:capture:sprite-status-poison-01` | `assets/library/capture/sprites/statuses/poison/atlases/sprite_status_poison_atlas_01.webp` | `63c550978aa46c56b0a4084007bfdc22a0c00a94` |
| Régénération | `pack:capture:sprite-status-regeneration-01` | `assets/library/capture/sprites/statuses/regeneration/atlases/sprite_status_regeneration_atlas_01.webp` | `6177e0917c56c21403d8e321889cc2a3fbb9cb54` |
| Purification | `pack:capture:sprite-status-purification-01` | `assets/library/capture/sprites/statuses/purification/atlases/sprite_status_purification_atlas_01.webp` | `ed89d8b25f4103a1c45195f6407c996635ad34c9` |
| Malédiction | `pack:capture:sprite-status-curse-01` | `assets/library/capture/sprites/statuses/curse/atlases/sprite_status_curse_atlas_01.webp` | `f2e5a8cc425859c4d029d18c8bb51d91db4f557d` |

Les frames utilisent le même répertoire de famille, sous `frames/sprite_cast_<famille>_01.png` à `_08.png` ou `frames/sprite_status_<famille>_01.png` à `_08.png`. Les séquences sont `sprite_cast_<famille>_sequence.json` / `sprite_status_<famille>_sequence.json`.
Les deux manifestes `assets/library/capture/sprites/source/cast_charge_extraction_v1.json` et `status_aura_extraction_v1.json` listent les rectangles exacts, offsets de padding et SHA-256 de chaque frame/atlas, ainsi que les prompts et les sources. Le script reproductible est `scripts/extract-cast-status-sprites-v1.py`.

Commit contenant les médias réels : **`c87478cd9f1ba475bdc5032f3356bb27b9516f36`**, tree **`71aa2da9699c50b197947acf433d061ce7f31577`**. Les 128 SHA Git recalculés à partir des octets locaux ont été comparés aux blobs retournés par GitHub puis à l’arbre commité : tous identiques. Aucun transfert binaire tronqué accepté.

## Raccord natif et durée

Les cinq charges se lisent une fois, huit phases à 60 ms. Les sept statuts utilisent huit phases à 90 ms, en boucle pendant l’existence du statut/aura. Le retrait suit le lifecycle Runtime existant.

DomStatusFxRenderer réutilise `applySpriteVisual`, le lecteur de DomSkillFxRenderer. Le fond affiche une seule cellule de l’atlas (`800% 100%`, `steps(8, jump-none)`, 720 ms/cycle). Le node reste stable aux refreshs ; les pistes sont annulées à remplacement/expiration/dispose. L’icône de capacité source conserve priorité dans le HUD ; le fallback prend une phase médiane, jamais tout l’atlas.

Les sélecteurs « Effet de cast », « Apparence du statut » et « Visuel persistant de zone » résolvent ces IDs par les contrats/consommateurs existants. Cache révisé en `2026-10-04-v11-cast-status-source-alpha-v1`. Les réglages once/loop/stretch des projectiles et les échelles/durées/offsets du lot précédent restent fonctionnels.

## Ombre

AnimationCore ajoute `segment.ground` (X/Y au sol + profondeur) au plan canonique. La trajectoire du corps reste inchangée. Le mouvement local de saut/float et les déformations/rotation ne sont pas appliqués à l’ellipse.

DomTimeline possède les deux projections aux mêmes offsets/easing/durée ; DomActorRenderer possède les deux animations WAAPI, recale leur startTime après ready et annule/restaure les deux ensemble. Le pseudo-élément natif `fighter::before` conserve la forme/opacité/bas du profil et l’échelle de distance du conteneur. L’ombre disparaît avec le KO et revient correctement après cancel/remplacement/dispose. Aucun timer/observer, moteur, état gameplay ou collision supplémentaire.

Vérification navigateur au renderer réel :
- Quadrupède joueur au milieu : corps X=160, ombre X=96,2031 après centrage de base −63,7969 ; les deux ont avancé de 160 px. Y du sol=−35.
- Au contact : corps X=320/Y=−70, ombre X=256,203/Y=−70 ; même déplacement 320/−70 et échelle de profondeur de l’ombre 0,818.
- Quadrupède adversaire au milieu : corps X=−160, ombre X=−223,797 ; même déplacement −160 px ; Y du sol=35.
- Volant adversaire, attaque aérienne au milieu : corps Y=−478,303, ombre Y=30,9454 ; la projection reste au sol. Retour contrôlé : mêmes X/Y au sol et restauration du point de départ.

Les boutons de la page shadow-review pilotent uniquement pause/currentTime des deux pistes exposées par le renderer natif. C’est une fixture visuelle, pas un second moteur de combat.

## Preuves TDD / CI / previews

| Lot | Commit contrôlé | CI complète | Résultat |
| --- | --- | --- | --- |
| Ombre | `c787ed7ac9c754b2fc4a0b70f52a4dc165c947c5` | run 37175714211 / job 111357778597 | 940/940 |
| Statuts animés et raccords | `154a671d5b88a4a53484d31e108fec96726485ec` | run 37177091650 / job 111361875495 | 948/948 |
| Source/runtime + revue d’ombre | `3bf7e7d53793e53bcb69e26a171288596384e4b8` | run 37178666223 / job 111366534498 | 948/948 |
| Médias/catalogue | `c87478cd9f1ba475bdc5032f3356bb27b9516f36` | run 37178014153 / job 111364613898 | 202/202 |
| Publication global-assets | `c87478cd9f1ba475bdc5032f3356bb27b9516f36` | run 37178051234 | succès |

RED ombre : 17 tests nouveaux échouaient sur la base. RED statuts : 7/8 échouaient sur le cadrage, après correction explicite d’une première fixture de test incomplète. Les 3 sentinelles médias échouaient avant import. Les tests médias examinent les signatures PNG/WebP, alpha réel, taille/contenu varié, manifestes et liens catalogue, pas seulement l’existence des fichiers. Les vérifications locales supplémentaires décodent et comparent tous les pixels RGBA frame/atlas.

Preview native ouverte et vérifiée :
- [Éditeur du labo](https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/b3a347c271401a5fb5566dc203c4cd2d9920a938/examples/dom-demo/capture-editor-v2.html) : cinq nouveaux libellés de charges et sept choix de statut/zone constatés.
- [Douze animations](https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/b3a347c271401a5fb5566dc203c4cd2d9920a938/examples/dom-demo/cast-status-review.html) : **12 atlas et 96 phases prêts**, zéro image cassée, 2048 × 256 / 256 × 256, lecture des charges et sept loops natifs, arrêt nettoyé ; inspection clair/sombre.
- [Ombre par phase](https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/3bf7e7d53793e53bcb69e26a171288596384e4b8/examples/dom-demo/shadow-review.html) : projection native réelle contrôlée au milieu, contact, retour et attaque aérienne.

Le combat de l’éditeur s’ouvre après enregistrement du brouillon local de Griffe. Les valeurs locales employées pour l’observation ont été restaurées à préparation 1200 ms / trajet 1500 ms. La fixture index historique échoue sur un ancien profil « drake » ; ce lot n’altère pas cette fixture et fournit le contrôle natif dédié ci-dessus.

## Reprise et protections

Branches de travail : `work/lab-cast-status-shadow-v1-2026-10-04`, `work/global-assets-cast-status-source-alpha-v1-2026-10-04`. Source runtime médias : **global-assets**, avancée par fast-forward non forcé après CI et inspection.
Checkpoints de départ : `checkpoint/lab-start-cast-status-shadow-v1-2026-10-04` et `checkpoint/global-assets-start-cast-status-source-alpha-v1-2026-10-04`.
Checkpoints techniques validés : `checkpoint/lab-ground-shadow-v1-ci-2026-10-04`, `checkpoint/lab-cast-status-native-v1-ci-2026-10-04`, `checkpoint/global-assets-cast-status-source-alpha-v1-ci-2026-10-04`.

Main reste à `3197388f2b3ee7491be6e6125a015315158cffa2`. Aucun accès en écriture à Zombicide-40k. Suite ouverte : revue artistique et tactile sur smartphone par Sylvain.
