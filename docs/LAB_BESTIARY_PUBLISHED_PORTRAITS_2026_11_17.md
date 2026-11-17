# Bestiaire officiel — portraits publiés (17/11/2026)

## Résultat éditorial
- 22 créatures du Showcase auditées ; 19 descriptions remplacées pour l'affichage dans le Bestiaire officiel, en deux phrases françaises riches et cohérentes, les trois descriptions déjà détaillées (Sylvorne, Sélachombre, Vyrâme) préservées.
- Les 19 textes narratifs se trouvent dans une **unique** source éditoriale `data/capture/bestiary/official-lore.v1.json` avec des IDs canoniques de créatures existantes. Aucune copie d'assets ou de catalogue gameplay.
- Le projecteur original `captureBestiaryCardsV1` accepte le paramètre facultatif `publishedLore`, utilisé uniquement dans `examples/dom-demo/bestiary.js` pour l'affichage des créatures Showcase. Dans les univers privés, le texte créateur prime, sans overlay.
- Tous les transferts originaux des 19 créatures ont été restaurés exactement à leurs blobs initiaux. 28 sentinelles de provenance byte-exact ont montré que modifier `draft.description` d'un export auteur n'était pas autorisé ; ces sentinelles ne sont pas modifiées.
- Aucune modification gameplay, stats, propriétés, rareté, visuels, attaques, sauvegardes, éditeur de créatures ou PWA principale. Percée d'aurore reste une attaque aérienne sans sprite dédié.

## Provenance et contrôle
- Base main `d4a1fa607db7c6c4088f7361fdb8ef80d2878a92`, checkpoint `checkpoint/lab-start-bestiary-19-portraits-20261117`, branche `work/lab-bestiary-19-portraits-20261117`.
- `tests/integration/capture-bestiary-published-portraits-20261117.test.mjs` : source éditoriale et 19 descriptions uniques, projection native des 22 fiches, absence de pollution des univers personnalisés.
- Tests de fond : 2817/2817 réussis. Quatre jobs CI sur cinq réussis. La sentinelle Chromium `shadow-light-real-render-smoke.mjs` échoue hors du périmètre narratif par un défaut de contact 2.5D antérieur / démarrage asynchrone `missing`.
- Les essais de réparation et instrumentation du smoke ont été **annulés et restaurés sur les blobs exacts de `main`** (les diagnostics restent dans l'historique de PR), pour respecter la séparation des chantiers.
- **Statut NON GREEN / NON PUBLIÉ** : pas de merge tant que CI 5/5, navigateur réel et publication Pages sur SHA exact ne sont pas validés.

Créatures concernées : Grainou, Moussados, Venombre, Kitsune Lunaire, Loup volcanique, Gorice, Gemmor, Maraileron, Ailevent, Voltige, Dracendre, Freclairions, Lumilo, Noctigriffe, Scarabacier, Krakenor, Veuve jaune, Ephemus et Veldra.
