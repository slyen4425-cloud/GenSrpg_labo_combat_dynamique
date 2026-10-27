# Surcharge de Voltige — approche à 0 ms et blocage visuel

**14 octobre 2026 — correctif ciblé Labo Combat.**

## Source fournie et symptôme

Fichier auteur consulté : `gensrpg-capture-skill-cap_electric_special_2.json`, transfert `capture-skill-transfer-v1` de `draft.id=cap_electric_special_2`, nom **Surcharge**. L'auteur observe qu'après l'activation de cet ultime, l'attaque suivante utilisant un déplacement semble figer le jeu au remplissage de la barre de préparation.

Effets originaux du fichier, **aucun fichier auteur modifié** :
- **approach_time_modifier** : `modifierPct=-100` pendant 60 secondes ;
- **skill_cooldown_rate_modifier** : `modifierPct=-100` pendant 60 secondes ;
- **energy_regen_modifier** : `modifierPct=+50` pendant 60 secondes ;
- **stat_modifier** : `statId=electric`, `deltaPoints=+50` pendant 60 secondes ;
- **triggered_buff** : quand des PV sont infligés (`damage_dealt`), ajouter `damage:target 10` durant 60 secondes.

## Diagnostic TDD

En moteur de timing existant, **−100 % de durée de déplacement => trajet natif de 0 ms** pour sol, aérien et souterrain. Cette valeur est **autorisée et déjà protégée** par `tests/unit/combat-tactics-switch-travel-v1.test.mjs` : la modification temporaire visant à imposer au gameplay 1 ms a été **revertie**, car elle cassait un invariant validé. Il ne s'agit pas d'un blocage de boucle du Runtime : le test natif confirme que préparation, release et résolution immédiate se succèdent lors du même tick.

À la sortie de préparation, `createCombatResolutionPresenter.presentRelease` transmettait **`travelMs:0`** au visualiseur `playApproachFor`, alors que celui-ci planifie animation et progression pour un mouvement. Le nouveau code applique `Math.max(1, Number(action.travelMs)||0)` **uniquement aux paramètres visuels**, sans toucher à l'action ni à la simulation. Ainsi la mécanique autorise toujours l'attaque instantanée ; la présentation n'utilise jamais un intervalle non positif, tout en conservant le callback de mouvements et sons de pas qui appartient au même propriétaire.

## Validation

- TDD RED `153a6a11303f7989770caca4f215ed40e5406e69` reproduit le trajet natif nul sur la compétence à 5 effets.
- Le refus de changer la règle existante est prouvé par la sentinelle originale `combat-tactics-switch-travel-v1`; `combat-timing.js` a été entièrement restauré, zéro diff final.
- Nouvelle sentinelle `tests/unit/capture-surcharge-zero-approach-freeze-v1.test.mjs` : cinq statuts réels, `CombatSession + CombatRuntime` avec temps simulé jusqu'à fin de préparation, résolution dans le même tick, dégâts/règles réels, `CombatResolutionPresenter` avec visualiseur pour ground/aerial/burrow/teleport (enveloppe positive 1ms), durée normale non modifiée, et `-100%` du cooldown conservé.
- Les autres tests existants de footfall, FX, rayons, AI, status, stun, dodge et collision restent requis GREEN.
- Contrôles natifs, 3 jobs CI, checkpoint GREEN et CI + Pages du SHA final requis avant livraison. Aucun essai Android physique n'est simulé.

## Aide à la configuration auteur

**−100 % de temps de trajet** = déplacement instantané, pas simplement « accéléré ». Pour garder une vraie animation accélérée, essayer par exemple **−50 %** (trajet divisé par deux) ou **−75 %** (trajet divisé par quatre).

**−100 % de vitesse de recharge de compétence** = **pause totale du cooldown** : la valeur `+100%` le ferait progresser deux fois plus vite, et `+200%` trois fois plus vite. Le moteur respecte les valeurs exactes du fichier : leur correction éventuelle se fait par l'auteur dans l'éditeur.

Le `+50%` de récupération d'énergie et le `+50` de caractéristique Électricité peuvent fonctionner indépendamment. Le dernier `damage_dealt -> damage 10` se déclenche en plus de l'attaque touchant une cible. Aucun de ces effets n'a été supprimé.

## Gouvernance

Base `gh-pages@d3deb8d97d583d9679559d43feb15e9fedaf705d`; checkpoint `checkpoint/lab-start-surcharge-zero-approach-freeze-2026-10-14`; branche `work/lab-surcharge-zero-approach-freeze-2026-10-14`; lot isolé. Les créations, assets, IA et règles existantes demeurent protégés.
