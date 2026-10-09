# Onde régénérante — intégration fidèle du nouvel export auteur

Date : 2026-10-09. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Défaillance reproduite

L'utilisateur a confié le transfert `gensrpg-capture-skill-lib_aqua_heal(2).json`. Il y a bien une icône et un effet visuel de régénération dans cet export. Or le preset jusque-là publié `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json` comportait `presentation:null`. Il n'y avait donc **pas** de visuel personnalisé à résoudre depuis la bibliothèque active, et aucun rendu ne pouvait reconstituer ce qui n'avait pas été importé.

La disparition provient de la **non-reprise de la version d'export plus récente dans le preset publié**, et non d'une perte démontrée à l'export du navigateur. Les tests précédents ne validaient que le Gameplay et la présence du preset dans le sélecteur ; ils ne contrôlaient pas les médias auteur.

## Source auteur et conservation

Source prioritaire : transfert joint `gensrpg-capture-skill-lib_aqua_heal(2).json`, `schema=capture-skill-transfer-v1`, `id=lib_aqua_heal`, `presentation.version=3`.
- Icône `visual.icon.assetId=core:icon-skill-recall-01`.
- Aura de statut `statusVisuals.lib_aqua_heal_regeneration.mode=sprite`, sprite `pack:capture:sprite-status-healing-aura-01`, scale **1.7**, opacité **0.45**, teinte `#9b59d0` à **0.35**.
- Effets : **5 PV directs**, puis **3 PV chaque 3000 ms pendant 20000 ms** ; cette nouvelle valeur de 3 PV est explicitement dans le fichier utilisateur et remplace les 5 PV/tick mis manuellement dans la version antérieure. Ne pas augmenter silencieusement.
- Autres champs inchangés : catégorie soin, élément eau, niveau requis 15, coût 8, préparation 2500 ms, cooldown 30000 ms, ciblage `self`, `presentation.audio={}` ; ne pas convertir `self` en `ally` sans instruction.
- Empreinte SHA256 d'une sérialisation JSON à clés triées (indépendante de l'ordre des objets) : `75b4c9b404c56333a0cf22cd6be1fe2410531477d137be99ba089f1ec93133e5`. Nouvelle sentinelle sur **la totalité du transfert** évitant toute perte silencieuse ultérieure d'une propriété auteur.

## Vérification physique des références

La source de vérité des médias reste `global-assets` ; aucune copie locale ni média de remplacement inventé.
- Catalogue : `data/assets/catalog/global-visual-assets.v1.json` (branche `global-assets`) contient réellement les deux `assetId`.
- Icône : `assets/library/core/icons/skills/icon_skill_recall_01.webp` (blob existant).
- Aura : `assets/library/capture/sprites/statuses/healing_aura/atlases/sprite_status_healing_aura_atlas_01.webp` (blob existant, sprite-strip **8 frames** à **90 ms**).
- Une vérification d'identité source/bytes est obligatoire avant de déclarer l'asset créé ; ici les fichiers étaient **déjà existants** et n'ont pas été modifiés, seuls leurs IDs sont rebranchés par le transfert.
- Le renderer `DomStatusFxRenderer` consomme `statusPresentationFor(statusId,{sourceSkillId})`, applique l'opacité `0.45`, l'échelle `1.7` et les frames dans le propriétaire natif ; aucun renderer parallèle ni réglage implicite.

## Frontières, branches et tests

- Base publiée GREEN `ac8cef7e01159d28c42cc9cd54e0c24f62951890`.
- Checkpoint : `checkpoint/lab-start-aqua-heal-visual-fidelity-v1-2026-10-09`; travail `work/lab-aqua-heal-visual-fidelity-v1-2026-10-09`.
- Remplacement de **la seule** fiche active (un unique chemin de transfert déjà déclaré dans le registre de presets). Aucun autre ID touché.
- Tests : test initial RED sur la fiche où manquent icône/aura ; verrou digest complet de l'export auteur ; import/export/éditeur round-trip complet ; vrai resolver de présentation et vrai renderer de statut ; vrai Chromium sélectionne `lib_aqua_heal`, vérifie les champs d'icône/aura/échelle/opacité, sauvegarde, puis inspecte le vrai Blob JSON exporté sans perdre les effets ; 103 créatures/112 capacités + Jet Beam + progression des cinq paliers + niveau 20 preview préservés.
- Les tests historiques `5 PV/tick`, `presentation:null`, ainsi que le test de duplication synthétique qui oubliait de changer `presentation.subjectId`, ont été ajustés **uniquement dans les tests**, sans modifier le moteur.
- Protégés : les autres presets, créatures, loadouts, FX, Audio, `main`, `global-assets`, dépôts GenSrpG et Exploration.
- CI complète Node + vrai Chromium sur SHA documentaire exact, checkpoint GREEN, preview, fast-forward `gh-pages` avec lease et Pages SUCCESS avant GREEN technique ; validation smartphone distincte.

## Cas utilisateur

Dans l'éditeur, sélectionner `Onde régénérante`, vérifier l'icône « recall », ouvrir le soin périodique et le visuel du statut : l'asset Aura de soins est préchargé avec **170 %** d'échelle et **45 %** d'opacité. La présentation est liée au statut `lib_aqua_heal_regeneration` tant que la régénération est active. La capacité doit être équipée, le lanceur au bon niveau, pour apparaître en test de combat.
