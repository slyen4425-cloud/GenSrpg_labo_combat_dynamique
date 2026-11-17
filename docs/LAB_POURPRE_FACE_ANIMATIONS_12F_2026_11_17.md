# 2026-11-17 — Créature POURPRE face adversaire : 12f course + attaque

## Diagnostic
Le fichier `_incoming/creature_pourpre_face_mouvement_attaque_12f_valide.zip` existe dans `global-assets` (18 331 888 octets, Git blob `f5a16e641ebc0ed79663825b1b72349fc7847582`). Le catalogue ne contient que les deux animations `player` (dos) de Pourpre publiées le 16 novembre. Les deux animations `opponent` (face) sont absentes des références, d'où l'absence dans les menus de l'application. `creature_violette` est une AUTRE créature.

## Lot ciblé
- Owner : `global-assets`, catalogue visuel `data/assets/catalog/global-visual-assets.v1.json`.
- Base : `global-assets@97e793e8e767570a617269d9209137fa3351c046` ; checkpoint `checkpoint/lab-start-pourpre-face-12f-2026-11-17`; work `work/lab-pourpre-face-12f-2026-11-17`.
- Sources : seul le ZIP face de 12f déjà déposé et validé ; ne rien inventer ni redessiner.
- Nouveaux objets : 2 animations `opponent` (course loop + attaque once) dans `assets/library/capture/creatures/creature_pourpre/animations/{movement,attack}/opponent/`, et 2 entrées additives dans le catalogue canonique.
- Protégés : tout `creature_violette`, toutes les animations `player` de Pourpre (8f), ses modèles face/dos/icône, gameplay, éditeur, `main` du labo, les autres dépôts, sauvegardes et modèles existants.
- Vérifications : noms/dimensions exacts du ZIP, SHA256/Git blob et CRC, douze frames originales par animation, vrais PNG RGBA 512×512 et alpha, marges de sécurité, atlases pixel identiques aux frames, previews à 12 poses, unicité IDs, catalogue, CI `npm run ci`, checkpoint GREEN, fast-forward sans force sous lease de `global-assets`, CI du SHA canonique.
- App principale : vérifier la visibilité depuis son résolveur de catalogue unique ; aucune copie de bibliothèque ni modification moteur sans nécessité démontrée.
- État : import non encore publié ; les ZIP doivent être audités avant de définir le format exact de l'import.
