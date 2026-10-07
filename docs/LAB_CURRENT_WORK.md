# Point de reprise courant — 2026-10-07

## Micro-lot actif

Burrow Visual V1

Branche :
`work/lab-burrow-visual-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-burrow-visual-v1-2026-10-07`

Base exacte :
`55dfafaee495c3e058363572b723a4f9ea7c8fc5`

Base GREEN précédente :
`checkpoint/lab-maraileron-author-export-v1-green-2026-10-07`

## Besoin utilisateur

Pour toute compétence dont `approachMode === "burrow"` :
1. la créature descend visuellement vers le sol ;
2. elle disparaît comme si elle passait sous terre ;
3. le déplacement vers la cible se fait invisible ;
4. elle réapparaît légèrement sous la position de la cible ;
5. elle remonte rapidement pour donner l'impression d'une attaque qui sort du sol ;
6. l'impact reste calé sur le timing Runtime existant ;
7. la créature revient ensuite proprement à sa position normale.

Le comportement doit être générique et piloté par `approachMode`, jamais par le nom d'une capacité ou créature.

## Cause reproduite

Le gameplay `burrow` existe déjà et possède correctement :
- présence `underground` pendant le trajet ;
- timing via le Combat Runtime ;
- résolution des impacts via l'horloge Runtime.

Mais la projection visuelle ne reconnaît pas `burrow` :
- `CombatResolutionPresenter.presentRelease` ne route que `ground / teleport / aerial` vers `playApproachFor` ;
- `Demo Visual Controller.playApproachFor` ne reconnaît également que ces trois modes ;
- le `CombatVisualEvent` ne possède pas encore `burrow-attack` ;
- Animation Core ne possède donc aucun plan visuel souterrain.

Résultat actuel : `burrow` retombe sur l'animation `attack` générique.

## Owners

- gameplay / présence / impact / timing : Combat Runtime existant — INCHANGÉ ;
- projection release : Combat Resolution Presenter ;
- géométrie de scène / événement visuel : Visual Controller existant ;
- contrat d'événement : CombatVisualEvent ;
- séquence : Animation Core ;
- paramètres visuels burrow : preset générique dédié ;
- rendu : DomActorRenderer existant.

## Contrainte critique

Le lot gameplay Burrow V1 interdit déjà de rendre le contact DOM autoritaire.

Donc :
- aucun `reportActionContact` pour burrow ;
- aucun watcher de collision pour burrow ;
- aucune seconde horloge ;
- aucun `setTimeout` gameplay ;
- la somme des segments de descente/cache/émergence doit être exactement `action.travelMs` fourni par le Runtime.

## Fichiers autorisés

- `src/contracts/combat-visual-event.js`
- `src/core/profiles/burrow-visual-profile-v1.js`
- `src/core/animation/plan-animation.js`
- `src/adapters/renderer/combat-resolution-presenter.js`
- `src/ui/demo-app.js`
- tests dédiés
- documentation du lot

## Domaines protégés

Ne pas modifier :
- Combat Runtime / Session ;
- Combat Timing ;
- présence gameplay ;
- dégâts/status ;
- collision owner ;
- projectile ;
- SkillDefinition ;
- Roster ;
- Dodge ;
- Tempête / zones persistantes ;
- données auteur Maraileron / Morsure ;
- audio ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD attendu

RED :
- `burrow-attack` non reconnu par CombatVisualEvent ;
- aucun plan Animation Core burrow ;
- Presenter ne route pas burrow vers `playApproachFor` ;
- Visual Controller retombe sur attack.

GREEN :
- événement générique `burrow-attack` ;
- descente vers le sol + disparition ;
- repositionnement invisible vers la cible ;
- émergence rapide depuis sous la cible ;
- somme descente/cache/émergence = `travelMs` ;
- retour home après impact ;
- aucune collision/contact DOM burrow ;
- vraie chaîne Presenter -> Visual Controller -> CombatVisualEvent -> Animation Core -> Renderer ;
- CI complète verte.

## Critère de fin

Checkpoint GREEN + preview dédiée + tests smartphone utilisateur.
