# Point de reprise courant — 2026-10-07

## Lot actif

Audio Role Tags V1

Branche :
`work/lab-audio-role-tags-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-audio-role-tags-v1-2026-10-07`

Base exacte :
`ce2213051669c6706849d3cada0c38210d9c7cde`

Base GREEN précédente :
`checkpoint/lab-water-atk1-author-export-v1-green-2026-10-07`

## Besoin utilisateur

Les sons sont actuellement verrouillés par attribution de rôle
(`cast`, `travel/projectile`, `impact`, etc.).

Comportement cible :
- **tous les sons du catalogue doivent être sélectionnables dans chaque champ audio** ;
- les rôles restent des tags / groupes permettant de trouver plus vite le son pertinent ;
- le rôle du champ peut prioriser visuellement les groupes recommandés, mais ne filtre jamais la liste ;
- aucune duplication de catalogue ni de son.

## Cause actuelle

`buildPrivateAudioRoleGroupsV1(entries, acceptedRoles)` construit `roleOrder` uniquement depuis `acceptedRoles` lorsqu'ils existent, puis ignore toute entrée n'appartenant pas à ces rôles.

Le verrou est donc dans le propriétaire existant du classement UI.

## Owner

- catalogue : `data/presentation/audio/private-audio-catalog.v1.json` inchangé ;
- classement / projection UI : `src/ui/private-audio-role-groups-v1.js` ;
- `populatePrivateAudioSelect` reste consommateur du helper ;
- les rôles restent metadata, jamais autorité de compatibilité gameplay.

## Fichiers autorisés

- `src/ui/private-audio-role-groups-v1.js`
- tests audio taxonomy / role groups
- éventuellement texte UI strictement nécessaire
- documentation du lot

## Domaines protégés

Ne pas modifier :
- catalogue audio source et assetIds ;
- runtime audio / résolution des URLs ;
- données auteur Goutte vive ;
- SkillDefinition / Combat Runtime ;
- Animation / FX / Burrow ;
- créatures ;
- main ;
- Zombicide-40k ;
- Exploration.

## TDD prévu

1. RED : un champ `cast` doit encore contenir un son uniquement taggé `impact` ;
2. RED : le groupe recommandé `cast` doit rester placé avant les autres ;
3. correction dans le helper existant ;
4. chaque asset doit apparaître une seule fois ;
5. les rôles restent visibles comme groupes/tags ;
6. CI complète ;
7. preview dédiée ;
8. validation smartphone.

## Critère de fin

- aucun son exclu à cause de `data-audio-roles` ;
- groupe recommandé en tête ;
- aucune duplication d'assetId ;
- catalogue et runtime audio inchangés ;
- CI verte.
