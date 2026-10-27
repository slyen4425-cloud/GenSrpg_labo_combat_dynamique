# Fireball Author Correction V4

Date : 2026-10-07

## Base

Base exacte :
`9f7bb7e0e10fab9d058d65808047ead24f5961dd`

Checkpoint de départ :
`checkpoint/lab-start-fireball-author-correction-v4-2026-10-07`

Branche :
`work/lab-fireball-author-correction-v4-2026-10-07`

Cette base contient le lot GREEN `Capture Skill Export Fidelity V1`.

## Motif

Retour utilisateur explicite après test de la Boule de feu intégrée :

- le point de sortie configuré devait être `mouth` / Bouche et non Centre ;
- le décalage de cast configuré devait être horizontal `30` ;
- le décalage vertical devait être `0`.

La charte §33 autorise une correction volontaire des données auteur lorsqu'elle est fondée sur un retour utilisateur explicite.

## Correction auteur

Fichier canonique :
`data/capture/showcase/fireball.capture-skill-transfer-v1.json`

Quatre valeurs seulement ont été corrigées sémantiquement :

- `presentation.visual.cast.anchor: null -> "mouth"` ;
- `presentation.visual.travel.anchor: null -> "mouth"` ;
- `presentation.visual.cast.offsetX: 0 -> 30` ;
- `presentation.visual.cast.offsetY: 30 -> 0`.

Le Human Editor utilise une référence de socket commune pour cast/travel ; le socket `mouth` est donc conservé sur les deux slots.

Toutes les autres valeurs auteur V3 restent inchangées :
- identité / niveau ;
- coût énergie ;
- préparation / trajet / récupération / cooldown ;
- dégâts ;
- assets icon/cast/travel/impact ;
- scales ;
- layers ;
- audio ;
- feedback FX.

## Autorité

Aucun nouveau format d'export ni aucune seconde fiche n'a été créé.

La fiche Showcase existante `fireball` reste l'unique preset auteur durable et son intégration continue de passer par :
`importCaptureTransferJsonV1 -> planCaptureTransferImportV1(mode:"replace") -> applyCaptureTransferPlanToEditorStateV1`.

Le test historique de remplacement vérifie toujours :
- `replace-skill` ;
- même ID `fireball` ;
- nombre de skills inchangé ;
- aucune duplication ;
- nouvelles valeurs présentes après remplacement.

## TDD

### RED

Commit :
`000eb77040979da5634fc17d0a49acc896f2bee7`

CI :
`37631531458`

Résultat attendu :
- la sentinelle V4 échoue sur `cast.anchor` : `null !== "mouth"` ;
- la sentinelle "aucune autre valeur auteur modifiée" reste PASS.

### Correction des données

Commit :
`255f36113bb57601d41f643cac2b52a8c7aef8df`

La CI suivante `37631674628` est restée rouge uniquement parce que l'ancienne sentinelle V3 exigeait encore les anciennes valeurs `anchor:null / offsetY:30`.

### Mise à jour de la sentinelle historique

Commit :
`7d7c4f214da4c719f27fe54a8e3c404154aefe06`

L'ancienne sentinelle V3 conserve son rôle de test du vrai chemin de remplacement mais simule désormais l'ancien état erroné puis vérifie la correction V4.

### GREEN fonctionnel

HEAD :
`7d7c4f214da4c719f27fe54a8e3c404154aefe06`

CI :
`37631687787`

Résultat :
- 1221 / 1221 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

Modifié :
- `data/capture/showcase/fireball.capture-skill-transfer-v1.json`.

Tests :
- ajout `tests/unit/capture-showcase-fireball-author-v4.test.mjs` ;
- mise à jour `tests/unit/capture-showcase-fireball-author-v3.test.mjs`.

## Domaines protégés / inchangés

Aucun changement dans :
- Human Editor export mechanism ;
- Combat Runtime ;
- Combat Session ;
- Damage / Status ;
- collision / projectile ;
- FX renderer ;
- Audio Runtime ;
- Dodge ;
- Roster ;
- autres presets Showcase ;
- dépôt GenSrpG principal ;
- `main`.

## Validation utilisateur

Dans la preview finale :
1. charger Boule de feu ;
2. vérifier `Point de sortie = Bouche` ;
3. vérifier cast `Décalage horizontal = 30` ;
4. vérifier cast `Décalage vertical = 0` ;
5. exporter la capacité ;
6. réimporter le JSON ;
7. vérifier que les trois valeurs restent identiques.

Statut : GREEN technique. Validation utilisateur requise.
