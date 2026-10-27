# Laboratoire Combat Capture — Lumilo, Rayon lumineux et Onde lumineuse (17 octobre 2026)

## Source auteur et décision

Trois exports transmis pour intégration dans l'unique catalogue actif, sans recopier les fiches dans le JavaScript :

| ID / fichier actif | Import | Identité source |
| --- | --- | --- |
| `lib_light_bolt` — `data/capture/showcase/lib_light_bolt.capture-skill-transfer-v1.json` | **byte-exact** | SHA-256 `a7d7d7c3d5e2fef9156ecffc22f645c93fbad4fd78bde4f573c28f3c5764f4b2` ; Git blob `93f30a93ea9526e15af5b625c046492315a10d68` |
| `crea_lumilo` — `data/capture/showcase/crea_lumilo.capture-creature-transfer-v1.json` | **byte-exact** | SHA-256 `8780a18b840ccbb59fa85396c52b03851bcb6d95b5375577eb4206aa8688e3a2` ; Git blob `45cd9ffafeb34a5fc327216dcc610e017c2f27f4` |
| `cap_light_atk_5` — `data/capture/showcase/cap_light_atk_5.capture-skill-transfer-v1.json` | **corrigé explicitement** | Source brute archivée byte-exact en `data/capture/source-exports/gensrpg-capture-skill-cap_light_atk_5-2026-10-17.json` (SHA-256 `55b6115d35d1b29b8199aff907a38d81892d78da2e0eefbbb93485ab5a68dd8a`, blob `e569d37a1283d13b0c5b348da0af2e6588c14ec7`). Preset final blob `d160c51b5e9c0ede6f273c3089c41c661af35055`. |

L'export Onde lumineuse original contenait **100 PV de soin des alliés actifs** puis **100 dégâts de lumière aux alliés en réserve**. À la demande expresse de l'auteur, son deuxième effet devient `{kind:"heal",targetScope:"all_ally_reserves",amount:100}`, avec le premier inchangé `{kind:"heal",targetScope:"all_allies",amount:100}`. Le canal `light` et les deux options de pénétration sont supprimés de l'effet converti, car ils sont propres au contrat Damage et non à Heal. Tous les autres champs, y compris `maxUsesPerCombat:1`, coût 10, préparation 3000 ms, niveau requis 20, type de capacité et `presentation:null`, sont identiques à la source.

## Fiches placées

- **Rayon lumineux** : projectile Lumière ; 8 dégâts légers, énergie 3, préparation 600 ms, trajet 600 ms, recharge 8000 ms, puissance de collision 1. Icon `core:icon-skill-holy-beam-01`, cast `pack:capture:sprite-cast-electric-01`, projectile `pack:capture:sprite-projectile-light-01`, impact `pack:capture:sprite-electric-yellow-beam-impact-01` et 3 sons d'auteur préservés par leurs `assetId`. Aucune création/remplacement d'assets binaires dans ce lot.
- **Lumilo** : ID stable `crea_lumilo`, Lumière, niveau 1, 95 PV, évolution prévue vers `crea_solarys` au niveau 18, réaction Dodge 2 charges, statistiques et cinq sockets intactes. 11 capacités connues et équipement exact : `lib_light_bolt`, `lib_magic_barrier`, `cap_light_special_1`, `cap_light_atk_4`, ultime `cap_light_atk_5`. Le slot ultime niveau 20 reste configuré malgré niveau actuel 1 ; seul le moteur de progression décide de sa disponibilité.
- **Onde lumineuse** : deux effets `heal`, 100 PV sur tous les alliés actifs et 100 PV sur toutes les réserves alliées ; zéro dommage allié. Ni nouvelle branche de soin, ni deuxième registre pour les réserves, ni simulation de faux acteurs actifs. `RosterSession` conserve l'état effectif de chaque réserve et le coût unique de l'ultime est payé par le Combat Rules existant.

## Gouvernance et vérification

Base `gh-pages@b04e6eb1691606567820ffb52381ce49f2ee478f`, checkpoint initial `checkpoint/lab-start-lumilo-light-heal-v1-2026-10-17`, travail `work/lab-lumilo-light-heal-v1-2026-10-17`. Les identités existantes ne sont pas dupliquées. Catalogues canoniques : **34 presets de capacités** après +2 et **8 presets de créatures** après +1. L'éditeur doit conserver ses 103 créatures actives (Lumilo préexistant dans le catalogue historique) et ne pas substituer un template legacy aux trois fiches auteur.

Nouveau test `tests/integration/capture-lumilo-light-heal-author-v1.test.mjs` : tailles et SHA originaux, archive d'Onde fidèle, égalité de tous les champs non corrigés, importe/exporte les trois fiches via le vrai `Capture Transfer`, cinq slots Lumilo, projectile FX/audio et soin réellement exécuté sur deux alliés actifs + trois réserves alliées, adversaire non touché, énergie/usage uniques et aucune réserve convertie en acteur artificiel.

Sondes navigateurs : `tests/browser/capture-creature-library-smoke.mjs` ouvre le **vrai éditeur**, recherche les IDs depuis `configuredCreatures/configuredSkills`, resélectionne Lumilo et son équipement, recharge Rayon lumineux avec ses timings et FX, puis Onde lumineuse avec deux soins de 100 et intercepte le véritable JSON exporté. Freclairions et Nid de frelon restent visibles. Les anciennes sentinelles de cardinalité et les tests d'autres compétences demeurent actifs, leur total seul ayant été actualisé.

Critères de livraison : CI Laboratory `Foundation + 4 Chromium` (5/5) du SHA documentaire final, checkpoint GREEN sur ce SHA exact, publication fast-forward sous garde `expected_sha` de `gh-pages`, puis GitHub Pages SUCCESS. Le test ergonomique tactile Android nécessite ensuite le retour auteur.
