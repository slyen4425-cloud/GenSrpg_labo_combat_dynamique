# Capacités — Réorganisation de l'onglet Effets visuels V1

Date : 17 octobre 2026. Laboratoire : `slyen4425-cloud/GenSrpg_labo_combat_dynamique`.

## Demande utilisateur

L'auteur souhaite conserver toutes les options mais les lire dans un ordre pratique : **icône, type de projectile / forme de la capacité, puis réglages visuels**. Avant ce lot, l'icône était dans un bloc d'animations avancées après l'interface de configuration du rayon ; la forme Contact / Projectile / Rayon / Zone / Sur soi / Aura se trouvait dans une carte antérieure. La trajectoire du projectile était elle aussi enfouie parmi les dimensions avancées.

## Intervention minimale

- Déplacement du **vrai** `data-skill-icon` au début de la carte Effets visuels ; plus besoin d'ouvrir les animations avancées pour choisir l'icône.
- Déplacement du **vrai** `data-skill-form` juste après l'icône (Contact, Projectile, Rayon, Zone, Sur soi, Aura), sans dupliquer le paramètre ni modifier sa sémantique gameplay.
- Déplacement du **vrai** `data-skill-trajectory-mode` juste après la forme, pour les trajectoires classiques, chute du ciel et onde expansive.
- Regroupement visuel léger avec deux étapes bien délimitées et renumérotation de la suite : style FX rapide 3, intensité 4, personnalisation 5.
- Préservation du modèle et des trois phases Rayon, de tous les champs Cast / Projectile / Impact / Zone, Glow/particules, ancrages, sons, imports, contrôles, données enregistrées et export JSON. Le bloc de dimensions des trajectoires spéciales reste dans les animations avancées.

Aucune modification des modules de Combat Runtime, FX Core, contrats, catalogue, données de capacité, assets, ou de la logique de sauvegarde. Le formulaire conserve exactement un contrôle canonique de chaque type.

## Protocole / preuves

- Départ immuable : `gh-pages@2e92cf44360aa43f53b3e566e04cb06405499197`, checkpoint `checkpoint/lab-start-fx-visual-order-v1-2026-10-17`, branche `work/lab-fx-visual-order-v1-2026-10-17`.
- Test RED ajouté avant le déplacement : `tests/unit/capture-fx-visual-order-v1.test.mjs`, run CI `39030792923` FAILURE ciblé.
- Première implémentation : ancienne sentinelle `capture-fx-unified-flow-v1.test.mjs` exigeait toujours la numérotation interne 1/2/3 ; adaptation explicite à 3/4/5, sans neutraliser les assertions d'ordre ni de présence.
- Test structurel : unicité et ordre exact des trois sélecteurs, présence des contrôles avancés et des trois phases rayon.
- Vrai navigateur : `tests/browser/capture-creature-library-smoke.mjs` vérifie dans le DOM monté la présence des champs à leur nouvel emplacement et continue de contrôler les 15 labels canoniques redistribués par la vue Rayon (7 / 4 / 4).
- Code/tests `963058c0464370022039ac0391ed78e1f8418a75` : run `39030964607`, cinq jobs Laboratory CI SUCCESS, avant l'ultime clarification des libellés.
- Dernier code `71076086c2e7cf429e872bea2ee3766c5e1da00b` : clarification de la note Chute du ciel et alignement HTML ; exiger sa CI et la CI du SHA documentaire final avant checkpoint GREEN.

## Publication et validation

GREEN technique seulement si Foundation + quatre browsers sont tous SUCCESS sur le SHA final, le checkpoint GREEN pointe sur ce même SHA, `gh-pages` est mis à jour en fast-forward sous lease et son déploiement Pages est SUCCESS. La vérification tactile de l'ergonomie sur smartphone reste à effectuer par l'auteur : ne pas confondre une CI technique et son appréciation visuelle.
