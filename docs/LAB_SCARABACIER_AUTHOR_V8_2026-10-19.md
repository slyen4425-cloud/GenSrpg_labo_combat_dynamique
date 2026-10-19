# Scarabacier — remplacement du preset par le dernier export auteur V8

Date : 2026-10-19.

## Provenance et périmètre
Export utilisateur `gensrpg-capture-creature-crea_scar_2(1).json` (5752 octets, SHA256 `05cb2efd62220c4e9aa58d8b6ee9bbae6c2326d494c013d9816d069c3b73f7aa`). Source intacte conservée dans `data/capture/source-exports/gensrpg-capture-creature-crea_scar_2-2026-10-19-v8.json` et remplacée à l'unique chemin showroom `data/capture/showcase/crea_scar_2.capture-creature-transfer-v1.json`.

## Changements exacts par rapport au V7 précédent
- Réaction défensive : réduction 80 % sur une fenêtre de 700 ms (au lieu de 90 % sur 500 ms).
- Esquive visuelle : `pack:capture:sprite-steel-carapace-hold-01`, taille 1.
- Contrat présentation V8 : `movementScaleByView` joueur 1 / adversaire 1,2 ; `rangedAttackScaleByView` joueur 0,8 / adversaire 1 ; `movementPlayback` 0 ms (auto), boucle.
- Autres paramètres, statValues, résistances, sockets, modèle, audio, capacités et loadout conservés tels qu'exportés. Aucune réécriture silencieuse, aucun changement aux fichiers de capacité.
- Archives auteur V7 et 18 octobre préservées.

## Vérifications
- Assets référencés présents dans le catalogue externe ; capacités `cisaille` et `cap_water_atk_1` existantes dans la vitrine.
- Test de remplacement V8 couvre la lecture `configuredCreatures` depuis l'unique preset, les données du combat, sockets, stats et loadout ; CI Foundation et quatre tests navigateur.
- Le test visuel sur smartphone appartient à l'utilisateur ; il n'est pas déclaré validé ici.
