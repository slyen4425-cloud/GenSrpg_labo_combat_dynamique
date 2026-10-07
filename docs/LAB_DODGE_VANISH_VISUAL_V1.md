# Dodge Vanish Visual V1

Date : 2026-10-07

## Base

Base exacte :
`e87a6acc4c5a2262cb466d2001d698aeb7e9bbd5`

Checkpoint de départ :
`checkpoint/lab-start-dodge-vanish-visual-v1-2026-10-07`

Branche :
`work/lab-dodge-vanish-visual-v1-2026-10-07`

Cette base contient déjà :
- Portable Project Assets Notes V1 ;
- Cendre Author Export V3 ;
- Capture Skill Export Fidelity V1 ;
- Dodge Active Window V1.

## Besoin utilisateur

Lors d'une Esquive proactive :
- la créature doit disparaître pendant la fenêtre d'esquive ;
- une courte transition de disparition/réapparition doit rendre l'action lisible ;
- la créature doit revenir exactement à son rendu normal ;
- l'ombre doit disparaître avec elle ;
- les règles gameplay de l'Esquive ne doivent pas changer.

Évolution prévue, volontairement séparée :
- sprite/FX personnel optionnel au moment de la disparition.

## Diagnostic

Le gameplay était déjà correctement possédé par le Combat Runtime :
- activation ;
- charges ;
- recharge ;
- durée `activeWindowMs` ;
- résolution `evaded`.

Le contrat `CombatVisualEvent` acceptait déjà `dodge`, mais l'Animation Core ne possédait aucun plan `dodge`.

Le bouton HUD appelait correctement `runtime.activateRechargeableReaction(...)`, mais aucun événement visuel n'était projeté vers le Visual Controller.

Cause :
- événement prévu au contrat ;
- aucune implémentation dans `planAnimation` ;
- aucun raccord du succès Runtime vers `visuals.playEventFor`.

## Architecture retenue

Chaîne unique :

`HUD Dodge -> Combat Runtime -> result.window.remainingMs -> visuals.playEventFor("dodge") -> CombatVisualEvent -> Animation Core -> DomActorRenderer`

Principes :
- le Runtime reste l'unique autorité temporelle gameplay ;
- aucune minuterie Dodge n'est ajoutée dans l'UI ;
- Animation Core possède uniquement la séquence visuelle ;
- DomActorRenderer existant applique l'opacité au corps et à l'ombre ;
- le renderer restaure son état de base à la fin.

## Implémentation

### Preset visuel

Nouveau fichier :
`src/core/profiles/dodge-visual-profile-v1.js`

Il centralise :
- ratio de transition ;
- durée maximale de transition ;
- léger scale de disparition ;
- brightness de transition.

Aucune valeur visuelle importante n'est dispersée dans l'UI.

### Animation Core

`src/core/animation/plan-animation.js` possède maintenant le cas générique `dodge`.

Séquence :
1. `dodge-vanish` ;
2. `dodge-hidden` ;
3. `dodge-return`.

Pour la fenêtre par défaut de 500 ms :
- entrée courte vers opacité 0 ;
- maintien invisible ;
- retour vers opacité 1 ;
- somme exacte des segments = durée fournie par le Runtime.

### Raccord UI

`src/ui/combat-2v2-test-ui.js` utilise la durée réellement renvoyée par :
`result.window.remainingMs`.

Cette valeur est projetée dans :
`visuals.playEventFor(localActorId, "dodge", { metadata: { durationMs } })`.

Aucun `setTimeout` Dodge, aucune deuxième fenêtre et aucun état gameplay parallèle n'ont été ajoutés.

## TDD

### RED

Commit :
`e6ff459c0ac1d8b4d81bde5e3f024919a7605b2f`

CI :
`37649766483`

Résultat :
- 1226 tests ;
- 1223 PASS ;
- 3 FAIL ciblés ;
- planner Dodge absent ;
- validation durée Dodge absente ;
- raccord visuel HUD absent.

### Implémentation Core

Commits :
- `a36ff7dac9fc648928294c56b9f39c849c7fe56b` — preset visuel ;
- `7243475ef478e90414228a71e60d5a9ef188cc4a` — Animation Core ;
- `7db0d0e4bf11cdcde8988e58209adc3c8d15c6ed` — projection HUD -> Visual Controller.

La première CI raccordée a aussi révélé une ancienne sentinelle qui déclarait explicitement `dodge` comme événement non supporté.

### Nettoyage des sentinelles

Commit :
`58100a8f528656e5a45568f6d26f630f8987e4c5`

La sentinelle du nouveau lot vérifie désormais la sémantique :
- durée issue de `result.window.remainingMs` ;
- cette durée est transmise à `playEventFor("dodge")` ;
- corps et ombre atteignent opacité 0 ;
- retour final opacité 1.

CI :
`37650448575`
- 1226 tests ;
- 1225 PASS ;
- 1 FAIL historique restant.

Commit :
`e99453deaf9e1680e8fecee2910ecbc8c1484878`

L'ancienne sentinelle “unsupported event” teste maintenant `recover`, qui reste réellement sans planner, au lieu de `dodge`.

### GREEN fonctionnel

CI :
`37650601948`

Résultat :
- 1226 / 1226 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

Ajouté :
- `src/core/profiles/dodge-visual-profile-v1.js`.

Modifiés :
- `src/core/animation/plan-animation.js` ;
- `src/ui/combat-2v2-test-ui.js`.

Tests :
- ajout `tests/unit/dodge-vanish-visual-v1.test.mjs` ;
- mise à jour `tests/unit/contracts-and-planner.test.mjs`.

## Domaines protégés / inchangés

Aucun changement de :
- Combat Runtime ;
- Combat Session ;
- Rechargeable Action ;
- Damage / Status ;
- collision / projectile ;
- SkillDefinition ;
- Roster ;
- audio ;
- Showcase ;
- données auteur Cendre / Fireball ;
- dépôt GenSrpG principal ;
- dépôt Exploration ;
- `main`.

## Suites déjà enregistrées

Le lot Portable Project Assets Notes V1 reste la référence pour :
- sons importés persistants et partageables ;
- catégories audio utilisées comme tags/tri, jamais comme restriction ;
- assets de créatures/sons transportés avec une game partagée ;
- import d'arènes utilisateur par assetId ;
- futur raccord environnement/zone World Builder -> arène(s).

Le prochain micro-lot visuel pourra ajouter un sprite/FX personnel optionnel pour Dodge via le système Asset/Presentation existant. Il ne devra ni créer un second moteur FX ni déplacer l'autorité gameplay hors du Runtime.

## Validation utilisateur

Dans la preview :
1. lancer un combat ;
2. appuyer sur Esquive ;
3. vérifier que la créature et son ombre disparaissent brièvement pendant la fenêtre active ;
4. vérifier la réapparition normale ;
5. vérifier qu'un impact dodgeable dans la fenêtre reste évité ;
6. vérifier qu'un impact après la fenêtre touche normalement ;
7. vérifier qu'aucune autre animation/combat n'est régressée.

Statut : GREEN technique après CI. Validation visuelle utilisateur requise.
