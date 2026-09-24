# Laboratoire Combat Dynamique — Current Work

Ce fichier est le point de reprise opérationnel du laboratoire.

## État global

Date : 2026-09-24

Phase active : Phase 1 — Core animation mono-image.

Le dépôt est autonome et ne possède aucune dépendance à GenSrpG.

## Fondation validée

Dépôt :

`slyen4425-cloud/GenSrpg_labo_combat_dynamique`

Branche stable :

`main`

Premier commit d'initialisation :

`c4f970558ae984ad965cf66672caf9d6b3684a3e`

SHA GREEN de fondation :

`3197388f2b3ee7491be6e6125a015315158cffa2`

Checkpoint GREEN :

`checkpoint/lab-foundation-green-2026-09-24`

CI du SHA GREEN :

- workflow : `Laboratory CI`
- run : `36043623014`
- conclusion : SUCCESS

## Documents obligatoires de reprise

Lire dans cet ordre :

1. `docs/LAB_CHARTE.md`
2. `docs/LAB_ROADMAP.md`
3. `docs/LAB_CURRENT_WORK.md`
4. `docs/LAB_ARCHITECTURE.md`
5. `docs/LAB_CHECKPOINT_POLICY.md`

Puis vérifier les branches, SHA et CI réels sur GitHub.

## Chantier courant

Nom :

`mono-image-animation-core`

Checkpoint de départ :

`checkpoint/lab-start-mono-image-animation-core-2026-09-24`

SHA de base :

`3197388f2b3ee7491be6e6125a015315158cffa2`

Branche de travail :

`work/lab-mono-image-animation-core-2026-09-24`

Le checkpoint de départ et la branche de travail partent exactement du SHA GREEN de fondation.

## Objectif

Créer le premier contrat et Core minimal permettant de transformer une image unique en acteur visuel animable, sans dépendre d'un gameplay, d'un renderer spécifique ou de GenSrpG.

## Périmètre autorisé

- contrats d'événements visuels ;
- modèle `VisualActor` ;
- profil générique minimal ;
- plan d'animation pur ;
- tests unitaires ;
- fixtures neutres ;
- premier adaptateur de rendu uniquement lorsqu'il devient nécessaire au test visuel.

## Domaines protégés / hors périmètre

- dépôt `Zombicide-40k` ;
- code GenSrpG ;
- règles de gameplay Capture ;
- sauvegardes GenSrpG ;
- intégration au runtime Capture ;
- FX avancés ;
- caméra avancée ;
- sprite sheets ;
- moteur Canvas/WebGL lourd ;
- dépendance à un framework non justifié.

## Inputs utilisateur attendus

Avant validation visuelle réelle :

- une ou plusieurs images de créatures de test ;
- éventuellement un fond/arène de test ;
- références visuelles ou contraintes souhaitées.

Le Core peut être préparé avec des fixtures neutres, mais aucune supposition sur les assets GenSrpG ne doit être codée.

## Tests prévus

- validation d'événement ;
- validation d'acteur ;
- génération déterministe d'un plan d'animation ;
- retour à l'état stable ;
- indépendance vis-à-vis du DOM pour le planner ;
- sentinelle d'absence de dépendance GenSrpG ;
- annulation propre d'une séquence lorsque le runtime existera.

## Risques principaux

- glissement de logique UI vers le Core ;
- nombres magiques non configurables ;
- couplage prématuré avec Capture ;
- animation non annulable ;
- choix trop précoce d'un renderer lourd ;
- duplication d'autorité entre planner et renderer.

## Critère de fin

Un acteur mono-image doit pouvoir recevoir un événement générique et produire un plan d'animation testable indépendamment de l'UI, avec CI verte et checkpoint GREEN.

## Dernier checkpoint GREEN

`checkpoint/lab-foundation-green-2026-09-24`

## Règle de reprise

Ne jamais reprendre uniquement depuis un résumé de conversation.

GitHub + ce fichier + les checkpoints sont la source de vérité.
