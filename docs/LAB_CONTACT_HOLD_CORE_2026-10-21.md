# Labo Combat — Sangsue, contact maintenu / Combat Runtime V1
Date : 21 octobre 2026.

## Expression de la mécanique
L'auteur souhaite une approche corps à corps, un stationnement en contact, des effets périodiques configurables (dégâts, soins, drain, statuts…) et un retour à la position d'origine dès réception de dégâts réels. Le déclencheur de sortie n'est PAS une attaque esquivée, un coup immunisé ou totalement absorbé par un bouclier.

## Unicité des autorités
Le Skill Contract transporte uniquement l'option `contactHold` pour une compétence `form: contact` et `approachMode: ground`, avec `tickIntervalMs` (100..60000), `effects` natifs (1..12), `maxDurationMs` (0 = attendre interruption ; sinon jusqu'à 120000). Les effets de type `persistent_zone` et `scheduled_effect` ne peuvent être imbriqués dans le contact maintenu : ils créeraient un second propriétaire temporel.

`CombatRuntime`, qui possède déjà l'horloge, conserve un seul engagement par acteur. Le `damageTakenTotal` canonique distingue les PV réellement perdus des dégâts absorbés. Le runtime bloque une nouvelle action du lanceur, libère le contact à blessure/KO/changement d'acteur/cancel/durée, et notifie les callbacks `onContactHoldStart/Tick/End`. Aucun nouveau timer, aucun calcul de dégâts ici.

`CombatSession.applyContactHoldTickV1` appelle le même `applyImmediateTacticalEffectsV1` natif que les autres compétences. Statuts, dommages, soin, renvoi et effets de vie ont le même propriétaire et les mêmes règles. La compétence paie son coût/cooldown UNE fois au démarrage, jamais à chaque pulsation.

## Limites et lot suivant obligatoire
Ce lot est le **noyau combat**. Il n'est pas encore une mécanique jouable visuellement : le renderer et `CombatResolutionPresenter` retournent actuellement à la base au premier contact. Un deuxième lot, distinct, doit ajouter `pauseActive/returnHeldApproachFor` aux animations déjà propriétaires et brancher `onContactHoldEnd` dans les deux interfaces 1v1/2v2, puis une interface auteur dans l'éditeur. Ne pas présenter la compétence comme disponible dans l'éditeur avant les sentinelles de bout en bout.

## Tests et critères
Tests de contrat : effets et intervalles bornés, ancien skill inchangé, types sans deuxième scheduler exclus. Tests runtime : contact réel démarre le hold, aucune seconde action/énergie, gros ticks sans doublon, dégâts drain/soin natifs, bouclier n'interrompt pas, premier PV perdu interrompt immédiatement, fin durée et dispose libèrent sans fuite. CI cinq jobs avant checkpoint GREEN et publication du noyau opt-in. Le test réel de présentation et l'ergonomie mobile restent à faire.
