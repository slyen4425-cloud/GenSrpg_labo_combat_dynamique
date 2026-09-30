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
- le Human Editor refuse un slot non débloqué et une capacité dont `requiredLevel` dépasse le niveau de la créature ;
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
