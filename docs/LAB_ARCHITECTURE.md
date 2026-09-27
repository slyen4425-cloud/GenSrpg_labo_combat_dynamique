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


## Frontière d'entrée Capture / éditeur — V1

Le laboratoire possède désormais une frontière d'entrée explicite destinée au futur éditeur Capture.

Chaîne autorisée :

```
GenSrpG / éditeur futur
        |
        v
CaptureCombatExportV1
        |
        v
src/adapters/input/capture/
        |
        +---- creature -> FighterConfig
        +---- skill -> SkillDefinition
        +---- teams/actors -> BattleFormatDefinition
        +---- rosters -> Roster Session definition
        +---- presentation -> SkillPresentationBindingV1
        |
        v
CaptureCombatNativeBundleV1
        |
        +---- Combat Session
        +---- Roster Session
        +---- Presenter / FX via bindings
```

Propriétaires :

- export portable : `src/contracts/capture-combat-export-v1.js` ;
- binding de présentation : `src/contracts/skill-presentation-binding-v1.js` ;
- adaptateurs : `src/adapters/input/capture/` ;
- bundle natif : `capture-combat-native-bundle-v1.js`.

Invariants :

- le Combat Core ne connaît ni GenSrpG ni Capture ;
- aucun adaptateur ne lit DOM, stockage, globals ou réseau ;
- aucune compétence n'est déduite depuis son nom/texte ;
- les stats RPG non consommées par le moteur ne sont pas converties implicitement ;
- la présentation utilise des `assetId` stables et reste hors `SkillDefinition` ;
- l'Asset Catalog résout les ressources physiques séparément ;
- 1v1 / 2v2 sont des données de `BattleFormatDefinition`, pas des branches globales ;
- le futur producteur GenSrpG devra construire l'export depuis ses propriétaires restructurés plutôt que livrer ses objets runtime historiques.

Un ancien essai divergent `capture-combat-package.js` combinait export éditeur et structures natives dans un même contrat. Il n'appartient pas à la chaîne V1 courante et ne doit pas être fusionné comme seconde autorité.
