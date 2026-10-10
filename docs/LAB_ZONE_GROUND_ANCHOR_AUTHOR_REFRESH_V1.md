# Capture — Ancrage fixe au sol et réimport des deux fiches utilisateur V1

Date : 2026-10-10. Repo : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Besoin et correction

Un sprite de **zone persistante** doit pouvoir soit **suivre la créature** (ancien comportement Tempête/Vague de flammes) soit **rester au sol au point de lancement** (Voile aqueux / brume). Le bug venait de deux couches : (1) le binding de la zone auteure utilisait `attachment:"source"`, (2) la projection d'asset puis `DomSkillFxRenderer.syncPersistentZones` ne consultaient pas le mode d'attachement ; la zone suivait donc le modèle jusqu'au rappel.

Le contrat préexistant `SkillPresentationBindingV1` accepte déjà `source` et `fixed-source`. Aucun nouveau type ni propriétaire de gameplay n'a été créé.

- **Mode source** (par défaut / compatibilité) : le visuel suit l'ancre du modèle actif jusqu'à son rappel ; après rappel la position de la zone conservée se fige.
- **Mode fixed-source** : capture l'ancre du lanceur dès le premier rendu du nœud de zone ; la position se fige aussitôt, **même si le lanceur marche ou attaque**, et reste figée après rappel. L'instance `CombatState.persistentZones` conserve rayon/durée/effets ; l'ellipse du sprite affiché continue de fournir l'échantillon spatial déjà existant, sans imposer de règles dans le renderer.
- **Éditeur Human** : sélecteur « Ancrage visuel de la zone » avec « Suit la créature » / « Reste au sol dès l'activation » ; lecture, modification, enregistrement et rechargement conservent la sélection. Les exportations V9 portent le champ `visual.aura.attachment` déjà natif.

## Deux exports utilisateur rétablis

**Capacité** `cap_water_special_2` : import fourni SHA-256 `209d8a097c11ae54e094493fbdc09a2693231b6591e03cc7cb7257a2d6ec7f7d`. Seule la propriété `visual.aura.attachment` a été adaptée de `source` vers `fixed-source`, conformément à la demande expresse d'ancrage ; toute autre valeur du JSON de l'auteur reste identique :
- ultime niveau 20 ; préparation 2000ms ; utilisation max 1/combat ;
- zone 60000ms, `persistAfterRecall:true`, statut `while_inside` ;
- buff Défense +100, durée secondaire configurée 10000ms et visible seulement en mode `on_enter` ;
- visuel `pack:capture:sprite-status-energy-shield-01`, échelle 4, décalage Y -35, opacité 50%, icône `core:icon-skill-barrier-dome-01`.
- SHA-256 du JSON final normalisé en présentation `fixed-source` : `911b33e756b83652dc25f367b8719e91393864824f5d6f00f2d9b0fd766f7606`.

**Créature** `crea_maraileron` : fichier utilisateur SHA-256 `33ef7cc11487f6ec40841ebfc07da7018039fd6b14fc1e2ce4684457086421f8`, transplanté avec mêmes identifiants et paramètres, PV 140, élément Eau, résistances, 5 sockets, scales par vue 1.5/0.92, et compétences configurées intactes.
- Slot 4 : `lib_aqua_heal` ; slot ultime : `cap_water_special_2`.
- Ce remplacement vise uniquement la fiche canoniquement enregistrée, **pas** les sauvegardes IndexedDB des joueurs ni des fichiers de profils d'autres créatures.

## Préservation des owners et tests

- `src/adapters/renderer/capture-skill-presentation-assets-v2.js` transmet `slot.attachment` à `persistentZone` ; `dom-skill-fx.js` gère seul le cache de centre par `zoneId`.
- Nouveaux tests : scénarios source vs fixed-source sur un modèle qui se déplace, rappel, suppression, projection visuelle et deux exports. Sentinelles historiques Maraileron / Goutte vive / buff duré recalées uniquement sur les changements voulus de l'auteur, sans supprimer leurs assertions métier.
- Chromium réel : bibliothèque 103 créatures, ultime Voile présent, mode « fixe » visible dans le formulaire, sauvegarde, Maraileron équipé, Firestorm et autres capacités stables.
- **Interdits conservés** : pas de changement à `Combat Runtime`, `Combat State`, `Roster Session`, ni autre gestionnaire de dégâts ou statut ; aucun asset ajouté ni renommé ; `main`, `global-assets`, `Zombicide-40k` et Exploration intacts.

## Protocole

Base publiée `e5fd873e0b0a98c4d062471267cee884130aec87`. Checkpoint de départ `checkpoint/lab-start-zone-ground-anchor-author-refresh-v1-2026-10-10`; branche `work/lab-zone-ground-anchor-author-refresh-v1-2026-10-10`. Rapport de CI/changelog, checkpoint GREEN et publication à ajouter après validation du SHA final ; aucun test tactile sur smartphone physique revendiqué.

## Preuves de validation GREEN (source)

Source de référence : commit `1e102e1155e027c9695c910041c061a9b00c00c4`, GitHub Actions `38033316529` SUCCESS. **1379 tests unitaires Node validés**, zéro FAIL ; navigateur Chromium bibliothèque + véritable édition/save de l'ancrage et choix d'ultime Maraileron SUCCESS ; Chromium Firestorm zone-progress SUCCESS. Une première CI fonctionnelle `38033133369` était rouge car les trois anciennes sentinelles supposaient encore les anciens exports ; leur correction ciblée est documentée dans `LAB_CURRENT_WORK.md`. Aucun changement indirect des autres presets ni du gameplay zone/Combat.

Il reste à consigner l'ID du checkpoint GREEN, de la preview et du SHA public après vérification effective ; ceci ne présume pas la publication.
