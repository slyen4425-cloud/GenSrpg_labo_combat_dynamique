# 2026-11-03 — Parité générale des FX entre téléphone et PC

## Source de la demande / périmètre étendu avant code
Le dernier retour utilisateur confirme que le problème n'est pas limité à l'ultime feu : **Boule de neige, Pique de glace et les autres sprites de compétences** sont visuellement plus petits et déplacés sur PC, alors qu'ils sont bien configurés sur téléphone. Le lot initial « zone » est donc élargi explicitement à la projection partagée des FX, **pas** à des exceptions par capacité.

BASE `gh-pages@a64efa5927d3c3aa8a173c8789405c2011a6d58f`; START `checkpoint/lab-start-zone-phone-pc-footprint-2026-11-03`; WORK `work/lab-zone-phone-pc-footprint-2026-11-03`.
Charte / roadmap / architecture / checkpoint policy LIVE lues. `main`, `global-assets`, Exploration, GensRPG et JSON auteur strictement protégés.

## Cause racine reconnue
- L'arène de combat Capture reste en 16:9 et les modèles suivent déjà sa hauteur via `--combat-arena-author-offset-scale` (un unique propriétaire sur `[data-combat-arena]`).
- `examples/dom-demo/demo.css` : tailles de `.skill-fx--projectile`, `--sprite-shell`, `--cast`, `--impact`, `--persistent-zone`, `--tactical-zone`, `--clash-impact`, `--phase` plafonnées en `rem` ou liées au viewport en `vw` ; cela rompt la parité PC/téléphone. Les zones longues ont déjà leur propre 100% : ne pas toucher au contrat long.
- `src/adapters/renderer/dom-skill-fx.js` : offsets X/Y d'auteur et offsets verticaux sous cible / tombants restent en pixels absolus. Exemple officiel `boule_neige` : cast joueur X=85, Y=15 et adversaire X=-70, Y=15 ; `pique_glace` : zone sous cible Y=15, rise=80 ; `cap_fire_atk_6` : zone short/medium, scale auteur X=1.6 Y=0.8. Ces données ne doivent pas être modifiées.

## Correction contractuelle
1. Un seul propriétaire CSS : tailles **en pourcentage de la largeur de l'arène 16:9 réelle**, seulement pour les prévisualisations Combat Capture paysage. La composition de référence est une arène d'environ 711×400 pixels CSS, le rendu téléphone validé ; dimensions calibrées à son visuel préexistant, sans plafonds PC. Préserver non-Capture et les tailles des autres UI.
2. Le propriétaire unique `DomSkillFxRenderer` projette les offsets auteur X/Y et unités visuelles px **avec le même facteur déjà fourni à l'arène** (CSS variable `--combat-arena-author-offset-scale`), sans réimplémenter un calcul viewport. Les trajectoires de mouvement calculées depuis les rectangles réels sont déjà en pixels de l'arène et **ne doivent pas être re-multipliées**.
3. Conserver animation, frame, scale auteur, profondeur, gameplay, dégâts, collisions et occupation zone sur les **mêmes bounds DOM du sprite**. Ne pas créer une autorité visuelle concurrente ou changer les JSON.
4. Préserver le 1v1, le 2v2, le mobile paysage, la disposition réelle des créatures et leurs ombres.

## TDD + preuves nécessaires
- RED : sentinelle d'intégration sur CSS et vraies fiches `cap_fire_atk_6`, `boule_neige`, `pique_glace` et un test Chromium sur vrais gabarit/CSS/renderer en comparaison téléphone et PC.
- GREEN : `getBoundingClientRect()` normalisé de zone, projectile, cast et impact, offsets X/Y, et zone cible dans une arène 16:9, en 1v1/2v2 ; aucun test testant seulement les wrappers.
- CI Foundation + quatre suites Chromium sur SHA exact ; checkpoint GREEN, PR `gh-pages`, revalidation CI et Pages post-merge. Les confirmations visuelles utilisateur sur appareil physique restent distinctes.

## Résultats
À renseigner après reproduction et correction.
