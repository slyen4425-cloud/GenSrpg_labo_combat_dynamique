# Grainou r5 + Explosion florale — import auteur 2026-10-29

## Sources byte-exact
- gensrpg-capture-creature-crea_nat_1(4).json : 4881 octets, SHA256 d9545f76bd143330558e527f282abc2f3341ed68fa8253546cf671c96514e24a ; archive data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r5.json.
- gensrpg-capture-skill-explosion_florale.json : 3056 octets, SHA256 5d5848c128f97682f8c632522f67832d1934d6164b04fa5aa15afee5d1daa97e ; archive data/capture/source-exports/gensrpg-capture-skill-explosion_florale-2026-10-29.json.

## Périmètre / invariants
- Grainou conserve Spore slot 3 et équipe Explosion florale au slot 4 ; défense florale 5 charges/800 ms inchangée. Une seule entrée crea_nat_1.
- Nouvelle compétence explosion_florale (niveau 15, Nature, contact, énergie 6, préparation 800 ms, recharge 3000 ms) : consume_marker graine-sansue count=all minimum=1 perCharge=true, 25 dégâts Nature par charge, sprite impact spores expansives sphère v2 existant.
- Index officiel CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1 : une seule nouvelle entrée. Pas de deuxième catalogue ni de modification moteur/FX/global-assets.
- Anciennes archives r4 et Spore r2 inchangées. Test RED 92b6790 avant mise en données ; autres sentinelles adaptées à leur archive historique.

## Contrôle livraison
- BASE gh-pages 9d5aff42447b3d3af71caca3d166206a6018b5e5, START checkpoint/lab-start-grainou-explosion-florale-author-r5-2026-10-29.
- Requis : 5 jobs CI au SHA exact et Pages SUCCESS, checkpoint GREEN et contrôle final Android distinct.
