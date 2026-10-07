# Audio Role Tags V1

Date : 2026-10-07

## Objectif

Permettre de sélectionner **n'importe quel son** dans n'importe quel champ audio de l'éditeur Capture, sans supprimer la classification existante.

Les rôles `cast`, `release`, `travel`, `impact`, `aura`, `voice`, `death`, etc. deviennent des **tags / priorités de classement UI**, jamais des restrictions de compatibilité.

## Base

Base :
`ce2213051669c6706849d3cada0c38210d9c7cde`

Checkpoint de départ :
`checkpoint/lab-start-audio-role-tags-v1-2026-10-07`

Branche :
`work/lab-audio-role-tags-v1-2026-10-07`

## Cause

Le helper existant :

`buildPrivateAudioRoleGroupsV1(entries, acceptedRoles)`

construisait l'ordre uniquement depuis les rôles acceptés lorsqu'ils étaient fournis.

Toute entrée sans rôle correspondant était ignorée.

Le champ audio faisait donc de la taxonomie une permission.

## Correctif

Le même helper reste propriétaire du classement.

Nouvelle règle :
1. les rôles conseillés du champ sont placés en tête ;
2. tous les autres rôles de la taxonomie suivent ;
3. chaque son est affecté à un seul groupe d'affichage ;
4. si aucun rôle connu ne correspond, le son va dans `other` ;
5. aucun asset n'est filtré.

Dans le Human Editor, la variable locale est renommée :
`acceptedRoles` -> `preferredRoles`.

Le HTML `data-audio-roles` reste inchangé afin de conserver le contrat UI existant ; sa sémantique devient une préférence d'ordre.

## Catalogue et runtime protégés

Inchangés :
- `data/presentation/audio/private-audio-catalog.v1.json`
- 203 entrées privées ;
- assetIds ;
- runtime audio ;
- résolution URL ;
- preview audio ;
- import créateur.

Aucune copie de catalogue, aucun fallback concurrent, aucun second owner.

## TDD

RED :
- commit `05e40c89f38d23ce1ff424b9fadf8ee3d4f1eb7c`
- extension vrai catalogue : `b19af6a2d12b9b7d77f16e316065adbf54de8470`
- CI `37672377379`
- 1242 tests
- 1238 PASS / 4 FAIL ciblés.

Les échecs démontraient :
- filtrage du catalogue par rôle ;
- multi-rôle excluant des sons ;
- metadata inaccessible pour un son hors rôle ;
- les vrais sélecteurs n'exposaient pas tous les 203 sons.

GREEN :
- helper : `61eec01b9068f20bf9546b75945776cfa0b3de47`
- clarté sémantique UI : `b497e14a744a5b4db5d97a46656baffbfbc7fe5e`
- CI `37672549322`
- 1242 / 1242 PASS
- 0 FAIL
- structure / frontières / indépendance : OK.

## Vrai chemin vérifié

Les 7 configurations réelles de l'éditeur :
- `release,voice`
- `impact`
- `death`
- `cast,release,preparation`
- `travel`
- `impact`
- `aura`

exposent toutes :
- 203 sons ;
- 203 assetIds uniques ;
- aucun filtrage par rôle.

## Domaines protégés

Aucun changement de :
- SkillDefinition ;
- Combat Runtime / Session / Timing ;
- Animation / FX / Burrow ;
- données auteur Goutte vive ;
- créatures ;
- main ;
- Zombicide-40k ;
- Exploration.

## Validation utilisateur

GREEN technique.

À vérifier sur smartphone :
1. ouvrir un champ son Cast ;
2. constater que Cast est proposé en tête mais que les groupes Impact, Voice, Travel, etc. restent disponibles ;
3. choisir un son hors rôle initial ;
4. vérifier la préécoute ;
5. enregistrer une capacité ;
6. recharger la capacité et confirmer que le son choisi est conservé.
