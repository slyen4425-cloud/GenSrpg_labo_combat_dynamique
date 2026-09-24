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
