# Attaque aérienne — traversée complète après touche (23 octobre 2026)

## Défaut et correction
Après la PR #77, le plan Animation Core contient déjà une montée verticale, un piqué et un retour. Mais dans le raccord réel `src/ui/demo-app.js/playApproachFor`, le détecteur de silhouettes appelle `returnActiveToBaseFromCurrent()` au premier contact de **tous** les déplacements continus. Cette interruption est pertinente pour une Griffe au sol, pas pour un piqué aérien. D'où l'image de la créature qui monte et revient brutalement dès qu'elle effleure l'adversaire.

La correction maintient la chaîne officielle `watchVisibleModelContact -> onContact -> CombatRuntime.reportActionContact -> Combat Rules`. En approche `aerial`, ce callback signale le contact **une seule fois** sans stopper l'animation en cours, sans effacer les phases ni déclencher un retour anticipé. `watchVisibleModelContact` reste responsable de sa propre fin après la première collision. Les autres approches conservent leur arrêt/retour existant, y compris `contactHold` pour Sangsue au sol.

Animation Core poursuit son plan : ascension, piqué qui traverse l'ennemi, retour au camp. Une marge de traversée `specialMoves.aerial.followThroughRatio = 0.35` est déclarée dans les cinq profils existants et validée entre 0 et 0.8 : point d'arrivée visuel = distance horizontale vers le camp adverse × 1.35. Ce réglage affecte uniquement la translation de la créature et de son ombre, ni `travelMs`, ni l'énergie, ni les dégâts. La fin de l'approche revient à l'origine par le `aerial-home` déjà propriétaire de la restauration.

## Charte et périmètre
- Base `gh-pages@5a120375a3ea1107a15f6e87bfd095d55dd87a67`; START `checkpoint/lab-start-aerial-follow-through-2026-10-23`; branche `work/lab-aerial-follow-through-2026-10-23`.
- Autorités inchangées : Animation Core calcule le plan ; Demo UI relaie seulement la collision et laisse courir le renderer ; Combat Runtime/Rules appliquent une résolution unique à l'instant du premier contact.
- Interdits : second détecteur, nouveau timer de retour, double source des dégâts, immunité fictive, retouche du trajet terrestre, des autres approches ou des exports auteur. Aucun changement à `main`, `global-assets` ni `Zombicide-40k`.

## Validation requise
- `tests/unit/aerial-contact-follow-through-2026-10-23.test.mjs` : vraie résolution CombatSession/Runtime dès le contact, un seul impact/dégât, animation DOM Body+Shadow qui continue sans être annulée, fin naturelle du plan, coefficient borné, sentinelle du raccord réel de la Demo UI.
- Sentinelles `moving-attack-contact-stop-v1`, `aerial-dive-visual-2026-10-23`, `special-attack-animation` mises à jour sans désactiver les protections historiques.
- Fondation CI et quatre suites navigateur toutes vertes sur le SHA exact, checkpoint GREEN avant publication ; vraie sensation visuelle Android à faire confirmer par l'auteur.
