# Correction description défense / deux compétences Terre — 2026-10-10

## Demande et fichiers sources
- Export utilisateur : `gensrpg-capture-skill-lib_earth_guard.json`, transfert `capture-skill-transfer-v1`, ID `lib_earth_guard`, Carapace minérale.
- Export utilisateur : `gensrpg-capture-skill-cap_earth_atk_2(1).json`, transfert `capture-skill-transfer-v1`, ID `cap_earth_atk_2`, Coup minéral.
- Retour réel : Carapace réduit les dégâts reçus de 40 %, mais la fiche du buff dit « augmentés de 40 % ».

## Cause racine
`data/capture/monster-capture-stat-registry.v1.json` définit `defense.damageReductionPctPerPoint=0.2`. Le statut réellement fourni par Carapace vaut `deltaPoints=200` et `modifierMode=points`, soit +40 % de **réduction des dégâts reçus**. La projection de stat `projectStatusStatEffectsV1` produit correctement `damageReductionPct=40`. L'affichage `status-effect-info-v1.js` appliquait un message générique « dégâts reçus augmentés de 40 % » au pourcentage positif. L'ancienne formule était juste ; les mots étaient inversés.

## Réparation au propriétaire unique
- `src/adapters/renderer/status-effect-info-v1.js` : inversion **seulement** des mots associés à `damageReductionPct` (positif : « Dégâts reçus réduits de 40 % » ; négatif : « Dégâts reçus augmentés de 20 % »). Conservation de la présentation des autres effets (dégâts infligés, résistance, charge, DoT/HoT).
- Aucune modification de la formule, des soins, des PV, du buff, du moteur de combat ou de l'horloge.

## Capacités auteur importées sans ajustements
- **Carapace minérale** : `data/capture/showcase/lib_earth_guard.capture-skill-transfer-v1.json` : requis niv. 5, énergie 2, préparation 800 ms, recharge 45 000 ms, buff `+200 defense` pendant 25 000 ms, couleur `#9b59d0`, sprite Carapace.
- **Coup minéral** : `data/capture/showcase/cap_earth_atk_2.capture-skill-transfer-v1.json` : requis niv. 1, énergie 3, préparation 1200 ms, trajet 1400 ms, recharge 15 000 ms, 8 dégâts Terre, étourdissement 500 ms, impact nature.
- Les deux fichiers sont enregistrés **une seule fois** dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` ; l'éditeur hydrate `configuredSkills` par ID stable, sans créer de source parallèle.
- Aucun changement de loadout des créatures.

## Assets liés vérifiés
Les quatre références `assetId` sont présentes dans le catalogue réel du dépôt `global-assets` et leurs fichiers images existent dans son arbre Git :
1. `pack:capture:icon-skill-earth-carapace-01` -> `assets/library/capture/icons/skills/icon_skill_earth_carapace_01.webp` (11 058 octets).
2. `pack:capture:sprite-status-stone-shell-01` -> `assets/library/capture/sprites/statuses/stone_shell/atlases/sprite_status_stone_shell_atlas_01.webp` (306 596 octets, 8 images, 90 ms par frame).
3. `core:icon-skill-rock-smash-01` -> `assets/library/core/icons/skills/icon_skill_rock_smash_01.webp` (16 898 octets).
4. `pack:capture:sprite-impact-nature-01` -> `assets/library/capture/sprites/impacts/nature/atlases/sprite_impact_nature_atlas_01.webp` (256 084 octets, 8 images, 45 ms par frame).

Source des visuels : catalogue `global-assets/data/assets/catalog/global-visual-assets.v1.json`, pack existant ; **aucun nouveau fichier media généré ni ajouté**, 4 `assetId` réutilisés. Deux fichiers physiques de preset JSON ajoutés.

## Validation
- Base publique de travail : `70af0686fafa3c2ffd4e1e9dd2cdcc6d8d8f5fed` (CI et Pages réussies).
- Checkpoint départ : `checkpoint/lab-start-defense-buff-description-v1-2026-10-10`.
- Test RED dédié : `tests/unit/defense-buff-description-author-presets-v1.test.mjs`, CI `38051562513` en échec attendu avant correction.
- Tests ciblés : projection +40/-20/0, Carapace issu du véritable fichier auteur via instance de statut canonique, texte final du HUD, parsing et roundtrip des deux exports, remplacement d'ID dans `configuredSkills` sans supprimer le natif.
- Suite avant édition finale du rapport : CI `38051736579` SUCCESS sur `331ef37b21a2022551db234c545e41998fd97f0e` (Foundation + Chromium bibliothèque et Firestorm 1v1/2v2). Publication sous lease après GREEN au SHA de la dernière édition documentaire. Validation visuelle smartphone distincte du GREEN technique.
- `main`, `Zombicide-40k`, exploration et tous les propriétaires gameplay non modifiés.
