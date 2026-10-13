# Immatériel V1 — extension native du système d'immunité

Date : 13 octobre 2026

## Décision auteur et état de validation

- **Miroir V1** : GREEN technique, mais validation manuelle sur Android paysage explicitement **EN ATTENTE** à la demande de l'auteur. Cela ne bloque pas l'ouverture d'un autre lot isolé.
- **Immatériel V1** : seul lot décrit ici. Validation Android utilisateur **en attente**, indépendamment du résultat CI.

## Base / gouvernance

- Dépôt `slyen4425-cloud/GenSrpg_labo_combat_dynamique`, **sans toucher** `main`, `global-assets`, `Zombicide-40k` ni Exploration.
- SHA de départ : `1e2595916b68467cca4b6f73395b89ac77b52ec3` publié GREEN technique sur `gh-pages`, CI `38337440979` SUCCESS et Pages `38337440781` SUCCESS.
- Checkpoint initial `checkpoint/lab-start-intangible-v1-2026-10-13`, branche `work/lab-intangible-v1-2026-10-13`.
- RED test ajouté **avant le code** : commit `d3df9dd65f414cfbfb298d6497f9a2beb75d89d9`, CI `38343286956` FAILURE attendue.
- Le lot est consigné dans `docs/LAB_CURRENT_WORK.md` avant son codage.

## Contrats et comportement vérifiable

La créature devient immatérielle via le contrat de statut **existant** :

```json
{
  "id": "phase",
  "kind": "immunity",
  "polarity": "beneficial",
  "durationMs": 5000,
  "stacking": "refresh",
  "domains": ["damage", "negative_status"],
  "intangible": true
}
```

- Il ne s'agit **pas** d'une nouvelle classe de fighter, d'un second moteur ni d'une disparition du roster : le runtime de status natif gère durée, expiration, stacks et conservation des instances.
- Dégâts ordinaires : `applyCombatDamageV1` retourne 0, n'entame ni bouclier ni PV et ne crédite aucun KO.
- États nuisibles ordinaires : le même `combatProtectionForIncomingV1` empêche leur création. Les buffs positifs restent possibles, y compris sur un allié immatériel.
- Lorsque la capacité est **explicitement** autorisée, `SkillDefinition.hitsIntangible: true` permet aux seuls domaines de l'immunité *immatérielle* de céder. Une autre immunité classique active continue à bloquer.
- Aucun nom, élément, visuel, type de projectile ou identité de créature ne permet d'inférer cette exception.
- Les anciens statuts `immunity` sans `intangible` ne changent pas d'autorité. `hitsIntangible` défaut = `false`.
- Le Human Editor possède une case **« Immatériel »** sous le statut Immunité : elle force les deux domaines et la polarité bénéfique. La capacité dispose d'une case indépendante **« Cette capacité peut toucher une créature immatérielle »**. Les imports/exports passent par `normalizeCaptureSkillEditorDraftV1` sans registre séparé.
- L'option suit les **effets tactiques et différés**, les statuts nuisibles, les DoT d'une compétence et les dégâts/statuts des zones via leurs records natifs déjà existants.
- Les collisions restent résolues par la chaîne originale capteur -> Runtime -> Session -> protection ; si l'attaque ordinaire croise une créature immatérielle, son contact peut être visuellement détecté, mais elle ne cause ni perte PV ni statut négatif. Aucun nouveau hitbox ou détecteur de collision. Un feedback visuel spécialisé de traversée reste un futur lot visuel distinct, **non livré** ici.
- La réserve reste propriétaire de ses statusEffects ; aucune copie de l'immunité n'est faite dans l'UI ni sur un nouveau timer.

## Préservation et sentinelles

- Test `tests/integration/intangible-status-v1.test.mjs` : validations natives, immunité ordinaire inchangée, vrais chemins `CombatSession` direct et tactique, buffs et malus, durée et réactivation, KO/crédit, 1v1/2v2, ticks DoT et zone, stun historique sans dégât.
- Les tests d'immunité, Miroir (projectile réel), shields, DoT, zones, projectile clash, firestorm et bibliothèque de créatures (103) restent inclus dans la CI Foundation et deux vrais Chromium.
- Aucune mutation des capacités/créatures auteur existantes, sprites, assets, préréglage Rayon ou géométrie de combat.

## Gates de clôture

Un GREEN technique ne sera annoncé qu'après **CI SUCCESS sur le SHA final exact**, checkpoint GREEN exact, fast-forward protégé de `gh-pages`, confirmation CI/Pages en production. L'essai Android de l'auteur reste séparé et n'est jamais présumé accompli. L'absence d'essai Miroir ne sera pas présentée comme une validation.
