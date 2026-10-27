# Capture — Voltige V3 : remplacement exact du transfert auteur

Date : 14 octobre 2026.

## Objet
Remplacement **sur l'ID existant** `crea_voltik` du seul fichier `data/capture/showcase/crea_voltik.capture-creature-transfer-v1.json` depuis l'export `gensrpg-capture-creature-crea_voltik(3).json`. Aucun ajout à un deuxième catalogue, aucun changement de compétences ou de moteur.

## Fidélité binaire
- Fichier source : 5430 octets UTF-8, SHA-256 `9128a124a0ee8db863c41cf32206a72db7be15f1cca6759dc5070f5075f58535`.
- Blob Git du transfert : `f4d21b0a7ef70aedae100deff375beb4dba20493`, exactement identique au blob calculé sur le fichier joint brut.
- Diff sémantique exact contre l'ancien transfert : `draft.presentation.viewOverrides.opponent.displayScale` **1 → 0.7** ; `draft.presentation.viewOverrides.opponent.position.y` **0 → 60**. Tout le reste du JSON est inchangé (y compris positions joueur, sockets, stats, résistances, loadout et références de capacités).

## Gouvernance
- Base `gh-pages@97a2e7e7604cfbe865efb1a41aaf81427cd6d5c1`, CI+Pages SUCCESS.
- Checkpoint `checkpoint/lab-start-voltige-v3-author-update-2026-10-14`; branche `work/lab-voltige-v3-author-update-2026-10-14`.
- Sentinelle nouvelle `tests/unit/capture-voltige-v3-author-update-v1.test.mjs` : source SHA, unicité du registre, import/export vrai contrat, identité, scale, position, stats et slots. Sentinelle existante du preset Voltige préservée.
- Aucun changement de Beam Clash Power V1, calcul des projectiles/rayons validé par l'auteur, minuterie stacks, Combat Runtime, 1v1/2v2, IA, global-assets ou main.
- CI finale Foundation + deux Chromium, checkpoint GREEN exact et publication fast-forward protégée exigés ; essai visuel Android de l'échelle et de la position adverse reste à confirmer par l'auteur.
