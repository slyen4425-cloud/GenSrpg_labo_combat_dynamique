# Skill Presentation Side-Aware V1

Date : 2026-10-06

## Base

Base exacte :

`0cf4d9b9b7f53714e4e42329998a818b764f0a23`

Checkpoint de départ :

`checkpoint/lab-start-skill-presentation-side-aware-v1-2026-10-06`

Branche :

`work/lab-skill-presentation-side-aware-v1-2026-10-06`

## Problème

Les offsets visuels auteur étaient partagés entre les deux vues.

Un Cast correctement décalé côté joueur pouvait donc être mal placé côté adversaire, alors que les deux camps sont spatialement opposés.

La correction ne devait pas :
- ajouter un second renderer ;
- déplacer les collisions ;
- corriger les projectiles par un offset visuel ;
- modifier les scales auteur ;
- migrer silencieusement les anciens bindings.

## Contrat V9

Nouveau :

`SkillPresentationBinding V9`

Chaque slot visuel compatible peut déclarer :

`offsetMode`

Valeurs :
- `same`
- `mirror_x`
- `custom`

Les valeurs canoniques :
- `offsetX`
- `offsetY`

restent celles de la vue joueur.

### same

Vue adversaire :
- X identique ;
- Y identique.

### mirror_x

Vue adversaire :
- X = opposé de la valeur joueur ;
- Y = identique.

### custom

Valeurs explicites :
- `opponentOffsetX`
- `opponentOffsetY`.

## Human Editor

La vraie page expose maintenant, pour :
- Cast ;
- Impact ;
- Zone ;

un choix :

- Miroir horizontal automatique ;
- Même décalage des deux côtés ;
- Réglage séparé.

Le réglage séparé expose X/Y adversaire.

Les contrôles de sprite de status dynamiques utilisent le même contrat.

Pour un nouvel auteur, le HTML propose `mirror_x` par défaut.

## Compatibilité historique

V1 à V8 restent inchangés.

Un ancien binding chargé dans le Human Editor conserve son numéro de version tant que :
- son mode reste `same` ;
- l'auteur ne demande pas explicitement un comportement V9.

Le Human Editor transporte uniquement un `bindingVersion` interne non persisté afin d'éviter une migration silencieuse.

Si l'auteur passe un ancien binding à :
- `mirror_x` ;
- ou `custom` ;

alors le draft est explicitement reconstruit en V9.

Tempête V8 reste donc V8 tant qu'elle n'est pas modifiée sur ce point.

## Renderer

Aucun renderer concurrent.

`Capture Skill Presentation Assets V2` résout l'offset effectif selon la vue sémantique.

`Dom Skill FX` reçoit ensuite le résultat existant.

### Cast

Le noeud Cast est déplacé avec l'offset résolu.

Les particules Cast Burst et le Glow vivent sur ce même noeud :
ils suivent donc naturellement le Cast sans second calcul.

### Impact

Le sprite Impact reçoit l'offset effectif V9.

Le même offset est transmis au point de feedback :
- Impact Flash ;
- Impact Burst ;
- Aftermath Smoke.

Ils restent donc alignés sur le sprite Impact.

### Zone

Le visuel de zone reçoit le même calcul par vue.

### Projectile

Ce lot n'ajoute volontairement aucun offset de trajectoire projectile.

Collision et trajectoire projectile restent autoritaires selon leur géométrie rendue existante.

## TDD

### RED contrat

HEAD :

`31f80018ffcf8e6b70076702f2b8156cd4eb24d7`

CI :

`37510180626`

Résultat :
- 1186 tests ;
- 1182 PASS ;
- 4 FAIL ciblés ;
- legacy V8 déjà PASS.

### GREEN Core V9

HEAD :

`1e04b3e2924d9cf349c08554afb1edd90e39fbf9`

CI :

`37510523279`

Résultat :
- 1186 / 1186 PASS.

### RED Human Editor

HEAD :

`4e3c6d6d342793d9c788db3763e1f852ffd8d569`

CI :

`37510949750`

Résultat :
- 1190 tests ;
- 1186 PASS ;
- 4 FAIL ciblés.

### Corrections intermédiaires

CI `37511306256` :
une erreur de syntaxe UI unique provoquait des échecs en cascade.
Correction locale, aucun changement moteur.

CI `37511410236` :
les nouvelles fonctionnalités fonctionnaient, mais les anciennes présentations étaient migrées silencieusement en V9 `same`.

La compatibilité a été corrigée à la frontière Human Editor.
Les sentinelles historiques n'ont pas été affaiblies.

### GREEN Human Editor

HEAD :

`85abd097e93892c0753b9f3e5473db6354274f04`

CI :

`37511699400`

Résultat :
- 1190 / 1190 PASS.

### GREEN finale + sentinelle DOM Impact

HEAD fonctionnel :

`080942861d0f26eb3d0c798bc4a89f0bd235fdbd`

CI :

`37511978095`

Résultat :
- 1191 / 1191 PASS ;
- 0 FAIL.

Sentinelle DOM :
un Impact V9 côté adversaire avec override `(-30,+9)` place le sprite Impact et le Flash exactement au même point.

## Fichiers fonctionnels

- `src/contracts/skill-presentation-binding-v9.js`
- `src/contracts/skill-presentation-binding.js`
- `src/adapters/renderer/capture-skill-presentation-assets-v2.js`
- `src/adapters/renderer/dom-skill-fx.js`
- `src/ui/capture-editor-sprite-controls-v1.js`
- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.html`
- tests dédiés.

## Protégé / inchangé

Aucune modification de :
- Combat Runtime ;
- Combat Session ;
- Action Resolver ;
- Damage / Status ;
- collision projectile ;
- Roster Session ;
- Game Options / Dodge ;
- Creature Presentation scales ;
- sockets créature ;
- données Showcase.

## Stack Mechanics

Le besoin Stack est enregistré dans `LAB_CURRENT_WORK.md` comme chantier gameplay séparé.

Il ne fait pas partie du renderer V9.
