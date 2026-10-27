# Capture — Solo 2v2 Landscape Ergonomics & Enemy Depth V1

Date : 13 octobre 2026.

## Retour utilisateur réel
- Le switch humain A/B a été testé par l'auteur et fonctionne.
- L'UI du mode solo 2v2 occupait une grande colonne verticale à droite et était injouable en smartphone paysage.
- Les ennemis paraissaient trop proches/volumineux par rapport au 1v1.
- Ces deux problèmes sont des critères de validation **visuelle encore ouverts** après correction technique.

## Frontières et traçabilité
- Base officielle LIVE `gh-pages@1c8720c6a5a9811d7bcb6a815016beb0bc476291`, Laboratory CI `38402617967` SUCCESS et Pages `38402618584` SUCCESS.
- Checkpoint départ `checkpoint/lab-start-solo-2v2-ergonomics-perspective-v1-2026-10-13`; branche de travail `work/lab-solo-2v2-ergonomics-perspective-v1-2026-10-13`.
- Unique owner modifié : `examples/dom-demo/capture-editor-v2.css` (présentation CSS du preview Capture). Ni moteur, ni géométrie logique des attaques, ni fiches auteurs, ni assets, ni IA, ni `global-assets`, ni autres dépôts touchés.
- Contrat de profondeur : en `arena--coop-2v2` *paysage*, adversaire principal au centre X 58 %, Y 26 %, largeur `min(24dvh,13rem)` ; second X 36 %, Y 28 %, largeur `min(23dvh,12.5rem)`. Les slots restent réels, mesurables par les capteurs de contacts / FX, sans `transform:scale()` ou réglage `--creature-display-scale` caché ; 1v1 inchangé.
- Contrat UI solo : uniquement sous `data-local-control-mode="solo-dual"` et paysage, `coop-command-stack` devient une rangée à deux colonnes (carte alliée compacte à gauche, HUD **unique** plus large à droite). Carte locale principale réduite ; compétences et énergie plus lisibles grâce à l'élargissement, Esquive adjacente au dock, Rappel inchangé. Les surfaces de tap sur les deux combattants et leurs cartes sont préservées.
- IA alliée historique reste le défaut. Futur humain distant distinct. Le changement de pilote demeure une opération UI gratuite ; son comportement déjà validé ne change pas. Les distances jeu et les échelles auteurs restent propriétaires des contrats existants.
- Le rendu ne promet pas une meilleure expérience artistique sans test physique : essai Android paysage et feedback utilisateur obligatoires, notamment quatre combattants simultanés, accès aux 5 compétences, Esquive/Rappel, ciblage allié et projectiles en mouvement.

## Test et qualité
- Nouveau test `tests/unit/solo-2v2-landscape-layout-v1.test.mjs` ajouté d'abord en RED : interdiction du vieux dock empilé et de la perspective trop rapprochée, vérification de la séparation mode solo / IA, des commandes natives existantes et du 1v1.
- CI sur première implémentation a signalé une seule sentinelle historique `tests/unit/capture-enemy-landscape-placement-v1.test.mjs` imposant textuellement anciennes positions. Mise à jour conservatrice : vérifie les **nouvelles** positions, tailles visuelles et surtout l'absence de transformation du scale auteur, et garde une assertion du CSS 1v1 existant ; aucune sentinelle supprimée.
- Workflow porte finale : Node Foundation + Chromium Firestorm + Chromium bibliothèque 103 créatures SUCCESS sur le SHA final, checkpoint GREEN exact, fast-forward sous lease sur `gh-pages` après contrôle de concurrence, puis CI/Pages post-publication SUCCESS. Le test utilisateur reste distinct.
