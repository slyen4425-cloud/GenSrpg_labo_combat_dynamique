# Import temporaire — Fluide météorite
Sur cette branche **uniquement**, déposer le fichier binaire `fluide_meteorite_upload_github.zip` ici via **Add file > Upload files**.
Cette archive a une taille inférieure à 25 Mio et contient 60 véritables PNG RGBA 512x512, 3 atlas WebP, le manifeste, la provenance et le README.
Le workflow `Import Fluide Meteorite VFX` valide les images, extrait les 66 fichiers sous `assets/library/capture/sprites/skills/fluide_meteorite/`, commite le résultat puis supprime l'archive temporaire.
Jusqu'au succès de l'import, le statut est PARTIEL : aucun asset réel n'est déclaré intégré à GitHub.
Ce chantier reste isolé du moteur combat, de la bibliothèque active et de `Zombicide-40k`.
