# Éditeur Capture — libellés français et identifiants automatiques

**Contexte.** Les valeurs techniques comme `steel`, `zone-1`, `status-1`, `venin-arcanique` restent des clés de données internes. Le joueur voit et choisit « Acier », « Feu », « Stat personnalisée », « Zone », etc. Il n'a pas à saisir les clés ou les traductions anglaises.

**Propriétaires conservés.** Le seul registre de statistiques reste celui déjà chargé ; aucun nouveau catalogue élémentaire ni deuxième auteur d'effets. Le sélecteur existant conserve exactement sa valeur `id` et masque le suffixe technique. L'identifiant d'une nouvelle stat est dérivé du nom affiché, avec désambiguïsation si une stat de même nom existe. Le système existant génère déjà les IDs de statuts ; ils sont désormais cachés, comme ceux des zones nouvellement créées (`zone-1`, `zone-2`…), tout en conservant les IDs de fichiers importés.

**Compatibilité.** Le canal `acier` déjà enregistré dans l'export `tempete_rouille` demeure intact (et peut être sélectionné comme « Acier — choix importé »). Un nouveau choix « Acier » standard utilise l'identifiant technique `steel` du catalogue existant. La comparaison/résistance dans Combat Rules mérite son propre audit; aucune réécriture cachée de l'ancien export.

**Validation.** Tests unitaires sur accents, collisions, idempotence, sélection française, ID zone et statut, et navigateur réel pour ajout d'une statistique sans champ ID. Aucun changement aux dégâts, aux assets, aux créatures, aux sauvegardes historiques ou au jeu principal.
