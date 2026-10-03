# Presentation Feedback V1 — 2026-10-03

État : correction technique publiée et testée ; validation artistique sur smartphone par Sylvain encore ouverte. Aucun GREEN artistique, aucun merge main.

## Retours et diagnostic

Les notes de `work/lab-production-feedback-notes-2026-10-03` (93c68b08f922c5bcb6827529951a6cd6f3638bb4) sont conservées dans CURRENT_WORK et ROADMAP. Ce lot part du raccord des vrais projectiles 3f3367efe9dae94537e4274cda6441a0d1612649, pas de l’ancienne base de la branche documentaire.

- Projectile eau : l’éditeur imposait once. Huit images × 45 ms = 360 ms, alors que le trajet reste indépendant (650 ms ou davantage). Le renderer possédait déjà stretch et loop.
- Impact : la couche devant la cible existe déjà (z-index 10). Le renderer plafonnait le scale à 4 malgré un champ acceptant 8, multipliait l’alpha illustré par un fade générique et conservait une enveloppe de 420 ms indépendamment de la séquence source.
- Créatures : un scalaire commun écrasait les différences player/opponent lors de certaines conversions de métadonnées. Un paramétrage indépendant devait suivre la même chaîne de présentation.
- Vérification navigateur : le CSS grid neutralisait hidden sur les nouveaux champs optionnels ; la preview du même modèle dans deux camps envoyait des définitions identiques deux fois. Ces deux défauts ont été corrigés dans l’UI existante.

## Commandes dans l’éditeur

| Commande | Comportement |
| --- | --- |
| Animation du projectile → Adapter à la durée du trajet | Répartit les phases sur la durée native de vol, sans raccourcir Vers la cible. |
| Animation du projectile → Boucler pendant le trajet | Répète la séquence native jusqu’au contact ou à l’annulation. |
| Animation du projectile → Lire une fois à la vitesse du sprite | Conserve la lecture native unique, pour les effets qui la nécessitent. |
| Scale impact | Respecte le réglage de présentation ; le plafond silencieux à 4 a été retiré. |
| Durée visuelle de l’impact | 0 utilise la séquence source ; une valeur positive étire sa lecture sur cette durée. |
| Décalages horizontal/vertical de l’impact | Ajustent uniquement le visuel autour du point de cible. |
| Personnaliser la taille et le placement par vue | Offre taille et X/Y indépendants joueur (dos) / adversaire (face), avec héritage de la présentation commune. |

Pour une capacité déjà enregistrée avec once : choisir Adapter ou Boucler, puis **Mettre à jour la capacité existante**. Les anciens modes explicites restent conservés. Les brouillons nouveaux utilisent Adapter. Les presets de données du dépôt n’ont pas été recalés.

Les changements de l’éditeur sont gardés dans la bibliothèque active de sa session. Exporter la créature/la capacité/la base pour conserver les réglages, puis utiliser l’import existant pour les reprendre.

## Propriétaires et limites

SkillPresentationBinding conserve playbackMode et la durée visuelle optionnelle durationMs. CreaturePresentationBindingV2 conserve les valeurs communes et les viewOverrides optionnels. Les adaptateurs projettent ces données ; le renderer consomme la vue active et les durées natives.

Les deux instances d’une preview peuvent référencer une seule définition de créature. L’assemblage UI ne retire que les lignes strictement identiques (créature, loadout, statValues) ; les doublons conflictuels atteignent toujours les gardes canoniques de l’Exporter. Aucune règle métier ne migre dans l’UI.

L’animation d’un impact multi-images conserve son opacity de présentation pendant la séquence ; le fichier porte sa propre transparence. Le comportement de fade des images statiques reste disponible. L’enveloppe suit la séquence réelle, et les dégâts restent appliqués au contact autoritaire.

Rules, Session, Runtime, SkillDefinition, énergie, dégâts, cooldowns, capteurs de collision, sockets, perspective, médias dédiés de la vraie Boule de feu et global-assets n’ont pas été modifiés. Aucun nouveau moteur, resolver, observer, catalogue ou timer global.

## Tests et publication

Base : 913 tests réussis. RED principal : 7d6e5c05fa2bf1beedbbcc1bd5456344f5006f88, run 37155172039 — 913 réussis / 8 échecs attendus.
Le test du modèle partagé a été rendu RED sur le vrai rejet « duplicate creature draft id » au commit 50fdbe34b2f8477897211381bf8760a954608c83 avant correction.
La première version de cette fixture omettait l’arène obligatoire ; elle a été corrigée avant implantation. Aucune garde n’a été affaiblie pour faire passer le test.

Micro-lots :
- projectile : f67b2a551d9627a0a94f0fe1d57d1a81f6a235e9 ;
- impact : 4a9ca09bf589498234e92d50959263b19935beb9 ;
- créatures : 4afc7aa575028c857df8c3247cfe24c2a74d4e1f ;
- visibilité des champs optionnels : fe63caef15c9af6a9ae183e6b6237866152df5d6 ;
- modèle partagé en preview : 82c8dac19656e18e8a85c7412e1b5ebd5b38a4b0.

CI complète GitHub **37157090124**, job 111302586222, au commit 82c8dac19656e18e8a85c7412e1b5ebd5b38a4b0 : **923/923, 0 échec, 0 ignoré**. Tests significatifs : trajets 180/650/2400 ms, modes/rechargement/JSON, impact 800 ms/scale 5,5/offsets/alpha, héritage et validation par vue, vrais Transfer et export natif, partage de définition sans suppression des conflits. Les sentinelles de contact/perspective/retour et de propriété restent vertes.

Branche : `work/lab-presentation-feedback-v1-2026-10-03`.
Checkpoint de départ : `checkpoint/lab-start-presentation-feedback-v1-2026-10-03`, base 3f3367efe9dae94537e4274cda6441a0d1612649.
Checkpoint de clôture technique : `checkpoint/lab-presentation-feedback-v1-ci-2026-10-03`, à résoudre dans les refs GitHub ; ce n’est pas un GREEN artistique.

## Vérifications dans le navigateur

Éditeur ouvert et contrôlé :
https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/82c8dac19656e18e8a85c7412e1b5ebd5b38a4b0/examples/dom-demo/capture-editor-v2.html

Le même Loup volcanique a été sauvegardé avec player 1,2 et position (20,-10), opponent 0,8 et position (-15,8). Changement de sélection puis rechargement : six valeurs conservées. Le combat natif accepte les deux camps avec ce modèle ; les images réelles global-assets ont des dimensions chargées 320 px et les scales DOM sont 1,2 / 0,8 (rendu respectivement environ 332 et 311 px dans cette arène desktop).

Une capacité de test en session utilisant le vrai projectile eau, travelMs=2400 et stretch a été sauvegardée, rechargée puis exécutée : le DOM natif porte animation-duration:2400ms, steps(7), iteration-count:1. Le coreAnchor conserve left:-15,23%, top:8,98% ; le contact est annoncé par le Runtime. Les modifications de ce brouillon de contrôle ne remplacent pas un preset du dépôt.

Fixture projectile native :
https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/82c8dac19656e18e8a85c7412e1b5ebd5b38a4b0/examples/dom-demo/projectile-review.html

Huit atlas prêts, huit animations 2400 ms observées dans les deux sens. Après le sens inversé, les huit résultats sont arrived, activeCount=0. Loop utilise 360 ms et infinite pendant le même vol ; son nettoyage reste celui du renderer.

Fixture impact native :
https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/82c8dac19656e18e8a85c7412e1b5ebd5b38a4b0/examples/dom-demo/impact-review.html

Les cinq impacts ont été joués en taille 5,5 et durée 1600 ms sur fonds sombre et clair : animation-duration:1600ms, opacity:1, z-index:10 vérifiés. La montée en taille native part à 0,6× le scale choisi ; le scale de présentation n’est plus ramené à 4. Ceci prouve le contrat de rendu, pas une validation artistique sur tous les écrans.

Preuve de l’éditeur : GenSrpG_Presentation_Controls_1791065271425.jpg, conservée avec le résultat de conversation. Elle montre le trajet 2400 ms, le projectile eau et le mode Adapter.

## Validation restant ouverte

Sylvain doit apprécier en combat sur son smartphone la lisibilité des impacts, la qualité du cycle projectile et la calibration des vues pour ses créatures. Aucun calibrage arbitraire des presets ni promotion de médias CAST/STATUS. Reprendre depuis les refs et la CI, puis obtenir cette validation avant tout checkpoint GREEN ou intégration main.

Revue finale des surfaces d’édition : les réglages nouveaux par vue s’appliquent à la galerie et au combat. Les images de placement des sockets conservent leur transformation commune antérieure ; aucun offset nouveau de combat n’est injecté dans ce référentiel d’édition. Les coordonnées et le traitement des points ne changent pas.
