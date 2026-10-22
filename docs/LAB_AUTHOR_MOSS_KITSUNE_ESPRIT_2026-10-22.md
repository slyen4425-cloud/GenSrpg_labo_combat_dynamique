# Mise à jour export auteur — Moussados, Kitsune Lunaire et Esprit (22/10/2026)

## Source et diagnostic
Fichier `gensrpg-capture-database-v1(2).json`, SHA-256 `81a1fff688b9ad59a357fdb2650a7c87677ba760ba98ad26646732eca55c2541`. Export `capture-database-v1` : 104 créatures et 119 compétences. Comparaison exacte à `gensrpg-capture-database-v1.json` précédent (103 créatures) :
- Nouvelle créature `kitsune_lunaire` / Kitsune Lunaire.
- `crea_mossback` / Moussados : changement du champ `draft.presentation`, version 2 → 9 et configurations de déplacement/attaque FACE et DOS, plus champs de stats zero.
- Nouvelle statistique `esprit` dans `statRegistry` : `label:Esprit`, `damageChannel:esprit`, `resistanceChannel:spirit`, dégâts et résistance chacun `1` par point. Respecter la distinction littérale entre ces deux identifiants de canal ; pas de renommage implicite.
- Les 93 autres anciennes créatures modifiées dans l'export ont uniquement le champ de stat `nature:0` ajouté (absence équivalente à zéro pour la configuration actuelle). Les 119 compétences et règles de progression ne changent pas.

## Autorités : import ponctuel, sans double catalogue
- Seul `data/capture/monster-capture-stat-registry.v1.json` contient la définition de `esprit`, en fin de registre ; Acier/Nature et les 12 entrées précédentes restent strictement identiques.
- `data/capture/showcase/crea_mossback.capture-creature-transfer-v1.json` conserve l'ID Moussados, remplace la fiche V2 par l'export auteur V9, les sockets et le son de déplacement existants.
- `data/capture/showcase/kitsune_lunaire.capture-creature-transfer-v1.json` est une nouvelle fiche `capture-creature-transfer-v1` active, indexée une seule fois dans `src/catalogs/capture-showcase-creature-presets-v1.js`. Elle ne reçoit aucune capacité ni animation artificielle ; l'export n'en fournit pas.
- Deux copies de provenance **inactives** dans `data/capture/source-exports/gensrpg-capture-creature-{crea_mossback,kitsune_lunaire}-2026-10-22.json`. Ces exports sont identiques aux fiches actives, mais n'apparaissent pas dans l'index.
- Ne pas recharger les 104 créatures historiques depuis le grand export dans la vitrine (l'index contient une sélection auteur) ; les champs `nature:0` manquants n'obligent pas à réécrire les 93 anciennes fiches ou écraser les réglages du Loup/Scarabacier. Aucun skill du fichier n'est modifié.

## Assets existants et vérifiés
- Moussados : FACE `creature-golem-moussu-opponent-01`, DOS `creature-golem-moussu-player-01`, icône `creature-golem-moussu-icon-01`; mouvement FACE/DOS et attaque FACE/DOS, 4 sprites de 12 frames déjà présents sur `global-assets`.
- Kitsune : FACE `creature-renard-lunaire-opponent-01`, DOS `creature-renard-lunaire-player-01`, médaillon `creature-renard-lunaire-icon-01`. Trois images statiques 512/512/384 déjà déposées ; ne pas les inscrire dans les sélecteurs de sprites animés.
- Aucun changement du catalogue `global-assets`, ni des ressources visuelles, ni des licences.

## Tests et gouvernance
- Base publiée `gh-pages@123346186868a3b7e1e3dd5e89e0274a49e6595d`, checkpoint de départ `checkpoint/lab-start-author-database-kitsune-moss-esprit-2026-10-22`, branche isolée `work/lab-author-database-kitsune-moss-esprit-2026-10-22`.
- Test spécifique `tests/unit/capture-author-moss-kitsune-esprit-2026-10-22.test.mjs` : statut unique, imports par contrat réel, Esprit 1% dégâts/résistance et compatibilité, visuels FACE/DOS, paramètres Moussados et Kitsune, aucune capacité inventée.
- Suite globale CI cinq jobs y compris navigateur ; corriger les anciennes sentinelles strictes sur le nombre de stats par recadrage documenté avant tout changement. Aucun changement aux moteurs Combat/Audio/Rendu.
- Validation visuelle mobile par l'auteur après publication, distincte de GREEN technique.
