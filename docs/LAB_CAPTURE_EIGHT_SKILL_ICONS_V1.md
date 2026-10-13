# Capture — huit icônes de compétences (2026-10-13)

Création et publication demandées par l'auteur : Croc électrique, Beam électrique, Attaque téléporte, Armure de pointe, Miroir magique, Drain de vie, Comète, Pique de pierre.

- Propriétaire officiel : `global-assets`; catalogue `data/assets/catalog/global-visual-assets.v1.json` ; dossiers `assets/library/capture/icons/skills`.
- Branche isolée : `work/global-assets-eight-skill-icons-v1-2026-10-13` ; base `ffed974c51d58d59a2e5cf20fd9eca00d76ec111`; checkpoint `checkpoint/global-assets-before-eight-skill-icons-v1-2026-10-13`.
- Huit nouveaux médias WebP 128×128, issus des huit images Monster Capture originales générées dans la conversation, avec hashes des sources et des dérivés dans le manifeste de provenance.
- Huit nouveaux IDs stables `pack:capture:icon-skill-*-01`. 149 assets / 57 icônes prévus. Aucune identité ni image précédente remplacée.
- Placement dans bibliothèque et résolution générique des icônes par `assetId`, sans changement de moteur. Association automatique aux exports auteurs laissée à un lot `gh-pages` séparé uniquement pour des IDs de compétences confirmés.
- Source PNG 1254px non publiée (médias originaux conservés dans la conversation); optimisation WebP 128px RGB. Le média de production est authentique et décodable, pas un placeholder.
- Vérifications : présence binaire RIFF+VP8, dimensions 128px, SHA-256 exacts, comptages du catalogue et unicité, CI complète, checkpoint GREEN sur SHA de sortie avant publication FF `global-assets`.
- Suite après la bibliothèque : mise à jour de révision du consommateur `gh-pages` et preview dédiée affichant les 8 vrais médias. Validation Android distincte.
- Protection : `main`, GenSrpG/Zombicide-40k, labo Exploration, jeu/règles/FX, les créatures configurées et toutes les compétences existantes.
