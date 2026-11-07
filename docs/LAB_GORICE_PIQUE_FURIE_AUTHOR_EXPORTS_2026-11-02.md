# Exports auteur — Gorice, Pique de glace et Furie bestiale (2 novembre 2026)

## Entrée et provenance
Les trois JSON du joueur sont copiés tels quels dans des archives inertes datées et appliqués à la bibliothèque Capture actuelle par son unique mécanisme de transferts.
- Gorice : `gensrpg-capture-creature-gorice(2).json`, SHA256 `77ddd3f10f315e2fdee56aa02b4f5579eb2fec5e11ba4676b9411b7bf376d9f2` ; actif `data/capture/showcase/gorice.capture-creature-transfer-v1.json` ; archive `data/capture/source-exports/gensrpg-capture-creature-gorice-author-2026-11-02.json`.
- Pique de glace : `gensrpg-capture-skill-pique_glace(2).json`, SHA256 `927cd4a1fb2a9f8e4b6e9517975bda7bec98f1935dc31db7b066aadb0df8648b` ; actif `data/capture/showcase/pique_glace.capture-skill-transfer-v1.json` ; archive `data/capture/source-exports/gensrpg-capture-skill-pique_glace-author-2026-11-02.json`.
- Furie bestiale : `gensrpg-capture-skill-furie_bestiale.json`, SHA256 `5454c262bc0fae990ac317b2cb1382cef87c9313fecc206e2e62e3c0c7b0fea7` ; actif `data/capture/showcase/furie_bestiale.capture-skill-transfer-v1.json` ; archive `data/capture/source-exports/gensrpg-capture-skill-furie_bestiale-author-2026-11-02.json`.

## Contrats conservés
- Gorice demeure `gorice`, glace 15 et 140 PV. Six identifiants de compétences connus et cinq slots équipés, dont slot 4 = `pique_glace` et ultime = `furie_bestiale`. Aucune modification de ses sprites, sockets ou échelles.
- Pique de glace : 10 ticks de canalisation sur 10 s, 7 glace + 1 énergie par tick, recharge 45 s. Le visuel sous cible reste `groundMotion=fixed`, décalage Y=15, et utilise l'icône `core:icon-skill-ice-spikes-01` dans le nouvel export.
- Furie bestiale : ultime niveau 20, coût 6, un usage/combat ; statut bénéfique +100 points de Glace sur 60 s, dégâts sur soi 10 glace toutes les 10 s pendant 60 s, sprite de statut auteur inchangé.
- Une seule entrée par ID dans les catalogues de showcase existants. Les archives Gorice 30/10 et 01/11 restent intouchées. Aucun moteur, règle de combat, calcul d'énergie ou asset modifié.

## Chargement, tests et publication
L'éditeur recharge les fichiers JSON avec `cache: "no-store"`. Le jeton de module ES existant est **suffixé** de `gorice-pique-furie-20261102` sur la chaîne HTML/ESM de l'éditeur afin que les navigateurs chargent le nouveau manifest sans réutiliser l'ancien cache. Préfixe canonique conservé.

Test TDD RED sur le SHA `03ff4fb11ea9aa79cf0677e7079bc8fd466e1a22`, workflow `41524220089` (Foundation FAIL attendu sur archives manquantes ; consulter Actions pour les détails). Après installation, exiger Foundation + quatre Chromium verts sur le SHA final, checkpoint GREEN, PR vers `gh-pages`, puis CI/Pages postfusion. Validation tactile Android et effets visuels réels par l'auteur indépendants des automatisations.

## Résultat technique intermédiaire
- SHA `4ea4b0f5efd277a959ea80a3fb55748b1a90eccc` : **CI 5/5 SUCCESS**, run `41524956481`, Fondation et quatre Chromium.
- Cette note de clôture ajoute un nouveau SHA à tester exactement avant GREEN. La vérification tactile Android de l'auteur demeure distincte.
