# Veldra — raccord des visuels officiels (18 novembre 2026)

## Lot Gameplay/présentation strict
- Base du Labo Combat `main@1f73062fca27cb5eb10cfebf3784d7443127ec1f`, checkpoint `checkpoint/lab-start-veldra-five-visuals-20261118`.
- Branche WORK temporaire `work/lab-veldra-five-visuals-20261118` ; `main` reste l'autorité unique. Ne pas modifier les branches Éphémus ou les autres agents.
- Source future unique des cinq icônes et cinq FX : `global-assets`, lot `work/lab-veldra-skill-media-20261118`, ZIP auteur exacts (identifiés dans `docs/LAB_VELDRA_SKILL_MEDIA_2026_11_18.md` sur la branche de bibliothèque).
- Fichiers autorisés : seulement les cinq `data/capture/showcase/veldra-*.capture-skill-transfer-v1.json`, la source de résolution d'asset pour incrémenter le cache après publication effective, le présent document, `docs/LAB_CURRENT_WORK.md` et un test de raccordement ciblé.
- Modifications autorisées dans chaque transfert : **exclusivement `draft.presentation.visual`** ; toutes les autres valeurs JSON / définitions / niveaux / loadouts / statistiques / raretés / données auteur restent inchangées.
- Effets : Plume `travel` ; Percée `impact` (approche aérienne native conservée) ; Égide `cast` ; Rayon `impact` (beamStart et travel natifs conservés pour ne pas casser les tics); Relève `cast` (roster/échange/réanimation native inchangés).
- Vérifications : import natif des cinq transferts, résolutions des dix IDs dans le catalogue `global-assets` réellement publié, tests unitaires des composants et CI 5/5 sur SHA exact, navigateur PC/mobile, preuve Pages `main` après fusion, checkpoint GREEN uniquement après preuves.
- Aucune publication PWA / Zombicide-40k ni changement des modèles créatures.
