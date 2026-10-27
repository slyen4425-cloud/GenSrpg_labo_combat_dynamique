# Capture Skill Export Fidelity V1

Date : 2026-10-07

## Base

Base exacte :
`c2caf8c1067fa26e9b0c87c29ea46e43972966ff`

Checkpoint de départ :
`checkpoint/lab-start-capture-skill-export-fidelity-v1-2026-10-07`

Branche :
`work/lab-capture-skill-export-fidelity-v1-2026-10-07`

## Retour utilisateur reproduit

Le besoin est de garantir qu'une capacité exportée depuis le Human Editor garde exactement ses réglages durables.

Cas de régression explicitement verrouillé :
- socket de capacité : `mouth` ;
- cast horizontal : `offsetX = 30` ;
- cast vertical : `offsetY = 0`.

La règle de la charte §33 reste inchangée : le fichier exporté est la source de vérité et l'intégration ne doit jamais deviner ou reconstruire ses valeurs.

## Audit du chemin

Chemin contrôlé :

`Human Editor -> readSkillFields -> buildHumanSkillDraftV1 -> SkillPresentationBinding -> exportCaptureSkillTransferJsonV1 -> importCaptureTransferJsonV1 -> humanSkillEditorFieldsFromDraftV1 -> buildHumanSkillDraftV1 -> export`

Résultat :
- la traduction X/Y actuelle est correcte ;
- le round-trip canonique complet conserve les valeurs testées ;
- le défaut actif démontré était la synchronisation des sockets.

## Cause réelle

`syncCaptureSkillSocketOptionsV1` reconstruisait la liste depuis les seuls sockets présents sur la créature actuellement chargée.

Si une capacité possédait déjà une référence `anchor/socketId` qui n'était temporairement pas disponible dans cette créature, la synchronisation remplaçait silencieusement cette valeur par `""`, donc `Centre par défaut`.

L'export suivant enregistrait ensuite fidèlement la mauvaise valeur déjà détruite dans l'UI.

Ce comportement contredisait la règle de fidélité de la charte.

## Correction

Le Human Editor conserve maintenant une référence de socket déjà authored même lorsqu'elle n'est pas résolue par la créature courante.

Règles :
- les sockets normaux continuent de provenir uniquement de la créature ;
- aucun ID de socket n'est hardcodé dans la liste de capacité ;
- une référence existante absente est gardée comme `référence sauvegardée` ;
- le chargement d'un draft ajoute temporairement son socket au sélecteur s'il manque ;
- le changement de créature ne remet plus silencieusement cette valeur à Centre.

Aucune nouvelle autorité métier n'est créée : il s'agit uniquement de préserver une référence de présentation existante.

## Couverture de fidélité

Nouvelle sentinelle :
`tests/unit/capture-skill-export-fidelity-v1.test.mjs`

Elle couvre :
- cas Fireball `mouth + X30/Y0` ;
- read/write DOM des contrôles sprite ;
- playback cast / impact / zone ;
- offsets joueur X/Y ;
- modes `same / mirror_x / custom` ;
- offsets adversaire ;
- layers joueur/adversaire ;
- icon/cast/travel/impact/aura assets ;
- scales, y compris zone X/Y ;
- durée d'impact ;
- audio cast/travel/impact/aura ;
- glow ;
- flash d'impact ;
- camera shake ;
- cast burst ;
- projectile trail + anchors ;
- impact burst ;
- aftermath smoke ;
- status visuals ;
- champs de définition testés : level, slot ultime, élément, forme, dodgeable, présence, cibles, énergie, préparation, trajet, récupération, cooldown, max uses, projectile power et effets ;
- export -> import -> projection éditeur -> réexport canoniquement identique.

Les familles tactiques disposent en plus de leurs sentinelles spécialisées existantes (status, zone persistante, scheduled/immediate effects).

## Presets UI

Les sélecteurs de preset (FX starter, Glow preset, Particle preset) restent des raccourcis d'édition.

Leur identifiant de preset n'est pas l'autorité exportée.

Ce sont les valeurs canoniques résultantes (couleurs, intensités, tailles, nombres, durées, etc.) qui sont persistées. Cela évite de lier une capacité à un preset modifiable et maintient l'export autonome.

## TDD

### RED

Commit :
`aa4faef85c066728c223e751fc14a0c541db70b7`

CI :
`37630334223`

Résultat :
- 1219 tests ;
- 1218 PASS ;
- 1 FAIL ciblé ;
- échec : socket authored `mouth` devient `""`.

### Première correction

Commit :
`0cfa95f93816943a20ae2360b44038bfe41b834c`

La nouvelle règle a révélé une ancienne sentinelle qui exigeait explicitement le reset vers Centre pour un socket absent.

CI :
`37630662707`

Cette sentinelle historique a été mise à jour car son ancien invariant était précisément destructeur pour l'export.

### GREEN fonctionnel

HEAD :
`65c44d2d9ffb8b5ac8dad8517ee5a6264811d055`

CI :
`37630829983`

Résultat :
- 1219 / 1219 PASS ;
- 0 FAIL.

## Fichiers fonctionnels

Modifié :
- `src/ui/capture-editor-human-v2.js`.

Tests :
- `tests/unit/capture-skill-export-fidelity-v1.test.mjs` ;
- `tests/unit/capture-editor-ownership-cleanup-v1.test.mjs`.

## Domaines protégés

Aucun changement dans :
- Combat Runtime ;
- Combat Session ;
- Damage / Status Runtime ;
- collision / projectile ;
- FX renderer ;
- Audio Runtime ;
- Dodge ;
- Roster ;
- données Showcase ;
- dépôt GenSrpG principal ;
- `main`.

## Limite de conclusion

Le bug actif de destruction du socket est corrigé.

Le chemin X/Y de la base actuelle est démontré fidèle par sentinelle. Cela ne permet pas d'attribuer avec certitude l'ancien export `X=0/Y=30` à la même cause historique : l'ancien fichier peut avoir été produit par une version antérieure ou depuis un état UI déjà modifié.

À partir de ce checkpoint, toute régression X/Y ou socket couverte par ces sentinelles fera échouer la CI.

Statut : GREEN technique. Validation utilisateur de l'éditeur/export réel requise.
