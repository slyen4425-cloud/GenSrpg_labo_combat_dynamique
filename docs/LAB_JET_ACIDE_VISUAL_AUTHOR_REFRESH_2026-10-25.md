# Jet acide (Venombre) — mise à jour des animations et du statut (25 octobre 2026)

## Autorité et gouvernance
- Source : export utilisateur `gensrpg-capture-skill-cap_poison_atk_3(1).json`, 4651 octets, SHA256 `b029cb91c199e1578f2903eb01642cbe1f94f545adcb79883a80a6b39a827061`.
- Base : `gh-pages@d55280a9b97bec1ea8b729ecff376d46ce7cdf59`.
- START : `checkpoint/lab-start-jet-acide-visual-refresh-2026-10-25`; branche `work/lab-jet-acide-visual-refresh-2026-10-25`.
- Propriétaire actif : `data/capture/showcase/cap_poison_atk_3.capture-skill-transfer-v1.json`, une unique capacité `cap_poison_atk_3` via le manifeste Showcase existant.
- Provenances inertes : archive 2026-10-24 inchangée et nouvel export octet pour octet dans `data/capture/source-exports/cap_poison_atk_3.author-export-2026-10-25.json`.

## Données fidèlement publiées
- `visual.icon` : `pack:capture:icon-skill-morsure-venimeuse-01` (choix de l'auteur, conservé même s'il s'agit de Jet acide).
- `visual.cast` : `pack:capture:sprite-crachat-acide-cast-01`, ancré à la bouche, démarrage préparation, boucle, opacité 0,75.
- `visual.travel` : `pack:capture:sprite-crachat-acide-projectile-01`, trajectoire, échelle 1,5, boucle.
- `visual.impact` : `pack:capture:sprite-crachat-acide-impact-01`, impact fixe cible, lecture unique.
- `statusVisuals.status-2.sprite` : `pack:capture:sprite-crachat-acide-aura-01`, échelle 1, opacité 0,35.
- Chaque visuel ci-dessus possède une entrée dans `global-assets` et un fichier physique correspondant ; les quatre atlas acides contiennent chacun 20 images.
- `audio={}` intact. La mécanique complète demeure strictement identique au précédent export : dégâts 16 Poison ; ignore 50 % de la résistance et de la réduction ; -250 points Défense pendant 15 secondes ; coût 4, délai 30 s.
- Le texte descriptif historique « niveau 10 » et `requiredLevel=5` sont conservés sans correction silencieuse car ils appartiennent à l'export auteur.

## Tests et protections
- Tester archive nouvelle identique au fichier actif ; hachages historiques et récents ; seul ID `cap_poison_atk_3` dans le catalogue ; import via adaptateur Capture réel, présentation préservée ; maintien de la capacité équipée sur Venombre.
- Réutiliser la sentinelle intégration de Jet acide existante pour la CombatSession réelle (dégâts/effet), la description Bestiaire et l'absence de doublons.
- Suite CI requise : fondation et quatre suites Chromium. Test manuel Android de l'apparence encore séparé.
- Aucun changement au moteur, à l'éditeur, aux autres créatures, aux catalogues, aux banques de sprites, à `main` ni à GenSrpG central.

## Bilan technique
- En attente du verdict CI et du checkpoint GREEN sur la révision exacte du lot.
