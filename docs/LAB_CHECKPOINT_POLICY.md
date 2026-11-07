# Laboratoire Combat Dynamique — Politique de checkpoints

## 1. But

Chaque chantier doit être traçable, reproductible et réversible.

## 2. Avant tout chantier

Obligatoire :

1. lire `LAB_CHARTE.md` ;
2. lire `LAB_ROADMAP.md` ;
3. lire `LAB_CURRENT_WORK.md` ;
4. relever le SHA exact de la base ;
5. créer `checkpoint/lab-start-<chantier>-YYYY-MM-DD` sur ce SHA ;
6. déclarer le périmètre et les tests dans `LAB_CURRENT_WORK.md` ;
7. modifier `main` directement en un lot court, ou utiliser exceptionnellement `work/*` comme espace de validation **temporaire**, jamais comme deuxième laboratoire ;
8. vérifier le SHA de `main` à nouveau juste avant toute écriture pour éviter d'écraser un travail concurrent.

## 3. Pendant le chantier

Chaque micro-lot doit rester petit.

Créer un checkpoint intermédiaire lorsqu'un état important est :

- cohérent ;
- testé ;
- utile comme rollback.

Ne jamais appeler GREEN un état partiellement testé.

## 4. Checkpoint GREEN

Nom :

`checkpoint/lab-<chantier>-green-YYYY-MM-DD`

Conditions minimales :

- tests prévus verts ;
- vraie chaîne testée ;
- revue des fichiers modifiés ;
- documentation synchronisée ;
- absence de dépendance interdite ;
- aucune régression sentinelle connue.

## 5. Régression

En cas de régression :

- ne pas empiler une rustine ;
- comparer au dernier GREEN ;
- identifier le premier commit fautif ;
- corriger la cause ;
- ajouter un test ;
- seulement ensuite recréer un GREEN.

## 6. Main

**Décision de l'auteur du 7 novembre 2026** : `main` est l'unique autorité de développement et de publication. Les modifications directes, petites, traçables et réversibles sont désormais autorisées. Chaque lot exige un checkpoint préalable, un test ciblé avant modification du comportement, un seul commit cohérent puis la CI sur le SHA exact. On ne déclare GREEN qu'après tests réels et preuve HTTPS du contenu de `main`.

Si la livraison est mauvaise, utiliser `git revert` depuis l'état connu : ne pas réécrire l'historique, les médias ni les sauvegardes. `gh-pages` devient historique / lecture seule dès le basculement de la source Pages vers `main`.

## 7. Reprise de conversation

Une reprise doit pouvoir être faite uniquement avec GitHub.

Ordre :

1. charte ;
2. roadmap ;
3. current work ;
4. architecture ;
5. checkpoint de départ ;
6. dernier checkpoint GREEN ;
7. commit de livraison sur `main` (ou branche éphémère si exception documentée) ;
8. CI et preuve de déploiement HTTPS du même SHA.

La mémoire conversationnelle n'est pas une source de vérité.
