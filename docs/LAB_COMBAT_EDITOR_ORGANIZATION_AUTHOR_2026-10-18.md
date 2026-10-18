# Labo combat — exports auteur et classement des sélecteurs (18 octobre 2026)

Ce lot utilise la charte §§15–18, 26, 33. Le dépôt principal et la bibliothèque visuelle globale ne changent pas.

- Deux transferts exacts de l'éditeur : créature Noctigriffe (ID crea_ombre_2) et capacité Barrière lumineuse (ID lib_magic_barrier), avec sources conservées sous data/capture/source-exports. Le catalogue de showcase hydrate les propriétaires configurés.
- Les sélecteurs joueur et adversaire du panneau Combat récupèrent directement les groupes de la bibliothèque de créatures par élément principal, sans trier ailleurs ou changer les IDs.
- Le contrôle de coût en marqueurs, précédemment placé par erreur dans l'onglet Créature, est déplacé vers Capacités à côté des conditions d'activation et des effets. Aucun coût ou effet de capacité n'est supprimé.
- Tests : nouvelle sentinelle dédiée ; suite npm run ci ; validation d'éditeur mobile après publication.
- Aucun checkpoint GREEN utilisateur tant qu'une preview Android n'est pas contrôlée.
