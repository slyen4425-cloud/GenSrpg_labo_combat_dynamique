# Human Editor Expressiveness V1

Date : 2026-10-06

## Base

Base exacte :

`11a1d7ac1aaefa37f2f3a367bdcbf6f6f810c4a2`

Checkpoint de départ :

`checkpoint/lab-start-human-editor-expressiveness-v1-2026-10-06`

Branche :

`work/lab-human-editor-expressiveness-v1-2026-10-06`

## But

Exposer dans le Human Editor les contrats moteur déjà GREEN, sans déplacer leur autorité dans l'UI.

Le Human Editor peut maintenant configurer visiblement :

### Créature

- tempo de mobilité :
  - Très rapide ;
  - Rapide ;
  - Normal ;
  - Lent ;
  - Très lent ;
  - Personnalisé ;
- valeur réellement persistée :
  `approachTimeModifierPct`.

Les presets sont uniquement une projection UI vers cette valeur unique.

### Capacité

- `approachMode = burrow` ;
- activation explicite de la portée par présence ;
- présences :
  - surface ;
  - airborne ;
  - underground ;
- `dodgeable` ;
- localisation de cible :
  - active ;
  - reserve.

### Effets tactiques

- status `immunity` ;
- domaines :
  - damage ;
  - negative_status ;
- `scheduled_effect` avec délai lisible en secondes puis conversion vers `after_ms`.

La première UI simple du scheduled effect propose les effets imbriqués :
- damage ;
- heal ;
- energy_restore ;
- energy_drain.

Le contrat moteur reste l'autorité et pourra recevoir d'autres effets imbriqués supportés dans un lot UI ultérieur sans nouveau scheduler.

## Compatibilité legacy

Point important :

`hitPresenceStates = null`

reste le comportement historique.

L'éditeur possède donc un opt-in explicite :

`Définir explicitement les présences atteignables`.

Tant que ce contrôle est désactivé :
- l'éditeur ne transforme pas silencieusement une ancienne compétence en `surface-only` ;
- les anciennes règles d'évasion restent inchangées.

Quand il est activé :
- les cases surface / aérien / souterrain écrivent le contrat moteur déjà GREEN.

## Mobilité créature

Le profil :
- bipède ;
- quadrupède ;
- volant ;
- rampant ;
- massif

reste séparé de la vitesse gameplay.

Le Human Editor mappe :
- Très rapide = -40 % ;
- Rapide = -20 % ;
- Normal = 0 % ;
- Lent = +25 % ;
- Très lent = +50 %.

Une valeur personnalisée reste possible.

Aucune classe de vitesse secondaire n'est persistée.

## Ciblage réserve

Le contrôle UI utilise le vocabulaire :

`data-skill-location-scope`

et non l'ancien namespace `data-skill-target...`.

Ce choix est intentionnel :
- l'ancien ciblage éditable concurrent reste supprimé ;
- le nouveau contrôle ne fait qu'écrire `SkillDefinition.targetLocations` ;
- RosterSession reste le propriétaire de la réserve.

## TDD / CI

### Première intégration

HEAD :

`043a061833902e8c1ddb8d726d8e4722af4f259b`

CI :

`37496102015`

Résultat :
- 1168 tests ;
- 1167 PASS ;
- 1 FAIL.

Tous les builders étaient déjà GREEN.

L'unique échec démontrait que les contrôles n'étaient pas encore exposés dans la vraie page HTML.

### Raccord HTML / interaction

Les contrôles ont ensuite été ajoutés à la vraie page et raccordés à :
- création ;
- lecture d'un draft existant ;
- modification ;
- import/export ;
- round-trip.

Une CI intermédiaire :

`37497191300`

a révélé un conflit légitime avec la sentinelle historique interdisant le namespace `data-skill-target...`.

La sentinelle n'a PAS été affaiblie.

Le nouveau contrôle de localisation a été renommé en :

`data-skill-location-scope`.

### GREEN fonctionnel

HEAD fonctionnel :

`a357b933c8aff4bcb565f739aa0ff8575bb4da0b`

CI :

`37497368087`

Résultat :

- 1168 / 1168 PASS ;
- 0 FAIL.

Sentinelles importantes :
- nouveaux contrôles présents dans le HTML ;
- aucun JSON editor ;
- aucune autorité Runtime dans le Human Editor ;
- aucune résurrection de l'ancien ciblage concurrent ;
- builders mobilité / burrow / presence / dodgeable / reserve GREEN ;
- immunity GREEN ;
- scheduled effect GREEN ;
- anciens contrats / éditeur / combat restent GREEN.

## Fichiers fonctionnels modifiés

- `src/ui/capture-editor-human-v2.js`
- `examples/dom-demo/capture-editor-v2.html`
- `tests/unit/capture-editor-human-v2.test.mjs`
- documentation du chantier.

## Domaines protégés / inchangés

Aucune modification fonctionnelle de :
- Combat Runtime ;
- Action Resolver ;
- Combat Damage ;
- Status Runtime ;
- Roster Session ;
- Scheduled Effect Runtime ;
- Persistent Zone Runtime ;
- Collision ;
- renderer / FX ;
- Tempête de flammes ;
- données auteur Showcase ;
- placement des ennemis paysage.

## Ce qui est réellement testable dans la preview

### Testable directement dans l'éditeur

- presets vitesse créature + valeur personnalisée ;
- Burrow comme approche ;
- portée surface / aérien / souterrain ;
- esquivable / non esquivable ;
- active / reserve comme localisation de cible ;
- création d'un status Immunity et ses domaines ;
- création d'un effet différé avec délai.

### Limites de la preview actuelle

- le moteur Reserve Targeting est GREEN, mais la preview de combat n'offre pas encore une interface complète de sélection d'un membre du banc comme cible ;
- le gameplay Burrow est GREEN, mais l'animation visuelle spécifique entrée sous terre / déplacement / émergence reste un lot renderer séparé ;
- l'effet Scheduled peut être configuré ; les FX spéciaux d'une future Comète restent à créer séparément.

Ces limites ne sont pas masquées dans l'éditeur.

## Suite

1. verrouiller ce lot avec checkpoint GREEN + preview ;
2. micro-lot `Capture enemy landscape placement V1` :
   - adversaires légèrement plus haut ;
   - légèrement plus à droite ;
   - 1v1 + 2v2 ;
   - layout/slots uniquement ;
   - aucun changement de scale auteur / projectile / FX ;
3. animation Burrow dans un lot présentation séparé ;
4. améliorer si nécessaire l'UX de sélection de cible réserve en preview.
