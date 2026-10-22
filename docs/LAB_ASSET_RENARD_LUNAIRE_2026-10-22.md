# Renard lunaire — trois visuels de créature (22 octobre 2026)

Source : les deux vues fournies par l'auteur dans la conversation (FACE, DOS), et une icône circulaire corrigée au format des icônes déjà présentes dans le jeu. La série a été transcodée en WebP sans mise en place d'une animation fictive. Images originales et iconographie conservées.

## Contenus publiables
- `pack:capture:creature-renard-lunaire-opponent-01` → `capture/creatures/renard_lunaire/runtime/renard_lunaire_face.webp`, 512×512, image fixe (adversaire FACE).
- `pack:capture:creature-renard-lunaire-player-01` → `capture/creatures/renard_lunaire/runtime/renard_lunaire_dos.webp`, 512×512, image fixe (joueur DOS).
- `pack:capture:creature-renard-lunaire-icon-01` → `capture/creatures/renard_lunaire/runtime/renard_lunaire_icon.webp`, 384×384, médaillon de créature.

Les trois fichiers physiques ont été vérifiés par lecture de blobs GitHub. SHA Git respectifs : `b4f2d125e4486f480df22bc0f982b59f728ef46e`, `b92c79758eccf5c494c229a6b8acb4e99110b8f7`, `7ab7af3355ed3fb6423bfd9388215b3f5e3d364e`.

## Compatibilité et limites
Les deux vues sont des modèles **statiques**, présents dans les choix IMAGE FACE/DOS et catalogues Creature. Elles n'ont ni `resource.frameCount` ni tags `movement` / `attack` et ne doivent pas être simulées comme des séquences d'animation. Les menus d'animation Déplacement et Attaque n'affichent que les véritables sprites multi-frames dans un lot séparé (`work/lab-creature-asset-selector-cleanup-2026-10-22`).

Classement élémentaire laissé indéterminé dans le catalogue : aucune statistique Nature/Ombre/Lumière n'a été attribuée à la créature par l'auteur. Tags descriptifs `lunar`, `moon`, `arcane` uniquement pour le moment.

Dépôt central officiel : branche `global-assets`. Branch de travail `work/assets-renard-lunaire-2026-10-22` depuis `checkpoint/assets-start-renard-lunaire-2026-10-22` (`842bb4c59653d70950e4abdf2cd9a27341a3e642`). Ne pas publier sur `main` ni dupliquer ailleurs.
