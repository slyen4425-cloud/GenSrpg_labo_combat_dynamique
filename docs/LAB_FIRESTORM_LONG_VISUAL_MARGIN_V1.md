# Tempête de flammes — marge visuelle portée longue V1

Date : 2026-10-06

## Base

Base exacte :

`96ec3d4c513dd82060f7e8e6fd0abfd955634d2b`

Checkpoint de départ :

`checkpoint/lab-start-firestorm-long-visual-margin-v1-2026-10-06`

Branche :

`work/lab-firestorm-long-visual-margin-v1-2026-10-06`

## Retour utilisateur

Après restauration de la configuration auteur de Tempête de flammes, le comportement était globalement correct mais le niveau maximum restait intermittent : certains ticks `-5` apparaissaient et d'autres non alors que la zone semblait presque couvrir la cible.

## Règle produit préservée

Le lot GREEN utilisateur du 2026-10-04 protège le principe suivant :

- la zone réellement affichée est aussi la zone réellement mesurée ;
- une cible réellement hors de l'ellipse visuelle ne prend pas les dégâts ;
- la zone suit sa source ;
- le renderer fournit la géométrie mais le Persistent Zone Runtime reste seul propriétaire de l'application des dégâts.

Une hypothèse temporaire `long = touche toujours` a été testée séparément puis rejetée car elle cassait cette règle validée. Elle n'est pas présente dans ce lot.

## Cause retenue

La configuration auteur actuelle de Tempête utilise :

- `displayScale = 1.2` ;
- `displayScaleX = 2.5` ;
- `displayScaleY = 0.8` ;
- offsets X/Y = 0.

La croissance centrale des rayons était :

- short = 1 ;
- medium = 1.45 ;
- long = 1.9.

Au niveau long, la zone aplatie restait très proche de la silhouette adverse. Comme la relation spatiale est volontairement mesurée sur le rendu réel, une petite variation de pose / idle / source pouvait placer la silhouette juste dedans puis juste dehors d'un tick à l'autre.

Le symptôme était donc un bord visuel trop proche, pas un second timer, une perte de tick Runtime ni un défaut de health feedback.

## Correction

Un seul coefficient central a changé dans :

`src/adapters/renderer/dom-skill-fx.js`

Avant :

`long: 1.9`

Après :

`long: 2.1`

Inchangés :

- short = 1 ;
- medium = 1.45.

Avec la configuration auteur actuelle, cela donne au niveau long :

- scale X effectif = `1.2 × 2.5 × 2.1 = 6.3` ;
- scale Y effectif = `1.2 × 0.8 × 2.1 = 2.016`.

Le même node DOM est à la fois rendu et mesuré par `sampleZoneSpatialContext`. L'agrandissement reste donc parfaitement couplé :

`zone visible = emprise mesurée`.

Aucun rayon gameplay invisible supplémentaire n'est créé.

## TDD

### RED

Commit :

`4fd80d35a97f4d96ba93806ab95a88bb565bace5`

CI :

`37437849871`

Résultat :

- 1118 tests ;
- 1117 PASS ;
- 1 FAIL attendu ;
- seul échec : nouvelle marge long non encore appliquée.

### Implémentation

Commit produit :

`9a15677ead910cc2282fb369993f4b77ca107066`

Le premier run après implémentation n'avait qu'un échec de précision flottante dans la sentinelle :

`6.300000000000001` au lieu de la chaîne `6.3`.

Aucun comportement produit n'était en défaut.

La sentinelle compare maintenant numériquement avec tolérance.

Commit test :

`c1ee47de435181eff4ed7d5f6159cbc298cf36d7`

CI GREEN :

`37438145030`

Résultat :

- 1118 tests ;
- 1118 PASS ;
- 0 FAIL.

La sentinelle historique :

`visible range follows source movement, rejects outside and ellipse corners, and resumes without a target attack`

reste PASS. Cela garantit qu'une cible réellement hors du visuel ne subit toujours pas de dégâts.

## Fichiers fonctionnels modifiés

- `src/adapters/renderer/dom-skill-fx.js`

Tests :

- `tests/unit/persistent-zone-visual-ux-v2.test.mjs`

Documentation :

- `docs/LAB_CURRENT_WORK.md`
- ce rapport.

## Domaines protégés / inchangés

Aucun changement dans :

- fichier auteur `cap_fire_atk_6` ;
- Combat Runtime ;
- Combat Session ;
- Persistent Zone Runtime ;
- calcul des dégâts ;
- health feedback ;
- géométrie opaque des créatures ;
- offsets de zone ;
- displayScale auteur ;
- durée 7000 ms ;
- tick 1000 ms ;
- dégâts 5 ;
- short / medium ;
- calques corrigés précédemment.

## Validation smartphone demandée

1. activer Tempête trois fois pour atteindre `long` ;
2. laisser la cible immobile et ne lancer aucune attaque ;
3. observer plusieurs ticks successifs : tant que la silhouette reste visiblement dans les flammes, chaque tick doit produire la perte de PV correspondante ;
4. vérifier que la zone max est légèrement plus large qu'avant ;
5. tester une cible réellement hors des flammes : aucun dégât ne doit être appliqué ;
6. vérifier rapidement medium : son emprise ne doit pas avoir changé.

État : GREEN technique, validation smartphone utilisateur attendue.
