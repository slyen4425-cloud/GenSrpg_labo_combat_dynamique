# Creature Library Regression V1

Date : 2026-10-07

## Incident

Retour utilisateur sur la preview :
`36e90e6152b079584f1f4f8aafa53494435befda`

Symptôme :
la bibliothèque de créatures de l'éditeur pouvait afficher
`Aucune créature enregistrée`.

Ce symptôme invalide la validation utilisateur du lot précédent même si la CI était verte.

## Base

Checkpoint de départ :
`checkpoint/lab-start-creature-library-regression-v1-2026-10-07`

Branche :
`work/lab-creature-library-regression-v1-2026-10-07`

Base exacte :
`36e90e6152b079584f1f4f8aafa53494435befda`

## Diagnostic

### 1. Les données n'étaient pas perdues

Un test du vrai jeu de données reconstruit le démarrage avec :
- catalogue historique Monster Capture ;
- canonicalisation des alias ;
- capacités natives ;
- capacités Capture ;
- loadouts historiques ;
- tous les presets Showcase ;
- vrai Capture Transfer batch.

Résultat :
- source historique brute : 110 entrées ;
- 8 alias historiques volontairement écartés par `canonicalCaptureCreatureRecordsV1` ;
- bibliothèque historique active : 102 créatures canoniques ;
- Maraileron présent ;
- Moussados présent ;
- Loup absent du catalogue historique ;
- après les presets Showcase : 103 créatures actives ;
- Maraileron remplace `crea_maraileron` ;
- Moussados remplace `crea_mossback` ;
- Loup est ajouté comme `crea-loup` ;
- aucune créature canonique historique n'est supprimée.

Le Transfer batch n'est donc pas la cause du vidage.

### 2. Cause de l'écran vide

Le Human Editor attendait un seul `Promise.all` contenant simultanément :
- catalogue d'assets visuels ;
- catalogue audio privé ;
- capacités natives ;
- registre + catalogue de créatures ;
- progression ;
- métadonnées visuelles des créatures.

L'hydratation de `configuredCreatures` n'était exécutée qu'après succès de **toutes** ces dépendances.

Conséquence :
une erreur de ressource purement optionnelle de présentation
(asset, audio ou metadata visuelle)
pouvait rejeter le `Promise.all` avant le remplissage de la bibliothèque.
L'UI restait alors sur son état initial vide.

C'était un couplage d'initialisation préexistant.
Les lots Maraileron Author Export V1 et Burrow Visual V1 n'avaient pas modifié ce bloc avant ce correctif, mais leur preview a exposé le défaut lors du test utilisateur.

Le détail de la requête optionnelle ayant échoué sur le smartphone n'est pas disponible dans les logs GitHub/CI ; le défaut architectural permettant qu'une telle erreur vide la bibliothèque est, lui, reproduit et supprimé.

## Correctif

Nouveau helper pur :
`src/ui/capture-editor-startup-v1.js`

Il sépare :

### Dépendances essentielles — toujours bloquantes

- capacités natives nécessaires ;
- registre + catalogue de créatures ;
- règles de progression.

Une erreur de ces dépendances continue à rejeter le démarrage.

### Ressources de présentation — non bloquantes pour la bibliothèque

- catalogue d'assets visuels ;
- catalogue audio privé ;
- métadonnées visuelles de créatures.

Elles sont collectées via `Promise.allSettled`.

En cas d'échec :
- aucun second owner n'est créé ;
- `configuredCreatures` continue d'être rempli ;
- la bibliothèque reste sélectionnable ;
- les bindings visuels dépendants de ressources absentes ne sont simplement pas appliqués ;
- les profils FX sont indiqués indisponibles si leurs bibliothèques nécessaires ne sont pas prêtes ;
- un avertissement de présentation est affiché.

## Ownership

Inchangé :
- `configuredCreatures` = unique owner des créatures ;
- `configuredSkills` = unique owner des capacités ;
- Capture Transfer = unique chemin de remplacement de presets ;
- Human Editor = projection UI.

Aucun fallback de données créature parallèle n'a été ajouté.

## TDD

### Sentinelle du jeu de données réel

Commit initial :
`9961bad63f46055243d821836f71aef077c8cf65`

Le premier RED a révélé un détail historique utile :
110 entrées brutes deviennent 102 canoniques à cause de 8 alias documentés.

Après correction de l'attente du test :
commit `4d7a4a5ced01eaea243cd249d5908b5eb08b1866`,
le vrai batch confirme que la bibliothèque reste entière et termine à 103 créatures.

### RED isolation startup

Commit :
`2802725e1533f6f1c8cbe93e53f1bdf061ddae39`

Le test exige qu'une panne des trois ressources de présentation n'empêche jamais de récupérer les dépendances cœur de la bibliothèque.

### GREEN

Helper :
`6ed012244e20332e1b026f3a727b11542ba38a1c`

Raccord Human Editor :
`7d31a81a7e868d3432bcb7220a41ee978af1dcd5`

Sentinelle listener préservée :
`96af0937247ee4bcbb1e9625b63f7af56a8d8166`

CI :
`37666680690`

Résultat :
- 1237 / 1237 PASS ;
- 0 FAIL ;
- structure / frontières / indépendance : OK.

## Périmètre modifié

Ajoutés :
- `src/ui/capture-editor-startup-v1.js`
- `tests/unit/capture-editor-startup-v1.test.mjs`
- `tests/unit/capture-editor-creature-library-regression-v1.test.mjs`

Modifié :
- `src/ui/capture-editor-human-v2.js`

## Domaines protégés

Aucun changement de :
- exports auteur Maraileron / Morsure de marée ;
- Capture Transfer ;
- Combat Runtime / Session / Timing ;
- Burrow Visual / Animation Core ;
- FX Core ;
- collision ;
- Roster ;
- Dodge ;
- main ;
- Zombicide-40k ;
- Exploration.

## Validation utilisateur

Le correctif est GREEN technique uniquement.

À vérifier sur smartphone :
1. ouvrir la preview ;
2. attendre le chargement ;
3. ouvrir la bibliothèque créatures ;
4. confirmer qu'elle contient de nouveau les créatures historiques ;
5. confirmer Maraileron, Moussados et Loup ;
6. sélectionner Maraileron ;
7. lancer Morsure de marée ;
8. vérifier l'animation burrow.

Aucun GREEN utilisateur avant ce retour.
