# Labo Capture — Import exact Arc électrique / lib_chain_lightning (13 octobre 2026)

## Fichier et autorité
- Source utilisateur : `gensrpg-capture-skill-lib_chain_lightning.json` (6385 octets UTF-8).
- Transfert canonique unique : `data/capture/showcase/lib_chain_lightning.capture-skill-transfer-v1.json`.
- Contrôle d'intégrité octet pour octet : Git blob SHA `727b0e0962231276f2ab625dafbe6634e57a38a1`, identique à la source locale.
- Ajout une fois au catalogue `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`. Chargement par `hydrateCaptureShowcaseSkillPresetsV1`, import atomique par ID `configuredSkills`, pas de nouvel owner.
- Le monstre historique Voltige référence déjà ce skill par `abilityIds`. Les catalogues de définitions native de tests ne l'enregistrent pas nécessairement avant le transfert : insertion initiale de la définition si absente ; remplacement si existante, jamais duplicata.

## Valeurs auteur conservées
- `lib_chain_lightning` Arc électrique : niveau 10 ; élément électrique ; `beam` ; énergie 6 ; préparation 800 ms ; trajet 650 ms ; récupération 0 ; cooldown 45 s ; 20 dégâts électriques avec ignoreDamageReduction 30%, puis `stun` 3000 ms.
- Visuels cast, beamStart, travel et impact : `assetId`, sockets bouche, ancrage, offsets, scale, durée, audio cast/travel/impact et FX complets (Glow 0.85 / 32 px ; secousse 9 / 140 ms ; trail, burst, fumée) inchangés.
- Aucun asset, son ou fichier `global-assets` créé, modifié ou substitué.

## Protocole
- Base LIVE `gh-pages@68d10471f59e2a33f1a6f33191b99bfedb9ac02f` CI/Pages verts, checkpoint avant code `checkpoint/lab-start-chain-lightning-showcase-v1-2026-10-13`, work `work/lab-chain-lightning-showcase-v1-2026-10-13`.
- Sentinelle dédiée TDD RED `tests/unit/capture-chain-lightning-showcase-v1.test.mjs`, commit `5258102d52a5a9bdd7dde631ceb0c4f01f0e6908`. Les 3 tests de cardinalité historique `20` ajustés à `21` sans supprimer leur couverture auteur.
- Interdictions : changement de contenu auteur, nouveaux FX owners, UI 1v1/2v2, Combat Runtime, 103 créatures, `main`, `global-assets`, autre dépôt.
- GREEN technique = Foundation + Firestorm Chrome + bibliothèque Chrome 103 créatures, checkpoint exact SHA, FF sous lease puis CI/Pages post-publication.
- Validation de l'effet en combat Android par l'auteur séparée de CI.
- Glow quick preset et sémantique Immobilisation seront examinés dans leurs lots isolés. Diagnostic initial : l'UI remet toujours le quick preset sur « Conserver mes réglages actuels » lors du chargement, même si FX sauvegardés ; et `immobilize` bloque le mouvement `session.move` mais pas l'approche automatisée d'une capacité de mêlée. Aucun changement de gameplay ici.
