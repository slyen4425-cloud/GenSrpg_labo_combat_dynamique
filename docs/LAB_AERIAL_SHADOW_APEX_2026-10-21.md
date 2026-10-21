# Labo Combat — Ombre pendant l'envol des techniques aériennes
Date : 21 octobre 2026.

Après validation du placement des ombres et de leur oscillation idle, le mode `aerial-attack` doit réduire légèrement la taille de l'ombre lorsque la créature atteint le sommet de sa trajectoire.

Correction minimale dans l'unique plan Animation Core : multiplier `ground.scale` du segment déjà nommé `aerial-arc-apex` par le preset `specialMoves.aerial.shadowApexScale` (0,86 pour le profil flying et valeur de repli, bornes 0,65–1). Le plan conserve la même position de l'ombre, la même durée, les mêmes segments d'impact et de retour. La déformation 2.5D et les origines de transformation restent protégées.

Contrôles unitaires : deux camps et leurs échelles, même trajectoire du corps et même position d'ombre, différence de 14% à l'apex uniquement, retour neutre et bornes, anciennes sentinelles puis CI 5/5. Contrôle esthétique sur Android distinct de la preuve technique.
