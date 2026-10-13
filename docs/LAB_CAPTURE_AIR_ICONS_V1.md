# Pack d'icônes Air — Capture V1 (13 octobre 2026)

Mission : rendre les compétences Air immédiatement reconnaissables au format mobile, avec trois images créées dans la conversation, fond clair, palette beige/marron, style cartoon Monster Capture et silhouettes distinctes.

- Rafale : lames de vent courbes, feuilles et petits éclats ; `pack:capture:icon-skill-rafale-01`.
- Souffle : cône horizontal de poussière et pression ; `pack:capture:icon-skill-souffle-01`.
- Attaque aérienne : rapace en piqué / choc vertical ; `pack:capture:icon-skill-aerial-attack-01`.

Owner : branche canonique `global-assets`, catalogue unique `data/assets/catalog/global-visual-assets.v1.json`. Répertoire `assets/library/capture/icons/skills/`.

Base : `5965d22fba72d3cee7130d05665bc4735c054413` ; checkpoint : `checkpoint/global-assets-before-capture-air-icons-v1-2026-10-13` ; branche work : `work/global-assets-capture-air-icons-v1-2026-10-13`.

Fichiers prévus : trois WebP 128×128 RGB, provenance, catalogue, sentinelle et adaptation du test Tailwind aux ajouts autorisés, présent rapport et CURRENT_WORK. Assets cumulés prévus : 138 dont 49 icônes. Aucune altération des anciens IDs, sprites, règles combat, UI, `main`, `Zombicide-40k` ou labo Exploration.

Vérifications : chacun des fichiers doit être un vrai WebP décodable, SHA vérifiée et chemin canonique valide ; `npm run ci` GREEN requis sur SHA exact avant promotion par fast-forward ; test Android à faire séparément.

Raccord consommateur : lot `gh-pages` séparé après publication stable de la bibliothèque ; `Rafale` (lib_gust) et `Charge aérienne` (cap_air_atk_3) peuvent remplacer leurs seules icônes via AssetBinding ; Souffle reste libre car aucune compétence active homonyme n'est identifiée. Ne pas toucher à `Tornade`, `Ouragan` ou `Vent arrière`.
