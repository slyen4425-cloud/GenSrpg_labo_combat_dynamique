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

## Assets par défaut

La démo charge automatiquement :

- Maraileron : vue joueur, profil `serpentine` ;
- Braisombre : vue adversaire, profil `drake`.

Les images runtime de prévisualisation sont stockées directement avec les métadonnées de chaque créature.

Les champs fichier restent disponibles uniquement pour tester temporairement une autre image utilisateur ; ils ne sont pas nécessaires pour la démo standard.
