# Cendre aveuglante — Export auteur V2

Date : 2026-10-06

## But

Intégrer la nouvelle configuration utilisateur de `Cendre aveuglante` sans reconstruire la capacité, sans fusion champ par champ et sans créer de seconde autorité.

ID stable :

`cap_fire_special_1`

Source utilisateur :

`gensrpg-capture-skill-cap_fire_special_1(1).json`

La procédure suit `LAB_CHARTE.md §33` : l'export de l'éditeur est la source de vérité.

## Base

Base exacte :

`7992bbfca54236af05b1e66cd03053ee52e44fe0`

Checkpoint de départ :

`checkpoint/lab-start-cendre-aveuglante-author-export-v2-2026-10-06`

Branche :

`work/lab-cendre-aveuglante-author-export-v2-2026-10-06`

## Audit avant remplacement

La fiche Showcase existante était plus ancienne :

- `travelMs = 400` ;
- `cooldownMs = 30000` ;
- statuts à `8000 ms` ;
- Cast physique ;
- projectile Terre ;
- impact Nature ;
- status visual par sprite Téléportation.

Le nouvel export utilisateur référence uniquement des assets déjà présents dans les propriétaires autoritaires.

### Visuels vérifiés

- `core:icon-skill-poison-cloud-01`
- `pack:capture:sprite-projectile-shadow-01`
- `pack:capture:sprite-status-curse-01`

### Audio vérifié

- `gensrpg:sound:academie-01fc18a6`
- `gensrpg:sound:genrpg-pack2-742f6521`

Aucun nouvel asset, catalogue, renderer ou fallback n'a été créé.

## Données auteur intégrées

### Gameplay

- niveau requis : `10` ;
- énergie : `3` ;
- préparation : `1500 ms` ;
- trajet : `800 ms` ;
- cooldown : `60000 ms` ;
- deux debuffs de `20000 ms` ;
- vitesse : `-50 points` ;
- physique : `-50 points`.

Aucun changement du moteur de statuts ou du Runtime n'était nécessaire.

### Présentation

Binding :

`SkillPresentationBinding V8`

Icône :

`core:icon-skill-poison-cloud-01`

Le nouvel export ne contient volontairement aucun sprite Cast.

Projectile :

- asset : `pack:capture:sprite-projectile-shadow-01` ;
- scale : `1.45` ;
- anchor : `mouth` ;
- playback : `loop`.

Impact :

- asset : `pack:capture:sprite-status-curse-01` ;
- scale : `1.45` ;
- durée : `350 ms`.

Audio :

- Cast : `gensrpg:sound:academie-01fc18a6` ;
- Impact : `gensrpg:sound:genrpg-pack2-742f6521`.

Status visual principal :

- mode : `tint` ;
- couleur : `#5b2067` ;
- opacité : `0.35` ;
- aucun sprite.

Feedback auteur conservé :

- glow violet ;
- flash bleu sombre ;
- shake ;
- projectile trail violet ;
- impact burst ;
- fumée violette ;
- cast burst.

## Remplacement canonique

Fichier autoritaire Showcase remplacé :

`data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json`

Le catalogue Showcase continue à déclarer le même fichier et le même ID.

Le test de remplacement vérifie :

1. l'ancienne Cendre existe avant import ;
2. `planCaptureTransferImportV1(..., mode: "replace")` renvoie `replace-skill` ;
3. l'ID reste `cap_fire_special_1` ;
4. `applyCaptureTransferPlanToEditorStateV1` remplace la fiche dans `configuredSkills` ;
5. la taille de `configuredSkills` ne change pas ;
6. les nouvelles valeurs auteur sont présentes après remplacement.

Aucune seconde fiche n'est créée.

## Starter FX

La sentinelle historique `capture-fx-starter-safe-apply-v1.test.mjs` protégeait l'ancienne Cendre.

Elle a été mise à jour pour protéger désormais les médias auteur réellement actifs :

- projectile Ombre ;
- impact Malédiction ;
- scale 1.45 ;
- playback projectile loop ;
- impact 350 ms ;
- socket bouche ;
- sons Cast / Impact auteur ;
- status visual violet.

La règle Starter FX reste inchangée :

- les médias/audio/status visuals auteur déjà renseignés ne sont pas remplacés ;
- les enrichissements FX peuvent être appliqués par le propriétaire existant ;
- aucun changement de Runtime ou renderer.

## TDD

### RED

Commit de test :

`7b3ac06e7deae9a09489fd08e6feb74a9d9f361a`

CI :

`37408329816`

Résultat :

- 1096 tests ;
- 1095 PASS ;
- 1 FAIL attendu ;
- échec uniquement sur la nouvelle sentinelle Cendre auteur V2.

### Remplacement

Commit source :

`9f21efaea69a408ddc1ed3329b5eb4c51d1bf9b8`

La CI est redevenue verte après remplacement.

### Sentinelles actualisées

Commit :

`7cac9fbd78d296338fe4028e4a9386aeee1f652c`

CI :

`37408462468`

Résultat :

- 1096 / 1096 PASS.

### Vrai chemin de remplacement

Commit :

`acfefcaf67fed9a578805fc983c03a56e15a5090`

CI :

`37408535902`

Résultat :

- 1097 / 1097 PASS.

## Fichiers fonctionnels modifiés

- `data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json`
- `tests/unit/capture-showcase-cendre-v1.test.mjs`
- `tests/unit/capture-fx-starter-safe-apply-v1.test.mjs`

Documentation :

- `docs/LAB_CURRENT_WORK.md`
- `docs/LAB_CENDRE_AVEUGLANTE_AUTHOR_EXPORT_V2.md`

## Domaines protégés

Aucun changement dans :

- Combat Runtime ;
- Combat Session ;
- règles de statuts ;
- collision ;
- dégâts ;
- renderer FX ;
- FX Core ;
- Asset Library ;
- catalogue audio ;
- autres capacités Showcase ;
- Loup / sockets ;
- traînée et fumée globales déjà validées.

## Validation réelle

Le lot est techniquement prêt à checkpoint lorsque la CI du SHA documentaire final est verte.

La validation smartphone doit vérifier dans la preview :

1. charger `Cendre aveuglante` ;
2. vérifier projectile Ombre depuis la bouche ;
3. vérifier l'impact Malédiction ;
4. vérifier les deux sons ;
5. vérifier la teinte violette du statut ;
6. vérifier que les debuffs durent 20 s ;
7. vérifier que le cooldown affiché est 60 s ;
8. vérifier que les FX auteur (trail / burst / fumée / cast burst) correspondent à l'export.
