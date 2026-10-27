# Extraits ciblés de la base auteur — Acier et Scarabacier (18 octobre 2026)

## Source et périmètre
- Source auteur : `gensrpg-capture-database-v1.json` (639132 octets ; SHA-256 `cc6533e8931d5e602cfd6cd62270af6c3f044b3c439d18abd4d84baaf67a2857`).
- Extraction de deux champs SEULEMENT : `statRegistry.stats[id=acier]` et `creatures[draft.id=crea_scar_2]`.
- La source complète n'est pas copiée dans le runtime. Les deux extraits sont conservés comme preuves séparées ; l'objet Scarabacier est encapsulé dans le contrat `capture-creature-transfer-v1` avec ses valeurs identiques, sans prétendre que cette enveloppe possède les mêmes octets que le fichier database entier.
- Base publique initiale : `gh-pages@eb11c053fbe391a33c975586a55bea72f3a58f3f`. Branche `work/lab-acier-scarabacier-2026-10-18`, checkpoint initial `checkpoint/lab-start-acier-scarabacier-2026-10-18`.

## Modifications strictes
1. **Acier** — une entrée supplémentaire `id:acier`, étiquette Acier, canaux dégâts/résistance `acier`, poids +1 % dégâts et résistance par point, temps préparation/HP/réduction dégâts 0. Les 12 définitions précédentes restent identiques, même ordre et mêmes champs.
2. **Scarabacier** (`crea_scar_2`) — fiche complète auteur exportée en preset vitrine, remplaçant son ID de créature déjà connu. Statistiques : PV 190, Défense 20, Acier 15 ; élément `steel`, résistance `element:steel` 35, faiblesse électrique -50, résistance terre 35 ; profil, vues, socket, réaction de défense et loadout (5 slots vides) conservés.
3. Catalogue des créatures — une entrée ajoutée au registre existant, aucun autre ID. Toutes les 114 compétences de la base source sont **ignorées**, et ses 102 autres créatures aussi.
4. `acier` est l'ID de stat et de canal fourni ; `steel` est l'ID d'élément/résistance de Scarabacier dans la même source. Ils restent distincts, aucune conversion arbitraire.
5. Aucun moteur, visuel, effet, capacité, objet, règle de progression ou chargement de base complète changé.

## Validation
- Sentinelle dédiée : contrôle strict des deux extractions, initialisation de `CaptureStatRegistry` avec 13 IDs, import `capture-creature-transfer-v1`, replacement `configuredCreatures` natif, sans toucher à Scarabébé ou aux capacités.
- Sentinelle de catalogue existante ajustée au 10e preset de créature.
- CI, checkpoint GREEN et Pages requis avant livraison technique. Validation visuelle smartphone séparée.
