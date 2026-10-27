# Créatures niveau 1 + Bulle aquatique sur Onde régénérante + Tempête de flammes à 50 %

Date : 2026-10-09. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande utilisateur et source de vérité

Trois réglages persistants du laboratoire Capture :
1. Toutes les créatures de la liste doivent afficher **niveau 1** dans l'onglet Identité. Le combat de **test** continue à projeter éphémèrement le niveau **20** pour tous les participants, sans enregistrer le niveau 20 dans les fiches du jeu.
2. Sur la capacité existante `lib_aqua_heal` / **Onde régénérante**, remplacer **uniquement** le sprite visuel persistant du statut de régénération par le dernier sprite de **bulle de soin aquatique** déjà publié.
3. Sur l'ultime feu existant au **niveau requis 20**, ID `cap_fire_atk_6`, nom réel dans la bibliothèque **Tempête de flammes**, régler l'opacité de `presentation.visual.aura` à **0.5**, sans changer l'effet de zone ni la capacité.

## Gouvernance

- Base `gh-pages` : `e90eee467d0420de2775a128608df0ac8c8382d9`, CI `37942368913` et Pages `37942367799` SUCCESS.
- Checkpoint de départ : `checkpoint/lab-start-author-defaults-heal-fire-v1-2026-10-09`.
- Branche dédiée : `work/lab-author-defaults-heal-fire-v1-2026-10-09`.
- Seuls propriétaires modifiés : **sources catalogue** des niveaux, **transferts vitrine** pour les créatures/capacités, **builder historique existant** pour sélectionner des mouvements planifiés, appel de démarrage dans le Human Editor. Aucune autorité de combat, de stockage, de média ou de niveaux parallèle.

## Niveaux persistants et disponibilité des capacités

- `data/capture/monster-capture-creatures.v1.json` : **110** entrées historiques réécrites avec `level:1`, dont **8 aliases** déjà dédupliqués au chargement ; les **102** identités canoniques sont maintenues.
- `data/capture/showcase/crea-loup.capture-creature-transfer-v1.json` (Loup), `crea_maraileron` (Maraileron) et `crea_mossback` (Moussados) : niveau enregistré **1**. Maraileron et Moussados remplacent deux fiches canoniques, Loup apporte la 103e identité. Toutes les statistiques, résistances, visuels, sockets, évolutions, loadouts, ID et skillIds sont inchangés.
- Le constructeur de loadout historique `buildCaptureCreatureHistoricalLoadoutV1` conserve son ancien mode `selectionMode:"unlocked"`, et accepte `selectionMode:"planned"` pour conserver les **quatre** capacités de la fiche historique même si elles ne sont pas encore disponibles au niveau 1. **Un seul point d'appel** de montage dans le Human Editor utilise planned ; les règles de progression et le nombre de places restent la seule autorité pour l'activation en combat.
- Le test de l'éditeur utilisait déjà `buildCaptureEditorCombatTestV1(previewLevel=20)`, qui crée des copies temporaires des drafts pour l'export de test. Aucune modification de ce comportement ni du niveau du jeu.

## Remplacement de la bulle de soin, sans toucher au gameplay

- ID unique : `pack:capture:sprite-water-healing-bubble-01`, présent dans `global-assets`, catalogue `data/assets/catalog/global-visual-assets.v1.json`.
- Média physique déjà publié, **atlas WebP**, `assets/library/capture/sprites/skills/water_healing_bubble/atlases/sprite_heal_water_bubble_atlas_20f_384.webp`, **20 frames × 70 ms**, blob Git `0b6084079457e9c3dae0d9a26656c99dd806e3c4`, taille **1 174 322 octets** ; sa présence et son contenu ont déjà été validés lors de l'intégration de bibliothèque précédente.
- Réaffectation d'un seul champ `presentation.statusVisuals.lib_aqua_heal_regeneration.sprite.assetId` (ancien `pack:capture:sprite-status-healing-aura-01`).
- Les autres champs sont **strictement conservés** : échelle **1.7**, opacité **0.45**, icône, statut et effet de soin immédiat **+5 PV**, régénération **+3 PV toutes les 3 s pendant 20 s** (valeur du dernier export auteur publié), coût, cible, recharge, nom et niveau requis 15. Aucune modification automatique vers la précédente valeur de +5 PV/tick.

## Ultime feu

- ID : `cap_fire_atk_6`, nom **Tempête de flammes**, niveau requis **20**, emplacement `ultimate`.
- Visuel conservé : `pack:capture:sprite-fire-zone-loop-01`, couches et dimensions inchangées.
- Modification isolée : `presentation.visual.aura.opacity` **1 → 0.5**. Les ticks, durée, activation/renforcement, largeur, hauteur et règles de ciblage restent identiques.

## Vérification

- RED des assertions d'état antérieur et nouveaux tests, puis mise à jour des tests historiques **sans supprimer leurs invariants** (ancienne projection de niveau testée explicitement à son niveau d'origine).
- Tests unitaires `tests/unit/capture-author-defaults-heal-bubble-fire-zone-v1.test.mjs` : **110 entrées + 3 transferts** au niveau 1, aller-retour JSON créature/compétence, planification future conservée, bulle d'eau et résolution 20 frames/45 % et ultima niveau 20/zone 50 %.
- CI `37951425527` sur `fabf8dc184bf1046d8159f4f3a22c49df8c1df6a` SUCCESS : **1332 Node PASS**, navigateur PASS.
- Vraie UI Chromium `37951515670` sur `6cd0df795ea7aaa6f4e3a150ffaafbd5166175e9` SUCCESS : **1332 / 1332 Node PASS**, 0 FAIL, navigateur réel PASS. Les **103 identités** apparaissent une fois ; Aquafin, Maraileron, Moussados et Loup affichent le niveau **1** dans Identité, le test reste **20** ; l'ultime est rechargé avec **50 %**, l'éditeur/export recharge la bulle aquatique et conserve le soin, le rayon et les contrôles d'opacité sont également couverts.
- 0 nouvel asset logique, **0 fichier média** créé/modifié. Deux transferts de capacités existants modifiés, quatre sources de créatures (catalogue historique + trois vitrine). Les données auteur restent configurables et exportables.
- GREEN technique : CI Node + vrai navigateur sur SHA documentaire final, diff exact revu, checkpoint GREEN/preview au SHA, `gh-pages` mise à jour par fast-forward sous lease, CI publiée et Pages SUCCESS. Validation Android visuelle utilisateur distincte.
