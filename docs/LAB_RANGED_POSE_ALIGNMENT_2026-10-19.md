# Correction — position du sprite attaque de dos (19 octobre 2026)

## Symptôme
Pendant l'attaque à distance, le joueur perçoit un léger saut vers la droite lorsque le corps du monstre est remplacé par sa bande d'animation de dos. L'adversaire est correctement aligné. Le shell d'animation est déjà centré sur le modèle, mais le contenu d'une planche peut être décalé à l'intérieur de son propre cadre.

## Correction
- Nouvelle présentation optionnelle V7 `visual.rangedAttackPlacement.front/back`, points `{x,y}` bornés à ±400 pixels.
- Dans Créature > Apparence > Animations > Attaque à distance : quatre champs X/Y indépendants pour FACE et DOS. X négatif déplace à gauche, Y négatif vers le haut.
- Compensation purement visuelle sur le shell temporaire (mêmes masque et effets teinte), sans déplacer le combattant ni modifier ses sockets/FX des capacités, hitbox ou mécanique de dégâts.
- Anciennes présentations V1–V6 sont conservées. Aucune correction non demandée n'est appliquée par défaut. Les valeurs zéro maintiennent le rendu historique à l'identique.
- Retrait automatique du décalage lors de la fin, annulation, disparition ou rappel du sprite.
- Validation sur le téléphone : ajuster X DOS (commencer vers -20 px), puis Y si besoin ; contrôler FACE et les phases repos/attaque.

## Tests
- Red/green : `tests/unit/capture-ranged-pose-alignment-2026-10-19.test.mjs`.
- CI complète, checkpoint et Pages doivent être vérifiés au SHA de publication.
