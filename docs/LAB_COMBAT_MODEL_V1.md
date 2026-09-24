# Laboratoire — Modèle Combat V1

## Objectif

Tester un système de combat configurable inspiré d'un rythme temps réel, sans coupler les règles au moteur d'animation.

## Distances

Le combat utilise trois bandes relatives :

- `short` — courte ;
- `medium` — moyenne ;
- `long` — longue.

La distance est un état logique partagé entre les deux combattants.

Changer de bande coûte de l'énergie par palier traversé.

Exemple :

- créature mobile : 1 énergie/palier ;
- créature lourde : 3 énergie/palier.

Courte -> Longue traverse deux paliers et coûte donc respectivement 2 ou 6 énergie.

Le coût de déplacement est configurable par créature.

## Compétences

Une compétence sépare obligatoirement trois dimensions :

1. catégorie fonctionnelle ;
2. forme d'action ;
3. élément.

### Catégorie fonctionnelle

Valeurs V1 :

- `offensive` ;
- `defensive` ;
- `heal` ;
- `buff_debuff` ;
- `counter`.

La catégorie sert au classement et à l'édition. Elle ne remplace pas les propriétés techniques de la compétence.

### Forme d'action

Valeurs V1 :

- `contact` ;
- `projectile` ;
- `beam` ;
- `area` ;
- `self` ;
- `aura`.

Exemple : Boule de feu = catégorie `offensive`, forme `projectile`, élément `fire`.

### Élément

L'élément est une chaîne configurable.

Le moteur V1 ne fige pas une liste complète afin de permettre à GenSrpG d'ajouter ses propres éléments.

Exemples : `fire`, `water`, `air`, `electric`, `light`, `shadow`.

## Paramètres temporels

Chaque compétence peut définir :

- coût énergie ;
- temps de préparation ;
- temps de trajet ;
- temps de récupération ;
- distances autorisées.

Le V1 calcule une chronologie déclarative. Un runtime temps réel dédié viendra plus tard.

## Défense et contre

Une compétence peut déclarer indépendamment :

- `blockForms` : formes bloquées ;
- `reflectForms` : formes renvoyées ;
- `immuneElements` : éléments immunisés ;
- `counterForms` : formes pouvant être contrées.

Exemples :

- Bouclier miroir : renvoie `projectile` ;
- Immunité feu : immunise contre `fire` quelle que soit la forme ;
- Parade : contre `contact`.

Une boule de feu reste donc à la fois `projectile` et `fire`. Les deux axes restent indépendants.

## Autorités

- Combat Rules décide si l'action est valide, bloquée, renvoyée, contrée, immunisée ou réussie.
- Animation Core ne décide jamais du résultat.
- Render Adapter n'invente aucune règle.
- Demo UI ne fait que demander une action et présenter le résultat.

## Énergie

L'énergie est partagée entre capacités et déplacement.

Chaque combattant configure :

- énergie maximale ;
- énergie actuelle initiale ;
- régénération par seconde ;
- coût de déplacement par palier.

Le prototype V1 propose une avance de temps explicite pour tester la régénération sans installer une boucle globale.

## Résultats V1

Les résultats possibles sont :

- `moved` ;
- `insufficient_energy` ;
- `out_of_range` ;
- `hit` ;
- `blocked` ;
- `reflected` ;
- `immune` ;
- `countered`.

Chaque résolution produit aussi des événements sémantiques horodatés relatifs afin de préparer le futur séquenceur temps réel.


## Extension V2 — énergie, charge et runtime temps réel

### Énergie

Le modèle V2 ne démarre plus avec une réserve pleine.

Chaque combattant configure :

- `maxEnergy` ;
- `initialEnergy` ;
- `energyChargeAmount` ;
- `energyChargeIntervalMs` ;
- `movementEnergyPerStep`.

Exemple de test :

`initialEnergy = 0`

`energyChargeAmount = 1`

`energyChargeIntervalMs = 2000`

signifie : départ à 0, puis +1 énergie toutes les 2 secondes.

La progression est discrète et déterministe. Le temps partiel d'un tick est conservé tant que la jauge n'est pas pleine.

L'énergie reste une ressource unique partagée par déplacements et capacités.

### Temps de charge d'une capacité

La compétence possède une valeur de base :

`preparationMs`

La créature possède :

`chargeTimeModifierPct`

Convention :

- valeur positive = temps de charge augmenté ;
- valeur négative = temps de charge réduit.

Formule :

`temps effectif = temps de base × max(0, 1 + totalPct / 100)`

Exemple :

- compétence : 1000 ms ;
- créature : -20 % ;
- temps effectif : 800 ms.

### Effets temporaires

Le Combat State peut porter des effets temporaires de charge :

```js
{
  id: "quick-cast",
  modifierPct: -25,
  durationMs: 5000
}
```

Ils s'ajoutent au modificateur permanent de la créature et expirent selon le temps du combat.

Cela permet plus tard une capacité du type :

`Réduit le temps de charge de 25 % pendant 5 secondes.`

Le calcul appartient à Combat Timing, jamais à l'UI.

### Runtime temps réel

`Combat Runtime` est l'unique propriétaire de l'horloge active du prototype.

Il :

- avance le Combat State ;
- déclenche les ticks d'énergie ;
- suit la progression d'une capacité en préparation ;
- ouvre la fenêtre de réaction ;
- signale le release ;
- signale la résolution ;
- est annulable et libère son timer via `dispose()`.

Il ne calcule aucune animation.

### Barre de charge

L'UI reçoit uniquement une progression normalisée `0..1` produite par le runtime.

Chaque capacité possède sa propre barre de charge visible.

Le remplissage n'est donc pas une minuterie CSS indépendante : il reflète l'état du runtime de combat.

### Déplacement visuel

La distance logique reste une propriété du combat.

En revanche, son affichage est individualisé :

- seul le combattant qui effectue le déplacement change de position visuelle ;
- l'autre combattant reste immobile ;
- le Render Adapter de distance est le seul propriétaire de cette projection visuelle.

Le CSS ne déplace jamais automatiquement les deux combattants en fonction de la distance logique.

### Idle

L'`idle` est l'état visuel par défaut des deux combattants.

Toute animation transitoire revient ensuite vers l'idle.

Cette règle appartient au contrôleur visuel, pas à Combat Rules.


## Extension V2 — dégâts et projection de distance

### Dégâts

Les dégâts de base utilisent `skill.effect.damage`.

Le seul propriétaire de leur application est `Action Resolver`.

- hit : dégâts sur la cible ;
- reflected : mêmes dégâts sur l'attaquant ;
- blocked / immune / countered : aucun dégât du projectile/attaque annulée ;
- les PV sont clampés entre 0 et `maxHp`.

Le `hit` sémantique contient `hpBefore` et `hpAfter` pour les consommateurs visuels ou de journalisation, sans leur donner d'autorité sur l'état.

### Projection de distance

La distance logique reste unique : Courte / Moyenne / Longue.

Le rendu calcule la position du combattant mobile depuis la position du combattant stationnaire et une séparation explicite :

- Courte : 0,30 de largeur normalisée ;
- Moyenne : 0,44 ;
- Longue : 0,56.

Le joueur est projeté à gauche de l'adversaire ; l'adversaire à droite du joueur.

Ainsi, Courte est toujours visuellement plus proche que Moyenne, elle-même plus proche que Longue, même après des déplacements successifs des deux combattants.
