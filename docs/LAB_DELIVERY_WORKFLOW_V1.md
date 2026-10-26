# Protocole de livraison unique — Combat Lab

Date : 2026-10-26. Complément opérationnel à LAB_CHARTE.md (§14–18, §26–28, §32, §34).

## 1. Trois rôles, aucune ambiguïté

- `gh-pages` : **version réellement exécutée** par l'éditeur public. Les modifications fonctionnelles y arrivent seulement après tests et validation.
- `global-assets` : **autorité des médias consommés par l'éditeur**. Le catalogue `data/assets/catalog/global-visual-assets.v1.json` et les fichiers sous `assets/library/` doivent être cohérents sur cette branche.
- `work/<lot>` : branche temporaire de préparation depuis le SHA publié pertinent. `main` n'est **pas** la base du laboratoire publié ; ne jamais y chercher par défaut l'éditeur ou ses médias.

Ces trois rôles ne doivent pas devenir trois chantiers indépendants. **Une demande = un lot coordonné = une seule livraison utilisateur.**

## 2. Démarrage obligatoire de chaque fil

1. Lire charte, roadmap, current work, architecture et ce protocole directement sur GitHub.
2. Résoudre les SHAs exacts de `gh-pages` et `global-assets` ; vérifier les chemins et propriétaires réels dans le code, pas dans la mémoire du fil.
3. Relever l'URL de l'éditeur et la branche d'où elle charge son catalogue.
4. Créer le checkpoint START et la branche de travail du lot ; documenter la portée et les tests dans `LAB_CURRENT_WORK.md`.
5. Si plusieurs fils travaillent en parallèle, relire les SHAs distants avant chaque publication ; ne jamais écraser un changement concurrent.

## 3. Pipeline obligatoire pour chaque média

`source validée -> extraction/normalisation -> fichiers physiques -> manifeste -> catalogue global-assets -> résolution par l'éditeur gh-pages -> test navigateur réel -> validation utilisateur`.

Pour chaque `assetId`, contrôler le chemin effectif `GLOBAL_VISUAL_LIBRARY.baseUrl`, la branche, l'URL du catalogue et sa révision de cache. Vérifier aussi l'absence d'ancien ID concurrent et le rendu de la preview. Un dépôt ZIP seul ne constitue jamais une livraison.

Si l'asset est déjà dans `gh-pages` mais pas dans `global-assets`, le travail est **incomplet**. Si l'asset est dans `global-assets` mais invisible dans l'éditeur, le travail est **incomplet**.

## 4. Publication coordonnée et atomique du point de vue utilisateur

1. Préparer les fichiers et le catalogue sur la branche de travail ; vérifier intégrité, orientation, format, frames et provenance.
2. Tester les chemins de chargement réels et les sentinelles de non-régression.
3. Publier `global-assets` et vérifier que les médias + catalogue sont accessibles.
4. Publier `gh-pages` uniquement quand le catalogue attendu est disponible, avec révision de cache actualisée si nécessaire.
5. Tester l'URL publique de l'éditeur, ouvrir le sélecteur concerné et vérifier que l'asset est réellement proposé et prévisualisé.
6. Vérifier CI, checkpoint GREEN au SHA exact et journal de reprise. Si la CI est déjà rouge pour des tests historiques, documenter précisément les échecs, ne pas les contourner ni déclarer GREEN.
7. Ne donner un rapport final qu'après les étapes précédentes, ou annoncer explicitement le blocage réel. Ne pas faire valider à l'utilisateur des étapes intermédiaires techniques.

## 5. Responsabilités et reprise inter-fils

- Un seul registre actif par type d'asset, un seul propriétaire de chargement. Ne jamais créer de catalogue de secours.
- Les scripts de publication sont réutilisables et versionnés ; éviter les opérations manuelles répétées.
- Les dépôts ZIP sont des sources d'entrée, pas des destinations runtime.
- `LAB_CURRENT_WORK.md` indique : lot, branche, base SHAs, source ZIP/sha256, assets concernés, étapes faites/restantes, CI, liens et prochaine action.
- Une nouvelle conversation reprend ce journal et les SHAs réels ; elle ne repart pas d'une branche historique par intuition.
- Un lot n'est pas « terminé » parce que GitHub contient les fichiers : **l'éditeur public doit les exposer**.

## 6. Contrôle de livraison en une phrase

« Les données sont sur la bonne branche, le catalogue canonique pointe sur les bons fichiers, l'éditeur public les affiche et le test réel passe. »

Tant qu'une proposition de cette phrase n'est pas démontrée, statut PARTIEL.
