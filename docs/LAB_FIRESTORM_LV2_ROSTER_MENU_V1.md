# Labo Combat — Zone de feu niveau 2 / réserves distinctes (18 octobre 2026)

## Origine et périmètre
- Retour Android : « zone de feu de Vague de flamme ne grossit pas au level 2 / level 3 OK » et adversaires affichés dans la propre réserve lors de Rappel ou d'un ciblage de réserve.
- Source de départ : `gh-pages@86be8a555dc05fbef2b65c932253d88a9994a23f`, checkpoint `checkpoint/lab-start-firestorm-lv2-roster-menu-v1-2026-10-18`, travail `work/lab-firestorm-lv2-roster-menu-v1-2026-10-18`.
- Charte et owners relus. Aucun JSON auteur, sprite, dégât, statut, cooldown, IA, miroir, laboratoire extérieur ou `main` modifié.

## Diagnostic — réserves
- `mountCaptureCombatRosterPanelV1` créait indistinctement une section `Rappel` pour **chaque** `format.actors`, donc ses sections ennemies apparaissaient au sein de la réserve locale. Un panneau `Réserves adverses` existe déjà séparément pour les capacités ciblant réellement les ennemis de réserve.
- Correction minimale dans `src/ui/capture-combat-roster-controller-v1.js` : construire les sections Rappel **uniquement** lorsque `format.teamOf(actor.actorId)===format.teamOf(getControlledActorId())`; conserver le panneau adverse, son ciblage et les previews Roster. En 1v1 : propre réserve uniquement ; en 2v2 : propres membres plus ceux de l'allié, jamais ceux de l'adversaire. La commande Rappel volontaire reste attachée au combattant contrôlé.
- Test unitaire précédent qui simulait un ennemi directement dans `Rappel` reconstruit afin de contrôler désormais la bonne séparation : ennemi attaquable depuis son panneau dédié, membre allié sélectionnable pour Rappel, KO non disponible.
- Test **Chromium réel** dans l'éditeur avec 3 membres de chaque côté, 2 actifs par équipe : sections locales uniquement, trois lignes ennemies dans le panneau séparé, Soin lumineux sur une réserve sans fuite ennemie dans Rappel. Scénario `roster-menu-visibility-probe.js` ajouté au smoke natif `capture-creature-library-smoke.mjs`.

## Diagnostic — zone de feu niveau 2
- Compétence source `cap_fire_atk_6` Tempête de flammes, autrefois appelée « Vague de flamme ». Auteur : `persistent_zone` sur `short → medium → long`, une étape par renforcement, zone 15 s, tick 1 s, préparation 2 s, max 3.
- Le moteur native `PersistentZoneRuntime` et le renderer montaient bien au deuxième stade, donc aucun raté de progression démontré en simulation nominale et en expiration pendant la préparation. Mais sa taille affichée sur le navigateur passait de **~299.5 px à ~434.3 px**, ratio **1.45x**. Le contour de feu est volontairement très discret (alpha 0.18) depuis l'ajustement utilisateur du 16 octobre, ce qui rend ce deuxième stade difficile à percevoir, tandis que le stade long prend le terrain entier.
- Nouvelle sentinelle navigateur RED `5526cc8f1089143135cd734178cf82fbad588fca` : exiger un accroissement medium d'au moins 1.6x la taille initiale. Le vrai Chromium la rejette à 434.3 / 299.5 px avant correction.
- Une tentative à 1.75x a **été refusée**, car une ancienne sentinelle native de sécurité montrait qu'elle touchait prématurément l'ennemi qui doit rester hors de la zone jusqu'au niveau 3 (`firestorm-spawn-safe-radius-v1.test.mjs`). Pas de maquillage des dégâts ni d'ajout de deuxième géométrie.
- Correction bornée : dans le propriétaire `DomSkillFxRenderer` existant, les **zones configurées avec `radiusGrowthSteps>0`** utilisent une échelle de stade medium **1.65**. Les zones statiques medium gardent 1.45, short garde 1 et long garde la pleine arène. Le vrai sprite et le rayon tactique restent strictement synchronisés ; l'unique modèle visuel reste l'entrée de la détection de présence native.
- La sentinelle navigateur accepte la légère marge des pixels calculés (>=1.6x), valide niveau 2 après renforcement, niveau 3 plein champ, une seule instance de zone, progression joueur/IA en 1v1/2v2 et expiration pendant la préparation. La sentinelle native continue d'interdire tout dégât au premier ennemi immobile jusqu'au niveau 3.

## Validation de livraison
- Le test navigateur Rappel et les tests du vrai Firestorm ne remplacent pas la validation tactile Android.
- CI exigée sur le **SHA documentaire final** : Foundation et quatre navigateurs tous SUCCESS (5/5), checkpoint GREEN exact, promotion de `gh-pages` en fast-forward sous garde de l'ancien SHA, Pages SUCCESS. Aucun GREEN utilisateur avant retour réel.
