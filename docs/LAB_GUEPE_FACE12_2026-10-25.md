# Guêpe cybernétique FACE — 25/10/2026

Source approuvée : _incoming/GUEPE_CYBERNETIQUE_FACE_MOUVEMENT_ATTAQUE_12F_NETTOYES.zip ; 11948531 octets SHA256 082eb38273f46f306fef3076bfac287985a3bc38d057e00c8e5e51a04a48b4fa, Git blob c86cd66adedbed199b73d93c9c909eab4556a24c.

Importer les 24 PNG RGBA 512px source sans toucher aux pixels. Vue opponent (face) ; movement 12f 100ms loop, attack 12f 100ms once ; atlas et previews source avec nettoyage des artefacts à gauche. IDs pack:capture:creature-guepe-cybernetique-movement-opponent-12-v1 et pack:capture:creature-guepe-cybernetique-attack-opponent-12-v1. Bibliothèque unique, pas d'affectation automatique.

Base global-assets@d269ac78012feb9f22f5e30abf2b06ba83877d45 ; checkpoint/global-assets-before-guepe-face12-2026-10-25 ; work/global-assets-guepe-face12-2026-10-25. Protégés : animations PLAYER, autres créatures, modèle fixe, UI/moteur, main et gh-pages. CI sur médias réels, revue diff, checkpoint GREEN et FF avant publication. Test Android distinct.

## Import et vérifications réels

- Import workflow 40151840708 **SUCCESS** après adaptation de l'assertion de transparence pour accepter les pixels alpha anti-crénelés de la source (minimum maximal 247), sans modifier les images approuvées. Premier essai 40151775626 rouge uniquement sur l'assertion trop stricte.
- Commit média : 1b0efee27fa1ed79249e76dc74e53375564d2da5 ; 24 PNG RGBA 512px vérifiés par SHA manifest, 2 atlas WebP 4608x384, 6 previews originales, 3 manifestes, 2 nouveaux ID catalogue.
- Catalogue work : 240 assets, 134 sprites, 46 créatures ; 42 fichiers exclusivement dans le périmètre. Aucun moteur, UI, autres créatures ou animations player modifiés.
- CI du HEAD final (incluant cette documentation), checkpoint GREEN et publication FF restent nécessaires. Essai smartphone distinct de la validation technique.
