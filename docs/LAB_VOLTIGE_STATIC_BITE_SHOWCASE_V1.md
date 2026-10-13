# Labo Capture — Import exact de Voltige et Crocs statiques (13 octobre 2026)

## Demande et source autoritaire
Deux fichiers fournis par l'auteur, sans retouche silencieuse :
- `gensrpg-capture-creature-crea_voltik.json` → `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json`
- `gensrpg-capture-skill-lib_static_bite.json` → `data/capture/showcase/lib_static_bite.capture-skill-transfer-v1.json`

Leur identité **octet pour octet** a été confirmée par comparaison `git hash-object` local avec les blob SHA GitHub des fichiers livrés :
- Créature : `038aec78ef20dc8fb589ba3c0e7de1d67d9219d5` (SHA-256 original `42d7248a419804a18f1a3b2a99b0989fc032e5c134a29f9e76e4d3e65b19a0b2`)
- Capacité : `4253e619a3d19277e2e00311d94c6c1f4def4575` (SHA-256 original `fdf48c592683f20a2659771b50a8cb052b41eacf2aa2a319fa52a07ddae43a90`)

## Branche, charte et intégration
- Base LIVE `gh-pages@e8f1e4c87232332ca6810e295f6d228a98bbffa8` ; CI initiale `38431513146` et Pages `38431512607` SUCCESS.
- Checkpoint de départ pris AVANT code `checkpoint/lab-start-voltige-static-bite-showcase-v1-2026-10-13`.
- Branche isolée `work/lab-voltige-static-bite-showcase-v1-2026-10-13`.
- Les fichiers auteur sont référencés **exactement une fois chacun** dans les catalogues existants `src/catalogs/capture-showcase-creature-presets-v1.js` et `src/catalogs/capture-showcase-skill-presets-v1.js` (5 créatures vitrine et 20 compétences vitrine).
- Le chargement existant `hydrateCaptureShowcaseSkillPresetsV1`, puis `hydrateCaptureShowcaseCreaturePresetsV1`, puis `applyCaptureTransferBatchToEditorStateV1` avec `mode:"replace"`, est le seul chemin actif. Aucun autre registre, copie spéciale, fallback ou moteur ajouté. L'UI sélectionne/recharge depuis les Maps actives `configuredSkills` et `configuredCreatures`. La construction Combat V3 lit ces mêmes fiches.
- `crea_voltik` existait parmi les 103 entrées historiques ; `lib_static_bite` était déjà référencée et définie historiquement. Dans les tests du véritable import atomique les plans sont `replace-skill` puis `replace-creature`, effectifs uniques par ID, effectifs globaux inchangés, autres fiches préservées.

## Paramètres auteur préservés
- Voltige `crea_voltik` : niveau initial 1, élément électrique ; points de vie 120 via `statValues` ; profil `biped` (tel que fourni), scale global 1.08, joueur 0.9, adversaire 1 ; bonus d'approche -40 % ; sockets bouche, tête, mains/pattes et queue face/dos originaux sans arrondi ; résistances dont terre -50 % et électrique +35 % ; évolution vers `crea_fulguro` au niveau 16.
- Loadout conservé `[lib_chain_lightning, lib_static_bite, lib_thunder_dash, lib_paralyze, null]`. La capacité de niveau requis 5 reste configurée au slot 2 au niveau de départ 1 : la progression décide seulement quand l'activer, sans supprimer le slot.
- Crocs statiques `lib_static_bite` : contact, électrique, 4 dégâts, coût 3 énergie, préparation 600 ms, déplacement 600 ms, recharge 6 secondes ; statut `stack_counter` 3 stacks de 10 secondes avec reset au seuil et étourdissement de 3 secondes ; visuel d'impact électrique et son d'impact référencé tels qu'exportés.

## Vérification des ressources et avertissement non bloquant
- Trois `assetId` des images Voltige, impact `pack:capture:sprite-impact-electric-01`, icône `pack:capture:icon-skill-burning-bite-01` présents dans le catalogue `global-assets@ffed974c51d58d59a2e5cf20fd9eca00d76ec111`, avec chemins de ressources existants dans l'arbre ; audio `gensrpg:sound:genrpg-pack2-af938ec6` présent dans `data/presentation/audio/private-audio-catalog.v1.json`. **Aucun nouveau média créé ni remplacé** : ce lot n'attribue pas de nouvelle certification artistique aux médias historiques.
- **Attention** : l'icône de Crocs statiques dans l'export est celle intitulée « Morsure brûlante » dans le catalogue. Maintenue volontairement à l'identique, conformément à la charte §33.1. L'auteur peut demander un changement dans un lot séparé si souhaité.
- Le son référencé porte le libellé de catalogue « Electrique projectile2 » et un rôle `travel`, malgré son usage `impact` dans l'export ; l'export auteur est conservé.

## Contrôles TDD, non-régression et publication
- Nouvelle sentinelle `tests/unit/capture-voltige-static-bite-showcase-v1.test.mjs` committée avant les deux JSON : avant intégration, RED attendu sur liens/catalogues ; après intégration GREEN.
- Contrôle complet de la normalisation et aller-retour JSON par les adaptateurs officiels, valeurs exactes sockets, stats et loadout, effets de stack/stun, remplacement atomique ID stable, absence de duplicata, autres entrées natives conservées.
- Quatre tests antérieurs à cardinalité figée ajustés **uniquement** sur les nouvelles longueurs 4→5 et 19→20 ; leurs vérifications de contenu et de SHA des anciens exports demeurent intactes.
- CI Foundation + Chromium Firestorm + Chromium bibliothèque des 103 créatures : **SUCCESS** sur le SHA de code `2356eb0827ba828107c07b825e4ea598f299537d` (run `38443017508`). Final SHA avec documentation doit être retesté, checkpoint GREEN exact, FF sous lease après vérification concurrence, CI et Pages post-publication.
- Validation manuelle téléphone de la présence du nouveau modèle et de son icône **à confirmer séparément** ; un GREEN technique n'est pas une validation de l'ergonomie/du rendu par l'auteur.
