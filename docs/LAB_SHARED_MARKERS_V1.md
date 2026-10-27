# Laboratoire Combat Dynamique — marqueurs partageables V1

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande et limites de la livraison

Le créateur distingue les **statuts** historiques (buff/debuff et effets temporaires) des **marqueurs**. Aucun ancien statut n'est converti ni supprimé. Le marqueur est une spécialisation du `StatusEffectV1` natif `stack_counter` qui partage son identité par `marker.id`, indépendamment de la capacité qui dépose une charge.

Un marqueur peut n'avoir **aucun effet** ; un seuil optionnel `onStackThreshold` déclenche un effet tactique natif à N charges, avec `reset` ou `keep`. Le marqueur utilise la durée et les compteurs déjà gérés par Status Effect Runtime, sans nouveau timer, deuxième HP, second registre runtime ni formule alternative.

Exemple Poison : maximum 10, seuil 10, effet `knockout` via CombatDamageApplication, avec respect de l'immunité aux dégâts, absorption des boucliers, attribution du K.O. et événements tactiques. La garantie de K.O. ne s'applique PAS à une cible immunisée aux dégâts. La mécanique `knockout` est un effet explicite, pas un abus de dégâts de valeur 1 000 000.

## Deux nouvelles actions dans les capacités

- `apply_marker` : référence la définition `marker` canonique, cible, nombre de charges à poser. Deux capacités différentes qui posent le même ID alimentent **une seule** instance de charge ; la source du dernier lanceur reste traçable. Deux définitions différentes pour le même ID sont refusées explicitement.
- `consume_marker` : référence un ID ou `*` pour tous les marqueurs, quantité `all` ou N, minimum de charges, portée cible / soi / alliés / ennemis / tous actifs. Le nombre minimum est évalué par cible avant retrait ; si la condition échoue, l'effet ne se déclenche pas. Le retrait est atomique pour la cible et n'appelle JAMAIS le déclencheur de seuil. Les buffs/debuffs et compteurs historiques sont laissés intacts.
- Jusqu'à 12 effets consécutifs après consommation : dégâts, K.O., soin, énergie, buff/debuff/statut, cleanse, dispel. Chacun repasse par `Immediate Tactical Effects`, ses protections et sa source unique de dégâts.
- `all_active` signifie **tous les acteurs actuellement engagés**, et **pas** tous les membres de réserve. La sélection des réserves nécessitera une extension distincte selon le contrat Roster Session.

## Ergonomie de l'éditeur

Nouvelle carte « Bibliothèque de marqueurs » dans l'onglet Capacités. Création et sélection par ID stable, nom, polarité, durée, maximum de charges, seuil facultatif, effet de seuil simple, import/export JSON explicite. Une sauvegarde de définition synchronise les références de ce marqueur dans les capacités **déjà enregistrées** du propriétaire `configuredSkills`. Les effets normaux `apply_marker` et `consume_marker` disposent de formulaires dédiés dans « Effets tactiques », sans saisie JSON. La consommation permet d'ajouter plusieurs sous-effets. Les statuts existants `configuredSkills` peuvent être repris en sous-effets `apply_status` sans bibliothèque concurrente.

La bibliothèque est une bibliothèque d'auteur, non une deuxième source de vérité runtime. Les exports individuels des compétences embarquent la définition de leur marqueur, pour la portabilité sans un serveur de bibliothèque séparé. L'export JSON de la bibliothèque conserve aussi les marqueurs qui ne sont pas encore reliés à une capacité. L'import refuse d'écraser silencieusement un ID déjà présent avec une autre définition. Les données d'anciennes capacités restent valides.

Le HUD existant identifie les marqueurs avec un losange, `charges/max` ou `charges/seuil`, durée via l'horloge existante, sans emprunter l'icône changeante de la dernière compétence qui a posé la charge. L'`iconAssetId` facultatif est **transporté comme métadonnée auteur**, mais n'est **pas encore résolu en icône personnalisée dans le HUD**. L'éditeur le dit clairement ; ce n'est pas un asset prétendument raccordé.

Le formulaire simple propose un seul effet de seuil ; les définitions importées pouvant contenir plusieurs effets sont conservées et ne peuvent pas être réécrites par le formulaire simplifié (protection explicite anti-perte). Les sous-effets après **consommation** peuvent être multiples. La bibliothèque de session a un export/import JSON explicite ; sans export ou sauvegarde d'un projet complet par le futur GenSrpG, un nouveau marqueur non rattaché à une capacité n'est pas persistant entre rechargements de page.

## Propriétaires et protections

- Définition : `src/contracts/capture-marker-v1.js`, `skill-effect-v1.js`.
- Instances / durées / consommation : `src/core/combat/status-effect-runtime-v1.js`.
- Résolution et protections : `src/core/combat/immediate-tactical-effects-v1.js`, propriétaire existant `CombatDamageApplication`.
- Présentation et auteur : `capture-marker-library-v1.js`, `capture-marker-effect-fields-v1.js`, `capture-editor-human-v2.js`, `dom-status-fx.js`, HTML et CSS existants.
- Aucun changement de la production `Zombicide-40k`, `main`, du labo Exploration, de `global-assets` ou des données Showcase ; fichiers auteur historiques inchangés.

## Protocole et vérification

- Base de départ `gh-pages@df997d39521c2e07cd1cbbd325f781552779fac2`.
- `checkpoint/lab-start-shared-markers-2026-10-17` et seule branche de travail `work/lab-shared-markers-2026-10-17`.
- Régression initiale de la sentinelle test de minimum invalide corrigée. Tests d'intégration : IDs uniques, partage inter-capacités, retrait total/partiel, condition minimum, indépendance des anciens statuts, simultané 4 combattants, immunité au debuff, conflit de définitions, KO avec bouclier / immunité, HUD et crédit.
- Test Chromium du vrai éditeur : 103 créatures présentes, création de marqueur, pose et consommation dans une capacité existante, sauvegarde dans `configuredSkills`, changement de capacité, relecture, export de combat.
- Conditions GREEN techniques : Foundation + quatre navigateurs SUCCESS sur **le même SHA documentaire final**, revue du diff, checkpoint GREEN exact, promotion fast-forward `gh-pages` et validation Pages SUCCESS.
- Validation physique Android : **en attente de l'auteur**. Ne pas annoncer de GREEN utilisateur avant essai sur téléphone.

## Correctif auteur Android — 17 octobre 2026

- Un marqueur neuf se crée désormais en indiquant **son nom affiché seulement**. Le champ d'identifiant technique génère automatiquement un slug ASCII minuscule sans accents ni espaces (par exemple `Vénin` → `venin`). Ce champ n'est plus une condition technique à connaître avant de jouer.
- Sur sélection d'un marqueur enregistré, l'ID canonique est verrouillé ; la fiche peut être modifiée sans briser les références des capacités existantes. Une nouvelle création avec le même ID est **refusée** au lieu d'écraser silencieusement la définition. Le contrat `CaptureMarkerV1` et ses règles de validation restent strictement inchangés.
- Après enregistrement, les menus « Marqueur à poser », « Quels marqueurs consommer ? » et « Coût en marqueurs » déjà présents dans l'éditeur se rechargent depuis la même bibliothèque. Les choix antérieurs d'autres capacités ne sont pas modifiés.
- Reproduction du bug auteur : capture Android avec erreur en anglais `Marker ID must be a stable lowercase slug` et export `gensrpg-marqueurs.json` contenant `markers: []`. Le parcours de test préexistant remplissait explicitement `marker-id=poison` et manquait donc le défaut d'ergonomie.
- Régression automatisée : parcours vrai Chromium **sans ID renseigné**, nom accentué `Poïson`, création `poison`, sélection dans une rangée `apply_marker` déjà ouverte, rejet du doublon, verrouillage d'un ID enregistré, sauvegarde/rechargement/export de capacité ; test unitaire de translittération. CI Foundation et quatre tests navigateur sur SHA du code `91ae19e1b1b57ac40114fc0cb5ee70ab4b4b61a9` run `39012916029` : **5/5 SUCCESS**. Validation tactile finale sur Pixel/Android par l'auteur toujours en attente.
