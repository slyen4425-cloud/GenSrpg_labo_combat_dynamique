# Renvoi sélectif / Armure de pointes V1 — rapport technique

Date : 13 octobre 2026.

## Source et gouvernance

- Dépôt exclusif : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base LIVE : `gh-pages@c66d26f212ed0c6bb878d2e910308e508acc12b0`, Laboratory CI `38363010994` et GitHub Pages `38363010608` SUCCESS.
- Checkpoint initial pris **avant** le lot : `checkpoint/lab-start-reflection-trigger-v1-2026-10-13`.
- Branche isolée : `work/lab-reflection-trigger-v1-2026-10-13`.
- Aucun changement au vrai miroir `projectile_mirror`, aux fiches auteurs, `main`, `global-assets`, GenSrpG principal ni laboratoire Exploration.
- La mécanique Stacks à seuil a été testée et validée explicitement par l'auteur le 13 octobre ; ceci n'étend pas la validation aux autres mécanismes.

## Ce qui a été ajouté

### Renvoi proportionnel à la perte de PV, filtrable

Le statut **natif** `StatusEffectV1.kind:"damage_reflection"` reconnaît deux options nouvelles, toutes deux facultatives :
- `incomingKinds:["contact","projectile","beam","area","zone","dot","scheduled","other"]` : sélection explicite des catégories qui peuvent déclencher la réflexion du pourcentage.
- `contactDamage:10` : nombre de dégâts de riposte fixe lorsqu'une attaque de forme **contact** touche le porteur du statut ; il n'est pas conditionné par une perte de PV.

Par défaut, **l'absence** de `incomingKinds` garde le comportement historique : toutes les origines de dégâts sont éligibles au renvoi en pourcentage. L'absence de `contactDamage` ne crée aucune riposte fixe. Le pourcentage reste calculé exclusivement sur la **perte réelle de PV** du défenseur, après immunités et boucliers.

Exemple Armure de pointes :

```json
{
  "id":"armure-pointes", "kind":"damage_reflection",
  "polarity":"beneficial", "durationMs":8000, "stacking":"refresh",
  "percent":0, "incomingKinds":["contact"], "contactDamage":12
}
```

Un contact confirmé inflige 12 dégâts à l'assaillant, y compris lorsque le porteur a absorbé l'attaque par un bouclier ; un projectile esquivé n'active rien. Les dégâts sont appliqués par **Combat Damage Application** : le bouclier, l'immunité, le crédit KO et l'interdiction des renvois récursifs s'appliquent normalement. Les valeurs de contact se cumulent selon les règles de stacks natives, sans une seconde autorité.

### Aura / zone punitive

Une zone de **dégâts** existante (`SkillEffectV1.kind:"persistent_zone"`) accepte `damageTrigger:"entry_only"`. Dans ce mode, son propriétaire `PersistentZoneRuntime` inflige les dégâts sur l'**entrée réelle** déjà reconnue par la logique de contact/approche, puis aucun dommage périodique supplémentaire. Elle n'ajoute ni timer, ni système spatial parallèle. Sans `damageTrigger`, la cadence historique (entrée et ticks) reste inchangée.

Exemple : le lanceur crée une zone courte de 7 dégâts avec `damageTrigger:"entry_only"`. Un ennemi subit 7 dégâts lorsque son approche franchit le seuil de la zone, puis ne reçoit pas de dégâts supplémentaires en y demeurant ; aucune pénalité ne s'applique à une créature restant à l'extérieur.

### Human Editor

- **Effets tactiques → Appliquer un statut → Renvoi de dégâts** : pourcentage, case « Toutes les attaques », catégories sélectionnables et champ « Armure de pointes » en dégâts fixes au contact.
- Les mêmes options sont disponibles pour un statut de renvoi associé à une zone et un statut imbriqué dans un déclenchement de stacks.
- **Effets tactiques → Zone persistante → Dégâts** : « À l'entrée et périodiquement » ou « Uniquement à chaque entrée réelle ».
- Le formulaire ne décide d'aucun résultat gameplay ; il édite les **mêmes contrats** que l'import/export `configuredSkills`. Les options historiques omises ne sont pas ajoutées de force aux anciens exports.

## Tests et incident d'intégration

- Test RED initial : `tests/integration/selective-damage-reflection-v1.test.mjs`, commit `ae199576dfee5bfdbe82346ac0c708a9100f73cc` ; échec de contrat attendu avant implémentation.
- Couverture : contrats facultatifs stricts, sélection/exclusion contact/projectile/rayon/zone/DoT, compatibilité historique et retour du pourcentage, riposte même contre absorption, immunité de l'attaquant, absence de rebonds infinis, combat 1v1 et isolation 2v2, seuil spatial réel entrée de zone sans tick ultérieur, Human Editor et roundtrip des contrats.
- Incident Chromium : la première interface de formulaire produisait une clé `DOMStringMap` invalide avec un nom de groupe contenant un tiret (`reflectionContactDamagezone-status`). L'éditeur s'interrompait avant de charger les 103 créatures ; ce n'était **pas** une disparition de fichiers auteurs. Corrigé en normalisant le nom technique du champ avant son affectation au `dataset`. La sentinelle de navigateur donne désormais aussi l'état du bootstrap en cas de future panne.
- **GREEN du code** sur `57d24f22597c0ad33b7501847dc17e7ce165b440` : Laboratory CI `38378030619`, Foundation **1637/1637**, `creature-library-browser` **SUCCESS**, `firestorm-zone-growth-browser` **SUCCESS**.
- **Publication technique et validation Android** : le présent rapport exige la CI sur le SHA documentaire final, le checkpoint GREEN identique, puis l'avance `gh-pages` sans force et les deux portes post-publication. Les tests manuels Android restent distincts ; le miroir et Immatériel conservent leurs validations en attente.

## Limites et frontières

- Le miroir réel `projectile_mirror` retourne exclusivement les projectiles directs éligibles et n'a pas été modifié.
- L'armure réagit **au vrai impact contact réussi** ; elle ne blesse pas un adversaire simplement parce qu'il se tient à côté sans attaquer. Pour cela, créer une zone « entrée uniquement » ou une zone périodique avec le contrat natif.
- Le filtre s'applique au renvoi proportionnel à des **dégâts reçus**. Les dégâts fixes de `contactDamage` sont exclusivement une riposte de mêlée ; ils ne créent pas un projectile de retour.
- Le vol de vie calculé sur la perte effective de PV reste le lot indépendant suivant, non traité ici.
