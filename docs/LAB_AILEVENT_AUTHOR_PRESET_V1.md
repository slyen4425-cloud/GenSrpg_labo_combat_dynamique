# Labo Combat — Ailevent : remplacement du modèle auteur

Date : 2026-10-11.

## Mission et identité

Intégrer l'export créature exact fourni par l'utilisateur `gensrpg-capture-creature-crea_ailevent.json`, SHA-256 source `25b6d8a088a728651671c474c3503a59fdb34ddab6053668364622f2690f96ee`, 5 368 octets. Le traiter via le **propriétaire existant du transfert**, `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1` + importateur `importCaptureTransferJsonV1` + planificateur `planCaptureTransferImportV1` et map `configuredCreatures` (mode replace). `crea_ailevent` existe déjà dans le roster canonique : mise à jour du même ID, **aucun doublon**.

## Périmètre

Base LIVE `gh-pages` `4b583763923edc5b5c0ecec0ca89a2398993fea4` (CI/Pages SUCCESS) ; checkpoint `checkpoint/lab-start-capture-ailevent-author-v1-2026-10-11` ; travail `work/lab-capture-ailevent-author-v1-2026-10-11`. Fichiers : un JSON auteur dans `data/capture/showcase`, la liste des presets, les tests de contrat/startup, la documentation et `LAB_CURRENT_WORK.md`. Aucune réécriture de l'export, règle gameplay, registre stats, capacité, média, son, autre créature, ni de `main`, `global-assets`, `Zombicide-40k` ou Exploration.

## Contenu auteur

- Niveau 1, 170 PV ; stats actuelles `health:170,speed:20,physical:0,defense:10,air:15` et autres canaux à 0 ; anciennes caractéristiques `sourceStats` inchangées.
- Élément Air ; Terre +35 %, Électricité -50 %, 13 entrées de résistances conservées ; capturable 62 %, spawn 18 %, évolution niveau 16 vers `crea_rafalcor` existante.
- Profil volant ; affichage joueur 1.8/adversaire 1.4 ; 5 sockets dont bouche, et trois assetIds des visuels Ailevent déjà présents dans `global-assets`.
- Son de déplacement `gensrpg:sound:conflux-da9a4465` conservé par référence ; la disponibilité des octets audio reste une validation runtime distincte.
- Neuf capacités `cap_air_*` conservées ; quatre slots actifs `cap_air_atk_1..4`, ultime vide tel que l'export auteur.

## Statistiques : explication

`sourceStats` est un bloc historique issu du format de l'éditeur hérité (Force, Agilité, Intelligence, Esprit, Endurance, Initiative). Le registre statistique moderne `data/capture/monster-capture-stat-registry.v1.json` définit douze IDs `health,speed,physical,defense,fire,water,earth,air,electric,light,shadow,poison`. Les bonus utilisés via le contrat `statValues` reposent sur ce registre, pas automatiquement sur les attributs historiques. Les résistances de types non présents dans les canaux actifs (nature, ice, steel, psy, spirit) sont conservées par fidélité au fichier ; aucun effet additionnel non implémenté n'est inventé.

## Protocole de validation

Test TDD RED sur l'absence de l'export et du registre, puis ajout source octet pour octet. Tester SHA-256 auteur, schémas, propriété d'ID, registre, présentation, slots, disponibilité des capacités, référence d'évolution, batch réel 102→103 créatures, et absence de régression des anciens presets. CI foundation et smokes Chromium, checkpoint GREEN au SHA exact, FF `gh-pages` sous lease et double vérification CI/Pages. Validation Android utilisateur distincte.
