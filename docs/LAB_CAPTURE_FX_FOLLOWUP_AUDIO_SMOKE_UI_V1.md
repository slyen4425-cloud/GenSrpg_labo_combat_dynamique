# Capture FX Follow-up — Audio, Smoke, Preview UI, Cast Particles V1

Date : 2026-10-05

## Retour utilisateur traité

Quatre problèmes ont été reproduits et corrigés :

1. texte parasite `\n` visible au-dessus des créatures dans la preview ;
2. absence de son d'impact lors d'une collision projectile contre projectile ;
3. absence réelle de fumée sur la Boule de feu vitrine malgré le renderer V6 ;
4. absence de particules propres au Cast.

## Cause du texte parasite

Le template HTML de la preview contenait quatre séquences littérales :

`</span>\n<div ...>`

Le `\n` était donc rendu comme du texte.

Correction : suppression à la source des quatre séquences littérales. Aucun CSS de masquage.

## Cause de l'absence de fumée

La capacité vitrine `fireball` chargée par le pipeline Transfer utilisait encore :

`presentation.version = 2`

Elle écrasait donc les réglages modernes et ne possédait aucun bloc `feedback`.

Correction : `data/capture/showcase/fireball.capture-skill-transfer-v1.json` passe à Presentation Binding V7 et embarque directement :

- glow ;
- flash impact ;
- shake ;
- particules Cast ;
- traînée projectile ;
- burst impact ;
- fumée aftermath.

La correction porte donc sur la source réellement hydratée par la vitrine, pas sur une augmentation artificielle de l'opacité du renderer.

## Collision projectile contre projectile — audio

Le plan de collision est `clash-impact`, alors que le presenter déclenchait le son d'impact uniquement pour `impact`.

Correction dans le presenter :

- `impact` -> son `impact` ;
- `clash-impact` -> le même son `impact` configuré ;
- le plan de clash reste unique, donc un seul son de rencontre est joué.

Aucune règle de clash n'est déplacée dans le presenter.

## Cast Particles — Binding V7

Nouveau champ strict :

`feedback.castBurst`

Paramètres :

- color ;
- count ;
- spreadPx ;
- sizePx ;
- risePx ;
- durationMs ;
- opacity.

Budget : **12 particules Cast maximum**.

Les bindings V1 à V6 restent supportés.

## Lifecycle du Cast

Les particules Cast sont créées comme enfants du nœud Cast déjà propriétaire de la présentation de préparation.

Le handle d'animation Cast annule :

- l'animation principale ;
- toutes les animations de particules Cast.

Ainsi une préparation interrompue ne laisse pas de particules orphelines.

## Presets simples

Le preset `Particules / fumée` pilote maintenant toute la chaîne :

- Cast ;
- projectile ;
- impact ;
- fumée.

Les niveaux restent :

- Aucune ;
- Discrète ;
- Visible ;
- Intense ;
- Très intense.

Les budgets mobiles restent bornés.

## Boule de feu vitrine

La Boule de feu vitrine charge maintenant directement un profil V7 avec notamment :

- Cast burst : 7 particules ;
- Projectile trail : 7 streaks ;
- Impact burst : 12 particules ;
- Aftermath smoke : 5 volutes ;
- glow intense ;
- flash + shake ;
- son d'impact conservé.

## Architecture

Diff final limité à :

- données vitrine ;
- contracts de présentation ;
- renderer FX ;
- presenter de résolution visuelle/audio ;
- éditeur ;
- tests ;
- HTML preview.

Aucun fichier `src/core/combat/` n'est modifié.

Aucune modification de :

- dégâts ;
- collision ;
- distance ;
- énergie ;
- cooldown ;
- Runtime ;
- Session ;
- projectile-clash rules.

## TDD / CI

Test RED dédié :

`tests/unit/capture-fx-followup-audio-smoke-ui-v1.test.mjs`

Il couvre :

- absence de `\n` littéral ;
- audio impact sur clash ;
- vraie Boule de feu vitrine moderne ;
- Cast particles V7.

Un premier run a révélé une erreur uniquement dans la sentinelle Cast : elle cherchait un conteneur indépendant alors que l'implémentation correcte attache les particules au lifecycle Cast existant. La sentinelle a été corrigée pour vérifier l'architecture réelle.

GREEN final :

- SHA fonctionnel : `5056247bc952bb65b19818198e8c267f6d16353d`
- CI run : `37369052277`
- **1073 tests / 1073 PASS / 0 FAIL**.

Checkpoint :

`checkpoint/lab-capture-fx-followup-audio-smoke-ui-v1-technical-2026-10-05`

Preview :

`preview/lab-capture-fx-followup-audio-smoke-ui-v1-2026-10-05`

Validation smartphone utilisateur reste requise avant GREEN utilisateur.
