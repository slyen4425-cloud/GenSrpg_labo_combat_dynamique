# Labo Combat — Import auteur Grainou r3 + Marqueurs r2 (29 octobre 2026)

## Demande et autorité
Deux uploads JSON d'auteur, sans correction arbitraire :
- `gensrpg-capture-creature-crea_nat_1(2).json`, 4 640 octets, SHA256 `70a9390ff81d42d7f2dc9ec574091078a31e20bdad48f8540a23ea627c78a72b`.
- `gensrpg-marqueurs(2).json`, 2 549 octets, SHA256 `9eb2fd0018119aaf672ffc04edf092b3c91dde2aad72620c263b47ddd003c1b5`.

Ces sources complètes sont conservées aux octets exacts sous `data/capture/source-exports/gensrpg-capture-creature-crea_nat_1-2026-10-29-r3.json` et `data/capture/source-exports/gensrpg-marqueurs-2026-10-29-r2.json`. Les archives du 27 et 28 octobre restent immuables.

Un seul propriétaire actif :
- `data/capture/showcase/crea_nat_1.capture-creature-transfer-v1.json` (ID stable `crea_nat_1`, déjà présent une fois dans le manifeste des créatures).
- `data/capture/showcase/markers.capture-markers-v1.json` (bibliothèque officielle des marqueurs, même registre et mêmes cinq IDs).
- `data/capture/showcase/graine_sansue_cap.capture-skill-transfer-v1.json` : uniquement `draft.definition.effects[0].marker.maxStacks` synchronisé à **2**, comme dans la bibliothèque officielle. Les autres valeurs, clips, sprites, effets, son, trajectoires et coûts restent inchangés. L'export compétence précédent, immuable, conserve sa valeur historique 10 : ne jamais décrire l'actif comme « byte-exact » par rapport à cette ancienne source.

## Diff exact approuvé
- Grainou : `draft.combat.reaction.activeWindowMs` 400 → 800 ms ; ajout `Spore_soporifique` à `draft.skillIds` ; `slot-3.skillId` vide → `Spore_soporifique`. Toutes les autres caractéristiques, références Hériplante, sockets, stats, résistances et deux premières capacités restent à l'identique.
- Bibliothèque : `graine-sansue.maxStacks` 10 → 2 ; seul autre écart : ordre des cinq enregistrements (selon l'export utilisateur). Poison, venin-static, éclat spirituel et peste strictement inchangés.
- `Spore_soporifique` est déjà indexé une seule fois dans le manifeste officiel, ne pas le redéposer ni le recréer. L'export Spore existant est un stun à durée `time_ms` 10 secondes : **cet import de données n'affirme pas intégrer la mécanique de Sommeil jusqu'au dégât**, développée dans un autre lot.

## Qualité / validation
- TDD RED sur l'absence des deux nouvelles sources, de Spore dans la fiche et de la limite 2 synchronisée.
- Sentinelles : source SHA256 exact, schéma de transfert, import vrai registre des stats, catalogue par ID unique, fidélité des valeurs et des trois assets visuels, anciens exports préservés et même marqueur dans capacité + bibliothèque.
- Test Chromium du vrai éditeur recharge la bibliothèque, vérifie Graine sansue 2 charges max et Grainou Spore au slot 3 / défense 0,8 seconde.
- Foundation + 4 tests Chromium au même SHA, checkpoint GREEN technique, PR vers gh-pages, CI sur la fusion, Pages SUCCESS et validation Android distincte.

## Traçabilité
- Base `gh-pages@bfdfddc24b6f152658abd6c8bc808e934faa8f4a`, médias `global-assets@2bdc782aa256271f5dc4675a4f6da65faf74073b` intacts.
- START `checkpoint/lab-start-grainou-marker-author-r3-2026-10-29`.
- WORK `work/lab-grainou-marker-author-r3-2026-10-29`.
- Aucune modification de `main`, GenSrpg, Monster Capture, FX, moteurs ou assets.
