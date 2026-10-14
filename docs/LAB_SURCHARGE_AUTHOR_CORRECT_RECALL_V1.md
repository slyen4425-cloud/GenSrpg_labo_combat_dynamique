# Import auteur — Surcharge (Voltige), réglages x2 et icône Recall

Date : 14 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Livraison exacte
- Fichier source auteur : `gensrpg-capture-skill-cap_electric_special_2.json`, schema `capture-skill-transfer-v1`, `draft.id=cap_electric_special_2`, `definition.id=cap_electric_special_2`, nom **Surcharge**.
- Emplacement natif : `data/capture/showcase/cap_electric_special_2.capture-skill-transfer-v1.json`, inscrit **une fois** dans `src/catalogs/capture-showcase-skill-presets-v1.js`. L'éditeur recharge les SkillTransfer via `hydrateCaptureShowcaseSkillPresetsV1`, en remplaçant la définition historique du même ID sans nouveau doublon.
- **Modifications seules** faites par rapport au fichier remis :
  1. `approach_time_modifier.modifierPct` : `-100 → -50` = temps de déplacement / 2, **à vitesse de combat identique**, pour les approches natives ground/aerial/burrow déjà prises en charge par l'effet ;
  2. `skill_cooldown_rate_modifier.modifierPct` : `-100 → +100` = progression du cooldown multipliée par 2 au cours du buff ;
  3. `presentation.visual.icon.assetId = "core:icon-skill-recall-01"` = **Recall** existant dans la bibliothèque `global-assets`, sans nouvel asset ni import média.
- Vérification avant dépôt : revenir de ces trois changements redonne la totalité de l'objet JSON source à l'identique. Aucun autre attribut changé.

## Effets et identité préservés
- Catégorie `buff_debuff`, personnel ou allié comme fourni (`targetScope:target`, relations `self` + `ally`) ; loadout `ultimate`, **une utilisation maximum par combat**, énergie 3, chargement 2 s.
- Les cinq statuts durent chacun **60 secondes** et sont tous conservés :
  - temps de déplacement -50 % (corrigé) ;
  - vitesse de recharge +100 % (corrigé) ;
  - énergie régénérée +50 % (inchangée) ;
  - statistique `electric` +50 points (inchangée, définie dans le registre de statistiques du mode Capture) ;
  - `damage_dealt → damage:target 10` (inchangé).
- Les IDs de statuts, tags, couleurs, sprite persistant, valeurs de l'ultime et les autres réglages proviennent intégralement de l'auteur.
- Le bug de présentation quand `-100%` supprimait entièrement une approche est déjà protégé par `docs/LAB_SURCHARGE_ZERO_APPROACH_TIMING_V1.md` et sa sentinelle, sans nouvelle modification moteur.

## Gouvernance et contrôle
- Base de départ `gh-pages@3205bd2e8a71850a1c64b401f89595cecea6188d`, checkpoint `checkpoint/lab-start-surcharge-author-correct-2026-10-14`, branche `work/lab-surcharge-author-correct-2026-10-14`.
- Sentinelle `tests/unit/capture-surcharge-author-correct-recall-v1.test.mjs` : import et conservation des données de l'auteur, présence exacte d'un preset Showcase, remplacement du même ID dans l'éditeur, vrai `CombatSession` avec 5 statuts, approche 1200→600 ms et cooldown réel à vitesse 2×. Régression `capture-surcharge-zero-approach-freeze-v1.test.mjs` préservée.
- Le nombre de presets passe de 23 à 24. Trois anciennes sentinelles de décompte (`air-skills-enemy-bench-inspection-v1`, `capture-ailevent-rafale-author-v2`, `capture-air-dual-skill-import-v1`) ont changé **uniquement l'assertion de longueur 23→24**, après constat de la CI RED et périmètre recadré dans le journal. Aucun hash ni test de contenu de créature/compétence existante modifié.
- Checks exigés avant publication : 3 jobs Laboratory CI SUCCESS sur SHA final (Foundation + Firestorm Chromium + Creature Library Chromium), checkpoint GREEN de ce SHA, fast-forward `gh-pages` sous lease, puis CI et Pages SUCCESS sur le SHA publié. Validation tactile réelle par l'auteur séparée.
- Protégés : toutes autres créations (Voltige compris), fichier `dodge`, corrections Arc électrique / Esquive classique / Impact rocheux, pipeline du moteur et assets, dépôts principaux et exploration, `global-assets` et `main`.
