# Upload réel — Bouclier de lumière

La branche de travail « work/lab-light-shield-sprites-2026-10-17 » dispose d'un importeur
validant **la vraie archive générée dans la conversation**.

Sur cette branche uniquement, cliquer sur Add file > Upload files et déposer à ce chemin
le binaire **bouclier_lumiere_40_frames_github.zip** (13,4 Mo).
Laisser l'archive ZIP intacte (ne pas décompresser à la main).

Le workflow GitHub Actions « Import real Light Shield Sprites » extrait les 40 vrais
PNG transparents 512x512, les 2 atlas WebP 7680x384, le manifeste,
la provenance et le README sous « assets/library/capture/sprites/skills/light_shield/ ».
Il contrôle les octets, publie les deux assetIds via le catalogue canonique
et lance la CI avant de pousser le commit d'import sur la même branche.

IMPORTANT : tant que le ZIP n'est pas présent puis importé, les médias **ne sont pas
sur GitHub**. Le code de réception n'est pas un substitut d'images.
Après CI de la branche, publier sur global-assets par avance rapide contrôlée.
