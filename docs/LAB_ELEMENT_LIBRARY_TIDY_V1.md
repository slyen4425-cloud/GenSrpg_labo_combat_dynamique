# Capture — rangement des bibliothèques par élément et audit non destructif V1

Date : 2026-10-09. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Besoin utilisateur

Améliorer le confort de l'éditeur sur smartphone en classant les créatures et les sprites par élément. Vérifier les doublons créature/compétence sans jamais supprimer une version déjà configurée. Le chantier séparé des aides ⓘ est laissé inchangé.

## Base, autorité et protections

- Départ `gh-pages` `1f2291c4314d55876f0c36da4c28fe052cf9fe4f`, CI `37988644021` et Pages `37988644671` SUCCESS.
- Checkpoint `checkpoint/lab-start-element-library-tidy-v1-2026-10-09` et branche `work/lab-element-library-tidy-v1-2026-10-09`.
- Listes dérivées **uniquement** de `configuredCreatures`, `configuredSkills` et du catalogue d'assets réellement chargé, avec les assets de l'utilisateur depuis le même propriétaire existant. Aucun second catalogue autoritaire.
- Aucun moteur, SkillDefinition, JSON de créatures/compétences/visuels, source `global-assets`, branche `main` ou autre dépôt modifié.

## Classements implémentés

1. Menu **Créatures** : catégories Feu, Eau, Terre, Air, etc. d'après les éléments réellement renseignés dans `draft.elements`; créatures multi-éléments rangées **une seule fois** sous l'élément primaire, avec l'ensemble des éléments explicité dans le libellé (ex. Feu + Air). Neutre pour aucune affinité. Tri alphabétique dans chaque catégorie, sélection et chargement par ID inchangés.
2. Menu **Capacités** : regroupement par élément **déjà existant** préservé. Si plusieurs compétences ont exactement le même nom, leur ID est ajouté au libellé pour les distinguer ; aucune définition fusionnée ni effacée. Même précaution pour les listes de loadout.
3. Menus **visuels** : catégories élémentaires au sein des bibliothèques **GenSrpG / Mes assets** pour les sprites Cast, Trajet, Impact, Zone, Statut, Esquive, icônes et portraits. Les tags de l'asset prévalent sur son nom ; sinon lecture des mots explicitement présents dans l'intitulé ou le nom de fichier, y compris les futurs imports `Sprite feu`, `Sprite eau`, etc. Les inconnus restent dans **Autres / non classés** ; pas de devinette d'élément à partir de la créature. Les filtres d'usage par rôle et les choix déjà sélectionnés restent inchangés.
4. Identité des assets : un seul choix par ID dans un menu, aucune suppression de donnée. Les différences de provenance et les ID originaux restent intacts.

## Audit réel des doublons

**Créatures historiques** : `data/capture/monster-capture-creatures.v1.json` contient 110 entrées. Huit anciens IDs sont des **alias déclarés** des canoniques (Braiseau, Ailevent, Lumilo, Noctecroc, Rocorne, Luciéclair, Mirachat, Dracendre) dans `capture-canonical-creature-catalog-v1.js`; la projection active ne retient que 102 fiches canoniques uniques, plus le Loup vitrine = **103 créatures actives**. Ces alias ne sont pas supprimés des sources historiques, pour préserver les anciens IDs et imports.

**Capacités historiques** : `capture-used-ability-catalog-v2.js` contient 103 IDs distincts et 7 paires de noms identiques :
- `lib_tidal_bite` / `cap_water_atk_2` — Morsure de marée ;
- `lib_rock_slam` / `cap_earth_atk_4` — Impact rocheux ;
- `lib_root_snare` / `cap_earth_special_2` — Entrave racinaire ;
- `lib_wind_blade` / `cap_air_atk_2` — Lame de vent ;
- `lib_tailwind` / `cap_air_special_1` — Vent arrière ;
- `lib_flash` / `cap_light_special_2` — Éblouissement ;
- `lib_night_veil` / `cap_shadow_special_2` — Voile nocturne.

**Décision prudente** : chacune des 14 capacités est référencée au moins une fois par la source historique de créatures, et certaines paires diffèrent dans le niveau requis, la puissance ou les effets (dont un skill auteur vitrine personnalisé `cap_water_atk_2`). Par conséquent **aucun doublon n'est prouvé supprimable sans conséquence**. On distingue leurs IDs dans l'éditeur mais on ne supprime aucune fiche.

**Assets visuels** : catalogue `global-assets` consulté, 119 assets, 119 IDs uniques, aucun libellé dupliqué exactement ; aucun média à effacer. Les imports utilisateur gardent des IDs `user:` autonomes.

## Test RED→GREEN

- RED ciblé : SHA `6546f51b28e44f19e4fe71111b75d6b54b75a346`, CI `37992696640` FAILED car les nouveaux helpers de regroupement sont volontairement absents.
- GREEN fonctionnel : SHA `7d8dd81ee1b6d8b5a6e27a9f8c955e3d71be3243`, CI [37992874566](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37992874566) **SUCCESS** :
  - **1344/1344 Node PASS**, 0 FAIL ;
  - vrai **Chromium bibliothèque** 103 créatures (ID uniques), **112 capacités**, sélection d'Aquafin/Dracendre, affichage multi-élément, noms de capacités désambiguïsés, regroupement des assets, aide ⓘ préservée ;
  - vrai **Chromium Tempête de flammes 8/8** joueur/IA × 1v1/2v2 × normal/expiration.
  - cas navigateur « catalogue visuel bloqué » et « présentation non chargée » : 103 créatures préservées.
- Ancienne sentinelle navigateur non déterministe : elle contrôlait la vitrine Firestorm avant le message réel de fin de chargement des 3 modèles vitrine, malgré la présence des IDs historiques. L'attente du test navigateur est désormais synchronisée avec le **signal de chargement existant** (sans timer de gameplay ni modification applicative).

## Restant à décider

L'éditeur est rangé mais **aucune suppression de capacité de même nom n'est recommandée à ce stade**. Si des capacités sont réellement devenues inutiles, établir un inventaire d'usages par loadout/export utilisateur puis décider d'une migration par ID séparée avec son consentement. Le classement des assets se fonde sur les tags existants ou les noms ; les ressources mal ou non renseignées restent « Autres / non classés » jusqu'à enrichissement de leurs métadonnées. Validation tactile physique Android non revendiquée.

## Livraison

Avant publication : vérifier CI du SHA documentaire final, comparer au SHA public exact, créer checkpoint GREEN + preview sur ce SHA, promouvoir `gh-pages` seulement en fast-forward avec lease, vérifier à nouveau CI + Pages. La branche `main` reste inchangée.
