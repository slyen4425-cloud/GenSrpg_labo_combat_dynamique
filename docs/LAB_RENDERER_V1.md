# Renderer DOM/CSS V1 — Contrat et frontières

## Statut

Implémentation V1 du renderer du laboratoire.

Ce renderer est un adaptateur de présentation. Il ne possède aucune règle de combat.

## Chemin réel

```
CombatVisualEvent
  -> CreatureProfile
  -> planAnimation()
  -> AnimationPlan
  -> animationPlanToDomTimeline()
  -> createDomActorRenderer()
  -> Web Animations API
```

## 1. `dom-keyframes.js`

Responsabilité unique :

- convertir un `AnimationPlan` déclaratif en timeline compatible Web Animations API ;
- composer les transformations transitoires avec la position et l'échelle de base du `VisualActor`.

Il ne :

- sélectionne aucun élément DOM ;
- ne décide aucun timing de gameplay ;
- ne connaît pas Maraileron/Braisombre ;
- ne dépend pas de l'UI.

## 2. `dom-actor-renderer.js`

Responsabilité unique :

- posséder une animation DOM active pour un acteur ;
- annuler l'ancienne animation avant d'en démarrer une nouvelle ;
- restaurer l'état visuel de base ;
- consommer proprement le rejet `AbortError` de `Animation.finished` lors d'un `cancel()` ;
- libérer son état lors de `dispose()`.

Invariant : un renderer d'acteur = un propriétaire d'animation active.

## 3. Asset Input

`src/assets/image-source-manager.js` possède le cycle de vie des Object URLs :

- validation MIME ;
- création d'URL ;
- révocation de l'ancienne URL ;
- nettoyage à la destruction.

L'UI ne doit pas devenir propriétaire de ce cycle de vie.

Formats V1 :

- PNG ;
- WebP ;
- JPEG.

## 4. Demo UI

`src/ui/demo-app.js` orchestre uniquement :

- sélection de la créature ciblée ;
- intensité ;
- émission de l'événement ;
- appel du planner ;
- transmission du plan au renderer ;
- chargement d'image via Asset Input.

Elle ne contient :

- aucun `durationMs` d'animation ;
- aucun `translateX` ;
- aucune rotation de combat ;
- aucun appel direct à `.animate()`.

## 5. Démo navigateur

Entrée :

`examples/dom-demo/index.html`

Configuration initiale :

- joueur : Maraileron / `serpentine` / vue `player` ;
- adversaire : Braisombre / `drake` / vue `opponent`.

Actions V1 :

- Idle ;
- Attaque ;
- Hit ;
- KO ;
- Stop.

L'utilisateur charge les PNG/WebP depuis son appareil dans cette première prévisualisation.

## 6. Annulation

Démarrer une nouvelle animation sur un acteur :

1. annule l'ancienne ;
2. restaure l'état de base ;
3. démarre la nouvelle ;
4. garde un token de séquence pour empêcher une ancienne promesse de reprendre l'autorité.

Cette règle évite deux animations concurrentes sur le même acteur.

## 7. État après animation

Les plans V1 non bouclés restaurent l'état de base à leur fin.

L'`idle` boucle jusqu'à annulation.

Le comportement KO persistant n'est pas encore un contrat V1 ; il sera traité explicitement plus tard si retenu.

## 8. Tests

Sentinelles actuelles :

- vrai chemin event -> profile -> plan -> DOM timeline ;
- orientation ;
- restauration après fin ;
- annulation de l'ancien propriétaire ;
- nettoyage à `dispose()` ;
- absence de dépendance renderer -> UI ;
- cycle de vie Object URL ;
- séparation UI / planner / renderer ;
- entrée mobile-first.

## 9. Validation restante avant GREEN final

Le chantier ne doit pas être déclaré GREEN final avant :

- test manuel de la démo sur smartphone ;
- confirmation que les contrôles sont utilisables ;
- confirmation visuelle de Idle / Attaque / Hit / KO ;
- vérification qu'un changement d'animation ne laisse pas d'état résiduel.

Les assets découpés Maraileron/Braisombre restent un lot séparé et ne conditionnent pas l'architecture du renderer.
