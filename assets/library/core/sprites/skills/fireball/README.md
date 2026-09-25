# GenSrpG — Fireball sprite pack 01

Pack de sprites documentaire pour la bibliothèque Core. Aucun raccord au Combat Runtime dans ce lot.

## Structure

Chaque animation est stockée comme une bande horizontale WebP transparente. Chaque frame mesure 256×256. Le moteur de présentation pourra découper la bande de gauche à droite selon le nombre de frames indiqué dans `sprite_skill_fireball_sequences_01.json`.

Séquences :
- `cast` : 6 frames
- `travel_lr` : 8 frames, gauche vers droite
- `travel_rl` : 8 frames, droite vers gauche
- `travel_dr` : 8 frames, diagonale bas-droite
- `travel_dl` : 8 frames, diagonale bas-gauche
- `impact` : 6 frames

La trajectoire écran est une responsabilité de présentation. Les dégâts, la portée et le timing gameplay restent dans les données/règles de compétence.

Provenance : création originale générée pour GenSrpG le 2026-09-25. Aucune ressource d’un jeu commercial n’a été extraite.
