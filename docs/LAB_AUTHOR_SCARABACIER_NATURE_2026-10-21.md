# Labo Combat Dynamique — Scarabacier auteur + Nature (21 octobre 2026)

## Source
Fichier du créateur : `gensrpg-capture-database-v1.json`, SHA-256 `e5234da2ad81c71162226b729c4db0ac3f47b2b0afc9377e6bbf3bd02404525c`.
Structure `capture-database-v1` : 103 créatures, 119 compétences, un registre et des règles de progression. **Le créateur a demandé d'extraire exclusivement Scarabacier et la nouvelle stat Nature, et non de réimporter tout le fichier.**

## Scarabacier (seule fiche remplacée)
- ID stable : `crea_scar_2`. La fiche active existante `data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json` est remplacée par le contenu de `creatures[].draft.id == crea_scar_2` du fichier auteur, enveloppé sans réécriture des données dans `capture-creature-transfer-v1`.
- Archive de provenance hors bibliothèque active : `data/capture/source-exports/gensrpg-capture-creature-crea_scar_2-2026-10-21.json`, identique à la fiche active. Aucune seconde inscription au catalogue des créatures.
- L'ancienne fiche avait deux compétences `cisaille`, `cap_water_atk_1` et les slots actifs `cisaille` / `cap_water_atk_1` / vides. L'export auteur contient désormais six compétences autorisées :
  `cisaille`, `cap_water_atk_1`, `carapce_acier`, `Tempete_metallique`, `sangsue`, `tempete_rouille`.
- Slots actifs exacts : `cisaille`, `carapce_acier`, `Tempete_metallique`, `sangsue`, `tempete_rouille` (ultime).
- Statistiques auteur `health:190`, `defense:20`, `acier:15`, `nature:0`. Réaction individuelle `defense` réduction 80 %, recharge 20 s, fenêtre 700 ms, 1 charge. Les autres caractéristiques et résistances sont conservées telles quelles.
- Présentation V8 conservée : visuels face/dos/icône, carapace défensive, roulade, attaques FACE/DOS V5, positions/échelles/sockets et son de déplacement `gensrpg:sound:effect-ad54aecf` à volume 1. Aucune modification des assets visuels, et aucune modification de moteur de mouvement.
- Toutes les compétences référencées existaient déjà dans les presets actifs. Les sept références visuelles ont été vérifiées dans le registre canonique de `global-assets`.

## Nature (registre de stats unique)
- Ajout **append-only** au fichier `data/capture/monster-capture-stat-registry.v1.json`.
- Propriétés de l'export auteur : `id: nature`, `label: Nature`, `damageChannel: nature`, `resistanceChannel: nature`, `damagePctPerPoint:1`, `resistancePctPerPoint:1`, `chargeTimeReductionPctPerPoint:0`, `maxHpPerPoint:0`, `damageReductionPctPerPoint:0`.
- Le champ optionnel `outgoingDamagePctPerPoint` n'est **pas** ajouté artificiellement : il est absent du nouvel objet de l'export. Les 13 anciennes entrées du registre, y compris `acier`, sont conservées identiquement.
- Les anciennes fiches sans champ `nature` restent acceptées par le contrat existant. Les règles de calcul et la liste éditable consultent déjà le registre canonique.

## Gouvernance
Base publiée `gh-pages@bf71d70cbe9d8eb03bc573594ad9305c067e3643`, checkpoint départ `checkpoint/lab-start-author-scarabacier-nature-2026-10-21`, branche de travail `work/lab-author-scarabacier-nature-2026-10-21`. Pas de modification de `main`, `global-assets`, autres créatures/compétences, audio général ni labo Exploration. Musique en pause selon demande auteur.

## Vérification
- Test ciblé Node : registre Nature unique et 1 %/point, rétrocompatibilité Acier, archive et actif identiques, présence de tous les presets de compétence, normalisation import `capture-creature-transfer-v1`, conservation de tous les IDs visuels, valeurs, capacités et son existant.
- CI générale cinq jobs (y compris navigateur réel), checkpoint GREEN **après** réussite seulement ; validation de jeu Android à la discrétion de l'auteur.
