# Capture FX Enhancements V1

Date : 2026-10-05

## Objectif

Rendre les Starter FX Profiles immédiatement plus visibles en combat sans créer une nouvelle autorité gameplay ou caméra.

Ce lot ajoute trois enrichissements de présentation :

- glow configurable ;
- flash procédural à l'impact ;
- secousse caméra configurable à l'impact.

Les particules procédurales restent volontairement hors de ce lot.

## Base et branches

- base : `9e8b51b45122a388ddbde93ff9c10a86ec7ddfb8`
- checkpoint départ : `checkpoint/lab-start-capture-fx-enhancements-v1-2026-10-05`
- branche travail : `work/lab-capture-fx-enhancements-v1-2026-10-05`

## Propriétaires

Chaîne autoritaire retenue :

```
Human Editor
   |
   v
SkillPresentationBinding V4
   |
   v
Capture Skill Presentation Assets
   |
   v
Dom Skill FX
   |             \
   |              -> glow / impact flash
   |
   -> playCameraFx(plan)
            |
            v
Visual Controller
            |
            v
Dom Camera FX
```

Invariants :

- Combat Runtime / Combat Session / règles / collision / dégâts ne sont pas modifiés ;
- aucun effet visuel ne décide qu'une attaque touche ;
- le flash utilise le point d'impact déjà décidé ;
- le shake est délégué à `dom-camera-fx`, propriétaire caméra déjà existant ;
- `dom-skill-fx` ne possède pas directement l'arène/caméra comme autorité de shake ;
- aucune nouvelle horloge gameplay ;
- aucun stockage parallèle.

## SkillPresentationBinding V4

Nouveau contrat :

`src/contracts/skill-presentation-binding-v4.js`

Le champ `feedback` est exclusivement de présentation :

```json
{
  "feedback": {
    "glow": {
      "color": "#ff7a2d",
      "strength": 0.8,
      "radiusPx": 18
    },
    "impactFlash": {
      "color": "#fff2c2",
      "opacity": 0.72,
      "durationMs": 120,
      "scale": 1.55
    },
    "cameraShake": {
      "amplitudePx": 5,
      "durationMs": 150
    }
  }
}
```

V1, V2 et V3 restent acceptés par le dispatcher existant.

## Rendu

### Glow

Le glow est appliqué par le renderer FX sur :

- cast ;
- projectile ;
- impact ;
- zone persistante.

La couleur, l'intensité et le rayon viennent du binding.

L'intensité agit réellement sur l'alpha du `drop-shadow`, elle n'est pas seulement stockée dans les données.

### Flash d'impact

Le renderer crée un élément de feedback procédural au point d'impact existant :

- radial gradient ;
- couleur ;
- opacité ;
- durée ;
- scale.

Il n'invente ni cible ni coordonnées gameplay.

### Shake

Le renderer FX demande seulement :

```
playCameraFx({
  type: "camera-shake",
  amplitudePx,
  durationMs
})
```

Le contrôleur visuel délègue ensuite à son instance existante `createDomCameraFxRenderer`.

Il n'existe donc pas de second moteur de shake.

## Éditeur

Dans les réglages avancés de la capacité :

- couleur glow ;
- intensité glow ;
- rayon glow ;
- couleur flash ;
- opacité flash ;
- durée flash ;
- scale flash ;
- amplitude shake ;
- durée shake.

Ces valeurs sont sauvegardées/rechargées via le même brouillon et le même Presentation Binding que les sprites.

## Starter Profiles

Les huit profils existants restent protégés et fournissent maintenant des valeurs visibles.

Exemples :

### Boule de feu

- glow : orange, 0.85, 20 px ;
- flash : 0.80, 120 ms, 1.65x ;
- shake : 5 px, 150 ms.

### Eau

- glow : cyan, 0.65, 16 px ;
- flash : 0.55, 120 ms, 1.50x ;
- shake : 3 px, 120 ms.

### Électricité

- glow : cyan clair, 0.90, 22 px ;
- flash : 0.85, 90 ms, 1.65x ;
- shake : 4 px, 110 ms.

### Griffe

- glow léger ;
- flash court ;
- shake 4 px / 110 ms.

Aura de soins et Bouclier utilisent un glow sans imposer de flash/shake.

## Tests

### RED obligatoire

Commit : `47d260186f90702c22935999c4596657e585dbc7`

CI : `37353386954` — FAILURE attendue.

Preuve :

- V4 refusé : `Unsupported skill presentation version: 4` ;
- resolver V4 absent ;
- renderer feedback absent ;
- 1052 tests, 3 échecs ciblés.

### GREEN fonctionnel

Commit avec gardes finaux : `8e16e5865e91badaad4558cd440b8a559fb783bb`

CI : `37354123307` — SUCCESS.

Résultat :

- **1054 tests** ;
- **1054 PASS** ;
- **0 FAIL**.

Gardes spécifiques :

- contrat V4 strict et présentation-only ;
- propagation V4 par le resolver ;
- renderer glow/flash ;
- shake délégué au propriétaire caméra ;
- Starter Boule de feu fournit réellement les nouvelles valeurs ;
- round-trip Human Editor V4 sans modification de `SkillDefinition` ;
- marqueurs UI présents.

Un échec intermédiaire `37353911907` a détecté qu'un ancien test de whitelist des champs Starter n'avait pas encore intégré les nouvelles propriétés de présentation. La sentinelle a été mise à jour puis la CI est redevenue verte.

## Revue de périmètre

Le diff du lot ne touche aucun fichier de :

- `src/core/combat/` ;
- règles de dégâts ;
- collision ;
- session/runtime.

Les changements concernent uniquement :

- contrats de présentation ;
- adapters/renderers de présentation ;
- éditeur ;
- clients UI pour délégation caméra ;
- Starter Profiles ;
- tests et documentation.

## Hors périmètre

À traiter dans le lot suivant :

- particules procédurales ;
- trails de particules ;
- braises / fumée / étincelles ;
- qualité FX adaptative mobile ;
- distorsion éventuelle.

Ces ajouts devront réutiliser le même binding et le même renderer FX, sans créer d'autorité concurrente.
