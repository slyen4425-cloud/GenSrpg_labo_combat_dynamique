# Import des réglages auteur — 2026-10-23, lot données

## Source et intention
- Export transmis : `gensrpg-capture-database-v1(1)(1).json` (capture-database-v1, 104 créatures, 123 capacités).
- Source Github initiale : `gh-pages@6e6cc09d8bdb92538fff030f909982aa642b60e7`.
- Diff de cet export par rapport à la base auteur précédente : Ailevent, Venombre et Morsure venimeuse sont les changements de gameplay/presentation utiles. Les réglages anti-air Tornade et Arc sont déjà sur Github ; pas de retour en arrière. Deux propriétés à zéro de Boule de feu sont des valeurs d'export non voulues par l'auteur.

## Entrées ciblées
- `crea_ailevent` : uniquement `viewOverrides.opponent.displayScale = 0.9`, `position.y = 35`, emplacements `slot-4 = cap_air_atk_4` et `slot-ultimate = cap_air_atk_7` depuis le nouveau fichier ; les anciennes statistiques et réglages inchangés sont conservés.
- `crea_tox_2` : nouvelle présentation Venombre, id natif, visuels officiels face/dos/icône, statistiques et loadout source. L'export contient `profileId=quadruped` tandis que le retour explicite de l'auteur dans cette demande confirme `biped`. Le preset **actif** est donc corrigé en `biped`, sans falsifier l'observation de l'export.
- `cap_poison_atk_2` : Morsure venimeuse : énergie 3, préparation 700 ms, trajet 800 ms, cooldown 15 s, dommages poison 15, marqueur poison pendant 25 s avec dégâts périodiques 5 toutes les 5 s.
- Enregistrement dans les **deux catalogues Showcase existants** (une seule entrée par identifiant, aucune source d'autorité secondaire) ; pas de code moteur dans ce lot.

## Diagnostic ombres — travail distinct
Le profil `quadruped` du fichier exporté n'est PAS classé comme volant par le code de projection : `src/ui/demo-app.js` déduit `flying` de `profile.locomotion.style === "flight"` ou `actor.profile === "flying"`. L'impression de flottement n'est donc pas expliquée par un flag `flying` pour Venombre. La projection des silhouettes et le point d'appui déduit des pixels de la texture, ainsi que les offsets du joueur (notamment le +40 px auteur), requièrent un lot de diagnostic dédié, portant sur **toutes** les créatures et aucune exception de nom.

## Validations
- Test source `tests/unit/capture-author-evening-export-2026-10-23.test.mjs` : IDs, Ailevent, Venombre, Morsure venimeuse, non-régression anti-air.
- CI Foundation + 4 browsers avant checkpoint GREEN, revue manifeste et chargement de la bibliothèque dans le navigateur.
- Travail ombres traité dans un lot ultérieur dédié et indépendant, sans masquer ni modifier des données auteur sans consentement.
