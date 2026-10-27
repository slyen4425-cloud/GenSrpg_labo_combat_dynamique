# Combat — choix aléatoire de la piste Battle (23 octobre 2026)

Demande auteur : pendant les nombreux essais Capture, le combat doit démarrer sur une piste variable et éviter de jouer toujours Battle_1.

## Source unique
Le contrat audio et son moteur prennent déjà en charge `order:"shuffle"` et la sélection via `Math.random`, avec exclusion de la piste immédiatement précédente quand six pistes sont disponibles. Modifier exclusivement la configuration de départ `SOUNDTRACK_STARTER_CAPTURE_PROJECT_V1`, de `sequence` à `shuffle`. Volume 65 %, fondu 700 ms, repeat, six MP3 et leurs identifiants ne bougent pas. L'éditeur conserve la possibilité explicite de choisir un ordre séquentiel pour un projet musical personnalisé. Les fichiers privés, SFX et le lecteur exclusif SoundtrackSession restent inchangés.

## Tests et risques
Test de la vraie configuration de départ et de la progression d'une session avec `random` injecté : différentes ouvertures peuvent démarrer sur des pistes différentes et deux pistes consécutives ne sont pas identiques. Les démarrages de sessions indépendantes restent des tirages aléatoires (la répétition d'une même première piste par hasard reste mathématiquement possible). Aucun état global, stockage ou deuxième lecteur.
CI 5/5, checkpoint GREEN puis fusion uniquement. Validation d'écoute sur smartphone par l'auteur.

Base gh-pages 0915c7400c79aa81b73d790fe46a84ce71c12707.
START checkpoint/lab-start-combat-music-shuffle-2026-10-23.
BRANCH work/lab-combat-music-shuffle-2026-10-23.
