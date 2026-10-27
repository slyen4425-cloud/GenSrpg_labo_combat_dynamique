# Intégration des deux capacités auteur — Sangsue et Tempête de rouille (21 octobre 2026)

## Références et source de vérité
Demande : « place les deux capacités ». L'auteur confirme que le **fonctionnement de Sangsue** lui convient ; il n'a **pas encore testé les ombres d'envol**. Aucun paramètre moteur, asset, ombre, code UI, loadout ou créature n'est modifié ici.

Base : `gh-pages@1fa454e642e15423b1a19668015dca330a3791bf`.
Checkpoint de départ : `checkpoint/lab-start-author-sangsue-rust-2026-10-21`.
Branche : `work/lab-author-sangsue-rust-2026-10-21`.
Sources originales enregistrées sans retouche :

| Fichier utilisateur | SHA-256 source UTF-8 | Archive Git unique | Preset actif |
|---|---|---|---|
| `gensrpg-capture-skill-sangsue.json` | `4f01446e69c1cbc7f058f6710b33b738574fc4acf8fb027f10e63a371fd7c82f` | `data/capture/source-exports/gensrpg-capture-skill-sangsue-2026-10-21.json` | `data/capture/showcase/sangsue.capture-skill-transfer-v1.json` |
| `gensrpg-capture-skill-tempete_rouille(1).json` | `d26de89a321526f9c69b64e9e9383e524f1396e20ed7574ab67013616f1a3bc8` | `data/capture/source-exports/gensrpg-capture-skill-tempete_rouille-2026-10-21.json` | `data/capture/showcase/tempete_rouille.capture-skill-transfer-v1.json` |

La version `tempete_rouille` du **20 octobre** reste conservée physiquement dans `data/capture/source-exports/gensrpg-capture-skill-tempete_rouille-2026-10-20.json`. Le nouveau transfert la remplace dans la vitrine avec le **même identifiant stable**. Le catalogue contient déjà une unique entrée `tempete_rouille` ; une seule ligne de catalogue `sangsue` est ajoutée, sans double autorité.

## Paramètres de l'auteur conservés sans correction silencieuse

**Sangsue** : ID `sangsue` ; offensive nature ; niveau 15, emplacement standard, forme contact avec approche au sol ; coût 2, préparation 350 ms, déplacement 700 ms, cooldown 3 s ; maintien sans durée limite (0), chaque 1 000 ms dégâts nature de 6 sur la cible suivis d'un `life_steal` de 100 % sur le lanceur ; aucun effet immédiat, `presentation:null`. **Pas d'icône ou de sprite inventé** : le rendu utilisera le comportement natif de base, pas une présentation personnelle qui n'a pas été exportée.

**Tempête de rouille** : ID stable `tempete_rouille` ; `category:counter`, élément `steel`, `requiredLevel:20`, `loadoutSlot:ultimate` (auparavant niveau 15 et standard), coût 6, préparation 700 ms, recharge 40 s. Zone `zone` de rayon court à 15 000 ms (auparavant 20 000 ms), dégâts 20 toutes les 1 000 ms, réactivation `refresh`. Le canal interne du tick reste exactement `"acier"` tandis que l'élément du skill est `"steel"` : aucune conversion implicite de la fiche auteur. Conserve la seconde ligne damage 0 exactement exportée. Présentation : l'icône `pack:capture:icon-skill-tourbillons-rouille-01` et le sprite `pack:capture:sprite-rust-whirlwind-cast-01`, résolus dans `global-assets`, dont les fichiers réels étaient déjà présents et ne sont pas modifiés. Toutes les couleurs / scale / audio / caméra auteur restent identiques à l'export.

## Chemin réel et risques
`CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` charge les deux transferts par `hydrateCaptureShowcaseSkillPresetsV1` ; le transfert canonique alimente `configuredSkills`. Une ancienne Tempête de rouille est remplacée par ID et jamais recréée comme deuxième fiche. Le sélecteur lit `configuredSkills` et affiche la fiche mise à jour. Aucune association à un loadout spécifique n'est créée ; après le changement **standard → ultime**, une créature qui avait équipé Tempête de rouille dans un slot standard peut nécessiter un déplacement manuel explicite dans l'éditeur. La charte §33.11 interdit une migration silencieuse.

## Tests
- Vérifier les deux SHA-256 exacts des uploads archivés et actifs, égalité d'octets, données normalisées par `importCaptureTransferJsonV1`.
- Tester `humanSkillEditorFieldsFromDraftV1 → buildHumanSkillDraftV1`, capacité native par `adaptCaptureSkillToSkillDefinition`, catalogue chargé une seule fois.
- Simuler `planCaptureTransferImportV1` dans `configuredSkills` : insertion Sangsue + remplacement Tempête de rouille, aucun doublon, rechargement identique/no-op, sans changement de loadout.
- Conserver l'ancienne sentinelle de provenance Tempête 20/10 et la mettre à jour pour la version réellement active.
- Vérifier CI complète (5 jobs) et vraie UI Capture/Combat ; checkpoint GREEN sur le SHA validé puis PR et déploiement. Contrôle visuel Android des capacités et **ombres d'envol** à confirmer par l'auteur.
