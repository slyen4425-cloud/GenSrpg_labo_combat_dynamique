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
6. créer `work/lab-<chantier>-YYYY-MM-DD` depuis exactement ce checkpoint ;
7. déclarer le périmètre dans `LAB_CURRENT_WORK.md`.

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

`main` est une ligne stable.

Le développement fonctionnel direct sur `main` est interdit.

Un retour sur `main` doit provenir d'un jalon GREEN et d'une validation appropriée.

## 7. Reprise de conversation

Une reprise doit pouvoir être faite uniquement avec GitHub.

Ordre :

1. charte ;
2. roadmap ;
3. current work ;
4. architecture ;
5. checkpoint de départ ;
6. dernier checkpoint GREEN ;
7. branche de travail ;
8. CI.

La mémoire conversationnelle n'est pas une source de vérité.
