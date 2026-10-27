# Sélecteurs dynamiques d'éléments / canaux — Laboratoire Combat (11 octobre 2026)

## Périmètre et base
- Base de départ : `gh-pages` `bffaad8964a3828d2695f7ad98fae29ac9e997c7`.
- Branche : `work/lab-dynamic-element-channel-selects-v1-2026-10-11`.
- Départ : `checkpoint/lab-start-dynamic-element-channel-selects-v1-2026-10-11`.
- Travail sur les seuls champs **Canal dégâts**, **Canal résistance** (configurer les stats), et **canaux d'élément des effets de compétence** (dégâts immédiats, DoT, dégâts différés, zone et DoT de zone). Aucun changement des règles de résistance ou des créations de types élémentaires côté moteur.

## Origine des choix et portabilité
- `captureEditorElementChannelChoicesV1` est une projection UI pure, non autoritaire : elle relit les valeurs de la liste élémentaire de Capture existante (`[data-skill-element]`) et les canaux réellement déclarés sur les statistiques dans le registre `CaptureStatRegistryV1` actif. Elle ne duplique plus la liste feu/eau/nature dans un second tableau de dégâts.
- La future valeur d'un canal d'une stat personnalisée est proposée dès qu'on renseigne son **ID stable** dans le constructeur. Après ajout/modification/suppression d'une stat, toutes les listes présentes sont recalculées depuis le registre actif.
- Les canaux de sauvegardes anciennes ou imports auteur, y compris un canal hors catalogue courant, restent proposés comme **(conservé)** avec leur véritable ID. Les choix restent des IDs stables ; aucun libellé n'est écrit dans les règles.
- On peut choisir **Aucun canal** pour une statistique neutre ou **Même élément que la capacité** lorsqu'un effet l'autorise. `physical` reste disponible à travers le registre de Défense.
- Les créations futures d'**éléments gameplay** en tant que tels ne sont **pas** ajoutées dans ce lot : un véritable éditeur de types élémentaires aura besoin de son propre contrat/registre métier. Ici une statistique personnalisée peut créer son canal, et ce canal est immédiatement proposé.

## Autorité et sécurité
- Les définitions de compétences, de créatures et les deux exports Charge tellurique/Moussados sont conservés octet pour octet.
- Aucune modification de `Combat Rules`, des `Status Effects`, du calcul de dégâts/résistance, des bibliothèques d'assets, de `main`, de GenSrpG, ou du Labo Exploration.
- Les controls UI portent les mêmes `data-*`, `value` et identifiants ; lecture et sauvegarde des transferts restent inchangées. Le code d'option ne crée ni canal gameplay ni règle supplémentaire.

## Vérification
- Sentinelle RED/GREEN `tests/unit/capture-element-channel-selects-v1.test.mjs` : regroupement, déduplication, ajout via stat personnalisée, canal ancien préservé, remplacement des champs texte.
- Sentinelle DoT existante alignée sur la nouvelle signature du sélecteur, sans changer son invariant.
- CI Node Foundation + Chromium creature-library-browser + firestorm-zone-growth-browser sur SHA final ; les résultats des actions GitHub et Pages font foi.
- Essais manuels Android : cliquer `Configurer le système de stats` puis choisir `Canal résistance`, ajouter une stat personnalisée (`id=crystal` / canal `crystal`), vérifier la disponibilité du choix dans `Effets tactiques`, exporter/réimporter puis vérifier l'ID ; vérifier une capacité héritée avec canal extérieur au registre.
