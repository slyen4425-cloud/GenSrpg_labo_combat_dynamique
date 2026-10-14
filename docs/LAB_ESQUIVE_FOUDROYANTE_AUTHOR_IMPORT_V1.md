# Intégration auteur — Esquive foudroyante (`dodge`)

Date : 14 octobre 2026.

## Source de vérité
- Fichier remis par l'auteur : `gensrpg-capture-skill-dodge(1).json`.
- JSON d'export `capture-skill-transfer-v1`, ID stable `dodge`, capacité `Esquive foudroyante`.
- Taille **2532 octets**, SHA-256 de l'export complet **dd5319422c9e413168477d98d56aa26bfa32c2830a42921683340a6beab7ecb4**.
- Preset propriétaire ajouté sans aucune altération : `data/capture/showcase/dodge.capture-skill-transfer-v1.json`.
- Déclaration unique dans `CAPTURE_SHOWCASE_SKILL_PRESET_FILES_V1`, chargement par le `hydrateCaptureShowcaseSkillPresetsV1` et `applyCaptureTransferBatchToEditorStateV1`, dans l'autorité `configuredSkills` en mode replace. Pas de créature ni d'équipement modifié.

## Valeurs préservées telles que fournies
- Niveau requis **15**, catégorie **defensive**, visée **soi ou allié**, effet `apply_status:target`.
- Coût **4 énergie**, préparation **300 ms**, recharge **20 000 ms** ; 0 temps de trajet.
- Statut `auto_dodge`, ID `status-1`, durée **10 secondes**, polarité bénéfique, `refresh`.
- Icône **`core:icon-skill-recall-01`** (asset existant), aucun son ; visuel de statut teinte **#ffffff** à opacité 0,35, clignotement **800 ms**.
- Aucun changement silencieux du nom, de la catégorie, de la cible, de la présentation V3 ou des réglages user.

## Tests et limites
- Test RED `tests/unit/capture-esquive-foudroyante-author-import-v1.test.mjs`, avant ajout registre ; hachage du JSON source exact, unicité du registre, import/export, session réelle de combat (application et expiration 10s), registre `configuredSkills` complet, absence de collision `dodge` dans les deux catalogues natifs.
- Trois sentinelles historiques fixaient 22 chemins Showcase ; l'ajout porte légitimement ce total à **23**. Seules ces trois assertions de total ont été adaptées, sans toucher aux tests d'intégrité des capacités précédentes.
- La protection `auto_dodge` et la correction multi-cibles Impact rocheux sont **déjà** des mécanismes du moteur publiés et non modifiés par ce lot. La cohérence Stun Arc électrique / Esquive ordinaire en cours d'action relève aussi du lot précédent, inchangé.
- Tests Foundation + Firestorm Chromium + bibliothèque créatures Chromium requis avant publication ; test visuel Android par l'auteur après déploiement.

## Gouvernance
Base `gh-pages@4fc9171e28edf731ace68f3a5f820e7b5069e739` (CI+Pages SUCCESS), checkpoint `checkpoint/lab-start-author-esquive-foudroyante-dodge-2026-10-14`, branche `work/lab-author-esquive-foudroyante-dodge-2026-10-14`. Aucun changement moteur, audio, assets, autres presets, `global-assets`, `main`, dépôt principal ou exploration.
