# Stack Threshold V1 — seuils de charges et effets tactiques natifs

Date : 13 octobre 2026.

## Gouvernance
- Dépôt unique : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.
- Base LIVE publiée : `47ef1b07d9ec537ceacc7d11e3353c54e8cf6807` (CI `38343981186`, Pages `38343980753`, SUCCESS).
- Checkpoint initial avant modifications : `checkpoint/lab-start-stack-threshold-v1-2026-10-13`.
- Branche : `work/lab-stack-threshold-v1-2026-10-13`.
- `main`, `global-assets`, GenSrpG et Exploration non modifiés. Aucun asset, export auteur, créature ou compétence vitrine réécrit.
- Les validations Android paysage Miroir et Immatériel restent en attente, comme demandé.

## Contrat
Le **StatusEffectV1 natif** (non une nouvelle réserve de stacks) accepte désormais ce champ optionnel uniquement si `stacking:"stack"` et `count <= maxStacks` :

```json
{
  "id":"givre-progressif", "kind":"stack_counter", "polarity":"detrimental",
  "durationMs":10000, "stacking":"stack", "maxStacks":5,
  "onStackThreshold":{
    "count":5, "consume":"reset",
    "effects":[
      {"kind":"damage","targetScope":"target","amount":20,"channel":"ice"},
      {"kind":"apply_status","targetScope":"target","status":{
        "id":"gele","kind":"stun","polarity":"detrimental",
        "durationMs":2000,"stacking":"replace"
      }}
    ]
  }
}
```

- `stack_counter` est une nature de statut **sans effet avant le seuil**, bénéfique ou négative, avec la même durée/instance/stacking/persistance que les autres kinds.
- Seuil 1 à `maxStacks` ; déclenchement strict au franchissement réel, pas sur `refresh` ou répétition au plafond.
- `consume:"reset"` retire toutes les stacks **avant** d'exécuter les effets. Les charges suivantes repartent de 1.
- `consume:"keep"` conserve les charges et exécute une fois par franchissement, pas à chaque nouveau stack au plafond. Le retour à zéro par expiration réarme.
- Les effets sont normalisés via le **même SkillEffectV1** : `damage`, `heal`, `energy_restore`, `energy_drain`, `apply_status` (buff/debuff/DoT/HoT/stun/shield/etc.), `cleanse`, `dispel`. Jusqu'à 12 effets simultanés dans l'ordre.
- `targetScope:target` = porteur des charges ; `self` = créature ayant appliqué la charge déclenchante. Les scopes d'équipe et de réserve ne sont pas ajoutés à la mécanique V1.
- Le propriétaire `Status Effect Runtime` constate le franchissement ; `Immediate Tactical Effects` exécute les effets selon ses propriétaires déjà présents : Damage Application, HP, énergie, protections/immunités, statuts, KO. Les événements tactiques hit/soin/énergie sont transmis au chemin habituel de résolution, sans deuxième calcul.
- Aucune horloge, aucun compteur, aucun moteur visuel ou dégâts concurrent. Cascades de statuts bornées (protection antirécursion).
- Aucune compétence par nom et aucune condition sur un élément/une créature.

## Human Editor et HUD
Dans une capacité, sous **Effets tactiques → Appliquer un statut** :
1. Choisir « Empiler » (stack), puis « Stacks max ».
2. Activer « Déclencher des effets à un seuil de stacks ».
3. Choisir nombre de stacks, « consommer toutes les charges » ou « conserver ».
4. Ajouter un ou plusieurs effets : dégâts, soins, récupération/drain énergie, buff/malus ou nettoyage/dissipation. Chaque effet peut viser le porteur des charges ou la source. Les buffs/malus possèdent un sous-formulaire.
5. Choisir `Compteur de charges (sans effet avant le seuil)` pour une accumulation pure.

Les champs utilisent la fiche `configuredSkills` existante, y compris l'import/export natif ; aucun registre de statuts bis. Le HUD partage les `statusEffects` du même snapshot et affiche `1/5`, `2/5`, etc., pour un seuil, et préserve le simple nombre pour les anciens statuts.

## Limites explicites
- **Drain de vie proportionnel aux PV réellement retirés** : non encore réalisé ; reste le lot indépendant D. Une séquence fixe dégâts + soins est configurable, mais ce n'est pas du vrai vol de vie.
- K.O. au seuil via un effet de dégâts du moteur et les protections normales. Un `force_KO` qui contournerait les immunités n'est pas introduit.
- `persistent_zone`, `scheduled_effect` et scopes d'équipe/réserve ne sont pas des **effets déclenchés directement par un seuil** dans V1, pour éviter d'ajouter une autre autorité ou un nouveau calendrier. Un statut provenant d'une zone existante peut néanmoins utiliser la même mécanique de stacks.
- La présentation utilisateur sur Android paysage reste à vérifier ; aucun GREEN utilisateur n'est présumé.
- Un formulaire spécialisé plus avancé pour les variantes complexes de statut, la visualisation des animations du seuil et les composantes réseau ne sont pas livrés par ce jalon.

## Preuve technique
- RED : `tests/integration/stack-threshold-v1.test.mjs` introduit avant code sur `65a58f4d9af5e876e7467b768aad95a608c68098`, CI `38361044445` en échec attendu.
- Tests : seuil 1, reset/keep, cap et idempotence, effets positifs/négatifs, heal/énergie/drain, application de statuts, droits d'immunité, KO, expiration, stacking des anciens statuts, 1v1 et isolation 2v2, stream d'événements, roundtrip du builder, zone interdite au déclenchement immédiat, counter.
- `tests/unit/stack-threshold-hud-v1.test.mjs` garantit le rendu snapshot `actuels/seuil` sans nouveau compteur, et les contrôles de l'éditeur.
- Version de code contrôlée `103627884ea8269fb9c995b1cc06d61605a7e36a` : CI Laboratory `38362418910` **SUCCESS**, Foundation **1629/1629**, Chromium `creature-library-browser` et `firestorm-zone-growth-browser` **SUCCESS**.
- Avant GREEN technique : CI sur le SHA documentaire final exact, checkpoint GREEN identique, publication `gh-pages` sous contrôle d'avance non forcée, puis CI/Pages post-publication SUCCESS.
