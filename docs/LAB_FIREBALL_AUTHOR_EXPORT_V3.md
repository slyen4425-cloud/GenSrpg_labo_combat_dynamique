# Fireball — Author Export V3

Date : 2026-10-07

## Source de vérité

Export utilisateur fourni par Sylvain :
`capture-skill-transfer-v1`

ID stable :
`fireball`

Conformément à `LAB_CHARTE.md §33`, l'export de l'éditeur est intégré tel quel comme source de vérité de la définition, de la présentation, de l'audio et du feedback. Aucun merge champ par champ, aucune amélioration implicite, aucune seconde fiche.

## Base

Base exacte :
`7f66a9c420c52a7e7815494b40e02606222a18fd`

Checkpoint de départ :
`checkpoint/lab-start-fireball-author-export-v3-2026-10-07`

Branche :
`work/lab-fireball-author-export-v3-2026-10-07`

## Audit avant remplacement

L'ancienne fiche Showcase différait de l'export auteur sur :
- `definition.targetLocations = ["active"]` absent ;
- `definition.hitPresenceStates = null` absent ;
- `definition.dodgeable = true` absent ;
- Cast : ancien sprite -> `pack:capture:sprite-fireball-2-cast-01` ;
- Cast `offsetY: 0 -> 30` ;
- projectile `displayScale: 1.9 -> 2.5` ;
- Impact : ancien sprite -> `pack:capture:sprite-fireball-2-impact-01`.

## Assets vérifiés

Catalogue global-assets :
- `pack:capture:icon-skill-fireball-01` ;
- `pack:capture:sprite-fireball-2-cast-01` ;
- `pack:capture:sprite-fireball-travel-01` ;
- `pack:capture:sprite-fireball-2-impact-01`.

Resolver audio runtime :
- `gensrpg:sound:effect-135ee2ed` ;
- `gensrpg:sound:genrpg-pack2-a30f1071` ;
- `gensrpg:sound:genrpg-pack2-a3d02c0f`.

Aucun fallback ni nouvel asset n'a été créé.

## Remplacement canonique

Fichier autoritaire Showcase remplacé :
`data/capture/showcase/fireball.capture-skill-transfer-v1.json`

Le catalogue Showcase continue à référencer le même fichier et le même ID `fireball`.

Le test de raccord vérifie :
1. une fiche `fireball` existe déjà dans `configuredSkills` ;
2. `planCaptureTransferImportV1(..., mode:"replace")` retourne `replace-skill` ;
3. l'ID reste `fireball` ;
4. `applyCaptureTransferPlanToEditorStateV1` remplace la fiche ;
5. la taille de `configuredSkills` reste inchangée ;
6. les valeurs auteur sont celles du nouvel export.

## TDD

RED :
- commit : `566a475684bc8b7d4ba32cb61b3afe9fdb28ee45`
- CI : `37602814192`
- 1208 tests, 1206 PASS, 2 FAIL ciblés.

Remplacement source :
- commit : `43f8239a331f5fa8e727c427ad69c19abeee3047`.

La première CI après remplacement a laissé 1 FAIL dans le test de raccord car la fixture supposait à tort que Fireball provenait déjà du catalogue portable/complexe. La donnée produit était correcte ; seule la fixture était fausse.

Correction de la fixture :
- commit : `cba46064da06246b111953bd6b5a24e57bbc2c44`
- CI : `37603053691`
- **1208 / 1208 PASS**.

## Domaines protégés

Aucun changement :
- Combat Runtime ;
- Combat Session ;
- Damage / Status ;
- collision / projectile ;
- renderer FX ;
- Asset Library ;
- catalogue audio ;
- autres capacités Showcase ;
- données créatures.

Statut : GREEN technique, validation smartphone utilisateur requise.
