# Impact roche ascendant

- Asset ID : `pack:capture:sprite-rock-impact-upward-01`
- Rôle : `impact` ; élément : terre ; purement visuel.
- 16 frames distinctes 512×512 RGBA, cadencées à 75 ms ; playback `once`.
- Atlas WebP horizontal optimisé : 6144×384, 16 cellules de 384×384.
- Source générée : 1254×1254 en grille 4×4 ; les images 512 sont rééchantillonnées (résolution non native).
- `frames/` et `atlases/` sont des médias ; le catalogue global conserve l'autorité de l'assetId.
- L'éditeur Capture peut sélectionner le sprite via le catalogue ; aucun changement de Gameplay, dégâts ou Projectile Runtime.
- Prévu pour le moteur existant `skyfall` (trajectoire du ciel) et son impact sur la cible.
