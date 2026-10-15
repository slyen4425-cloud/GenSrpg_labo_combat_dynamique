# Labo Combat — Contact terrestre face à une cible aérienne

**15 octobre 2026.** Base `gh-pages@a4a7484e50e5fcfdc019fb47a1077f0f1afd87c3`. Lot `work/lab-ground-melee-airborne-lane-2026-10-15`. Checkpoint initial `checkpoint/lab-start-ground-melee-airborne-lane-2026-10-15`.

## Défaut d'origine

`mountCombatDemo().playApproachFor` récupérait `target.motion.getBoundingClientRect()` même pour une attaque de contact terrestre. L'animation de saut/vol du dragon étant une transformation WAAPI de cet élément, la coordonnée Y de Griffe suivait le dragon dans les airs. En parallèle, `skillPresenceReachV1` admettait la présence `airborne` par défaut pour toutes les attaques terrestres de contact, sans nécessité d'une capacité anti-air.

## Correction et propriétaires

- **Visuel** dans `src/ui/demo-app.js` : si et seulement si `approachMode === "ground"` et que la cible possède une approche `aerial` active dans la table d'autorité `activeApproachBySlot`, déterminer la destination à partir du conteneur fixe `slot.container` (et du décalage visuel auteur avec l'échelle de distance). `playApproachFor` conserve la trajectoire terrestre et la physique de profil déjà définie ; la caméra, les profils et l'Animation Core ne sont pas modifiés.
- **Collision visuelle** : `watchVisibleModelContact` garde les deux masques opaques réels et leurs transformations en cours. Le correctif ne recadre pas la collision sur une silhouette fictive au sol ; la trajectoire vise le sol, le contact n'a lieu que sur chevauchement physique réel, avec le retour d'approche existant.
- **Combat Rules** dans `src/core/combat/combat-presence-v1.js` : une attaque `category:"offensive", form:"contact", approachMode:"ground"`, sans `hitPresenceStates` explicite, ne touche plus `airborne` pendant la fenêtre d'action aérienne. L'échec est le résultat canonique `evaded`/raison `presence`, donc pas de dégâts, impact de touche ou contournement.
- Capacités d'anti-air dont `hitPresenceStates` inclut `airborne` gardent le contrat explicite. Attaques de contact aériennes et projectiles restent inchangés, de même que la présence souterraine et la collision lorsque les modèles se rencontrent réellement. La trajectoire terrestre n'est jamais convertie en poursuite volante.

## Validation

- `tests/integration/combat-presence-reach-v1.test.mjs` : vraie CombatRuntime avec dragon volant / Griffe terrestre simultanée, absence de PV retirés et résultat manqué, cible immobile au sol reste touchée, attaque anti-air explicitement capable atteint une cible en vol, aérien contact inchangé.
- `tests/unit/ground-melee-airborne-visual-v1.test.mjs` : calcul de centre stable avec modèle visuel déplacé verticalement, décalage auteur, échelle de distance, et intégration du propriétaire dans les deux clients (1v1 et 2v2) ; tests de contact opaque historiques et feu direct sentinelles conservés.
- Aucun changement de compétence/creature auteur, audio, image, export, autre dépôt, `global-assets` ou `main`. CI Foundation, Firestorm et Creature Library attendues GREEN au commit final avant checkpoint, preview et publication. Android paysage à valider par l'auteur.
