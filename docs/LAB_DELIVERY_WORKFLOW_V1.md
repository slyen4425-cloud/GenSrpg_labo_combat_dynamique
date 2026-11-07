# Labo Combat — livraison unique directement depuis main

Décision explicite de l'auteur : **7 novembre 2026**. Ce protocole remplace l'ancienne alternance main / gh-pages en tant que deux éditeurs à faire évoluer séparément.

## 1. Une seule version fonctionnelle

- `main` est le code officiel du moteur, des contrats, de l'éditeur et des contenus approuvés. Les consommateurs GenSrpg lisent uniquement les contrats/versions certifiés de `main`.
- Le site public `https://slyen4425-cloud.github.io/GenSrpg_labo_combat_dynamique/` **doit publier directement le contenu de `main`**, et non suivre un second développement sur `gh-pages`.
- `gh-pages` est une branche historique à préserver pour retour arrière/provenance. Elle n'est plus autorisée à recevoir des fonctionnalités, des retouches UI ou des imports d'auteur en parallèle. Ne pas supprimer son historique.
- `global-assets` reste le référentiel des médias canoniques réutilisables, distinct de l'autorité fonctionnelle du Labo. Il ne doit pas devenir une deuxième copie complète du site ni une source concurrente de règles.
- Une demande = un lot court, un commit `main`, une publication publique au même contenu. L'exception `work/*` sert seulement de tampon temporaire pour un changement risqué ; elle ne crée jamais un deuxième labo.

## 2. Bascule technique nécessaire (à vérifier, jamais prétendre déjà faite)

La publication GitHub Pages a historiquement utilisé `gh-pages`. **Avant de déclarer la bascule terminée**, dans le dépôt GitHub :

1. Sous `Settings → Pages → Build and deployment`, choisir `Deploy from a branch`, puis **`main`** et **`/(root)`**, et enregistrer.
2. Vérifier que le déploiement GitHub Pages a réussi sur le **SHA main exact**, que les URLs des pages et des assets sont accessibles en HTTPS et que l'éditeur fonctionne sur PC et smartphone paysage.
3. Comparer le code servi au commit `main`; si une ancienne version reste visible, corriger le propriétaire réel du cache ESM sans créer de nouvelle copie de site.
4. Tant que les réglages Pages et l'HTTPS n'ont pas été confirmés, conserver le statut **NON VALIDÉ** et ne pas supprimer `gh-pages`.

Contrôle d'inventaire avant bascule le 7 novembre 2026 : `main@1b4f650e91d785ddc7a3f65c3f0eb50c845899c1` et `gh-pages@cb9befb137eda6f453f17b29b315ae0803ee461e`. Sur les arbres Git exacts, **0 fichier exclusif à gh-pages**, 21 fichiers exclusifs à main, 15 fichiers communs de contenus différents et 1 929 blobs identiques. Il ne faut pas fusionner aveuglément 1 268 commits propres à l'historique de gh-pages : l'édition actuelle de main est quasiment le même arbre, avec les ajouts validés.

## 3. Cycle de modification après bascule

1. Lire charte, roadmap, current work, checkpoint policy ; relever le SHA exact de `main`.
2. Créer un checkpoint START **léger** pointant sur le commit de départ, identifier les fichiers/domaines touchés ; jamais de duplications d'assets.
3. Ajouter le test de régression RED et le correctif minimal via le propriétaire officiel. Pour les petits lots explicitement acceptés, un commit direct `main` suffit, sans PR supplémentaire vers un autre labo.
4. CI sur le nouveau SHA `main`, tests unitaires + navigateur réel ; le site se déploie depuis la même source `main`. Tester l'éditeur réellement servi et l'ancien lien public. Vérifier la preuve HTTPS et la préservation des sources auteur.
5. Si KO : diagnostic de la cause, retour arrière par commit `git revert` depuis le checkpoint, pas de force-push ; corriger puis nouveau test. Si GREEN : checkpoint final et journal de reprise.

## 4. Ressources et sécurité

Une seule bibliothèque canonique ; interdiction de recopier des arbres d'assets, des ZIP de vitrine ou tout le moteur entre plusieurs publications. Budget de 900 Mio, sans perte d'assets auteur ni suppression d'anciennes sauvegardes. Le Labo Combat ne modifie directement ni le dépôt GenSrpg ni le Labo Exploration. Toute dépendance dynamique aux assets canoniques doit conserver sa résolution d'URL et son cache correctement versionné.

**Critère de fin** : un commit `main` unique, CI valable sur son SHA, URL publique qui sert effectivement les mêmes fonctionnalités, et possibilité de rollback documentée. Un commit ou une PR verts seuls ne prouvent pas que le public a reçu la nouvelle version.
