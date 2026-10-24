# Maraileron FACE : nage et attaque, 12 poses approuvées — 2026-10-24

Source auteur réelle: global-assets/_incoming/MARAILERON_FACE_2_ANIMATIONS_NAGE_ATTAQUE.zip (10 481 378 octets, SHA256 96e5c35a577b73bda926dedc29ee4cf16b565e474283e925fc6bc9aa8fc6aa30, Git blob 0af1f0ca910817f7a444edb0bc220ea7b682e62b). ZIP CRC contrôlé. Contenu 31 fichiers, dont 24 PNG RGBA 512x512 originaux, deux planches sources 2048x1536, deux GIF 12 frames, deux WebP animés 12 frames et README. Les 24 PNG sont pixel-identiques aux cellules 4x3 des deux planches. Aucune regénération artistique ni déformation.

Identité Maraileron, fiche profil serpentine. La vue est opponent (= face, côté adversaire; modèle fixe maraileron_opponent.webp), distincte du player (= dos/côté joueur) déjà importé 6 frames nage et 12 frames attaque. Deux IDs nouveaux uniques : pack:capture:creature-maraileron-movement-opponent-12-v1 et pack:capture:creature-maraileron-attack-opponent-12-v1.

Destination: assets/library/capture/creatures/maraileron/animations/{movement,attack}/opponent/. Export 24 PNG originaux byte-for-byte, 2 sprite-strips WebP 384x384x12, 6 previews originales GIF/WebP/planche, 2 manifestes et 3 documents sources, catalogue unique. Nage 110ms/frame, loop. Attaque 110ms/frame, once. L'aperçu GIF de l'attaque peut tourner pour faciliter la revue, contrairement au runtime qui joue une fois.

Base global-assets@2ac2d5ce48bdbfd2c490aec7cd2369b2ba29a8ea ; checkpoint de départ checkpoint/global-assets-before-maraileron-face12-2026-10-24 ; branche isolée work/global-assets-maraileron-face12-2026-10-24.

Périmètre interdit: aucun remplacement du runtime Maraileron, des animations player déjà validées, des autres créatures, de l'UI, du moteur, des données auteur, de main ou gh-pages ou de GenSrpG. Raccord catalogue uniquement; affectation automatique dans les fiches de créatures non autorisée, validation mobile distincte. Après tests CI au SHA réel et revue du diff, checkpoint GREEN puis publication fast-forward sous lease.
