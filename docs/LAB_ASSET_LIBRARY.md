# GenSrpG / Laboratoire — Architecture de bibliothèque d'assets

## 1. But

Cette architecture prépare une bibliothèque commune d'assets utilisable par les créateurs sans lier le moteur de combat à des fichiers précis.

Objectifs :

- proposer une base d'icônes, sprites / FX et sons prête à l'emploi ;
- permettre aux créateurs d'ajouter leurs propres assets ;
- conserver une seule chaîne de validation / chargement ;
- référencer les assets par identifiant stable plutôt que par chemin physique ;
- garder Combat Rules totalement indépendant des assets ;
- préserver les fallbacks minimaux du laboratoire.

Ce document décrit l'architecture cible. Il ne signifie pas que la bibliothèque, l'import utilisateur ou le stockage persistent sont déjà implémentés.

---

## 2. Principe général

Chaîne cible :

```
Fichier média
    |
    v
Asset Input
(validation / chargement)
    |
    v
Asset Definition
(métadonnées stables)
    |
    v
Asset Catalog
(index des assets disponibles)
    |
    +---- Asset Pack
    |
    +---- Core Library
    |
    +---- Project Assets
    |
    +---- User Assets
    |
    v
Asset Binding
(liaison sujet -> assetId)
    |
    v
Presenter / FX / Audio Adapter
    |
    v
Renderer / Audio Output
```

Les règles de combat ne traversent jamais cette chaîne.

---

## 3. Responsabilités

### 3.1 Asset Input

Propriétaire du fichier réel.

Responsabilités :

- valider le type MIME ;
- valider qu'un fichier n'est pas vide ;
- charger une source temporaire ;
- libérer les Object URLs ;
- préparer plus tard les validations de dimensions, poids ou format audio ;
- retourner une source utilisable au reste du système.

Le module existant `src/assets/image-source-manager.js` reste la première implémentation de ce domaine.

Il ne doit pas être remplacé par un second chargeur concurrent.

### 3.2 Asset Definition

Décrit un asset logique.

Il ne contient aucune règle de combat.

Exemples :

- icône de compétence ;
- sprite de slash ;
- image d'explosion ;
- son d'impact ;
- portrait de créature.

### 3.3 Asset Catalog

Index unique des Asset Definitions disponibles dans un contexte donné.

Responsabilités :

- recherche par ID ;
- filtrage ;
- détection des collisions ;
- exposition du scope / pack / provenance ;
- résolution d'une définition, jamais d'une règle gameplay.

### 3.4 Asset Pack

Manifest regroupant plusieurs assets cohérents.

Exemples futurs :

- Fantasy Base ;
- Feu ;
- Eau ;
- Science-fiction ;
- Anime ;
- Capture ;
- Zombies.

Un pack peut proposer des assets et des bindings optionnels.

Il ne remplace jamais silencieusement une référence existante.

### 3.5 Asset Binding

Relie un sujet fonctionnel à un `assetId`.

Important :

**les bindings de présentation restent séparés des données gameplay.**

Une compétence peut donc garder :

- dégâts ;
- énergie ;
- portée ;
- timings ;
- cooldown futur ;

dans `SkillDefinition`, tandis que son apparence / audio est stockée dans un binding de présentation séparé.

---

## 4. Classification officielle initiale

### 4.1 Types d'assets

Valeurs initiales :

- `icon` — petite représentation UI ;
- `sprite` — image ou animation visuelle d'un objet / effet ;
- `fx` — ressource destinée à un effet visuel ;
- `sound` — effet audio ;
- `portrait` — illustration / vignette de créature ou personnage ;
- `background` — fond / décor ;
- `ui` — ressource d'interface.

Cette classification est fonctionnelle.

Le format physique reste décrit séparément par le MIME type.

### 4.2 Familles média

- `image`
- `audio`

Les effets procéduraux sans fichier média, comme le texte `RATÉ` actuel, ne sont pas obligatoirement des assets fichier.

Ils pourront être décrits plus tard comme `Presentation Presets`.

### 4.3 Catégories fonctionnelles

Catégories initiales :

- `skill`
- `release`
- `travel`
- `impact`
- `hit`
- `miss`
- `evade`
- `block`
- `reflect`
- `immune`
- `heal`
- `buff`
- `debuff`
- `ko`
- `summon`
- `recall`
- `movement`
- `ui`
- `ambience`

Un asset peut posséder plusieurs tags mais une catégorie principale.

### 4.4 Tags

Les tags servent au filtrage créateur.

Exemples :

- `fire`
- `water`
- `electric`
- `magic`
- `physical`
- `melee`
- `projectile`
- `teleport`
- `aerial`
- `fantasy`
- `sci-fi`
- `anime`
- `capture`
- `zombie`

Les tags n'ont aucune autorité gameplay.

---

## 5. Scopes / provenance

Quatre scopes cibles :

### `core`

Bibliothèque commune fournie avec GenSrpG.

Exemples :

- icônes génériques ;
- impacts de base ;
- sons génériques ;
- effets élémentaires standards.

### `pack`

Asset fourni par un pack thématique installé.

Le pack possède son propre identifiant et sa version.

### `project`

Asset appartenant à un jeu, monde ou projet créé.

Il n'est pas automatiquement partagé avec les autres projets.

### `user`

Asset personnel importé par le créateur.

Il doit utiliser exactement le même contrat qu'un asset core.

Le scope décrit la provenance et les règles de résolution, pas la qualité de l'asset.

---

## 6. Identifiants

### 6.1 Règle

Un `assetId` est :

- stable ;
- immuable après création ;
- indépendant du nom du fichier ;
- indépendant de son chemin physique ;
- unique dans le catalogue résolu.

### 6.2 Exemples

Assets fournis :

- `core:icon-skill-fireball-01`
- `core:fx-fire-impact-01`
- `core:sound-hit-light-01`
- `pack:fantasy-base:fx-slash-01`

Assets créateur :

- `user:<identifiant-généré>`
- `project:<identifiant-généré>`

Pour les imports personnels, l'identifiant technique doit être généré et ne doit pas dépendre d'un nom modifiable comme `ma-super-boule-de-feu.png`.

---

## 7. Nommage des fichiers fournis

Les noms de fichiers officiels doivent rester humains et stables.

Convention :

`<type>_<category>_<theme-or-element>_<variant>.<ext>`

Exemples :

- `icon_skill_fireball_01.webp`
- `fx_impact_fire_01.webp`
- `sprite_slash_physical_02.webp`
- `sound_impact_fire_01.ogg`
- `sound_miss_air_01.ogg`

Le nom physique est pratique pour Git et le débogage.

Il ne devient jamais la clé métier.

---


## 7.1 Organisation physique officielle — arènes

Les arènes disposent d'une famille dédiée dans la bibliothèque, au même niveau logique que les icônes, sprites et FX.

Arborescence cible initiale :

```
assets/library/core/
  icons/
  sprites/
  fx/
  arenas/
    forest/
    cave/
    snow/
    desert/
    city/
    sci-fi/
```

Chaque biome possède son propre sous-dossier. Les fichiers ne doivent pas être mélangés avec les textures de tuiles, sprites de créatures ou FX.

Convention de nommage :

`arena_<biome>_<variant>.webp`

Exemples :

- `arena_forest_01.webp`
- `arena_cave_01.webp`
- `arena_snow_01.webp`

Le PNG source maître peut être conservé hors runtime si nécessaire, mais la ressource runtime privilégiée est WebP.

Une arène est un asset de présentation de type `background`. Son identité de biome n'a aucune autorité gameplay.

## 7.2 Organisation physique officielle — séquences de sprites

Les séquences de sprites restent des assets logiques uniques même lorsqu'elles sont composées de plusieurs fichiers physiques.

Arborescence cible :

```
assets/library/<scope>/sprites/skills/<sequence_id>/
  README.md
  <sequence_manifest>.json
  frames/
    <frame_01>.<ext>
    <frame_02>.<ext>
    ...
```

Le manifeste de séquence décrit au minimum :

- un identifiant logique stable ;
- l'ordre exact des frames ;
- `frame_ms` comme durée technique de lecture ;
- `loop` ;
- la liste des fichiers réellement présents.

Le renderer de présentation peut résoudre une séquence sous la forme :

```js
{
  assetId: "pack:capture:sprite-teleportation-2",
  frames: ["...01.svg", "...02.svg", "..."],
  frameMs: 38
}
```

Règles :

- une séquence multi-fichiers ne nécessite pas obligatoirement un atlas ;
- un atlas peut rester une optimisation runtime, sans changer l'`assetId` logique ;
- le manifeste ne doit jamais référencer des frames absentes ;
- le choix `cast / travel / impact / phase` appartient au Presentation Binding ;
- les frames, leur durée technique et leur ordre n'ont aucune autorité sur dégâts, portée, énergie, cooldown ou résultat de combat ;
- le futur éditeur de compétences pourra filtrer ces assets par catégorie et tags sans exposer les chemins physiques.

## 8. AssetDefinition — modèle conceptuel

Exemple image :

```json
{
  "id": "core:fx-fire-impact-01",
  "label": "Impact feu 01",
  "assetType": "fx",
  "mediaType": "image",
  "category": "impact",
  "tags": ["fire", "combat", "skill"],
  "source": {
    "scope": "core",
    "packId": null,
    "author": "GenSrpG Base",
    "license": "project-internal"
  },
  "resource": {
    "file": "fx/impact/fire/fx_impact_fire_01.webp",
    "mime": "image/webp"
  },
  "compatibility": {
    "uses": ["combat", "capture"]
  }
}
```

Exemple audio :

```json
{
  "id": "core:sound-teleport-release-01",
  "label": "Téléportation 01",
  "assetType": "sound",
  "mediaType": "audio",
  "category": "release",
  "tags": ["teleport", "magic", "combat"],
  "source": {
    "scope": "core",
    "packId": null,
    "author": "GenSrpG Base",
    "license": "project-internal"
  },
  "resource": {
    "file": "audio/teleport/sound_teleport_release_01.ogg",
    "mime": "audio/ogg"
  },
  "compatibility": {
    "uses": ["combat", "capture"]
  }
}
```

Ce format reste conceptuel tant que le contrat n'a pas été implémenté et testé.

---

## 9. Métadonnées obligatoires prévues

Minimum cible :

- `id`
- `label`
- `assetType`
- `mediaType`
- `category`
- `tags`
- `source.scope`
- `source.author`
- `source.license`
- `resource`
- `compatibility.uses`

Métadonnées optionnelles futures :

- description ;
- preview ;
- dimensions ;
- durée technique audio ;
- taille fichier ;
- version ;
- attribution URL ;
- langue ;
- thème ;
- notes créateur.

Une durée de fichier audio peut être une métadonnée technique.

Elle ne remplace jamais `SkillDefinition.preparationMs / travelMs / recoveryMs / cooldownMs`.

---

## 10. Formats initiaux envisagés

### Images

Déjà supportés par Asset Input image :

- PNG ;
- WebP ;
- JPEG.

SVG utilisateur n'est pas inclus dans le premier contrat tant que sa validation / sécurité n'est pas traitée explicitement.

### Audio

Premier lot futur à valider par contrat et tests :

- OGG ;
- MP3 / MPEG ;
- WAV.

Le choix définitif des MIME types sera fait lors du contrat Audio Asset Input.

Aucun format n'est considéré supporté uniquement parce qu'il est listé dans ce document.

---

## 11. Asset Binding

### 11.1 Pourquoi séparer le binding

Éviter ce modèle :

```json
{
  "damage": 30,
  "impactSound": "assets/audio/fire/hit.ogg"
}
```

Le chemin physique contaminerait la donnée gameplay.

Préférer :

```
SkillDefinition
     |
     +---- gameplay uniquement

SkillPresentationBinding
     |
     +---- références assetId
```

### 11.2 Exemple conceptuel skill

```json
{
  "subjectType": "skill",
  "subjectId": "fireball",
  "assets": {
    "icon": "core:icon-skill-fireball-01",
    "releaseFx": "core:fx-fire-cast-01",
    "travelFx": "core:fx-fire-projectile-01",
    "impactFx": "core:fx-fire-impact-01",
    "missFx": "core:fx-miss-01",
    "releaseSound": "core:sound-fire-cast-01",
    "travelSound": "core:sound-fire-travel-01",
    "impactSound": "core:sound-fire-impact-01",
    "missSound": "core:sound-miss-air-01"
  }
}
```

### 11.3 Autres sujets possibles

Même principe pour :

- créature ;
- commande ;
- objet ;
- statut ;
- élément ;
- interface.

---

## 12. Slots de présentation initiaux

Pour une compétence :

### Visuel

- `icon`
- `releaseFx`
- `travelFx`
- `impactFx`
- `hitFx`
- `missFx`
- `koFx`

### Audio

- `releaseSound`
- `travelSound`
- `impactSound`
- `hitSound`
- `missSound`

Tous les slots sont optionnels.

Une compétence sans son doit rester fonctionnelle.

Une compétence sans FX dédié doit rester fonctionnelle.

---

## 12.1 Réglages visuels du futur éditeur de compétences

Cette section est la référence pour le futur raccord entre la bibliothèque d'assets et l'éditeur de compétences GenSrpG.

Principe fondamental :

**les réglages visuels appartiennent au SkillPresentationBinding, jamais au SkillDefinition gameplay.**

Une compétence peut donc modifier son apparence sans modifier :

- dégâts ;
- énergie ;
- portée ;
- préparation gameplay ;
- trajet gameplay ;
- cooldown ;
- résultat de combat.

### Réglages par slot visuel

Les réglages doivent être indépendants pour chaque slot, par exemple :

- cast / préparation ;
- travel / projectile ;
- impact ;
- disparition ;
- réapparition ;
- aura ;
- effet au sol ;
- autres phases de présentation futures.

Chaque slot pourra proposer au minimum :

- `assetId` — choix dans la bibliothèque ;
- `displayScale` — taille visuelle ;
- `attachment` — point de référence spatial ;
- `anchor` — bouche, tête, main, centre, cible, etc. ;
- `offsetX / offsetY` — correction manuelle de position ;
- `layer` — devant / derrière la créature ;
- `trigger` — moment logique de présentation ;
- `rotation` optionnelle ;
- `opacity` optionnelle ;
- preview immédiate dans l'éditeur.

Le scale doit être réglable **par effet**, pas une seule fois pour toute la compétence.

Plage UI initiale recommandée pour `displayScale` :

- curseur environ `0.25x -> 4x` ;
- valeur numérique visible ;
- reset rapide à `1x`.

Cette plage est un réglage de présentation et peut évoluer sans changer le contrat gameplay.

### Modes d'attache simples et intuitifs

L'éditeur ne doit pas demander au créateur de connaître les détails du DOM ou de l'Animation Core.

Modes utilisateurs cibles :

- **Attaché au lanceur** — le FX suit la créature qui utilise la compétence ;
- **Attaché à la cible** — le FX suit la cible ;
- **Fixé à la position** — la position est capturée au déclenchement puis le FX reste à cet endroit ;
- **Trajet lanceur -> cible** — pour projectiles / rayons ;
- **Sol / arène** — pour un effet spatial indépendant d'une créature.

Exemple recommandé pour une disparition de téléportation :

- trigger : « Quand le lanceur disparaît » ;
- attachment : « Fixé à la position » ;
- anchor : « Centre de la créature » ;
- scale réglable ;
- layer réglable.

Ainsi le sprite reste visuellement à l'endroit de disparition même si la créature est ensuite déplacée ailleurs par son animation.

### Déclencheurs utilisateur vs phases techniques

L'éditeur doit présenter des termes compréhensibles :

- Début de préparation ;
- Lancement ;
- Début du trajet ;
- Impact ;
- Disparition ;
- Réapparition ;
- Retour ;
- Fin.

Il ne doit pas obliger le créateur à manipuler des labels internes tels que :

- `teleport-vanish` ;
- `teleport-return-vanish` ;
- autres labels Animation Core.

Une couche de mapping Presentation Binding traduit les choix utilisateurs vers les phases techniques existantes.

### Presets d'usage

Pour garder l'éditeur simple, proposer des presets avant les réglages avancés :

- Cast autour du lanceur ;
- Projectile vers la cible ;
- Impact sur la cible ;
- Disparition du lanceur ;
- Réapparition du lanceur ;
- Aura attachée ;
- Effet au sol.

Le créateur peut ensuite ouvrir **Réglages avancés** pour modifier scale, offsets, anchor, layer, rotation ou opacité.

### Sélection depuis la bibliothèque

Les menus de l'éditeur doivent filtrer le catalogue par :

- type : icon / sprite / fx / sound ;
- rôle : cast / travel / impact / phase / aura ;
- élément / thème ;
- tags ;
- pack / provenance.

Exemple :

`Impact -> Feu -> Impact feu 01 / 02 / 03`

plutôt qu'une liste de noms de fichiers physiques.

Le binding conserve uniquement des IDs stables et paramètres visuels. Les chemins de fichiers restent la responsabilité du catalogue / stockage.

---

## 13. Fallbacks obligatoires

La bibliothèque ne doit jamais rendre le gameplay dépendant d'un asset décoratif.

Fallbacks cibles :

- icône absente -> icône générique ou aucun pictogramme selon UI ;
- FX absent -> aucun FX supplémentaire ;
- son absent -> silence ;
- portrait absent -> fallback existant ;
- vue créature spécifique absente -> image unique valide ;
- pack manquant -> binding signalé indisponible, jamais crash du combat.

Le fallback ne doit pas inventer une règle gameplay.

---

## 14. Asset Pack — modèle conceptuel

```json
{
  "id": "fantasy-base",
  "name": "Fantasy Base",
  "version": "1.0.0",
  "author": "GenSrpG",
  "license": "project-internal",
  "assets": [
    "pack:fantasy-base:fx-slash-01",
    "pack:fantasy-base:sound-sword-hit-01"
  ],
  "bindings": []
}
```

Règles :

- un pack ne redéfinit pas un ID existant ;
- les assets du pack gardent leur namespace ;
- les bindings d'un pack sont optionnels ;
- appliquer un binding de pack doit être explicite ;
- désinstaller un pack ne supprime pas silencieusement les assets personnels ;
- un projet doit pouvoir signaler qu'un pack requis est absent.

---

## 15. Import d'un asset personnel — flux cible

```
Sélection fichier
    |
    v
Asset Input.validate()
    |
    v
lecture métadonnées techniques
    |
    v
formulaire créateur
(type / catégorie / tags / label)
    |
    v
génération assetId immuable
    |
    v
Storage Adapter
    |
    v
Asset Catalog.register()
    |
    v
Asset Binding sélectionnable
```

Le stockage n'appartient pas au Core combat.

Dans le laboratoire, un import peut rester temporaire.

Dans GenSrpG futur, le stockage pourra passer par un adaptateur adapté au projet, par exemple IndexedDB, sans changer AssetDefinition.

---

## 16. Séparation catalogue / stockage

Important :

`Asset Catalog` ne stocke pas nécessairement les octets.

Il connaît :

- les définitions ;
- les IDs ;
- les métadonnées ;
- la manière logique de retrouver une ressource.

Un `Storage Adapter` séparé pourra gérer :

- fichier packagé ;
- Blob IndexedDB ;
- Object URL ;
- ressource distante autorisée ;
- cache local.

Cela évite de rendre le catalogue dépendant d'IndexedDB ou d'un chemin GitHub.

---

## 17. Bibliothèque créateur — expérience cible

Future UI :

### Parcourir

Filtres :

- type ;
- catégorie ;
- élément / thème via tags ;
- source ;
- pack ;
- auteur ;
- usage compatible.

### Prévisualiser

- image : vignette ;
- son : bouton écouter / stop ;
- sprite / FX : mini-preview si supportée.

### Utiliser

Depuis une compétence :

- choisir icône ;
- choisir FX release ;
- choisir FX travel ;
- choisir FX impact ;
- choisir FX miss ;
- choisir son release ;
- choisir son travel ;
- choisir son impact ;
- choisir son miss.

### Importer

- choisir fichier ;
- valider ;
- renseigner label / catégorie / tags ;
- sauvegarder ;
- utiliser immédiatement dans les bindings du projet.

---

## 18. Audio — catégories de mixage futures

Les catégories audio ne sont pas des règles gameplay.

Cibles :

- `combat`
- `ui`
- `ambience`
- `music` plus tard si nécessaire.

Elles permettront :

- volume global ;
- volume par catégorie ;
- mute ;
- mode effets réduits ;
- préférences utilisateur.

Un son ne doit jamais posséder l'autorité sur le timestamp réel d'un impact.

Le Presenter / Audio Adapter reçoit l'événement gameplay déjà décidé.

---

## 19. Sprites / FX — niveaux futurs

### Niveau minimal

- image unique transparente.

### Niveau enrichi

- sprite sheet ;
- séquence d'images ;
- preset procédural ;
- particules plus tard.

Le moteur doit toujours accepter le niveau minimal.

Une capacité ne doit jamais exiger une sprite sheet pour fonctionner.

---

## 20. Structure physique cible — proposition

La structure suivante est une cible documentaire, pas encore créée :

```
assets/
  test/
    ...                         # laboratoire uniquement
  library/
    core/
      icons/
      sprites/
      fx/
      audio/
      portraits/
      backgrounds/
      ui/

data/
  assets/
    catalog/
    packs/
    bindings/
      skills/
      creatures/
      commands/
      statuses/
```

Pour les assets personnels, aucun chemin Git fixe n'est supposé.

Ils passeront par un Storage Adapter.

---

## 21. Relation avec les assets de créatures existants

Les fichiers :

```
assets/test/creatures/<creature>/
```

restent valides pour le laboratoire.

Ils ne sont pas automatiquement migrés ou renommés dans ce lot.

À terme, leur metadata pourra être adaptée vers le même Asset Catalog, mais uniquement dans un chantier dédié avec tests de non-régression.

Le fallback image unique imposé par la charte reste permanent.

---

## 22. Provenance et licence

Tout asset proposé dans une bibliothèque distribuée doit pouvoir indiquer :

- auteur ;
- source ;
- licence ;
- besoin éventuel d'attribution.

Un asset utilisateur peut être marqué comme privé au projet.

Le système ne doit pas présenter un asset comme réutilisable globalement simplement parce qu'il a été importé.

Cette métadonnée prépare :

- partage de packs ;
- export de projets ;
- contrôle des dépendances ;
- attribution future.

---

## 23. Règles de résolution

Ordre conceptuel :

1. lire le binding demandé ;
2. récupérer exactement l'`assetId` référencé ;
3. résoudre cet ID dans le catalogue actif ;
4. demander la ressource au Storage / Asset Input approprié ;
5. présenter l'asset ;
6. si absent :
   - appliquer fallback déclaré ;
   - journaliser proprement ;
   - ne jamais casser Combat Rules.

Il n'existe pas de priorité implicite où un asset `user` écrase automatiquement un asset `core`.

Le remplacement passe par un binding explicite.

---

## 24. Invariants permanents

1. Aucun asset ne décide d'un résultat gameplay.
2. Aucun son ne décide du timing d'impact.
3. Aucun sprite ne décide de la portée.
4. Aucun chemin physique n'est une clé métier.
5. Tous les bindings utilisent des `assetId`.
6. Core / pack / project / user restent distingués.
7. Un import utilisateur utilise le même contrat qu'un asset fourni.
8. La disparition d'un asset décoratif ne rend pas le combat injouable.
9. Une image unique reste un fallback de créature valide.
10. Le laboratoire reste indépendant de `Zombicide-40k`.

---

## 25. Découpage des prochains lots

### Lot A — architecture

Ce document.

Aucun runtime nouveau.

### Lot B — contrats

Créer et tester :

- `AssetDefinition` ;
- `AssetPackDefinition` ;
- `AssetBindingDefinition`.

### Lot C — catalogue

Créer un Asset Catalog pur :

- register ;
- lookup ;
- filter ;
- collision detection.

Sans UI.

### Lot D — audio input

Créer le gestionnaire d'input audio :

- types autorisés ;
- Object URL ;
- dispose ;
- validation.

### Lot E — bindings combat

Brancher quelques bindings de test :

- Griffe ;
- Boule de feu ;
- Téléportation ;
- Hit ;
- Raté ;
- KO.

Sans importer encore une grosse bibliothèque.

### Lot F — bibliothèque test

Ajouter un petit pack d'assets autorisés :

- icônes ;
- sprites / FX ;
- sons.

### Lot G — import créateur

UI laboratoire :

- importer ;
- prévisualiser ;
- écouter ;
- enregistrer temporairement ;
- binder.

Le stockage persistant GenSrpG restera un chantier d'intégration séparé.

---

## 26. Critère de réussite global

Le système sera considéré prêt pour une future intégration quand :

- un skill peut changer complètement d'apparence et de sons sans changer son gameplay ;
- un créateur peut choisir entre asset core, pack ou personnel ;
- un fichier personnel peut être validé, enregistré et référencé par ID ;
- la suppression d'un asset optionnel déclenche un fallback propre ;
- les packs sont traçables et licenciés ;
- aucun module combat ne dépend du stockage ou de l'UI ;
- le même concept peut être réutilisé dans Capture et d'autres modes.
