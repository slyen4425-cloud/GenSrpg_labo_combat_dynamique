# Laboratoire Combat Dynamique — Current Work

Ce fichier est le point de reprise opérationnel du laboratoire.

## État global

Date : 2026-09-24

Phase active : fin de Phase 0 — Fondation et gouvernance.

Le dépôt est autonome et ne possède aucune dépendance à GenSrpG.

## Fondation

Dépôt :

`slyen4425-cloud/GenSrpg_labo_combat_dynamique`

Branche stable :

`main`

Premier commit d'initialisation :

`c4f970558ae984ad965cf66672caf9d6b3684a3e`

Dernier SHA de structure validé avant création de ce document :

`71a6b1fd98594046907b50ee545a5390900e9eb1`

CI correspondante :

- workflow : `Laboratory CI`
- run : `36043529254`
- conclusion : SUCCESS

## Documents obligatoires de reprise

Lire dans cet ordre :

1. `docs/LAB_CHARTE.md`
2. `docs/LAB_ROADMAP.md`
3. `docs/LAB_CURRENT_WORK.md`
4. `docs/LAB_ARCHITECTURE.md`
5. `docs/LAB_CHECKPOINT_POLICY.md`

Puis vérifier les branches, SHA et CI réels sur GitHub.

## Dernier jalon

Jalon : fondation du laboratoire.

Checkpoint final prévu :

`checkpoint/lab-foundation-green-2026-09-24`

Ce checkpoint doit être créé sur le SHA exact contenant l'ensemble de la fondation et ce fichier de reprise, après CI verte.

## Prochain chantier

Nom :

`mono-image-animation-core`

Objectif :

Créer le premier contrat et Core minimal permettant de transformer une image unique en acteur visuel animable, sans encore dépendre d'un gameplay ou de GenSrpG.

Checkpoint de départ prévu :

`checkpoint/lab-start-mono-image-animation-core-2026-09-24`

Branche de travail prévue :

`work/lab-mono-image-animation-core-2026-09-24`

La branche devra partir exactement du checkpoint GREEN de fondation.

## Périmètre du prochain chantier

Autorisé :

- contrats d'événements visuels ;
- modèle `VisualActor` ;
- profil générique minimal ;
- plan d'animation pur ;
- tests unitaires ;
- exemple de test avec asset fourni ultérieurement.

Protégé / hors périmètre :

- GenSrpG ;
- dépôt `Zombicide-40k` ;
- règles de gameplay Capture ;
- sauvegardes GenSrpG ;
- vraie intégration combat ;
- FX avancés ;
- caméra avancée ;
- sprite sheets ;
- moteur Canvas/WebGL.

## Inputs utilisateur attendus

Avant le test visuel réel :

- une ou plusieurs images de créatures de test ;
- éventuellement un fond/arène de test ;
- contraintes ou références visuelles souhaitées.

Le Core peut être développé avec des fixtures neutres, mais aucune supposition sur les assets GenSrpG ne doit être codée.

## Tests prévus

- validation d'événement ;
- validation d'acteur ;
- génération déterministe d'un plan d'animation ;
- retour à l'état stable ;
- indépendance vis-à-vis du DOM pour le planner ;
- sentinelle d'absence de dépendance GenSrpG.

## Risques principaux

- glissement de logique UI vers le Core ;
- nombres magiques non configurables ;
- couplage prématuré avec Capture ;
- animation non annulable ;
- choix trop précoce d'un renderer lourd.

## Critère de fin du prochain chantier

Un acteur mono-image doit pouvoir recevoir un événement générique et produire un plan d'animation testable indépendamment de l'UI, avec CI verte et checkpoint GREEN.

## Règle de reprise

Ne jamais reprendre uniquement depuis un résumé de conversation.

GitHub + ce fichier + les checkpoints sont la source de vérité.
