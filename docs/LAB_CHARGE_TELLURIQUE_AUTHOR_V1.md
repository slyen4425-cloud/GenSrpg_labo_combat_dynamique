# Labo Combat — Import auteur Charge tellurique

Date : 11 octobre 2026

## Mission et source
- Fichier fourni par l'auteur : `gensrpg-capture-skill-cap_earth_atk_3.json` (JSON texte, 3539 octets).
- Identité canonique : `cap_earth_atk_3`, nom `Charge tellurique`.
- Base du labo `gh-pages` : `b367aeb87f325d6c457d8dd9b3b23ffbee699428`, CI/Pages précédents verts.
- Checkpoint initial `checkpoint/lab-start-charge-tellurique-author-v1-2026-10-11`, branche `work/lab-charge-tellurique-author-v1-2026-10-11`.

## Résultat exact
- Un nouveau fichier de transfert utilisateur est créé au chemin `data/capture/showcase/cap_earth_atk_3.capture-skill-transfer-v1.json`, chargé par l'unique registre `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` depuis `src/catalogs/capture-showcase-skill-presets-v1.js` (une déclaration).
- L'hydratation existante du `CaptureTransferV1` remplace un ancien ID natif identique, au lieu d'ajouter une nouvelle entrée. Pas de nouveaux comportements moteur ni de copie du vieux catalogue historique.
- Comparaison du JSON du dépôt avec le JSON utilisateur : **égalité structurée complète**, clés et valeurs inchangées.
- Données auteur : niveau 15 ; catégorie buff/debuff ; forme aura ; Terre ; self seulement ; coût 3 énergie ; préparation 2000 ms ; cooldown 60000 ms. Aura de durée 30000 ms, rayon short, tick 1000 ms, statusBehavior while_inside, persistAfterRecall true, effet energy_regen_modifier +50 %, durée de statut 3000 ms, stacking stack/max1. Présentation V9, aura de nature à l'échelle 2,5 et opacité 0,6.
- Icône `core:icon-skill-thorn-vines-01` et sprite `pack:capture:sprite-cast-nature-01` existaient déjà dans le catalogue officiel `global-assets` : vérification des deux IDs et compatibilité combat/capture/éditeur ; **0 fichier média ajouté ou modifié**. Le comportement sonore est identique à l'export (aucun son).
- Fichier historique `main`, `global-assets`, autres capacités/créatures, règles combat / énergie / cooldown et assets laissés inchangés.

## Validation
- Sentinelle RED : le test ciblé `tests/unit/capture-charge-tellurique-author-v1.test.mjs` échoue tant que le preset manque du registre.
- Après import, run Laboratory CI `38092200377` **SUCCESS**, tous les jobs (foundation / firestorm-zone-growth-browser / creature-library-browser) réussis sur commit `48399a7ab3da6933ca016d9e579f77aff1508491`.
- Sentinelles : présence exactement une fois, fidélité des propriétés, `CaptureTransferV1` roundtrip exact, remplacement ciblé `cap_earth_atk_3` dans la vraie base d'éditeur sans perte d'autres compétences, vrai `CombatSession` créant la zone +50 % et conservant les caractéristiques d'énergie de base.
- CI sur dernier SHA documentaire, checkpoint GREEN exact, promotion fast-forward de `gh-pages` sous lease et déploiement Pages : vérifier et consigner avant déclaration finale. Contrôle tactile Android du rendu de l'aura reste distinct de la CI.
