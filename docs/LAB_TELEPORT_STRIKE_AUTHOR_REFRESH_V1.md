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

À compléter après CI : SHA des validations, résultats, checkpoint exact, statut de publication et validation Android.
