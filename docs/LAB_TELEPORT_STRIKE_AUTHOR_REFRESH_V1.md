# Frappe téléportée — transfert auteur V1 — 14 octobre 2026

## Base, origine et autorité

- Dépôt exclusif : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base initiale exacte : `gh-pages@c527e9ae578aa4bd07209f7fa2d69acecf372420`.
- Branche : `work/lab-teleport-strike-author-refresh-2026-10-14`.
- Checkpoint de départ : `checkpoint/lab-start-teleport-strike-author-refresh-2026-10-14`.
- Fichier utilisateur : `gensrpg-capture-skill-teleport-strike(1).json`, 2415 octets SHA-256 `9229bcb607939e0ffd6f8e284f3e1f2ba24ab5ec1ef493343a9000ef09f53ab2`.
- Unique source éditoriale : `data/capture/showcase/teleport-strike.capture-skill-transfer-v1.json`, déjà déclarée une seule fois dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`; aucun deuxième ID, catalogue ou moteur.
- Changement sur la définition : préparation `1200 -> 500 ms`, récupération `650 -> 0 ms`, recharge `0 -> 20000 ms`, dégâts `24 -> 16`. Le transfert auteur est inséré octet pour octet, tous les autres champs inchangés.
- Sentinelle Voltige / Frappe téléportée synchronisée sur les 4 chiffres de l'auteur ; nouveau test de SHA auteur et import/export, owner Showcase unique et vrai chemin `CombatSession` (16 dégâts, recharge 20 s).
- Non touchés : `main`, `global-assets`, fichiers de créatures, statut stun, Surcharge, Arc électrique, esquive, ressources audio/visuelles et tout autre dépôt.

## Gate CI et publication

La base `gh-pages@c527e9ae578aa4bd07209f7fa2d69acecf372420` a une CI Laboratoire **FAILURE** (run `38624745283`, uniquement `creature-library-browser`: timeout à 50s après les premiers scénarios; foundation et Firestorm SUCCESS) malgré GitHub Pages SUCCESS. Ne pas présenter un nouvel état comme GREEN ni publier sur `gh-pages` sans CI complète verte sur le nouveau SHA, sans lease protégeant les branches concurrentes.

## Résultat du vrai chemin et vérifications

- Commit de la capacité et des tests : `f63c8b561c1396b2311042c1ecfc5d3df4f2442a`.
- Import octet-identique du fichier utilisateur : Git Blob `d5306701dae6b9082a0c708d473c72508e6e029a` et SHA-256 auteur `9229bcb607939e0ffd6f8e284f3e1f2ba24ab5ec1ef493343a9000ef09f53ab2`.
- Unicité de l'ID `teleport-strike` dans le catalogue Showcase, roundtrip Transfer réussi.
- CombatSession : 16 dégâts, activation bloquée avant la fin des 20000 ms de cooldown, 16 dégâts supplémentaires à la réactivation.
- Tests de branche sur `f63c8b561c1396b2311042c1ecfc5d3df4f2442a` : CI `38627241110`, **3 jobs SUCCESS** dont Foundation 1776/1776 tests et 2 scénarios de contrôle Chromium (Firestorm et Creature Library).
- CI de base `c527e9a` : le premier passage avait échoué sur timeout Browser (run `38624745283`), puis nouvelle exécution indépendante SUCCESS (`38626906282`). Pas de régression reproduite du catalogue.

## Finalisation attendue

Rendre la CI documentaire finale verte sur son SHA exact, créer le checkpoint GREEN correspondant, publier sous contrôle de concurrence et vérifier CI/Pages en production. Vérification visuelle smartphone par l'auteur encore attendue ; ne pas inventer de GREEN utilisateur.
