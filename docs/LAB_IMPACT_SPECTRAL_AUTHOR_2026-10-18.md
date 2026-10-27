# Intégration auteur — Impact spectral (18 octobre 2026)

## Traçabilité et base
- Origine : export utilisateur `gensrpg-capture-skill-cap_shadow_atk_4.json` du 18 octobre 2026.
- Version initiale publique : `gh-pages@4cd02d31e5a683b7f274a3dd98173d37b9299362` (CI GREEN, Pages publiée).
- Point de départ : `checkpoint/lab-start-impact-spectral-author-2026-10-18`; branche `work/lab-impact-spectral-author-2026-10-18`.
- SHA-256 du fichier intégral : `f3b1babb771f0948e8d9b39f035c2d366fb870403cf4bc8f0c41249090f2611a`, 5485 octets. Aucun champ ni ordre d'effet réécrit.

## Capacité
- ID stable `cap_shadow_atk_4` ; nom **Impact spectral** ; type Ombre, offensif, projectile ; requiert effectivement le niveau 15, coût 6 énergie, préparation 1600 ms, trajet 800 ms, recharge 30000 ms, touche les intangibles, puissance collision 1.
- Effet 1 : 15 dégâts Ombre, ignore 100 % de la réduction des dégâts.
- Effet 2 : `stun` sur la cible durant 2500 ms, empilement `refresh`.
- Références auteur conservées : `pack:capture:icon-skill-malediction-feline-01`, `pack:capture:sprite-shadow-spell-cast-01`, `pack:capture:sprite-ash-smoke-projectile-01`, `pack:capture:sprite-shadow-spell-impact-01`. Elles existent dans le catalogue média `global-assets` déjà propriétaire des ressources ; aucun média nouveau n'a été ajouté.
- Anomalie de texte préexistante : la description dit « Disponible au niveau 16 » alors que `draft.requiredLevel=15`. Cette discordance est fidèlement conservée ; aucune correction automatique non demandée.

## Raccord et contrôles
- Deux copies byte-exact : archive `data/capture/source-exports/gensrpg-capture-skill-cap_shadow_atk_4-2026-10-18.json` et preset actif `data/capture/showcase/cap_shadow_atk_4.capture-skill-transfer-v1.json`.
- Insertion une fois dans `src/catalogs/capture-showcase-skill-presets-v1.js`. Les fiches actives restent possédées par `configuredSkills`, remplacement par ID stable de la définition native lorsque présente. Aucune écriture de loadout.
- Tests sous `tests/unit/capture-impact-spectral-author-2026-10-18.test.mjs` : empreinte, archive, unicité, aller-retour transfert, valeurs gameplay, médias, remplacement réel et préservation de toutes les autres fiches.
- CI complète, checkpoint GREEN et publication GitHub Pages exigés pour conclure le jalon technique. Vérification visuelle smartphone utilisateur séparée.
