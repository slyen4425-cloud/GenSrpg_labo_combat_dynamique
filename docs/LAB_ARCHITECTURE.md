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

Domaine Asset Input.

Responsabilités :

- validation des fichiers médias entrants ;
- normalisation des sources utilisables ;
- création / révocation des Object URLs lorsque nécessaire ;
- futurs chargeurs image / audio ;
- aucune autorité gameplay.

Le module image existant reste la première implémentation.

La future bibliothèque d'assets est séparée en concepts :

- `AssetDefinition` : métadonnées d'un asset logique ;
- `AssetCatalog` : index / lookup / filtres ;
- `AssetPack` : groupe versionné d'assets ;
- `AssetBinding` : liaison présentation -> `assetId` ;
- `Storage Adapter` : persistance ou récupération des octets.

Référence détaillée :

`docs/LAB_ASSET_LIBRARY.md`

Le catalogue ne doit jamais devenir propriétaire du stockage ni des règles de combat.

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

### Géométrie projectile classique

Pour le projectile générique du laboratoire :

- la source visuelle utilise l'anchor transitoire du lanceur afin qu'un projectile parte bien de sa position réellement affichée ;
- la destination utilise le slot spatial stable de la cible, indépendamment d'une animation temporaire `aerial / teleport / hit` ;
- une esquive gameplay n'est jamais déduite de cette géométrie : elle reste décidée par Combat Rules ;
- un résultat `evaded` peut donc être visualisé naturellement par un projectile qui continue vers l'ancienne position stable pendant que la cible est ailleurs.

Une future famille de projectiles `tracking / homing / anti-air` pourra avoir une stratégie de ciblage distincte et data-driven. Elle ne doit pas être simulée en réutilisant silencieusement l'anchor animé comme comportement par défaut.

### Feedback local d'impact raté

Un résultat sémantique `evaded` peut produire un feedback FX local `miss`.

Chaîne :

`Combat Rules -> outcome evaded -> Combat Resolution Presenter -> FX intent miss -> FX Renderer`

Le feedback :

- est positionné sur l'anchor stable de la cible, c'est-à-dire l'endroit où l'impact aurait dû se produire ;
- affiche un libellé purement visuel (`RATÉ` dans la démo FR) ;
- n'influence jamais PV, dégâts, hit ou esquive ;
- disparaît après sa propre animation et ne crée aucun état gameplay.

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
  LAB_ASSET_LIBRARY.md
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
  library/              # cible future, non créée par le lot architecture
    core/

data/
  assets/               # cible future
    catalog/
    packs/
    bindings/

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


## 12. Combat Rules Lab

Le prototype de règles de combat est un domaine séparé du moteur visuel.

Chaîne autorisée :

```
Data Combat
   |
   v
Skill Contract
   |
   v
Combat Rules (distance / énergie / action resolver)
   |
   +----> résultat sémantique + chronologie
   |
   v
Demo UI / futur adaptateur
   |
   v
CombatVisualEvent
   |
   v
Animation Core -> Render Adapter
```

### Propriétaires

- contrat de compétence : `src/contracts/skill-definition.js` ;
- distance relative : `src/core/combat/distance.js` ;
- énergie et état de combat : `src/core/combat/combat-state.js` ;
- résultat d'une action : `src/core/combat/action-resolver.js` ;
- données configurables : `data/combat/`.

### Frontières

Le Combat Rules Lab :

- ne dépend pas du DOM ;
- ne dépend pas du Render Adapter ;
- ne dépend pas de GenSrpG ;
- ne modifie pas directement une animation ;
- produit des résultats et événements sémantiques.

L'Animation Core :

- ne calcule ni énergie, ni portée, ni immunité, ni blocage, ni renvoi, ni contre ;
- ne décide jamais si une compétence réussit.

La Demo UI :

- ne calcule ni coût, ni résultat ;
- demande une résolution au Combat Rules Lab ;
- affiche l'état retourné et déclenche uniquement la présentation visuelle correspondante.


## 12. Sous-système Combat Rules

Le prototype de combat temps réel est un client du moteur visuel, pas une extension de l'Animation Core.

```
Combat Data
    |
    v
Skill Contract
    |
    v
Combat Session ---- Distance / Energy State
    |
    v
Action Resolver
    |
    v
Semantic Resolution / Timeline
    |
    v
Combat Resolution Presenter
    |                    |
    v                    v
Animation Events       FX Plan
    |                    |
    v                    v
Actor Renderer         FX Renderer
```

### Propriétaires

`src/contracts/skill-definition.js`

- catégorie fonctionnelle ;
- forme d'action ;
- élément ;
- coût énergie ;
- préparation ;
- trajet ;
- récupération ;
- portée ;
- règles de blocage, renvoi, immunité et contre.

`src/core/combat/distance.js`

- bandes `short / medium / long` ;
- nombre de paliers ;
- coût de déplacement ;
- validation de portée.

`src/core/combat/combat-state.js`

- snapshot immutable de distance et énergie.

`src/core/combat/combat-session.js`

- propriétaire unique de l'état courant du test ;
- preview sans effet de bord ;
- commit des mouvements/actions ;
- régénération explicite ;
- reset.

`src/core/combat/action-resolver.js`

- décide uniquement du résultat sémantique ;
- produit une timeline relative ;
- ne rend rien.

`src/adapters/renderer/combat-resolution-presenter.js`

- transforme une résolution déjà décidée en intentions visuelles ;
- peut annuler une animation lors d'un contre ;
- ne recalcule aucune règle.

`src/core/fx/skill-fx-plan.js` + `src/adapters/renderer/dom-skill-fx.js`

- plan et rendu du projectile générique de test ;
- aucune autorité gameplay.

### Distance V1

La distance est relative et possède trois bandes :

`short <-> medium <-> long`

Un changement coûte :

`nombre de paliers × coût de déplacement de la créature`

La même réserve d'énergie alimente déplacement et capacités.

### Compétence V1

La classification est multidimensionnelle.

Exemple :

`Boule de feu = offensive + projectile + fire`

Une réaction peut donc cibler indépendamment :

- la forme : `reflect projectile` ;
- l'élément : `immune fire` ;
- la forme pour un contre : `counter contact`.

Aucune catégorie d'affichage ne remplace ces propriétés techniques.

### Temps V1

La résolution distingue :

- préparation ;
- release ;
- trajet ;
- impact ;
- récupération ;
- préparation d'une réaction.

Une réaction n'est applicable que si elle devient prête avant l'impact.

Un contre qui devient prêt avant le release peut annuler la compétence avant son départ.


### Runtime temps réel V2

Le sous-système Combat Rules distingue désormais l'état, le calcul et l'horloge :

```
Combat Data
    |
    v
Combat State <---- Combat Timing
    |
    v
Combat Session
    |
    v
Combat Runtime
    |
    +---- progression de charge
    +---- ticks énergie
    +---- fenêtre de réaction
    +---- release / résolution
    |
    v
Combat Resolution Presenter
    |
    +---- Animation
    +---- FX
```

Propriétaires :

- `combat-state.js` : snapshot énergie/temps/effets ;
- `combat-timing.js` : formules pures de tick et charge ;
- `combat-session.js` : mutation contrôlée du snapshot ;
- `combat-runtime.js` : horloge active et au plus une action en cours par acteur ;
- `dom-distance-presenter.js` : déplacement visuel d'un seul combattant ;
- Demo UI : affichage des progressions fournies par le runtime.

Un timer de match optionnel pourra être ajouté plus tard au Combat Runtime ou à un service de temps voisin, jamais dans les boutons UI.

#### Concurrence d'actions V9

Le temps réel n'est plus modélisé par une action globale unique.

`Combat Runtime` possède une collection d'actions indexées par `actorId` avec les invariants suivants :

- un acteur ne possède jamais plus d'une action active ;
- deux acteurs différents peuvent agir simultanément ;
- toutes les actions utilisent la même horloge Runtime ;
- chaque action conserve son propre `startedAtClockMs`, release, impact et réaction ;
- les releases / impacts arrivés dans un même tick sont triés par timestamp absolu puis ordre déterministe ;
- `Combat Session.completeAction()` reçoit toujours l'état courant au moment réel de l'impact, donc une seconde résolution ne réapplique jamais un ancien snapshot ;
- `hasActiveActionFor(actorId)` est l'autorité de disponibilité locale ;
- `hasActiveAction` signifie seulement « au moins une action existe » et ne doit plus verrouiller toutes les compétences du combat.

Règle initiale :

- un Hit normal n'interrompt pas automatiquement l'action concurrente ;
- un effet explicitement interruptif reste propriétaire de l'interruption ;
- un KO annule les actions encore actives du slot KO ainsi que les actions encore ciblées sur ce slot avant remplacement roster, afin qu'aucune action de l'ancien membre ne puisse affecter le nouveau.

La Demo UI peut donc autoriser une compétence joueur pendant une compétence adverse, mais elle ne crée ni horloge, ni résolution, ni ordre d'impact.



### PV / HP dans Combat State

Les PV appartiennent au domaine Combat Rules.

`Combat State` porte :

- `hp` ;
- `maxHp`.

La Demo UI ne stocke ni ne calcule les PV. Elle affiche uniquement le snapshot courant.

Les dégâts de base sont désormais appliqués par `Action Resolver` à partir de `skill.effect.damage` lorsqu'un résultat sémantique est `hit` ou `reflected`.

Règles :

- `hit` retire les dégâts à la cible ;
- `reflected` retire les dégâts à l'attaquant ;
- `blocked`, `immune` et `countered` ne retirent pas de PV dans le socle V2 ;
- `Combat Session.completeSkill()` commit le nouvel état HP lors d'une résolution live ;
- Presenter / Animation / FX / UI n'ont aucune autorité sur les dégâts.


### Impact, approche et esquive V3

Le moteur distingue désormais cinq moments :

`préparation -> release -> trajet/approche -> impact -> récupération`

Autorité :

- `Combat Runtime` détermine quand l'action atteint `impactAtMs` ;
- `Action Resolver` applique les dégâts uniquement lors de la résolution à l'impact ;
- Presenter / Animation / FX illustrent le résultat mais ne peuvent ni avancer ni retarder les dégâts.

Invariant permanent :

**aucun PV ne change au clic, pendant la charge ou au release tant qu'aucun impact n'a eu lieu.**

Exemples :

- projectile : le release lance le projectile, l'impact applique les dégâts ;
- contact au sol : l'impact correspond au moment où l'attaquant atteint la cible ;
- aérien : l'impact correspond à la fin de l'approche aérienne ;
- téléportation : l'impact correspond à la réapparition/connexion avec la cible.

La compétence sépare :

- `form` : nature de ce qui touche (`contact`, `projectile`, etc.) ;
- `approachMode` : manière d'atteindre la cible (`none`, `ground`, `aerial`, `teleport`).

Cette séparation permet à deux attaques `contact` d'avoir des fenêtres d'esquive très différentes sans inventer deux moteurs.

Les réactions peuvent déclarer :

- `evadeForms` ;
- `evadeApproaches`.

Une esquive n'est valide que si sa préparation est terminée au plus tard avant l'impact.

#### Esquive par mobilité concurrente V9

Une compétence offensive mobile peut elle-même créer une fenêtre d'esquive, sans passer par une réaction séparée.

Configuration dans `SkillDefinition` :

```js
evasion: {
  window: "travel",
  incomingForms: ["contact", "projectile"]
}
```

Responsabilités :

- SkillDefinition / data : déclare la fenêtre et les formes entrantes évitées ;
- Combat Runtime : fournit uniquement l'action concurrente de la cible et son temps relatif au timestamp exact de l'impact entrant ;
- Action Resolver : décide si cette configuration produit `evaded` ;
- Presenter : affiche le résultat déjà décidé ;
- Animation / FX : n'ont aucune autorité sur l'esquive.

Fenêtre `travel` :

- avant `releaseAtMs` : la cible reste touchable ;
- de `releaseAtMs` à `impactAtMs` inclus : la cible peut être hors cible pour les formes configurées ;
- après résolution de l'action mobile : cette esquive cesse ;
- le retour purement visuel après impact ne prolonge pas la règle gameplay.

Exemple :

`Griffe en approche -> cible lance Téléportation -> impact Griffe pendant travel Téléportation -> evaded -> 0 PV retiré`.



### Commandes tactiques et interruption V3

Objet, Rappel et Invocation ne sont pas des compétences.

Chaîne :

```
CombatCommand Data
    |
    v
CombatCommandDefinition
    |
    v
Command Resolver
    |
    v
Combat Session
    |
    v
Combat Runtime
    |
    +---- charge
    +---- release/completion
    +---- interruption avant release
```

Propriétaires :

- `combat-command-definition.js` : type, coût, préparation, récupération, interruptibilité et effet déclaratif ;
- `command-resolver.js` : validation énergie, construction de l'action et completion ;
- `combat-runtime.js` : progression temporelle et interruption de l'action active ;
- Demo UI : affichage et déclenchement seulement.

Types V3 :

- `item` ;
- `recall` ;
- `summon`.

Le prototype Item peut appliquer un soin à completion.

Rappel et Invocation produisent des événements sémantiques. Le vrai changement de roster/asset n'est pas simulé par l'UI de ce lot et devra appartenir à un futur propriétaire de roster.

#### Stun

Une compétence peut déclarer :

- `effect.interruptsPreparation = true` ;
- `effect.stunMs`.

Action Resolver émet `charge-interrupt` uniquement lorsque l'attaque aboutit à un `hit`, au même timestamp que l'impact.

Combat Runtime accepte cette intention d'interruption uniquement si :

- la cible est l'acteur de l'action active ;
- l'action est déclarée interruptible ;
- l'impact arrive avant `releaseAtMs`.

Le Stun ne décide jamais lui-même du rendu et ne peut pas annuler rétroactivement une action déjà release.


### Roster 2v2 V4

Le combat conserve deux slots engagés stables :

- `player` ;
- `opponent`.

Les espèces et membres d'équipe sont gérés séparément par `Roster Session`.

```
Roster Data
   |
   v
Roster Session
   |                       Combat Runtime
   |                             |
Recall/Summon command complete <-+
   |
   +---- save active member snapshot
   +---- replace Combat Session slot
   +---- update active/reserve member ids
   |
   v
Visual Controller.setCreatureFor(slot)
```

Invariants :

- chaque membre possède son propre snapshot PV/énergie ;
- le slot combat est remplaçable mais garde son identifiant `player/opponent` ;
- l'UI sélectionne un membre de réserve mais ne copie jamais elle-même ses stats ;
- le contrôleur visuel ne connaît ni énergie ni règles de roster ;
- l'adversaire peut posséder une réserve sans devenir contrôlable par le joueur.


### KO automatique et mouvements spéciaux V5

Le KO d'un combattant actif n'est pas un simple changement visuel.

Chaîne :

```
Action Resolver -> HP = 0
    |
    v
Combat Resolution Presenter
    |
    +---- Hit
    +---- KO
    |
    v
Roster Session.replaceKnockedOut()
    |
    +---- sauvegarde snapshot du membre KO
    +---- choisit un membre vivant de réserve
    +---- remplace le slot Combat Session
    |
    v
Visual Controller.setCreatureFor()
```

L'UI ne décide donc pas quel monstre remplace le KO. Elle ne fait que déclencher le raccord après la fin réelle de la présentation Hit -> KO.

#### Téléportation / attaque aérienne

Ces mouvements sont des événements visuels spécialisés :

- `teleport-attack` ;
- `aerial-attack`.

Ils ne modifient ni portée, ni dégâts, ni timestamp d'impact.

Le `Visual Controller` calcule uniquement l'écart géométrique DOM entre acteur et cible, puis transmet :

- `targetTranslateX` ;
- `targetTranslateY` ;
- `travelMs`.

L'Animation Core transforme ces données en séquence.

Téléportation :

`disparition origine -> apparition cible à impact -> disparition cible -> retour origine`

Aérien :

`montée -> disparition/reposition haute -> piqué jusqu'à impact -> retour origine`

Invariant :

**les dégâts restent appliqués par Combat Rules à `impactAtMs`, même si l'animation visuelle continue ensuite pour revenir à sa position stable.**


### Approche corps à corps et charge lisible V6

Les attaques de contact au sol utilisent désormais le même principe temporel que les projectiles et mouvements spéciaux.

`SkillDefinition.travelMs` est l'autorité unique sur le temps `release -> impact`.

Exemples :

- Griffe : `travelMs = 1500` ;
- une compétence Sprint peut utiliser `travelMs = 900` ;
- une variante très rapide peut utiliser `travelMs = 500`.

Chaîne :

`préparation -> release -> déplacement au sol pendant travelMs -> impact/dégâts -> retour visuel`

Le mouvement de retour n'a aucune influence sur les dégâts.

Le Visual Controller mesure la position réelle de la cible et l'Animation Core consomme cet offset avec le `travelMs` déjà décidé par Combat Rules.

#### Aérien

Le Visual Controller transmet également une translation verticale suffisante pour sortir complètement l'acteur du haut de l'arène.

L'Animation Core choisit la montée la plus haute entre :

- le preset morphologique ;
- la sortie réelle de l'arène calculée depuis la géométrie DOM.

L'impact reste aligné exactement sur `travelMs`.

#### KO

Une animation KO ne redémarre plus automatiquement un idle du combattant vaincu.

Le KO se termine par une disparition complète, puis le Roster Session prend la main pour remplacer le slot ou déclarer l'équipe vaincue.

La détection KO utilise directement l'événement sémantique `hit.hpAfter <= 0`.

#### Barre de charge

Le Combat Runtime expose :

- `actionName` ;
- `preparationMs` ;
- `remainingPreparationMs` ;
- `chargeProgress`.

L'UI ne possède aucune horloge locale. Elle affiche ces valeurs uniquement.
