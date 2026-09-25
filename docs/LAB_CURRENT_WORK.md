# Laboratoire Combat Dynamique — Current Work

Ce fichier est le point de reprise opérationnel du laboratoire.

## État global

Date : 2026-09-25

Phase active : Phase 2B/V6 — Mobilité d’impact, KO réel et HUD de charge lisible.

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


## Sous-lot actif — idle/scale polish

Base :

`0d435a14c7913718fdb246df4836635f4626eb59`

Checkpoint départ :

`checkpoint/lab-start-idle-scale-polish-2026-09-24`

Objectif :

- rendre la créature joueur plus grande que l'adversaire via les métadonnées de vue ;
- rendre l'idle Maraileron majoritairement vertical ;
- réduire fortement l'amplitude idle Braisombre ;
- ancrer Braisombre plus bas pour stabiliser visuellement les pieds ;
- ne pas modifier le comportement KO dans ce lot.

Propriétaires autorisés :

- metadata créature : échelle de vue + ancrage ;
- Creature Profile : amplitudes/timing idle ;
- VisualActor : contrat d'ancrage ;
- Render Adapter : application de l'ancrage.

Interdits :

- aucune règle spécifique dans le CSS de la démo ;
- aucune animation calculée dans l'UI ;
- aucun second moteur ou fallback concurrent ;
- aucun changement GenSrpG/Zombicide-40k.

Tests :

- joueur > adversaire ;
- idle serpentine vertical dominant ;
- idle drake amplitude réduite ;
- transformOrigin normalisé et appliqué par le renderer ;
- sentinelles existantes intactes.


## Résultat sous-lot idle/scale polish — GREEN technique

Corrections validées :

- créature joueur plus grande que la vue adversaire via `displayScale` des métadonnées ;
- Maraileron : idle majoritairement vertical, dérive latérale et rotation réduites ;
- Braisombre : idle fortement réduit, sans dérive horizontale ;
- Braisombre : respiration légère par déformation autour d'un ancrage bas `50% 88%` afin de stabiliser visuellement les pieds ;
- `VisualActor` possède désormais explicitement `transformOrigin` ;
- le Render Adapter applique seul cet ancrage ;
- les amplitudes de scale idle sont pilotées par le profil, plus par une constante cachée du planner ;
- comportement KO inchangé dans ce lot.

Incident de test rencontré :

- un plan orienté gauche produisait `-0` quand `swayX = 0` ;
- la cause a été corrigée dans le Core par normalisation des transformations dirigées à zéro ;
- aucun contournement UI/CSS/test n'a été ajouté.


Checkpoint GREEN du sous-lot :

`checkpoint/lab-idle-scale-polish-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-dom-renderer-demo-v1-2026-09-24`

SHA fonctionnel avant documentation finale :

`f49ac04b4bff8d9ce8c75e9438027b61249c227f`

CI :

- run : `36055509771`
- conclusion : SUCCESS


## Chantier actif — combat-distance-skills-v1

Base :

`4f6ec4dcdee52dd953c2e07a6b4f97afa6d4f396`

Checkpoint départ :

`checkpoint/lab-start-combat-distance-skills-v1-2026-09-24`

Branche :

`work/lab-combat-distance-skills-v1-2026-09-24`

Objectif :

Construire un petit moteur de test indépendant pour valider les décisions de gameplay suivantes avant toute intégration GenSrpG :

- trois bandes de distance : `short`, `medium`, `long` ;
- déplacement libre entre bandes tant que l'énergie disponible suffit ;
- coût de déplacement configurable par créature et par palier traversé ;
- énergie partagée entre mouvement et capacités ;
- compétences configurables avec catégorie fonctionnelle, forme d'action et élément indépendants ;
- coût énergie, préparation, temps de trajet, récupération et portée configurables ;
- défenses pouvant bloquer/renvoyer une forme d'action (ex. projectile) ;
- immunités pouvant cibler un élément (ex. feu) ;
- contres pouvant cibler une ou plusieurs formes d'action ;
- le moteur de combat décide du résultat ; le moteur visuel ne fait qu'afficher les événements décidés.

Architecture / propriétaires :

- `src/contracts/skill-definition.js` : contrat de compétence ;
- `src/core/combat/distance.js` : bandes et coût de déplacement ;
- `src/core/combat/combat-state.js` : état énergie/distance ;
- `src/core/combat/action-resolver.js` : validation et résolution pure des actions ;
- `data/combat/` : configurations de test modifiables ;
- `src/ui/combat-test-ui.js` : adaptateur UI du prototype, sans autorité de règles ;
- Animation Core / Render Adapter existants : uniquement événements visuels résultants ;
- FX minimal : plan visuel dérivé des événements résolus, rendu par un adaptateur DOM dédié, sans aucune autorité sur les règles.

Périmètre V1 du test :

- Maraileron : coût déplacement 1 énergie/palier ;
- Braisombre : coût déplacement 3 énergie/palier ;
- trois capacités de démonstration minimum :
  - projectile Feu offensif ;
  - défense contre projectile avec possibilité de renvoi ;
  - immunité Feu ;
- déplacement Courte/Moyenne/Longue directement testable sur mobile ;
- journal expliquant coût, refus, blocage, renvoi ou immunité.

Hors périmètre :

- IA de combat ;
- dégâts complets/statistiques finales ;
- sauvegarde GenSrpG ;
- intégration `Zombicide-40k` ;
- réseau ;
- éditeur complet de compétences ;
- FX avancés (particules, caméra, bibliothèque d'effets) ;
- seul un projectile générique minimal piloté par `skill-release` est autorisé dans ce lot pour valider visuellement la chronologie.

Contraintes :

- aucune règle distance/énergie dans le DOM ou le CSS ;
- aucune animation ne décide si une action touche ;
- aucune valeur gameplay importante codée dans un gestionnaire de bouton ;
- une seule autorité de résolution : `action-resolver` ;
- toutes les valeurs de test proviennent de données configurables.

Tests prévus :

- coût de déplacement par nombre de paliers ;
- refus si énergie insuffisante ;
- portée de compétence ;
- séparation catégorie / forme / élément ;
- blocage projectile sans immunité élémentaire ;
- immunité Feu indépendamment de la forme ;
- renvoi projectile ;
- UI sans logique de résolution ;
- vraie chaîne données -> resolver -> UI/adaptateur visuel.


## État technique du chantier combat-distance-skills-v1

Implémentation présente :

- contrat `SkillDefinition` séparant catégorie / forme / élément ;
- Combat State immutable ;
- Combat Session propriétaire unique de l'état courant ;
- bandes de distance `short / medium / long` ;
- coût de déplacement par palier et par créature ;
- énergie commune aux déplacements et capacités ;
- preview de mouvement/capacité sans effet de bord ;
- résolution de portée et énergie ;
- préparation / release / trajet / impact / récupération ;
- préparation propre des réactions ;
- contre pouvant annuler une attaque avant son release ;
- renvoi de projectile ;
- immunité élémentaire ;
- contre par forme d'action ;
- projectile générique minimal dérivé de la timeline résolue ;
- Presenter séparé reliant résolution -> événements visuels ;
- interface mobile avec jauges énergie, distance, déplacement, capacités, réaction et journal ;
- outils d'animation bruts conservés dans un panneau laboratoire séparé.

Données de test :

- Maraileron : 1 énergie par palier, régénération 8/s ;
- Braisombre : 3 énergie par palier, régénération 6/s ;
- Boule de feu : Offensive / Projectile / Feu ;
- Griffe : Offensive / Contact ;
- Bouclier miroir : renvoi Projectile ;
- Immunité feu : immunité Feu ;
- Riposte : contre Contact.

Frontières protégées :

- Combat Rules n'importe aucun moteur animation/FX/renderer/UI ;
- Animation Core ne connaît pas distance, énergie ou résultat de compétence ;
- Demo UI ne calcule pas coût, portée ou résultat ;
- le projectile n'influence jamais la résolution.

Dernier HEAD technique avant documentation de gouvernance :

`138acc941506a021a9f4a7cff5ba03caad71a522`

CI de ce HEAD :

- run : `36060087396`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN technique :

`checkpoint/lab-combat-distance-skills-v1-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-combat-distance-skills-v1-2026-09-24`

SHA pré-audit :

`f864f25057c7c850aadb8bf0d8fc0c2f193f214e`

CI :

- run : `36060350286`
- conclusion : SUCCESS

Validation restante avant GREEN final :

- test smartphone de l'interface ;
- validation utilisateur de l'intuitivité des trois distances ;
- validation visuelle Boule de feu -> hit ;
- Boule de feu -> Bouclier miroir -> renvoi ;
- Boule de feu -> Immunité feu ;
- Griffe -> Riposte -> interruption avant release ;
- vérification que les coûts de déplacement sont compréhensibles pour Maraileron et Braisombre.

Le chantier ne doit pas être déclaré GREEN final avant ce retour utilisateur.


## Chantier actif — combat-timing-ui-v2

Base GREEN de reprise :

`8dd435f5f1ed8744b2ee545d4d5e1d724f13e116`

Checkpoint départ :

`checkpoint/lab-start-combat-timing-ui-v2-2026-09-24`

Branche :

`work/lab-combat-timing-ui-v2-2026-09-24`

Retour utilisateur à corriger :

- les deux créatures doivent être en `idle` par défaut et y revenir après toute action ;
- un changement Courte / Moyenne / Longue modifie la distance logique, mais visuellement seul le combattant qui se déplace change de position ;
- augmenter l'écart visuel entre les combattants ;
- supprimer le HUD distance superposé à l'arène ;
- conserver l'arène et les capacités visibles simultanément pour permettre le timing ;
- chaque capacité doit afficher une barre de préparation visible ;
- l'énergie démarre à 0 et se recharge automatiquement par ticks configurables, exemple +1 toutes les 2 secondes ;
- la recharge d'énergie et tous ses paramètres restent configurables ;
- chaque créature possède un modificateur permanent de temps de charge en pourcentage ;
- valeur positive = temps de charge plus long ; valeur négative = temps de charge réduit ;
- des effets temporaires doivent pouvoir ajouter un modificateur de charge pendant une durée, par exemple -20 % pendant 5 secondes ;
- le système doit pouvoir accueillir plus tard un timer de combat configuré sans coupler celui-ci à l'UI.

Architecture / propriétaires V2 :

- `Combat State` : énergie, temps écoulé, progression des ticks et modificateurs temporaires ;
- `Combat Timing` : calcul pur des ticks d'énergie et des temps de préparation effectifs ;
- `Combat Session` : propriétaire unique de l'état courant ;
- `Action Runtime` : horloge d'une capacité en cours, progression de charge, fenêtre de réaction et résolution ;
- `Distance Presenter` : position visuelle individuelle des combattants, sans modifier la règle de distance ;
- `Demo Visual Controller` : idle par défaut et retour à idle ;
- `Combat Test UI` : affichage uniquement, aucune formule gameplay.

Contraintes :

- aucun `setInterval` sans propriétaire et `dispose()` explicite ;
- aucune régénération d'énergie calculée dans l'UI ;
- aucune durée effective calculée dans l'UI ;
- aucun déplacement simultané des deux sprites pour représenter une action d'un seul combattant ;
- aucun CSS basé sur la distance logique qui déplace automatiquement les deux combattants ;
- Animation Core ne devient pas horloge de combat ;
- le runtime de combat ne calcule aucune animation ;
- tous les paramètres restent pilotés par les données.

Tests V2 :

- énergie initiale 0 ;
- tick +1/2000 ms configurable ;
- accumulation déterministe des ticks ;
- modificateur permanent +X/-X % du temps de préparation ;
- modificateur temporaire avec expiration ;
- résolution utilisant le temps de préparation effectif ;
- runtime de charge annulable et nettoyable ;
- seul le combattant ayant bougé reçoit un changement de position visuelle ;
- idle lancé par défaut et restauré après action ;
- interface mobile sans HUD distance superposé ;
- arène + capacités visibles ensemble ;
- barre de charge présente pour chaque capacité.


## État technique — combat-timing-ui-v2

Corrections implémentées :

- les deux créatures démarrent en idle et reviennent en idle après une animation transitoire ;
- le déplacement logique reste Courte / Moyenne / Longue ;
- le Render Adapter de distance déplace uniquement le combattant qui effectue l'action ;
- l'écart visuel initial entre les combattants a été augmenté ;
- le HUD distance superposé à l'arène a été supprimé ;
- l'arène, les jauges, le déplacement et les capacités sont réunis dans un écran combat compact ;
- chaque capacité offensive et chaque réaction possède une barre de charge visible ;
- l'énergie démarre à 0 ;
- données de test : +1 énergie toutes les 2 secondes, réserve maximale 10 ;
- Maraileron : 1 énergie par palier ;
- Braisombre : 3 énergies par palier ;
- Boule de feu coûte 3, Griffe 2, réactions 2 ;
- Combat Runtime propriétaire unique du temps actif, avec timer nettoyé par `dispose()` ;
- les ticks d'énergie sont déterministes et conservent la progression partielle ;
- `chargeTimeModifierPct` est configurable par créature ;
- +X % augmente le temps de préparation, -X % le réduit ;
- les effets temporaires de temps de charge sont pris en charge avec expiration ;
- le calcul de temps effectif appartient à `Combat Timing`, jamais à l'UI ;
- les réactions peuvent maintenant être déclenchées pendant l'action en cours ;
- un contre assez rapide peut toujours interrompre avant release ;
- le Presenter sépare désormais release visuel et résultat final pour suivre le runtime réel.

Réglages de rythme du test :

- Boule de feu : charge 1,8 s + trajet 0,7 s ;
- Griffe : charge 1,2 s ;
- Bouclier miroir : réaction 0,5 s ;
- Immunité feu : réaction 0,3 s ;
- Riposte : réaction 0,4 s.

Ces valeurs sont des données de laboratoire et ne constituent pas des constantes GenSrpG.

Sentinelles ajoutées :

- énergie initiale zéro ;
- tick configurable +1 / 2000 ms ;
- modificateur permanent +X/-X % ;
- modificateur temporaire + expiration ;
- runtime réel + nettoyage timer ;
- contre live avant release ;
- un seul sprite déplacé ;
- idle par défaut ;
- absence de sélecteur HUD distance superposé ;
- arène + capacités dans le même écran ;
- barre de charge sur toutes les capacités.

Dernier HEAD fonctionnel avant clôture documentaire :

`f561f4cd7fc97e10ca79860cf5d47be1e945e3e3`

CI :

- run : `36063415254`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN V2 :

`checkpoint/lab-combat-timing-ui-v2-preaudit-green-2026-09-24`

Branche de prévisualisation V2 :

`preview/lab-combat-timing-ui-v2-2026-09-24`

SHA pré-audit avant synchronisation finale du présent document :

`a987040b38b4e12b8a68e66e9288c910cb639657`

CI :

- run : `36063563535`
- conclusion : SUCCESS

Validation restante :

- test smartphone réel de la compacité de l'écran ;
- vérifier que l'arène reste visible pendant toute décision ;
- vérifier le ressenti du +1 énergie / 2 s ;
- vérifier le déplacement individuel Maraileron puis Braisombre ;
- vérifier les barres de charge offensive et réaction ;
- vérifier Boule de feu / renvoi / immunité ;
- vérifier Griffe / Riposte.

Le chantier reste pré-audit jusqu'au retour utilisateur.


## Sous-lot actif — combat-visibility-chargebar-polish-v2

Base :

`f0cda9e5b68d9f4208e76ee43de435cfe6281f59`

Checkpoint départ :

`checkpoint/lab-start-combat-visibility-chargebar-polish-v2-2026-09-24`

Branche :

`work/lab-combat-visibility-chargebar-polish-v2-2026-09-24`

Objectif :

- éviter que les créatures sortent visuellement de l'arène à longue portée ;
- réduire légèrement leur taille générale à l'écran ;
- permettre au Render Adapter de distance d'ajuster aussi légèrement le scale visuel selon Courte / Moyenne / Longue, sans modifier le scale métier de l'acteur ;
- déplacer les réglages de laboratoire et le choix de la créature à déplacer hors de la zone principale de combat ;
- garder l'interface principale proche du rendu réel joueur ;
- afficher une barre de charge principale sous le nom de la créature qui lance une capacité ;
- cette barre doit suivre exclusivement la progression fournie par Combat Runtime ;
- au clic Boule de feu : barre 0 -> 100 % pendant la préparation, puis disparition/reset au release ;
- même principe pour une réaction de Braisombre.

Propriétaires autorisés :

- `DOM Distance Presenter` : position et scale de scène selon distance ;
- `Demo UI` : emplacement des contrôles de test et affichage de progression ;
- `Demo CSS/HTML` : composition visuelle ;
- `Combat Runtime` reste source unique de progression.

Interdits :

- aucune durée de charge codée en CSS/HTML ;
- aucune seconde barre avec sa propre horloge ;
- aucune modification du calcul de coût/portée ;
- aucun déplacement simultané automatique des deux combattants ;
- aucun changement dans Animation Core pour compenser un problème de layout ;
- aucun changement GenSrpG principal.

Tests :

- long reste dans les bornes visuelles ;
- seul le combattant déplacé change position/scale ;
- scale court > moyen > long de façon légère et déclarative ;
- aucun contrôle de test principal superposé à l'arène ;
- barre de charge principale présente sous chaque nom ;
- barre alimentée par `progress.chargeProgress` / réaction runtime ;
- reset de la barre après release/résolution/reset ;
- CI et sentinelles existantes vertes.

Critère de fin :

pré-audit GREEN technique + test smartphone utilisateur.


## Résultat technique — combat-visibility-chargebar-polish-v2

Corrections présentes :

- taille visuelle générale légèrement réduite ;
- positions de longue portée bornées entre 14 % et 86 % du centre de l'arène ;
- projection visuelle distance centralisée dans `DOM Distance Presenter` ;
- scale de scène : Courte 1,00 / Moyenne 0,96 / Longue 0,90 ;
- seul le combattant qui paie le déplacement change de position et de scale ;
- positions reset : joueur 23 % / adversaire 77 % ;
- sélecteur de créature à déplacer sorti de l'interface principale ;
- reset sorti de l'interface principale ;
- ces contrôles sont regroupés plus bas dans `Réglages du test` ;
- arène, énergie, déplacement et capacités restent dans l'écran principal ;
- nouvelle barre de charge principale sous le nom de Maraileron ;
- nouvelle barre de réaction principale sous le nom de Braisombre ;
- ces barres consomment uniquement `Combat Runtime progress` ;
- aucune horloge CSS ou UI parallèle n'a été créée ;
- la barre Maraileron se remplit pendant la préparation puis se remet à zéro au release ;
- la barre Braisombre reflète la préparation de la réaction ;
- reset/résolution nettoient toutes les barres ;
- Boule de feu réglée à 2000 ms de préparation pour le test demandé.

Tests ajoutés / renforcés :

- long reste dans les bornes de scène ;
- scale court > moyen > long avec amplitude légère ;
- combattant stationnaire conserve position et scale ;
- réglages de test situés après le dock principal ;
- barres principales sous les noms présentes ;
- raccord `progress.chargeProgress` et `progress.reaction.progress` vérifié ;
- CSS n'invente aucune distance partagée ;
- CI complète verte.

HEAD fonctionnel avant documentation finale :

`b91954b10a146007ae862740aea57fc4e9a61eed`

CI :

- run : `36064955000`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN du sous-lot :

`checkpoint/lab-combat-visibility-chargebar-polish-v2-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-combat-visibility-chargebar-polish-v2-2026-09-24`

SHA technique documenté :

`8e266cf2f146d3c5d2e63614e4648147e9b21ee6`

CI :

- run : `36065018526`
- conclusion : SUCCESS

Validation restante :

- smartphone : vérifier que les créatures ne sortent plus en Longue ;
- vérifier que la réduction de taille reste légère ;
- vérifier le rendu du scale Courte / Moyenne / Longue ;
- vérifier que les réglages de test plus bas donnent une interface principale crédible ;
- lancer Boule de feu et observer la barre sous Maraileron pendant 2 s puis le projectile ;
- lancer une réaction et observer la barre sous Braisombre.

Le sous-lot reste pré-audit jusqu'au retour utilisateur.


## Sous-lot actif — player-distance-hpbar-polish-v2

Base :

`fefab76a531d07a47d863ce6e6989750f939b869`

Checkpoint départ :

`checkpoint/lab-start-player-distance-hpbar-polish-v2-2026-09-24`

Branche :

`work/lab-player-distance-hpbar-polish-v2-2026-09-24`

Retour utilisateur ciblé :

- le déplacement du joueur doit être sans ambiguïté :
  - vers Courte = rapprochement visuel vers le centre ;
  - vers Longue = éloignement visuel vers l'extérieur ;
- le rapprochement joueur doit aller légèrement plus vers le centre ;
- l'éloignement doit rester assez contenu pour que le bandeau nom / PV / charge ne sorte pas de l'arène ;
- ajouter une barre de PV sous le nom des deux créatures ;
- la barre de PV doit provenir du Combat State et non d'une valeur décorative du HTML.

Choix d'architecture :

- `DOM Distance Presenter` n'infère plus la position depuis la position courante de l'adversaire ;
- il applique un delta signé à partir de la transition sémantique `from -> to` :
  - côté joueur : distance plus courte => x augmente ; distance plus longue => x diminue ;
  - côté adversaire : inverse ;
- la projection reste bornée dans l'arène ;
- le scale visuel continue d'être piloté par la distance cible ;
- `Combat State` devient propriétaire de `hp / maxHp` ;
- Demo UI ne fait qu'afficher le snapshot HP.

Tests prévus :

- joueur Moyenne -> Courte se déplace vers le centre ;
- joueur Moyenne -> Longue se déplace vers l'extérieur ;
- adversaire conserve la convention symétrique ;
- seul le combattant déplacé change de position/scale ;
- bornes de scène respectées ;
- HP initial normalisé depuis les données ;
- HP borné entre 0 et maxHp ;
- barres PV présentes sous le nom ;
- UI alimentée par `state.fighters[id].hp/maxHp` ;
- CI et sentinelles existantes vertes.


## Résultat technique — player-distance-hpbar-polish-v2

Corrections :

- le déplacement visuel n'est plus recalculé relativement à la position de l'autre combattant ;
- il dérive directement de la transition sémantique `from -> to` ;
- joueur Moyenne -> Courte : déplacement vers le centre ;
- joueur Moyenne -> Longue : déplacement vers l'extérieur ;
- adversaire : convention symétrique ;
- pas de déplacement du combattant stationnaire ;
- bornes renforcées : 20 % / 80 % ;
- reset visuel : joueur 28 % / adversaire 72 % ;
- pas visuel : 10 % de largeur d'arène par palier ;
- scale scène conservé : Courte 1,00 / Moyenne 0,96 / Longue 0,90 ;
- `Combat State` porte maintenant `hp / maxHp` ;
- données test : 100 / 100 PV pour les deux créatures ;
- `withFighterHp()` borne les PV entre 0 et maxHp ;
- Runtime inclut HP dans son signal d'état ;
- barre PV ajoutée sous le nom de chaque créature, avant la barre de charge ;
- la barre PV lit uniquement le snapshot `state.fighters[id]` ;
- aucun système de dégâts n'a été inventé dans ce lot.

Tests :

- direction joueur Courte/Longue explicitement protégée ;
- transition deux bandes protégée ;
- symétrie adversaire protégée ;
- bornes de scène protégées ;
- HP initial, max et clamp protégés ;
- barres PV et raccord UI état -> PV protégés ;
- CI complète verte.

HEAD fonctionnel avant documentation finale :

`fcee96f341a869432904d727f25c70447a5445a4`

CI :

- run : `36066616228`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN du sous-lot :

`checkpoint/lab-player-distance-hpbar-polish-v2-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-player-distance-hpbar-polish-v2-2026-09-24`

SHA technique documenté avant synchronisation finale :

`b8aacc6b9cfa05bb0397b1d4b71f8f4d72f17f76`

CI :

- run : `36066676259`
- conclusion : SUCCESS

Validation restante :

- smartphone : confirmer que Courte rapproche bien Maraileron vers le centre ;
- confirmer que Longue l'éloigne sans faire sortir son bandeau ;
- vérifier lisibilité Nom -> PV -> Charge ;
- confirmer que la nouvelle marge de scène est suffisante.

Le sous-lot reste pré-audit jusqu'au retour utilisateur.


## Sous-lot actif — distance-z-hp-resolution-v2

Base :

`987bb0f523bed310753763a5f6f67c681396b524`

Checkpoint départ :

`checkpoint/lab-start-distance-z-hp-resolution-v2-2026-09-24`

Branche :

`work/lab-distance-z-hp-resolution-v2-2026-09-24`

Objectif :

1. corriger définitivement la perception Courte/Moyenne/Longue du joueur ;
2. garantir que le joueur passe visuellement devant l'adversaire lorsque leurs silhouettes se chevauchent ;
3. raccorder les dégâts déjà portés par les capacités aux PV du Combat State ;
4. ne démarrer le lot Objets / Rappel / Invocation / Stun qu'après GREEN technique de ces trois corrections.

Diagnostic / choix :

- la distance logique est relative entre les deux combattants ; une projection incrémentale du seul acteur peut dériver si l'autre a déjà bougé ;
- le Render Adapter recalculera donc la position cible du combattant mobile à partir de la position du combattant stationnaire + une séparation explicite par bande ;
- convention visuelle :
  - Courte = séparation minimale ;
  - Moyenne = séparation intermédiaire ;
  - Longue = séparation maximale ;
- le joueur reste à gauche et l'adversaire à droite ;
- `player z-index > opponent z-index` appartient au layout/rendering, pas aux règles de combat ;
- les dégâts sont déjà définis dans `skill.effect.damage` et les événements `hit` existent ; le raccord manquant est la mutation HP dans `Action Resolver` ;
- `resolveSkillCompletion` reste l'unique propriétaire de l'application du résultat sémantique sur le Combat State.

Interdits :

- aucun correctif de direction dans les boutons UI ;
- aucun échange de labels Courte/Longue ;
- aucun calcul de dégâts dans le Presenter ou l'UI ;
- aucune animation utilisée comme source de dégâts ;
- aucun deuxième état HP ;
- aucun ajout Objets/Rappel/Invocation avant CI GREEN de ce lot.

Tests :

- joueur à gauche : Courte plus proche du centre que Moyenne, Moyenne plus proche que Longue ;
- adversaire symétrique ;
- seul le combattant mobile change ;
- relation de séparation réelle Courte < Moyenne < Longue ;
- z-index joueur > adversaire ;
- hit retire `skill.effect.damage` à la cible ;
- reflected retire les dégâts à l'attaquant ;
- blocked / immune / countered ne retirent pas de PV ;
- PV clampés à zéro ;
- preview de compétence ne doit pas muter l'état de session ;
- completion live doit réellement committer les PV dans Combat Session.


## Résultat technique — distance-z-hp-resolution-v2

Corrections validées techniquement :

- la projection incrémentale précédente a été supprimée ;
- position cible calculée depuis le combattant stationnaire ;
- séparations explicites : Courte 0,30 / Moyenne 0,44 / Longue 0,56 ;
- joueur : Courte vers le centre, Longue vers l'extérieur ;
- adversaire : comportement symétrique ;
- un seul combattant bouge visuellement ;
- positions canonisées pour éviter les dérives flottantes ;
- bornes d'arène conservées ;
- joueur `z-index: 4`, adversaire `z-index: 3` ;
- `Action Resolver` applique désormais `skill.effect.damage` aux PV ;
- hit : cible perd les PV ;
- reflected : attaquant perd les PV ;
- blocked / immune / countered : aucun dégât de l'attaque annulée ;
- `Combat Session.completeSkill()` commit les PV lors d'une résolution live ;
- les barres PV existantes reçoivent donc maintenant l'état réellement modifié.

Sentinelles :

- Courte < Moyenne < Longue en séparation réelle ;
- symétrie adversaire ;
- seul le combattant mobile change position/scale ;
- joueur au-dessus de l'adversaire ;
- dégâts hit ;
- dégâts reflected ;
- immunité / contre sans dégâts ;
- clamp PV à zéro ;
- preview sans mutation de session ;
- completion live commit HP.

HEAD fonctionnel avant documentation :

`d87cbe84ceec5bfb3a1f4756e39adf8db56a857b`

CI :

- run : `36067840558`
- conclusion : SUCCESS

Checkpoint pré-audit GREEN :

`checkpoint/lab-distance-z-hp-resolution-v2-preaudit-green-2026-09-24`

Branche de prévisualisation :

`preview/lab-distance-z-hp-resolution-v2-2026-09-24`

SHA technique :

`a02d8560a655b82adaf984eccee4b5d146b2ae02`

CI :

- run : `36067913906`
- conclusion : SUCCESS

Ce lot peut servir de base au chantier suivant Objets / Rappel / Invocation / interruption par Stun.


## Correctif ciblé — distance-anchor-fix — GREEN technique

Base :

`0df6d3bcfc94cf11abf05824a273b91c6287756a`

Checkpoint départ :

`checkpoint/lab-start-distance-anchor-fix-2026-09-25`

Décision :

La projection relative au combattant stationnaire est supprimée pour l'affichage des bandes de distance.

Le Render Adapter possède désormais des ancres explicites par côté et par bande :

- joueur : Longue 18 % / Moyenne 28 % / Courte 42 % ;
- adversaire : Courte 58 % / Moyenne 72 % / Longue 82 % ;
- scale : Courte 1,00 / Moyenne 0,96 / Longue 0,90.

Un déplacement ne modifie toujours que le combattant qui agit.

Cette projection est volontairement indépendante de l'état visuel précédent : cliquer Longue donne toujours l'ancre Longue du joueur, cliquer Courte donne toujours l'ancre Courte.

Tests :

- ordre joueur `Longue < Moyenne < Courte` ;
- ordre adversaire symétrique ;
- combattant stationnaire inchangé ;
- reset Moyenne ;
- sentinelle d'architecture adaptée.

HEAD technique :

`d8bf6d1c30a8e43910ec44c64d8a990fae76480f`

CI :

- run : `36070381590`
- conclusion : SUCCESS


## Chantier actif — combat-commands-evasion-v3

Base GREEN :

`6556827221cd79b9401a27ae2b01ec5cf391b4b4`

Checkpoint départ :

`checkpoint/lab-start-combat-commands-evasion-v3-2026-09-25`

Branche :

`work/lab-combat-commands-evasion-v3-2026-09-25`

Objectifs :

1. verrouiller la règle d'impact :
   - aucun dégât au clic ;
   - aucun dégât pendant la préparation ;
   - aucun dégât au release tant que la cible n'est pas touchée ;
   - dégâts uniquement à `impactAtMs` ;
2. rendre le mode d'approche indépendant de la forme de compétence :
   - `none` ;
   - `ground` ;
   - `aerial` ;
   - `teleport` ;
3. préparer les esquives en fonction de la forme et/ou du mode d'approche ;
4. permettre plus tard à une attaque Stun qui touche avant le release d'interrompre une action en charge ;
5. ajouter ensuite les commandes de combat :
   - Objet ;
   - Rappel ;
   - Invocation ;
   avec coût énergie + préparation + interruption possible.

Architecture :

- `form` décrit ce qui touche : contact / projectile / beam / area / etc. ;
- `approachMode` décrit comment l'action atteint sa cible : none / ground / aerial / teleport ;
- `travelMs` reste l'autorité sur le temps release -> impact ;
- `Combat Runtime` reste l'unique horloge ;
- `Action Resolver` reste l'unique propriétaire des dégâts à l'impact ;
- l'UI ne déduit jamais si une esquive ou interruption réussit.

Exemples :

- Boule de feu = projectile + none ;
- Griffe = contact + ground ;
- Plongeon = contact + aerial ;
- Frappe éclair = contact + teleport.

Règle temporelle :

`préparation -> release -> trajet/approche -> impact -> dégâts -> récupération`

Une esquive doit être prête au plus tard avant `impactAtMs`.

Une attaque qui produit un Stun n'interrompt une charge que si son propre impact arrive avant le release de l'action ciblée.

Tests obligatoires :

- projectile : HP inchangés à release, changés à impact ;
- contact : HP inchangés juste avant impact, changés à impact ;
- approche aerial/teleport normalisée par contrat ;
- aucune confusion entre `form` et `approachMode` ;
- esquive calculée contre forme et/ou approche ;
- aucun calcul de dégâts dans UI/Presenter/FX ;
- avant ajout des commandes Objet/Rappel/Invocation, CI GREEN de ce socle.


## Résultat intermédiaire — impact-evasion-foundation-v3

Socle validé techniquement :

- `SkillDefinition` possède maintenant `approachMode` ;
- valeurs autorisées : none / ground / aerial / teleport ;
- `form` et `approachMode` restent deux axes indépendants ;
- réactions : `evadeForms` et `evadeApproaches` ;
- nouveau résultat sémantique : `evaded` ;
- Boule de feu explicitement `projectile + none` ;
- Griffe explicitement `contact + ground` ;
- prototype `Plongeon aérien` ;
- prototype `Frappe téléportée` ;
- prototype `Esquive` ;
- release et impact exposent le mode d'approche ;
- dégâts live verrouillés à `impactAtMs`.

Sentinelles temporelles :

- projectile : HP inchangés à 1999 ms ;
- release à 2000 ms : HP toujours inchangés ;
- 2699 ms : HP toujours inchangés ;
- impact 2700 ms : dégâts appliqués ;
- contact : HP inchangés juste avant l'impact ;
- contact : dégâts appliqués à l'instant impact ;
- une esquive lente peut réussir contre une approche aérienne longue et échouer contre une téléportation courte.

HEAD technique avant documentation :

`baeb98bacf813b32e92edff7e01da9b55dcefd0e`

CI :

- run : `36070860128`
- conclusion : SUCCESS

Le lot suivant peut maintenant construire Objet / Rappel / Invocation / Stun sur cette chronologie sans modifier l'autorité des dégâts.


## Sous-lot actif — combat-commands-stun-v3

Base :

`f204b6193e1addb46d6787a28b9c5911a8af53ba`

Checkpoint départ :

`checkpoint/lab-start-combat-commands-stun-v3-2026-09-25`

Branche :

`work/lab-combat-commands-stun-v3-2026-09-25`

Objectif :

- ajouter trois commandes de combat séparées des compétences :
  - Objet ;
  - Rappel ;
  - Invocation ;
- chaque commande possède coût énergie, préparation, récupération et interruptibilité configurables ;
- partager le même Combat Runtime de charge que les compétences ;
- permettre à un impact sémantique de type Stun d'interrompre une action encore en préparation ;
- ne jamais interrompre une action déjà release ;
- conserver le Stun de validation dans les outils de test, pas dans l'interface joueur principale.

Propriétaires :

- `CombatCommandDefinition` : contrat des commandes ;
- `Command Resolver` : coût, préparation et résultat de commande ;
- `Combat Session` : commit de l'état ;
- `Combat Runtime` : progression et interruption de la charge ;
- `Action Resolver` : produit `charge-interrupt` uniquement lorsqu'une compétence Stun touche réellement ;
- Demo UI : boutons et lecture de progression uniquement.

Données laboratoire :

- Objet : 1 énergie, 0,7 s de charge, potion test +20 PV ;
- Rappel : 2 énergies, 1,4 s de charge ;
- Invocation : 3 énergies, 2,2 s de charge ;
- Impact étourdissant : projectile, 0,5 s de préparation + 0,35 s de trajet, 5 dégâts, effet Stun.

Invariants :

- l'énergie d'une commande est dépensée au démarrage ;
- l'effet de la commande n'est appliqué qu'à sa completion ;
- toute commande est interruptible pendant sa préparation sauf configuration contraire ;
- un Stun n'existe comme interruption qu'après son propre impact ;
- `interruptActive()` refuse l'interruption si la cible n'est pas l'acteur actif, si l'action n'est pas interruptible ou si le release est déjà atteint ;
- Objet/Rappel/Invocation ne sont jamais modélisés comme de fausses compétences.

Tests exigés :

- contrat des trois commandes ;
- énergie insuffisante ;
- potion soigne uniquement à completion ;
- Rappel/Invocation produisent leurs événements sémantiques ;
- charge commandée via Combat Runtime ;
- interruption avant release ;
- refus après release ;
- `charge-interrupt` émis à l'impact du Stun, pas au start/release ;
- structure CI exige les nouveaux contrats/resolvers/données/tests ;
- UI principale expose Objet/Rappel/Invocation ;
- outil Stun de validation uniquement dans Réglages du test.


## Résultat technique — combat-commands-stun-v3

Implémentation présente :

- contrat `CombatCommandDefinition` séparé du contrat de compétence ;
- types : Item / Rappel / Invocation ;
- `Command Resolver` indépendant de l'UI et du renderer ;
- commandes partageant le Combat Runtime de charge ;
- coût énergie configurable ;
- préparation configurable ;
- récupération configurable ;
- interruptibilité pendant la préparation configurable ;
- Item laboratoire : +20 PV uniquement à completion ;
- Rappel laboratoire : événement sémantique de completion ;
- Invocation laboratoire : événement sémantique avec `summonCreatureId` ;
- boutons Objet / Rappel / Invocation visibles dans l'interface principale ;
- progression de commande raccordée à la barre de charge principale ;
- Stun prototype : 500 ms préparation + 350 ms trajet ;
- `charge-interrupt` produit uniquement à l'impact 850 ms ;
- Runtime refuse l'interruption si le release de la cible est déjà atteint ;
- contrôle `Simuler impact Stun` placé uniquement dans Réglages du test ;
- fichiers V3 rendus obligatoires par la sentinelle de structure.

Frontières conservées :

- UI ne calcule ni coût, ni durée, ni interruption ;
- Command Resolver ne dépend ni de l'animation ni du DOM ;
- Action Resolver décide si un Stun a réellement touché ;
- Combat Runtime décide si l'action active est encore interruptible ;
- Rappel/Invocation ne sont pas de fausses compétences ;
- le vrai changement de roster/asset lors d'un Rappel/Invocation reste hors de ce lot.

Tests ajoutés :

- contrat Item/Rappel/Invocation ;
- coût énergie ;
- soin uniquement à completion ;
- événements Rappel/Invocation ;
- progression runtime d'une commande ;
- interruption avant release ;
- refus après release ;
- Stun : interruption émise exactement à l'impact ;
- résolution sémantique Stun -> interruption de la commande en charge ;
- UI principale commandes / panneau test Stun séparés ;
- absence de valeurs de timing de commande codées dans l'UI.

HEAD fonctionnel avant documentation finale :

`2da10b2960449368d59875aa7c8a242dd69fa9a1`

CI de ce HEAD :

- run : `36072367866`
- conclusion : SUCCESS

Checkpoint GREEN :

`checkpoint/lab-combat-commands-stun-v3-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-combat-commands-stun-v3-2026-09-25`

SHA GREEN avant synchronisation finale du présent document :

`c99f9010df2389dce17f46ac7a713cb97b5902ab`

CI :

- run : `36072510231`
- conclusion : SUCCESS

Checkpoint GREEN prévu :

`checkpoint/lab-player-ui-ko-special-moves-v5-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-player-ui-ko-special-moves-v5-2026-09-25`

SHA technique avant synchronisation finale :

`84220f111c37feb666641e6b65706606896d83e7`

CI :

- run : `36102503071`
- conclusion : SUCCESS

Validation utilisateur restante :

- smartphone : visibilité des trois boutons tactiques ;
- vérifier les coûts et barres de charge ;
- Objet doit soigner uniquement à la fin de sa charge ;
- Rappel/Invocation doivent terminer leur charge et produire le journal ;
- pendant une charge Rappel/Invocation, `Simuler impact Stun` doit l'annuler ;
- après release, la même interruption doit être refusée ;
- confirmer le rythme avant d'engager le vrai roster de réserve.


## Chantier actif — player-ui-roster-v4

Base GREEN :

`6e9227a6b3e24519cba00782d7653cb215b74b63`

Checkpoint départ :

`checkpoint/lab-start-player-ui-roster-v4-2026-09-25`

Branche :

`work/lab-player-ui-roster-v4-2026-09-25`

Objectif utilisateur :

- remplacer la démo laboratoire par une vue de partie propre ;
- ne laisser à l'écran que les contrôles du joueur ;
- regrouper les capacités et actions dans des menus déroulants compacts ;
- retirer Réglages du test, simulateur Stun, contrôles Idle/Hit/KO/import/intensité ;
- créer deux équipes de deux créatures :
  - joueur : Marai + Drakon ;
  - adversaire : Drakon + Marai ;
- afficher la réserve des deux équipes ;
- rendre Rappel / Invocation réellement testables :
  - Rappel range la créature active dans la réserve ;
  - Invocation fait entrer la créature de réserve sélectionnée ;
  - PV / énergie de chaque membre sont conservés entre les changements ;
  - le visuel et le profil changent réellement dans l'arène ;
- conserver coût énergie + charge + interruption des commandes déjà validés.

Architecture / propriétaires :

- `Roster Session` : équipe, membre actif, réserve, snapshots persistants de chaque membre ;
- `Combat Session` : état des deux slots actuellement engagés ;
- `Roster Session` est le seul propriétaire du swap membre <-> slot combat ;
- `Demo Visual Controller` expose uniquement un changement de créature d'un slot ;
- `Combat Test UI` déclenche les commandes et affiche le roster, sans muter directement les stats ;
- `Combat Runtime` conserve l'autorité du timing Rappel/Invocation.

Modèle de scène :

- slots combat fixes : `player` et `opponent` ;
- membres roster uniques :
  - `player-marai`, `player-drakon` ;
  - `opponent-drakon`, `opponent-marai` ;
- les données espèce Maraileron/Braisombre sont clonées vers le slot combat actif au moment de l'invocation ;
- à un Rappel, le snapshot du slot est sauvegardé dans le membre avant de vider le slot ;
- à une Invocation, le snapshot du membre sélectionné devient le nouveau fighter du slot.

UI autorisée :

- arène ;
- bandeaux Nom / PV / Charge ;
- réserve joueur et réserve adversaire ;
- énergie joueur ;
- déplacement Courte/Moyenne/Longue ;
- menu Capacités ;
- menu Objets ;
- menu Équipe (Rappel / Invocation) ;
- statut court de combat.

UI supprimée :

- Réglages du test ;
- simulateur Stun ;
- Outils visuels laboratoire ;
- contrôle manuel de l'adversaire ;
- journal technique détaillé ;
- sélecteur de créature déplacée ;
- boutons Idle/Attaque/Hit/KO/Stop ;
- import fichiers/intensité.

Tests :

- roster 2v2 initial correct ;
- Rappel sauvegarde HP/énergie et vide le slot joueur ;
- Invocation restaure le membre choisi et ses stats ;
- swap visuel utilise la vue player/opponent correcte ;
- adversaire reste non contrôlable depuis l'UI ;
- menus joueur présents ;
- aucun contrôle laboratoire restant dans le HTML ;
- capacités ne sont plus toutes affichées simultanément ;
- commands conservent leur vrai runtime de charge ;
- sentinelles combat/impact/stun existantes restent vertes.

Hors périmètre :

- IA adversaire ;
- choix automatisé de réaction adverse ;
- KO avec remplacement forcé ;
- animations spécifiques de rappel/invocation ;
- roster GenSrpG réel ;
- modification du dépôt Zombicide-40k.

Critère de fin :

CI verte + checkpoint GREEN + preview smartphone permettant de jouer Marai/Drakon contre Drakon/Marai avec Rappel/Invocation réels.


## Résultat technique — player-ui-roster-v4

Implémentation présente :

- vue laboratoire remplacée par une vue de partie propre ;
- aucun Réglages du test / simulateur Stun / Idle-Hit-KO / import / intensité dans l'écran utilisateur ;
- seuls les contrôles joueur restent visibles ;
- menus déroulants :
  - Capacités ;
  - Objets ;
  - Équipe ;
- réserve joueur visible ;
- réserve adverse visible mais non contrôlable ;
- roster 2v2 :
  - joueur : Marai + Drakon ;
  - adversaire : Drakon + Marai ;
- nouveau `Roster Session` propriétaire unique de actif/réserve ;
- slots combat stables : `player` / `opponent` ;
- `Combat Session.replaceFighter()` remplace proprement le fighter d'un slot ;
- chaque membre conserve son snapshot PV/énergie ;
- Rappel sauvegarde le membre actif puis vide le slot visuel joueur ;
- Invocation utilise le membre de réserve sélectionné et remplace réellement :
  - stats du slot ;
  - asset ;
  - profil ;
  - nom affiché ;
- le membre rappelé redevient ensuite disponible en réserve ;
- le joueur peut sélectionner sa réserve via les cartes de réserve ;
- l'adversaire ne possède aucun bouton d'action ;
- coût énergie + charge + interruption des commandes conservés ;
- la fausse cible `reserve-creature-test` a été supprimée : la cible d'invocation appartient maintenant au Roster Session ;
- listener de réserve délégué sur un seul conteneur pour éviter les accumulations lors des rerenders.

Frontières conservées :

- UI ne copie aucune stat de membre ;
- Roster Session ne connaît ni DOM ni animation ;
- Visual Controller change seulement le visuel du slot demandé ;
- Combat Runtime reste l'autorité temporelle Rappel/Invocation ;
- Command Resolver reste propriétaire coût/charge/completion ;
- Combat Session reste propriétaire des fighters actuellement engagés.

Tests ajoutés / réécrits :

- roster initial Marai/Drakon vs Drakon/Marai ;
- un reserve par équipe au départ ;
- Rappel conserve HP/énergie ;
- Invocation sélectionnée remplace le slot joueur ;
- réinvocation d'un membre restaure son snapshot ;
- opérations joueur ne mutent pas l'adversaire ;
- command-complete recall/summon délègue au Roster Session ;
- structure exige core/data/tests roster ;
- aucun contrôle laboratoire restant dans le HTML ;
- trois menus déroulants présents ;
- aucun contrôle direct adversaire ;
- vrai raccord `Roster -> Combat slot -> visuel` protégé ;
- sentinelles Animation / Distance / Impact / Commands existantes conservées.

Dernier HEAD fonctionnel avant documentation de clôture :

`34e80fe3240a4b07c23bd48ebec38bacc9931b9e`

CI de ce HEAD :

- run : `36078895649`
- conclusion : SUCCESS

Checkpoint GREEN V4 :

`checkpoint/lab-player-ui-roster-v4-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-player-ui-roster-v4-2026-09-25`

SHA GREEN avant synchronisation finale du présent document :

`1a18c110614a3631d97f6e42ccf266d69163deb1`

CI :

- run : `36078999667`
- conclusion : SUCCESS

Validation utilisateur restante :

- smartphone : vérifier lisibilité globale sans panneaux laboratoire ;
- ouvrir/fermer les trois menus ;
- vérifier que les capacités ne prennent plus tout l'écran ;
- sélectionner Drakon en réserve ;
- lancer Rappel et attendre la fin de charge ;
- vérifier disparition de Marai ;
- lancer Invocation et attendre la fin de charge ;
- vérifier entrée réelle de Drakon avec son visuel ;
- rappeler Drakon puis réinvoquer Marai ;
- vérifier persistance des PV/énergie ;
- vérifier que la réserve adverse reste seulement informative.


## Chantier actif — player-ui-ko-special-moves-v5

Base GREEN :

`a09ea4d5b60e6bad3881f2b2e83e2ce880a3e648`

Checkpoint départ :

`checkpoint/lab-start-player-ui-ko-special-moves-v5-2026-09-25`

Branche :

`work/lab-player-ui-ko-special-moves-v5-2026-09-25`

Objectifs :

- remplacer le menu déroulant Capacités par des boutons directs, adaptés à un jeu de réflexe ;
- conserver Objets / Équipe compacts si nécessaire, mais ne pas cacher les attaques principales ;
- augmenter légèrement la hauteur de l'arène de combat ;
- lorsqu'un adversaire tombe à 0 PV :
  - sauvegarder son snapshot roster ;
  - passer automatiquement au membre de réserve adverse disponible ;
  - remplacer réellement stats + visuel + nom du slot adversaire ;
  - ne donner aucun contrôle joueur sur ce choix ;
- ajouter deux mouvements visuels spécialisés :
  - `teleport-attack` : disparition -> réapparition sur la cible -> disparition -> retour au point de départ ;
  - `aerial-attack` : montée -> disparition -> piqué sur la cible -> retour ;
- ces mouvements sont déclenchés depuis `approachMode`, sans changer les règles de dégâts ;
- les dégâts restent appliqués uniquement par Combat Rules au timestamp d'impact ;
- l'animation peut finir après l'impact sans retarder artificiellement les dégâts.

Propriétaires :

- UI : composition des boutons uniquement ;
- Roster Session : remplacement automatique après KO ;
- Combat Session : PV et slot engagé ;
- Visual Controller : remplacement asset/profil et lecture du mouvement spécialisé ;
- Animation Core : séquence visuelle teleport/aerial ;
- Combat Runtime / Action Resolver : timing release/impact/dégâts inchangé.

Interdits :

- aucun KO géré uniquement par un if DOM ;
- aucun swap adverse direct dans l'UI sans passer par Roster Session ;
- aucun dégât décidé par la fin de l'animation ;
- aucune duplication d'horloge pour teleport/aerial ;
- aucun déplacement visuel spécial codé dans un bouton ;
- aucun retour des anciens outils laboratoire.

Tests :

- capacités principales visibles sans ouvrir un menu ;
- arène plus haute sur mobile ;
- KO adverse déclenche remplacement automatique par la réserve ;
- snapshot du membre KO conservé ;
- nouveau membre adverse garde son propre snapshot ;
- aucun bouton de réserve adverse ;
- teleport : opacity 1 -> 0 -> réapparition cible -> retour ;
- aerial : montée -> disparition -> piqué -> retour ;
- plans finissent sur état stable ;
- impact/dégâts restent pilotés par Combat Runtime/Resolver ;
- CI complète verte.

Critère de fin :

preview smartphone propre avec boutons directs, arène plus haute, KO adverse remplacé automatiquement, et mouvements Aérien/Téléportation visibles.


## Résultat technique — player-ui-ko-special-moves-v5

Implémentation présente :

- menu déroulant Capacités supprimé ;
- quatre capacités offensives visibles directement pour jeu de réflexe ;
- Objets et Équipe restent en menus secondaires ;
- arène augmentée à `min(54svh, 32rem)` sur grand écran, avec valeurs mobiles relevées ;
- distance conserve trois boutons Courte / Moyenne / Longue ;
- aucun retour des contrôles laboratoire.

KO adverse :

- `Roster Session.replaceKnockedOut()` est propriétaire du remplacement ;
- le membre KO conserve son snapshot PV/énergie ;
- un membre vivant de réserve est choisi automatiquement ;
- le slot `opponent` est remplacé dans Combat Session ;
- la présentation suit réellement `Hit -> KO` ;
- l'UI attend `presentation.finished` avant de remplacer l'asset adverse ;
- si aucun membre vivant ne reste, le roster retourne `team_defeated` et le slot adverse est masqué ;
- aucun contrôle joueur sur la réserve adverse.

Mouvements spéciaux :

- nouveaux événements visuels :
  - `teleport-attack` ;
  - `aerial-attack` ;
- presets dédiés dans chaque profil morphologique ;
- le Visual Controller mesure la géométrie réelle acteur/cible via `getBoundingClientRect()` ;
- il transmet uniquement les offsets visuels + `travelMs` à l'Animation Core ;
- Téléportation :
  - disparition à l'origine ;
  - apparition sur la cible exactement au temps d'impact ;
  - disparition sur cible ;
  - retour origine ;
- Aérien :
  - montée ;
  - disparition/reposition haute ;
  - piqué jusqu'à la cible exactement au temps d'impact ;
  - retour origine ;
- les dégâts restent appliqués exclusivement par Combat Rules à `impactAtMs`.

Sentinelles ajoutées / mises à jour :

- roster KO adverse -> remplacement vivant ;
- deux KO adverses -> `team_defeated` ;
- Hit -> KO expose une promesse réelle de présentation ;
- release teleport/aerial délègue au Visual Controller ;
- plan Téléportation atteint la cible à `travelMs` ;
- plan Aérien atteint la cible à `travelMs` ;
- retour de chaque plan à l'état stable ;
- capacités directes sans menu ;
- deux menus secondaires seulement ;
- arène plus haute ;
- distance toujours trois boutons ;
- géométrie spéciale sans autorité gameplay ;
- CI complète existante conservée.

HEAD technique avant synchronisation finale :

`967ca37e9be5074aed804b51c3cfb963b858b09b`

CI :

- run : `36102462561`
- conclusion : SUCCESS

Validation utilisateur restante :

- smartphone : vérifier que les quatre capacités restent immédiatement accessibles ;
- vérifier que la nouvelle hauteur d'arène améliore la lisibilité ;
- mettre Drakon adverse KO et confirmer l'entrée automatique de Marai adverse ;
- tester Frappe téléportée : disparition -> cible -> retour ;
- tester Plongeon aérien : montée -> disparition -> piqué -> retour ;
- confirmer que les dégâts arrivent au contact visuel, avant la fin du retour.

Le lot est GREEN technique, en attente de validation visuelle smartphone.


## Chantier actif — impact-mobility-ko-ui-v6

Base GREEN :

`c8ca895f64d69d8b6a4bc615e05b26a066a3fd58`

Checkpoint départ :

`checkpoint/lab-start-impact-mobility-ko-ui-v6-2026-09-25`

Branche :

`work/lab-impact-mobility-ko-ui-v6-2026-09-25`

Retour utilisateur ciblé :

- le KO adverse n'entraîne pas encore le remplacement visible attendu ;
- l'attaque aérienne doit monter nettement plus haut, jusqu'à pouvoir sortir temporairement du cadre supérieur avant de piquer ;
- l'arène peut être encore un peu plus haute ;
- les attaques corps à corps doivent utiliser un temps d'approche configurable par compétence ;
- exemples attendus :
  - Griffe : approche relativement lente, environ 1,5 s ;
  - Sprint : approche plus rapide, par exemple 0,9 s ou 0,5 s si configuré ;
- la barre de charge principale doit être plus grande et afficher :
  - nom de l'action en préparation ;
  - temps restant ;
  - progression ;
- aucun timing ne doit être dupliqué dans l'UI.

Architecture / propriétaires :

- `SkillDefinition.travelMs` reste l'autorité gameplay sur release -> impact ;
- `approachMode=ground` doit utiliser ce `travelMs` pour le déplacement visuel jusqu'à la cible ;
- `approachMode=aerial` utilise le même `travelMs` pour montée/reposition/piqué jusqu'à impact ;
- `approachMode=teleport` utilise le même `travelMs` pour disparition/réapparition à impact ;
- l'Animation Core consomme `travelMs`, il ne l'invente pas ;
- les dégâts restent appliqués uniquement par Action Resolver à `impactAtMs` ;
- `Roster Session` reste seul propriétaire du remplacement après KO ;
- le Presenter expose l'achèvement réel Hit/KO, aucune attente magique UI ;
- la Demo UI affiche nom/temps restant à partir des snapshots du Combat Runtime.

Diagnostic obligatoire KO :

- vérifier l'événement `hit` réel et son `hpAfter` ;
- vérifier la détection KO dans le Presenter ;
- vérifier l'attente de la promesse Hit -> KO ;
- vérifier `Roster Session.replaceKnockedOut("opponent")` ;
- vérifier le remplacement Combat Session + asset `opponent` ;
- corriger la première frontière fautive, pas ajouter de fallback concurrent.

Tests :

- Griffe : HP inchangés pendant les 1,5 s d'approche, dégâts à impact ;
- une compétence ground peut choisir 0,5 s / 0,9 s / 1,5 s sans changer le moteur ;
- animation ground atteint la cible à `travelMs` puis revient ;
- aérien monte au-dessus du cadre avant piqué ;
- teleport/aerial/ground utilisent la géométrie réelle cible ;
- KO adverse : Hit -> KO -> remplacement roster -> changement asset ;
- arène augmentée sans masquer le HUD ;
- barre de charge principale plus grande ;
- nom action + temps restant proviennent du Runtime ;
- sentinelles existantes intactes.

Hors périmètre :

- IA adverse complète ;
- nouveau moteur de dégâts ;
- intégration GenSrpG principal ;
- génération/modification d'images.


## Résultat technique — impact-mobility-ko-ui-v6

Corrections implémentées :

### Corps à corps configurable

- nouvel événement visuel `ground-attack` ;
- `approachMode=ground` utilise désormais le vrai `travelMs` de la compétence ;
- Griffe : `travelMs = 1500 ms` ;
- le contact visuel avec la cible se produit exactement à la fin de ces 1,5 s ;
- les dégâts restent appliqués uniquement à cet impact ;
- le retour à la position d'origine est purement visuel ;
- tests avec `travelMs = 500 / 900 / 1500 ms` démontrent que le moteur reste entièrement configurable.

### Aérien

- l'arène est mesurée au moment de l'attaque ;
- le Visual Controller calcule une translation suffisante pour faire sortir l'acteur au-dessus du cadre ;
- l'Animation Core utilise la montée la plus haute entre le preset et cette sortie réelle ;
- montée / disparition / repositionnement haut / piqué / impact / retour ;
- impact toujours aligné sur `travelMs`.

### KO

Cause renforcée :

- l'ancien contrôleur visuel redémarrait un idle après toute animation transitoire, y compris après `ko` ;
- ce comportement annulait visuellement l'état vaincu juste avant le remplacement.

Correction :

- `ko` ne redémarre plus l'idle du membre vaincu ;
- opacity KO finale = 0 ;
- Presenter dérive le KO directement de l'événement `hit` et expose `koActorId` ;
- l'UI ne déclenche le remplacement adverse que pour `koActorId === "opponent"` ;
- Roster Session reste le seul propriétaire du remplacement ;
- vrai test d'intégration ajouté :
  `damage -> hp 0 -> Hit -> KO -> presentation.finished -> replaceKnockedOut -> nouveau fighter opponent`.

### Barre de charge

Combat Runtime expose maintenant :

- `actionName` ;
- `preparationMs` ;
- `remainingPreparationMs` ;
- progression de charge.

UI :

- barre principale agrandie à `0.56rem` ;
- nom de l'action affiché au-dessus ;
- temps restant affiché en secondes ;
- aucune horloge UI, aucun `setInterval`, aucun `Date.now()` de gameplay.

### Surface de combat

- desktop/tablette : `min(59svh, 35rem)` ;
- mobile <= 680 px : `54svh` ;
- petit mobile <= 430 px : `51svh`.

Sentinelles V6 :

- timing ground configurable 0,5 / 0,9 / 1,5 s ;
- Griffe sans dégâts avant impact 2,7 s total (1,2 s charge + 1,5 s approche) ;
- ground atteint la géométrie cible exactement à `travelMs` ;
- aerial peut sortir réellement du cadre ;
- KO ne revient pas à idle ;
- KO actor identity protégée ;
- vrai flux KO/remplacement protégé en intégration ;
- nom action + temps restant fournis par Runtime ;
- barre charge et arène agrandies protégées ;
- frontières Core / UI / Renderer intactes.

CI technique avant documentation :

- run : `36117658014`
- conclusion : SUCCESS

Checkpoint GREEN technique :

`checkpoint/lab-impact-mobility-ko-ui-v6-green-2026-09-25`

Branche de prévisualisation :

`preview/lab-impact-mobility-ko-ui-v6-2026-09-25`

SHA GREEN technique avant synchronisation finale :

`24263541dfd5b73ef53c0a0e4d5b98a322fe64d9`

CI :

- run : `36117767684`
- conclusion : SUCCESS

Validation smartphone restante :

- Griffe doit prendre environ 1,5 s pour parcourir le terrain après la charge ;
- Plongeon aérien doit sortir franchement du haut du cadre avant le piqué ;
- KO adverse doit disparaître puis être remplacé par Marai adverse ;
- nom + compte à rebours de la charge doivent être immédiatement lisibles ;
- confirmer que l'arène plus haute reste confortable avec les boutons.


## Correctif actif — ko-runtime-true-path-v6

Base GREEN :

`a5da1af255ca9ccf5aeda10e402fc2c855337897`

Checkpoint départ :

`checkpoint/lab-start-ko-runtime-true-path-v6-2026-09-25`

Branche :

`work/lab-ko-runtime-true-path-v6-2026-09-25`

Retour utilisateur reproduit :

- les PV adverses atteignent bien 0 dans l'interface réelle ;
- aucune animation KO ne reste visible ;
- aucun remplacement automatique du monstre adverse n'est observé.

Diagnostic démontré :

1. `resolveSkillCompletion()` ne renvoie pas `actionType: "skill"`, alors que `resolveCommandCompletion()` renvoie explicitement `actionType: "command"`;
2. le vrai `Combat Runtime` transmet cette résolution à l'UI ;
3. `Combat Test UI.onResolved()` branche sur `resolution.actionType === "skill"`;
4. une compétence live est donc classée à tort comme une commande, ce qui court-circuite le Presenter Hit -> KO et le raccord roster ;
5. le test d'intégration KO précédent appelait directement le Presenter et ne couvrait pas ce raccord Runtime réel ;
6. indépendamment, le DOM Actor Renderer restaure toujours l'état de base après toute animation terminée, ce qui remet l'opacité KO à 1 même si le plan KO termine à 0.

Objectif :

- réparer le contrat de résolution skill à la source ;
- protéger le vrai chemin `Combat Runtime -> onResolved -> Presenter -> KO -> Roster Session`;
- préserver visuellement l'état terminal KO jusqu'au remplacement du slot ;
- ne toucher ni aux dégâts, ni au timing d'impact, ni au choix du remplaçant.

Propriétaires autorisés :

- Action Resolver : contrat de résolution skill ;
- DOM Actor Renderer / Animation Plan : politique explicite de restauration terminale ;
- tests Runtime/UI/Renderer/KO ;
- documentation de reprise.

Interdits :

- aucun `if hp === 0` ajouté dans les boutons UI ;
- aucun second système de remplacement ;
- aucun timer KO parallèle ;
- aucun changement de dégâts ou de `impactAtMs`;
- aucun changement dans `Zombicide-40k`.

Tests exigés :

- une résolution live skill expose `actionType: "skill"`;
- le Runtime appelle la branche skill réelle à l'impact ;
- HP adverses 0 -> Presenter détecte KO -> Hit -> KO -> roster replacement ;
- un plan KO peut conserver son état final sans restauration automatique à opacity 1 ;
- les animations non terminales continuent de restaurer l'état de base ;
- sentinelles V6 complètes vertes.

Critère de fin :

CI verte + checkpoint GREEN + preview smartphone où Drakon adverse tombe KO puis est remplacé par Marai adverse.


## Résultat technique — ko-runtime-true-path-v6

Causes prouvées et corrigées :

1. `resolveSkillCompletion()` renvoie désormais explicitement :
   - `actionType: "skill"` ;
   - `skillId` ;
   ce qui permet au vrai callback `Combat Runtime -> onResolved` de prendre la branche compétence et de déclencher le Presenter Hit/KO ;

2. le test KO d'intégration ne contourne plus le Runtime :
   - démarrage de la compétence via `Combat Runtime` ;
   - attente jusqu'à `impactAtMs` ;
   - vérification de `actionType === "skill"` ;
   - HP adverse à 0 ;
   - Presenter Hit -> KO ;
   - `Roster Session.replaceKnockedOut("opponent")` ;
   - remplacement réel par Marai adverse ;

3. le contrat `AnimationPlan` possède maintenant une politique explicite `restoreBaseState` ;
   - Hit/Attaque et autres animations transitoires restaurent toujours l'état normal ;
   - KO utilise `restoreBaseState: false` ;
   - le DOM Actor Renderer applique alors réellement le dernier segment du plan au lieu de remettre opacity à 1 ;
   - l'état KO reste donc invisible jusqu'au remplacement du slot.

Sentinelles ajoutées :

- identité skill conservée par une résolution live Runtime ;
- vrai flux Runtime -> Presenter -> KO -> Roster ;
- plan KO déclaré terminal ;
- renderer conserve l'opacité et la transformation terminales du KO ;
- animations transitoires continuent de restaurer l'état de base.

CI du HEAD fonctionnel :

- run : `36119322379`
- conclusion : SUCCESS

Validation smartphone restante :

- réduire Drakon adverse à 0 PV ;
- vérifier disparition visuelle du Drakon ;
- vérifier apparition automatique de Marai adverse ;
- vérifier que le nom, les PV et le visuel correspondent au nouveau membre.


## Chantier actif — hit-impact-feedback-v7

Base GREEN :

`07665e46983a1977de8f39c4525ce4b14a343ea5`

Checkpoint de départ :

`checkpoint/lab-start-hit-impact-feedback-v7-2026-09-25`

Branche de travail :

`work/lab-hit-impact-feedback-v7-2026-09-25`

Retour utilisateur :

- le recul `hit` existe déjà ;
- il manque un feedback visuel immédiat au moment où la créature subit l'impact ;
- objectif demandé : petit clignotement / coloration rouge lisible, en attendant de futurs sprites/FX plus riches.

Objectif :

- ajouter un canal visuel `filter` au contrat `AnimationPlan` ;
- piloter le flash d'impact depuis le profil de créature, pas depuis l'UI ;
- appliquer le flash uniquement pendant l'animation `hit` puis restaurer l'apparence normale ;
- conserver KO, dégâts, timing d'impact, roster et logique de combat inchangés.

Propriétaires autorisés :

- Creature Profile : paramètres du flash `hit` ;
- Animation Core : segment `hit` avec filter ;
- Render Adapter DOM : traduction du canal filter vers Web Animations ;
- tests Animation/Renderer ;
- documentation.

Fichiers autorisés :

- `data/profiles/*.profile.json` ;
- `src/core/animation/animation-plan.js` ;
- `src/core/animation/plan-animation.js` ;
- `src/adapters/renderer/dom-keyframes.js` ;
- `src/adapters/renderer/dom-actor-renderer.js` si restauration du canal nécessaire ;
- tests unitaires correspondants ;
- documentation laboratoire.

Fonctions protégées :

- aucun changement de `Action Resolver` ;
- aucun changement de PV/dégâts ;
- aucun changement de `impactAtMs` ;
- aucun changement du KO/remplacement ;
- aucun changement de `Combat Runtime` ;
- aucun code spécifique GenSrpG/Capture.

Tests prévus :

- le plan `hit` contient un filter d'impact fourni par le profil ;
- le segment de récupération revient à `filter: none` ;
- le DOM timeline expose le filter ;
- le renderer restaure `filter: none` après une animation transitoire ;
- KO terminal reste fonctionnel ;
- CI complète verte.

Risque principal :

- laisser un filtre résiduel après Hit ou KO.

Critère de fin :

- CI verte ;
- checkpoint GREEN ;
- preview smartphone où une créature touchée affiche un flash rouge bref au moment de l'impact puis revient immédiatement à son rendu normal.


## Résultat technique — hit-impact-feedback-v7

Implémentation :

- `AnimationPlan` possède maintenant un canal visuel `filter` neutre et renderer-agnostic ;
- les profils `serpentine` et `drake` configurent le feedback `hit` via :
  - `brightness` ;
  - `saturate` ;
  - `sepia` ;
  - `hueRotateDeg` ;
- le planner `hit` applique ce filter uniquement pendant le recul d'impact ;
- le segment de récupération revient à un filter neutre ;
- le DOM Render Adapter est l'unique propriétaire de la traduction vers CSS ;
- le renderer restaure explicitement `filter: none` après les animations transitoires ;
- le comportement terminal KO reste inchangé et protégé.

Sentinelles ajoutées :

- le planner consomme les paramètres `hit.filter` du profil ;
- la timeline DOM démarre neutre, applique le flash puis revient neutre ;
- le renderer ne laisse aucun filtre résiduel après Hit ;
- le KO terminal conserve toujours son état final.

CI du HEAD fonctionnel :

- run : `36120512640`
- conclusion : SUCCESS

Validation smartphone restante :

- toucher Marai puis Drakon ;
- vérifier un flash rouge bref exactement au moment du recul `hit` ;
- vérifier que la coloration disparaît immédiatement après ;
- vérifier qu'un KO continue à disparaître puis être remplacé normalement.


## Validation utilisateur — hit-impact-feedback-v7

Retour smartphone du 2026-09-25 :

- flash d'impact validé visuellement par Sylvain ;
- KO/remplacement précédemment validé ;
- V7 peut servir de base fonctionnelle au chantier UI suivant.

## Chantier actif — fullscreen-player-ui-v8

Base GREEN :

`b97b161cc8172ece1fa902dcbbe9a840147bd8ea`

Checkpoint de départ :

`checkpoint/lab-start-fullscreen-player-ui-v8-2026-09-25`

Branche de travail :

`work/lab-fullscreen-player-ui-v8-2026-09-25`

Référence ergonomique fournie par Sylvain :

- arène presque plein écran ;
- HUD adverse fixé en haut à droite ;
- HUD joueur fixé en bas à gauche ;
- capacités principales sous forme de grosses touches de jeu directement pressables ;
- nom de capacité conservé pour le moment ;
- future compatibilité icône seule ou icône + nom ;
- boutons Objets / Équipe / déplacement intégrés dans la même UI de combat.

Objectif du lot :

- transformer uniquement la couche joueur de la démo en HUD de combat plein écran ;
- détacher les informations PV/charge des conteneurs mobiles des créatures ;
- garder les créatures et leurs déplacements dans l'arène ;
- intégrer toutes les commandes dans l'arène ;
- conserver le vrai chemin existant des compétences et commandes.

Propriétaire :

- Demo UI pour la structure, les contrôles et la projection visuelle ;
- aucun transfert d'autorité depuis Combat Runtime / Combat Session / Roster Session.

Fichiers autorisés :

- `examples/dom-demo/index.html` ;
- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` uniquement pour projeter noms/états dans le nouveau HUD et conserver les boutons data-driven ;
- `tests/unit/demo-ui-boundary.test.mjs` ;
- documentation laboratoire.

Domaines protégés :

- `src/core/combat/**` ;
- `src/core/animation/**` ;
- `src/core/fx/**` ;
- `src/adapters/renderer/**` ;
- contrats de compétences/commandes ;
- dégâts, portée, coûts, énergie, impact, KO, remplacement roster ;
- dépôt `Zombicide-40k`.

Tests prévus :

- l'arène contient directement le HUD et les commandes joueur ;
- les quatre capacités restent directement visibles et data-driven ;
- Objets / Équipe restent accessibles dans l'arène ;
- les trois commandes de distance restent présentes ;
- PV, énergie et charge restent projetés depuis l'état/runtime ;
- noms actifs joueur/adversaire proviennent du roster, sans duplication métier ;
- aucune logique de résolution n'est ajoutée à l'UI ;
- sentinelles KO/impact/timing inchangées via CI complète.

Risques :

- masquer une commande sur petit écran ;
- gêner les interactions par superposition ;
- faire bouger le HUD avec les créatures ;
- réduire excessivement la zone de combat en portrait.

Critère de fin :

- CI verte ;
- checkpoint GREEN ;
- preview smartphone où l'arène occupe presque tout l'écran et où les capacités se jouent comme des touches directement intégrées au HUD.


## Résultat technique — fullscreen-player-ui-v8

Implémentation candidate :

- l'arène occupe maintenant le viewport du laboratoire ;
- le HUD joueur et le HUD adverse sont fixés aux bords de l'arène et ne suivent plus les déplacements des créatures ;
- les capacités principales restent générées depuis les données de compétences mais sont présentées comme quatre touches de jeu permanentes ;
- le nom reste visible aujourd'hui ; la structure CSS permet une future couche d'icônes sans changer le Runtime ;
- énergie, charge et temps restant continuent de venir du Combat Runtime ;
- Objets, Équipe et les trois distances restent intégrés dans l'arène ;
- les réserves restent visibles sous forme compacte ;
- le nom affiché du combattant actif est projeté depuis le snapshot du Roster Session ;
- aucune règle de portée, coût, dégâts, KO ou remplacement n'a été déplacée vers l'UI.

Revue du diff depuis V7 GREEN :

- `docs/LAB_CURRENT_WORK.md` ;
- `docs/LAB_ROADMAP.md` ;
- `examples/dom-demo/index.html` ;
- `examples/dom-demo/demo.css` ;
- `src/ui/combat-test-ui.js` ;
- `tests/unit/demo-ui-boundary.test.mjs`.

Aucun fichier `src/core/**`, contrat gameplay, FX ou renderer n'a été modifié.

CI du HEAD fonctionnel :

- SHA : `43b02576f799d6ddc20f3bed5b6a1d00b5b4123d` ;
- run : `36121781493` ;
- conclusion : SUCCESS.

Statut :

- GREEN technique ;
- validation smartphone V8 obligatoire avant checkpoint GREEN final.

À tester sur smartphone :

1. l'arène remplit pratiquement tout l'écran ;
2. les quatre capacités ressemblent à des touches de jeu et restent immédiatement pressables ;
3. PV joueur/adversaire restent lisibles ;
4. énergie et charge restent lisibles ;
5. Courte / Moyenne / Longue restent accessibles ;
6. Objets et Équipe s'ouvrent sans masquer durablement les capacités ;
7. les créatures restent visibles et leurs attaques/KO/flash d'impact continuent à fonctionner.


## Retour smartphone V8 — compacité des capacités

Validation partielle :

- la direction plein écran est meilleure ;
- le bloc de capacités est encore trop volumineux et mange trop l'arène.

Référence ergonomique confirmée :

- dans la référence fournie, les capacités sont des touches/icônes compactes alignées ;
- le laboratoire conserve temporairement le nom de la capacité dans chaque touche ;
- les métadonnées techniques (forme, élément, charge, trajet) ne doivent plus occuper la surface principale des touches ;
- le dock de commandes doit rester compact et ancré en bas à droite, y compris sur smartphone.

Correction autorisée dans le même lot V8 non encore GREEN :

- CSS de présentation des capacités et du dock ;
- sentinelles UI de compacité ;
- aucune modification du Runtime, des règles, des données de compétence ou des handlers.

Critère visuel supplémentaire :

- quatre capacités immédiatement accessibles avec une empreinte nettement inférieure à la candidate V8 précédente ;
- davantage d'arène visible derrière et autour du dock.


## Correction ergonomique V8 — dock capacités compact

Suite au test smartphone de Sylvain :

- les touches de capacités de la première candidate V8 étaient trop grandes ;
- elles consommaient trop de surface de combat par rapport à la référence fournie.

Correction :

- quatre touches carrées conservées en permanence ;
- disposition sur une seule rangée ;
- nom de la capacité conservé ;
- métadonnées secondaires masquées sur la touche principale ;
- structure prête à recevoir ultérieurement une icône ;
- dock global réduit et maintenu en bas à droite sur mobile ;
- commandes de distance et menus secondaires compactés sans modifier leurs handlers.

Sentinelle ajoutée :

- quatre colonnes obligatoires ;
- touches `aspect-ratio: 1` ;
- métadonnées secondaires non affichées dans la touche ;
- aucun retour en grille 2x2 dans le breakpoint mobile principal.

CI :

- SHA fonctionnel : `c39345ba6c0debf51e7cb61cd84d22efddc2c705` ;
- run : `36122256673` ;
- conclusion : SUCCESS.

Statut :

- V8 toujours en validation smartphone ;
- aucun checkpoint GREEN final tant que la compacité réelle n'est pas validée par Sylvain.

## Dernier checkpoint GREEN

`checkpoint/lab-hit-impact-feedback-v7-green-2026-09-25`

## Règle de reprise

Ne jamais reprendre uniquement depuis un résumé de conversation.

GitHub + ce fichier + les checkpoints sont la source de vérité.
