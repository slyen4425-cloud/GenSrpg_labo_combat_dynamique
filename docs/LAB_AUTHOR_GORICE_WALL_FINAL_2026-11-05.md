# Livraison auteur — Gorice V9 + Mur de glace (2026-11-05)

## Demande et provenance
Deux fichiers joints le 05/11/2026 à 19h25 CET :
- `gensrpg-capture-creature-gorice (2).json` — SHA256 `56496a621efe6a5003fdb21c7abefc0f9fd306007390729aabab7bbda2b808d8`.
- `gensrpg-capture-skill-mur_de_glace(3).json` — SHA256 `add2d3b89ec271a6445b166e72d11fdc08856f402be1cfc057bb4e4b15d51940`.

Sources intactes archivées sous :
- `data/capture/source-exports/gensrpg-capture-creature-gorice-2026-11-05-1925.json`
- `data/capture/source-exports/gensrpg-capture-skill-mur_de_glace-2026-11-05-1925.json`

Les deux transferts actifs sont remplacés **au même emplacement** dans `data/capture/showcase/`, aux IDs `gorice` et `mur_de_glace`. Pas de second manifeste, pas de nouvel ID ou de moteur. Le propriétaire reste le catalogue Showcase actuel (une entrée par fichier).

## Valeurs auteurs conservées
- Gorice : présentation V9, animations mouvement côté joueur et adversaire (IDs `creature-gorille-des-glaces-movement-player-12-v1` et `-opponent-12-v1`), multiplication d'échelle du mouvement 1,5 dans les deux vues. Identifiants, talents, résistances, cinq slots et les paramètres de combat de l'auteur sont conservés.
- Mur de glace : `hpPerStatPoint=2`, arrêt projectile/rayon/contact, même asset visuel pour les deux camps ; joueur X=47/Y=55, scale=2,5, scaleX=1,5, scaleY=1,2 ; adversaire X=70/Y=50, scale=1,5, scaleX=1,5, scaleY=1,2 ; portée arène libre pour chaque camp. Le contrat `SkillEffectV1` existant porte les champs adverses.
- Les assets référencés existent déjà dans le catalogue autoritaire `global-assets`. Aucune création, copie ou modification média.

### Texte d'aide présent dans la source
La description française fournie pour le Mur indique « PV du mur = 1 par point de Glace », alors que le paramètre fonctionnel auteur vaut `hpPerStatPoint=2`. Ces deux données sont **conservées sans correction silencieuse** dans le cadre de cette publication fidèle ; si l'auteur demande une correction éditoriale, la faire en lot séparé.

## Tests et gouvernance
- BASE `gh-pages@90da2c5be0073f1c6f26f7d934ee1984324fa02f`.
- START `checkpoint/lab-start-gorice-wall-author-sync-2026-11-05`.
- WORK `work/lab-gorice-wall-author-sync-2026-11-05`.
- RED séparé PR #266 — attendu sur anciennes fiches officielles, non fusionnable.
- Tests dédiés `tests/unit/capture-gorice-wall-author-final-2026-11-05.test.mjs` : archives octet-pour-octet, transferts publiés identiques, IDs uniques, valeurs auteur, import/export.
- Validation finale requise : Foundation + 4 jobs navigateur, GREEN SHA exact, fusion `gh-pages`, contrôle post-fusion. La validation tactile Android par l'auteur reste distincte.
- Hors périmètre : `main`, `global-assets`, tout le moteur, l'IA, les autres compétences (en particulier `attaque-sous-terraine`), GenSrpG, Exploration.
