# Laboratoire Combat Dynamique — Architecture cible

## 1. Principe

Le laboratoire doit produire un moteur visuel réutilisable qui reçoit des événements génériques et anime un ou plusieurs acteurs.

Il ne connaît pas les règles métier du jeu qui l'appelle.

```
Game / Demo
    |
    v
Event Contract
    |
    v
Animation Planner ---- Creature Profile
    |
    +----> FX Planner
    |
    v
Animation Runtime
    |
    v
Render Adapter
    |
    v
DOM / Canvas / futur renderer
```

## 2. Contrats

### CombatVisualEvent

Entrée conceptuelle :

```js
{
  type: "attack",
  actorId: "creature-a",
  targetId: "creature-b",
  variant: "physical",
  intensity: 1,
  metadata: {}
}
```

Le champ `metadata` ne doit pas devenir une porte dérobée permettant au Core de dépendre de GenSrpG.

### VisualActor

Un acteur visuel expose au minimum :

- id ;
- asset ;
- position logique de scène ;
- orientation ;
- échelle ;
- profil ;
- état visuel.

### AnimationPlan

Le planner produit une séquence déclarative de segments.

Exemples de propriétés :

- durée ;
- easing ;
- translateX / translateY ;
- scaleX / scaleY ;
- rotate ;
- opacity ;
- hooks FX ;
- règles de restauration.

Le plan est indépendant du DOM.

## 3. Propriétaires

### `src/contracts/`

Schémas, constantes et validation des entrées/sorties.

Aucune logique de rendu.

### `src/core/animation/`

Planification et exécution des séquences.

Aucune dépendance directe à un écran.

### `src/core/fx/`

Effets visuels et caméra.

Doit pouvoir être désactivé.

### `src/core/profiles/`

Presets de morphologie et paramètres.

Pas de règles métier de combat.

### `src/adapters/renderer/`

Traduit les états et plans vers une technologie d'affichage.

Premier adaptateur probable : DOM/CSS transforms.

Un futur Canvas/WebGL ne doit pas nécessiter de réécrire le Core.

### `src/ui/`

Laboratoire interactif.

Aucune autorité sur le moteur.

### `src/assets/`

Validation et normalisation des assets entrants.

## 4. État

Le Core doit distinguer :

- état de base : position, orientation, scale ;
- état d'animation transitoire ;
- état final attendu.

Une animation annulée doit restaurer un état cohérent.

Deux animations ne doivent pas prendre simultanément autorité sur le même canal sans stratégie explicite.

## 5. Canaux d'animation

Canaux envisagés :

- motion ;
- scale ;
- rotation ;
- opacity ;
- filter ;
- camera ;
- fx.

La concurrence entre canaux doit être déterministe.

## 6. Temps

Le runtime doit utiliser une horloge injectée ou abstraite autant que possible afin de rendre les tests déterministes.

Dans le navigateur, l'implémentation utilisera normalement `requestAnimationFrame`.

Pas de boucle permanente lorsque rien ne s'anime.

## 7. Profils

Un profil ne contient que des données et éventuellement des fonctions pures de génération.

Exemple conceptuel :

```js
{
  id: "quadruped",
  idle: {
    bobY: 3,
    scaleY: 0.02,
    durationMs: 1500
  },
  attack: {
    lunge: 0.22,
    squash: 0.06,
    durationMs: 420
  }
}
```

Les valeurs seront ajustées par tests visuels, pas figées aujourd'hui comme spécification définitive.

## 8. FX

Le FX Core reçoit des intentions telles que :

- impact ;
- projectile ;
- flash ;
- shake ;
- dust ;
- glow.

Il ne décide pas si une attaque touche ou combien de dégâts elle inflige.

## 9. Frontière future GenSrpG

Raccord potentiel seulement :

```
Capture runtime
   |
   v
GenSrpG adapter
   |
   v
CombatVisualEvent
   |
   v
Dynamic Combat Core
```

L'adaptateur appartient à l'intégration, pas au laboratoire Core.

## 10. Structure cible

```
docs/
  LAB_CHARTE.md
  LAB_ROADMAP.md
  LAB_ARCHITECTURE.md
  LAB_CURRENT_WORK.md
  LAB_CHECKPOINT_POLICY.md

src/
  contracts/
  core/
    animation/
    fx/
    profiles/
  adapters/
    renderer/
  ui/
  assets/

assets/
  test/
    creatures/
    arenas/
    effects/

tests/
  unit/
  integration/
  browser/

examples/
```

## 11. Choix techniques différés

Le dépôt ne choisit pas encore un framework lourd.

Le premier prototype doit privilégier :

- JavaScript modulaire standard ;
- APIs web natives ;
- dépendances minimales ;
- exécution locale simple ;
- testabilité.

Un framework ou moteur externe ne sera ajouté que s'il résout un besoin démontré.
