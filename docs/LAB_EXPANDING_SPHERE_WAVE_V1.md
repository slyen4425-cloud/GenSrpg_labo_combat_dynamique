# Onde sphérique expansive — mécanique V1

**Date :** 15 octobre 2026. **Base :** `gh-pages@d89766513821b933b2b74283dfcced996c06662f`.
**Branche :** `work/lab-expanding-sphere-wave-2026-10-15`.
**Checkpoint initial :** `checkpoint/lab-start-expanding-sphere-wave-2026-10-15`.

## Besoin

Le Dragon doit pouvoir utiliser une bulle/auréole de feu qui **s'agrandit réellement**, et dont le bord touche une créature au sol ou en plein vol. Le sprite ne suffit pas à définir la hitbox : le projectile direct historique se base sur un point central. Il faut que le rayon de l'onde visuelle pilote la détection, et qu'une cible non touchée ou esquivant l'onde ne reçoive aucun dégât.

## Contrat auteur

- Style `projectile`, mode dans l'éditeur « Onde sphérique expansive », sérialisé dans `SkillDefinition.projectileTargeting="expanding_wave"`.
- Géométrie native `expandingWave:{startRadiusPct,endRadiusPct,thicknessPct}`, pourcentages de la largeur de l'arène à l'instant du lancement ; les contrôles sont éditables, importables, exportables. Rayons de 1 à 60 % et 1..150 %, épaisseur de 0.5 à rayon final ; valeurs par défaut 3 %, 65 %, 6 %.
- `travelMs` est l'unique durée de croissance (horloge de combat, pas de timer pour les dégâts). `visual.travel` contient le sprite auteur, qui est artificiellement agrandi de la taille de départ à la taille finale. Si aucun sprite n'a été importé, un **anneau CSS provisoire** non catalogué est dessiné. Aucun sprite/son final n'a été fourni dans ce lot.
- La cible autorisée `surface` et `airborne` se configure avec `hitPresenceStates`, le statut souterrain reste protégé par défaut.

## Propriétaires et ordre des événements

1. `CombatRuntime` déclenche la présentation à la libération.
2. `CombatResolutionPresenter` suit le mode `projectile` existant, `planSkillReleaseFx` transmet `expandingWave` à `DomSkillFxRenderer`.
3. **Le même sprite/anneau** animant le grossissement sert de géométrie : rayon calculé à partir du `getBoundingClientRect` du shell réellement transformé.
4. Le capteur central `dom-visible-model-contact` compare l'anneau balayé entre deux frames (pas de tunneling) avec les échantillons de bord **opaque** de la vraie créature, y compris ses transformations et ses déplacements ; cap de calcul pour la fluidité mobile. Les images transparentes ne deviennent pas des cibles pleines.
5. Un contact confirmé déclenche `CombatRuntime.reportActionContact`. Une seule résolution canonique (dégâts, résistances, protections, présence et esquive existantes), puis le projectile est annulé par le Presenter. À échéance sans contact, résultat **`evaded`** sans dégâts ; aucun fallback automatique sur le timer.
6. Les projectiles ordinaires directs, ciel, beams, contact et collision des projectiles restent sur leur code actuel. La sphère n'est pas une arme balistique reflétable par un miroir de projectile ordinaire.

## Portée V1 et limites honnêtes

Cette V1 est **mono-cible sélectionnée**. La sphère se voit croître sur l'arène et peut heurter la cible visée ; les ennemis secondaires en 2v2 ne sont **pas encore** résolus indépendamment. Avant de permettre de véritables dégâts AOE simultanés, il faudra un lot séparé du Combat Runtime, avec déduplication de cible, présence, esquive, protection, immunité, réactions, interruptions, durée restante et collision sprite de chaque acteur. Il serait incorrect de répartir des dégâts automatiques en ajoutant juste `all_enemies`.

## Vérification et publication

`tests/integration/expanding-sphere-wave-v1.test.mjs` : contrat et limites, save/export/import Human Editor, point alpha d'une cible déplacée pendant le balayage, vrai CombatRuntime sans contact (rate), contact (touche une fois), régressions projectile classique. Compléter avec CI Foundation + Firestorm/Creature Library Browser puis checkpoint GREEN sur SHA exact, fast-forward lease de `gh-pages`, vérification CI + Pages. Validation de l'animation, de la sensation et de la collision sur appareil mobile séparée.
