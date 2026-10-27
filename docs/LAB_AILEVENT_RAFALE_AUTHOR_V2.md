# Labo Combat — Remplacement auteur Ailevent + Rafale (2026-10-12)

## Source et ownership

Deux fichiers **exactement fournis par l'utilisateur**, lus en UTF-8 et vérifiés avant tout commit :

- `gensrpg-capture-creature-crea_ailevent(1).json` : `capture-creature-transfer-v1`, identifiant `crea_ailevent`, SHA-256 `6605ee3255f732ce9303be2f7f405aad1ec3f9b947255905944f46b5ce6d9af1` (5391 octets).
- `gensrpg-capture-skill-lib_gust.json` : `capture-skill-transfer-v1`, identifiant `lib_gust`, SHA-256 `27ba4466558875a97845e571b2d5b3b5e6529ac7097dad4e592b694e59a92c29` (4696 octets).

Les propriétaires uniques restent `data/capture/showcase/*.capture-*-transfer-v1.json` et `src/catalogs/capture-showcase-{skill,creature}-presets-v1.js`, chargés dans `configuredSkills` / `configuredCreatures` par le Transfer batch existant. Aucun second catalogue, aucune retouche moteur ni fusion silencieuse des valeurs auteur.

## Évolution attendue

- Ailevent, **même ID canonique** `crea_ailevent` (pas de doublon) : 11 compétences liées ; 5 emplacements planifiés = `lib_gust`, `cap_air_atk_3`, `lib_tailwind`, vide, ultime vide. Ses stats, résistances, évolution vers `crea_rafalcor`, sprites/sockets/sons et niveau 1 sont inchangés.
- Rafale, même ID natif `lib_gust` : nouvelle configuration auteur de projectile Air ; 4 dégâts Air ; ignore 100 % de réduction de dégâts comme demandé ; énergie 3, cast 800 ms, déplacement 700 ms, recharge 8000 ms ; projectile `pack:capture:sprite-air-wind-bolt-01`, impact `pack:capture:sprite-air-wind-impact-01`, départ `mouth`, FX et audio inchangés.
- Registre presets skills : passe de 16 à 17 ; roster Capture : 103 créatures conservées.
- La correction précédente de Boule de feu `hitPresenceStates:["surface"]` est strictement préservée. Les cibles et les quatre statuts de `lib_tailwind` ne changent pas.

## Charte / contrôles

- Base `gh-pages` GREEN `033fb8921f42dae07564badbe4b79e2336a7aab5` (CI et Pages SUCCESS).
- Checkpoint départ `checkpoint/lab-start-capture-ailevent-rafale-author-v2-2026-10-12`, travail `work/lab-capture-ailevent-rafale-author-v2-2026-10-12`.
- Périmètre : deux JSON auteur (remplacement créature, ajout du preset Rafale), une ligne dans le catalogue skill, tests anciens mis à jour aux nouveaux auteurs, sentinelle dédiée, documentation et `LAB_CURRENT_WORK`. Aucun `main`, `global-assets`, `Zombicide-40k`, Exploration, règles Combat, Renderer, Assets.
- Validation attendue : SHA-256 exact pour les deux exports ; slots + statut de Rafale `replace-skill` ; profils et médias ; sentinelles historiques ; combat export/Chromium ; CI SUCCESS sur SHA ; checkpoint GREEN ; FF non forcé de `gh-pages` ; CI + Pages publiées vertes.
- Test Android utilisateur requis pour confirmer les visuels et les trois compétences affichées.

Ce lot ne reconstitue aucune configuration absente des fichiers auteur.
