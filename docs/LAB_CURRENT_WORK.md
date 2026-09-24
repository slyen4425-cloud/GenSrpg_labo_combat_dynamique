# Laboratoire Combat Dynamique — Current Work

Ce fichier est le point de reprise opérationnel du laboratoire.

## État global

Date : 2026-09-24

Phase active : Phase 2 — Renderer DOM/CSS + démo visuelle V1 — pré-audit.

Le dépôt est autonome et ne possède aucune dépendance à GenSrpG.

## Fondation validée

Dépôt :

`slyen4425-cloud/GenSrpg_labo_combat_dynamique`

Branche stable :

`main`

SHA GREEN de fondation :

`3197388f2b3ee7491be6e6125a015315158cffa2`

Checkpoint GREEN :

`checkpoint/lab-foundation-green-2026-09-24`

CI :

- workflow : `Laboratory CI`
- run : `36043623014`
- conclusion : SUCCESS

## Documents obligatoires de reprise

Lire dans cet ordre :

1. `docs/LAB_CHARTE.md`
2. `docs/LAB_ROADMAP.md`
3. `docs/LAB_CURRENT_WORK.md`
4. `docs/LAB_ARCHITECTURE.md`
5. `docs/LAB_CHECKPOINT_POLICY.md`

Puis vérifier les branches, SHA et CI réels sur GitHub.

## Chantier précédent terminé

Nom :

`mono-image-animation-core`

Checkpoint de départ :

`checkpoint/lab-start-mono-image-animation-core-2026-09-24`

SHA de base :

`3197388f2b3ee7491be6e6125a015315158cffa2`

Branche de travail :

`work/lab-mono-image-animation-core-2026-09-24`

### Résultat

Le laboratoire possède maintenant :

- contrat `CombatVisualEvent` ;
- contrat `VisualActor` ;
- contrat `AnimationPlan` ;
- planner pur V1 ;
- animations planifiées : `idle`, `attack`, `hit`, `ko` ;
- orientation gauche/droite pilotée par l'acteur ;
- profils de données `serpentine` et `drake` ;
- registre de profils ;
- métadonnées Maraileron et Braisombre ;
- format standard des assets de créature ;
- spécification `LAB_CONTRACTS_V1.md` ;
- sentinelles CI renforcées.

Aucune logique DOM, Canvas, gameplay Capture ou dépendance GenSrpG n'est entrée dans le Core.

### SHA validé avant clôture documentaire

`a31d505496f5cb706d5c1ff74389e40f22af1cef`

### CI correspondante

- run : `36047308553`
- conclusion : SUCCESS

## Assets utilisateur reçus

Deux planches de test ont été fournies :

- Maraileron — profil `serpentine` ;
- Braisombre — profil `drake`.

Convention validée :

- vue adversaire : 3/4 face ;
- vue joueur : 3/4 dos ;
- icône : portrait ;
- deux vues recommandées, mais une seule image devra rester suffisante pour une créature utilisateur.

Les chemins cibles sont déjà réservés dans les métadonnées :

`assets/test/creatures/maraileron/maraileron_opponent.png`
`assets/test/creatures/maraileron/maraileron_player.png`
`assets/test/creatures/maraileron/maraileron_icon.png`

`assets/test/creatures/braisombre/braisombre_opponent.png`
`assets/test/creatures/braisombre/braisombre_player.png`
`assets/test/creatures/braisombre/braisombre_icon.png`

Le raccord binaire des PNG est un lot asset séparé : il ne doit pas contaminer le Core.

## Checkpoint GREEN créé

`checkpoint/lab-mono-image-animation-core-green-2026-09-24`

SHA GREEN :

`120d0b2eaa311572867ad2f7955edc14c2ae0786`

CI : SUCCESS

## Chantier courant

Nom :

`dom-renderer-demo-v1`

Objectif :

Créer un premier adaptateur DOM/CSS et une démo autonome permettant de jouer les plans V1 sans déplacer la logique d'animation dans l'UI.

Checkpoint de départ :

`checkpoint/lab-start-dom-renderer-demo-v1-2026-09-24`

SHA de base :

`120d0b2eaa311572867ad2f7955edc14c2ae0786`

Branche de travail :

`work/lab-dom-renderer-demo-v1-2026-09-24`

## Périmètre du prochain chantier

Autorisé :

- adaptateur DOM/CSS ;
- conversion `AnimationPlan -> keyframes` ;
- montage/démontage propre d'un acteur ;
- annulation/restauration ;
- interface de laboratoire minimale ;
- chargement de PNG utilisateur ;
- test visuel Maraileron/Braisombre dès que les assets sont disponibles.

Protégé / hors périmètre :

- dépôt `Zombicide-40k` ;
- intégration GenSrpG ;
- règles de dégâts ;
- tour par tour ;
- sauvegardes ;
- FX avancés ;
- caméra avancée ;
- Canvas/WebGL ;
- framework lourd.

## Tests prévus

- plan -> keyframes ;
- restauration après animation ;
- annulation sans état résiduel ;
- aucun calcul gameplay dans le renderer ;
- aucune dépendance GenSrpG ;
- interface utilisable sur mobile.

## État du chantier DOM renderer V1

Implémentation présente :

- adaptateur pur `AnimationPlan -> DOM timeline` ;
- composition état de base + transformation transitoire ;
- runtime DOM d'acteur à propriétaire unique ;
- annulation/restauration propre ;
- prise en charge explicite de `Animation.finished` / `AbortError` ;
- Asset Input avec validation PNG/WebP/JPEG et révocation Object URL ;
- démo navigateur autonome mobile-first ;
- configuration initiale Maraileron joueur / Braisombre adversaire ;
- contrôles : Idle, Attaque, Hit, KO, Stop ;
- intensité configurable ;
- documentation `LAB_RENDERER_V1.md` ;
- sentinelles de frontières renforcées.

SHA d'implémentation structurelle validé :

`dce3f648875627e116ae66d005691f04572d82fa`

CI :

- run : `36049398880`
- conclusion : SUCCESS

### Incident CI traité

Une première CI rouge a détecté un rejet asynchrone `AbortError` lors de l'annulation d'un idle en boucle.

Cause démontrée : le renderer ne consommait pas `animation.finished` pour les animations infinies.

Correction : l'observation et la résolution de l'annulation appartiennent désormais au renderer pour toutes les animations. Aucun contournement n'a été ajouté dans l'UI ou dans le test.

### Validation restante

Le chantier n'est pas encore GREEN final.

Obligatoire avant clôture :

- test manuel smartphone ;
- validation ergonomique des contrôles ;
- validation visuelle Idle / Attaque / Hit / KO ;
- vérification de l'absence d'état résiduel après Stop ou changement d'animation.

### Assets

Les planches Maraileron et Braisombre sont reçues.

Le découpage/raccord binaire reste un lot asset séparé. La démo actuelle accepte les images depuis l'appareil afin que le renderer reste testable sans couplage asset.

Checkpoint intermédiaire créé :

`checkpoint/lab-dom-renderer-demo-v1-preaudit-green-2026-09-24`

SHA de l'état pré-audit validé :

`cef6bf75919f2fc68e24a47ee02670a6e151ff45`

CI :

- run : `36049457429`
- conclusion : SUCCESS

Branche de prévisualisation :

`preview/lab-dom-renderer-demo-v1-2026-09-24`

Cette prévisualisation reste hors `main` et doit servir au test manuel smartphone avant GREEN final.


## Correction de périmètre — assets de test fournis par l'utilisateur

Le lien de prévisualisation précédent demandait de charger manuellement les images depuis le téléphone.

Ce comportement ne correspond pas au flux validé pour les deux créatures de laboratoire déjà fournies.

Décision :

- Maraileron et Braisombre doivent être découpés depuis les planches fournies ;
- leurs vues `player`, `opponent` et `icon` doivent être préparées comme assets du laboratoire ;
- la démo doit charger automatiquement les assets de laboratoire par défaut ;
- le sélecteur de fichier reste autorisé uniquement comme fonction optionnelle future pour tester une créature utilisateur externe ;
- aucun test utilisateur final du renderer ne doit être demandé tant que ces assets par défaut ne sont pas raccordés.

La prévisualisation actuelle est donc considérée comme **pré-audit technique uniquement**, pas comme version de validation utilisateur.

## Raccord assets runtime par défaut — GREEN technique

Les deux créatures de laboratoire sont désormais présentes directement dans le dépôt et chargées automatiquement par la démo :

- Maraileron côté joueur : `maraileron_player_preview.webp` ;
- Braisombre côté adversaire : `braisombre_opponent_preview.webp`.

L'import utilisateur reste disponible uniquement comme remplacement optionnel.

SHA validé :

`51a7dd14cade5b46b6e44886060e77d4865e47a1`

CI :

- run : `36052841899`
- conclusion : SUCCESS

La validation utilisateur mobile reste nécessaire avant de déclarer le chantier GREEN final.

## Checkpoint assets intégrés

Checkpoint intermédiaire GREEN créé :

`checkpoint/lab-dom-renderer-demo-v1-bundled-assets-green-2026-09-24`

SHA :

`2030deaa09d272d2d954f5cfd8972e779a2c09cc`

CI :

- run : `36052895496`
- conclusion : SUCCESS

La branche de prévisualisation pointe sur ce même SHA.

Le chantier reste en attente de validation utilisateur smartphone avant GREEN final.


## Pack runtime complet — GREEN technique

Le pack runtime léger est désormais complet pour les deux créatures de laboratoire.

Maraileron :

- `runtime/maraileron_player.webp`
- `runtime/maraileron_opponent.webp`
- `runtime/maraileron_icon.webp`

Braisombre :

- `runtime/braisombre_player.webp`
- `runtime/braisombre_opponent.webp`
- `runtime/braisombre_icon.webp`

Caractéristiques runtime :

- vues combat : 320×320 WebP transparent ;
- icônes : 192×192 WebP transparent ;
- les PNG 1024×1024 / 384×384 restent les sources maîtres hors runtime léger.

Les métadonnées `runtimePreview` pointent désormais uniquement vers ce pack `runtime/`.

Les deux anciens fichiers `*_preview.webp` ont été supprimés après bascule afin d'éviter deux sources runtime concurrentes.

SHA validé après nettoyage :

`ad92ca81a41731680ea477b70eb67a92d33162a3`

CI :

- run : `36053453627`
- conclusion : SUCCESS

Checkpoint runtime créé :

`checkpoint/lab-dom-renderer-demo-v1-runtime-pack-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-dom-renderer-demo-v1-2026-09-24`

Ces deux refs doivent pointer sur le SHA final documenté après CI du présent fichier.

Le chantier reste en attente du test utilisateur mobile avant GREEN final.

## Dernier checkpoint GREEN

`checkpoint/lab-mono-image-animation-core-green-2026-09-24`

## Règle de reprise

Ne jamais reprendre uniquement depuis un résumé de conversation.

GitHub + ce fichier + les checkpoints sont la source de vérité.
