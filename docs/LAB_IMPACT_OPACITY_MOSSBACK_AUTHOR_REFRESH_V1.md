# Capture — Moussados et Impact rocheux : remplacement auteur + opacité du sprite d'impact

Date : 10 octobre 2026

## Source et gouvernance
- Exports joints par l'auteur : `gensrpg-capture-creature-crea_mossback.json` et `gensrpg-capture-skill-cap_earth_atk_4(1).json`.
- Chaque export est transféré dans le chemin de preset déjà reconnu par le registre unique ; la comparaison structurée post-Git avec la source jointe a confirmé une **égalité complète des données** pour les deux fichiers (pas de valeur inventée, aucune réécriture de gameplay).
- Base `gh-pages` : `148bb7ff29ae8911cb585c398ca83bc058799d12`. Checkpoint de départ `checkpoint/lab-start-impact-opacity-mossback-author-refresh-2026-10-10`, travail `work/lab-impact-opacity-mossback-author-refresh-2026-10-10`.
- Les médias restent dans `global-assets` (`268fa5fb09d09ad9f361792e66814f70a13e3310`), **aucun binaire modifié** dans ce chantier. Trois sons de l'auteur ont été trouvés dans `data/presentation/audio/private-audio-catalog.v1.json`.

## Preset auteur Moussados
- Identité `crea_mossback`, nom `Moussados`, niveau 1 et attributs/résistances intacts.
- `combat.approachTimeModifierPct = 25` selon export.
- SkillIds ajoute `cap_earth_atk_2` et `cap_earth_atk_4`, sans remplacer les autres skills.
- Loadout auteur : slot 1 `cap_earth_atk_2`, slot 2 `lib_earth_guard`, slot 3 `cap_earth_atk_4`, slot 4 vide, slot ultimate vide.
- Son de mouvement : `gensrpg:sound:genrpg-pack2-f75d0d8f`, volume 1.

## Preset auteur Impact rocheux
- Identité stable `cap_earth_atk_4`, présentation V10 `skyfall`, rocher en `travel` `pack:capture:sprite-falling-rock-skyfall-01`, et éruption rocheuse en `impact` `pack:capture:sprite-rock-impact-upward-01`.
- Impact : scale 1, décalage Y −25 px, durée visuelle 750 ms, playback `once`, opacité actuelle 1 (100 %).
- Audio : trajet `gensrpg:sound:tower-6dbf268f` (loop true), impact `gensrpg:sound:genrpg-pack2-a3d02c0f` (loop false).
- Gameplay conservé selon fichier de l'auteur : coût 5, préparation 2500 ms, trajet 1200 ms, cooldown 30000 ms, effet 30 dégâts Terre à tous les ennemis.

## Nouvelle option Opacité impact
- `src/ui/capture-editor-sprite-controls-v1.js` : ajout du rôle `impact` au système d'opacité déjà utilisé par `cast` et `zone` ; mêmes champs numériques `impactOpacityPct` et validation 0..100, défaut 100.
- `examples/dom-demo/capture-editor-v2.html` : champ `Opacité de l’impact (%)` près des contrôles Scale/Animation.
- Contrat `SkillPresentationBindingV10.visual.impact.opacity`, adaptateur de présentation et `DomSkillFxRenderer` réutilisés ; aucune nouvelle autorité ni règle, aucun changement de chronologie du projectile/impact.
- Test unitaire `tests/unit/capture-impact-opacity-ui-v1.test.mjs` : 0/35/100, limites, read/write DOM, save/reload JSON, absence d'altération de SkillDefinition, vrai adaptateur FX et animation de l'impact en renderer. Les sentinelles auteurs existantes ont été actualisées au strict contenu des exports.

## Validation et publication
- Tests RED attendus avant remplacement (ancien loadout, anciens IDs d'assets et contrôle d'opacité absent).
- Première full CI sur contenu des presets + contrôle : `38084482610` **SUCCESS** (foundation, Firestorm navigateur, Creature Library navigateur).
- CI finale avec test d'animation réelle du renderer, documentation, checkpoint GREEN et publication en fast-forward sous lease : à consigner après vérification du dernier SHA.
- Android : contrôle graphique visuel et tactile réel de l'opacité/placement par l'utilisateur reste distinct d'une réussite de CI.
