# Ephemus & Veldra — import de réglages visuels (17 novembre 2026)

- Base : Combat main `49a1d1b6eb149c09ba602ee38982720aa67a3ec8` ; checkpoint de départ `checkpoint/lab-start-ephemus-veldra-20261117`.
- Périmètre : exclusivement les transferts Capture auteur `Ephemus` et `Veldra_crea`, leur inscription dans `CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1`, les sentinelles, et la documentation.
- Les deux fiches utilisent le mécanisme existant `hydrateCaptureShowcaseCreaturePresetsV1` / `applyCaptureTransferBatchToEditorStateV1`, qui alimente aussi le sélecteur de l'équipe adverse. Il n'y a ni nouvelle source de vérité, ni catalogue parallèle.
- Les six `assetId` (face, dos, icône) existent déjà dans le catalogue graphique `global-assets`. La branche propriétaire des médias n'est pas modifiée.
- Identifiants conservés littéralement : `Ephemus`, `Veldra_crea`. Ne surtout pas inférer ou renommer en `crea_*`.
- Les cinq slots sont vides et aucune capacité n'est créée. Les créatures sont destinées d'abord au réglage visuel / réexport auteur ; combat offensif à authorer ensuite.
- Tests : import normalisé, compatibilité des IDs et des éléments, données auteur, assets, slots, et sélecteur via le propriétaire d'état existant. Exiger CI et test vrai navigateur avant état GREEN. Aucune modification du moteur ou de la PWA.
