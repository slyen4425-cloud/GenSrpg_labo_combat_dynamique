# Contrats V1 — Combat visuel mono-image

## VisualActor

Un acteur visuel est un objet de présentation indépendant du gameplay.

Champs V1 :

- `id` : identifiant de l'instance visuelle ;
- `creatureId` : type de créature ;
- `profile` : profil de mouvement ;
- `asset` : asset actuellement affiché ;
- `view` : `opponent` ou `player` ;
- `facing` : `left` ou `right` ;
- `position` : position logique de scène ;
- `scale` : échelle de base.

## CombatVisualEvent

Événement sémantique indépendant des règles de combat.

Types réservés :

- idle
- enter
- attack
- hit
- dodge
- ko
- recover
- skill
- projectile

La V1 du planner implémente : `idle`, `attack`, `hit`, `ko`.

## AnimationPlan

Le planner transforme `event + actor + profile` en plan déclaratif.

Un segment décrit uniquement :

- durée ;
- easing ;
- translation X/Y ;
- scale X/Y ;
- rotation ;
- opacité.

Le planner ne manipule ni DOM, ni Canvas, ni WebGL.

## Orientation

Le sens horizontal est dérivé de `actor.facing`.

Les profils décrivent des amplitudes positives/relatives ; le planner applique le signe.

## Restauration

Les animations non-bouclées portent `restoreBaseState: true`.

Le futur runtime devra garantir que l'acteur retrouve un état cohérent après fin ou annulation.

## Profils V1

- Maraileron -> `serpentine`
- Braisombre -> `drake`

Les profils sont des données JSON modifiables ; ils ne sont pas codés en dur dans l'UI.
