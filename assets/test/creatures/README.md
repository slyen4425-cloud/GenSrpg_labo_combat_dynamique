# Créatures de test

Format V1 :

```
<creature>/
  <creature>_opponent.png
  <creature>_player.png
  <creature>_icon.png
  <creature>.meta.json
```

Les vues de combat sont normalisées sur un canvas transparent 1024x1024.
Les icônes sont normalisées sur un canvas transparent 384x384.

La vue `opponent` correspond au 3/4 face.
La vue `player` correspond au 3/4 dos.

Une seule image doit rester un fallback valide pour les futures créatures utilisateur ; les deux vues sont un enrichissement du laboratoire, pas une dépendance obligatoire du Core.
