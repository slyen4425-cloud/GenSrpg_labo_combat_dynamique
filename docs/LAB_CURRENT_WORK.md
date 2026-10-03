# LAB_CURRENT_WORK — Point de reprise unique

Date : 2026-10-03

## Chantier actif
Exploration Player Party v1 — party Capture réelle -> roster Combat existant.

## Branche
`work/lab-exploration-player-party-v1-2026-10-03`

## Base GREEN
`a022b0ecaa3aed93ddf2c9de45cf52268f395cba`

## Checkpoint de départ
`checkpoint/lab-start-exploration-player-party-v1-2026-10-03`

## Objectif
Retirer le dernier roster joueur codé en dur du chemin Exploration -> Combat.

Chaîne cible :

```text
CaptureEncounterSnapshot.player.partyRef
  -> Capture Party Definition
  -> creatureId refs uniquement
  -> transferts Capture configurés existants
  -> Combat Export
  -> Roster Definition existante
  -> Roster Session existante
```

## Première party sentinelle
- actif : `crea-loup` — Loup volcanique ;
- réserve : `crea_mossback` — Moussados.

La party ne copie ni stats, ni assets, ni skills.

## Autorités
- composition de party : définition Capture Party ;
- créatures : transferts/configured creatures Capture existants ;
- stats/loadouts/présentations : transferts de créatures ;
- conversion combat : export/adapters existants ;
- état de roster en combat : `Roster Session` existante ;
- UI : projection uniquement.

## Périmètre micro-lot A
- contrat `CaptureParty v1` ;
- party data réelle avec refs de créatures ;
- suppression de `PREVIEW_PARTIES` et `configuredPreviewParty` ;
- résolution générique d'une partyRef ;
- export actif + réserve dans le roster Combat ;
- tests de non-duplication et de changement de membre ;
- aucun changement du moteur `Roster Session`.

## Périmètre micro-lot B
- raccorder le chemin Encounter UI à la Roster Session existante ;
- afficher la réserve joueur ;
- permettre sélection / rappel / invocation via les propriétaires existants ;
- mise à jour du visuel et des capacités depuis le membre actif.

## Hors périmètre
- persistance longue durée hors combat ;
- capture/récompenses/XP ;
- modification de `Zombicide-40k` ;
- nouveau moteur roster ;
- duplication de créatures.

## Critères GREEN
- aucun `capture-party-preview -> crea-loup` codé en dur ;
- partyRef réellement résolue ;
- Loup + Moussados présents dans le roster ;
- stats/loadouts/visuels de chaque membre viennent de leurs transferts ;
- Roster Session gère le changement ;
- CI SUCCESS ;
- validation utilisateur dans le vrai combat Exploration.
