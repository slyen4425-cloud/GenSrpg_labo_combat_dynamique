# Contours tactiques élémentaires V1 — 16 octobre 2026

**Lot C**, base de départ `d3f14432e74361edc33cdbbdcfe021aab91b354c`.

## Correction

- L'onde expansive lit **son élément natif** déjà projeté par `planSkillReleaseFx` sur `node.dataset.element` ; elle conserve l'anneau et son sweep de collision existants.
- La zone persistante lit **`CombatState.persistentZones[].skillElement`**, déjà possédé par `PersistentZoneRuntime`, et le projette uniquement sur le repère `data-tactical-radius`. Le sprite garde son alpha, ses transforms, ses sprites et son ordre de rendu ; aucun accès à un catalogue ou doublon de définition.
- `demo.css` fournit un mapping unique de présentation par attribut `data-element` : feu rouge-orangé, eau/gel bleus, nature vert, électricité jaune, terre ocre, air cyan, poison violet, lumière doré, ombre mauve, acier bleu-gris, psy rose, esprit lavande. Inconnu/absent = neutre. Le bord est un peu plus visible (1,5 CSS pixel demandé, arrondi Chromium autorisé), lueur légère, remplissage très faible ; aucun traitement de zone ni filtre de cible modifié.
- `pointer-events:none` sur tous les repères ; le pseudo-élément décoratif de la règle feu générique reste désactivé sur un repère tactique. Aucun temporisateur ou observateur supplémentaire.

## Vérification

- Un test d'intégration vérifie la provenance de l'élément, le changement d'élément entre renforcements, le nettoyage des repères, l'onde et les 13 règles CSS. Le navigateur Chromium Firestorm vérifie la **vraie couleur calculée** du feu via `getComputedStyle().borderTopColor`, la non-interactivité et une bordure fine malgré l'arrondi sous-pixel.
- Trois jobs CI requis sur SHA exact : Foundation / Firestorm browser / Creature Library browser. Pas de validation physique Android revendiquée.
