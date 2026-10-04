# Asset Resolution Audit V1 — 2026-10-04

État : audit documentaire terminé. Aucun asset/runtime modifié.

## Références auditées

- Base GREEN utilisateur : `1068a9f1109fc3030eb1a10879744b2c3a8a8a9b`
- Checkpoint de départ : `checkpoint/lab-start-asset-resolution-audit-v1-2026-10-04`
- Branche : `work/lab-asset-resolution-audit-v1-2026-10-04`
- Bibliothèque visuelle runtime : branche `global-assets`, SHA `0217dca50ec4004d5ac3bb25d6f5998ccf9edc4f`
- UI auditée : `examples/dom-demo/demo.css`, `capture-editor-v2.html`
- Aucun changement de `main`, `global-assets`, moteur combat ou règles.

## Cause observée sur grand écran

Les combattants peuvent atteindre environ 288 à 406 px CSS de largeur selon leur slot 2v2, avant les facteurs de `displayScale`. Sur un écran DPR 2, une image affichée à 350 px demande environ 700 pixels physiques pour conserver une netteté 1:1.

Un runtime 320×320 peut donc déjà être agrandi sur écran standard et devient nettement sous-échantillonné sur HiDPI.

## Créatures

| Créature | player | opponent | icône | Diagnostic PC |
| --- | ---: | ---: | ---: | --- |
| Ailevent | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Braisombre | 1024×1024 | 1024×1024 | 192×192 | bon / référence actuelle |
| Chat mystique | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Golem moussu | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Guêpe cybernétique | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Loup volcanique | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Maraileron | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Renard magique doré | 320×320 | 320×320 | 192×192 | insuffisant grand écran |
| Voltige | 320×320 | 320×320 | 192×192 | insuffisant grand écran |

Conclusion : 16 vues combat sur 18 sont en 320×320. Braisombre est la seule créature déjà adaptée à un affichage PC/HiDPI confortable.

Les dossiers créature de `global-assets` ne conservent actuellement que les fichiers runtime + meta ; aucun master HD séparé n'est présent pour les huit familles 320×320.

## Sprites de compétences / FX

### Casts génériques

- 5 familles auditées : lame, électrique, nature, physique, eau.
- Atlas : 2048×256, 8 frames.
- Frame runtime : 256×256.
- UI cast : jusqu'à environ 7 rem (~112 px CSS).

Diagnostic : **correct actuellement**, y compris DPR 2. Pas prioritaire.

### Projectiles génériques

- 8 familles : terre, électrique, feu, glace, lumière, ombre, épines, eau.
- Atlas : 2048×256, 8 frames.
- Frame runtime : 256×256.
- Shell projectile : jusqu'à environ 5 rem (~80 px CSS).

Diagnostic : **bon**, marge confortable.

### Impacts génériques

- 5 familles : lame, électrique, nature, physique, eau.
- Atlas : 3200×400, 8 frames.
- Frame runtime : 400×400.
- Impact : environ 112 px CSS ; clash jusqu'à ~144 px.

Diagnostic : **très bon** pour le rendu actuel.

### Boule de feu

- Cast : 6×256 dans un atlas 1536×256.
- Impact : 6×256 dans un atlas 1536×256.
- Projectile : 8×256 dans les atlas 2048×256.

Diagnostic : **bon** à la taille actuelle.

### Zone de feu persistante

- `fire_zone_loop` : 16 frames de **96×96**.
- Atlas : 1536×96.
- UI zone persistante : jusqu'à environ 12 rem (~192 px CSS), avant éventuelle échelle de présentation.

Diagnostic : **critique**. Le sprite est déjà affiché jusqu'à ~2× sa résolution sur DPR 1, et potentiellement ~4× en pixels physiques sur DPR 2. C'est une source directe de flou visible sur PC.

### Auras / statuts

- 7 familles auditées.
- 8 frames de 256×256 chacune.
- Atlas : 2048×256.
- Le sprite de statut est posé à 100% de la zone `fighter__motion`, puis peut encore recevoir un `displayScale`.

Diagnostic : **moyen à insuffisant sur PC**, surtout sur les grands slots adverses. Les 256×256 sont acceptables sur smartphone, mais pas un master idéal pour une aura plein-corps sur écran HiDPI.

Important : le master de provenance des auras est une planche 1536×1024 dont les cellules originales font environ 192 px de large. Réexporter simplement ces mêmes pixels en 512/1024 ne recréerait donc pas du détail. Il faudrait repartir d'une source réellement plus haute résolution / régénérée.

## Arènes

Quatre arènes WebP auditées sont en 1536×864. C'est adapté au smartphone et à une fenêtre PC raisonnable, mais cela finira aussi par être agrandi sur un affichage 4K plein écran. Ce point est secondaire par rapport aux créatures et gros FX.

## Priorités recommandées

### P0 — créatures
Conserver Braisombre comme référence et remplacer progressivement les vues player/opponent 320×320 par de vrais masters **1024×1024** transparents. Ne pas faire un simple upscale des 320 existants comme source définitive.

Cible :
- master combat : 1024×1024 ;
- icône : 192×192 reste suffisante ;
- même cadrage/sockets/meta ;
- aucune modification du moteur nécessaire pour un remplacement 1:1.

### P0 — zone de feu
Refaire `fire_zone_loop` avec une vraie source haute définition.
Cible recommandée : **512×512 par frame** (minimum pratique 384×384). 512 garde de la marge pour DPR 2.

### P1 — statuts plein-corps
Nouvelle source haute résolution puis frames **512×512 minimum**, idéalement master 1024 et runtime 512/1024 adaptatif à terme.

### P2 — qualité adaptative
Ajouter plus tard un contrat d'asset variants, par exemple :
- mobile / standard : 512 ;
- desktop/HiDPI : 1024 ;
- sélection par besoin visuel réel / DPR, sans créer une seconde autorité de présentation.

Ce chantier doit rester séparé : le Presentation Asset resolver choisira la variante, tandis que l'identité de l'asset et la présentation restent canoniques.

## Ce qu'il ne faut pas faire

- pas de filtre CSS de netteté comme solution ;
- pas de `image-rendering: pixelated` pour de l'art peint ;
- pas d'upscale 320→1024 considéré comme nouveau master ;
- pas de deuxième catalogue HD parallèle ;
- pas de chemin spécial PC dans le moteur combat ;
- pas de modification de scale/collision pour masquer un problème de résolution.

## Conclusion

Le flou PC observé est réel et expliqué par les assets, pas par le renderer.

Priorité de remplacement :
1. les 8 familles de créatures en 320×320 ;
2. la zone de feu 96×96 ;
3. les auras/statuts 256×256 ;
4. arènes 1536×864 seulement si une cible 4K plein écran devient importante.

Les casts, projectiles, impacts et Boule de feu ne nécessitent pas de refonte de résolution immédiate.
