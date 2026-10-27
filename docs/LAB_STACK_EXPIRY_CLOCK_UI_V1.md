# Capture — Rafraîchissement de la durée des stacks V1

Date : 14 octobre 2026.

## Régression reproduite
Le compteur de charge affichait `remainingLabel` par `DomStatusFxRenderer.sync(state)`, déclenché surtout à l'événement `onState`. Or `CombatRuntime` avance le temps natif avec `onClock(state)` toutes les 50 ms par défaut ; `onState` ignore volontairement les simples variations de `elapsedMs` dans son signal d'état. Ainsi le compteur se figeait visuellement puis sautait, alors que le véritable `expiresAtMs` restait correct.

## Correction isolée au propriétaire du rendu
- Une méthode de rendu uniquement `DomStatusFxRenderer.syncCountdowns(state)` met à jour les icônes de statuts à seuil `onStackThreshold` et durée `time_ms` **déjà présentes**, sans recréer les sprites, sans toucher au HUD global, et sans minuterie annexe.
- Le vrai callback natif `onClock(state)` de chacune des deux interfaces (`combat-2v2-test-ui.js` et `combat-test-ui.js`) fournit le snapshot ; ni `CombatRuntime` ni `CombatState` ne sont modifiés.
- Badge en secondes **entières au plafond**, stable d'un tick à l'autre, accompagné d'une fine barre de progression (CSS 70 ms) indiquant la part restante de la **durée unique partagée**. Lors d'une nouvelle charge, l'expiration commune est rafraîchie par le propriétaire existant, donc la barre remonte légitimement.
- En cas d'expiration, la disparition continue de passer par `onState` et le même `sync` natif du renderer. `prefers-reduced-motion` désactive la transition visuelle.

## Vérifications et limites
- TDD RED au SHA `53c42d0868f13b11b7d11554cdb2f386a9d67548` ; sentinelle : valeurs 8s/80 %, 8s/79 %, 7s/69 %, recharge commune 10s/99 %, disparition de l'icône, et liaison UI sans nouvel intervalle.
- SHA de code `e51e567fe5e5f60346e01d88bc49d39c8892ccb5`. CI Foundation + deux Chromium sur SHA documentaire final, checkpoint GREEN et publication protégée requises.
- Lecture de l'horloge inchangée et aucun changement aux effets stack, à l'IA, aux 103 créatures, aux règles, rayons, projectiles, dégâts, au Glow, aux autres dépôts. Vérification Android en paysage recommandée après publication pour lisibilité du nouvel indicateur.
