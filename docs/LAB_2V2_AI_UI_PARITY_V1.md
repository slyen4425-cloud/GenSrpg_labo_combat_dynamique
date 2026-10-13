# Labo Capture — 2v2 IA et solo : présentation commune et décalage adversaire V1

Date : 13 octobre 2026.

## Demande et validation utilisateur
- **1v1 : confirmé OK sur smartphone** par l'auteur après régression précédente ; son rendu est gelé.
- **2v2 solo-dual : disposition de référence validée pour poursuivre**, barre compacte et carte alliée petite au centre-bas, switch de deux créatures existant et conservé. Ce n'est pas une validation complète de toutes les mécaniques.
- **2v2 avec IA alliée** : afficher **la même disposition compacte** que le 2v2 solo (une seule barre de commandes du joueur, petit portrait/état/action/PV de l'allié au centre-bas) ; ne pas déplacer ou piloter les actions IA.
- **Deux adversaires 2v2** : les déplacer légèrement à droite dans l'arène, sans changer Y, largeur ou échelle auteur.

## Traçabilité / source unique
- Base LIVE publiée et double CI/Pages SUCCESS : `gh-pages@1588908ef9686705890564278e34a06f7b365114` (Laboratory CI `38425091518`, Pages `38425091600`).
- Checkpoint de départ pris avant code : `checkpoint/lab-start-2v2-ai-ui-parity-v1-2026-10-13`, branche `work/lab-2v2-ai-ui-parity-v1-2026-10-13`.
- La présentation visuelle appartient exclusivement à `examples/dom-demo/capture-editor-v2.css`. La scène `arena--coop-2v2` est **partagée entre 1v1 et 2v2** ; ne jamais l'utiliser seule comme garde du nouveau placement. Le propriétaire de l'appartenance format `src/ui/combat-2v2-test-ui.js` expose déjà `data-combat-active-count` dérivé de `BattleFormat` canonique.
- Les **14 sélecteurs** du bloc de présentation compact ont été requalifiés de `[data-local-control-mode="solo-dual"]` vers `.arena--coop-2v2[data-combat-active-count="2"]`. Cela applique les **mêmes valeurs** compactes dans le vrai 2v2 IA et le vrai 2v2 solo, sans dupliquer un second HUD ni modifier le contrôle.
- L'IA reste `ai-ally` en mode IA, `human-local` pour les deux créatures en mode solo-dual (choix optionnel existant) ; le switch, la cible, l'IA ennemie, les cooldowns, l'énergie et le Roster Session ne changent pas. La carte alliée continue de lire les données d'état déjà exposées (`data-combat-hp="local-2"`, `data-combat-action="local-2"`, `data-combat-actor-charge="local-2"`).
- Positions d'ancrage X des deux adversaires **en 2v2 seulement** : `opponent-1` 58 % → 63 % ; `opponent-2` 36 % → 41 %. Leur Y 26/28 %, dimensions 24/23dvh et `displayScale` auteur restent inchangés. Leurs vrais slots DOM sont déplacés, et les systèmes FX/collision continuent de lire la géométrie affichée.
- Les coordonnées originales du 1v1 (`far-y 33/34 %`, `opponent X 77 %`) sont inchangées. Le raccourci `Réserves adverses` rendu disponible par le lot précédent, les cartes adverses séparées, l'Esquive et Rappel restent identiques.
- Aucun JS de gameplay, HTML, assets, créatures, capacités, UI 1v1, `main`, `global-assets`, GenSrpG principal ou Exploration modifiés.

## Tests, maintenance des sentinelles
- RED avant code via `tests/unit/capture-2v2-ai-solo-ui-parity-v1.test.mjs` (HUD IA pas encore compact, positions anciennes).
- GREEN attendu sur le code : contrat de format 1 vs 2 vrais actifs, petit dock/carte alliée/icônes/Esquive pour IA + solo, deux positions X nouvelles sans transform ni scales auteurs, carte statut IA et boutons natifs.
- Sentinelles historiques des coordonnées 2v2 58/36 et du style réservé à solo-dual adaptées aux nouvelles exigences **uniquement sur les assertions devenues incompatibles**, sans supprimer leurs contrôles du 1v1.
- Porte finale : CI Foundation + Chromium Firestorm + Chromium bibliothèque créatures sur le SHA documentaire exact, checkpoint GREEN même SHA, comparaison avec `gh-pages`, fast-forward sous lease sans écrasement concurrent, CI + Pages post-publication SUCCESS.
- Essai esthétique et tactile **Android paysage par l'auteur encore requis** pour la variante IA 2v2 et le nouveau décalage de perspective. Les tests structurels ne prouvent pas seuls l'ergonomie.
