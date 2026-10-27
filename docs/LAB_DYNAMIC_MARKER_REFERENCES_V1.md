# GenSrpG Labo Combat — références dynamiques des marqueurs

Date : 17 octobre 2026. Lot `work/lab-dynamic-marker-references-2026-10-17`.
Base immutable `gh-pages@22e1637885270a637f93b83418ca20ae5e18223e`.

## Origine

Retour de test Android : un champ « Élément si calcul combat » exigeait de taper `physical`, valeur technique sans pertinence pour le créateur. Règle globale demandée par l'auteur : **jamais de référence existante à saisir**. §35 de `docs/LAB_CHARTE.md` formalise désormais cette règle pour les futurs chantiers.

## Réutilisation obligatoire de l'autorité existante

- **Canaux d'éléments** : `captureEditorElementChannelChoicesV1`, déjà utilisé dans l'éditeur classique, avec le menu d'éléments Capture et le `CaptureStatRegistryV1` dynamique ; `physical` est le canal physique natif du moteur. L'ajout de stats liées à des canaux dégâts/résistance augmente les options dans la même session.
- **Icône du marqueur** : les options du sélecteur Esquive/Défense alimenté par le catalogue global GenSrpG et les imports personnels de session sont réutilisées, sans inventer un registre visuel concurrent. L'ID d'icône est toujours transporté comme métadonnée auteur ; le HUD emploie actuellement son losange (aucun raccord visuel physique d'icône revendiqué).
- **Statuts ciblés par nettoyage / dissipation** : filtres à tags proposés comme menus multiples (« + Ajouter un filtre »), issus des statuts réellement configurés et des marqueurs de session ; aucun texte d'IDs séparés par virgules. Une valeur importée absente est explicitement proposée comme référence conservée.
- **Marqueur nouvellement créé** : l'ID canonique est calculé à partir du nom et affiché en lecture seule. Descriptions, noms, nombres restent éditables.

Dans l'onglet Capacités, les références saisies librement auparavant sont maintenant des sélecteurs pour : canal de dégâts périodiques par marqueur ; canal de dégâts au seuil ; canal des sous-effets de consommation ; icône auteur ; filtres de statuts pour nettoyage/dissipation. Les marqueurs à durée illimitée et les statuts historiques conservent leur sémantique.

## Règles de compatibilité

- Valeurs `""` proposées uniquement là où le contrat accepte « même élément que la compétence », « sans icône », ou « aucun filtre = tous les statuts ».
- Une référence importée absente des registres actifs demeure sélectionnée et visible comme **conservée**, pas effacée, renumérotée ou convertie silencieusement.
- Aucune nouvelle autorité mécanique ou liste d'éléments parallèle ; seul le texte/DOM d'édition change.
- Les contrôles d'autres domaines qui demandent encore des identifiants techniques doivent être migrés **par lots distincts documentés** selon §35 : le présent lot ne prétend pas avoir réécrit chaque formulaire de l'éditeur.

## Vérification attendue

Sentinelle unitaire `capture-marker-reference-choices-v1.test.mjs` : éléments natifs, canaux statistiques nouvellement créés, ancienne référence importée, icônes du catalogue et importées, doublons.

Parcours vrai Chromium `capture-creature-library-smoke.mjs` : 103 créatures, marqueur créé avec un nom accentué sans ID manuel, sélecteur physique/Feu/Poison, icône de la bibliothèque, sous-effet de consommation, nettoyage d'un tag sélectionné dans le menu, enregistrement/relecture/export, ajout d'une statistique supplémentaire et apparition immédiate de son canal dans les marqueurs.

Clôture : Foundation + 4 jobs navigateur, checkpoint GREEN exact, promotion fast-forward gh-pages sous lease et Pages SUCCESS ; validation tactile Android encore à demander à l'auteur.
