# DOM Demo V1

Démo autonome du laboratoire de combat dynamique.

## But

Deux chemins sont visibles dans la même page mais restent séparés.

Chemin visuel brut :

`CombatVisualEvent -> profile -> AnimationPlan -> DOM renderer`

Chemin prototype combat :

`Combat data -> Combat Session -> Action Resolver -> Resolution Presenter -> Animation / FX`

Le moteur visuel ne décide jamais du résultat du combat.

## Utilisation

Servir la racine du dépôt avec un serveur HTTP statique, puis ouvrir :

`/examples/dom-demo/`

La page fonctionne sans build ni dépendance npm côté navigateur.

## Test distance / énergie

État initial :

- distance : Moyenne ;
- Maraileron : 100 énergie, déplacement 1 énergie par palier ;
- Braisombre : 100 énergie, déplacement 3 énergie par palier.

Le joueur peut déplacer l'une ou l'autre créature entre :

- Courte ;
- Moyenne ;
- Longue.

Le coût affiché provient du moteur Combat Rules.

L'énergie utilisée pour se déplacer est la même que celle utilisée pour lancer ou répondre à une capacité.

Le bouton `+1 s d'énergie` applique explicitement la régénération configurée sans installer de boucle globale.

## Capacités de test

Maraileron :

- `Boule de feu` : Offensive + Projectile + Feu, moyenne/longue ;
- `Griffe` : Offensive + Contact, courte.

Réactions Braisombre :

- `Bouclier miroir` : renvoie Projectile ;
- `Immunité feu` : immunise Feu ;
- `Riposte` : contre Contact.

Chaque capacité porte ses propres coûts et timings.

Une réaction trop lente n'est pas appliquée.

Une Riposte prête avant le départ d'une attaque de contact peut annuler l'attaque avant son release.

## FX minimal

La Boule de feu utilise un projectile DOM générique uniquement pour vérifier la chronologie :

préparation -> release -> trajet -> impact.

Ce FX n'a aucune autorité sur les règles.

## Assets par défaut

La démo charge automatiquement :

- Maraileron : vue joueur, profil `serpentine` ;
- Braisombre : vue adversaire, profil `drake`.

Les champs fichier sont rangés dans `Outils visuels du laboratoire` et restent optionnels.
