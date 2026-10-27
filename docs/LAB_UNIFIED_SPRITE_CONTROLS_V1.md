# Choix et réglages des sprites de capacité — v1

Date : 2026-10-04. Statut : CI et parcours natif desktop vérifiés ; validation utilisateur/smartphone à faire.

## Comportement livré

| Emplacement | Choix d’asset | Lecture | Placement |
| --- | --- | --- | --- |
| Cast | Tous les sprites/FX d’effets utilisables dans l’éditeur | Une fois / boucle / adapté à la préparation | Point de sortie existant, scale 0,25–8, décalage X/Y, devant/derrière par vue de la source |
| Projectile | Catalogue filtré sur les projectiles | Modes existants une fois / boucle / trajet | Réglages existants, trajectoire et contact conservés |
| Impact | Tous les sprites/FX d’effets | Une fois / boucle / adapté à sa durée visuelle | Scale 0,25–8, X/Y, devant/derrière par vue de la cible |
| Aura / zone | Tous les sprites/FX d’effets | Une fois / boucle / adapté à la durée Runtime | Scale global et X/Y, décalages, couches par vue de la source |
| Statut | Tous les sprites/FX d’effets | Une fois / boucle / adapté à la durée Runtime en ms | Scale 0,25–8, opacité, X/Y, couches par vue du porteur |

Les images de créatures et les icônes restent dans leurs sélecteurs propres. Le défaut historique est conservé : cast une fois, zone/statut en boucle ; un impact avec une durée visuelle explicitement réglée garde le mode adapté en absence d’un choix explicite. Les modes déjà sérialisés sont rechargés tels quels.

La lecture unique conserve sa dernière phase jusqu’au retrait de son owner. L’impact dispose d’une durée visuelle optionnelle (0 = automatique) ; cast, zone et statut utilisent leurs owners existants. Les zones rafraîchies conservent le même nœud et étendent la lecture adaptée ; la durée utilise l’expiration réelle depuis la première activation visuelle. Un statut mesuré en actions, sans expiration en ms, utilise la durée native du sprite en mode adapté ; son retrait reste contrôlé par Runtime.

## Architecture et frontières

- Les slots SkillPresentationBinding V1/V2 portent déjà playbackMode, offsetX/Y et layerByView ; ils sont exposés dans les champs UI puis consommés par le lecteur existant.
- Extension optionnelle du sprite de statut V3 : playbackMode, offsetX/Y, layerByView. Les propriétés absentes des anciennes sauvegardes restent absentes. Aucun champ de présentation ajouté à StatusEffectV1.
- Traduction des champs extraite dans `src/ui/capture-editor-sprite-controls-v1.js`, sans nouvel état autoritaire.
- `applySpriteVisual` reste le lecteur unique des frames PNG et des atlas WebP. Son réglage de durée adapte une animation existante, sans nouvelle horloge.
- Cast/zone : vue de la source ; impact : vue de la cible ; statut : vue du porteur. La correspondance des acteurs 2v2 utilise le résolveur sémantique existant. Les callbacks du preview transmettent ce contexte.
- Gameplay, loadouts, timings de déplacement, dégâts, collisions, sockets de créatures, profils, ombres et médias : aucune modification de données.

## Validation reproductible

- Base : `13275bc757fd32e8924b8b1d16c32dcf5b5eccd0`.
- Départ : `checkpoint/lab-start-unified-sprite-controls-v1-2026-10-04`.
- Branche : `work/lab-unified-sprite-controls-v1-2026-10-04`.
- RED corrigé et valide : `714b0362b97b612d6daec5c3c8d6409368dfcedf`, CI run 37180458641 / job 111371814256 : anciens 948 tests verts, 17 nouveaux RED. Un RED supplémentaire vérifie la vue cible de l’impact avant la correction.
- Code : `55c84f662bdeb491ba110589ae675a019b43102e`, correction de vue cible `c97d72150a375c812b5ff9cf883f3e7ad98502ae`.
- État testé/export renforcé : `d8a1105604e00032573c9ace63f0f4c8cfb5368c` ; `npm run ci`, gardes de structure et indépendance OK, **966/966**, aucun ignoré/annulé, run 37181129573 / job 111373772904.
- Les 18 régressions ciblent les filtres, les choix croisés, les modes, le round-trip par les véritables export/import JSON Capture, les durées, les refresh/renforcements sans nœuds supplémentaires, le nettoyage et les vues.
- Preview finale ouverte et vérifiée : https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/d8a1105604e00032573c9ace63f0f4c8cfb5368c/examples/dom-demo/capture-editor-v2.html

Parcours desktop réellement observé : sélection Aura de soins en cast, mode boucle, scale 2, offsets +50/-20 ; sauvegarde, sélection d’une autre capacité puis rechargement conservant les valeurs. Combat natif : vrai atlas healing_aura, période 720 ms, boucle pendant la préparation. Charge Eau choisie en impact : atlas à période 480 ms, boucle pendant les 1200 ms visuels choisis. Dans la version finale, l’impact sur opponent-1 suit sa vue ennemie « devant », malgré la vue joueur réglée « derrière ».

Statut de test local : Charge Eau en sprite de statut, lecture unique 480 ms, offsets +30/-15, derrière opponent-1 (z-index -1), HUD de statut présent. Les contrôles sont générés et rechargés dans la vraie ligne d’effet. Aucun preset de dépôt modifié par ce scénario.

Export bouton : l’UI affiche « Export capacité prêt : gensrpg-capture-skill-fireball.json ». Le navigateur d’automatisation n’a pas émis l’événement de téléchargement après deux tentatives ; les octets du téléchargement GUI et un import GUI ne sont donc pas déclarés vérifiés. Le véritable contrat export/import est vérifié par les tests de round-trip de chacun des trois modes, y compris les sprites de statut. Aucun correctif du gestionnaire de téléchargement historique hors périmètre.

Preuve visuelle : capture de l’éditeur final, aura choisie en cast et nouveaux réglages visibles. L’état de démonstration est local à l’onglet ; le lien public démarre avec le preset habituel, et les nouveaux choix sont disponibles dans Capacités → Effets visuels.

## Catalogue et branches protégées

**Aucun asset ni fichier média ajouté/remplacé.** Les vrais médias du précédent lot sont réutilisés depuis `global-assets`, HEAD inchangé `0217dca50ec4004d5ac3bb25d6f5998ccf9edc4f`. Main reste `3197388f2b3ee7491be6e6125a015315158cffa2`. Autres branches et PR, Zombicide-40k : aucune mutation. Aucun GREEN utilisateur, aucune fusion main.
