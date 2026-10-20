# Tempête métallique — intégration de l'export auteur (20 octobre 2026)

## Provenance et propriétaire
- Fichier source utilisateur : `gensrpg-capture-skill-Tempete_metallique.json`
- SHA256 exact : `f4c590274169e6f6201b206aa7f625ed871b73cd09ef1de503db3e9cbe8eaf27`
- Identifiant exact `Tempete_metallique` (casse conservée) ; nom « Tempête métallique ».
- Une seule fiche active : `data/capture/showcase/Tempete_metallique.capture-skill-transfer-v1.json`.
- Archive identique non chargée : `data/capture/source-exports/gensrpg-capture-skill-Tempete_metallique-2026-10-20.json`.
- Chargement par `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` dans le propriétaire existant `configuredSkills`, sans mock ni second catalogue.

## Données originales strictement conservées
- Niveau 10 ; catégorie `offensive` ; `steel`, `projectile` direct, cible ennemi actif.
- Énergie 4, préparation 950 ms, trajet 700 ms, récupération 0, CD 45 000 ms.
- Clash de projectile : puissance 2 ; esquivable.
- Effet n°1 : 15 dégâts à la cible ; champ héritage `effect.damage=0` conservé tel quel.
- Effet n°2 : statut `status-2` de dommage dans le temps, 6 dégâts d'acier toutes les 2000 ms pendant 16000 ms, jusqu'à 5 charges empilées.
- Texte exporté conservé littéralement, y compris `ciblen` final (pas de correction silencieuse).
- Présentation v12 : icône `pack:capture:icon-skill-lame-acier-01` ; travel `pack:capture:sprite-steel-wing-projectile-01`, scale 1.5, mouth, loop, trajet linéaire ; impact `pack:capture:sprite-steel-wing-impact-01`, scale 1.2, opacité 0.75.
- Sons existants : `gensrpg:sound:genrpg-pack2-963199e0` (travel en boucle) et `gensrpg:sound:tower-d4a4ecd5` (impact non-bouclé) ; effets glow, trail, shake, burst, fumée strictement préservés.
- Le projectile est celui réparé précédemment dans `global-assets`, chargé grâce à la révision cache V38 déjà publiée.

## Frontières et vérifications
- Aucun changement à `main`, `global-assets`, aux médias, aux règles ou aux créatures.
- Aucun lien à un loadout précis : la capacité est disponible pour être équipée dans l'éditeur.
- Test `tests/unit/capture-tempete-metallique-author-2026-10-20.test.mjs` : SHA du transfert/archives, propriétés exactes, catalogue unique, médias et sons, import depuis le contrat, propriétaire `configuredSkills`, aller-retour UI et ré-import idempotent.
- CI `npm run ci`, sentinelles et GitHub Pages nécessaires avant GREEN technique. Le vrai rendu en combat sur Android reste à tester par l'auteur ; le GREEN CI ne prétend pas être un test visuel.
