# Capture FX Particles V1

Date : 2026-10-05

## Objectif

Ajouter un enrichissement visuel réellement perceptible aux capacités Capture, sans nouvelle autorité gameplay :

- traînée de particules sur les projectiles ;
- burst de particules au point d'impact.

Le lot prolonge les Starter FX Profiles, les presets de glow lisibles et le SkillPresentationBinding existants.

## Base

- base GREEN technique : `0591aac36b79e7d36b626133b88b0fe71b3a52af`
- checkpoint départ : `checkpoint/lab-start-capture-fx-particles-v1-2026-10-05`
- branche : `work/lab-capture-fx-particles-v1-2026-10-05`

## Autorités

Chaîne conservée :

```
Human Editor
    |
    v
SkillPresentationBinding V5
    |
    v
Capture Presentation Assets
    |
    v
Dom Skill FX
    |
    +-- projectile trail
    +-- impact burst
```

Invariants :

- aucun fichier `src/core/combat/` modifié ;
- aucune collision calculée par les particules ;
- aucun dégât / soin / timing gameplay modifié ;
- aucune seconde trajectoire projectile ;
- aucun timer de gameplay ;
- la traînée est attachée au projectile visuel déjà propriétaire de sa trajectoire ;
- le burst utilise uniquement le point d'impact déjà décidé ;
- nettoyage via le cycle de vie existant du renderer FX.

## SkillPresentationBinding V5

Nouveau contrat strict :

- `feedback.projectileTrail`
- `feedback.impactBurst`

### Projectile Trail

- couleur ;
- nombre de particules ;
- longueur ;
- taille ;
- opacité.

Budget maximum : **10 particules**.

### Impact Burst

- couleur ;
- nombre de particules ;
- dispersion ;
- taille ;
- durée ;
- opacité.

Budget maximum : **18 particules**.

Les bindings V1 à V4 restent acceptés sans migration obligatoire.

## Presets simples

Le mode simple propose :

- Aucune ;
- Discrète ;
- Visible ;
- Intense ;
- Très intense.

Valeurs V1 :

| Niveau | Trail | Burst |
| --- | ---: | ---: |
| Aucune | 0 | 0 |
| Discrète | 3 | 5 |
| Visible | 5 | 8 |
| Intense | 7 | 12 |
| Très intense | 10 | 18 |

Les valeurs techniques sont réservées au panneau expert.

## Rendu

### Traînée projectile

Les particules sont des enfants DOM bornés du projectile existant.

Elles sont positionnées dans la direction opposée au déplacement, avec taille et opacité décroissantes.

Aucune boucle de simulation supplémentaire n'est utilisée.

### Burst impact

Un conteneur FX est placé au point d'impact existant.

Les particules sont réparties de manière déterministe autour du point puis animées par la même abstraction `animate` que les autres FX.

Le conteneur et ses animations sont nettoyés par le cycle de vie du renderer.

## Starter Profiles

- Boule de feu : Intense ;
- Projectile d'eau : Visible ;
- Projectile électrique : Très intense ;
- Épine naturelle : Visible ;
- Griffe physique : Discrète ;
- Zone de flammes : Intense ;
- Aura de soins : Discrète ;
- Bouclier d'énergie : Aucune.

Les couleurs de particules sont propres à chaque profil.

## Tests

RED initial :

- commit : `b497a42f23acb7ddbaed8980b0eba6d72d630f3b`
- CI : `37360988702` — FAILURE attendue avant implémentation.

GREEN renderer :

- commit : `0a5339f9d3e99a5b8d8ffaf54705d6ce83dc2e4f`
- CI : `37361452682` — SUCCESS.

Un échec intermédiaire sur `b0d1e08...` a été provoqué uniquement par la sentinelle historique de whitelist des champs Starter, qui ne connaissait pas encore les nouveaux champs de présentation. La whitelist a été mise à jour sans modification métier.

GREEN final :

- commit : `f35cb80ec176cac185ad88e29c8a1dea484869eb`
- CI : `37361823957` — SUCCESS ;
- **1065 tests / 1065 PASS / 0 FAIL**.

## Périmètre diff

Le lot modifie uniquement :

- contrat présentation V5 ;
- dispatcher présentation ;
- renderer FX ;
- éditeur humain ;
- profils/presets de présentation ;
- HTML éditeur ;
- tests ;
- documentation.

Aucun fichier Combat Runtime / Session / Rules / collision n'est modifié.

## Suite

Hors périmètre V1 :

- fumée persistante ;
- braises avec durée après impact ;
- variations de forme par élément ;
- qualité FX adaptative mobile ;
- distorsion visuelle ;
- pooling avancé si les tests mobiles montrent un besoin.
