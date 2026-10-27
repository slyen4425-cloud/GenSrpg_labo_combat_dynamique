# Burrow Visual V1

Date : 2026-10-07

## Base

Checkpoint de départ :
`checkpoint/lab-start-burrow-visual-v1-2026-10-07`

Base exacte :
`55dfafaee495c3e058363572b723a4f9ea7c8fc5`

Branche :
`work/lab-burrow-visual-v1-2026-10-07`

Cette base contient déjà le GREEN technique :
`Maraileron Author Export V1`.

## Besoin utilisateur

Une compétence `approachMode: "burrow"` doit être lisible comme une attaque souterraine :
1. descente du modèle vers le sol ;
2. disparition ;
3. trajet invisible sous terre ;
4. réapparition légèrement sous la cible ;
5. remontée rapide vers la cible pour donner l'impression d'une attaque sortant du sol ;
6. retour propre à l'état normal.

Le rendu est générique et ne connaît ni `Morsure de marée` ni `Maraileron` par leur nom.

## Cause réelle

Le gameplay Burrow V1 était déjà présent et techniquement GREEN :
- le Combat Runtime possède le timing ;
- la présence devient `underground` pendant le trajet ;
- l'impact est résolu par l'horloge Runtime ;
- un contact DOM ne doit pas piloter cet impact.

Mais la présentation excluait explicitement burrow :
- `CombatResolutionPresenter.presentRelease` ne routait que `ground / teleport / aerial` ;
- `Visual Controller.playApproachFor` ne reconnaissait que ces trois modes ;
- `CombatVisualEvent` n'avait pas `burrow-attack` ;
- Animation Core n'avait aucun plan burrow.

Donc `burrow` retombait sur l'événement `attack` générique.

## Architecture retenue

Chaîne :

`Combat Runtime action.travelMs`
→ `CombatResolutionPresenter`
→ `Visual Controller.playApproachFor("burrow")`
→ `CombatVisualEvent("burrow-attack")`
→ `Animation Core`
→ `DomActorRenderer`

Le Runtime reste l'autorité gameplay et temporelle.

### Contact / collision

Pour `burrow` :
- `onContact` est forcé à `null` dans le Presenter ;
- le Visual Controller possède aussi une garde défensive empêchant `watchVisibleModelContact` pour burrow ;
- aucun `reportActionContact` n'est ajouté ;
- aucun timer gameplay n'est ajouté.

L'impact reste donc calé sur le Runtime existant.

## Preset visuel générique

Nouveau fichier :
`src/core/profiles/burrow-visual-profile-v1.js`

Le preset centralise :
- ratio de descente ;
- ratio d'émergence ;
- profondeur visuelle de descente ;
- offset de départ sous la cible ;
- scales ;
- durée de retour.

Pour Morsure de marée (`travelMs = 650`) :
- descente ;
- maintien invisible ;
- émergence ;
- la somme de ces trois phases vaut exactement 650 ms.

Les petits timings sont également partitionnés sans créer de durée négative.

## Animation Core

Nouvel événement :
`burrow-attack`.

Séquence :
1. `burrow-dive` — déplacement vers le bas et disparition ;
2. `burrow-hidden` — repositionnement invisible sous la cible ;
3. `burrow-emerge-impact` — remontée rapide depuis le bas jusqu'à la cible ;
4. `burrow-home` — retour au rendu de base.

Pendant les phases cachées, l'opacité du plan canonique masque le modèle et son rendu de sol via le renderer existant.

## TDD

### RED

Commit :
`b850914970ccb8da3b69ba6201f967af2eedfa28`

CI :
`37664557618`

Résultat :
- 1234 tests ;
- 1230 PASS ;
- 4 FAIL ciblés :
  - contrat burrow-attack absent ;
  - plan Animation Core absent ;
  - routage Morsure de marée absent ;
  - Visual Controller burrow absent.

### Première implémentation

Le vrai comportement a été ajouté aux owners prévus.

Une ancienne sentinelle UI imposait littéralement la liste
`["ground", "teleport", "aerial"]`.
Elle est devenue le seul FAIL restant après l'implémentation.

Cette sentinelle a été étendue à `burrow` ; aucune logique runtime n'a été modifiée pour la satisfaire.

### GREEN fonctionnel

Commit :
`507ca13631372fe4289355f8cbeb0c7c6095ad89`

CI :
`37665033128`

Résultat :
- 1234 / 1234 PASS ;
- 0 FAIL ;
- structure / frontières / indépendance : OK.

## Fichiers fonctionnels

Ajouté :
- `src/core/profiles/burrow-visual-profile-v1.js`
- `tests/unit/burrow-visual-v1.test.mjs`

Modifiés :
- `src/contracts/combat-visual-event.js`
- `src/core/animation/plan-animation.js`
- `src/adapters/renderer/combat-resolution-presenter.js`
- `src/ui/demo-app.js`
- `tests/unit/demo-ui-boundary.test.mjs`

## Domaines protégés / inchangés

Aucun changement de :
- Combat Runtime ;
- Combat Session ;
- Combat Timing ;
- présence gameplay ;
- Damage / Status ;
- owner collision ;
- projectiles ;
- SkillDefinition ;
- Roster ;
- Dodge ;
- zones persistantes ;
- audio ;
- données auteur Maraileron / Morsure de marée ;
- main ;
- Zombicide-40k ;
- dépôt Exploration.

## Validation utilisateur

À vérifier sur smartphone dans la preview :
1. sélectionner Maraileron ;
2. lancer un combat avec Morsure de marée ;
3. vérifier la descente vers le sol ;
4. vérifier la disparition du modèle pendant le trajet ;
5. vérifier la réapparition légèrement sous l'adversaire ;
6. vérifier la remontée rapide jusqu'à la cible ;
7. vérifier que l'impact n'attend pas une collision visuelle ;
8. vérifier le retour normal après l'attaque ;
9. vérifier ground / teleport / aerial / Dodge / projectiles / zones / rappel.

Statut : GREEN technique. GREEN utilisateur en attente de validation Sylvain.
