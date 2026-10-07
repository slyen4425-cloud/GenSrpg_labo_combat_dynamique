# Point de reprise courant — 2026-10-07

## Régression active

Creature Library Regression V1

Branche :
`work/lab-creature-library-regression-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-creature-library-regression-v1-2026-10-07`

Base exacte reproduite :
`36e90e6152b079584f1f4f8aafa53494435befda`

Preview concernée :
`preview/lab-burrow-visual-v1-2026-10-07`

## Symptôme utilisateur

Dans la preview publiée après Maraileron + Burrow Visual V1 :
**plus aucune créature visible dans la bibliothèque de l'éditeur**.

Le lot précédent n'est donc pas validable utilisateur malgré CI verte.

## Règle charte appliquée

§11 :
1. reproduire ;
2. identifier le premier changement responsable ;
3. corriger la cause démontrée ;
4. ajouter une sentinelle de régression ;
5. ne pas ajouter de fallback concurrent.

§26 / §33.8 :
la CI seule ne suffit pas pour une UI ; le vrai chemin éditeur et la validation smartphone sont obligatoires.

## Hypothèses à départager par tests

A. Le batch Showcase vide ou remplace à tort `configuredCreatures`.
B. Le chargement historique des 110 créatures est bloqué par une dépendance parallèle non liée à la bibliothèque.
C. Une erreur UI efface le select après hydratation.
D. Un preset auteur déclenche une exception qui contourne le rechargement complet.

Aucune correction n'est autorisée avant reproduction.

## Owners protégés

- `configuredCreatures` reste l'unique owner de la bibliothèque active ;
- Capture Transfer reste l'unique chemin de remplacement de presets ;
- Demo UI ne devient pas une seconde source ;
- Combat Runtime / Animation / FX / collision restent hors périmètre.

## Fichiers autorisés

- tests de régression du démarrage Human Editor ;
- `src/ui/capture-editor-human-v2.js` uniquement si la cause est démontrée dans l'initialisation ;
- helper pur éventuellement extrait pour rendre le vrai chemin testable ;
- `docs/LAB_CURRENT_WORK.md` ;
- rapport dédié.

## Domaines protégés

Ne pas modifier :
- données auteur Maraileron / Morsure de marée ;
- Combat Runtime / Session / Timing ;
- Animation Core / Burrow Visual ;
- FX ;
- collision ;
- Roster ;
- Dodge ;
- audio métier ;
- main ;
- Zombicide-40k ;
- Exploration.

## Critère de fin

- bibliothèque non vide sur le vrai chemin ;
- les 110 historiques restent présents ;
- Maraileron remplace son ID stable ;
- Moussados remplace son ID stable ;
- Loup est ajouté sans effacer les historiques ;
- erreurs de ressources non liées ne doivent pas vider silencieusement la bibliothèque si elles ne sont pas nécessaires à son contenu ;
- CI verte ;
- nouvelle preview ;
- validation smartphone Sylvain.
