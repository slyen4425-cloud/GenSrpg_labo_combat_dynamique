# Labo Combat — synchronisation de la pose d'attaque et de l'impact instantané (22/10/2026)

## Constat, reproduit sur les vraies données
La capacité configurée `cap_earth_atk_7` (Séisme primordial) présente `preparationMs=3500`, `travelMs=0`, `approachMode=none`, `form=projectile`. Avant le lot, `Combat Runtime` produit release puis résolution native au même instant (3500 ms) ; `CombatResolutionPresenter.presentRelease` lançait seulement alors `visuals.playEventFor("attack")`. Le premier mouvement réel du sprite pouvait donc être perçu après les dégâts. Le flash/l'effet d'impact et le recul demeurent des signaux de résolution.

## Solution bornée, sans déplacer les dégâts
- Propriétaire unique : `CombatResolutionPresenter`. Il démarre la pose créature `attack` sur la fin de la préparation, **250 ms avant le release par défaut**, valeur `instantAttackAnticipationMs` configurable. Si la charge est plus courte, l'anticipation ne dépasse pas sa durée.
- Activation limitée aux formes `projectile`, `beam` et `area` avec préparation positive, `travelMs=0`, `approachMode=none`.
- `presentRelease` consomme le seul jeton d'anticipation de cet acteur et n'émet pas une deuxième pose si elle a démarré. Si le navigateur n'a pas déclenché le timer visuel, la pose normale du release reste jouée une seule fois.
- `cancelPreparation`, `cancelActionPresentation` et `dispose` retirent les timers de prévisualisation ; une charge réellement interrompue retire également la pose anticipée. Aucun changement aux dégâts, au moteur de règles, à la timeline de combat, aux créatures, compétences, effets ni aux sons.
- Le présentateur existant est partagé entre 1v1 et 2v2 ; aucun patch UI ni second système de timing parallèle.

## Régressions vérifiées par tests
`tests/unit/zero-travel-attack-sync-2026-10-22.test.mjs` couvre chronologie 3250 / 3500 ms de Séisme, pose unique, interruption avant/après démarrage de pose, fallback en cas de timer visuel tardif, trajet non nul, zéro préparation, attaque contact et raccord 1v1/2v2. Les tests historiques de synchronisation projectile et de séisme restent des sentinelles. Le contrôle visuel sur Android demeure distinct des tests automatiques.

## Gouvernance
Base `gh-pages@8ce03dbac31ea9d4ce9aa2873b10724316c650f6`, checkpoint `checkpoint/lab-start-zero-travel-attack-sync-2026-10-22`, branche `work/lab-zero-travel-attack-sync-2026-10-22`. La CI doit être verte avant un checkpoint GREEN et une publication, et le résultat sera présenté à l'auteur pour essai perceptif.
