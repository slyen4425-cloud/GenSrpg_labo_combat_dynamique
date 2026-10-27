# Labo Combat — Dracendre + Brasier primordial : deux exports auteur

Date : 14 octobre 2026

## Origine et intégrité

- Dépôt `slyen4425-cloud/GenSrpg_labo_combat_dynamique` exclusivement ; aucun changement sur `main`, `global-assets`, `Zombicide-40k` ou Exploration.
- Base `gh-pages@aeb676cbc402fd2427bea2e74ef985a2469cd95f`, CI et Pages SUCCESS.
- Checkpoint de départ `checkpoint/lab-start-dracendre-brasier-author-v1-2026-10-14` ; branche `work/lab-dracendre-brasier-author-v1-2026-10-14`.
- `gensrpg-capture-creature-crea_dracendre.json` : **4322 octets**, SHA-256 `a531d53c9edefd7c8c28ce0f3dc6fdf36a699a834d2573282e161247e519ef0a`, Git Blob `c972765bf9db4ac02ca0cb7c6676054d1bf03a97`, destination `data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json`.
- `gensrpg-capture-skill-cap_fire_atk_7.json` : **1901 octets**, SHA-256 `1e63b095a72d07673fc7c584e54f2b411d0188d44f4007ad551b9282c627deea`, Git Blob `4dd0aa0db81d5ccbd9af252d4fd28058c2e9f651`, destination `data/capture/showcase/cap_fire_atk_7.capture-skill-transfer-v1.json`.
- Les deux Git blobs correspondent exactement aux sources originales (contrôle du contenu, sans newline ajouté) ; aucun paramètre auteur modifié. Les deux listes `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1` et `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1` déclarent chaque preset une seule fois.

## Données conservées

**Dracendre**, ID `crea_dracendre` : niveau 1 ; Feu/Air ; PV 160 ; résistances Feu +35%, Air +35%, Eau -50% ; statValues santé 160 / vitesse 15 ; 20 IDs de compétences dont `cap_fire_atk_7`; évolution Lv28 vers `crea_volcadrake` ; profil `flying` ; zoom joueur 1.6, adversaire 0.9 et décalage Y +30 ; sockets vides ; aucun son de créature. Loadout auteur `lib_heat_wave`, `fireball`, `cap_fire_special_2`, `cap_fire_atk_5`, ultimate `null`. Aucun auto-équipement.

**Brasier primordial**, ID `cap_fire_atk_7` : attaque projectile Feu, 10 dégâts Feu, slot `ultimate`, `requiredLevel:20`, coût énergie 0, préparation / trajet / récupération / cooldown tous à 0, `presentation:null` ; conservé tel quel. Son texte décrit « Disponible au niveau 46 » malgré `requiredLevel:20` : différence auteur signalée sans correction silencieuse.

## Vérification assets

Dracendre réutilise trois assets Braisombre **déjà existants** : 
- `pack:capture:creature-braisombre-opponent-01` -> `assets/library/capture/creatures/braisombre/runtime/braisombre_opponent.webp` (758530 octets), 
- `pack:capture:creature-braisombre-player-01` -> `assets/library/capture/creatures/braisombre/runtime/braisombre_player.webp` (603624 octets), 
- `pack:capture:creature-braisombre-icon-01` -> `assets/library/capture/creatures/braisombre/runtime/braisombre_icon.webp` (19520 octets).
- Catalogue autoritaire dans `global-assets/data/assets/catalog/global-visual-assets.v1.json`; trois fichiers réellement présents dans le dépôt `global-assets`. **Aucun asset neuf ajouté.** Métadonnées Git vérifiées ; rendu artistique et aperçu smartphone non vérifiés au titre de la charte §34. Ne pas prétendre avoir généré de nouvelles images.

## Raccord et tests

- `configuredSkills`/ `configuredCreatures` restent propriétaires uniques ; catalogues existants, import canonique `CaptureTransfer`, sans nouveau chemin.
- TDD RED `e50d8b7a215d830daf7ebfd5d344d315834c2980` (presets absents).
- Intégration JSON, catalogues, assertion créatures cinq -> six : `a14e0561dd2828282d24f0892c68ca15fd71499c`.
- Échecs CI `38631333125` : trois anciens tests attendent encore 24 compétences Showcase, et la sentinelle isolée n'avait pas chargé le catalogue natif `fireball`. Réparation des attentes devenues obsolètes et injection **du vrai catalogue de 9 compétences natives** en `4d334e47026c3f040bd1cfcfe3ffbaae2a9555e4`. Aucun code métier modifié.
- Nouveau contrôle révèle la dépendance exacte à `crea_volcadrake` : la fiche canonique historique complète est nécessaire pour valider l'évolution. La sentinelle utilise à présent le **vrai import des créatures natives** (comme le vrai Human Editor), commit `f0f6f70420d8ab7cfc3f6cf1d8b86092de60f910`. Aucun faux mock ni altération de l'export.
- Garde-fous : SHA-256 complets, roundtrip des deux transferts, ID sans doublon, profil/résistances/stats/visuels/loadout/évolution exacts ; deux remplacements dans les Map d'autorité et deuxième batch idempotent ; session de combat réelle 10 dégâts Feu, non-régression des 3 jobs CI (Foundation, Firestorm Chromium, Creature Library Chromium).

## Gate final

Ne pas créer de GREEN ni publier avant 3 jobs CI sur **le SHA final incluant ce rapport**, une preview dédiée et vérification après publication. Validation manuelle Android par l'auteur, non revendiquée.
