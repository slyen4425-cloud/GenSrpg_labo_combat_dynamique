# Onde régénérante — transfert auteur exact V1

Date : 2026-10-09. Dépôt : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande et source

L'utilisateur souhaite intégrer/remplacer sa première compétence de soin avant de tester les correctifs de ciblage de la version publiée.

Fichier joint : `gensrpg-capture-skill-lib_aqua_heal(1).json`, schéma `capture-skill-transfer-v1`, version 1.

Empreinte canonique SHA-256 de `JSON.stringify(transfer)` :
`05e90de6436a45288b33ce172f65ad3a94f8a77726abb3e821bb6f0b055af13a`.
Cette empreinte est verrouillée dans une sentinelle et démontre la conservation des valeurs de l'export (représentation sémantique, indépendamment des espaces JSON).

Base publiée SHA : `df45bd9a7c87213e6bb4b90034b7559f0cc78549`.
Checkpoint départ : `checkpoint/lab-start-aqua-heal-author-preset-v1-2026-10-09`.
Branche : `work/lab-aqua-heal-author-preset-v1-2026-10-09`.

## Contrat auteur, sans transformation

- ID : `lib_aqua_heal`, nom `Onde régénérante`, description `Rend des PV à une cible alliée.`.
- Catégorie `heal`, élément `water`, forme `self`, slot `standard`, niveau requis **15**.
- Ciblage effectivement authoré : **`targetRelations:["self"]`** (seulement le lanceur), `targetLocations:["active"]`.
- Coût **8 énergie**, préparation **2500 ms**, trajet **0**, récupération **0**, cooldown **30000 ms**.
- **`definition.effect.heal=0`**, **`definition.effects=[]`**, **`presentation=null`**.
- Aucun sprite, son, icône ou presentation custom inclus dans l'export.

**Limitation essentielle** : le champ `category:"heal"` classe la capacité, mais ne suffit pas à restaurer des PV. Le gameplay ne doit pas inventer un montant. Le fichier importé **ne soigne actuellement aucun PV** : c'est une propriété des données source, pas une défaillance de la correction Runtime. La description `cible alliée` est plus large que le ciblage `self` réellement authoré. Toute correction chiffrée/retarget nécessitera un nouvel export auteur ou une instruction utilisateur explicite.

## Intégration dans les autorités existantes

- **Un seul** transfert : `data/capture/showcase/lib_aqua_heal.capture-skill-transfer-v1.json`.
- **Une seule** déclaration : `src/catalogs/capture-showcase-skill-presets-v1.js`.
- Le Human Editor utilise déjà `hydrateCaptureShowcaseSkillPresetsV1`, puis `applyCaptureTransferBatchToEditorStateV1({mode:"replace"})` et `refreshSkillLibraryOptions`.
- L'ID est absent du dépôt publié avant le lot : insertion Showcase sur le démarrage neuf, remplacement sans doublon si une fiche locale de même ID existe.
- Aucun catalogue parallèle, aucun gameplay spécialisé `lib_aqua_heal`, aucune mutation loadout ou auto-équipement.
- Les 103 créatures, leurs capacités existantes, les branches `main`, `global-assets`, `Zombicide-40k`, Exploration demeurent intouchées.

## Vérification TDD et navigation

- RED test ciblé : `tests/unit/capture-aqua-heal-author-preset-v1.test.mjs`, CI `37914000943` ; le registre ne contenait pas ce preset, le JSON était absent.
- GREEN première intégration : CI `37914060477` SUCCESS — **1308 / 1308 Node PASS**, vrai Chromium **creature-library-browser SUCCESS**, 103 créatures présentes.
- Sentinelle Chromium augmentée pour exiger `lib_aqua_heal` **une seule fois dans le sélecteur réel des capacités**, en préservant `cap_water_atk_3`. Le statut de cette CI est à consigner dans `LAB_CURRENT_WORK.md`.
- Tests : empreinte source, champs gameplay auteur exacts, export/import, collision/remplacement par ID depuis le propriétaire `configuredSkills`, maintien d'une autre compétence, vrais PV inchangés avec soin 0, vrai chemin navigateur.
- Checkpoint GREEN technique seulement sur SHA exact d'un commit dont CI Node + navigateur est SUCCESS ; publication `gh-pages` par fast-forward avec contrôle du SHA actuel. La validation utilisateur smartphone reste distincte.

## Préparation du test utilisateur

Lancer l'éditeur Capture puis sélectionner **Onde régénérante**. Pour essayer effectivement une récupération de PV, l'utilisateur devra enregistrer une quantité positive dans un effet de soin et exporter/sauvegarder à nouveau la compétence. Selon l'intention, conserver le ciblage `self` ou autoriser également l'allié. Lier au loadout d'une créature de niveau adéquat au besoin ; aucune modification de loadout automatique n'est faite par cette importation.

Aucun asset média ajouté : **0 image, 0 son, 0 FX**. 1 fichier JSON métier, 1 référence de catalogue.
