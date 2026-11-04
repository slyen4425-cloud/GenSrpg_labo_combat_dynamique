# Lumilo — animation 12 frames joueur reclassée en attaque (2026-11-04)

## Demande et identité
- Auteur : l'animation ondulante de déplacement du Renard magique doré / Lumilo n'a pas de capacité de locomotion qui l'utilise. Elle doit figurer dans **Attaque à distance → DOS/joueur**.
- Asset préexistant stable : `pack:capture:creature-renard-magique-dore-movement-player-12-v1`. Le nom historique et le chemin `animations/movement/player` restent **des identifiants de provenance, pas des rôles actifs**. Aucun clone ni réécriture d'ID.
- Vue `opponent` : aucune animation d'attaque correspondante publiée. Aucun miroir, substitution ou modèle adversaire inventé.

## Gouvernance
- Base immuable global-assets@4e6aa2cd09ed996fefb60674daeea31e811c1c8a.
- START `checkpoint/lab-start-lumilo-attack-reclass-2026-11-04`, WORK `work/lab-lumilo-attack-reclass-2026-11-04`.
- Propriétaire unique : catalogue visuel `data/assets/catalog/global-visual-assets.v1.json`, rôle déterminé par les tags `attack` ou `movement` dans l'éditeur propriétaire, sans règle spéciale Lumilo.
- Bascule de `movement` vers `attack`, libellé précisant joueur/DOS, champ `action` du manifeste `attack`. Tous les pixels, frames, hashes, source ZIP, atlas, trajectoire de lecture, timestamps 120 ms et lecture `loop` restent inchangés. Pas d'affectation automatique de cette animation aux capacités.
- Les données auteur (exports créature et compétences), les sprites maîtres, les compétences, les règles de combat, `main`, GenSrpG et Exploration restent protégés.

## Tests et livraison
- Nouveau test TDD RED `tests/unit/lumilo-player-attack-reclass-2026-11-04.test.mjs` : catégorie Attack, absence de Movement, atlas exactement le même, aucun adversaire inventé, une seule autorité.
- Sentinelle historique des 12 PNG + atlas WebP + manifest révisée sans modifier les hashes des médias.
- Gate: CI `global-assets` réussie sur SHA final du code et documentation, checkpoint GREEN exact, PR/merge sans perte de changements concurrents. Un lot distinct sur `gh-pages` doit relever la révision du catalogue et tester le vrai éditeur avant affirmation de publication.
- Le rendu tactile sur téléphone est une validation utilisateur indépendante.
