# Maraileron — mise à jour d'auteur du 24 octobre 2026

## Source et décision
- Demande explicite : « Place ceci », export `gensrpg-capture-creature-crea_maraileron.json` fourni par l'auteur, id `crea_maraileron`.
- BASE : `gh-pages@de130b41ad46d6eb6981d9560f47fec95544412e` ; START : `checkpoint/lab-start-maraileron-author-2026-10-24` ; branche `work/lab-maraileron-author-2026-10-24`.
- Propriétaire runtime unique : `data/capture/showcase/crea_maraileron.capture-creature-transfer-v1.json`. Ne pas doubler le registre ni modifier le moteur.
- Ancien preset : présentation version 2 ; visuels face, dos et icône ; aucune animation spécifique définie. Nouvel export : présentation version 9, quatre liaisons de sprites nage/attaque face/dos, paramètres animation, échelles distinctes et `movementPlayback`. Statistiques statValues ajoutées `acier`, `nature`, `esprit` à zéro. Aucun changement des 5 compétences équipées, PV, résistances, combat, sockets ou tailles face/dos.
- Export conservé intact sous `data/capture/source-exports/gensrpg-capture-creature-crea_maraileron-2026-10-24.json` pour provenance historique ; la seule autorité demeure Showcase.

## Périmètre de travail
- Modifier uniquement le preset Showcase `crea_maraileron`, ajouter le snapshot source, la sentinelle autorité + round-trip Import Capture, docs et journal.
- Domaines protégés : autres créatures, capacités, éditeur, moteur combat, catalogue d'assets, bibliothèque visuelle, application principale GenSrpG et `gh-pages` avant GREEN.
- Vérifier que les asset IDs sont bien les IDs exacts de l'export ; ne pas fabriquer les octets des sprites manquants et ne pas recalculer les frames depuis le nom des assets. `frameCount:1` appartient à l'export ; le conserver sauf décision explicite.
- Tests : JSON exact vis-à-vis de l'export, `importCaptureTransferJsonV1` du vrai JSON via statRegistry, chargement Showcase/éditeur, emplacements, 4 animations, paramètres, rond-trip, CI 5 jobs, checkpoint GREEN SHA exact avant fusion.
- Risque : les sprites référencés sont gérés par le catalogue global. La présence d'un asset ID dans la fiche ne valide pas le média ; publication des images reste indépendante.
