# Capture — Orientation paysage de référence V1

Date : 2026-10-06

## Décision produit

Pour Monster Capture sur smartphone, l'orientation de référence devient définitivement :

`landscape`

Cette décision s'applique aux deux phases de jeu :

- exploration ;
- combat.

Elle remplace le statut précédent de "test provisoire" du plein écran paysage pour le gameplay Capture.

## Portée

La décision porte sur le gameplay Capture sur téléphone.

Elle ne force pas l'éditeur de contenu à être exclusivement paysage. L'éditeur reste responsive afin de conserver une saisie confortable en portrait ou paysage.

## Combat

Le combat Capture doit :

- demander / préférer le plein écran paysage lors d'un lancement depuis smartphone ;
- utiliser une scène 16:9 stable ;
- afficher un gate explicite "Tourne ton téléphone" lorsque le navigateur ne peut pas verrouiller l'orientation et que l'appareil est encore en portrait ;
- conserver un fallback propre si Fullscreen API ou Screen Orientation API ne sont pas disponibles ;
- ne jamais modifier les scales auteur pour remplir un écran ultra-large ;
- garder HUD, capacités et cartes lisibles en paysage.

Le propriétaire UI existant de display mode reste la seule autorité d'orientation du preview combat.

## Exploration

Le mode Exploration Capture devra suivre le même contrat produit :

- smartphone paysage comme orientation de jeu ;
- même logique de fallback lorsqu'un verrouillage système n'est pas disponible ;
- aucune seconde convention portrait propre à l'exploration.

Le dépôt Exploration doit appliquer cette décision dans son propre lot et selon sa propre charte lorsqu'il sera modifié. Ce document ne crée pas de dépendance runtime entre les deux laboratoires.

## Placement du camp ennemi

Nouveau besoin UI à réaliser dans un micro-lot séparé :

- déplacer légèrement les ennemis vers la droite ;
- les déplacer légèrement vers le haut ;
- uniquement dans la composition de combat Capture ;
- profiter de l'espace utile supplémentaire disponible en paysage ;
- préserver la géométrie de collision et les sockets : ce déplacement doit passer par le propriétaire de layout/slot déjà existant, pas par un offset de projectile ou de FX ;
- vérifier 1v1 et 2v2 ;
- vérifier smartphone paysage réel avant GREEN utilisateur.

Aucune valeur de scale auteur ne doit être changée pour produire ce décalage.

## Conséquence architecture

Orientation et placement restent de la présentation :

- Combat Rules ne connaît pas l'orientation écran ;
- Collision/Projectile continuent de lire la géométrie réelle rendue ;
- les positions des slots sont possédées par le layout de combat ;
- le renderer FX ne reçoit aucun offset magique pour compenser le déplacement.

## Critère de validation

Cette décision est définitive pour le produit Capture tant qu'une future décision produit explicite ne la remplace pas.

Les futurs lots UI Capture doivent donc être validés en priorité sur smartphone paysage.
