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

### Contexte visuel d'arène / biome

L'arène visible est une donnée de présentation distincte des règles de combat.

Principe cible :

```
Zone / lieu du jeu
      |
      v
Arena Context
(biome / thème)
      |
      v
Arena Definition
      |
      +---- background asset
      +---- overlays / foreground futurs
      +---- ambience future
      |
      v
Render Adapter
```

Exemples de contextes futurs :

- forêt ;
- caverne ;
- neige ;
- désert ;
- ville ;
- science-fiction.

Règles d'architecture :

- Combat Rules ne connaît jamais le nom ni l'image de l'arène ;
- la zone ou le monde appelant fournit un identifiant de contexte visuel / biome ;
- un binding de présentation résout ce contexte vers une `ArenaDefinition` ;
- les images d'arène utilisent la bibliothèque d'assets, typiquement `assetType: background` ;
- une arène absente utilise un fallback visuel sûr et ne bloque jamais le combat ;
- changer d'arène ne modifie ni dégâts, portée, vitesse, énergie ou résultat d'une capacité ;
- si des effets de terrain gameplay sont ajoutés un jour, ils auront leur propre donnée Combat Rules et ne seront jamais déduits du décor affiché.

Le premier lot d'arène devra commencer par un fond statique data-driven avant d'ajouter overlays, météo ou animations.

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

### Perspective caméra des approches spatiales

La profondeur visuelle appartient à Animation Core et aux Creature Profiles, pas aux règles de combat.

Pour toute approche qui déplace réellement un combattant vers la position de l'autre (`ground`, `aerial`, `teleport`) :

- la géométrie réelle fournit `targetTranslateY` et `arenaHeight` ;
- un déplacement vers le bas de l'arène représente un rapprochement de la caméra joueur et augmente l'échelle ;
- un déplacement vers le haut / la profondeur représente un éloignement de la caméra joueur et réduit l'échelle ;
- le calcul est partagé entre les approches, sans condition codée sur `player` ou `opponent` ;
- les bornes et l'intensité proviennent d'un preset unique `specialMoves.perspective` du profil ;
- le retour à la position stable restaure toujours l'échelle de base ;
- cette perspective n'influence jamais portée, dégâts, esquive ou timestamp d'impact.

Invariant de lecture :

`joueur -> adversaire = rétrécissement`

`adversaire -> joueur = grossissement`

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
- sa trajectoire nominale reste dirigée vers le slot spatial stable de la cible : il ne devient pas silencieusement un projectile `tracking / homing` ;
- pendant que le projectile FX est réellement actif, le renderer peut toutefois vérifier un **contact visuel** avec l'anchor mobile de la cible ;
- si le centre visuel du projectile rencontre effectivement la créature en déplacement, le projectile FX est arrêté/nettoyé afin qu'il ne traverse pas visuellement son corps ;
- cette détection DOM n'altère jamais les PV, le résultat `hit / evaded`, ni le timestamp sémantique : elle appartient uniquement à la présentation ;
- un impact sémantique `hit` est rendu à la position visuelle courante de la cible ;
- un résultat `evaded` conserve son feedback sur le point stable où l'impact aurait dû se produire ;
- le suivi de contact n'utilise pas de boucle permanente : il existe seulement pendant la durée de vie d'un projectile FX.

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

## 8.1 Format de combat configurable — futur 1v1 / 2v2 coop

Le laboratoire ne doit pas figer tous les combats en 2v2. Le format reste une donnée du combat / scénario.

Formats visés :

- `1v1` classique : un combattant actif par camp ;
- `2v2 coop` : deux combattants actifs par camp, chacun avec son propre contrôleur ;
- le second contrôleur allié peut être un autre humain ou une IA ;
- un joueur humain ne contrôle jamais directement les capacités de la créature alliée ;
- aucun booléen global `is2v2` ne doit être dispersé dans l'UI.

Concept cible :

```json
{
  "id": "coop-2v2",
  "activeSlotsByTeam": {
    "player": 2,
    "opponent": 2
  },
  "controllers": [
    { "actorId": "player-a", "controllerId": "human-local" },
    { "actorId": "player-b", "controllerId": "human-remote-or-ai" },
    { "actorId": "opponent-a", "controllerId": "ai-a" },
    { "actorId": "opponent-b", "controllerId": "ai-b" }
  ]
}
```

Un duel classique utilise le même principe avec un seul acteur actif par équipe.

Architecture recommandée :

```
BattleFormatDefinition
        |
        +---- active slots par équipe
        +---- controllerId par actorId
        |
        v
Roster Session
  membres actifs + état persistant
        |
        v
Combat Session / Runtime
  actorId / targetId dynamiques
        |
        v
Local Player View
  barre de capacités filtrée par controllerId
        |
        v
Target Selection
  cible valide selon la compétence
```

### Lisibilité de l'interface 2v2

Chaque joueur voit dans son écran :

- sa propre créature avec son HUD complet et sa barre de capacités ;
- la créature alliée avec un HUD plus léger : nom, PV, état / action en cours ;
- les adversaires avec les informations nécessaires au combat, sans dupliquer les capacités ;
- une seule barre de capacités : **celle de la créature contrôlée localement**.

Cette règle évite de doubler l'interface des capacités sur smartphone.

La créature alliée ne doit pas apparaître comme une deuxième créature contrôlable localement, même si elle est pilotée par une IA. Son `controllerId` reste distinct.

### Sélection de cible par clic

Toute créature visible peut devenir une cible potentielle par interaction directe sur son modèle ou sa zone de statut.

La validité de la cible reste décidée par la définition de compétence, jamais par l'UI.

Exemples de relations de cible futures :

- `enemy` : attaque ou malus sur adversaire ;
- `ally` : soin, protection, renforcement ;
- `self` : compétence personnelle ;
- `any` : cas spéciaux explicitement autorisés.

Chaîne cible :

```
clic acteur visible
      |
      v
Target Selection UI
      |
      v
SkillDefinition / Target Rule
      |
      +---- valide -> targetId sélectionné
      |
      +---- invalide -> feedback visuel, aucune résolution
```

L'UI doit distinguer clairement :

- acteur local contrôlé ;
- allié ;
- adversaire ;
- cible actuellement sélectionnée ;
- cible invalide pour la capacité choisie.

Le soin / bouclier / buff d'un allié devient alors naturel : le joueur choisit une capacité compatible puis clique l'allié, ou sélectionne d'abord l'allié selon le flux UX retenu.

### Invariants d'architecture

- ne pas dupliquer les contrôleurs `player/opponent` pour fabriquer artificiellement quatre combattants ;
- les identifiants d'acteurs et de cibles restent génériques ;
- le nombre d'actifs appartient à `BattleFormatDefinition` / scénario ;
- le roster doit conserver PV / énergie / KO de chaque membre indépendamment ;
- Combat Runtime reste indexé par `actorId`, compatible avec plusieurs actions concurrentes ;
- les capacités affichées dépendent du `controllerId` local, pas du nombre de créatures visibles ;
- le format du combat n'est jamais déduit du nombre d'icônes affichées ;
- un vrai chantier 2v2 devra généraliser explicitement les zones qui supposent encore un seul actif par équipe.

### Prototype laboratoire 2v2 — état 2026-09-27

Le laboratoire possède désormais un premier client 2v2 dédié qui exerce le même Combat Session / Runtime / Animation Core que le 1v1.

Éléments implémentés :

- `BattleFormatDefinition` décrit quatre acteurs, leurs équipes et leur `controllerId` ;
- le contrôleur visuel découvre les slots déclarés dans le DOM au lieu de figer deux acteurs ;
- le presenter reçoit la cible explicite afin qu'une attaque d'approche se dirige vers le bon acteur ;
- un contrôleur IA générique peut piloter un acteur sans dépendre du DOM ;
- la vue locale n'affiche qu'une seule barre de capacités pour `localActorId` ;
- l'allié et les adversaires n'exposent que leur état compact (nom, PV, action) ;
- la cible se choisit par interaction directe avec la créature ou sa carte ;
- `SkillDefinition.targetRelations` déclare les relations autorisées ; la valeur par défaut est `enemy` ;
- le helper Combat `targeting.js` distingue `self / ally / enemy` avant le démarrage d'une action depuis cette UI.

Limites assumées de cette première preview :

- le second allié est piloté par IA ; le transport réseau / second client humain n'est pas encore raccordé ;
- les quatre compétences de test actuelles sont offensives, donc une cible alliée peut être sélectionnée mais aucune de ces compétences ne peut être lancée dessus ;
- soin / protection / buff allié seront testés ultérieurement avec des compétences déclarant `targetRelations: ["ally"]` ou `["ally", "self"]` ;
- le système de réserve / rappel 1v1 n'est pas dupliqué dans la page 2v2 de laboratoire.

### Futur raccord éditeur — rythme, timing visuel et cooldown

Les retours de test mobile montrent que le rythme global peut devenir trop élevé, notamment avec certaines attaques d'approche aérien / téléportation et l'absence actuelle de cooldown entre deux utilisations d'une même capacité.

Ces réglages devront être **éditables par compétence / profil** lors du raccord GenSrpG, sans être codés en dur dans l'UI.

Séparation attendue :

- **timing gameplay** : préparation, temps de trajet, récupération, cooldown ;
- **timing visuel** : vitesse des segments d'animation / approche / retour ;
- **politique IA** : temps minimal avant nouvelle décision ;
- **UI** : affiche l'état de cooldown mais ne décide jamais de sa disponibilité.

Concept cible de compétence :

```json
{
  "preparationMs": 900,
  "travelMs": 650,
  "recoveryMs": 450,
  "cooldownMs": 2800,
  "visualTiming": {
    "approachScale": 1.15,
    "returnScale": 1.1
  }
}
```

Invariants :

- un cooldown futur appartient au Core / SkillDefinition, pas au CSS ni à un bouton désactivé localement ;
- la disponibilité d'une capacité doit être calculée depuis l'état de combat autoritaire ;
- ralentir une animation visuelle ne doit pas modifier implicitement les dégâts ;
- si timing visuel et timing gameplay doivent être synchronisés, ce lien doit être explicite et testable ;
- le laboratoire ne doit pas introduire maintenant un cooldown de fortune uniquement pour ralentir la démo.

---



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


#### Clash de projectiles concurrents V9

Le clash de deux projectiles est une règle Combat Rules, jamais une déduction du DOM.

Configuration dans `SkillDefinition` :

```js
projectileClash: {
  mode: "none" | "mutual_cancel",
  group: "identifiant-propre",
  interactsWith: ["groupes-compatibles"]
}
```

Règles du premier jalon :

- `none` est le comportement par défaut ;
- `mutual_cancel` nécessite `form = "projectile"` et un `group` non vide ;
- `interactsWith` est data-driven ; lorsqu'il est omis sur un `mutual_cancel`, il vaut par défaut le propre `group` afin de préserver le comportement historique ;
- deux projectiles ne peuvent s'annuler que si les deux déclarent `mutual_cancel`, acceptent réciproquement le groupe adverse et se ciblent mutuellement ;
- Combat Rules calcule le temps de rencontre à partir des vrais timestamps de release et des vrais `travelMs` ;
- Combat Runtime insère ce clash dans la même horloge que releases et impacts ;
- le clash produit deux résolutions sémantiques `clashed` sans événement `hit` ni dégâts et transporte le `progress` de rencontre ;
- Presenter / FX arrêtent uniquement les projectiles déjà déclarés `clashed` ;
- un seul `clash-impact` de présentation est produit pour la paire ; sa position est interpolée depuis le `progress` sémantique et les ancres visuelles existantes ;
- les résultats défensifs `blocked`, `reflected` et `immune` peuvent produire un impact de présentation au point de contact sans changer le résultat gameplay ;
- la géométrie DOM ne décide jamais si un clash gameplay existe.

Un futur mode `pierce`, priorité de projectile ou autre comportement devra être ajouté au contrat de données avant toute implémentation moteur.



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


## 13. Capture Stats / Progression Architecture V1

Ce jalon introduit les propriétaires de données génériques nécessaires à la refonte Monster Capture sans modifier le Combat Runtime ni le Human Editor.

### Registre de statistiques

Propriétaire : `src/contracts/capture-stat-registry-v1.js`.

Le registre définit des statistiques extensibles par données. Une définition peut porter :

- `id` ;
- `label` ;
- `damageChannel` optionnel ;
- `resistanceChannel` optionnel ;
- `damagePerPoint` ;
- `resistancePerPoint`.

Aucun identifiant de statistique personnalisée n'est codé en dur dans le contrat. Les joueurs pourront donc ajouter ultérieurement leurs propres statistiques par un raccord d'édition dédié.

Le registre standard Monster Capture est : `data/capture/monster-capture-stat-registry.v1.json`.

Invariant : **HP n'appartient pas au registre extensible**. Les PV restent propriété de la créature et du Combat State. Le registre ne doit jamais devenir une seconde source de vérité des PV.

### Valeurs de statistiques d'une créature

Propriétaire : `src/contracts/capture-creature-stat-values-v1.js`.

Ce contrat associe un `creatureId` à des valeurs numériques dont les IDs doivent exister dans le registre sélectionné. La définition d'une statistique et sa valeur chez une créature restent donc séparées.

L'adaptateur de compatibilité historique est : `src/adapters/input/capture/monster-capture-stat-values-v1.js`.

Il projette explicitement les anciennes données vers les IDs standard sans modifier le catalogue historique et sans déduire une résistance depuis un type ou une autre donnée implicite.

### Progression des slots actifs

Propriétaire : `src/contracts/capture-progression-rules-v1.js`.

La politique générale possède :

- `maxActiveSkills` ;
- `slotUnlockSchedule[{ level, slots }]`.

Le preset Monster Capture est : `data/capture/monster-capture-progression-rules.v1.json`.

Cette politique répond uniquement à « combien de slots actifs sont disponibles à ce niveau ? ».

Le niveau requis d'une capacité reste propriété de `CaptureSkillEditorDraftV1.requiredLevel`. Ces deux notions ne doivent jamais être fusionnées.

### Évolution

Le mécanisme existant `capture.evolution { condition, level, targetId }` reste l'unique propriétaire du lien d'évolution d'une créature. Aucun second contrat d'évolution n'est créé dans ce jalon.

### Frontières du jalon

Ce jalon ne branche pas encore les coefficients de statistiques sur la résolution des dégâts/résistances. Il ne modifie ni `Action Resolver`, ni `Combat Runtime`, ni Animation/FX/Renderer.

Le Human Editor n'est pas encore raccordé à ces nouveaux propriétaires. Ce raccord appartient à un micro-lot UI séparé avec RED dédié et validation smartphone.


### Raccord Human Editor — Stats / Progression / Évolution V1

Le Human Editor consomme maintenant les propriétaires validés sans devenir propriétaire des règles métier :

- le registre de stats est chargé depuis `monster-capture-stat-registry.v1.json`, normalisé par `CaptureStatRegistryV1`, puis édité uniquement comme draft de session ;
- les valeurs d'une créature passent par `CaptureCreatureStatValuesV1` et sont conservées dans le record d'édition de session, séparément de `CaptureCreatureEditorDraftV3.sourceStats` ;
- `sourceStats` reste uniquement une compatibilité historique invisible dans l'éditeur courant ;
- la politique de slots est chargée depuis `monster-capture-progression-rules.v1.json` et calculée par `CaptureProgressionRulesV1` ;
- le Human Editor conserve les quatre slots standards de `CaptureActiveSkillLoadoutV1` comme **plan de progression configurable à l'avance** et un cinquième `slot-ultimate` séparé ; aucune affectation future n'est supprimée ou refusée du simple fait du niveau courant ;
- `CaptureSkillEditorDraftV1.requiredLevel` reste le propriétaire du niveau de déverrouillage d'une capacité et `CaptureProgressionRulesV1` reste le propriétaire du nombre de slots actifs ;
- le snapshot Combat ne consomme pas directement le plan complet : `capture-planned-loadout-to-combat-v1.js` projette une copie temporaire en neutralisant uniquement les slots non débloqués et les capacités dont `requiredLevel` dépasse le niveau courant ;
- la Database et les transferts créature continuent de transporter le loadout complet : aucune capacité future n'est perdue lors d'un export/import de données ;
- l'évolution éditée écrit directement dans l'unique champ `capture.evolution { condition, level, targetId }`, avec cible par ID explicite ;
- les anciennes résistances pourcentage restent visibles uniquement sous une zone de compatibilité clairement séparée des nouvelles stats à canaux ;
- aucune persistance navigateur n'est introduite : le registre, la progression et les valeurs restent des drafts de session en attente du futur lot Export/Import.

Le raccord des coefficients de stats aux dégâts/résistances du Combat Runtime reste hors scope et devra avoir son propre RED avant toute modification de l'Action Resolver.


## 14. Capture Stat Effects V1

Les effets numériques d'une statistique utilisent désormais des unités explicites en pourcentage.

Propriétaire de la définition : `CaptureStatRegistryV1`.

Champs actifs :

- `damagePctPerPoint` : bonus de dégâts en pourcentage par point, appliqué au `damageChannel` explicite ;
- `resistancePctPerPoint` : bonus de résistance en pourcentage par point, appliqué au `resistanceChannel` explicite ;
- `chargeTimeReductionPctPerPoint` : réduction du temps de préparation/charge en pourcentage par point.

Les anciens champs `damagePerPoint` et `resistancePerPoint` ne sont pas des alias : ils sont refusés afin d'éviter deux interprétations concurrentes.

Propriétaire du calcul pur : `src/core/combat/capture-stat-effects-v1.js`.

Le calcul prend le registre validé + `CaptureCreatureStatValuesV1` et produit uniquement des modificateurs :

- `damagePctByChannel` ;
- `resistancePctByChannel` ;
- `chargeTimeReductionPct`.

Le Human Editor consomme le même calcul pour expliquer le résultat mais ne possède aucune formule métier.

Ce jalon ne modifie pas encore la résolution d'une attaque ni l'horloge du Combat Runtime. Le branchement gameplay réel appartient à un micro-lot séparé avec RED dédié.


## 15. Capture Stat Runtime Effects V1

Le registre de stats et les valeurs de créature restent les propriétaires des données configurables. Le runtime ne relit pas l'UI.

Chaîne autoritaire :

```
CaptureStatRegistryV1 + CaptureCreatureStatValuesV1
        |
        v
projectCaptureStatEffectsV1()
        |
        v
Capture Editor Export V3
creature.combat.statEffects   (snapshot dérivé)
        |
        v
Capture creature -> Fighter adapter
        |
        v
Combat State
        |
        v
Action Resolver / Combat Timing
```

Le snapshot runtime ne devient pas une seconde source de vérité éditable. Il est recalculé depuis les propriétaires lors de l'export.

Canal de dégâts :

- si `SkillDefinition.element` est défini, son ID est le canal ;
- sinon le canal est `physical` ;
- aucune déduction par nom, tag d'UI ou type de créature.

Ordre de calcul :

`baseDamage * (1 + damageBonusPct / 100) * max(0, 1 - resistancePct / 100)`.

Le résultat est stabilisé à deux décimales. Une résistance de 100 % ou davantage annule les dégâts du canal.

Vitesse :

- `chargeTimeReductionPct` issu des stats est converti par l'adapter en réduction du `chargeTimeModifierPct` permanent du fighter ;
- les effets temporaires de charge continuent de s'ajouter via Combat Timing ;
- le `skillSpeedMultiplier` reste une règle globale distincte, appliquée après la préparation propre au combattant ;
- la stat Vitesse ne modifie ni trajet, ni récupération, ni horloge d'énergie.

Les résistances historiques conservées dans les metadata de compatibilité ne sont pas additionnées implicitement aux résistances issues des stats.


## 15. Skill Activation Requirements V1

Les prérequis dynamiques d'une capacité appartiennent à `SkillDefinition.activationRequirements`.

Ils sont distincts de `CaptureSkillEditorDraftV1.requiredLevel`, qui reste un verrou de progression/apprentissage.

Structure :

```js
{
  mode: "all" | "any",
  conditions: [
    {
      type:
        "combat_elapsed_ms" |
        "damage_dealt" |
        "damage_taken" |
        "hp_at_or_below_pct",
      threshold: Number
    }
  ]
}
```

Propriétaires :

- définition/validation : `SkillDefinition` ;
- métriques runtime par combattant : `Combat State` ;
- évaluation : `skill-activation-requirements-v1.js` ;
- refus de démarrage : `Action Resolver`.

Les métriques autoritaires V1 sont :

- `damageDealtTotal` ;
- `damageTakenTotal` ;
- `elapsedMs` déjà existant ;
- `hp/maxHp` déjà existants.

Les dégâts comptés correspondent à la perte de PV réellement appliquée. L'overkill ne gonfle donc pas artificiellement les conditions.

Une condition temporelle n'introduit aucune seconde horloge : elle lit uniquement `CombatState.elapsedMs`.

Un refus pour conditions non remplies intervient avant dépense d'énergie et avant cooldown et expose un résultat déterministe `activation_requirements`.

Le Human Editor futur ne calculera pas ces conditions : il éditera uniquement les données du contrat et projettera l'état renvoyé par le runtime.


## 16. Skill Activation Requirements — Human Editor

Le Human Editor expose `SkillDefinition.activationRequirements` sans devenir propriétaire de son évaluation.

Responsabilités UI autorisées :

- activer/désactiver l'édition des conditions ;
- choisir `all` / `any` ;
- ajouter/supprimer des conditions ;
- convertir l'unité d'affichage du temps : secondes UI <-> millisecondes contrat ;
- afficher des libellés et unités compréhensibles.

Responsabilités interdites à l'UI :

- lire les métriques runtime de dégâts ;
- décider si une capacité est débloquée ;
- posséder une horloge ;
- appliquer énergie/cooldown ;
- réimplémenter `evaluateSkillActivationRequirementsV1()`.

Le chemin reste :

`Human Editor -> SkillDraft -> SkillDefinition -> Combat Rules`.

Le niveau requis pour apprendre/équiper reste une propriété distincte du `CaptureSkillEditorDraftV1` et n'est jamais fusionné avec les conditions d'activation runtime.


## 17. Tactical Skill Effects / StatusEffect V1

Les effets tactiques complexes sont séparés en deux niveaux.

### SkillEffectV1

Effet déclenché par la résolution d'une capacité :

- `damage` ;
- `heal` ;
- `energy_restore` ;
- `energy_drain` ;
- `apply_status` ;
- `cleanse` ;
- `dispel`.

Le scope de cible est explicite et ne doit jamais être déduit du nom de la compétence :

- `target` ;
- `self` ;
- `all_enemies` ;
- `all_allies` ;
- `all_except_self`.

### StatusEffectV1

Effet persistant attaché plus tard au Combat State :

- `stat_modifier` ;
- `damage_over_time` ;
- `heal_over_time` ;
- `shield` ;
- `immobilize` ;
- `silence` ;
- `stun` ;
- `taunt`.

Un statut porte une durée temps réel `durationMs`, une stratégie de stacking et une polarité.

Les données historiques exprimées en anciens tours/durations ne sont jamais converties implicitement par le contrat. Leur migration appartient à un adaptateur dédié ultérieur.

Ce jalon définit les contrats seulement. Aucun effet n'est déclaré actif en combat tant qu'un micro-lot Runtime dédié n'a pas validé le vrai chemin.


## 18. Immediate Tactical Effects Runtime V1

`SkillDefinition.effects` transporte les nouveaux `SkillEffectV1`.

Le champ historique `effect` reste une couche de compatibilité tant que toutes les capacités natives n'ont pas été migrées ; un même type damage/heal ne peut pas avoir simultanément deux autorités actives.

Le module `immediate-tactical-effects-v1.js` exécute uniquement :

- heal ;
- energy_restore ;
- energy_drain ;

sur les scopes `target` et `self`.

L'exécution se produit au vrai impact du Skill dans Action Resolver. Aucun effet instantané n'est appliqué sur evade/block/immune/counter/reflected.

Les scopes de zone et les statuts persistants sont refusés explicitement tant que leurs micro-lots dédiés ne sont pas GREEN.


## 19. Area Targeting Runtime V1

Les scopes multi-cibles de `SkillEffectV1` sont résolus depuis `BattleFormatDefinition`, jamais depuis le DOM ni depuis une copie d'équipes dans Combat State.

Le module `tactical-effect-targeting-v1.js` produit les actorIds vivants selon le scope.

Le calcul de dégâts est factorisé dans `combat-damage-v1.js` et partagé par les dégâts historiques et tactiques.

CombatSession reçoit optionnellement le BattleFormat normalisé et le transmet à Action Resolver. La vue 2v2 utilise ce même objet déjà produit par la source native.


## 20. StatusEffect Runtime V1

Les statuts persistants sont désormais exécutés par le Combat Core.

### État runtime

Chaque fighter possède un tableau `statusEffects` d'instances normalisées contenant :

- définition `StatusEffectV1` ;
- source actor ;
- appliedAtMs / expiresAtMs ;
- stacks ;
- nextTickAtMs pour DoT/HoT ;
- shieldRemaining pour shield.

L'horloge unique reste `CombatState.elapsedMs`.

### Dégâts et boucliers

`combat-damage-v1.js` calcule dégâts / bonus / résistance.

`combat-damage-application-v1.js` applique ensuite les dégâts de manière unique :

1. absorption des shields actifs ;
2. perte de PV ;
3. métriques damage dealt/taken.

Dégâts directs et DoT utilisent ce même chemin.

### Stat modifier

Les coefficients de stats restent propriétaires de `CaptureStatRegistryV1`.

L'export Capture transporte un snapshot `statEffectRulesById` vers le FighterConfig ; le Status Runtime ne contient aucune formule de stat codée en dur.

### Contrôles

- immobilize -> mouvement ;
- silence -> skill start ;
- stun -> mouvement + skill + commande ;
- taunt -> réécriture déterministe de la cible offensive vers la source vivante.

Tous les refus se produisent avant dépense de ressource.

### Nettoyage / dissipation

- cleanse : statuts detrimental ;
- dispel : statuts beneficial ;
- tags vides = tous les statuts de la polarité ;
- tags renseignés = filtre explicite.

### Stacking

- replace : nouvelle instance ;
- refresh : durée renouvelée ;
- stack : incrément jusqu'à maxStacks + durée renouvelée.

Aucun ancien champ legacy de durée/tour n'est interprété implicitement.


## 21. Tactical Effects Editor UI V1

Le Human Editor expose désormais `SkillDefinition.effects` sans posséder leur logique d'exécution.

### Frontière

- UI : saisie, conversion secondes/ms, construction des contrats ;
- `SkillEffectV1` / `StatusEffectV1` : validation ;
- Combat Core : exécution.

Le Human Editor n'importe aucun module Runtime de statuts ou de dégâts.

### Effets éditables

`SkillEffectV1` :

- damage ;
- heal ;
- energy_restore ;
- energy_drain ;
- apply_status ;
- cleanse ;
- dispel.

Tous les scopes contractuels sont éditables.

`StatusEffectV1` :

- stat_modifier ;
- damage_over_time ;
- heal_over_time ;
- shield ;
- immobilize ;
- silence ;
- stun ;
- taunt.

### Temps

L'utilisateur saisit les durées et ticks en secondes. L'UI convertit explicitement vers `durationMs` / `tickIntervalMs` au moment de construire le contrat.

Aucune durée historique exprimée en tours n'est convertie ici.

### Stats

Un `stat_modifier` sélectionne un `statId` du `CaptureStatRegistryV1` courant. L'UI ne contient aucune formule de stat.

### Compatibilité legacy

Le champ historique `SkillDefinition.effect` demeure jusqu'à migration complète. `SkillDefinition.effects` ne le remplace pas silencieusement et la validation refuse les doubles autorités damage/heal.

Les modèles historiques complexes ne deviennent pas automatiquement runtime-ready par la seule présence de cette UI : leur migration reste un lot séparé.


## 22. Capture Complex Skills Migration V1

Les 33 capacités Capture réellement utilisées mais absentes du catalogue portable simple sont projetées par un adaptateur pur :

- `src/adapters/input/capture/capture-complex-skill-migration-v1.js`.

### Source et complément

La source reste `CaptureUsedAbilityCatalogV2` (103 capacités).

Le complément complexe n'est pas maintenu manuellement : il est calculé comme les IDs de la source qui ne figurent pas dans `CapturePortableNativeSkillCatalogV1` (70 capacités). Cette relation garantit qu'une capacité ne peut pas exister simultanément dans les deux projections.

### Sortie de migration

Chaque entrée conserve :

- l'ID historique ;
- son index source ;
- ses `legacyEffects` dans l'ordre historique ;
- un état de migration ;
- des blockers structurés ;
- des `tacticalEffects` uniquement lorsque toute la capacité est démontrable.

Une capacité bloquée expose `tacticalEffects: null`. Aucun sous-ensemble d'effets n'est publié comme s'il était runtime-ready.

### Migrations déterministes

Sept capacités sans statut persistant sont actuellement runtime-ready :

- soins immédiats ;
- auto-soins explicites ;
- dégâts + auto-soin explicite ;
- dégâts de zone portés par le token historique explicite `target:"zone"`.

Le ciblage par défaut legacy utilisé ici vient du routage historique démontré, jamais du nom ou de la description de la capacité.

### Durées legacy

La source historique démontre que `duration` représente des tours / fins de tour :

- statuts exécutés en `turn_end` ;
- décrément de 1 à chaque fin de tour ;
- DoT / HoT exprimés « par tour ».

Le Runtime moderne utilise `CombatState.elapsedMs`, `durationMs` et, pour DoT/HoT, `tickIntervalMs`.

L'adaptateur ne contient donc aucune conversion tours -> millisecondes. Les entrées concernées portent `requires-duration-policy` jusqu'à l'existence d'une politique explicite propriétaire de cette traduction.

### Stats legacy

Les alias Monster Capture restent propriétaires de `monster-capture-stat-values-v1.js`.

Le resolver pur exporté depuis ce propriétaire reconnaît notamment :

- `speed / initiative / agility / agilite -> speed` ;
- `physical / power / force -> physical`.

Il ne crée aucun mapping pour `defense` ou `armor`.

Un second problème sémantique est conservé séparément : le moteur historique applique les buffs/debuffs comme modificateurs en pourcentage alors que `StatusEffectV1.stat_modifier` moderne exprime un `deltaPoints`.

Ainsi :

- alias de stat inconnu -> `requires-stat-mapping` ;
- valeur legacy en pourcentage sans traduction démontrée vers `deltaPoints` -> `requires-stat-effect-policy`.

Aucune valeur legacy n'est recopiée arbitrairement dans `deltaPoints`.

### Frontières

Ce jalon ne modifie pas :

- Combat Runtime ;
- Action Resolver ;
- StatusEffect Runtime ;
- Human Editor ;
- Animation / FX / renderer ;
- storage ;
- network ;
- production GenSrpG.

Le Human Editor continuera d'utiliser sa Map `configuredSkills` unique. La consommation future de la projection complexe devra être un raccord dédié, pas une seconde bibliothèque concurrente.


## 24. Capture Legacy Status Semantics V1

La compatibilité des statuts historiques Capture ne convertit plus les anciens tours en millisecondes.

### Durée owner-action-end

La source historique démontre que les statuts étaient exécutés à la fin de l'action propre de leur porteur.

`StatusEffectV1.durationModel` possède donc deux autorités explicites :

- `time_ms` : runtime dynamique moderne, `durationMs` et éventuellement `tickIntervalMs` ;
- `owner_action_end` : compatibilité historique, `durationActions`.

Un statut `owner_action_end` :

- ne dépend pas de `elapsedMs` pour expirer ;
- ne ticke pas sur réaction ;
- ne ticke pas sur simple avance du temps ;
- ticke/décrémente à chaque fin d'action réussie de son porteur.

### Modificateur de stat en pourcentage

`StatusEffectV1.stat_modifier` possède :

- `modifierMode:"points"` + `deltaPoints` ;
- `modifierMode:"percent"` + `percent`.

Le mode pourcentage calcule son delta à partir de la valeur de base `fighter.statValuesById[statId]`. Il ne transforme jamais un ancien pourcentage en faux nombre de points.

### Défense

La stat standard `defense` est ajoutée au registre Capture.

Son effet est piloté par `damageReductionPctPerPoint`, distinct des résistances de canal.

La formule canonique de dégâts applique :

1. bonus dégâts du canal ;
2. résistance du canal ;
3. réduction globale de dégâts issue de Défense ;

avec réduction globale bornée à 100 %.

### Compatibilité legacy

Les règles exactes démontrées depuis V16.142 sont propriétaires de l'adaptateur `capture-legacy-status-semantics-v1.js`.

Les 33 capacités complexes de `CaptureComplexSkillMigrationV1` sont désormais entièrement traduisibles et exposent toutes `migrationState:"runtime-ready"`.


## 25. Capture Complex Native Skill Catalog V1

Les 103 capacités réellement utilisées par Monster Capture possèdent désormais toutes une représentation native.

Composition :

- 70 drafts issus de `CapturePortableNativeSkillCatalogV1` ;
- 33 drafts issus de `CaptureComplexNativeSkillCatalogV1`.

Les 33 complexes consomment uniquement les `tacticalEffects` déjà validés par `CaptureComplexSkillMigrationV1`.

Le champ historique `effect.damage/heal` n'est jamais utilisé en parallèle pour ces 33, afin d'éviter deux autorités d'effet.

Les formes manquantes du legacy sont transportées par une politique structurelle explicite (scope/catégorie), jamais par nom ou description.

Le Human Editor hydrate les 103 drafts natifs dans `configuredSkills`; le catalogue historique de 103 modèles reste une bibliothèque de provenance/édition, pas une deuxième source de gameplay.

## 26. Capture Defense Stat Editor UI V1

Le Human Editor expose le coefficient canonique `CaptureStatRegistryV1.damageReductionPctPerPoint`.

Responsabilités :

- le contrat `CaptureStatRegistryV1` reste l'unique propriétaire du coefficient ;
- `capture-stat-effects-v1.js` reste l'unique propriétaire du calcul du total ;
- le Human Editor affiche uniquement les unités et transporte la valeur.

Présentation :

- résumé : `1 point = -X % dégâts reçus` ;
- total courant : `N points = -Y % dégâts reçus` ;
- le coefficient est éditable dans les définitions système et personnalisées ;
- aucune formule de dégâts n'est dupliquée dans l'UI.

Sur smartphone, chaque définition de stat s'empile sur une seule colonne.

## 27. Capture Human Editor — autorité tactique réconciliée

Le Human Editor ne possède plus de second chemin éditable pour les effets de compétence.

Autorités :

- dégâts / soins / ciblage : `SkillDefinition.effects / SkillEffectV1` ;
- stun : `StatusEffectV1.stun` ;
- conditions Ultime : `SkillDefinition.activationRequirements`.

Compatibilité legacy :

- `SkillDefinition.effect.damage/heal/stunMs/interruptsPreparation` peut rester dans le contrat pour des données historiques, mais le Human Editor moderne le neutralise lorsqu'il édite `effects` ;
- `allowedDistances` est une projection de compatibilité complète non éditable dans Capture ;
- `targetRelations` est dérivé des scopes tactiques et n'est plus saisi séparément.

Les modèles historiques utilisent la même autorité `SkillEffectV1`. Un modèle n'écrase pas une liste d'effets tactiques déjà configurée.

## 28. Projectile Power V1

### Propriétaire

La politique de collision de projectile appartient à `ProjectilePowerV1`.

`SkillDefinition` compose cette donnée sous :

```js
projectileClash: {
  power: Number >= 0
}
```

Il n'existe plus de tags, groupes, familles ou règles orientées par type de projectile.

### Résolution

Le Core compare uniquement les puissances explicites :

1. si l'un des deux projectiles possède `power = 0`, il n'y a pas de collision ;
2. si les deux puissances sont positives et égales, les deux projectiles sont annulés ;
3. si la puissance gauche est supérieure, le projectile droit est annulé et le gauche continue ;
4. si la puissance droite est supérieure, le projectile gauche est annulé et le droit continue.

Aucune règle n'est dérivée de l'élément, de l'identifiant, du nom ou de la description d'une capacité.

### Runtime

Le point de rencontre temporel reste calculé par `projectile-clash.js`.

Lors d'une dominance, `CombatRuntime` ne recrée pas le projectile gagnant. Il conserve son record actuel dans `activeByActor`; seul le projectile perdant est retiré et reçoit la résolution de clash.

Le gagnant poursuit donc le chemin normal jusqu'à `session.completeAction()`.

### UI

Le Human Editor expose uniquement :

- **Puissance du projectile**.

Aide utilisateur :

- `0` = aucune collision ;
- plus puissant = continue ;
- égalité = annulation mutuelle.

Le stun reste indépendant : `StatusEffectV1.stun` est son propriétaire unique.

## 29. Capture Canonical Creature Catalog V1

Le fichier `monster-capture-creatures.v1.json` reste une source historique de 110 enregistrements.

Il n'est pas directement une bibliothèque de gameplay éditable, car huit anciennes entrées possèdent le même nom que des entrées Capture modernes.

Le propriétaire de la projection jouable est :

`capture-canonical-creature-catalog-v1.js`.

Il déclare explicitement huit alias historiques vers les IDs modernes. Aucun nom de créature n'est utilisé comme règle de résolution.

La projection :

- conserve l'ordre de la source pour les entrées retenues ;
- exclut les 8 IDs historiques alias ;
- contient 102 IDs uniques ;
- refuse tout nouveau doublon de nom non déclaré.

Le Human Editor consomme cette projection avant la construction des drafts.

Les bindings visuels ne maintiennent qu'un propriétaire canonique ; les anciens IDs passent par le même resolver d'alias.

## 30. Capture Database V1 — Bundle Core

`CaptureDatabaseV1` est le format portable de données éditables. Il est distinct de `CaptureCombatExportV1`, qui reste un snapshot d'exécution.

Le bundle ne recopie pas les règles des contrats propriétaires. Son normalizer délègue à :

- CaptureStatRegistryV1 ;
- CaptureProgressionRulesV1 ;
- CaptureCreatureEditorDraftV3 ;
- CaptureCreatureStatValuesV1 ;
- CaptureActiveSkillLoadoutV1 ;
- CaptureSkillEditorDraftV1.

Le bundle contient uniquement les sources canoniques éditables et leurs relations.

Les assets restent des références logiques `assetId` transportées par les Presentation Bindings. Aucun binaire visuel ou audio n'est embarqué.

Le transfert JSON est pur et indépendant du DOM, du stockage navigateur, du réseau et du Runtime.

## 31. Capture Entity Transfer Packages V1

Les fichiers unitaires sont des enveloppes de transport, pas de nouveaux propriétaires métier.

### Créature

`capture-creature-transfer-v1` compose exactement :

- CaptureCreatureEditorDraftV3 ;
- CaptureCreatureStatValuesV1 ;
- CaptureActiveSkillLoadoutV1.

Les capacités restent référencées par ID.

### Capacité

`capture-skill-transfer-v1` contient exactement un CaptureSkillEditorDraftV1.

### Import

L'adaptateur de transfert détecte `creature / skill / database` par schema.

Un ancien ID créature déclaré dans le catalogue canonique est converti vers l'ID moderne avant validation et détection de conflit.

La politique d'application est explicite :

- reject ;
- replace.

Aucun merge champ par champ n'existe.

## 31. Capture Human Editor — File Transfer UI V1

Le Human Editor est le seul endroit où les APIs navigateur de fichier sont utilisées.

### État

La source de vérité de session reste :

- `configuredCreatures` ;
- `configuredSkills` ;
- `statRegistry` ;
- `progressionRules`.

Les fichiers importés/exportés ne créent aucun stockage parallèle.

### Composition base complète

`capture-editor-file-transfer-v1.js` compose les Maps et propriétaires globaux vers `CaptureDatabaseV1`.

Il ne connaît ni DOM, ni Blob, ni File, ni storage.

### Export navigateur

Le Human Editor :

1. obtient un objet canonique ;
2. délègue la sérialisation aux adapters Database/Entity Transfer ;
3. crée un Blob JSON ;
4. déclenche le téléchargement ;
5. libère immédiatement l'ObjectURL.

### Import navigateur

Chaîne :

`File.text -> Entity Transfer parser -> Import Planner -> Session helper -> Maps existantes`.

Le Human Editor ne fusionne jamais les champs.

- reject = conflit ;
- replace = remplacement complet de l'entité ou de la database ;
- noop = aucun changement.

### Assets

Les exports conservent uniquement les références `assetId` déjà propriétaires des Presentation Bindings.

Les binaires image/sprite/audio restent dans la bibliothèque d'assets et feront l'objet des lots assets dédiés.


## 32. Capture Arena Scale Perception V1

La perception de grandeur d'une créature ne doit pas être corrigée en falsifiant son `displayScale`.

### Responsabilités

- `CreaturePresentationBindingV2.displayScale` reste l'unique taille configurée de la créature ;
- Arena Presentation possède le cadrage/zoom du décor ;
- Demo/Renderer CSS possède la composition spatiale statique de la scène ;
- Animation Core conserve seul la perspective dynamique pendant les approches.

### Composition frontale

La scène utilise des ancres verticales centralisées plutôt que des valeurs dispersées :

- 1v1 proche : `--arena-near-y` ;
- 1v1 éloigné : `--arena-far-y` ;
- 2v2 : quatre ancres `--arena-coop-*`.

Le premier preset réduit l'écart vertical afin de donner une lecture plus frontale sans modifier positions, distances ou règles de gameplay.

### Rapport décor / combattants

Le binding de l'arène Ville n'agrandit plus le fond à 112 % de hauteur. Il utilise `auto 100%` afin que les éléments architecturaux apparaissent moins massifs par rapport aux créatures.

### Contact au sol

Chaque fighter reçoit une ombre elliptique de présentation via CSS. Elle suit naturellement le container et son scale, mais n'entre dans aucun calcul de collision, ciblage ou position gameplay.

Aucun asset binaire, Runtime, FX Core ou règle de combat n'est modifié par ce jalon.


## 33. Creature Motion Profiles V1

Les mouvements morphologiques restent pilotés par les données et n'introduisent aucun second moteur de déplacement gameplay.

### Contrat de locomotion

Chaque profil live peut déclarer :

```js
locomotion: {
  style,
  durationMs,
  phases: [
    {
      label,
      at,
      translateY,
      rotateDeg,
      scaleX,
      scaleY,
      easing
    }
  ],
  contacts: [
    { at, intensity }
  ],
  footfallFx?: {
    cameraShake?: {
      durationMs,
      amplitudePx
    }
  }
}
```

`style` reste descriptif. Le moteur ne branche pas ses règles sur l'ID du profil ou sur le nom de la créature : il consomme les phases et contacts explicites.

### Idle et appuis

`idle.transformOrigin` permet à Animation Core de déclarer un pivot spécifique à l'animation sans remplacer le `VisualActor.transformOrigin` permanent.

- bipède, quadrupède et massif utilisent un pivot bas et aucune translation X/Y en idle ;
- l'effet respiratoire / balancement est donc produit par rotation et déformation autour des appuis ;
- serpentin/rampant conserve une translation verticale quasi nulle ;
- drake/volant conserve une oscillation verticale lisible.

Le Render Adapter applique le pivot de l'AnimationPlan uniquement pendant le plan. L'état acteur de base est restauré ensuite.

### Événement `move`

`CombatVisualEvent` expose désormais `move`.

Animation Core :

1. lit `profile.locomotion` ;
2. transforme les phases normalisées en segments ;
3. produit les durées ;
4. produit éventuellement des cues temporels `footfall`.

Animation Core ne produit aucun shake caméra.

### Golem / Massif

Le profil massif utilise quatre contacts de pas régulièrement répartis pendant un mouvement lourd.

La chaîne est :

`Combat result moved -> Visual Controller -> Animation Core move -> footfall cue -> FX Core -> Camera Render Adapter`.

`locomotion-fx-plan.js` est l'unique traducteur du cue `footfall` vers un plan `camera-shake`.

`dom-camera-fx.js` est l'adaptateur qui applique ce plan à l'arène. Combat Rules et Demo UI ne contiennent ni amplitude ni trajectoire de shake.

### Approches d'attaque au sol

Une approche `ground-attack` est un déplacement visuel et doit consommer le même `profile.locomotion` que l'événement générique `move`.

Animation Core projette les phases morphologiques sur la trajectoire vers la cible :

- rampant : interpolation au sol sans arc vertical ajouté ;
- bipède : petit arc ;
- quadrupède : arc plus ample ;
- massif : pas lourds successifs.

La somme des segments d'approche reste exactement égale à `travelMs`, et le dernier segment conserve le label contractuel `ground-approach-impact` ainsi que la position exacte de la cible.

Les cues `footfall` produits pendant cette approche passent par la même chaîne `Animation Core -> FX Core -> Camera Render Adapter`. Aucun shake n'est décidé dans Combat Rules ou dans l'UI.

Les modes `teleport-attack` et `aerial-attack` conservent leurs séquences dédiées et ne sont pas remplacés par la locomotion terrestre.

### Déplacement spatial

`dom-distance-presenter` reste propriétaire de l'application des ancres DOM issues du résultat métier de distance.

Il reçoit seulement la durée calculée par le plan de locomotion afin que la transition spatiale et l'animation morphologique restent synchronisées.

Les positions, coûts, distances et résultats `moved` restent entièrement propriétaires de Combat Rules / Combat Session.

### Ombre de contact

`CreaturePresentationBindingV2.displayScale -> VisualActor.scale` reste l'unique taille de créature.

Le Visual Controller projette cette valeur en variable CSS `--creature-display-scale` uniquement pour la présentation de l'ombre.

L'ombre :

- est plus prononcée ;
- suit le scale de la créature ;
- continue de suivre naturellement `--distance-scale` via le container spatial ;
- ne participe à aucune collision ni règle gameplay.

### Profils V1

- `biped` : idle ancré, petit bond ;
- `quadruped` : idle ancré, bond plus ample ;
- `serpentine` : idle au sol, glissement linéaire ;
- `drake` : oscillation verticale / déplacement volant ;
- `massive` : idle ancré, quatre arcs lourds réguliers avec un contact et un micro-shake FX à chaque retombée.

### Hors périmètre

Ce jalon ne remplace aucun asset d'arène.

Les futures arènes avec caméra plus basse, plus profonde et moins plongeante seront raccordées dans un lot de présentation séparé.


## 34. Skill Availability Refresh V1

Le Combat Runtime ne possède aucune règle de cooldown ou de disponibilité.

### Autorités

- Combat State conserve les échéances et l'état des combattants ;
- Action Resolver décide si `previewSkill()` est autorisé ou refusé ;
- Combat Runtime ne fait que notifier les consommateurs lorsqu'un état sémantique observable change ;
- Demo UI recalcule alors ses boutons via `previewSkill()`.

### Signal runtime

Le signal interne du Runtime ne doit pas se limiter à PV/énergie : un changement de statut ou d'état de disponibilité peut être pertinent sans modifier ces valeurs.

Le Runtime compare donc la projection sémantique du fighter, en excluant seulement `energyChargeProgressMs`, progression interne qui change à chaque tick sans constituer à elle seule un changement de disponibilité visible.

Aucune formule ou durée de cooldown n'est dupliquée dans le Runtime.


## 35. Profil volant canonique

L'identifiant morphologique canonique pour une créature volante est `flying`.

- l'éditeur, les profils de preview et les catalogues de test utilisent `flying` ;
- l'ancien identifiant `drake` n'est plus une source de profil ;
- les anciennes métadonnées visuelles Capture encore publiées avec `profile:"drake"` sont converties explicitement en `flying` à la frontière `capture-creature-visual-binding-v1` ;
- cette compatibilité ne dépend jamais du nom ou de l'espèce de la créature ;
- aucun second profil `drake` n'est maintenu en parallèle.

Le comportement de locomotion et d'idle reste piloté uniquement par `data/profiles/flying.profile.json`.


## 36. Réconciliation volant / serpentin et arc aérien unique

### Autorité des profils

L'identifiant morphologique volant reste exclusivement `flying`.

Il n'existe pas de seconde source `drake.profile.json`. La compatibilité des anciennes métadonnées `drake` reste confinée à la frontière Capture déjà documentée.

Le déplacement `serpentine.locomotion` reste la locomotion linéaire au sol validée. Le réglage d'idle peut déclarer `swayMode:"alternate"` afin que l'Animation Core séquence :

`droite -> centre -> gauche -> centre`.

Le profil serpentin utilise un pivot bas, sans translation X/Y, de sorte que la base reste ancrée et que seule l'oscillation du haut du corps soit lisible.

### Locomotion générique volante

`flying.locomotion` reste data-driven et décrit un seul arc générique :

`montée -> apex unique -> descente -> position stable`.

Ces phases ne possèdent aucun `footfall`.

### Présentation de l'ombre

La représentation canonique est :

```js
presentation: {
  shadow: {
    bottomPct,
    opacity
  }
}
```

Le Visual Controller projette ces valeurs vers :
- `--creature-shadow-bottom` ;
- `--creature-shadow-opacity`.

Le CSS ne connaît aucun ID de profil et conserve ses valeurs par défaut si ces données sont absentes.

La forme plate historique `presentation.shadowBottomPct` n'est pas une autorité parallèle.

### Vrai chemin d'une approche aérienne de combat

Pour une compétence `approachMode:"aerial"`, le chemin réel est :

`Combat Resolution Presenter -> Visual Controller.playApproachFor() -> CombatVisualEvent("aerial-attack") -> Animation Core.planAnimation() -> Render Adapter`.

Le plan d'approche aérienne n'utilise pas `profile.locomotion` comme trajectoire de combat.

Animation Core produit désormais avant impact exactement :
1. `aerial-arc-apex` ;
2. `aerial-arc-impact`.

Le premier segment progresse déjà horizontalement vers la cible tout en atteignant l'unique apex. Le second descend et poursuit la progression jusqu'aux coordonnées exactes de la cible.

Il n'existe plus de phase `aerial-reposition` invisible entre montée et plongée.

Invariants :
- un seul apex ;
- continuité spatiale départ -> apex -> cible ;
- approche visible jusqu'à l'impact ;
- somme des deux segments d'approche = `travelMs` ;
- position au moment de l'impact = cible exacte ;
- `aerial-home` reste une récupération post-impact et ne modifie pas le timestamp d'impact ;
- aucune règle de dégâts, énergie, cooldown, portée ou ciblage n'est déplacée dans Animation Core.


## 37. Fluidité de l'approche de contact volante

Les capacités de contact ne portent pas la morphologie du déplacement. Une capacité telle que `Griffe` peut déclarer `approachMode:"ground"`, puis l'Animation Core consomme la locomotion du Creature Profile actif.

Pour `flying`, l'arche d'approche peut conserver plusieurs points de forme afin de représenter visuellement montée, apex et descente. Ces points ne doivent cependant pas introduire de freinage intermédiaire : leurs intervalles utilisent un easing `linear` afin que la vitesse ne retombe pas à zéro à chaque frontière de phase.

Invariants :
- une seule autorité morphologique : `flying.locomotion` ;
- aucune règle spécifique par capacité ;
- progression horizontale monotone jusqu'à la cible ;
- un seul apex ;
- impact exactement aux coordonnées de la cible et à `travelMs` ;
- aucune modification des dégâts, coûts, cooldowns, portée ou ciblage.


## 38. Autorité canonique des arènes de combat

Les fonds d'arène livrés au runtime appartiennent à la bibliothèque visuelle Core de la branche `global-assets`.

Les cinq IDs canoniques actuels sont :
- `core:arena-forest-01` ;
- `core:arena-cave-01` ;
- `core:arena-snow-01` ;
- `core:arena-city-01` ;
- `core:arena-lava-01`.

Le binding de présentation `demoPresentationAssets.presentationForArena()` résout uniquement ces IDs Core. Les copies locales historiques de `city` et `lava` sous `assets/test/arenas/` ne constituent plus une autorité et sont retirées.

Le remplacement d'un visuel d'arène conserve son assetId et son chemin canonique ; seule la révision de la bibliothèque visuelle est avancée pour invalider le cache client. Aucun changement d'image d'arène ne modifie Combat Rules, les profils morphologiques, les compétences, les positions ou les résultats métier.

Pour le lot Arena Refresh V1, la révision runtime est `2026-09-30-v5-arena-refresh`.


## 39. Présentation du cooldown sans seconde horloge

Le cooldown d'une capacité reste possédé par `SkillDefinition.cooldownMs`, `Action Resolver` et `Combat State.skillCooldowns`.

Le Runtime ne possède aucune règle de cooldown. Il expose seulement un callback générique `onClock(state)` déclenché par son tick existant afin que les clients de présentation puissent relire l'état courant sans créer leur propre timer.

La preview Capture :
- appelle `session.previewSkill()` ;
- lit `remainingCooldownMs` lorsque l'outcome vaut `cooldown` ;
- désactive le bouton via cette décision autoritaire ;
- affiche `Recharge X.X s` ;
- ne calcule jamais elle-même une échéance et ne possède aucun `setTimeout` de recharge.

Le chemin reste donc : `SkillDefinition -> Action Resolver -> Combat State -> Session.previewSkill() -> UI`.


## 39. Présentation visuelle du cooldown dans les icônes

Le cooldown reste exclusivement autoritaire dans `SkillDefinition`, `Action Resolver` et `Combat State.skillCooldowns`. La couche UI ne possède ni échéance, ni timer, ni copie de l'état métier.

La preview Capture lit `session.previewSkill().remainingCooldownMs` et le `cooldownMs` déjà présent sur la définition de compétence pour dériver uniquement un ratio de présentation : portion écoulée de la recharge.

Le rafraîchissement provient du callback générique `Combat Runtime.onClock` déjà alimenté par le tick runtime existant. Aucun `setTimeout`, `setInterval`, `Date.now()` ou second ticker n'est autorisé pour le cooldown visuel.

Le rendu peut combiner : désaturation de l'icône, recoloration progressive, overlay radial, aiguille et texte restant. Ces éléments sont purement visuels et n'altèrent jamais la disponibilité sémantique de la compétence.


## 39. Résistances naturelles des créatures Capture

Les affinités élémentaires naturelles appartiennent à la donnée créature, pas aux règles de combat globales.

Contrat portable :
- `creature.elements: string[]` décrit les types/éléments de la créature ;
- `creature.resistances: [{ kind, value }]` porte les modificateurs naturels ;
- un `kind` de forme `element:<channel>` est projeté par l'adaptateur Capture vers `FighterConfig.resistancePctByChannel[channel]` ;
- une valeur positive représente une résistance ;
- une valeur négative représente une faiblesse.

Les résistances naturelles et celles dérivées des statistiques sont additionnées une seule fois dans l'adaptateur d'entrée. `computeCombatDamageV1()` reste générique et ne connaît ni type de créature ni table de matchup.

Les valeurs importées de Monster Capture restent autoritaires et éditables. Aucune table automatique type -> faiblesse/résistance n'est inventée dans Combat Rules.

Canaux exposés actuellement par l'éditeur Capture : `fire`, `water`, `earth`, `air`, `electric`, `light`, `shadow`, `nature`, `ice`, `poison`, `steel`, `psy`, `spirit`.

Combat State accepte des valeurs signées uniquement pour `resistancePctByChannel`. Les bonus `damagePctByChannel` restent non négatifs.


## 39. Sélection d’arène de preview Capture

La sélection d'arène du test combat est une donnée de présentation de l'éditeur, jamais une règle de combat.

Chaîne autoritaire :
`UI onglet Combat -> CaptureBattleSetupEditorDraft.arenaId -> Capture export presentation.arenaId -> Native Visual Source.arenaId -> demoPresentationAssets.presentationForArena(arenaId)`.

Règles :
- `BattleFormatDefinition` ne contient pas l'arène ;
- Combat Rules, Action Resolver et Combat State ignorent l'arène ;
- aucune URL d'image n'est stockée dans le Battle Setup ;
- la liste des choix UI est dérivée de `ARENA_BINDINGS` via `demoPresentationAssets.arenaOptions()` ;
- aucun second catalogue d'arènes n'est introduit ;
- aucune valeur de secours implicite n'est injectée par les contrats ;
- l'éditeur fournit explicitement l'arène choisie lors de la validation de la preview.


## 40. Santé / PV comme stat canonique Capture

La Santé est une statistique Capture data-driven au même titre que les autres stats. L'éditeur ne possède plus de champs parallèles `PV max` / `PV au départ`.

Chaîne autoritaire :
`CaptureStatRegistry.maxHpPerPoint -> CaptureCreatureStatValues -> projectCaptureStatEffectsV1.maxHp -> Capture export combat.maxHp dérivé -> FighterConfig -> Combat State`.

Règles :
- la stat canonique est `health`, libellée `Santé / PV` dans le registre standard ;
- le registre standard configure `maxHpPerPoint: 1`, soit 1 point de Santé = 1 PV max ;
- `maxHpPerPoint` est une propriété générique de définition de stat : le moteur de projection ne contient aucun cas spécial `health` ;
- `combat.maxHp` reste un champ technique requis par le runtime, mais l'éditeur Human ne l'édite plus directement ;
- l'export V3 dérive `combat.maxHp` depuis la projection Santé lorsque le registre actif possède une règle PV ;
- `initialHp` n'est plus une autorité de l'éditeur Human et est retiré de l'export V3 ; Combat State démarre naturellement à `maxHp` lorsqu'aucun PV initial explicite n'est fourni ;
- l'import Monster Capture mappe le champ historique `hp` vers la valeur de stat `health` ;
- les anciens registres personnalisés qui ne définissent aucune règle `maxHpPerPoint > 0` conservent leur `combat.maxHp` historique : l'absence de règle Santé ne vaut jamais `0 PV` implicitement ;
- aucune dérivation depuis Endurance, niveau ou nom de créature n'est autorisée.

Cette séparation permet à une future progression par points/niveaux d'augmenter la Santé via le même propriétaire de stats, sans introduire une seconde formule de PV.


## 41. Capture Ultimate Slot V1

Le loadout Capture distingue désormais deux responsabilités d'équipement sans modifier les règles métier de combat.

### Autorité de la capacité

`SkillDefinition.loadoutSlot` déclare le type d'emplacement autorisé :

- `standard` — valeur par défaut, y compris pour toutes les anciennes capacités ;
- `ultimate` — capacité réservée au slot Ultime.

Cette propriété est indépendante de `activationRequirements`. Une capacité peut être conditionnelle sans être Ultime, et une Ultime peut ou non posséder des conditions d'activation.

Aucune capacité historique n'est convertie implicitement en Ultime.

### Autorité du loadout

`CaptureActiveSkillLoadoutV1` possède cinq emplacements canoniques :

- `slot-1` ;
- `slot-2` ;
- `slot-3` ;
- `slot-4` ;
- `slot-ultimate`.

Pour compatibilité, un ancien loadout contenant exactement quatre slots est accepté à la frontière puis normalisé vers le format canonique avec `slot-ultimate: null`.

Le helper `capture-loadout-skill-slot-v1.js` est l'unique validateur de la compatibilité entre le type de capacité et le type de slot :

- une capacité `standard` ne peut pas être équipée dans `slot-ultimate` ;
- une capacité `ultimate` ne peut pas être équipée dans les quatre slots standards.

### Progression

`CaptureProgressionRulesV1.maxActiveSkills` et `slotUnlockSchedule` continuent de gouverner exclusivement les quatre slots standards.

Le slot Ultime :

- ne consomme jamais un des quatre slots standards ;
- n'est pas compté dans `maxActiveSkills` ;
- reste configurable à l'avance ;
- reste soumis à `CaptureSkillEditorDraftV1.requiredLevel` lors de la projection vers le combat.

La projection autoritaire reste `capture-planned-loadout-to-combat-v1.js`.

Exemple au niveau où seulement deux slots standards sont débloqués :

`slot-1 + slot-2 + slot-ultimate` peuvent être projetés simultanément si les trois capacités satisfont leur niveau requis.

### Human Editor

L'éditeur présente :

- quatre sélecteurs standards qui n'affichent que les capacités `standard` ;
- un cinquième sélecteur `Ultime` qui n'affiche que les capacités `ultimate` ;
- une case explicite « Capacité ultime — uniquement dans le slot Ultime » dans l'édition d'une capacité ;
- une zone distincte « Conditions d'activation ».

L'UI ne déduit jamais le statut Ultime du nom, des effets ou des conditions.

### Chemin d'export

Le chemin reste :

`SkillDefinition.loadoutSlot -> CaptureActiveSkillLoadoutV1 -> validation de slot -> projection progression/niveau -> Capture Editor Export V3 -> creature.skillIds runtime`.

Ni Combat Runtime ni Action Resolver ne possèdent la notion de « cinquième slot ». Ils reçoivent seulement la liste de capacités effectivement projetées pour le combattant.

Les dégâts, résistances, énergie, cooldowns, ciblage, Animation Core, FX Core, profils de mouvement et arènes restent inchangés.


## 42. Conditions d’activation expressives et zones persistantes V1

### Conditions d’activation

`SkillDefinition.activationRequirements` reste l’unique contrat de disponibilité conditionnelle d’une capacité.

Types V1 pris en charge :
- `combat_elapsed_ms` ;
- `damage_dealt` ;
- `damage_taken` ;
- `hp_at_or_below_pct` ;
- `allies_defeated` ;
- `enemies_defeated` ;
- `kills_by_self`.

Les conditions sont combinées par `mode: all|any`.

Autorités :
- `Combat State.elapsedMs` possède le temps de combat ;
- les compteurs dégâts restent dans le fighter Combat State ;
- `fighter.knockoutsTotal` possède les KO crédités au combattant ;
- les nombres d’alliés/ennemis KO sont dérivés du `BattleFormatDefinition` actif et des PV réels du Combat State ;
- `skill-activation-requirements-v1.js` évalue les seuils ;
- Human Editor ne fait que saisir et afficher les conditions.

Un KO est crédité uniquement lors d’une transition réelle `hpBefore > 0 -> hpAfter === 0`, donc un overkill sur une cible déjà KO ne peut pas incrémenter le compteur une seconde fois.

### Zone persistante

`SkillEffectV1.kind = "persistent_zone"` décrit une zone de gameplay persistante.

Contrat V1 :
- `zoneId` ;
- `targetScope` ;
- `radius: short|medium|long` ;
- `durationMs` ;
- `tickIntervalMs` ;
- `reactivation: refresh|reinforce` ;
- `maxActivations` ;
- `radiusGrowthSteps` ;
- `tickEffect`.

Le propriétaire runtime est `persistent-zone-runtime-v1.js`. Les instances actives vivent dans `CombatState.persistentZones`.

La zone utilise exclusivement l’horloge `Combat State.elapsedMs`. Aucun timer UI, `setInterval`, `Date.now()` ou seconde horloge n’est autorisé.

### Rayon gameplay V1

Le combat ne possède pas encore de coordonnées gameplay individuelles par combattant. Le rayon V1 réutilise donc l’autorité spatiale réellement disponible : les bandes de distance `short -> medium -> long`.

Une zone ennemie centrée sur le camp du lanceur touche une cible adverse uniquement si la distance de combat courante est comprise dans son rayon.

Un renforcement peut faire évoluer le rayon par pas, par exemple :
`short -> medium -> long`.

Cette règle est volontairement distincte du rayon visuel CSS/FX. Aucun pixel de l’UI ne décide si une cible subit les dégâts.

### Tick V1

Le premier raccord runtime autorise un `tickEffect` de type `damage` uniquement.

Les dégâts de tick passent par les propriétaires existants :
`persistent-zone-runtime -> computeCombatDamageV1 -> applyCombatDamageV1 -> Combat State`.

Ils bénéficient donc des résistances, bonus de dégâts, boucliers et comptage de KO existants sans seconde formule.

Les zones de soin, énergie, statut, contrôle, déclenchement à l’entrée/sortie ou explosion à expiration constituent des extensions futures du même contrat ; elles ne doivent pas être simulées par l’UI ou des règles fondées sur le nom de la capacité.


## 43. Présentation persistante des zones et clarté Human Editor V1

### Frontière gameplay / présentation

Le gameplay des zones persistantes reste exclusivement possédé par `CombatState.persistentZones` et `persistent-zone-runtime-v1.js`.

La présentation ne crée aucune durée, aucun tick, aucun compteur d'activation et aucune horloge parallèle.

Chaîne autorisée :

`SkillEffectV1.persistent_zone -> CombatState.persistentZones -> Combat Runtime.onClock(state) -> DOM Skill FX.syncPersistentZones() -> Renderer`.

Le callback `onClock` réutilise l'horloge runtime existante. Il n'ajoute ni `setInterval`, ni `setTimeout`, ni `Date.now()` spécifique aux zones.

### Visuel persistant

Le contrat `SkillPresentationBinding` possédait déjà le slot visuel générique `aura`. Ce slot reste l'autorité de présentation pour le visuel d'une zone persistante ; aucun second contrat visuel parallèle n'est créé.

Le Human Editor projette les champs :
- `zoneAssetId` ;
- `zoneDisplayScale` ;

vers `presentation.visual.aura` avec :
- `attachment:"source"` ;
- `playbackMode:"loop"` ;
- couche `behind` pour les deux vues.

L'adaptateur de présentation expose ce slot au renderer sous le nom de lecture `persistentZone`.

Le renderer crée au maximum un nœud visuel par `persistentZone.id`, l'ancre sur le slot de combat stable du lanceur, met à jour son rayon visuel lors des renforcements et le retire dès que l'instance n'est plus présente dans `CombatState.persistentZones`.

Le scale visuel Proche / Moyen / Loin est uniquement une projection de présentation. Il ne décide jamais de la portée gameplay.

### Éditeur humain

Pour une zone persistante :
- `Intervalle entre les dégâts (secondes)` = temps entre deux applications ;
- `Dégâts à chaque intervalle` = valeur appliquée à chaque tick ;
- `Élément des dégâts` est un sélecteur ;
- la valeur vide est présentée comme `Même élément que la capacité` et conserve le comportement runtime existant : élément de la capacité, puis `physical` uniquement si aucun élément n'existe.

La première utilisation compte comme activation 1. En mode `reinforce`, les activations suivantes augmentent le rayon selon `radiusGrowthSteps` jusqu'à `maxActivations` et la bande `long`. Une réactivation au-delà du maximum conserve le rayon maximal et renouvelle la durée selon le propriétaire gameplay existant.


## 44. État d’enregistrement des capacités et filtrage d’assets V1

### Autorité unique du statut « modifié »

`configuredSkills` est l’unique autorité des capacités enregistrées dans la session Human Editor.

Le statut « capacité modifiée » n’est plus stocké dans un booléen `skillDirty` indépendant. Il est dérivé à la demande par `captureSkillDraftHasUnsavedChangesV1()` :

`brouillon normalisé courant -> comparaison avec configuredSkills[id] -> modifié / propre`.

Conséquences :
- une nouvelle capacité absente de `configuredSkills` est modifiée ;
- après un enregistrement réussi, le brouillon exact placé dans `configuredSkills` est immédiatement propre ;
- toute modification réelle du formulaire reconstruit un brouillon différent et redevient modifiée ;
- aucune suite de listeners `input/change` ne maintient un second état parallèle ;
- la preview ne possède aucune compensation et continue d’appeler le chemin normal `editor.validate()`.

Cette règle s’applique également aux gardes export/import et à l’hydratation initiale.

### Filtrage du visuel persistant de zone

Le rôle d’asset `zone` est filtré par `captureEditorAssetMatchesRoleV1()`.

Un asset de zone doit :
- être compatible `editor` ;
- être une image ;
- être de type `sprite` ou `fx` ;
- ne pas appartenir à la catégorie `creature` ;
- ne pas être un `portrait` ;
- ne pas porter le tag `creature`.

Le filtrage est sémantique et ne dépend d’aucun nom de créature ou d’asset.

### Libellés de zone

Le bloc `persistent_zone` possède explicitement :
- `Intervalle entre les dégâts (secondes)` ;
- `Dégâts à chaque intervalle` ;
- `Élément des dégâts`.

Les tests ciblent le bloc de zone lui-même afin d’éviter qu’un libellé identique situé dans un autre effet donne un faux GREEN.


## 45. HUD cinq capacités et boucle visuelle de zone V1

### HUD combat

Le loadout Capture reste défini par son contrat existant : quatre slots standards et un slot Ultime.

Le HUD ne crée aucune règle de disponibilité. Il projette simplement les cinq capacités sur une grille de cinq colonnes afin de conserver une seule ligne sur mobile.

La taille des cases est réduite uniquement par présentation CSS. Aucun calcul de progression, cooldown, énergie ou activation n'est déplacé dans l'UI.

### Renforcement gameplay de zone

Le propriétaire gameplay reste `persistent-zone-runtime-v1.js`.

Le chemin vérifié par test réel est :
- activation 1 : rayon initial `short` ;
- activation 2 avec `reinforce` + croissance 1 : `medium` ;
- activation 3 : `long` ;
- les activations supplémentaires restent bornées à `maxActivations` ;
- les ticks continuent d'utiliser `tickEffect.amount` et le canal élémentaire configuré.

Aucune correction gameplay n'a été nécessaire dans ce lot : le runtime existant était déjà correct.

### Animation persistante

`SkillPresentationBinding.visual.aura` reste l'unique définition visuelle de la zone.

Le renderer `dom-skill-fx.js` respecte maintenant `playbackMode:"loop"` aussi pour les assets atlas basés sur `url + frameCount`, et pas seulement pour les séquences multi-fichiers `frames[]`.

Un asset multi-frame peut donc boucler aussi longtemps que le nœud de zone existe. Le nœud reste le même pendant un renforcement ; seule sa projection de rayon/scale est mise à jour depuis `CombatState.persistentZones`.

Une image réellement statique reste statique. Aucune animation artificielle, aucun timer secondaire et aucune seconde autorité de durée ne sont ajoutés.


## 46. Synchronisation autoritaire du visuel de zone renforcée V1

Le rendu d'une zone persistante est désormais projeté depuis un seul chemin d'état :

`CombatState.persistentZones -> CombatRuntime.onState(state) -> renderState(state) -> fx.syncPersistentZones()`.

`onClock` ne possède plus la synchronisation des zones persistantes.

### Signal Runtime

Le signal observable du `CombatRuntime` inclut maintenant `persistentZones` en plus de la distance et des fighters.

Ainsi, une modification qui ne touche que la zone déclenche quand même `onState`, notamment :
- création de zone ;
- renforcement du rayon `short -> medium -> long` ;
- changement d'activation ;
- mise à jour de l'état temporel de zone ;
- expiration/suppression.

Le renderer conserve un seul nœud par `persistentZone.id` et met à jour son `transform/scale` depuis `zone.radius`. Il n'existe aucun état parallèle de rayon côté UI.

Aucun timer, observer ou listener compensatoire n'a été ajouté.
