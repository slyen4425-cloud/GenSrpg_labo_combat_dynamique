# Immunité dégâts / états négatifs V1

Date : 2026-10-06

## Base

Base exacte :

`ad0e01b50a54f9f7a43a789b3ecc5504b9fa8893`

Checkpoint de départ :

`checkpoint/lab-start-immunity-status-v1-2026-10-06`

Branche :

`work/lab-immunity-status-v1-2026-10-06`

## But

Ajouter une immunité persistante générique, sans second moteur de dégâts ni second moteur de statuts.

## Contrat

Nouveau status :

`kind = immunity`

Domaines V1 :

- `damage`
- `negative_status`

Le status utilise exactement les mécanismes existants :
- durée ;
- stacking ;
- expiration par l'horloge combat ;
- sourceActorId / sourceSkillId.

## Autorité unique

Nouveau propriétaire pur :

`src/core/combat/combat-protection-v1.js`

Il répond uniquement à la question :

`la cible est-elle protégée pour ce domaine à cet instant ?`

Il lit les instances de status actives via le même contrat temporel existant.

Aucun timer, aucun HP parallèle et aucun moteur status parallèle.

## Dégâts

`applyCombatDamageV1` consulte le propriétaire de protection avant les shields.

Si `damage` est immunisé :

- aucun shield consommé ;
- aucun HP perdu ;
- aucun damageDealtTotal ;
- aucun damageTakenTotal ;
- aucun KO enregistré ;
- `immuneDamage = requestedDamage`.

Comme DoT, dégâts structurés et zones finissent déjà par `applyCombatDamageV1`, ils héritent automatiquement de cette protection.

## États négatifs

`applyStatusEffectV1` consulte le même propriétaire avant d'appliquer un status `polarity = detrimental`.

Si `negative_status` est immunisé :
- le status n'est pas créé ;
- aucun moteur parallèle ;
- les buffs / statuses beneficial restent autorisés.

Le raccord `immediate-tactical-effects-v1` utilise le même helper pour émettre `status-immune` au lieu de mentir avec `status-applied`.

Un stun immunisé ne produit donc pas de faux `charge-interrupt`.

## TDD RED

Commit :

`f17deb852fc8bbf570c3e4e9a15646dd4b3b7642`

CI :

`37475806081`

Résultat RED :

- 1144 tests ;
- 1139 PASS ;
- 5 FAIL ciblés ;
- les cinq échecs étaient exclusivement `Unsupported StatusEffectV1.kind: immunity`.

## GREEN fonctionnel

HEAD fonctionnel :

`1140c4b37276157d21d2ba40b2658841a559fcbb`

CI :

`37476221683`

Résultat :

- 1144 / 1144 PASS ;
- 0 FAIL.

Sentinelles nouvelles :
- contrat immunity + validation domaines ;
- dégâts directs immunisés ;
- statistiques dégâts / KO inchangées ;
- DoT bloqué via le même Damage Application ;
- detrimental status bloqué ;
- beneficial status autorisé ;
- expiration réactive automatiquement les dégâts.

## Fichiers fonctionnels modifiés

- `src/contracts/status-effect-v1.js`
- `src/core/combat/combat-protection-v1.js`
- `src/core/combat/combat-damage-application-v1.js`
- `src/core/combat/status-effect-runtime-v1.js`
- `src/core/combat/immediate-tactical-effects-v1.js`
- `tests/unit/immunity-status-v1.test.mjs`

## Protégé / inchangé

Aucune modification de :
- Combat Runtime ;
- Combat Session ;
- calcul de dégâts ;
- cooldown ;
- Presence / Reach ;
- Burrow ;
- Dodge ;
- renderer / FX ;
- Tempête ;
- roster ;
- éditeur.

## Suite

Lot suivant :
`Scheduled Effects V1`

Objectif :
- effet lancé maintenant ;
- résolution plus tard sur l'horloge Combat Runtime existante ;
- premier trigger `after_ms` ;
- aucun `setTimeout` par capacité ;
- mêmes primitives de dégâts / soins / status à l'échéance.
