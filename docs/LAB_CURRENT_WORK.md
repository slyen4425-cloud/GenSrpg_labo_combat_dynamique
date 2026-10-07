# Point de reprise courant — 2026-10-07

## Lot techniquement GREEN

Audio Role Tags V1

Branche :
`work/lab-audio-role-tags-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-audio-role-tags-v1-2026-10-07`

Base :
`ce2213051669c6706849d3cada0c38210d9c7cde`

Base GREEN précédente :
`checkpoint/lab-water-atk1-author-export-v1-green-2026-10-07`

## Résultat

Les rôles audio ne sont plus des permissions.

Dans chaque champ audio :
- le ou les rôles recommandés sont affichés en premier ;
- tous les autres groupes restent accessibles ;
- chaque asset n'apparaît qu'une seule fois ;
- aucun son n'est exclu à cause de son rôle.

Les 7 configurations réelles de l'éditeur exposent chacune les 203 sons privés, sans doublon.

## Ownership

Inchangé :
- catalogue audio existant = source des métadonnées ;
- `buildPrivateAudioRoleGroupsV1` = propriétaire du classement UI ;
- Human Editor = consommateur ;
- runtime audio inchangé.

Aucune seconde liste, aucun fallback concurrent, aucune règle gameplay ajoutée.

## TDD

RED :
- `05e40c89f38d23ce1ff424b9fadf8ee3d4f1eb7c`
- `b19af6a2d12b9b7d77f16e316065adbf54de8470`
- CI `37672377379`
- 1238 / 1242 PASS
- 4 FAIL ciblés.

GREEN :
- helper `61eec01b9068f20bf9546b75945776cfa0b3de47`
- renommage sémantique UI `b497e14a744a5b4db5d97a46656baffbfbc7fe5e`
- CI `37672549322`
- 1242 / 1242 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

Rapport :
`docs/LAB_AUDIO_ROLE_TAGS_V1.md`

## Goutte vive

Le lot précédent a intégré :
- `cap_water_atk_1`
- **Goutte vive**

Fichier exact :
`data/capture/showcase/cap_water_atk_1.capture-skill-transfer-v1.json`

Blob auteur exact :
`53046be3171e46b571edc763666bb45397fe9785`

Checkpoint :
`checkpoint/lab-water-atk1-author-export-v1-green-2026-10-07`

## Domaines protégés

Inchangés :
- catalogue audio source / assetIds ;
- runtime audio ;
- données auteur Goutte vive ;
- créatures ;
- Combat Runtime / Session / Timing ;
- Animation / FX / Burrow ;
- collision ;
- Roster ;
- Dodge ;
- main ;
- Zombicide-40k ;
- Exploration.

## Prochaine action protocolaire

- CI documentaire finale ;
- checkpoint `checkpoint/lab-audio-role-tags-v1-green-2026-10-07` ;
- preview `preview/lab-audio-role-tags-v1-2026-10-07` ;
- validation smartphone utilisateur.
