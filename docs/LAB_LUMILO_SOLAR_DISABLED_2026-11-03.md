# Lumilo — Charge solaire verrouille les capacités après utilisation (2026-11-03)

## Retour réel auteur et reproduction
- L'utilisateur confirme que les capacités Lumilo fonctionnent avant **Charge solaire**, mais restent grisées après.
- Version publiée au départ : `gh-pages@f1028d1e0905079a797152a6d6ffd68b8ab79f9c`.
- Checkpoint START `checkpoint/lab-start-lumilo-solar-disabled-2026-11-03` ; branche `work/lab-lumilo-solar-disabled-2026-11-03` ; PR de validation #229.
- Donnée auteur inchangée : `cap_light_atk_3`, contact/ground, préparation 800 ms, recharge propre 45000 ms, statuts bénéfiques +50% pendant 30000 ms, actifs ciblés et réserves alliées.
- La sentinelle existante de charge solaire testait `createCombatRuntime` avec `groundContactResolution="timed"`, tandis que l'UI du vrai combat utilise `"visible"`. Le test ancien était non représentatif du mode joué.

## Cause racine, domaines et correction
- `CombatResolutionPresenter` exclut volontairement le déplacement et l'observation d'un contact physique pour une capacité purement bénéfique `self/ally`.
- Mais `CombatRuntime.settleDue`, quand `groundContactResolution="visible"`, sautait **toutes** les résolutions `contact/ground`, y compris les buffs sans déplacement.
- Sans rapport de contact possible, l'action n'atteint jamais `processResolution`, conserve `activeByActor` et `hasActiveActionFor` vrai. L'UI grise alors **toutes** les capacités, même sans cooldown propre.
- Correction cause racine : le contrat pur `isPureBeneficialAllySkillV1` dans `src/contracts/skill-beneficial-contact-v1.js` est consommé par Presenter et Runtime ; en mode `visible`, Runtime clôt au timestamp natif seulement les buffs purs qui n'ont pas de contact visuel. Les attaques hostiles `contact/ground` attendent toujours leur vraie collision. Même classification pour accepter/refuser les signaux de contact ; pas de timer, de cooldown, de renderer ni d'autorité supplémentaire.
- Le HUD n'est pas déverrouillé artificiellement ; il redevient disponible lorsque Runtime retire sa propre action. Les exports auteur, leurs buffs/réserves, les coûts et le cooldown 45 s restent inchangés.
- Rafraîchissement des clés d'import du Runtime et du module de prévisualisation pour éviter de conserver l'ancienne version sur navigateur.

## Sentinelles et livraison
- TDD RED : `tests/integration/capture-solar-charge-real-presentation-v1.test.mjs` reproduit le Runtime de production `groundContactResolution="visible"`, exige la libération de l'action après 800 ms, l'effet statut réel et le lancement de l'attaque suivante. Avant correction, la branche `settleDue` ignore définitivement cette résolution et l'assertion de libération échoue. Test négatif ajouté : une vraie attaque contact hostile n'est pas résolue sans rapport de contact visuel.
- `tests/browser/solar-charge-real-cast-probe.js` teste dans le vrai éditeur le bouton Rayon lumineux **activé** après Charge solaire, et Charge solaire toujours désactivée pendant sa recharge, avant l'attaque suivante.
- Statut : correction de code sur work/PR, **NON GREEN** tant que le pipeline Foundation + quatre navigateurs, le test réel complet, le checkpoint de fin et la publication `gh-pages` ne sont pas vérifiés. Validation physique Android à distinguer.
- Aucun changement à `main`, Zombicide, Exploration ou `global-assets`.
