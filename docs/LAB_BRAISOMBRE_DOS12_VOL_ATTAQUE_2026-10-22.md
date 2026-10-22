# Braisombre — vol et attaque DOS (12 frames), 22/10/2026

Deux planches approuvées par l'auteur, extraites sans régénération et sans changement volontaire de couleur. Source réelle sur GitHub global-assets/_incoming/BRAISOMBRE_DOS_12F_VOL_ATTAQUE_APPROUVE_2026-10-22.zip, 4 194 431 octets, SHA256 e991b4e403cc40bd56a6b87577062aff3bc8fa3745eae95c04ae1e33473ea6a4, Git blob 9db159a1e82ebf1005e0099f2a702e3598ad618b, ZIP CRC OK.

La planche source mesure 1448×1086 RGBA pour chacune des animations, en grille 4×3. Certaines ailes dépassent les limites virtuelles des cases : le script utilise les 12 vraies composantes alpha, et conserve les pixels source plutôt que de couper en rectangles. 24 frames distinctes PNG RGBA 512×512 avec ≥64 px de marge, 2 atlas WebP 4608×384, 6 previews animées / planches, 2 manifestes, 2 sources. Vol 90ms en boucle ; attaque 100ms une fois.

Asset IDs : pack:capture:creature-braisombre-movement-dos-12-v1 et pack:capture:creature-braisombre-attack-dos-12-v1. Unique propriétaire: catalogue visuel Capture dans global-assets. Chemins sous assets/library/capture/creatures/braisombre/animations/{movement,attack}/dos/ ; les originaux sous animations/sources/.

Départ global-assets@3611cc015206f4bb12614d844fcdafd6122b69f3 ; checkpoint/global-assets-start-braisombre-dos12-2026-10-22 ; branche work/global-assets-braisombre-dos12-2026-10-22. Protéger les runtime Braisombre, les animations FACE, les autres créatures, le moteur, l'UI, main, gh-pages et GenSrpG.

CI npm run ci sur vrais médias et Git SHA final, revue diff, checkpoint GREEN puis publication global-assets FF, sans affectation automatique aux fiches auteur. Une validation smartphone est distincte.
