# Monster Capture — Défense 0,20 % et aides contextuelles ⓘ V1

Date : 2026-10-09. Repo : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`. Changement de présentation UI + une seule valeur par défaut.

## Décision du créateur

- **Défense standard à 0,20 % par point**, soit **5 points pour 1 % de réduction générale des dégâts reçus**, au lieu de 1 %/point.
- Ce n'est **pas un verrou** : l'éditeur existant permet de changer le coefficient, d'ajouter d'autres stats ou de **retirer Défense** entièrement. Toute configuration personnalisée provenant d'un jeu ou d'un export reste sous le contrôle de ce jeu.
- Les résistances aux canaux/éléments et la Défense générale restent calculées par le **même** `CombatDamageV1`, sans formule parallèle. Les descriptions de stats utilisent la définition effective et les points édités ; elles ne décrètent jamais universellement « 5 points = 1 % » si le coefficient a été modifié.

## Gouvernance vérifiée

Base `gh-pages` : `16b2fca0ea65baac83ee132502c8baac6dfa62c8` ; CI `37981275797` et Pages `37981275764` SUCCESS.
Checkpoint de départ `checkpoint/lab-start-contextual-editor-help-v1-2026-10-09`. Branche isolée `work/lab-contextual-editor-help-v1-2026-10-09`. Périmètre déclaré dans `docs/LAB_CURRENT_WORK.md` avant code et étendu sur **la seule** ancienne sentinelle `capture-legacy-status-semantics-v1` suite à la CI.
`main`, GenSrpG principal, exploration et `global-assets` intacts.

## Réalisation

- Registre : `data/capture/monster-capture-stat-registry.v1.json` Défense `damageReductionPctPerPoint: 1 -> 0.2` ; aucune modification des autres valeurs ou identités.
- Aide UX : `src/ui/capture-editor-contextual-help-v1.js`, nouvelle projection **en lecture seule** des contrôles du Human Editor. Aucune table de gameplay concurrente ni second état de combat.
- `details/summary` « ⓘ » natifs, accessibles au toucher et au clavier, dans statistiques, capacité, niveau/énergie, conditions d'activation, effets, mouvement, temps, visuels. Fermés par défaut pour éviter la surcharge sur smartphone.
- Description vivante de capacité : lit nom, niveau, énergie, élément, préparation, trajet, récupération, cooldown, utilisations et les effets **réellement renseignés** : dégâts de base, pénétration, soin, énergie, statut/DOT/HOT, zone persistante (durée et cadence), renforcement, nettoyage/dissipation et effet différé. Les dégâts sont toujours signalés comme base avant résistances/Défense ; aucune dérivation à partir d'ID ou de nom de compétence.
- Modification d'un champ dans le brouillon => explication actualisée sans enregistrer une fausse seconde compétence ; changer de skill recharge l'explication. Le panneau peut s'ouvrir/fermer sans écrire dans les exports. Les aides stat restent cohérentes même si Défense a été retirée.

## Tests

- **RED** : SHA `da001037897a7987469292c7f5d3abd0a01bf848`, CI `37987922817` FAILED avant le module d'aide et le changement du registre.
- Ancienne valeur figée 1 % détectée dans `capture-legacy-status-semantics-v1` et autorisée avant ajustement de la seule assertion. Test d'aide vérifie la propriété DOM `dataset.statDefinitionRemove` (au lieu d'un attribut littéral absent du code source).
- **GREEN fonctionnel** : [Laboratory CI 37988365397](https://github.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/actions/runs/37988365397) SHA `3e739f326936fbbc2ab5be9a98cf785f917b42af` : **1338/1338 tests Node PASS**, 0 FAIL ; navigateur **103 créatures** SUCCESS ; navigateur **Firestorm 8 scénarios** SUCCESS.
- Le vrai navigateur vérifie aussi : aide ⓘ ouverte par `click`, Défense 0.2, 5 points 1 %, changement visible à 0.5 %/point, application du registre, retrait de Défense, passage Tempête de flammes (15 secondes) à 13 secondes sans sauvegarde, bascule sur `lib_aqua_heal` (+5 immédiat, +3 HoT toutes les 3 s pendant 20 s) et explication mise à jour. Tous les tests de 103 créatures et FX préexistants restent verts.

## Diff & protections

Diff base -> GREEN fonctionnel : 11 commits / 0 behind, 9 fichiers (avant rapport) :
- produit : registre standard, *une valeur* seulement ;
- présentation : `src/ui/capture-editor-contextual-help-v1.js`, petit raccord `src/ui/capture-editor-human-v2.js`, HTML/CSS des ⓘ ;
- tests : Node nouveau, ancienne sentinelle 1 % actualisée, Chromium UI existant étendu ;
- gouvernance : `docs/LAB_CURRENT_WORK.md`, ce rapport.

Aucun autre registre, créature, SkillDefinition, moteur, dégâts, import/export, FX, sprites, sons, Beam ou statut changé.

## Suite UX, hors périmètre V1

Ce micro-lot **n'affirme pas** que chaque sous-champ technique possède déjà son propre ⓘ : il reste à décrire individuellement dans des lots suivants les paramètres avancés par type de statut, la géométrie Cast/Beam/Impact, les visuels et offsets distincts joueur/adversaire, tous les réglages des créatures, règles de combat et progression. Cette extension doit continuer à générer des exemples depuis la valeur réelle, sans inventer de gameplay et sans ajouter de tables autoritaires.

## Livraison

CI de la révision documentaire finale à vérifier avant checkpoint GREEN et preview ; promotion `gh-pages` seulement en fast-forward lease si le HEAD vérifié n'a pas bougé, puis CI et Pages SUCCESS. La validation tactile réelle Android est séparée.
