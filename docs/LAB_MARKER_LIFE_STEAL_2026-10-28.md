# Labo Combat — Drain de vie périodique sur marqueurs (28 octobre 2026)

## Objectif
Ajouter dans l'éditeur Capture un effet de marqueur qui inflige des dégâts périodiques au porteur et restitue au **lanceur vivant** un pourcentage des PV réellement perdus. Ce n'est ni un soin sur la cible, ni un effet `life_steal` d'attaque directe ajouté à chaque DoT. L'ancienne mécanique de drain direct reste inchangée.

## Propriétaires et frontières
- Un seul objet `CaptureMarkerV1` / `StatusEffectV1(kind:"stack_counter")` avec `periodic.kind:"life_steal"`.
- L'unique `StatusEffectRuntime` possède la durée, les charges, la source `sourceActorId` et les échéances `nextTickAtMs`. Pas de deuxième statut, ni minuterie, ni propriétaire UI.
- Chaque tick suit l'ancien chemin `applyDotTick → applyCombatDamageV1`. Les immunités, boucliers, résistances (mode `combat`), dégâts réellement appliqués, K.O. et renvois restent gouvernés par le propriétaire de dégâts.
- Le soin passe par `applyHotTick → withFighterHp` (propriétaire PV déjà utilisé par le HoT). Aucune branche modifiant les PV directement dans l'éditeur.
- En cas de source absente, au sol (PV 0), ou identique au porteur : aucun soin. Une réflexion létale peut donc empêcher le vol de vie ; l'effet ne ressuscite pas son auteur.
- Une seule attribution : le dernier lanceur enregistré par le compteur partagé du marqueur, selon les règles existantes de mise à jour de `sourceActorId`.
- Aucun soin si `appliedDamage = 0`. Le calcul de soin demandé recopie le taux du drain d'attaque natif : `min(maxHeal ?? Infinity, Math.round(appliedDamage * percent) / 100)`, puis plafonnement par `withFighterHp`. Un overkill ne rapporte pas les dégâts théoriques.

## Contrat de données
```json
{
  "kind": "life_steal",
  "amount": 5,
  "intervalMs": 5000,
  "damageMode": "fixed",
  "channel": "poison",
  "percent": 50,
  "maxHeal": 8
}
```
- `amount` : dégâts positifs **par charge** à chaque tick.
- `intervalMs` : délai positif depuis l'horloge de combat, sans second timer.
- `damageMode` : `fixed` (boucliers/immunité) ou `combat` (résistances).
- `channel` : canal de dégâts existant.
- `percent` : numérique requis, 0 à 100.
- `maxHeal` : facultatif, numérique non négatif, limite de soin par tick. Absence = aucun plafond.
- `damage` et `heal` restent compatibles ; seules les clés du mode `life_steal` apparaissent pour ce mode. Le contrat refuse les champs `percent` et `maxHeal` pour les modes historiques.

## Chemin éditeur
Bibliothèque de marqueurs → Nouveau → nom en français (ID auto) → Effet périodique par charge → Drain de vie par charge → dégâts/charge, intervalle, dégâts et élément, pourcentage restitué, plafond facultatif → Enregistrer. La même fiche est relue, propagée par le registre déjà en place et exportée telle quelle. L'explication joueur mentionne la restitution au lanceur.

## Test / livraison
- TDD : `tests/integration/capture-marker-life-steal-2026-10-28.test.mjs` : contrat/portabilité, 3 charges/horloge unique, résistances/évitement de heal sans dégâts, bouclier partiel, immunité, overkill, KO avant heal, source du dernier poseur, durée/consommation, modes historiques, champs DOM.
- Navigateur réel : extension du scénario marqueurs de `tests/browser/capture-creature-library-smoke.mjs`, avec création au nom seulement, affichage conditionnel, sauvegarde, rechargement et export JSON du marqueur.
- Aucun changement de `global-assets`, des catalogues vitrine, des capacités/creatures existantes, de `main` ni de GenSrpG. `gh-pages` seulement après CI 5 jobs GREEN, checkpoint exact et déploiement Pages.
- Validation tactique/ergonomique Android par l'auteur après publication.
