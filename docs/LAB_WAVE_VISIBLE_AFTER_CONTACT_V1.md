# Onde sphérique expansive — croissance visible après impact V1

**15 octobre 2026.** Labo Combat autonome. Base `gh-pages@dc668f34eecc392cfc2f00d1ccc68fa8891932b4`. Branche `work/lab-wave-visible-after-contact-2026-10-15`. Checkpoint initial `checkpoint/lab-start-wave-visible-after-contact-2026-10-15`.

## Diagnostic constaté en production

Le réglage `SkillDefinition.expandingWave.endRadiusPct` est le **rayon final de l'onde en pourcentage de la largeur de l'arène**. Le même `DomSkillFxRenderer` construit un shell géométrique animé par WAAPI, contenant le sprite importé (`visual.travel`) ou un anneau CSS provisoire, et emploie `getBoundingClientRect` de **ce même shell** pour les collisions (pas de hitbox fantôme). Exemple à 150 % avec arène de largeur 1000 px : rayon final 1500 px / diamètre visuel final 3000 px ; le centre peut provoquer un recadrage par `arena{overflow:hidden}`.

**Cause de la visibilité trop faible** : quand l'onde atteint une cible proche à un petit rayon, `reportActionContact` donne le résultat natif de combat puis `CombatResolutionPresenter.presentOutcome` appelle immédiatement `cancelProjectileFor(actorSlot)`. Cette annulation supprime le shell WAAPI et son sprite **au moment du contact**, sans laisser l'animation atteindre le rayon final pourtant configuré. Changer 65 % en 150 % augmente la distance maximale potentielle, mais ne garantit aucun grossissement visuellement observable avant le premier contact.

## Correction sans seconde autorité gameplay

`CombatResolutionPresenter.presentOutcome` demande l'option `preserveContactedWave` **uniquement sur le résultat hit**, avec `skillId` source. Le propriétaire unique `DomSkillFxRenderer.cancelProjectileFor` n'accepte cette option que pour une `expandingWave` active, ayant `contactReported===true` et le même skill ID :
- les dégâts, protections, présence, esquive et clash ont **déjà été décidés au premier contact réel**, sans recalcul et sans changement des PV ;
- le capteur RAF est libéré, les références de projectiles observés sont vidées ; les autres capteurs ignorent le shell ainsi marqué `visualOnly` ;
- **le même shell et le même sprite** restent présents, poursuivent leur expansion jusqu'à leur `animation.finished`, puis le cleanup normal retire le nœud. La période post-contact est exclusivement visuelle : aucun deuxième dégât ni collision/clash ne peut partir de ce visuel ;
- projectile direct ordinaire, beam, annulation manuelle, rappel, dispose, KO/clash et miss gardent leur annulation immédiate. Aucune compétence/présentation auteur, arène, asset ou synchronisation logique n'est modifiée.

Cette V1 reste **mono-cible sélectionnée**, et ne prétend pas ajouter des dommages AOE secondaires : poursuivre l'animation après la première touche n'implique pas de nouveaux impacts.

## Validation

Le test `tests/integration/expanding-wave-visible-continuation-v1.test.mjs` vérifie la taille de shell 150 % avec **vrai sprite présent**, la croissance WAAPI d'un bout à l'autre, le chemin réel Combat Runtime → collision → dégâts → Presenter → animation restante, une seule résolution, disparition à la fin de l'animation, annulations de sécurité, et absence d'extension pour les projectiles classiques. Sentinelles existantes expanding-wave, collision d'images opaques, clash et navigateur 1v1/2v2 à conserver. CI 3 jobs sur SHA exact ; GREEN et publication seulement sur preuve, test esthétique réel sur Android séparé.
