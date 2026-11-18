# Labo Combat — audit des sons de créatures par morphologie (18 novembre 2026)

## Périmètre réel
- START : `main@5fa4c25b25a5a1dfd215c5dfc4af510874e4945d` ; checkpoint `checkpoint/lab-start-creature-audio-styles-20261118` ; WORK `work/lab-creature-audio-styles-20261118`. Une seule source de vérité : fiches officielles `data/capture/showcase/*.capture-creature-transfer-v1.json`.
- Les **22 créatures Showcase** ont été vérifiées : 5 `flying`, 7 `biped`, 3 `quadruped`, 3 `serpentine`, 4 `massive`. Avant ce lot, cinq disposaient d'un son de déplacement; attaque / impact / KO / esquive / défense ne sont pas renseignés dans ces exports (ne pas inventer de sons).
- Ce lot affecte uniquement les **5 volants** et **3 quadrupèdes** conformément aux nouvelles décisions auteur. Les autres morphologies restent auditées, mais ne reçoivent pas de sons inventés : `massive` regroupe aussi le requin Selachombre et `serpentine` contient l'araignée Veuve jaune; un son automatique de pas/serpent serait incorrect.
- Aucun runtime, moteur, asset, catalogue, espèce, export hors audio, gameplay, PWA, sauvegarde ni branche d'un autre agent modifié. Les trois assets sont déjà présents dans la bibliothèque unique, sans recopier un seul MP3.
  
## Politique autorisée et citations du catalogue unique
| Sous-groupe | Créatures | Identifiant audio unique | Description du catalogue |
| --- | --- | --- | --- |
| Insectes volants | Ephemus, Foudrillon | `gensrpg:sound:effect-79dd62d8` | Wings, Insects, Moth, Wings Flap, Fly Close |
| Oiseaux/volants non insectes | Veldra, Ailevent, Dracendre | `gensrpg:sound:genrpg-pack2-9320854b` | Move or projectile air (mouvement aérien générique; **pas** prétendu vrai battement d'ailes d'oiseau) |
| Quadrupèdes | Loup, Nat 1, Kitsune lunaire | `gensrpg:sound:sanctuary-367a77dd` | vetement move (bruissement / pelage; choix auteur à valider à l'écoute) |

- Foudrillon conserve intégralement son son d'ailes existant en boucle. Éphémus adopte la même configuration.
- Ailevent remplace l'ancien `spelair t6conf` catalogué en `release` : ce n'était pas un son de déplacement. Dracendre remplace l'ancien son de vêtement par le mouvement aérien; son intervalle de répétition ancien ne convient plus au nouveau clip et n'est pas repris.
- Les quadrupèdes reçoivent le bruissement de vêtement recommandé par l'auteur, sans modifier les autres cinq emplacements audio; leur propriétaire runtime reste `presentation.audio.movement`. Le paramètre reste éditable créature par créature, il n'y a pas de fallback concurrent qui écrase une valeur personnalisée.
- Aucune suppression des sons d'origine : ils restent dans le catalogue unique `data/presentation/audio/private-audio-catalog.v1.json` et ses fichiers sources.
- Conserver `biped`, `massive` et `serpentine` sans généralisation automatique avant une référence sonore appropriée par espèce (aquatique, spectrale, araignée ou terrestre). L'audit complet se distingue de l'attribution vérifiée de ces trois familles.

## Validation
- Reproducteur TDD `tests/integration/capture-creature-audio-styles-20261118.test.mjs` : ID, profil, audio officiel, paquet runtime et rôle `movement` des trois sons.
- RED sur le SHA de test `470b554cc3e8edeaa48a68f0ae1feec26ded1da1`, puis GREEN de la CI complète sur le vrai SHA de la branche et après fusion, sans contournement de test.
- Point de contrôle sur navigateur réel PC/mobile, checkpoint GREEN, fusion `main` autorisée uniquement après 5/5 et déploiement Pages du SHA exact. Ne jamais annoncer GREEN sans preuve.
