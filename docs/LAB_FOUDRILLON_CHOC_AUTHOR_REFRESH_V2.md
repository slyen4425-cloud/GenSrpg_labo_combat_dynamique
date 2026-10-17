# Capture — Remplacement des exports Freclairions et Choc venimeux (V2)

Date : 17 octobre 2026. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande et sources de vérité

L'auteur a fourni deux exports de l'éditeur à **remplacer**, pas de nouvelles entités à inventer :

| Export source | ID stable | Fichier canonique existant | SHA-256 source |
|---|---|---|---|
| `gensrpg-capture-creature-crea_foudrillon.json` | `crea_foudrillon` | `data/capture/showcase/crea_foudrillon.capture-creature-transfer-v1.json` | `54893dce6c212afe6907593babf57c989416a97b4858ab75df42a91735c22fce` |
| `gensrpg-capture-skill-choc_venin(1).json` | `choc_venin` | `data/capture/showcase/choc_venin.capture-skill-transfer-v1.json` | `071f2b06eb12b2aa03f8d160092841a03cfae36ba184896c1b32dd1cc4d65051` |

Les deux objets Git publiés ont été comparés aux **SHA-1 Git blob** des octets des uploads : créature `89ca25ee9acff45b99fa8714d454350c8d24e710` et capacité `3896388914191c1f3726a14c008f8866da9e5831`. Les fichiers stockés sont ainsi exactement les octets reçus, sans réécriture ni pertes silencieuses.

## Données volontairement mises à jour

**Freclairions** : ID historique `crea_foudrillon`, niveau 1, types Air et Électricité, stats, résists, profil Volant, images, ancrage bouche et audio inchangés. L'export contient maintenant **24 capacités configurées**, incluant `lib_paralyze` et `choc_venin`. Nouveau loadout enregistré, dans l'ordre : `lib_paralyze`, `choc_venin`, `lib_tailwind`, `lib_chain_lightning`, ultime `cap_air_atk_7`. Les deux anciennes capacités remplacées en slot (`lib_gust`, `lib_static_bite`) restent dans sa liste de capacités connues ; aucune compétence n'est supprimée de la bibliothèque.

**Choc venimeux** : ID stable `choc_venin`, niveau requis **5**, coût énergie **4**, préparation **700 ms** (contre 0 auparavant), cooldown **45 000 ms** (contre 0 auparavant), et dégâts de sous-effet sur le canal **electric**. `consume_marker` conserve `markerId:"venin-static"`, `count:"all"`, `minimum:1`, `perCharge:true` et `amount:10` : 5 charges réellement consommées ⇒ 50 dégâts électriques de base avant les modificateurs du moteur.

**Attention à la progression** : la créature est de niveau 1 et le nouveau slot 2 pointe sur Choc (niveau requis 5). L'emplacement reste sauvegardé exactement et ne doit pas être effacé ; la progression peut empêcher d'utiliser Choc en combat au niveau 1. Ce n'est pas une erreur d'import.

## Frontières et sentinelles

- Propriétaire canonique : import Transfer vers `configuredCreatures` et `configuredSkills`, dans l'ordre **compétences puis créatures** (un nouveau lien Freclairions → Choc nécessite Choc chargé lors de la validation). Pas de nouvel owner, catalogue, fallback ni auto-placement de capacité.
- Fichiers métier modifiés : **les deux transferts JSON uniquement**. Catalogues, moteurs et règles `perCharge` inchangés.
- Sentinelle unitaire `capture-foudrillon-choc-author-refresh-v2.test.mjs` : hashes et octets exacts des sources, IDs uniques, 24 capacités, cinq slots, éléments/statistiques/visuels intacts, cooldown 45 s + préparation 700 ms + perCharge + canal électrique, import/export sans pertes et remplacement atomique au sein des maps canoniques sans effacer un voisin.
- Les sentinelles préexistantes de Freclairions et de démarrage du catalogue sont alignées sur les nouveaux exports ; elles continuent de vérifier le fidèle chemin Transfer et la préservation des autres fiches. Le test de démarrage installe désormais les presets de capacités avant ceux des créatures, comme le véritable éditeur.
- Smoke Chromium réel dans `capture-creature-library-smoke.mjs` : sélecteurs `configuredCreatures` / `configuredSkills`, rechargement de Freclairions et ses cinq slots, autre créature conservée, Choc et ses nouveaux timings, case perCharge et canal électrique, puis export auteur.
- Gates finaux : Foundation + quatre navigateurs sur **le SHA final** (5/5 SUCCESS), checkpoint GREEN exact, fast-forward contrôlé de `gh-pages`, déploiement GitHub Pages SUCCESS. Validation tactile Android de l'auteur reste distincte.
- Aucune modification de `main`, `global-assets`, Exploration, dépôt `Zombicide-40k`, médias, catalogues ni runtime.
