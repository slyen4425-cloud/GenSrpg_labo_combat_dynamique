# 🐎 STANDARD D'ANIMATION — CRÉATURE TYPE CHEVAL

**État : modèle de référence établi le 20 novembre 2026.**  
**Référence source : [Raiiven, vues et attaques validées](references/raiiven/README.md)**

## Morphologie et sens du mouvement

- Quatre pattes cohérentes du début à la fin. Une patte ne devient jamais une autre, ne disparaît et n'apparaît ; articulations épaules, hanches, genoux/jarrets et sabots anatomiques.
- **Direction DOS / joueur** : progression en **diagonale vers le haut et la droite**, jamais une course horizontale de gauche vers droite ; conserver l'angle trois-quarts du modèle maître.
- **Direction FACE / adversaire** : préserver strictement la perspective et la direction du maître FACE, distincte du DOS ; pas de retournement automatique.
- Animation de course : cycle d'appuis, impulsion, phase d'extension, retour au contact ; tête/encolure stabilisées mais vivantes, crinière/queue suivent légèrement le mouvement ; sabots assurent la lecture du galop.
- Animation d'attaque : pose neutre → anticipation → extension offensive → point culminant → récupération. Pas d'effet magique intégré d'office.
- La créature reste ancrée au même repère de jeu ; la **progression diagonale est l'intention et la direction de sa foulée**, pas une simple translation du sprite sur la planche.

## Références Raiiven réellement retenues

| Mouvement | Vue | Frames | Cadence de la référence | Fichier |
|---|---|---:|---:|---|
| Galop | DOS / joueur | 7 | 120 ms/image, boucle | [galop_dos_7f.png](references/raiiven/galop_dos_7f.png) |
| Attaque | DOS / joueur | 5 | 180 ms/image, une fois | [attaque_dos_5f.png](references/raiiven/attaque_dos_5f.png) |
| Galop | FACE / adversaire | 6 | 130 ms/image, boucle | [galop_face_6f.png](references/raiiven/galop_face_6f.png) |
| Attaque | FACE / adversaire | 5 | 180 ms/image, une fois | [attaque_face_5f.png](references/raiiven/attaque_face_5f.png) |

**Important :** ces nombres de frames décrivent les **planches validées de Raiiven** ; ce ne sont pas des limites imposées aux futures créatures. Une nouvelle animation peut exiger 8, 12, 16 ou davantage de vraies poses pour conserver la fluidité.

## Pour fabriquer une nouvelle créature équine

Lire les 4 planches comme **référence de cinématique et d'anatomie**, jamais comme pixels à recolorer ou déformer pour une autre espèce. Utiliser **les maîtres propres à la nouvelle créature**, préserver palette et motifs. Conserver les faces/dos séparés, l'ordre et la continuité ; puis fournir une preview réelle et attendre la validation.

L'atelier **ne modifie pas les assets Raiiven en jeu**.
