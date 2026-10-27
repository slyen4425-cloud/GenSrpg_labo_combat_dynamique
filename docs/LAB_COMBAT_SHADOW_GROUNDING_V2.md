# LAB — Combat Shadow Grounding V2

## Statut

GREEN technique.

## Diagnostic

La timeline d'animation possédait déjà une projection `ground`, mais la surface visible était un pseudo-élément `.fighter::before` fixe (58% × 10%). Sa taille ne suivait pas l'emprise utile du sprite et l'animation WAAPI du pseudo-élément était fragile en navigateur réel.

## Correctif

- un vrai élément `.fighter__shadow[data-demo-shadow]` par combattant ;
- le même `DomActorRenderer` anime corps et ombre ;
- aucune seconde timeline : `AnimationPlan.ground` reste l'unique autorité ;
- plus de `pseudoElement: ::before` ;
- taille calculée depuis l'emprise opaque réelle du sprite avec rejet robuste du bruit de bord ;
- largeur bornée 46–92 %, hauteur 8–15 % ;
- scale acteur appliqué par `composeDomShadowTransform` ;
- `bottomPct` et `opacity` des profils existants restent actifs.

## Preuves

- RED : `0acb61f2ded800eef31d65039895db7f55a6bae0` ;
- GREEN : `a075c2c4f83481ae9a54d58975423f63bcfdbbd0` ;
- CI : `37331678296` — 1041/1041 PASS ;
- structure/indépendance : OK.

## Architecture

Aucun changement Animation Core, Combat Runtime, Combat Rules, collision/contact sémantique, dégâts ou timing.
