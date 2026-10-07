# Micro-lot actif — 2026-10-07 — Capture Skill Export Fidelity V1

Branche : `work/lab-capture-skill-export-fidelity-v1-2026-10-07`

Checkpoint de départ :
`checkpoint/lab-start-capture-skill-export-fidelity-v1-2026-10-07`

SHA de base :
`c2caf8c1067fa26e9b0c87c29ea46e43972966ff`

## Problème reproduit

Un export utilisateur de Boule de feu a enregistré `anchor: null`, `offsetX: 0`, `offsetY: 30` alors que le réglage attendu par l'utilisateur était socket `mouth`, décalage horizontal 30, vertical 0.

Le remplacement GitHub n'est pas autorisé à corriger silencieusement ces valeurs : la fidélité doit être garantie avant intégration.

## Objectif

Garantir le vrai round-trip :
`UI durable -> draft canonique -> export JSON -> import -> projection éditeur -> draft canonique -> réexport`.

Le second export doit être canoniquement identique au premier pour tous les réglages durables actuellement exposés par l'éditeur.

## Propriétaires

- lecture/écriture UI : Human Editor ;
- traduction sprite : `capture-editor-sprite-controls-v1.js` ;
- modèle canonique : CaptureSkillEditorDraft + SkillPresentationBinding ;
- transfert : `capture-entity-transfer-v1.js`.

## Périmètre autorisé

- tests de fidélité export/import ;
- traduction UI des champs de présentation ;
- conservation des références de socket lors du changement de créature / chargement d'une capacité ;
- documentation.

## Protégé

Aucun changement de :
- Combat Runtime / Session ;
- Damage / Status resolution ;
- collision / projectile ;
- FX renderer ;
- audio runtime ;
- Dodge ;
- roster ;
- données auteur Showcase, sauf lot séparé après GREEN.

## Interdictions

- pas de second format d'export ;
- pas de merge champ par champ à l'import ;
- pas de correction silencieuse des données auteur ;
- pas de hardcode Fireball dans le mécanisme ;
- pas de reset silencieux d'un champ durable vers une valeur par défaut.

## TDD

1. test round-trip complet draft/export/import/projection/réexport ;
2. test DOM translator X/Y, playback, layers, modes et offsets adversaire ;
3. test socket conservé même si le socket n'est pas présent dans la créature actuellement chargée ;
4. sentinelle de couverture des contrôles durables de capacité ;
5. CI complète.

## Fin

RED ciblé -> correction cause -> CI GREEN -> rapport -> checkpoint GREEN -> preview -> validation utilisateur.

---

