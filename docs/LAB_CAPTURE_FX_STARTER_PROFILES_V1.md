# Capture FX Starter Profiles V1

Date : 2026-10-05

## But

Fournir une base FX immédiatement utilisable dans l'éditeur Capture sans créer une seconde autorité de présentation et sans modifier le gameplay.

## Base

- base GREEN : `23b133441ff5bb43f54c71c13734335d9031e0ec`
- checkpoint départ : `checkpoint/lab-start-capture-fx-starter-profiles-v1-2026-10-05`
- branche : `work/lab-capture-fx-starter-profiles-v1-2026-10-05`

## Architecture retenue

Un Starter Profile est uniquement un preset de données de présentation.

```
Starter FX Profile
      |
      v
copie des paramètres
      |
      v
champs existants de l'éditeur
      |
      v
SkillPresentationBinding
      |
      v
Presenter / FX / Audio existants
```

Invariants :

- aucun champ de dégâts, portée, énergie, cooldown, collision ou résolution ;
- aucune nouvelle horloge ;
- aucun nouveau renderer ;
- aucun stockage navigateur parallèle ;
- médias référencés uniquement par `assetId` ;
- les profils système sont immuables / protégés ;
- appliquer un profil copie ses valeurs dans la capacité : la capacité peut ensuite être personnalisée librement ;
- le socket de la capacité et les visuels de statuts restent séparés et ne sont pas écrasés par le profil ;
- l'import utilisateur existant continue d'utiliser les mêmes sélecteurs et bindings.

## Profils V1

- Boule de feu
- Projectile d'eau
- Projectile électrique
- Épine naturelle
- Griffe physique
- Zone de flammes
- Aura de soins
- Bouclier d'énergie

Les profils utilisent uniquement des assets déjà publiés dans les catalogues existants. Aucun média n'a été ajouté à `global-assets` dans ce lot.

## UX

Dans l'étape « Effets visuels » de l'éditeur :

1. le créateur choisit une base FX GenSrpG ;
2. il clique « Appliquer et personnaliser » ;
3. les champs Cast / Projectile / Impact / Zone / Audio existants reçoivent une copie du preset ;
4. les réglages avancés restent disponibles dans un panneau repliable ;
5. le gameplay de la capacité reste inchangé.

Le profil n'est jamais « lié » à la capacité après application : il sert de modèle de départ.

## Tests

Nouveau fichier :

`tests/unit/capture-fx-starter-profiles-v1.test.mjs`

Sentinelles :

- profils système protégés et IDs uniques ;
- uniquement des propriétés de présentation ;
- références média par IDs logiques, aucun chemin physique ;
- application non mutante ;
- nettoyage des slots appartenant à l'ancien profil ;
- conservation socket / status visuals / futurs champs de présentation ;
- marqueurs UI présents ;
- réutilisation de `writeSkillSpriteControlsV1` ;
- interdiction `localStorage / sessionStorage / indexedDB` dans le raccord.

CI fonctionnelle avant documentation :

- run : `37351103032`
- résultat : SUCCESS
- tests : **1049 / 1049 PASS**
- échecs : **0**

## Hors périmètre V1

Ce lot ne crée pas encore :

- particules procédurales ;
- glow / lumière dynamique ;
- distorsion ;
- flash / shake configurables par profil ;
- stockage persistant des imports utilisateur ;
- export de package média GenSrpG.

Ces extensions devront réutiliser les owners `src/core/fx/`, Presentation Binding et Asset Input existants au lieu d'introduire un moteur concurrent.
