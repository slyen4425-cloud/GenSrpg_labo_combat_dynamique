# Mur — publication des événements d'état des entités (2026-10-31)

## Audit confirmé
Le signal de Combat Runtime omettait `Combat State.combatEntities`. L'apparition d'un mur et ses changements de PV ne déclenchaient donc pas systématiquement `onState` lorsque les PV des combattants demeuraient identiques. Le renderer possédait déjà le rendu persistant, mais ne recevait pas le nouvel état.

## Correction
`stateSignal()` inclut désormais les entités invoquées, sans nouveau timer, état visuel autoritaire ou traitement de dégâts. Leur HP reste exclusivement propriété de Combat State / Combat Damage. La chaîne d'import de la preview et les imports de Combat Runtime ont des URL révisées pour éviter des chargements ESM obsolètes.

## Test RED / GREEN
Départ : `gh-pages@8ec222b72d053e20297aa8fc89094ac8b8f5f056` ; checkpoint `checkpoint/lab-start-wall-state-signal-2026-10-31` ; branche `work/lab-wall-state-signal-2026-10-31`.
Test RED commit `6d07370ce2c395864a2dbfed51939671ddd4f7d5`, run `41239833849`, Foundation FAIL attendu : « spawn must refresh wall overlay » ; les autres quatre jobs navigateur étaient déjà verts ou en cours au moment de la preuve.
Code correctif `806991867e328ec6be9a502bdb47ea6b43392b88`. Le test utilise un vrai `createCombatBarrierV1` puis `applyCombatDamageV1`, et vérifie spawn, absorption partielle, destruction, absence de faux retours dégâts sur la créature et absence de réémission inutile.

## Portée / limites
Pas de collision géométrique libre rayon/mêlée, pas de placement libre, pas de familiers actifs, pas de canalisation dans ce micro-lot. Tous restent sur les issues #167 et #168. `main`, autres dépôts et `global-assets` non modifiés. Checkpoint GREEN uniquement si CI Foundation et quatre Chromium verts sur le dernier SHA et PR `gh-pages`, puis Pages vert. Smartphone à valider séparément.
