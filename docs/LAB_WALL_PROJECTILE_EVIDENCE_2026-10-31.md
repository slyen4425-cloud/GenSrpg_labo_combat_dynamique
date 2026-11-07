# Mur — collision projectile prouvée, jamais présumée (2026-10-31)

## Symptôme
Un projectile arrivant à son délai d'impact pouvait réduire les PV d'un mur sans signal spatial, car `interceptCombatBarrierV1` traitait le paramètre absent `contactedEntityId` comme une permission de bloquer. Or la géométrie réelle du projectile peut passer à côté du rectangle du sprite. La collision visuelle existante, lorsque confirmée, fournit déjà l'ID exact au Combat Runtime.

## Correction native
Combat Damage exige maintenant `contactedEntityId===entry.id` pour les projectiles. `null`, `undefined` ou un autre ID ne sont plus des preuves. Aucune nouvelle autorité, aucun masquage ; le visuel détecte, le Runtime valide, Combat Damage applique. Les attaques `beam` et `contact` restent sur le contrat de protection hérité, dont la géométrie indépendante sera un jalon suivant (#167).

## Preuves
- Base GREEN `gh-pages@5e0c23f69d399aa81b140c64e7c4f48e9fe637e6`, checkpoint START `checkpoint/lab-start-wall-projectile-evidence-2026-10-31`.
- TDD RED `8d0e60f98d519009894ec5505144ec0083e35e00`, CI `41240589424` Foundation FAIL attendu : `only exact observed wall contact may intercept`, valeur réelle 35 au lieu de 0.
- Test de chemin natif : impact nominal sans ID → mur intact et dégâts à la créature ; contact avec vrai ID → mur absorbe et créature protégée ; ID faux → aucun mur ; mêlée/rayons inchangés. Tests de l'ancien scénario avec contact de mur explicite.
- GREEN uniquement après CI complète Foundation + 4 Chromium sur le SHA documentaire final, checkpoint, PR `gh-pages` et Pages.

## Hors périmètre
Position libre, collision spatiale rayon et contact, formes de zone, familiers actifs, canalisation #168, vrais sprites dédiés et validation smartphone. `main`, `global-assets`, GenSrpg et Exploration non modifiés.
