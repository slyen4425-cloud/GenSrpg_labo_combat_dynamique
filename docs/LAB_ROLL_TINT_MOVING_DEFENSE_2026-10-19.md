# Labo Combat — Colorisation de la forme roulante et Défense pendant le déplacement

Date : 19 octobre 2026.

## Besoin et base
- Le sprite alternatif de Scarabacier roule correctement mais sa colorisation (tint statut) restait sur la silhouette normale.
- L'auteur veut un buff de Défense actif uniquement pendant le mouvement de combat, par exemple une carapace renforcée pendant le roulé-boulé.
- Base publique immuable : `gh-pages@43600557ce107e77270d6ec6460d5585fef1e9a3`.
- Checkpoint de départ : `checkpoint/lab-start-roll-tint-moving-defense-2026-10-19`.
- Branche : `work/lab-roll-tint-moving-defense-2026-10-19`.

## Solution 1 : teinte correcte sur la forme mobile
- `src/adapters/renderer/dom-creature-movement-visual-v1.js` utilise un seul shell d'animation pour le PNG fixe et la bande de frames ; son masque de collision reste celui de la silhouette roulante (première frame pour une bande).
- La teinte du statut est enfant de ce shell tant que la forme alternative est active : les rotations et le scale sont ainsi partagés sans deuxième animation ni double source de vérité.
- `createDomStatusFxRenderer` lit le `tintHost` réel et le masque du sprite, puis revient au `motion` original après fin/interruption.
- Le même contrôleur `getStatusPresentationTargetFor` sert en joueur/adversaire/2v2. Aucune altération des statuts, de leurs couleurs ni du gameplay des collisions.

## Solution 2 : buff conditionné au mouvement natif
- Contrat `StatusEffectV1` : sur le **stat_modifier** existant, champ optionnel `activationCondition: "moving"`. Défaut historique `always`, omis dans les exports pour préserver l'identité des anciens statuts.
- Dans **Capacité → Effets → Appliquer un statut → Modification de stat**, l'éditeur propose **Activation du bonus : Toujours / Uniquement pendant le déplacement réel**.
- Pour Scarabacier : statut bénéfique `stat_modifier`, `statId=defense` choisi depuis le registre, `deltaPoints=50`, `activationCondition=moving`, durée du buff et stacking habituels.
- Avec le registre actuel, Défense = 0,2 % de réduction par point ; +50 Défense apporte +10 points de pourcentage de réduction pendant le mouvement, cumul plafonné par les règles natives.
- **Le buff doit être activé au préalable**, sa durée normale continue de s'écouler. Le bonus de statistique s'applique uniquement pendant une approche native au sol / aérienne / souterraine avec trajet strictement positif.
- CombatRuntime est l'unique propriétaire : ouvre `movementActive` à l'instant de release, le ferme à la résolution avant recovery, au contact anticipé, à l'interruption, au KO, à l'annulation et au dispose. Le statut existant est évalué dans `projectStatusStatEffectsV1`, jamais depuis le sprite/DOM.
- Le système ne transforme pas une animation isolée sans déplacement Combat Rules en protection : pas de dégâts de compétence modifiés hors fenêtre ; aucune immunité et aucune protection pendant la simple préparation ou la téléportation.
- Le HUD du statut précise désormais « uniquement pendant le déplacement ».

## Protections et tests
- Aucune modification de Zombicide-40k, de l'exploration, de main, de global-assets, du catalogue Scarabacier, de l'asset auteur ou de ses capacités.
- Les tests `tests/unit/capture-moving-defense-tint-v1.test.mjs` couvrent contrat, défaut legacy, conversion auteur, adversaire en approche, défense pendant trajet uniquement, annulation native et bascule du host de teinte.
- Les sentinelles historiques `creature-movement-appearance-v1.test.mjs` sont adaptées au shell commun.
- Exiger CI Laboratory 5/5 puis checkpoint GREEN + publication sous lease et GitHub Pages sur le SHA publié.
- **Validation visuelle sur le smartphone de l'auteur non effectuée** : test joueur/adversaire en conditions réelles et contrôle du changement de teinte restent à confirmer.
