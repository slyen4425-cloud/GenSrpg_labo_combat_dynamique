# Capture — imports auteur Brouillard toxique et Jet acide (25 octobre 2026)

## Périmètre
- Base d'origine : `gh-pages@35e9b17f510813edb312a1bf4407b871e5910c6a`.
- START : `checkpoint/lab-start-poison-skills-author-2026-10-25`.
- Branche : `work/lab-poison-skills-author-2026-10-25`.
- Sources de vérité : chaque export utilisateur exact enregistré dans `data/capture/source-exports/` (provenance non active) puis seul transfert actif dans `data/capture/showcase/`. Le manifeste Showcase charge la nouvelle capacité une fois. Le PR #99 a déjà livré le moteur générique de marqueurs à l'entrée : aucune modification moteur dans ce lot.

## Brouillard toxique : `cap_poison_special_2`
- Nouvelle autorité active : `data/capture/showcase/cap_poison_special_2.capture-skill-transfer-v1.json`.
- Archive originale : `data/capture/source-exports/cap_poison_special_2.author-export-2026-10-25.json`.
- Identique aux **3866 octets** de l'export auteur, SHA256 `3f7389de35573b531bb1103e4cf7fac9c7fb975d9fed2769854c1cb769ac8bcd`.
- Forme `projectile`, prépa **1500 ms**, recharge **45000 ms**, énergie **0** ; zone rayon proche, durée **10000 ms**, renouvellement `refresh`, sans croissance, effet à l'entrée : **2 marqueurs Poison** de durée **25000 ms**, 30 stacks max. Marqueur périodique **5 dégâts physiques / 5000 ms**, tel qu'exporté. L'export utilise `targetScope=target` : seule la cible désignée est éligible, **pas tous les ennemis** ; ne pas remplacer tacitement par `all_enemies`.
- Icon `core:icon-skill-poison-cloud-01`, aura `pack:capture:sprite-crachat-acide-cast-01`, icône de marqueur `pack:capture:icon-skill-poison-01`. Les références ont été trouvées dans le catalogue d'assets global. Son auteur `gensrpg:sound:tower-ccc16d37` conservé tel quel.
- Ce fichier **diffère** du besoin exprimé précédemment : 10 s et 1,5 s de préparation ici, contre 20 s et 2 s demandés initialement. La charte §33.1 interdit de le corriger silencieusement. Les durées de zone et de marqueur sont distinctes.

## Jet acide : `cap_poison_atk_3`
- Autorité existante mise à jour en place ; manifeste inchangé pour cet ID.
- Archive de l'export actuel : `data/capture/source-exports/cap_poison_atk_3.author-export-2026-10-25-v2.json` ; **4654 octets**, SHA256 `d997dd64f63bf185f6f989dba52642ca6e65e5abcdff96cbf0bf57a8ed89461d`.
- Les archives précédentes du 24 et 25 octobre restent intactes. Seul changement : animation `cast` `displayScale=0.7`, `offsetX=40`, `offsetY=15`, `opacity=0.5`. Projectile, impact, aura négative et mécaniques strictement inchangés.

## Tests et publication
- Test provenance, identité stable, un seul preset actif par ID, import et rechargement depuis `configuredSkills`, valeurs de l'éditeur et du contrat de Combat.
- Test de vraie zone avec 2 marqueurs à l'entrée et absence de répétition tant que la cible reste dans la zone, respect de `targetScope=target`.
- Sentinelles Jet acide historiques adaptées uniquement à la nouvelle provenance/aux nouveaux paramètres visuels, pas à la mécanique.
- CI GitHub Foundation + quatre suites Chrome, checkpoint GREEN au SHA final, PR puis fusion vers `gh-pages` après succès. Validation visuelle smartphone par l'auteur séparée.
