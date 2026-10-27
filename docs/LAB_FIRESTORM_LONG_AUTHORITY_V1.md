# Tempête de flammes — Autorité portée longue V1

Date : 2026-10-06

## Base

Base exacte :

`96ec3d4c513dd82060f7e8e6fd0abfd955634d2b`

Checkpoint de départ :

`checkpoint/lab-start-firestorm-long-authority-v1-2026-10-06`

Branche :

`work/lab-firestorm-long-authority-v1-2026-10-06`

## Symptôme utilisateur

Au troisième renforcement de Tempête de flammes, donc au rayon `long`, certains ticks semblaient manquer alors que le niveau maximum devait couvrir le camp adverse.

Le défaut pouvait être réellement gameplay : ce n’était pas uniquement un texte `-5` absent.

## Cause

`relationInRadius()` consultait la relation visuelle avant la règle canonique de portée longue.

En preview, `visibleZones` est alimenté par la géométrie réelle. Une mesure ponctuelle `false` au bord de l’ellipse pouvait donc annuler la garantie gameplay historique :

`long = couvre le camp adverse`

Cela rendait les ticks sensibles à de petites variations de silhouette / idle / scale.

## Correction

Owner modifié :

`src/core/combat/persistent-zone-runtime-v1.js`

La règle est maintenant :

1. si `radius === "long"`, la cible valide de la zone est dans la portée ;
2. sinon, la relation visuelle peut préciser short / medium ;
3. les fallbacks d’approche / distance restent inchangés.

Aucun rayon graphique n’a été agrandi.

Aucun offset n’a été ajouté.

## Invariants conservés

Tempête utilisateur reste :

- durée : 7000 ms ;
- tick : 1000 ms ;
- dégâts : 5 ;
- reactivation : reinforce ;
- max activations : 3 ;
- progression : short → medium → long ;
- présentation V8 et assets utilisateur inchangés.

Les domaines suivants ne sont pas modifiés :

- Combat Session ;
- renderer FX ;
- géométrie visible ;
- calcul de dégâts ;
- health feedback ;
- sprite / scale / offsets de zone ;
- CSS ;
- collision.

## TDD

### RED

CI :

`37436894198`

La nouvelle sentinelle exigeait qu’une zone `long` continue d’infliger son tick même lorsque la mesure visuelle instantanée rapporte la cible hors ellipse.

### Correction Runtime

Commit :

`bab6ac9855a76c9ecd08f159867396aeed40dc37`

Les sentinelles nouvelles passaient alors :

- niveau 3 `long` couvre le camp sans attaque ;
- `long` reste autoritaire face à une mesure visuelle `false` ;
- le tick produit une baisse réelle de PV ;
- le même tick produit `onHealthDelta { kind: "damage", amount: 5 }` ;
- `medium` continue de respecter une mesure visuelle hors zone.

Une seule ancienne sentinelle restait rouge parce qu’elle affirmait explicitement l’ancienne règle contradictoire : `long radius does not ignore a measured visible boundary`.

### Nettoyage de la contradiction historique

Commit :

`84b78bff39404946ffbbb8bddcb77573009611f6`

Le scénario de déplacement / ellipse reste protégé, mais il est maintenant exécuté au rayon `medium`, où cette frontière visuelle est bien la règle attendue.

Aucun code produit n’a été modifié pour faire passer ce dernier test.

### GREEN

CI :

`37439964865`

Résultat :

- 1119 tests ;
- 1119 PASS ;
- 0 FAIL.

## Validation smartphone

À vérifier :

1. renforcer Tempête jusqu’à `long` ;
2. rester immobile dans le camp adverse sans lancer d’attaque ;
3. observer les ticks toutes les secondes : les PV doivent baisser de 5 de façon régulière ;
4. vérifier que le `-5` accompagne chaque baisse réelle ;
5. laisser les créatures idle / changer légèrement de scale : `long` ne doit plus clignoter entre dedans / dehors ;
6. vérifier que `medium` reste dépendant de la vraie occupation visuelle.

État : GREEN technique jusqu’à validation utilisateur.
