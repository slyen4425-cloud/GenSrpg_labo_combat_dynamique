# DOM Demo V1

Démo autonome du laboratoire de combat dynamique.

## But

Vérifier le vrai chemin :

`CombatVisualEvent -> profile -> AnimationPlan -> DOM renderer`

sans dépendance à GenSrpG et sans logique d'animation dans l'interface.

## Utilisation

Servir la racine du dépôt avec un serveur HTTP statique, puis ouvrir :

`/examples/dom-demo/`

La page fonctionne sans build ni dépendance npm côté navigateur.

## Assets

La V1 charge les vues de combat depuis l'appareil avec les champs fichier.

Configuration initiale :

- Maraileron : vue joueur, profil `serpentine` ;
- Braisombre : vue adversaire, profil `drake`.

Les PNG normalisés du dépôt seront raccordés dans un lot asset séparé.
