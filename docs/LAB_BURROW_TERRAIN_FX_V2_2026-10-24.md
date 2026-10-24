# Attaque souterraine — terrain animé V2 (24 octobre 2026)

## Objectif auteur

Visuel natif pour toute compétence `approachMode: "burrow"` : creusement à l'entrée, descente de la créature via Animation Core existant, sillon de terre visible jusqu'à la cible pendant la portion cachée, puis trou d'émergence et projection de débris. Aucun effet imposé à une créature particulière.

## Diagnostic : ne pas recréer le gameplay

Le moteur gère déjà la présence `underground`, l'évasion depuis la surface et l'impact Runtime depuis les lots `LAB_BURROW_GAMEPLAY_V1.md`, `LAB_BURROW_VISUAL_V1.md`. Les phases actuelles `burrow-dive / burrow-hidden / burrow-emerge-impact / burrow-home` sont conservées. Aucun second horodatage gameplay ni watcher de collision souterraine.

## Gouvernance

- Base GitHub Pages : `772edcff90d8ee3c4e848309a4867aaeebc34d20`
- Checkpoint START : `checkpoint/lab-start-burrow-ground-fx-v2-2026-10-24`
- Branche : `work/lab-burrow-ground-fx-v2-2026-10-24`
- Propriétaires : FX Core = `src/core/fx/burrow-terrain-fx-v2.js` pour timings/paramètres et géométrie ; adaptateur DOM = `src/adapters/renderer/dom-burrow-terrain-fx-v2.js` pour le tracé ; Demo UI se limite à passer les points de sol de l'arène et nettoyer le handle.
- Autorisés : 2 nouveaux modules, raccord minimal `src/ui/demo-app.js`, tests, ce document et journal.
- Protégés : Combat Rules, Runtime, présence, résolution d'impacts, Animation Core, sprites des créatures, rendu ombre unique, `global-assets`, moteur Capture principal, autres dépôts, `main`.

## Implémentation V2

- L'animation du personnage utilise la séquence Burrow V1, intacte.
- FX distincts : cavité circulaire au départ, sol strié en bande animée entre deux coordonnées réelles, poussière en crête mobile, cavité de sortie et 9 éclats projetés autour de la cible.
- L'effet est défini par le module de FX, pas par chaque fiche créature ; la longueur et l'angle s'adaptent à toutes distances/positions, notamment 1v1 et 2v2.
- Timings calculés à partir de l'autorité existante `burrowVisualDurationsV1(travelMs)` ; aucun second propriétaire de la durée de contact/dégâts.
- Les effets sont actuellement des **formes et dégradés procéduraux intégrés au DOM**, pas encore des atlas de sprites PNG auteur : ce lot produit une base visuelle immédiatement testable, avec rendu indépendant des sprites des créatures. Des atlas dessinés et validés pourront ensuite remplacer ces formes via Asset Input sans changer la logique.
- Nettoyage à la fin de l'approche, interruption, remplacement du combattant, masquage du slot et dispose global. Aucune poussière persistante.

## QA et validation

Tests : longueurs, angles, coordonnées, durées 1/2/650ms, débris déterministes, aucun sillon à longueur nulle, création et annulation des éléments DOM, nettoyage d'interruption et non-accès aux règles de combat. CI Foundation + navigateurs exigés avant fusion. Une vérification Android est nécessaire pour valider la perspective de terrain, les hauteurs et la lisibilité du sillon.

## Suite possible

Ajouter des sprite-sheets sol creusé / mottes / impact (terre sèche, neige, sable, roche...) dans `global-assets`, avec choix de surface issu de l'environnement d'exploration. Ce raccord environnemental **n'est pas** implémenté dans ce lot, pour éviter un couplage caché au laboratoire Exploration.
