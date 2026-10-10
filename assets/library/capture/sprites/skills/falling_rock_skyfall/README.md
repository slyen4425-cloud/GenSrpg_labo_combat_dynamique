# Rocher tombant du ciel

- Asset ID : `pack:capture:sprite-falling-rock-skyfall-01`
- Rôle : `travel` ; élément : terre ; purement visuel.
- 20 frames distinctes 512×512 RGBA, cadencées à 70 ms ; playback `once`.
- Atlas WebP horizontal optimisé : 7680×384, 20 cellules de 384×384.
- Source générée : 1402×1122 en grille 5×4 ; les images 512 sont rééchantillonnées (résolution non native).
- `frames/` et `atlases/` sont des médias ; le catalogue global conserve l'autorité de l'assetId.
- L'éditeur Capture peut sélectionner le sprite via le catalogue ; aucun changement de Gameplay, dégâts ou Projectile Runtime.
- Prévu pour le moteur existant `skyfall` (trajectoire du ciel) et son impact sur la cible.
